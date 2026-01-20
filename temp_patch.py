# coding: utf-8
from pathlib import Path

path = Path('app/provider/services/[serviceId].tsx')
text = path.read_text()
start_marker = "        <Text style={styles.sectionLabel}>AGENDAMENTO E LOCAL</Text>"
obs_marker = "        {/* SEA‡AfO: OBSERVAA‡A•ES */}"
start = text.index(start_marker)
obs_start = text.index(obs_marker)
new_block = '''        <Text style={styles.sectionLabel}>AGENDAMENTO E LOCAL</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={styles.infoTitle}>Data e Horário</Text>
              <Text style={styles.infoValue}>
                {data?.scheduledDate
                  ? `${formatDate(data.scheduledDate)} às ${data.scheduledTime || '--:--'}`
                  : 'Data não informada'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoItem, { marginTop: 16 }]}> 
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={18} color="#359fe5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Endereço do Trabalho</Text>
              <Text style={styles.infoValue} numberOfLines={3}>
                {data?.address ? (
                  `${data.address.street}, ${data.address.number}${data.address.complement ? ` - ${data.address.complement}` : ''}\n${data.address.neighborhood}, ${data.address.city} - ${data.address.state}`
                ) : (
                  'Endereço disponível após confirmação'
                )}
              </Text>
            </View>
          </View>

          <View style={[styles.infoItem, { marginTop: 16 }]}> 
            <View style={styles.iconCircle}>
              <Ionicons name="briefcase-outline" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Tipo de serviço</Text>
              <Text style={styles.infoValue}>
                {serviceScopeLabel} • {data?.serviceName ?? 'Serviço concluído'}
              </Text>
            </View>
          </View>
        </View>

'''
obs_block = text[obs_start:]
obs_block = obs_block.replace(obs_marker, "        {/* SEÇÃO: OBSERVAÇÕES */}", 1)
path.write_text(text[:start] + new_block + obs_block)
