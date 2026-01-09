from pathlib import Path
text = Path('app/client/bookings/schedule-service.tsx').read_text().splitlines()
for i in range(1760, 1845):
    print(f"{i+1}: {text[i]}")
