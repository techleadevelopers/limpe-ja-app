from pathlib import Path
path = Path('app/client/messages/[chatId].tsx')
text = path.read_text(encoding='utf-8')
old_lines = [
