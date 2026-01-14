import pathlib
lines = pathlib.Path('styles/providerStyles.ts').read_text(encoding='utf-8').splitlines()
for idx,line in enumerate(lines):
    if 'newProviderBadgeContainer' in line:
        for j in range(idx, idx+30):
            print(j+1, lines[j])
        break

