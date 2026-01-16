from pathlib import Path
path = Path('app/provider/active-booking/[bookingId].tsx')
start=430
end=520
with path.open(encoding='utf-8') as f:
    lines=f.readlines()[start:end]
for idx,line in enumerate(lines, start=start+1):
    print(idx, line.rstrip())
