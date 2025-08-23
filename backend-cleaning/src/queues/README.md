📦 queues/ — Módulo de Processamento Assíncrono do LimpeJá

Módulo responsável pelo processamento desacoplado e escalável de tarefas críticas e não bloqueantes do ecossistema LimpeJá. Otimiza performance, reduz latência no frontend e viabiliza estratégias de escalabilidade real.

🎯 Objetivo

Desacoplar tarefas pesadas ou agendadas da execução síncrona da aplicação, utilizando filas assíncronas (Redis + BullMQ) para garantir:

Escalabilidade

Tolerância a falhas

Performance de API

Melhor experiência do usuário

⚙️ Estrutura de Pastas
queues/
├── queues.module.ts              # Módulo principal que orquestra todos os workers e providers
├── queues.service.ts             # Serviço que expõe métodos de enfileiramento
├── dispute.worker.ts            # Worker de resolução de disputas
├── notification.worker.ts       # Worker para envio de notificações (push, e-mail)
├── verification.worker.ts       # Worker de verificação documental (OCR, selfie, antecedentes)

🧠 Lógica e Casos de Uso
✅ 1. notification.worker.ts

Processa:

Notificações push (Expo)

E-mails (transacionais e marketing)

Lembretes de agendamentos e avaliações

Origem dos eventos:

Criação de bookings

Confirmação de serviço

Conclusão de atendimento

Avaliação de cliente ou prestador

✅ 2. verification.worker.ts

Processa:

Verificação de documentos do prestador

CNH / RG (OCR)

Selfie com prova de vida

Consulta de antecedentes

Origem dos eventos:

Registro de prestador

Atualização de perfil

Auditorias internas

✅ 3. dispute.worker.ts

Processa:

Abertura, análise e resolução de disputas entre cliente e prestador

Fluxo de suporte moderado (manual e automático)

Gatilhos de reembolso, alerta ou bloqueio de usuário

Origem dos eventos:

Reclamação aberta no app

Baixa avaliação com suspeita automática

Falta de check-out ou divergência no local

🔁 queues.service.ts

Este serviço centraliza os métodos de enfileiramento de tarefas.

Principais métodos:
enqueueVerificationTask(data: VerificationPayload)
enqueueNotificationTask(data: NotificationPayload)
enqueueDisputeTask(data: DisputePayload)


Utilizado por controladores, serviços ou hooks em outras camadas da aplicação.

📦 queues.module.ts

Módulo que registra os workers, configura o BullMQ com Redis, e conecta os consumers a seus respectivos processadores de tarefas.

Inclui:

Configurações globais de fila

Injeção de dependência dos workers

Registro dos queues no ecossistema NestJS

🔐 Segurança e Resiliência

✅ Tasks com retry automático e delay exponencial

✅ Workers isolados, com lógica de erro dedicada

✅ Persistência e observabilidade via Redis

✅ Permite uso futuro de Prometheus para monitorar tempo de fila e erros por tipo

🔗 Integração com o App (Real e Validada)
Envio de notificações:

App chama endpoint /bookings

Controller → queues.service.enqueueNotificationTask()

Worker envia push via Expo

Verificação documental:

App /provider-register

Envia documentos

Backend processa com enqueueVerificationTask()

App é atualizado via status

Disputas:

Cliente sinaliza problema

App → Backend → enqueueDisputeTask()

Worker aciona suporte, bloqueia pagamento e emite alerta

📈 Estratégia Técnica

O módulo queues/ é fundamental para escalar o LimpeJá com eficiência, pois garante:

APIs leves e responsivas

Processos longos rodando em background

Baixo acoplamento entre camadas

Facilidade de manutenção e debug

Potencial para escalonamento horizontal por tipo de worker

📌 Roadmap Futuro
Item	Prioridade
Integração com metrics/	Alta
Registro de métricas Prometheus	Alta
Retentativas customizadas por job	Média
Painel Admin para visualizar fila	Média
✅ Conclusão

O módulo queues/ já opera em produção e cumpre seu papel com excelência: garantir performance, estabilidade e escalabilidade real da plataforma. Ele se conecta diretamente com as experiências críticas dos usuários, como notificações, suporte e verificação de identidade — e está preparado para crescer junto com a operação.