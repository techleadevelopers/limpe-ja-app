🛡️ Módulo Safety

O módulo Safety é responsável por garantir a segurança de clientes e prestadores de serviço dentro da plataforma. Ele fornece mecanismos de relato de incidentes e alerta de pânico, permitindo respostas rápidas a situações emergenciais e maior confiança no ecossistema.

📌 Arquitetura do Módulo

O módulo é composto pelos seguintes arquivos principais:

safety.controller.ts → Expõe as rotas da API relacionadas à segurança (incidentes e alertas de pânico).

safety.service.ts → Contém a lógica de negócio, validações e integrações para registro, atualização e consulta.

safety.module.ts → Declara o módulo no NestJS, configurando controllers e providers.

Entities

incident.entity.ts → Representa um incidente de segurança relatado (ex.: assédio, roubo, comportamento inadequado).

panic-alert.entity.ts → Representa um alerta de pânico disparado em tempo real por um usuário.

DTOs

report-incident.dto.ts → Estrutura de dados para registrar um incidente.

update-incident.dto.ts → Estrutura de atualização de status/incidente.

report-panic.dto.ts → Estrutura de dados para disparar um alerta de pânico.

📊 Fluxo de Negócio Atual
🔹 1. Relato de Incidentes (Incident)

Quem pode reportar: clientes ou prestadores.

Fluxo:

Usuário preenche report-incident.dto.ts com os detalhes do ocorrido:

userId

bookingId (se relacionado a uma reserva)

type (categoria do incidente, ex.: agressão, comportamento impróprio, roubo)

description

O SafetyService cria um registro em incident.entity.ts com status inicial "PENDING".

A equipe de suporte/admin pode revisar e atualizar o incidente via update-incident.dto.ts:

status (ex.: PENDING → IN_REVIEW → RESOLVED → ESCALATED).

resolutionNotes.

Exemplo de ciclo de vida de um incidente:

PENDING → IN_REVIEW → RESOLVED
ou
PENDING → ESCALATED (se requer atenção externa)

🔹 2. Alerta de Pânico (PanicAlert)

Objetivo: permitir que um usuário em risco imediato (cliente ou prestador) dispare um alerta em tempo real.

Fluxo:

Usuário aciona um botão no app → envia report-panic.dto.ts:

userId

location (coordenadas GPS)

bookingId (se aplicável)

notes (informações adicionais)

O SafetyService cria um registro em panic-alert.entity.ts com status inicial "ACTIVE".

Notificações são disparadas para admins/suporte e, futuramente, pode integrar com:

Polícia ou serviços de emergência (integração externa).

Sistema de monitoramento em tempo real (ex.: dashboard de crises).

O alerta pode ser encerrado manualmente ou automaticamente após um tempo configurado.

🔹 3. Monitoramento e Auditoria

Todos os incidentes e alertas são registrados no banco para:

Auditoria → histórico de segurança.

Análise de risco → identificação de usuários recorrentes em problemas.

Aprimoramento da confiança → aplicar penalidades, bloqueios ou revisões.

📡 Endpoints Principais
Incidentes

POST /safety/incidents → reportar incidente.

PATCH /safety/incidents/:id → atualizar status/incidente.

GET /safety/incidents/:id → buscar incidente específico.

GET /safety/incidents → listar incidentes (admin).

Alertas de Pânico

POST /safety/panic → disparar alerta de pânico.

GET /safety/panic/:id → consultar alerta específico.

GET /safety/panic → listar alertas ativos/recentes.

⚙️ Regras de Negócio Implementadas

✅ Apenas usuários autenticados podem reportar incidentes ou disparar alertas.

✅ Incidentes ficam com status PENDING até revisão manual.

✅ Alertas de pânico geram registros imediatos e ficam ativos até encerrados.

✅ Logs completos são mantidos para auditoria.

✅ Estrutura pronta para futura integração com serviços de emergência.

🚀 Possíveis Evoluções

🔜 Integração com serviços de geolocalização em tempo real (mapa de alertas ativos).

🔜 Notificações push/SMS imediatas para administradores.

🔜 Sistema de priorização de incidentes baseado em gravidade.

🔜 Análise automatizada de usuários recorrentes para ações disciplinares.

✅ Resumo:
O módulo Safety garante a confiança na plataforma através de gestão de incidentes e resposta rápida a emergências com alertas de pânico. Ele já cobre registro, atualização e monitoramento de segurança, e está preparado para integração com suporte em tempo real e autoridades externas.