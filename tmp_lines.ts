from pathlib import Path
path = Path('jest.setup.ts')
lines = path.read_text(encoding='utf-8').splitlines()
for i in range(200, 260):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}")
