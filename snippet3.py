from pathlib import Path
text = Path('components/client/explore/home/RecomendacaoCard.tsx').read_text(encoding='utf-8')
start = text.index('{shouldShowMinHourlyPrice')-80
end = text.index('#', start) if '# ' in text[start:] else start+400
print(text[start:start+400])
