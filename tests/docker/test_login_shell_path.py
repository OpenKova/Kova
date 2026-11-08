"""Login shells in the image keep Kova' own dirs on PATH.

Debian's ``/etc/profile`` resets PATH for every login shell, so without
``/etc/profile.d/kova.sh`` a ``bash -l`` (``docker exec <c> bash -l``, ssh, the
terminal tool's background ``bash -lic``) lost ``/opt/kova/bin`` and bare
``kova`` exited 127 (#56634).
"""
from __future__ import annotations

import subprocess


def test_login_shell_resolves_kova_to_the_image_shim(built_image: str) -> None:
    r = subprocess.run(
        ["docker", "run", "--rm", "-u", "kova", "--entrypoint", "bash", built_image,
         "-lc", 'echo "kova=$(command -v kova)"; echo "path=$PATH"'],
        capture_output=True, text=True, timeout=60, check=False,
    )
    assert r.returncode == 0, r.stderr
    lines = dict(line.split("=", 1) for line in r.stdout.splitlines() if "=" in line)
    assert lines["kova"] == "/opt/kova/bin/kova"
    entries = lines["path"].split(":")
    assert entries.index("/opt/kova/bin") < entries.index("/opt/kova/.venv/bin")
    assert entries.count("/opt/kova/bin") == 1
