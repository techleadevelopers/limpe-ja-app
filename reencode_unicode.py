from pathlib import Path
path = Path(r'app/client/messages/chat.tmp.tsx')
data = path.read_bytes().decode('utf-16')
path.write_text(data, encoding='utf-8')
