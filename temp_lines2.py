import pathlib
lines = pathlib.Path('app/client/explore/[providerId].tsx').read_text(encoding='utf-8').splitlines()
for idx in range(900, 960):
    print(idx+1, lines[idx])

