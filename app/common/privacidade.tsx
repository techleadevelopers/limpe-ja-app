// LimpeJaApp/app/common/privacidade.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { Stack } from 'expo-router';

export default function PrivacidadeScreen() {
  // Animação para o título principal
  const titleAnim = useRef(new Animated.Value(0)).current;
  // Animação para o conteúdo (parágrafos e subtítulos)
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [titleAnim, contentAnim]);

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Política de Privacidade' }} />
      <Animated.Text style={[styles.title, { opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        Política de Privacidade do LimpeJá
      </Animated.Text>
      <Animated.View style={{ opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <Text style={styles.paragraph}>
          Sua privacidade é de extrema importância para o LimpeJá. Esta política detalha como
          coletamos, usamos, armazenamos e protegemos suas informações pessoais ao utilizar
          nosso aplicativo e serviços. Ao acessar ou usar o LimpeJá, você concorda com os termos
          desta Política de Privacidade.
        </Text>

        <Text style={styles.subTitle}>1. Informações que Coletamos</Text>
        <Text style={styles.paragraph}>
          Coletamos informações para operar, fornecer, aprimorar, entender, personalizar,
          oferecer suporte e comercializar nossos serviços. As informações que coletamos
          incluem:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Informações Fornecidas por Você:</Text> Inclui dados de cadastro
            (nome completo, e-mail, telefone, CPF, data de nascimento), informações de endereço
            para o serviço (rua, número, bairro, cidade, estado, CEP), e dados de pagamento
            (não armazenamos diretamente dados sensíveis de cartão, que são processados por gateways
            seguros). Para profissionais, também coletamos dados sobre experiência e especialidades.
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Informações Coletadas Automaticamente:</Text> Dados de uso
            (interações com o app, serviços visualizados), informações do dispositivo (modelo,
            sistema operacional), dados de localização (com sua permissão, para conectar
            com profissionais próximos).
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Informações de Terceiros:</Text> Podemos receber informações de
            parceiros de verificação (para profissionais) e processadores de pagamento.
          </Text>
        </View>

        <Text style={styles.subTitle}>2. Como Usamos Suas Informações</Text>
        <Text style={styles.paragraph}>Suas informações são usadas para:</Text>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            Fornecer, operar e manter nossos serviços (conexão cliente-profissional, agendamento, pagamento).
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            Melhorar, personalizar e expandir nossos serviços.
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            Entender e analisar como você usa nossos serviços.
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            Comunicação direta com você para atualizações de serviço, promoções e suporte.
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            Detectar e prevenir fraudes e proteger a segurança da plataforma.
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            Cumprir obrigações legais e regulatórias.
          </Text>
        </View>

        <Text style={styles.subTitle}>3. Como Suas Informações São Compartilhadas</Text>
        <Text style={styles.paragraph}>
          Compartilhamos suas informações com terceiros apenas conforme necessário para
          operar e aprimorar nossos serviços, e sempre com a sua segurança em mente:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Com Profissionais e Clientes:</Text> Para viabilizar o serviço,
            compartilhamos informações relevantes (ex: nome do cliente e endereço com o profissional;
            nome do profissional e avaliações com o cliente).
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Prestadores de Serviço:</Text> Terceiros que nos auxiliam em
            operações como processamento de pagamentos, verificação, marketing e análise de dados.
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Conformidade Legal:</Text> Se exigido por lei ou para proteger
            nossos direitos, propriedade e segurança.
          </Text>
        </View>

        <Text style={styles.subTitle}>4. Segurança dos Dados</Text>
        <Text style={styles.paragraph}>
          A segurança dos seus dados é a nossa prioridade máxima. Implementamos diversas
          medidas de segurança para proteger suas informações contra acesso, uso, alteração ou
          destruição não autorizados. Nossas práticas incluem:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Criptografia de Dados:</Text> Proteção de todas as informações
            pessoais e financeiras através de criptografia de ponta a ponta.
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Autenticação Segura:</Text> Implementação de múltiplos fatores
            de autenticação para garantir que apenas usuários autorizados acessem suas contas.
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Conformidade com a LGPD:</Text> Adesão rigorosa às leis de
            proteção de dados, como a Lei Geral de Proteção de Dados (LGPD) no Brasil, garantindo
            a privacidade e o manuseio responsável das informações.
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Monitoramento Contínuo:</Text> Sistemas de segurança 24/7 para
            detectar e responder rapidamente a quaisquer ameaças.
          </Text>
        </View>
        <View style={styles.list}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Processamento de Pagamentos Confiável:</Text> Parceria com
            provedores de pagamento certificados para garantir a integridade e segurança das transações.
          </Text>
        </View>

        <Text style={styles.subTitle}>5. Seus Direitos</Text>
        <Text style={styles.paragraph}>
          De acordo com a LGPD, você tem o direito de acessar, corrigir, excluir ou limitar o uso
          de suas informações pessoais. Para exercer esses direitos ou se tiver dúvidas sobre esta
          Política de Privacidade, entre em contato conosco através dos canais de suporte no aplicativo.
        </Text>

        <Text style={styles.subTitle}>6. Alterações a Esta Política</Text>
        <Text style={styles.paragraph}>
          Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre
          quaisquer alterações publicando a nova Política de Privacidade nesta página e atualizando
          a data da &quot;Última atualização&quot; no topo da página.
        </Text>

        <Text style={styles.finalNote}>
          Última atualização: 05 de Junho de 2025.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#1C3A5F' },
  subTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 25, marginBottom: 10, color: '#343A40' },
  paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 10, textAlign: 'justify', color: '#495057' },
  boldText: { fontWeight: 'bold' }, // Estilo para texto em negrito
  list: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5, paddingLeft: 10 }, // Estilo para item de lista
  listBullet: { fontSize: 15, color: '#495057', marginRight: 5 }, // Estilo para o bullet point
  finalNote: { fontSize: 13, color: '#6C757D', marginTop: 30, textAlign: 'center', fontStyle: 'italic' },
});
