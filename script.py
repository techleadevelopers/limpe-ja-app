import pathlib
path=pathlib.Path('backend-cleaning/src/providers/providers.service.ts')
print(path.read_text()[:2000])
