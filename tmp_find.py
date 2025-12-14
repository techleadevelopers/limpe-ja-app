from pathlib import Path
text=Path(r"app/(provider)/schedule/manage-availability.tsx").read_text(encoding="utf-8")
for i,l in enumerate(text.splitlines(),1):
    if 'DayAvailabilityCard' in l and i>600:
        print(i,l)
