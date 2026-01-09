from pathlib import Path
text = Path('app/client/bookings/schedule-service.tsx').read_text().splitlines()
for index,line in enumerate(text, start=1):
    if 1550 <= index <= 1665:
        print(f"{index}: {line}")
