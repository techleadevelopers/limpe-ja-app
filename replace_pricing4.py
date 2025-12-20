from pathlib import Path
path = Path('app/provider/profile/edit-services.tsx')
text = path.read_text(encoding='utf-8')
start = text.index('          <Text style={styles.inputLabel}>Tipo de Precificação</Text>')
end = text.index('\n          {/* Removido: opção m²/Cômodo */}', start)
new = """          <View style={styles.optionSection}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>Tipo de Precificação</Text>
              <Text style={styles.optionSubtitle}>Defina o formato que aparece nos detalhes do serviço.</Text>
            </View>
            <View style={styles.optionChipsRow}>
              <TouchableOpacity
                style={[styles.optionChip, pricingType === PricingType.FIXED_PRICE && styles.optionChipSelected]}
                onPress={() => setPricingType(PricingType.FIXED_PRICE)}
                accessibilityRole=\"button\"
                accessibilityLabel=\"Selecionar Preço Fixo\"
              >
                <Text style={[styles.optionChipText, pricingType === PricingType.FIXED_PRICE && styles.optionChipTextSelected]}>Fixo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionChip, pricingType === PricingType.HOURLY && styles.optionChipSelected]}
                onPress={() => setPricingType(PricingType.HOURLY)}
                accessibilityRole=\"button\"
                accessibilityLabel=\"Selecionar Por Hora\"
              >
                <Text style={[styles.optionChipText, pricingType === PricingType.HOURLY && styles.optionChipTextSelected]}>Por Hora</Text>
              </TouchableOpacity>
            </View>
          </View>
"""
path.write_text(text[:start] + new + text[end:], encoding='utf-8')
