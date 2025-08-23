Auth Module -- Módulo de Autenticação
O módulo auth/ é responsável por gerenciar a autenticação e autorização de usuários no sistema LimpeJá. Ele fornece a infraestrutura necessária para registro, login, recuperação de senha e gestão de permissões, garantindo que apenas usuários autorizados possam acessar recursos protegidos.

🎯 Objetivo
Permitir que usuários se registrem como clientes ou provedores.
Prover endpoints para login usando e-mail/senha e autenticação via telefone.
Implementar a funcionalidade de recuperação de senha.
Fornecer mecanismos de autenticação baseados em JWT para proteger rotas sensíveis.
Gerenciar diferentes papéis de usuário e suas permissões.
⚙️ Estrutura de Arquivos
stylus

Copiar
auth/
├── auth.module.ts                  # Módulo principal NestJS
├── auth.controller.ts              # Endpoints REST para gerenciamento de autenticação
├── auth.service.ts                 # Lógica de negócio principal
├── guards/
│   ├── local-auth.guard.ts         # Guardião de autenticação local
│   ├── jwt-auth.guard.ts           # Guardião de autenticação JWT
│   ├── roles.guard.ts              # Guardião para verificação de permissões de papéis
│   └── ws-auth.guard.ts            # Guardião para autenticação via WebSocket
├── strategies/
│   ├── local.strategy.ts            # Estratégia de autenticação local
│   └── jwt.strategy.ts              # Estratégia de autenticação JWT
├── dto/
│   ├── register-client.dto.ts      # DTO para registro de novo cliente
│   ├── register-provider.dto.ts     # DTO para registro de novo provedor
│   ├── login.dto.ts                 # DTO para login
│   ├── forgot-password.dto.ts       # DTO para solicitação de redefinição de senha
│   ├── phone-auth.dto.ts            # DTO para autenticação via telefone
│   └── auth-response.dto.ts         # DTO para resposta de autenticação
└── decorators/
    ├── roles.decorator.ts           # Decorador para definir papéis de usuário
🧱 Entidades ORM
As entidades ORM não estão diretamente incluídas no módulo de autenticação, mas a autenticação interage com a entidade User do Prisma.

📥 DTOs
register-client.dto.ts: Contém os dados necessários para registrar um novo cliente, como e-mail, senha, nome completo e endereço.
register-provider.dto.ts: Contém os dados necessários para registrar um novo provedor, incluindo informações pessoais e endereço.
login.dto.ts: Usado para realizar login, exige e-mail e senha.
forgot-password.dto.ts: Usado para solicitar a redefinição de senha, requer um e-mail.
phone-auth.dto.ts: Usado para login ou verificação via telefone.
auth-response.dto.ts: Contém o token JWT e informações do perfil do usuário após autenticação.
🌐 Endpoints -- auth.controller.ts
Método	Rota	Descrição
POST	/auth/register/client	Cria um novo cliente.
POST	/auth/register/provider	Cria um novo provedor.
POST	/auth/login	Realiza o login de um usuário (cliente/provedor).
POST	/auth/forgot-password	Solicita a redefinição de senha.
🔗 Integração com Outros Módulos
users/: O módulo de autenticação interage com o módulo de usuários para gerenciar informações de perfis.
notifications/: Notificações podem ser enviadas para usuários sobre eventos relacionados à autenticação, como redefinição de senha.
providers/: Integração para gerenciar provedores e suas informações durante o registro e login.
✅ Conclusão
O módulo auth/ é crucial para a segurança e integridade do sistema LimpeJá. Ele garante que apenas usuários autenticados possam acessar funcionalidades sensíveis, além de proporcionar um fluxo seguro para registro e recuperação de contas. A implementação de autenticação baseada em JWT e a gestão de papéis contribuem para um sistema robusto e confiável, essencial para manter a confiança dos usuários na plataforma.