# Compliance Audit

## Regra dos 2 dias (LC 150/2015)
- **Obrigações jurídicas** agora materializadas na camada técnica: o backend impede mais de dois agendamentos por cliente e provedor dentro da mesma semana ISO em `America/Sao_Paulo` (segunda-feira 00:00 até domingo 23:59:59.999, calculado a partir do `scheduledStart`).
- **Estados somados** são apenas os que refletem prestação real: `BookingStatus.CONFIRMED`, `BookingStatus.STARTED` (IN_PROGRESS) e `BookingStatus.FINISHED` (COMPLETED). `PENDING`, `INVITED`, `CANCELED` etc. não entram na contagem, evitando falsos positivos.
- **Concorrência** é controlada por um lock Redis (`booking:weekly:{clientId}:{providerId}:{weekStart}`) com TTL de 3 segundos. Se o lock estiver ocupado, lançamos `BusinessRuleError('BOOKING_LOCK_BUSY')`, sinalizando para o cliente tentar novamente brevemente.
- Essa trava roda tanto no fluxo de _create_ (antes de criar endereço/booking) quanto no fluxo de transição para `BookingStatus.CONFIRMED` (`provider` aceitando o pedido), garantindo que os três primeiros _pending_ não se confirmem simultaneamente.
- O payload de erro e os logs agora deixam explícito o intervalo semanal afetado (`weekStart`/`weekEnd`) para auditoria e atendimento.

## Testes implementados
1. **Unitário** – respeita a cota de duas reservas por semana e bloqueia a terceira, reseta ao cruzar domingo→segunda e verifica que somente `CONFIRMED|STARTED|FINISHED` entram na contagem; também cobre o bloqueio no fluxo de confirmação do provider.
2. **E2E** – três `POST /bookings` simultâneos geram apenas duas entradas no banco; ao menos uma resposta chega com HTTP 400 e a tabela `bookings` contém dois registros.

## Observações / caveats
- A lógica considera o `scheduledStart` convertido para `America/Sao_Paulo`, então alterar a data ou horário planejado muda a janela semanal automaticamente.
- Retries devem tratar `BusinessRuleError('BOOKING_LOCK_BUSY')` de forma idempotente pois o lock é breve e evita falsos positivos em ambientes de alta concorrência.
