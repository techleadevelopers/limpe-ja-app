// LimpeJaApp/app/common/termos.tsx
import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function TermosScreen() {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Termos de Serviço' }} />
      <Text style={styles.title}>Termos de Serviço do LimpeJá</Text>
      <Text style={styles.paragraph}>
        Bem-vindo(a) ao LimpeJá! Estes Termos de Serviço (&quot;Termos&quot;) regem o uso do aplicativo
        LimpeJá e dos serviços oferecidos através dele. Ao acessar ou usar o LimpeJá, você
        concorda em vincular-se a estes Termos e a todas as políticas aqui incorporadas por referência.
        Se você não concordar com estes Termos, não use o LimpeJá.
      </Text>

      <Text style={styles.subTitle}>1. Aceitação dos Termos</Text>
      <Text style={styles.paragraph}>
        Ao utilizar o aplicativo LimpeJá, você (&quot;Usuário&quot; ou &quot;Você&quot;) expressa seu consentimento
        com estes Termos de Serviço na íntegra. Estes Termos aplicam-se a todos os usuários
        da plataforma, incluindo, sem limitação, clientes e prestadores de serviço.
        Recomendamos que você leia atentamente este documento antes de usar a plataforma.
      </Text>

      <Text style={styles.subTitle}>2. Serviços Oferecidos</Text>
      <Text style={styles.paragraph}>
        O LimpeJá é uma plataforma de marketplace que conecta clientes que buscam serviços
        de limpeza e organização residencial com prestadores de serviços independentes
        (&quot;Profissionais&quot;) qualificados e verificados. Facilitamos o agendamento,
        o pagamento e a comunicação entre as partes, mas não somos empregadores
        dos Profissionais.
      </Text>

      <Text style={styles.subTitle}>3. Registro e Conta de Usuário</Text>
      <Text style={styles.paragraph}>
        Para acessar a maioria dos serviços do LimpeJá, você precisará criar uma conta
        e fornecer informações precisas e completas. É sua responsabilidade manter
        a confidencialidade de sua senha e conta, e você é responsável por todas as
        atividades que ocorram sob sua conta. Reservamo-nos o direito de suspender
        ou encerrar sua conta se as informações fornecidas forem falsas ou incompletas.
      </Text>

      <Text style={styles.subTitle}>4. Verificação de Profissionais e Segurança</Text>
      <Text style={styles.paragraph}>
        A segurança e a confiança são pilares fundamentais do LimpeJá. Todos os
        Profissionais cadastrados em nossa plataforma passam por um rigoroso
        processo de validação de documentos e verificações de segurança para
        minimizar riscos e garantir a tranquilidade dos clientes. Além disso,
        buscamos assegurar a qualidade através de um sistema transparente de avaliação
        e feedback.
      </Text>

      <Text style={styles.subTitle}>5. Agendamento e Cancelamento</Text>
      <Text style={styles.paragraph}>
        O agendamento de serviços é feito diretamente pelo aplicativo, permitindo
        que você escolha o tipo de serviço, data, hora e duração. O
        cancelamento de agendamentos está sujeito à nossa política de cancelamento,
        que pode envolver taxas dependendo da antecedência. Detalhes sobre as taxas
        e prazos de cancelamento podem ser encontrados na seção de Ajuda do aplicativo.
      </Text>

      <Text style={styles.subTitle}>6. Pagamento e Remuneração</Text>
      <Text style={styles.paragraph}>
        Os pagamentos pelos serviços contratados são processados de forma segura
        através da plataforma, utilizando gateways de pagamento confiáveis e
        tecnologia de criptografia de ponta a ponta para proteger seus dados
        financeiros. O LimpeJá retém uma comissão sobre o valor total
        de cada serviço, que varia entre 15% e 25%. A remuneração dos Profissionais
        é transparente e buscamos garantir pagamentos justos e pontuais.
      </Text>

      <Text style={styles.subTitle}>7. Propriedade Intelectual</Text>
      <Text style={styles.paragraph}>
        Todo o conteúdo presente no aplicativo LimpeJá, incluindo textos, gráficos,
        logotipos, ícones, imagens, clipes de áudio, downloads digitais e software,
        é propriedade do LimpeJá ou de seus fornecedores de conteúdo e protegido
        pelas leis de direitos autorais.
      </Text>

      <Text style={styles.subTitle}>8. Conformidade Legal e Trabalhista</Text>
      <Text style={styles.paragraph}>
        O LimpeJá atua em estrita conformidade com a legislação brasileira aplicável,
        incluindo as normativas relativas a serviços sob demanda e, quando pertinente,
        a Lei do Salão Parceiro e a PEC das Domésticas. Os Profissionais cadastrados
        na plataforma atuam como autônomos ou Microempreendedores Individuais (MEI),
        e são responsáveis por suas próprias obrigações fiscais e previdenciárias.
        A plataforma não estabelece vínculo empregatício com os Profissionais.
      </Text>

      <Text style={styles.subTitle}>9. Limitação de Responsabilidade</Text>
      <Text style={styles.paragraph}>
        O LimpeJá se esforça para manter a plataforma disponível e funcional, mas
        não garante que o serviço será ininterrupto ou livre de erros. Não nos
        responsabilizamos por quaisquer danos diretos, indiretos, incidentais ou
        consequenciais decorrentes do uso ou da impossibilidade de usar o aplicativo.
      </Text>

      <Text style={styles.subTitle}>10. Alterações nos Termos</Text>
      <Text style={styles.paragraph}>
        O LimpeJá reserva-se o direito de modificar estes Termos a qualquer momento.
        Notificaremos você sobre quaisquer alterações significativas. O uso contínuo
        do aplicativo após tais modificações constitui sua aceitação dos novos Termos.
      </Text>

      <Text style={styles.subTitle}>11. Lei Aplicável e Foro</Text>
      <Text style={styles.paragraph}>
        Estes Termos serão regidos e interpretados de acordo com as leis da República
        Federativa do Brasil. Quaisquer disputas decorrentes ou relacionadas a estes
        Termos serão submetidas ao foro da comarca de Campinas, Estado de São Paulo.
      </Text>

      <Text style={styles.finalNote}>
        Última atualização: 05 de Junho de 2025.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#1C3A5F' },
  subTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 25, marginBottom: 10, color: '#343A40' },
  paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 10, textAlign: 'justify', color: '#495057' },
  finalNote: { fontSize: 13, color: '#6C757D', marginTop: 30, textAlign: 'center', fontStyle: 'italic' },
});


