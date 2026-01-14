import pathlib
lines=pathlib.Path('app/client/explore/[providerId].tsx').read_text(encoding='utf-8').splitlines()
start=None
for idx,line in enumerate(lines):
    if 'sectionTitle:' in line:
        start=idx
        break
if start is not None:
    for i in range(start, min(start+40, len(lines))):
        print(i+1, lines[i])

