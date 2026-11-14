"""Package committed source + the verified static demo; never include local credentials."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'release' / 'nordhaus-studio.zip'
output.parent.mkdir(parents=True, exist_ok=True)
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
files = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0')
with ZipFile(output, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for name in files:
        if not name:
            continue
        path = root / name
        if path.is_file():
            assert path.name != '.env' and 'node_modules' not in path.parts
            archive.write(path, 'nordhaus-studio/' + name)
    for path in sorted((root / 'dist').rglob('*')):
        if path.is_file() and 'downloads' not in path.relative_to(root / 'dist').parts:
            archive.write(path, 'nordhaus-studio/demo/' + str(path.relative_to(root / 'dist')))
    archive.writestr('nordhaus-studio/DELIVERY.json', json.dumps({'source_commit': commit, 'source': 'Git-tracked files only; no .env, tokens, node_modules or .git', 'demo_directory': 'demo', 'run_demo': 'python -m http.server 4173 --directory demo', 'verification': 'reports/VERIFICATION.md'}, indent=2))
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert 'nordhaus-studio/.env' not in archive.namelist()
    assert 'nordhaus-studio/demo/index.html' in archive.namelist()
checksum = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix('.sha256').write_text(f'{checksum}  {output.name}\n')
print(json.dumps({'path': str(output), 'bytes': output.stat().st_size, 'sha256': checksum, 'source_commit': commit}))
