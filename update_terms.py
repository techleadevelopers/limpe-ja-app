from pathlib import Path
path = Path('app/provider/profile/index.tsx')
data = path.read_text()
before, rest = data.split('const handleAcceptTerms = async () =,1)
body, after = rest.split('const handleLogout',1)
