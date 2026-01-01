from pathlib import Path
path = Path('jest.config.js')
for i, line in enumerate(path.read_text(encoding='utf-8').splitlines()):
    print(f"{i+1}: {line}")
