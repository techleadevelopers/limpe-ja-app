from pathlib import Path
lines=Path('components/provider/dashboard/ProviderOverviewSection.tsx').read_text(encoding='utf-8').splitlines()
for i,line in enumerate(lines[:200],1):
    print(f"{i:04d}: {line}")
