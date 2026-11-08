import subprocess, pathlib

RENAMES = [
    ('/api/hermes/update', '/api/kova/update'),
    ("persistentAtom('hermes.", "persistentAtom('kova."),
    ('"hermes.desktop.', '"kova.desktop.'),
    ("'hermes.desktop.", "'kova.desktop."),
    ("'hermes.connectors.", "'kova.connectors."),
    ('"hermes.connectors.', '"kova.connectors.'),
    ("'hermes.connectors.identity", "'kova.connectors.identity"),
    ('hermesConfigCacheWriter', 'kovaConfigCacheWriter'),
    ('hermesConfigCacheReader', 'kovaConfigCacheReader'),
    ('HermesConfigCacheWriter', 'KovaConfigCacheWriter'),
]

out = subprocess.run(['git', 'ls-files'], capture_output=True, text=True).stdout.splitlines()
changed = 0
for p in out:
    if pathlib.PurePosixPath(p).suffix not in ('.py', '.ts', '.tsx', '.mjs', '.cjs', '.js', '.jsx', '.json'):
        continue
    if 'egg-info' in p or p in ('uv.lock', 'pnpm-lock.yaml', 'package-lock.json'):
        continue
    f = pathlib.Path(p)
    try:
        t = f.read_text(encoding='utf-8')
    except Exception:
        continue
    orig = t
    for old, new in RENAMES:
        t = t.replace(old, new)
    if t != orig:
        f.write_text(t, encoding='utf-8')
        changed += 1
print('files changed:', changed)
