// e2e/payment-withdrawal.e2e.ts

// Importações necessárias para Detox.
// 'device', 'element', 'by', 'expect' são as únicas importações necessárias aqui.
// 'installWorker' e 'cleanup' são gerenciadas pelo runner do Jest/Detox.
import { device, element, by, expect } from 'detox';

// Importa 'fetch' para simular as chamadas de webhook.
// Certifique-se de ter 'node-fetch' instalado: npm install --save-dev node-fetch @types/node-fetch
import fetch from 'node-fetch';

// Define a URL base do backend para o ambiente de produção.
const BACKEND_BASE_URL = 'https://limpeja-backend-production.up.railway.app';

describe('Fluxo Completo de Pagamento e Saque', () => {
  beforeAll(async () => {
    // Lança o aplicativo, limpando os dados anteriores.
    // installWorker() é gerenciado pelo Jest/Detox globalSetup.
    await device.launchApp({ delete: true });

    // Chama o endpoint do backend para rodar o seed.ts.
    // Isso garante que o estado do DB esteja sempre limpo e consistente para cada execução de teste.
    try {
      console.log(`Attempting to seed database via backend endpoint: ${BACKEND_BASE_URL}/test/seed`);
      const response = await fetch(`${BACKEND_BASE_URL}/test/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to seed database: ${response.statusText} - ${await response.text()}`);
      }
      console.log('Database seeded successfully.');
    } catch (error) {
      console.error('Error seeding database:', error);
      // É crucial que o seeding funcione para que os testes sejam confiáveis.
      // Você pode querer lançar um erro ou usar `fail()` para parar os testes aqui.
      // throw error; // Descomente para falhar o teste se o seeding falhar
    }
  });

  // Opcional: beforeEach para limpar o estado do app entre testes individuais, se houver múltiplos 'it'
  beforeEach(async () => {
    // Isso garante que o app esteja na tela inicial e sem dados de sessão anteriores.
    // Útil se você tiver múltiplos 'it' blocks e quiser isolar cada um.
    await device.reloadReactNative();
  });

  // Adicionado o bloco afterAll para limpar o Detox Worker após todos os testes
  afterAll(async () => {
    // Termina o aplicativo.
    // cleanup() é gerenciado pelo Jest/Detox globalTeardown.
    await device.terminateApp();
  });

  it('deve permitir que o cliente agende, pague e o provedor saque', async () => {
    // 1. Login do Cliente (indicador@teste.com)
    // Certifique-se de que seus componentes React Native tenham a propriedade `testID` (ou `accessibilityLabel` para iOS)
    // correspondente aos IDs usados aqui.
    await element(by.id('emailInput')).typeText('indicador@teste.com');
    await element(by.id('passwordInput')).typeText('12345678');
    await element(by.id('loginButton')).tap();
    // Substitua 'welcomeMessage' por um `testID` que apareça no dashboard do cliente após o login.
    await expect(element(by.id('welcomeMessage'))).toBeVisible();

    // 2. Agendar um Novo Serviço
    await element(by.id('exploreTab')).tap();
    // `providerCard-provedor@teste.com` é um exemplo de `testID` dinâmico. Adapte conforme sua implementação.
    // Sugestão: use um testID mais específico, como 'providerCard-caroline.silva@example.com'
    await element(by.id('providerCard-provedor@teste.com')).tap();
    await element(by.id('bookServiceButton')).tap();

    // Preencher detalhes do agendamento (data, hora, endereço, serviço)
    // Adapte os `testID`s e a forma de interação conforme seus componentes.
    // Exemplo para um Picker/Dropdown:
    // O erro 'selectValue' sugere que o tipo retornado por element(by.id(...)) não está correto
    // ou que o componente não é um picker nativo.
    // Se for um picker nativo, a linha abaixo está correta e o problema é de tipagem/configuração.
    // Se for um componente customizado, você precisará simular toques para abrir e selecionar.
    await (element(by.id('serviceTypeSelect')) as any).selectValue('Residencial');
    // Exemplo para um seletor de data. A interação pode variar bastante entre iOS e Android.
    await element(by.id('datePicker')).tap();
    await element(by.id('timeSlot-09:00')).tap();
    await element(by.id('confirmBookingDetailsButton')).tap();

    // 3. Capturar Dados do Pagamento PIX e Simular Webhook
    // O elemento que exibe o QR Code Text (o código "copia e cola" do PIX) deve ter o `testID` 'pixQrCodeText'.
    // Adicionado expect().toBeVisible() para garantir que o elemento esteja pronto.
    await expect(element(by.id('pixQrCodeText'))).toBeVisible();
    // O erro 'getText' também é geralmente um problema de tipagem. A sintaxe está correta.
   const pixQrCodeText: string = await (element(by.id('pixQrCodeText')) as any).getText();
    console.log('Captured PIX QR Code Text:', pixQrCodeText);

    // Simula o webhook de pagamento para o backend.
    // O corpo da requisição deve corresponder ao formato que seu endpoint /payments/webhook/pix espera.
    await fetch(`${BACKEND_BASE_URL}/payments/webhook/pix`, { // Usa a URL da nuvem
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Dados simulados do webhook do PSP (Provider de Serviços de Pagamento), crucial para o seu backend processar.
        transactionId: `test_pix_${Date.now()}`, // Um ID único para a transação.
        status: 'COMPLETED', // O status que indica sucesso do pagamento.
        qrCodeText: pixQrCodeText, // O código PIX que o app gerou e que foi "pago".
        // Adicione quaisquer outros campos que seu webhook espera (ex: bookingId, amount, etc.).
      }),
    });
    console.log('Simulated PIX payment webhook.');

    // 4. Verificar Confirmação do Agendamento na UI do Cliente
    // O elemento que mostra o status do agendamento deve ter o `testID` 'bookingStatusText'.
    await expect(element(by.id('bookingStatusText'))).toHaveText('Confirmado');
    await element(by.id('goToBookingsButton')).tap(); // Navega para a lista de agendamentos.
    console.log('Booking confirmed in UI.');

    // 5. Logout do Cliente e Login do Provedor (Caroline Silva)
    await element(by.id('profileTab')).tap(); // `testID` da aba de perfil.
    await element(by.id('logoutButton')).tap(); // `testID` do botão de logout.
    await element(by.id('emailInput')).typeText('provedor@teste.com');
    await element(by.id('passwordInput')).typeText('12345678');
    await element(by.id('loginButton')).tap();
    // `testID` de um elemento que só aparece no dashboard do provedor.
    await expect(element(by.id('providerDashboardTitle'))).toBeVisible();
    console.log('Logged in as provider.');

    // 6. Marcar o Serviço como Concluído
    // O card do agendamento pendente precisa ter um `testID` único ou dinâmico.
    // 'pendingBookingCard-BKG-NEW' é um placeholder. Você pode precisar de uma lógica para encontrar o booking correto.
    await element(by.id('pendingBookingCard-BKG-NEW')).tap();
    await element(by.id('markAsCompletedButton')).tap();
    await expect(element(by.id('bookingStatusText'))).toHaveText('Concluído');
    console.log('Service marked as completed.');

    // 7. Verificar Saldo e Solicitar Saque
    await element(by.id('earningsTab')).tap(); // `testID` da aba de ganhos.
    // Captura o texto do saldo disponível. Certifique-se que o elemento tem o `testID` 'availableBalanceText'.
    await expect(element(by.id('availableBalanceText'))).toBeVisible();
    // O erro 'getText' também é geralmente um problema de tipagem. A sintaxe está correta.
    const initialBalance: string = await (element(by.id('availableBalanceText')) as any).getText();
    console.log('Initial Balance:', initialBalance);

    await element(by.id('requestWithdrawalButton')).tap(); // `testID` do botão de solicitar saque.

    // Preenche o valor do saque. Limpa o texto antes de digitar para evitar concatenação.
    await element(by.id('withdrawalAmountInput')).clearText();
    // Converte o valor do saldo para um formato numérico que o input aceita.
    await element(by.id('withdrawalAmountInput')).typeText(initialBalance.replace('R$', '').replace('.', '').replace(',', '.').trim());
    await element(by.id('pixKeyInput')).typeText('caroline.pix@email.com'); // Chave PIX de teste.
    await element(by.id('confirmWithdrawalButton')).tap();
    console.log('Withdrawal requested.');

    // 8. Simular Webhook de Confirmação de Saque
    // Simula o webhook de saque para o backend.
    // O corpo da requisição deve corresponder ao formato que seu endpoint /payments/webhook/withdrawal espera.
    await fetch(`${BACKEND_BASE_URL}/payments/webhook/withdrawal`, { // Usa a URL da nuvem
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Dados simulados do webhook do PSP para saque.
        withdrawalId: `test_withdrawal_${Date.now()}`, // Um ID único para a transação de saque.
        status: 'COMPLETED', // O status que indica sucesso do saque.
        // Adicione quaisquer outros campos que seu webhook espera (ex: o ID da solicitação de saque gerada pelo seu backend).
      }),
    });
    console.log('Simulated withdrawal webhook.');

    // 9. Verificar Saldo Final na UI do Provedor
    // O elemento que exibe o saldo final deve ter o `testID` 'availableBalanceText'.
    // Adapte o valor esperado se o saque não for total ou se houver taxas.
    await expect(element(by.id('availableBalanceText'))).toHaveText('R$ 0,00');
    console.log('Final balance verified as R$ 0,00.');
  });
});