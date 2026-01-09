from pathlib import Path
path = Path('components/client/explore/home/RecomendacaoCard.tsx')
with path.open(encoding='utf-8') as f:
    for idx,line in enumerate(f,1):
        if 600<=idx<=660:
            print(f"{idx}: {line.rstrip()}")
