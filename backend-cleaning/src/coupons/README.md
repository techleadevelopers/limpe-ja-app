🎟️ coupons/ — Módulo de Cupons Promocionais e Fidelização

O módulo coupons/ gerencia a criação, aplicação e rastreamento de cupons de desconto para os usuários da plataforma. Ele é um dos principais mecanismos de atração e retenção de clientes, conectado diretamente à lógica de gamificação e fidelidade do LimpeJá.

🎯 Objetivo

Criar cupons com regras específicas (data, limite, tipo)

Aplicar cupons a usuários autenticados em tempo real

Controlar uso único ou múltiplo por usuário

Validar automaticamente a elegibilidade e o impacto no preço

⚙️ Estrutura de Arquivos
coupons/
├── coupons.module.ts             # Módulo NestJS principal
├── coupons.controller.ts         # Endpoints públicos/admin
├── coupons.service.ts            # Regras de aplicação, validação e listagem
├── coupon.entity.ts              # Modelo ORM da entidade Coupon
├── apply-coupon.dto.ts           # DTO para aplicação de cupom
├── create-coupon.dto.ts          # DTO para criação
├── update-coupon.dto.ts          # DTO para edição

🧱 Entidade ORM — coupon.entity.ts
{
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  expiresAt: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

📥 DTOs
create-coupon.dto.ts
{
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  expiresAt: Date;
  usageLimit?: number;
}

apply-coupon.dto.ts
{
  userId: string;
  code: string;
  orderTotal: number;
}

update-coupon.dto.ts
{
  value?: number;
  expiresAt?: Date;
  isActive?: boolean;
}

🌐 Endpoints — coupons.controller.ts
Método	Rota	Descrição
POST	/coupons	Criação de novo cupom
GET	/coupons/:code	Busca cupom por código
POST	/coupons/apply	Aplica um cupom ao usuário e pedido
PATCH	/coupons/:id	Atualiza dados do cupom
DELETE	/coupons/:id	Inativa ou remove cupom
🧠 Lógica de Negócio — coupons.service.ts

Valida código: formato, validade, ativo

Verifica se já foi usado pelo usuário

Calcula novo valor (com base em tipo e valor original)

Atualiza contador de uso (usageCount)

Bloqueia cupom expirado ou excedido

💡 Exemplos de Casos de Uso
Caso de Uso	Resultado Esperado
Cupom de R$20 fixo para 1ª compra	Redução direta no valor da fatura
Cupom 10% por indicação	Aplica desconto proporcional
Cupom expira em 3 dias	Validação automática de data
Cupom para plano premium	Aplicável apenas em compras específicas
🔗 Integração com Outros Módulos
Módulo	Integração
loyalty/	Pontos podem gerar cupons
payments/	Valor com cupom interfere na fatura
missions/	Missão pode gerar cupom de prêmio
dashboard/	Exibe cupons aplicados ou ganhos
🧭 Estratégia de Produto

🪙 Retenção: Através de missões e gamificação com recompensa real

🧲 Aquisição: Atração de novos usuários com ofertas (primeira compra)

🔁 Reutilização: Campanhas recorrentes para ativar usuários antigos

🎯 Segmentação: Cupons específicos para nichos, horários ou regiões

🧠 Sugestões Futuras
Ideia	Prioridade
Cupons geolocalizados	Alta
Cupons com limite por bairro	Média
Histórico de uso por usuário	Alta
Notificação automática sobre cupom vencendo	Alta
✅ Conclusão

O módulo coupons/ é um instrumento central de marketing e retenção da plataforma. Integrado à jornada do usuário e à lógica de gamificação, ele entrega valor tangível ao cliente, melhora o CAC efetivo, e fortalece o ciclo de recompra dentro do LimpeJá.