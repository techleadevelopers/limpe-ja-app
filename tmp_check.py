from pathlib import Path
p=Path(r"app/(provider)/profile/index.tsx")
lines=p.read_text(encoding='utf-8').splitlines()
print(lines[264])
print(lines[265])