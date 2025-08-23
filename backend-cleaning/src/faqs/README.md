📚 faqs/ — Módulo de Perguntas Frequentes (FAQs) do LimpeJá

O módulo faqs/ centraliza e gerencia a base de dúvidas frequentes, oferecendo respostas rápidas e organizadas para usuários (clientes e prestadores). Ele é um recurso essencial de suporte automático, redução de tickets e experiência do usuário.

🎯 Objetivo

Fornecer respostas objetivas a dúvidas comuns

Reduzir dependência do suporte humano

Oferecer experiência de autoatendimento inteligente

Servir como base para classificação de incidentes e disputas

⚙️ Estrutura de Arquivos
faqs/
├── faqs.module.ts               # Módulo principal NestJS
├── faqs.controller.ts          # Endpoints públicos/admin
├── faqs.service.ts             # Regras de negócio e acesso a dados
├── faq-item.entity.ts          # Entidade ORM com estrutura dos itens FAQ
├── create-faq.dto.ts           # DTO de criação
├── update-faq.dto.ts           # DTO de edição

📋 Entidade: faq-item.entity.ts
{
  id: string;
  question: string;
  answer: string;
  category: string; // Ex: "Cliente", "Prestador", "Pagamentos"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

✍️ DTOs
create-faq.dto.ts
{
  question: string;
  answer: string;
  category: string;
}

update-faq.dto.ts
{
  question?: string;
  answer?: string;
  category?: string;
  isActive?: boolean;
}

🌐 Endpoints REST — faqs.controller.ts
Método	Rota	Descrição
GET	/faqs	Lista todas as FAQs ativas
GET	/faqs/:id	Retorna uma FAQ específica
POST	/faqs	Cria uma nova FAQ (admin)
PUT	/faqs/:id	Atualiza conteúdo de uma FAQ
DELETE	/faqs/:id	Remove uma FAQ (lógica ou física)
🧠 Lógica de Negócio — faqs.service.ts

Criação, edição, remoção e listagem de FAQs

Controle por categoria

Ativação/desativação (útil para arquivar sem perder histórico)

Base para busca por palavras-chave ou filtragem

🔗 Integração com o App
Local / Componente	Uso Real da FAQ
Tela de Ajuda ou Suporte	Listagem por categoria
Fluxo de abertura de disputa	Sugestão de FAQ antes de escalar ao suporte
Onboarding de novos usuários	Apresentação de dúvidas comuns
🔄 Integração Estratégica
Módulo	Função Conectada
disputes/	Reduz disputa com FAQ preventiva
support/ (se houver)	Alivia tickets manuais
app.mobile	FAQ aparece por categoria ou ação
✅ Benefícios Estratégicos

💬 Reduz carga do suporte humano

🧠 Melhora compreensão da plataforma

⏱️ Agiliza o tempo de resposta ao usuário

🧩 Serve como base para automação futura (chatbots, IA)

🛠️ Próximos Recursos Sugeridos
Funcionalidade	Prioridade
Busca por palavra-chave	Alta
Ordenação por relevância	Média
Relatório de visualizações	Média
FAQ sugerida por contexto	Alta
Link com disputas incidentes	Alta
✅ Conclusão

O módulo faqs/ é leve, direto e extremamente funcional — provê autoatendimento real para dúvidas recorrentes, economizando tempo, aumentando eficiência e melhorando a experiência geral do usuário.