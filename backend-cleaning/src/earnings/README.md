💰 earnings/ — Módulo de Ganhos e Repasse Financeiro

O módulo earnings/ centraliza a lógica de controle de ganhos dos prestadores, incluindo acúmulo por serviços realizados, histórico financeiro, e requisição de saques via PIX. Ele é o coração da estratégia de Giro Limpo no LimpeJá.

🎯 Objetivo

Controlar e exibir os ganhos do prestador

Registrar saldo disponível para saque

Permitir requisição de repasse com segurança e rastreabilidade

Exibir histórico detalhado por serviço ou data

⚙️ Estrutura de Arquivos
earnings/
├── earnings.module.ts            # Módulo principal
├── earnings.controller.ts        # Endpoints públicos/autenticados
├── earnings.service.ts           # Lógica de registro, saldo e saque
├── earnings.dto.ts               # Tipagem e estruturas de request/response

🧠 Funcionalidades Principais

Registrar ganho após finalização de serviço

Calcular saldo disponível

Solicitar repasse por PIX

Registrar status de pagamento (pendente, pago, erro)

Listar extrato por período

Exibir total por mês (usado no dashboard)

📥 DTOs
earnings.dto.ts (exemplo)
{
  providerId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  createdAt: Date;
}

🌐 Endpoints — earnings.controller.ts
Método	Rota	Função
GET	/earnings/me	Retorna histórico e saldo atual
POST	/earnings/request-payout	Solicita saque via PIX
GET	/earnings/stats	Resumo mensal ou anual dos ganhos
🔐 Segurança

Requisição de saque só permitida para saldo disponível

Dados bancários protegidos

Registro de logs para auditoria

🔗 Integração com Outros Módulos
Módulo	Papel Integrado
bookings/	Dispara evento de ganho concluído
payments/	Relaciona PIX e status de repasse
dashboard/	Informa total acumulado
notifications/	Informa prestador de novo ganho
⚙️ Estratégia Giro Limpo
Ação	Resultado
Serviço concluído	Gera entrada em earnings
Saldo liberado (escrow PIX)	Repassado em até 24h
Relatório por mês ou semana	Acompanha saúde financeira
✅ Conclusão

O módulo earnings/ é essencial para manter a confiança dos prestadores, garantir fluidez no repasse financeiro e reforçar a lógica de Giro Limpo com total transparência e rastreabilidade.