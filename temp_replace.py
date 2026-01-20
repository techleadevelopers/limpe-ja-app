from pathlib import Path
path = Path('admin-web/client/src/pages/providers/providers.tsx')
data = path.read_text()
start_marker = '  const searchTermLower = searchTerm.toLowerCase();'
end_marker = '  const handleProviderClick = (provider: Provider) =
start = data.find(start_marker)
if start == -1:
   raise SystemExit('start marker not found')
path = Path('admin-web/client/src/pages/providers/providers.tsx')
