import { Stack } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AppColors } from '../../../../constants/appStyles';

export default function SecurityScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundLight }}>
      <Stack.Screen options={{ title: 'Seguranca', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Seguranca LimpeJa</Text>
        <Text style={styles.p}>
          Aqui voce encontrara dicas, garantias e boas praticas para ter um atendimento
          tranquilo e confiavel.
        </Text>
        {/* injete seus textos/sections premium aqui */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: AppColors.textBody, marginBottom: 12 },
  p: { fontSize: 14, lineHeight: 22, color: AppColors.textAuxiliary },
});
