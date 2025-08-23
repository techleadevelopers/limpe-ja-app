📑 Verification Module

O módulo de Verificação (VerificationModule) é responsável pelo processo de validação de identidade de prestadores de serviço na plataforma. Ele garante segurança e confiabilidade, exigindo que prestadores enviem documentos oficiais e selfies para prova de vida, que são processados e avaliados antes da aprovação do perfil.

📂 Estrutura dos Arquivos

verification.controller.ts → Define os endpoints HTTP expostos para o cliente.

verification.service.ts → Contém toda a lógica de negócio da verificação (armazenar, processar e validar documentos).

verification.module.ts → Configura as dependências do módulo e integra com outros serviços.

DTOs (Data Transfer Objects):

upload-document.dto.ts → Estrutura de dados para envio de documentos.

upload-selfie.dto.ts → Estrutura de dados para upload de selfie.

🚀 Fluxo de Negócio

Upload de Documentos

O prestador envia imagens/documentos oficiais (RG, CNH, passaporte).

O backend armazena as informações no banco e envia para o serviço de processamento de documentos (DocumentProcessingService).

Esse serviço pode realizar extração de dados (OCR), validação de autenticidade e cruzamento com os dados cadastrais.

Upload de Selfie (Prova de Vida)

O prestador deve enviar uma foto selfie.

A selfie pode ser comparada com a foto do documento enviado para garantir que a identidade é válida.

Processamento & Análise

O VerificationService coordena o processamento dos dados.

Ele utiliza filas de processamento (via QueuesModule) para realizar tarefas assíncronas como:

OCR de documentos.

Validação facial.

Notificação ao time de compliance caso algo esteja inconsistente.

Resultado da Verificação

Se aprovado → O prestador passa a ter o status VERIFIED.

Se pendente → Mantém status UNDER_REVIEW até análise.

Se rejeitado → O prestador recebe um status REJECTED e uma notificação com instruções.

⚙️ Integrações

PrismaModule → Persistência de dados dos documentos e status de verificação.

ProvidersModule → Liga o status de verificação ao cadastro do prestador.

QueuesModule → Processa documentos e selfies de forma assíncrona.

NotificationsModule → Notifica prestadores sobre aprovação, rejeição ou pendência.

📌 Endpoints Disponíveis (VerificationController)
🔹 Upload de Documento
POST /verification/document


Body (UploadDocumentDto):

{
  "providerId": "abc123",
  "documentType": "RG",
  "fileUrl": "https://storage/app/docs/rg123.jpg"
}

🔹 Upload de Selfie
POST /verification/selfie


Body (UploadSelfieDto):

{
  "providerId": "abc123",
  "fileUrl": "https://storage/app/selfies/selfie123.jpg"
}

🔹 Consultar Status de Verificação
GET /verification/status/:providerId


Response:

{
  "providerId": "abc123",
  "status": "UNDER_REVIEW",
  "documents": [
    { "type": "RG", "status": "PENDING" },
    { "type": "SELFIE", "status": "PENDING" }
  ]
}

🧠 Regras de Negócio

Apenas prestadores de serviço passam pelo fluxo de verificação.

O processo exige documento oficial válido e uma selfie de prova de vida.

O sistema utiliza filas para escalar o processamento e não sobrecarregar o backend.

O prestador não pode aceitar serviços enquanto estiver com status UNVERIFIED.

📊 Estados Possíveis de Verificação

UNVERIFIED → Prestador ainda não iniciou o processo.

UNDER_REVIEW → Documentos enviados, aguardando processamento/aprovação.

VERIFIED → Prestador aprovado, pode atuar normalmente.

REJECTED → Documentação inválida ou inconsistência detectada.

✅ Resumo

O VerificationModule garante a segurança da plataforma através de um fluxo estruturado de validação de identidade. Ele conecta o upload de documentos e selfies com serviços de processamento, filas assíncronas e notificações, garantindo que somente prestadores verificados possam atuar.