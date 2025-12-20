from pathlib import Path
import re
text = Path('app/provider/profile/edit-services.tsx').read_text(encoding='utf-8')
idx = text.index('Tipo de Precificação')
print(repr(text[idx-40:idx+800]))
