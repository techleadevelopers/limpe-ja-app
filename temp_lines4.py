import pathlib\nlines=pathlib.Path('app/client/explore/[providerId].tsx').read_text(encoding='utf-8').splitlines()\nfor idx in range(660, 720):\n    print(idx+1, lines[idx])
