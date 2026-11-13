"""Client for explicitly uploading redacted diagnostic bundles to Kova storage."""

from __future__ import annotations

import json
import urllib.request

from kova_cli.debug_redaction import redact_debug_support_text

KOVA_TELEMETRY_BASE = "https://telemetry.neuralstudio.in"
_UPLOAD_TIMEOUT = 120
_USER_AGENT = "kova-agent/diagnostics-share"


def share_to_kova(report_bundle: bytes) -> dict:
    """Upload one gzip bundle; the service returns an expiring, unguessable view link."""
    request = urllib.request.Request(
        f"{KOVA_TELEMETRY_BASE}/v1/diagnostics",
        data=report_bundle,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/gzip",
            "User-Agent": _USER_AGENT,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=_UPLOAD_TIMEOUT) as response:
            body = response.read(4096).decode("utf-8", "replace")
    except Exception as exc:
        raise RuntimeError(redact_debug_support_text(exc)) from exc
    try:
        result = json.loads(body)
    except json.JSONDecodeError as exc:
        safe_body = redact_debug_support_text(body, max_chars=200)
        raise RuntimeError(f"Kova diagnostics upload returned invalid JSON: {safe_body}") from exc
    if not isinstance(result, dict) or not isinstance(result.get("view_url"), str):
        safe_body = redact_debug_support_text(body, max_chars=200)
        raise RuntimeError(f"Kova diagnostics upload response missing 'view_url': {safe_body}")
    return result
