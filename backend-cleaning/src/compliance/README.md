✅ compliance/ — Módulo de Validação e Verificação de Conformidade

O módulo compliance/ centraliza regras de segurança, validação de identidade, documentos e verificação de antecedentes dos usuários. Essencial para garantir confiança, integridade e segurança da comunidade LimpeJá.

🎯 Objetivo

Garantir que usuários (clientes e prestadores) sejam validados corretamente.

Verificar documentos, fotos de perfil e registros suspeitos.

Servir como pilar para estratégias de reputação, score e selos.

⚙️ Estrutura de Arquivos
compliance/
├── compliance.service.ts           # Regras e lógica de conformidade

🧠 Lógica de Verificação — compliance.service.ts

Valida documentos enviados (formato, integridade, validade)

Verifica foto de perfil ou selfie para identidade

Consulta de registros externos (futuro: antecedentes ou CPF)

Restrições para acesso a certas features enquanto pendente

Pode ser usada para aprovar badges ou status "verificado"

🔗 Integração com Outros Módulos
Módulo	Uso na Compliance
providers/	Verificação de prestador
clients/	Cadastro seguro e verificado
notifications/	Alertar usuário sobre pendência
dashboard/	Exibir status de verificação
queues/	Validar uploads assíncronos