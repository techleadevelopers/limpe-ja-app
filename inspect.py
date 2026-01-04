from pathlib import Path
path = Path('app/client/messages/[chatId].tsx')
text = path.read_text(encoding='utf-8')
start = text.index('      } catch (error: any) {')
snippet = text[start:start+350]
snippet_path = Path('snippet.txt')
snippet_path.write_text(snippet, encoding='utf-8')
