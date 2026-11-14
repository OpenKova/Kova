"""App Installer descriptors bind explicit package facts to explicit feed URLs."""
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

import pytest

from scripts.bundles import release_artifacts as artifacts
from tests.scripts.test_release_r2 import r2_server


def test_automatic_updates_are_background_checked_and_pinned_feeds_stay_pinned(tmp_path):
    namespace = '{http://schemas.microsoft.com/appx/appinstaller/2017/2}'
    common = {
        'identity': 'Fixture.App',
        'publisher': 'CN=Fixture',
        'version': '1.2.3.0',
        'self_uri': 'https://example.test/stable.appinstaller',
        'artifact_uri': 'https://example.test/app.msixbundle',
    }

    automatic_path = tmp_path / 'automatic.appinstaller'
    artifacts.write_appinstaller(automatic_path, **common)
    automatic = ET.parse(automatic_path).getroot()
    settings = automatic.find(f'{namespace}UpdateSettings')
    assert settings is not None
    assert settings.find(f'{namespace}AutomaticBackgroundTask') is not None
    assert settings.find(f'{namespace}OnLaunch').attrib == {'HoursBetweenUpdateChecks': '12'}

    pinned_path = tmp_path / 'pinned.appinstaller'
    artifacts.write_appinstaller(pinned_path, **common, update_policy='pinned')
    pinned = ET.parse(pinned_path).getroot()
    assert pinned.find(f'{namespace}UpdateSettings') is None


@pytest.mark.parametrize('variant', ['bundled', 'light'])
def test_canary_publication_verifies_native_identity_and_uploads_bundle_before_pointer(tmp_path, r2_server, variant):
    import zipfile

    tag, version = 'v1.2.4+canary.20260902T000000Z', '1.2.4.1440'
    identity, publisher = f'Fixture.{variant}.Canary', 'CN=Fixture & Team'
    bundle = tmp_path / 'app.msixbundle'
    manifest = ET.Element('Bundle')
    ET.SubElement(manifest, 'Identity', {'Name': identity, 'Publisher': publisher, 'Version': version})
    with zipfile.ZipFile(bundle, 'w') as archive:
        archive.writestr('AppxMetadata/AppxBundleManifest.xml', ET.tostring(manifest))
    base = 'https://releases.example'
    directory = f"releases/win32/{'light/' if variant == 'light' else ''}canary"
    pointer = f'{directory}/canary.appinstaller'
    args = ['publish-appinstaller', '--root', str(tmp_path), '--tag', tag, '--variant', variant,
            '--bundle', str(bundle), '--identity', identity, '--publisher', publisher, '--version', version,
            '--public-base', base]
    artifacts.main(args)
    assert r2_server.store[f'{directory}/{bundle.name}'][0] == bundle.read_bytes()
    descriptor = ET.fromstring(r2_server.store[pointer][0])
    assert descriptor.attrib == {'Uri': f'{base}/{pointer}', 'Version': version}
    assert descriptor.find('{*}MainBundle').attrib == {
        'Name': identity, 'Publisher': publisher, 'Version': version, 'Uri': f'{base}/{directory}/{bundle.name}',
    }
    requests = [(method, path.rsplit('/', 1)[-1]) for method, path, _ in r2_server.requests]
    assert requests.index(('HEAD', bundle.name)) < requests.index(('PUT', 'canary.appinstaller'))
    previous = r2_server.store[pointer]
    for option, bad in [('--identity', 'Wrong'), ('--publisher', 'CN=Wrong'), ('--version', '9.9.9.0'),
                        ('--tag', 'v1.2.4'), ('--tag', 'a' * 40), ('--variant', 'store')]:
        invalid = list(args)
        invalid[invalid.index(option) + 1] = bad
        r2_server.requests.clear()
        with pytest.raises((ValueError, SystemExit)):
            artifacts.main(invalid)
        assert not r2_server.requests
        assert r2_server.store[pointer] == previous

    # Fail a real immutable upload by occupying its name with different bytes.
    r2_server.store[f'{directory}/{bundle.name}'] = (b'other bundle', 'application/msixbundle')
    r2_server.requests.clear()
    with pytest.raises(ValueError, match='checksum mismatch'):
        artifacts.main(args)
    assert not any(method == 'PUT' and path.endswith('canary.appinstaller')
                   for method, path, _ in r2_server.requests)
    assert r2_server.store[pointer] == previous
