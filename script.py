from pathlib import Path
text = Path('app/provider/profile/edit-services.tsx').read_text(encoding='utf-8')
start = text.index('          <Text style={styles.inputLabel}>Tipo de Precifica')
print(text[start:start+300])
