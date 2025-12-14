from pathlib import Path
p=Path(r"app/(provider)/profile/index.tsx")
lines=p.read_text(encoding='utf-8').splitlines()
for i,l in enumerate(lines):
    if 'Termos de Serviço' in l:
        insert_idx=i+1
        break
else:
    raise SystemExit('Termos line not found')
block=[
    "          <ListRow",
    "            label={termsAccepted ? 'Termos aceitos' : 'Marcar como lido e concordado'}",
    "            ionIcon={termsAccepted ? 'checkmark-done-outline' : 'alert-circle-outline'}",
    "            onPress={termsAccepted ? undefined : handleAcceptTerms}",
    "            destructive={!termsAccepted}",
    "          />",
]
lines = lines[:insert_idx] + block + lines[insert_idx:]
p.write_text('\n'.join(lines)+"\n", encoding='utf-8')
print('inserted terms acceptance block')