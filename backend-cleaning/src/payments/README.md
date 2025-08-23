💸 payments/ — Módulo de Pagamentos e Transações Financeiras

O módulo payments/ é responsável pela criação de cobranças via PIX, controle de transações financeiras e gerenciamento de repasses, integrando a lógica de Giro Limpo com a infraestrutura de pagamentos. Ele garante que os fluxos de entrada (clientes) e saída (prestadores) sejam seguros, rastreáveis e fluidos.

🎯 Objetivo

Gerar cobranças via PIX para os clientes

Registrar transações realizadas (cobranças, repasses)

Gerenciar saques e transferências para prestadores

Fornecer dados claros sobre o ciclo financeiro de cada parte

⚙️ Estrutura de Arquivos
payments/
├── payments.module.ts               # Módulo principal NestJS
├── payments.controller.ts           # Endpoints de pagamento e saque
├── payments.service.ts              # Lógica de criação e controle de transações
├── transaction.entity.ts            # Estrutura ORM das transações
├── create-pix-charge.dto.ts         # DTO para gerar cobrança
├── request-withdrawal.dto.ts        # DTO para solicitação de saque

🧱 Entidade ORM — transaction.entity.ts
{
  id: string;
  userId: string;
  type: 'charge' | 'withdrawal';
  status: 'pending' | 'confirmed' | 'failed';
  amount: number;
  description?: string;
  pixKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

📥 DTOs
create-pix-charge.dto.ts
{
  userId: string;
  amount: number;
  description?: string;
}

request-withdrawal.dto.ts
{
  userId: string;
  amount: number;
  pixKey: string;
}

🌐 Endpoints — payments.controller.ts
Método	Rota	Descrição
POST	/payments/pix-charge	Cria uma nova cobrança via PIX
POST	/payments/withdraw	Solicita saque para prestador
GET	/payments/transactions/:id	Retorna detalhes de uma transação específica
GET	/payments/me	Lista histórico financeiro do usuário logado
🔐 Segurança e Rastreabilidade

Saques só autorizados se saldo for suficiente (validação feita via earnings/)

Transações possuem status e histórico completo

PIX atrelado ao CPF/CNPJ do usuário (via validação externa se aplicável)

Evita fraudes ou múltiplos saques com mesma chave

🔄 Fluxo Resumido de Transação
[Cliente] → Geração de QR Code PIX (via create-pix-charge)
        ↳ Transação "charge" registrada como "pending"
        ↳ Após confirmação do provedor PIX, status → "confirmed"

[Prestador] → Solicita retirada (via request-withdrawal)
        ↳ Verificação de saldo em earnings
        ↳ Transação "withdrawal" criada com status "pending"
        ↳ Após execução via PSP, status → "confirmed"

🔗 Integrações com Outros Módulos
Módulo	Interação
earnings/	Validação de saldo antes de saque
notifications/	Envio de alerta de saque ou cobrança
dashboard/	Informações de ganhos acumulados
loyalty/	Permitir troca de pontos por crédito
📊 Estratégia de Produto

📌 Giro Limpo: Prestadores recebem rapidamente (até 24h), com PIX automático.

🚀 Confiança: Sem fricção, transparente, e com histórico visível no app.

🔄 Retenção via cashback/cupons: Integra lógica de fidelização financeira.

✅ Conclusão

O módulo payments/ é o coração da operação financeira do LimpeJá, suportando toda a infraestrutura de cobrança e repasse com foco em agilidade, segurança e rastreabilidade. Totalmente conectado à missão de rentabilidade e impacto social, ele garante que a plataforma funcione com fluxo de caixa saudável e confiança entre todas as partes.