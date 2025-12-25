# Manual Checklist — POST-BOOKING Experience (P0/P1)

1. **Cliente (PIX pendente → confirmado)**
   - Escolho um agendamento com pagamento em PIX e confirmo que o QR exibido em `SuccessPixInfo` permanece o mesmo enquanto o status está `PENDING`, com o texto “Aguardando confirmação” acima do card.
   - Simulo a confirmação do webhook (ou uso ambiente controlado) para fazer o `PaymentIntent` entrar em `PAID`; a tela deve substituir o status pendente pelo `PaymentConfirmationCard` e o botão “Ver detalhes” volta para a lista de reservas.
   - Confirmo que o QR mostrado continua sendo o do `PaymentIntent` atual, sem recriar cobranças automaticamente.
   - Verifico que a notificação persistente `PAYMENT_CONFIRMED` aparece em `/client/notifications` com dados do prestador, data e valor, oferece CTA “Ver agendamento” e também dispara o banner em Meus Agendamentos até o usuário tocar (ou passar mais de 24h).

2. **Provider (dashboard + ganhos)**
   - Ao receber uma notificação/push com `kind = booking_confirmed` ou `kind = payment_confirmed`, verifico que o dashboard refaz o `fetchData` automaticamente (Novas Solicitações, Próximos Serviços e resumo de ganhos) sem precisar de pull-to-refresh.
   - Confirmo que o badge “Novo” aparece nos cabeçalhos de “Novas Solicitações” e “Próximos Serviços” por 10 minutos ou até que eu abra a seção, e que um toast “Novo serviço confirmado” é exibido (com no mínimo 30 segundos entre toasts) para sinalizar as atualizações.
   - No painel de ganhos, o card principal destaca “Saldo liberado” com `availableForWithdrawal`, “Saldo pendente” separado e o botão “Solicitar Saque” só habilita quando há saldo liberado.
   - Ao navegar para a tela de saques, o valor inicial sugerido vem de `availableForWithdrawal`.

3. **Observações adicionais**
   - Os testes unitários (`backend-cleaning/src/payments/payments.service.spec.ts` e `backend-cleaning/src/earnings/earnings.service.spec.ts`) garantem que a confirmação do PIX é idempotente e que o saldo exibido ao provedor respeita `availableForWithdrawal`.
