Relatório de Negócio – LimpeJá
1. Sumário Executivo
LimpeJá é uma plataforma de marketplace que conecta clientes (quem precisa de limpeza residencial) a diaristas/profissionais de limpeza qualificados e verificados. Com lançamento iminente, seu diferencial é atuar num nicho up-and-coming — “Airbnb de diaristas” — sem grandes concorrentes diretos, oferecendo agendamento flexível, pagamento seguro (PIX), chat em tempo real e um rigoroso processo de verificação.

2. Proposta de Valor
Para Clientes

Busca inteligente por especialidade, avaliações e proximidade geoespacial.
Agendamento flexível e preço dinâmico (fixo, por hora, por m² ou cômodo).
Pagamento dentro da plataforma (PIX), com status em tempo real e recibo automático.
Programa de fidelidade: benefícios conforme número de agendamentos concluídos.
Chat integrado, notificações push e histórico de serviços.
Para Diaristas

Acesso a nova base de clientes segmentados.
Gestão completa de agenda e disponibilidade.
Pagamentos garantidos, com saque e relatórios de ganhos.
Bonificações por alto volume de serviços e avaliações 5 ★.
Processo de verificação (CPF, OCR, liveness, antecedentes) aumenta a confiança.
3. Lógica de Negócio
Marketplace B2C

Modelo de plataforma two-sided: clientes e profissionais.
Matching geoespacial via PostGIS para sugerir prestadores próximos.
Preço Dinâmico

PricingType: FIXED_PRICE, HOURLY, BY_SIZE, CUSTOM_QUOTE.
Clientes informam m² ou cômodos, sistema calcula valor final.
Profissionais definem suas regras (preço por hora, por m², etc.).
Verificação de Provedores

Upload de documentos (OCR via Google Vision), selfie + prova de vida e antecedentes.
Estados de verificação gerenciados por enum VerificationStatus.
Açõe s: somente prestadores “APPROVED” recebem solicitações.
Fluxos de Pagamento & Comissionamento

Cliente gera cobrança PIX (POST /payments/pix-charge), backend recebe webhook.
Após pagamento confirmado, 85% repassados ao profissional, 15% fica de comissão.
Transações atômicas e auditáveis (Prisma Decimal, TransactionType).
Comunicação & Suporte

Chat em tempo real (Socket.IO) para combinar detalhes.
Notificações push (FCM) para status de agendamento e mensagens.
Suporte in-app para disputas e reclamações (POST /bookings/:id/report-issue).
4. Modelo de Monetização
Comissão de 15% sobre cada serviço pago.
Potencial futura taxa de conveniência para clientes.
Upsells: planos de assinatura (ex: descontos em volume), ofertas promocionais e parcerias corporativas.
Projeção de Receita (exemplo):

Média de R$ 150 por serviço × 1.000 mensais = R$ 150.000 transacionados
Comissão 15% → R$ 22.500/mês
5. Análise de Nicho e Concorrência
Nicho: diaristas e limpezas residenciais pontuais.
Concorrentes: apps gerais de serviços (GetNinjas, Triider) não focados exclusivamente em limpeza, sem price-type dinâmico nem verificação robusta.
Vantagem Competitiva:
Preço dinâmico alinhado ao que o cliente realmente precisa.
Processo de verificação intensivo que gera confiança.
UX mobile-first, pensado em diaristas (público menos tech-savvy).
6. Fatores Críticos de Sucesso
Adoção Inicial: capturar early-adopters em bairros com alta demanda (parcerias locais).
Qualidade de Rede: bots nos primeiros 100 profissionais + programa de indicação.
Marketing de Conteúdo: tutoriais, listas de dicas de limpeza, engajamento em redes sociais.
Experiência do Usuário: telas claras, animações suaves, processo de agendamento em 3 cliques.
Confiabilidade: uptime do backend (NestJS), monitoramento de performance (APM), testes e automação.
7. Riscos e Mitigações
Baixo volume de profissionais → estratégia de aquisição B2B (agências de limpeza) + incentivos.
Inadimplência → pagamento prévio obrigatório e retenção automática de comissão até conclusão.
Fraudes → validação facial e prova de vida, detecção de comportamentos anômalos.
Retenção de usuários → programa de fidelidade, notificações de promoções e follow-up pós-serviço.
8. Roadmap e Próximos Passos
Deploy & Go-to-Market (próximas 4 semanas)
Publicação nas lojas, campanha de lançamento local.
Expansão de Funcionalidades (3 meses)
Wallet interno (walletBalance), UI de saque e depósito.
Filtros avançados de busca (por avaliações e preço).
Escala e Internacionalização (6–12 meses)
Suporte a múltiplos idiomas (i18n).
Integração com novos gateways de pagamento e serviços corporativos.
9. Conclusão
LimpeJá combina tecnologia de ponta (React Native + Expo, NestJS + Prisma, PostGIS, Firebase) com um modelo de negócios claro e escalável. Ao oferecer um “Airbnb de diaristas” com garantia de qualidade e fluxo de pagamento seguro, a plataforma tem forte potencial de penetração e rentabilidade num segmento em crescimento pós-pandemia. A chave será alavancar aquisição de usuários de ambos os lados do marketplace, manter altos padrões de confiança e iterar rapidamente nas próximas funcionalidades.

Rentabilidade e Estrutura de Taxas do LimpeJá
1. Modelo de Receita Principal
Comissão sobre o prestador: 15% do valor de cada serviço concluído e pago.
Sem taxa extra ao cliente (no lançamento, para manter competitividade).
2. Exemplo Numérico de Rentabilidade
Métrica	Valor unitário	Total mensal (exemplo)
Preço médio de um serviço	R$ 150,00	—
Número de serviços/mês	—	1 000
Volume bruto transacionado	—	R$ 150 000,00
Comissão (15%)	R$ 22,50 por serviço	R$ 22 500,00
Receita mensal estimada: R$ 22 500
(para 1 000 serviços de R$ 150 cada)

3. Perspectivas de Escalonamento
2 000 serviços/mês → R$ 45 000 em receita.
5 000 serviços/mês → R$ 112 500 em receita.
4. Possibilidade de Taxa de Conveniência (Futuro)
Poderíamos adicionar uma taxa fixa ou percentual sobre o valor do cliente (ex.: R$ 5,00 por agendamento ou 2% sobre o valor), gerando receita incremental sem alterar a comissão do profissional.
Exemplo de taxa de conveniência de 2% sobre R$ 150 = R$ 3,00 por serviço → +R$ 3 000/mês (para 1 000 serviços).
5. Considerações Finais
A rentabilidade inicial do LimpeJá baseia-se exclusivamente nos 15% de comissão.
Manter isenção de taxa ao cliente no lançamento fortalece a atração de usuários.
A adição de taxa de conveniência pode ser avaliada após consolidação do volume de transações e feedback do mercado.