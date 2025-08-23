📖 Payments Module – README
📌 Visão Geral

O PaymentsModule é responsável por todo o fluxo de pagamentos, recebimentos e retiradas na plataforma. Ele garante que clientes consigam pagar por serviços, provedores recebam seus valores de forma segura, e que todas as transações sejam registradas com rastreabilidade.

Ele funciona como a camada de integração financeira entre o sistema interno e os provedores de pagamento externos (ex.: PIX, gateways bancários).

📂 Estrutura de Arquivos

payments.controller.ts → Define as rotas HTTP para interagir com pagamentos e retiradas.

payments.service.ts → Contém a lógica de negócio dos fluxos financeiros.

payments.module.ts → Declara e organiza os providers relacionados ao módulo.

transaction.entity.ts → Representa a entidade de transação no banco de dados.

create-pix-charge.dto.ts → DTO para iniciar uma cobrança PIX.

request-withdrawal.dto.ts → DTO para solicitação de retirada de valores pelo provedor.

⚙️ Fluxos de Negócio Implementados
1. Criação de cobrança via PIX

O cliente inicia o pagamento de um agendamento.

O backend cria uma transação do tipo PIX_CHARGE.

O sistema integra com o provedor de pagamentos para gerar o QR Code PIX.

A transação é registrada com status PENDING.

Após confirmação do pagamento, o status é atualizado para SUCCESS.

🔹 DTO usado: CreatePixChargeDto
🔹 Transação criada em transaction.entity.ts com os campos:

id, userId, bookingId

type: 'PIX_CHARGE'

status: 'PENDING' | 'SUCCESS' | 'FAILED'

amount, metadata, createdAt, updatedAt

2. Registro e rastreamento de transações

Cada pagamento ou retirada é registrado na tabela Transaction para garantir:

Auditoria completa.

Possibilidade de disputas e estornos.

Relatórios financeiros.

As transações podem ser de tipos:

PIX_CHARGE → cobrança gerada para cliente.

WITHDRAWAL → retirada solicitada pelo provedor.

REFUND → estorno de pagamento.

3. Solicitação de Retirada (Withdrawals)

O provedor de serviços pode solicitar retirada dos valores acumulados.

O backend cria uma transação do tipo WITHDRAWAL com status PENDING.

Após processamento manual ou automático, a transação é marcada como SUCCESS ou FAILED.

🔹 DTO usado: RequestWithdrawalDto

Campos principais:

userId (provedor que solicita a retirada).

amount (valor solicitado).

bankAccount (dados bancários ou chave PIX).

4. Integração com outros módulos

O PaymentsModule não atua isoladamente – ele interage com:

BookingsModule → valida e associa pagamentos a agendamentos.

LoyaltyModule → registra pontos ou benefícios em pagamentos concluídos.

MissionsModule → pode disparar progresso em missões baseadas em pagamentos realizados.

NotificationsModule → envia notificações de pagamento confirmado ou retirada processada.

🚀 Endpoints Disponíveis
Criação de Cobrança PIX

POST /payments/pix/charge

Corpo: CreatePixChargeDto

Retorno: QR Code PIX + transação registrada.

Solicitar Retirada

POST /payments/withdrawal

Corpo: RequestWithdrawalDto

Retorno: Confirmação da transação WITHDRAWAL criada.

Listar Transações

GET /payments/transactions

Retorna todas as transações do usuário autenticado.

📊 Regras de Negócio

Segurança: apenas o usuário dono da transação pode visualizar ou solicitar estorno/retirada.

Limites de retirada: valores mínimos podem ser configurados para evitar microtransações.

Validação de saldo: o provedor só pode retirar até o valor acumulado disponível.

Auditoria obrigatória: todas as operações financeiras são persistidas em Transaction.

✅ Benefícios da Arquitetura

Rastreabilidade → cada pagamento é um registro único no banco.

Flexibilidade → fácil adaptação para novos métodos (ex.: cartão, boleto).

Segurança → controle de acesso baseado no usuário autenticado.

Escalabilidade → suporta múltiplos fluxos de pagamento com workers assíncronos.

📌 Esse módulo é fundamental para garantir a confiabilidade financeira da plataforma, oferecendo pagamentos seguros para clientes e retiradas transparentes para provedores.

👉 Quer que eu também crie um diagrama de sequência mostrando o fluxo Cliente → Backend → Provedor de Pagamentos → Backend → Provedor de Serviços? Isso ajudaria a visualizar como o dinheiro circula.