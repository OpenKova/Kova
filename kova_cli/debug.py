"""``kova debug`` debug tools for Kova Agent."""

import contextlib
import datetime
import gzip
import io
import json
import logging
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace
from typing import Optional

from kova_cli.debug_redaction import redact_debug_support_text

logger = logging.getLogger(__name__)

# Prepended to upload-bound content when redaction is enabled so paste reviewers know.
_REDACTION_BANNER = (
    "[kova debug share: log content redacted at upload time. "
    "run with --no-redact to disable]\n")
_PASTE_RS_URL = "https://paste.rs/"  # retained only to delete links made by older Kova versions
_USER_AGENT = "kova-agent/debug-share"
_MAX_LOG_BYTES = 512_000  # per-log cap keeps support uploads bounded
_KOVA_PRIVACY_NOTICE = """\
This uploads system information and logs to Kova storage after your confirmation.
Logs may contain conversation content, tool outputs, and file paths. Secrets are
redacted before upload. Anyone with the private link can view the bundle; it
expires after 14 days. Use --local to view the report without uploading.
"""

def _extract_paste_id(url: str) -> Optional[str]:
    """Paste ID from a paste.rs URL (dpaste.com pastes have no deletable ID)."""
    url = url.strip().rstrip("/")
    for prefix in ("https://paste.rs/", "http://paste.rs/"):
        if url.startswith(prefix):
            return url[len(prefix):]
    return None


def _is_dpaste_url(url: str) -> bool:
    """Whether *url* is a dpaste.com paste (no unauthenticated delete exists for those)."""
    return url.strip().startswith(("https://dpaste.com/", "http://dpaste.com/"))


