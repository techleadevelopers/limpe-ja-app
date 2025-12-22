from pathlib import Path
lines=Path('components/client/explore/home/RecomendacaoCard.tsx').read_text(encoding='utf-8').splitlines()
for i,line in enumerate(lines,1):
    print(f"{i:04d}: {line}")
