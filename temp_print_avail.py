from pathlib import Path
lines = Path('app/provider/schedule/manage-availability.tsx').read_text(encoding='utf-8').splitlines()
for idx in range(1180, 1245):
    print(f'{idx+1}: {lines[idx]}')
