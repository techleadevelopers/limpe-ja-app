Common Module -- Módulo Comum
O módulo common/ fornece funcionalidades compartilhadas e utilitários que podem ser utilizados em todo o sistema LimpeJá. Ele centraliza a lógica que não se encaixa em módulos específicos, promovendo a reutilização de código e a consistência em toda a aplicação.

🎯 Objetivo
Implementar filtros de exceção que tratam erros de forma consistente.
Fornecer serviços de internacionalização (i18n) para suporte a múltiplos idiomas.
Incluir middleware para gerenciar a configuração de idioma com base nas preferências do usuário.
Oferecer serviços utilitários, como envio de e-mails e SMS, e geocodificação de endereços.
⚙️ Estrutura de Arquivos
stylus

Copiar
common/
├── common.module.ts                  # Módulo principal comum
├── filters/
│   ├── all-exceptions.filter.ts      # Filtro de exceções para tratamento global
│   └── http-exception.filter.ts       # Filtro específico para exceções HTTP
├── i18n/
│   ├── i18n.module.ts                 # Módulo de internacionalização
│   ├── i18n.service.ts                # Serviço de tradução e gerenciamento de idiomas
├── middlewares/
│   └── locale.middleware.ts           # Middleware para definir o idioma da requisição
├── services/
│   ├── email.service.ts               # Serviço para envio de e-mails
│   ├── geocoding.service.ts           # Serviço para geocodificação de endereços
│   └── sms.service.ts                 # Serviço para envio de SMS
├── pipes/
│   └── validation.pipe.ts             # Pipe de validação para DTOs
└── utils/
    └── code-generator.ts              # Função utilitária para gerar códigos aleatórios
🧱 Funcionalidades
Filtros de Exceção
all-exceptions.filter.ts: Captura todas as exceções não tratadas e retorna uma resposta padronizada.
http-exception.filter.ts: Tratamento específico para exceções HTTP, formatando a resposta de erro.
Internacionalização
i18n.service.ts: Gerencia as traduções e fornece métodos para traduzir chaves de texto baseadas no idioma preferido do usuário.
i18n.module.ts: Módulo que disponibiliza o serviço de internacionalização globalmente.
Middleware
locale.middleware.ts: Middleware que lê o cabeçalho Accept-Language e define o idioma da requisição.
Serviços
email.service.ts: Serviço para enviar e-mails utilizando provedores configuráveis (ex: SMTP, SendGrid).
geocoding.service.ts: Serviço para converter endereços textuais em coordenadas geográficas.
sms.service.ts: Serviço para enviar mensagens SMS, com suporte a diferentes provedores.
Pipes
validation.pipe.ts: Pipe customizado para validar DTOs usando class-validator, garantindo que os dados de entrada estejam corretos.
Utilitários
code-generator.ts: Função para gerar códigos aleatórios, útil para funcionalidades como verificação por SMS.
✅ Conclusão
O módulo common/ é essencial para proporcionar uma infraestrutura robusta e reutilizável em LimpeJá. Ele facilita a implementação de funcionalidades comuns, reduzindo a duplicação de código e promovendo uma arquitetura mais limpa e organizada. Com suas funcionalidades de tratamento de erros, suporte a múltiplos idiomas e serviços compartilhados, contribui significativamente para a experiência do usuário e a manutenção do sistema.