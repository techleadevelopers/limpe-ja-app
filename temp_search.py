from pathlib import Path
text = Path('app/provider/services/[serviceId].tsx').read_text()
idx = text.find('OBSERVA')
print(text[idx-50:idx+50])
