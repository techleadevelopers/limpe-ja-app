import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const sections = [
  {
    title: 'TERMOS DE USO E CONDIÇÕES DE SERVIÇO – LIMPEJA',
    body: `Estes Termos de Uso regem a relação entre a BLUECODER SOFTWARE E DATA LTDA, inscrita no CNPJ sob o protocolo REDESIM SPP2630053160, doravante denominada LIMPEJA, e o CLIENTE usuário da plataforma.`,
  },
  {
    title: 'NATUREZA DOS SERVIÇOS',
    body: `O LIMPEJA é uma plataforma de tecnologia que atua exclusivamente na intermediação de serviços de limpeza, conectando profissionais autônomos (Prestadores) a contratantes (Clientes). O LIMPEJA não é uma empresa de limpeza e não possui vínculo empregatício com os prestadores cadastrados.`,
  },
  {
    title: 'AGENDAMENTO E PAGAMENTO',
    body: `2.1. O pagamento deverá ser realizado exclusivamente através da plataforma (PIX ou Cartão), garantindo a segurança da transação.\n2.2. O valor do serviço é calculado com base nas informações fornecidas pelo Cliente (tamanho do imóvel, tipo de limpeza, etc). Informações incorretas podem gerar ajustes no valor ou cancelamento do serviço.\n2.3. O repasse ao Prestador é feito após a confirmação da conclusão do serviço via aplicativo.`,
  },
  {
    title: 'POLÍTICA DE CANCELAMENTO E REAGENDAMENTO',
    body: `3.1. O Cliente poderá cancelar o serviço sem custos com até 24 horas de antecedência.\n3.2. Cancelamentos realizados com menos de 24 horas de antecedência ou a ausência do Cliente no local combinado (após 30 minutos de espera do prestador) resultarão na cobrança de uma Taxa de Deslocamento/Cancelamento no valor de R$ [Definir valor, ex: 50,00] para compensar o profissional.`,
  },
  {
    title: 'RESPONSABILIDADES DO CLIENTE',
    body: `4.1. O Cliente deve garantir o acesso do Prestador ao local no horário agendado.\n4.2. É responsabilidade do Cliente fornecer os materiais de limpeza e equipamentos necessários, a menos que contratado o kit adicional via plataforma.\n4.3. Objetos de alto valor, dinheiro e joias devem ser guardados em local seguro antes do início do serviço.`,
  },
  {
    title: 'SEGURANÇA E CONDUTA',
    body: `5.1. O LIMPEJA realiza a verificação de documentos e antecedentes dos prestadores, porém recomenda-se que o cliente acompanhe o serviço ou deixe uma pessoa responsável no local.\n5.2. É terminantemente proibida a contratação do Prestador "por fora" da plataforma. Caso ocorra, o Cliente perde qualquer garantia oferecida pelo LIMPEJA e poderá ter sua conta banida.`,
  },
  {
    title: 'DANOS E RECLAMAÇÕES',
    body: `6.1. Em caso de danos materiais, o Cliente deve reportar ao suporte do LIMPEJA em até 24 horas após o término do serviço, enviando fotos e evidências.\n6.2. O LIMPEJA atuará como mediador entre Cliente e Prestador para a resolução de conflitos.`,
  },
  {
    title: 'PRIVACIDADE E DADOS (LGPD)',
    body: `Ao utilizar o LIMPEJA, o Cliente autoriza a coleta e o tratamento de seus dados pessoais (nome, endereço, telefone) estritamente para a finalidade de execução dos serviços contratados, conforme a Lei Geral de Proteção de Dados.`,
  },
  {
    title: 'FORO',
    body: `As partes elegem o Foro da Comarca de Campinas/SP para dirimir quaisquer dúvidas oriundas deste termo.`,
  },
];

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Termos de Uso' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2F46',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3A4554',
  },
});
