from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
out = Path('dist/nordhaus-studio-plugin.zip')
out.parent.mkdir(exist_ok=True)
with ZipFile(out, 'w', ZIP_DEFLATED) as archive:
    for file in Path('wordpress/nordhaus-studio').rglob('*'):
        if file.is_file():
            archive.write(file, file.relative_to('wordpress'))