def delete_paste(url: str) -> bool:
    """Delete a paste.rs paste (the only service with unauthenticated DELETE). True on success."""
    paste_id = _extract_paste_id(url)
    if not paste_id:
        if _is_dpaste_url(url):
            raise ValueError(
                "Cannot delete: dpaste.com pastes cannot be deleted (anonymous "
                "uploads have no owner token); they expire on their own.  Got: " + url)
        raise ValueError(f"Cannot delete: only paste.rs URLs are supported.  Got: {url}")
    req = urllib.request.Request(f"{_PASTE_RS_URL}{paste_id}", method="DELETE",
                                 headers={"User-Agent": _USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return 200 <= resp.status < 300


@dataclass
class LogSnapshot:
    """Single-read snapshot of a log file used by debug-share."""
    path: Optional[Path]
    tail_text: str
    full_text: Optional[str]


def _primary_log_path(log_name: str) -> Optional[Path]:
    """Where *log_name* would live if present. Doesn't check existence."""
    from kova_cli.logs import log_file_path
    return log_file_path(log_name)  # update/handoff: the ROOT home's, whatever profile is active


# Logs written by a client process, invisible to a remote/docker/SSH backend running `debug
# share`; a bare "(file not found)" would read as "the app logged nothing" and misdirect triage.
_CLIENT_SIDE_LOGS = {
    "desktop": (
        "written by Kova Desktop on the machine running the app, not by this "
        "backend. If the desktop connects to a remote/docker/SSH backend, collect "
        "it on that client machine")}


def _missing_log_note(log_name: str) -> str:
    """Explain a missing log instead of stating a bare absence."""
    reason = _CLIENT_SIDE_LOGS.get(log_name)
    if reason is None:
        return "(file not found)"
    primary = _primary_log_path(log_name)
    return f"(not on this host: {reason}{f' — expected at {primary}' if primary else ''})"


def _resolve_log_path(log_name: str) -> Optional[Path]:
    """First non-empty candidate for *log_name* (primary, then the .1 rotation), or None."""
    primary = _primary_log_path(log_name)
    if primary is None:
        return None
    for candidate in (primary, primary.parent / f"{primary.name}.1"):
        if candidate.exists() and candidate.stat().st_size > 0:
            return candidate
    return None


def _read_tail_bytes(
    log_path: Path, size: int, max_bytes: int, tail_lines: int
) -> tuple[bytes, int, bool]:
    """Return a bounded tail, its file offset, and whether it starts on a line boundary."""
    with open(log_path, "rb") as f:
        if size <= max_bytes:
            return f.read(), 0, True
        chunk_size = 8192
        pos = size
        chunks: list[bytes] = []
        total = 0
        newline_count = 0
        while (pos > 0 and total < max_bytes * 2
               and (total < max_bytes or newline_count <= tail_lines + 1)):
            read_size = min(chunk_size, pos)
            pos -= read_size
            f.seek(pos)
            chunk = f.read(read_size)
            chunks.insert(0, chunk)
            total += len(chunk)
            newline_count += chunk.count(b"\n")
            chunk_size = min(chunk_size * 2, 65536)
        starts_on_boundary = True
        if pos > 0:
            f.seek(pos - 1)
            starts_on_boundary = f.read(1) == b"\n"
        return b"".join(chunks), pos, starts_on_boundary


def _truncate_complete_lines(text: str, max_bytes: int) -> tuple[str, bool]:
    """Keep at most the last ``max_bytes`` without publishing a partial first line."""
    raw = text.encode("utf-8")
    if len(raw) <= max_bytes:
        return text, False
    cut = len(raw) - max_bytes
    on_boundary = raw[cut - 1:cut] == b"\n"
    kept = raw[cut:]
    if not on_boundary:
        kept = kept.split(b"\n", 1)[1] if b"\n" in kept else b""
    return kept.decode("utf-8", errors="replace"), True


def _capture_log_snapshot(
    log_name: str, *, tail_lines: int, max_bytes: int = _MAX_LOG_BYTES, redact: bool = True,
) -> LogSnapshot:
    """Capture a log once and derive the summary tail and full-log views from that single read
    (a rotation between two reads would make the report look newer than the uploaded log)."""
    log_path = _resolve_log_path(log_name)
    if log_path is None:
        primary = _primary_log_path(log_name)
        tail = "(file empty)" if primary and primary.exists() else _missing_log_note(log_name)
        return LogSnapshot(path=None, tail_text=tail, full_text=None)

    try:
        size = log_path.stat().st_size
        if size == 0:  # truncated between _resolve_log_path and stat
            return LogSnapshot(path=log_path, tail_text="(file empty)", full_text=None)
        raw, start_offset, starts_on_boundary = _read_tail_bytes(
            log_path, size, max_bytes, tail_lines
        )
        all_text = raw.decode("utf-8", errors="replace")
        if redact:
            # The support scrub needs the complete logical field before either
            # the summary-line cap or full-log byte cap can remove its key.
            all_text = redact_debug_support_text(all_text)
        if start_offset and not starts_on_boundary:
            all_text = all_text.split("\n", 1)[1] if "\n" in all_text else ""
        tail_text = "".join(all_text.splitlines(keepends=True)[-tail_lines:]).rstrip("\n")
        full_text, capped = _truncate_complete_lines(all_text, max_bytes)
        truncated = capped or size > max_bytes
        if truncated:
            full_text = f"[... truncated — showing last ~{max_bytes // 1024}KB ...]\n{full_text}"
        return LogSnapshot(path=log_path, tail_text=tail_text, full_text=full_text)
    except Exception as exc:
        error = redact_debug_support_text(exc)
        return LogSnapshot(path=log_path, tail_text=f"(error reading: {error})", full_text=None)


# Logs the debug report tails, in output order. ``agent`` gets the full ``--lines`` budget;
# the rest are capped at 100 lines. Every log but ``errors`` is also uploaded in full.
_REPORT_LOGS = ("agent", "errors", "gateway", "gui", "desktop", "update", "handoff")
_FULL_LOGS = ("agent", "gateway", "gui", "desktop", "update", "handoff")


def _tail_budget(name: str, log_lines: int) -> int:
    return log_lines if name == "agent" else min(log_lines, 100)


def _capture_default_log_snapshots(
    log_lines: int, *, redact: bool = True) -> dict[str, LogSnapshot]:
    """Capture all logs used by debug-share exactly once."""
    return {
        name: _capture_log_snapshot(name, tail_lines=_tail_budget(name, log_lines), redact=redact)
        for name in _REPORT_LOGS}


def _capture_dump(redact: bool = True) -> str:
    """Run ``kova dump`` and return its stdout, force-redacted unless *redact* is False: the dump
    is upload-bound and quotes config values (e.g. ``fallback_providers``), so URL credentials are
    redacted too, as in the uploaded logs."""
    from kova_cli.dump import run_dump
    capture = io.StringIO()
    with contextlib.redirect_stdout(capture), contextlib.suppress(SystemExit):
        run_dump(SimpleNamespace(show_keys=False))
    text = capture.getvalue()
    return redact_debug_support_text(text) if redact else text


def collect_debug_report(
    *, log_lines: int = 200, dump_text: str = "",
    log_snapshots: Optional[dict[str, LogSnapshot]] = None) -> str:
    """Build the summary debug report (system dump + log tails) as upload-ready text.

    ``dump_text`` is pre-captured dump output; when empty, ``kova dump`` is run internally.
    """
    buf = io.StringIO()
    buf.write(dump_text or _capture_dump())
    if log_snapshots is None:
        log_snapshots = _capture_default_log_snapshots(log_lines)
    # In-process sanitiser heal counters: populated only inside a process that ran agent turns
    # (gateway /debug share); a fresh CLI's errors.log tail carries the same escalation lines.
    with contextlib.suppress(Exception):
        # See #96870.
        from agent.agent_runtime_helpers import get_sanitizer_heal_stats
        heal_stats = get_sanitizer_heal_stats()
        if heal_stats:
            buf.write("\n\n--- transcript sanitiser heal counters ---\n")
            for sess, st in sorted(heal_stats.items()):
                buf.write(f"session {sess}: {st['heal_events']} heal events, "
                          f"{st['messages_healed']} messages healed, escalated={st['escalated']}\n")
    buf.write("\n")
    from kova_cli.logs import LOG_FILES
    for name in _REPORT_LOGS:
        snap = log_snapshots.get(name)
        if snap is None:
            continue
        filename = LOG_FILES.get(name, f"{name}.log")
        buf.write(f"\n--- {filename} (last {_tail_budget(name, log_lines)} lines) ---\n"
                  f"{snap.tail_text}\n")
    return buf.getvalue()


# Versioned support bundle envelope stored by Kova.
_KOVA_BUNDLE_FORMAT = "kova-debug-share/1"


def collect_share_bundle(log_lines: int = 200, redact: bool = True) -> dict[str, str]:
    """Collect the debug report + full logs as a label→text mapping.

    The dump header is prepended to each full log so every file is self-contained, and the
    redaction banner is prepended when ``redact`` is True.
    """
    dump_text = _capture_dump(redact=redact)
    log_snapshots = _capture_default_log_snapshots(log_lines, redact=redact)
    report = collect_debug_report(log_lines=log_lines, dump_text=dump_text,
                                  log_snapshots=log_snapshots)
    banner = _REDACTION_BANNER if redact else ""
    bundle: dict[str, str] = {"report": banner + report}
    from kova_cli.logs import LOG_FILES
    for name in _FULL_LOGS:
        if full := log_snapshots[name].full_text:
            filename = LOG_FILES.get(name, f"{name}.log")
            bundle[filename] = banner + dump_text + f"\n\n--- full {filename} ---\n" + full
    return bundle


def build_kova_bundle(bundle: dict[str, str], redact: bool = True) -> bytes:
    """Gzip a :func:`collect_share_bundle` mapping into Kova's support bundle envelope."""
    envelope = {"format": _KOVA_BUNDLE_FORMAT, "redacted": bool(redact),
                "created": datetime.datetime.now(datetime.UTC).isoformat(),
                "files": bundle}
    return gzip.compress(json.dumps(envelope).encode("utf-8"))


@dataclass
class DebugShareResult:
    """Outcome of a ``debug share`` upload, so non-CLI callers can render real links."""
    urls: dict  # label -> paste URL (e.g. {"Report": "...", "agent.log": "..."})
    failures: list  # human-readable "label: error" strings for optional uploads
    redacted: bool  # whether force-mode redaction was applied before upload
    auto_delete_seconds: int  # Kova diagnostics retention, retained for dashboard compatibility
    report: str = ""  # the summary report text (kept for local fallback)


def build_debug_share(
        *, log_lines: int = 200, redact: bool = True) -> DebugShareResult:
    """Collect a redacted support bundle and upload it to Kova private storage.

    Shared by ``kova debug share`` and the dashboard ``POST /api/ops/debug-share``.
    Blocking network I/O — callers inside an event loop must run it in a worker thread.
    """
    bundle = collect_share_bundle(log_lines=log_lines, redact=redact)
    if redact:
        logger.info(
            "kova debug share: applied force-mode redaction to log snapshots before upload")
    report = bundle["report"]
    from kova_cli.diagnostics_upload import share_to_kova

    result = share_to_kova(build_kova_bundle(bundle, redact=redact))
    view_url = result.get("view_url")
    if not isinstance(view_url, str):
        raise RuntimeError("Kova diagnostics storage did not return a private link.")
    return DebugShareResult(
        urls={"Kova diagnostics": view_url},
        failures=[],
        redacted=redact,
        auto_delete_seconds=14 * 24 * 60 * 60,
        report=report,
    )


def _confirm_upload(args) -> bool:
    """Gate the actual upload: ``--yes`` proceeds unprompted, else ask an interactive [y/N]."""
    if bool(getattr(args, "yes", False)):
        return True
    if not sys.stdin.isatty():
        print("ERROR: Non-interactive mode requires --yes to confirm upload.\n"
              "       This prevents accidental exposure of personal data.\n"
              "       Use --local to view the report without uploading.", file=sys.stderr)
        sys.exit(1)
    try:
        answer = input("Upload debug report? [y/N] ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        answer = ""
    if answer in ("y", "yes"):
        return True
    print("Aborted.")
    return False


def run_debug_share(args):
    """Collect a redacted bundle and upload it to Kova private storage."""
    log_lines = getattr(args, "lines", 200)
    redact = not getattr(args, "no_redact", False)

    if getattr(args, "local", False):
        # Same collector as the upload path so the output matches exactly; no network I/O.
        print("Collecting debug report...")
        bundle = collect_share_bundle(log_lines=log_lines, redact=redact)
        print(bundle["report"])
        for title, label in (
            ("FULL agent.log", "agent.log"),
            ("FULL gateway.log", "gateway.log"),
            ("FULL gui.log", "gui.log"),
            ("FULL desktop.log", "desktop.log"),
            ("FULL update.log", "update.log"),
            ("FULL desktop-update-handoff.log", "desktop-update-handoff.log"),
        ):
            body = bundle.get(label)
            if body:
                print(f"\n\n{'=' * 60}")
                print(title)
                print(f"{'=' * 60}\n")
                print(body)
        return

    print(_KOVA_PRIVACY_NOTICE)
    if not _confirm_upload(args):
        return
    print("Collecting debug report...\nUploading to Kova...")
    try:
        result = build_debug_share(log_lines=log_lines, redact=redact)
    except RuntimeError as exc:
        print(f"\nUpload failed: {redact_debug_support_text(exc)}", file=sys.stderr)
        print("\nRun `kova debug share --local` to print the report instead.\n")
        sys.exit(1)
    print("\nDebug bundle uploaded to Kova:")
    for label, url in result.urls.items():
        print(f"  {label}  {url}")
    if result.failures:
        print(f"\n  (failed to upload: {', '.join(result.failures)})")
    print("\n⏱  This private link expires in 14 days. Share it with Kova support.\n")


def run_debug_delete(args):
    """Delete one or more paste URLs uploaded by /debug."""
    urls = getattr(args, "urls", [])
    if not urls:
        print("Usage: hermes debug delete <url> [<url> ...]\n"
              "  Deletes paste.rs pastes uploaded by 'kova debug share'.")
        return
    for url in urls:
        try:
            if delete_paste(url):
                print(f"  ✓ Deleted: {url}")
            else:
                print(
                    "  ✗ Failed to delete: "
                    f"{redact_debug_support_text(url)} (unexpected response)"
                )
        except ValueError as exc:
            print(f"  ✗ {redact_debug_support_text(exc)}")
        except Exception as exc:
            safe_url = redact_debug_support_text(url)
            print(f"  ✗ Could not delete {safe_url}: {redact_debug_support_text(exc)}")


def run_debug(args):
    """Route debug subcommands."""
    handler = {"share": run_debug_share, "delete": run_debug_delete}.get(
        getattr(args, "debug_command", None))
    if handler is None:
        print(_DEBUG_USAGE)
    else:
        handler(args)


_DEBUG_USAGE = """\
Usage: hermes debug <command>

Commands:
  share    Upload a redacted debug bundle to Kova and print its private link
  delete   Delete a legacy paste.rs upload

Options (share):
  --lines N    Number of log lines to include (default: 200)
  --local      Print report locally instead of uploading
  --no-redact  Disable upload-time secret redaction (default: redact)

Options (delete):
  <url> ...    One or more legacy paste URLs to delete"""
