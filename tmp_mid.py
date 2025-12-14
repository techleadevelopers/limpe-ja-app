from pathlib import Path
text=Path(r"app/(provider)/schedule/manage-availability.tsx").read_text(encoding="utf-8")
for i,l in enumerate(text.splitlines(),1):
    if 780<=i<=1040:
        print(f"{i:04d} {l}")
