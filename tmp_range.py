from pathlib import Path
text=Path(r"app/(provider)/schedule/manage-availability.tsx").read_text(encoding="utf-8")
lines=text.splitlines()
start=end=None
for i,l in enumerate(lines):
    if 'setIsSaving(true);' in l and start is None:
        start=i-1
    if start is not None and 'setIsSaving(false);' in l:
        end=i+2
        break
print(start,end)
for j in range(start or 0, end or 0):
    print(f"{j+1:04d} {lines[j]}")
