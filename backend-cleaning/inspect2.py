from pathlib import Path
lines = Path('src/compliance/compliance.service.ts').read_text(encoding='utf-8').splitlines()
for idx,line in enumerate(lines,1):
    if idx >= 0370 and idx <= 0440:
        print(f"{idx:04d}: {line}")
