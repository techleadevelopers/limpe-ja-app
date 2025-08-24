Princípios de Motion & Conforto

Primeiro conforto, depois espetáculo
Transições devem reduzir choque visual, orientar o olhar e nunca atrapalhar a leitura.

Temporalidade previsível
Durações consistentes por tipo de ação (entrada, feedback de toque, destaque numérico).

Hierarquia visual guiada por movimento
Itens principais entram primeiro, complementares depois (stagger leve).

Acessibilidade sempre
Respeitar “Reduzir Movimento” encurtando durações/offsets sem quebrar fluxo.

Catálogo de Efeitos (como aplicar)
A. Entradas & Transições

Fade-in + Slide-up curto
Uso: seções, cards, listas, headers.
Parâmetros: duration 220–280ms, translateY 12–18, easing decel.
Objetivo: aparição suave que guia o olhar para o topo do bloco.

Stagger leve (cascata)
Uso: listas, grupos de botões/cards.
Parâmetros: delay step 40–70ms, máximo de 6–8 itens por onda.
Objetivo: percepção de ordem e progressão sem parecer lento.

Scale-in sutil
Uso: badges/kpis/mini highlights em dashboards.
Parâmetros: de 0.98 → 1.0, duration 160–200ms, easing emphasized.
Objetivo: “acordar” pequenos destaques sem chamar atenção demais.

B. Feedback de Interação (Toque/Press)

Press-in scale (spring)
Uso: botões, cards clicáveis, ações rápidas, chips.
Parâmetros: toValue 0.96, spring damping 14–16, stiffness 220–260.
Objetivo: resposta tátil imediata e natural.

Press-out relax (spring)
Uso: retorno ao estado normal após o toque.
Parâmetros: voltar a 1.0 com mesma mola, sem overshoot visível.
Objetivo: confirmar ação sem “pular” demais.

Pulso convidativo (loop)
Uso: ação primária em contextos críticos (ex.: confirmar), slots disponíveis.
Parâmetros: scale 1.0 ↔ 1.03, loop 1.5–2.5s, easing inOut.
Objetivo: chamar atenção com sutileza, sem distração contínua.

C. Estado, Conteúdo & Leitura

Accordion (expand/colapse)
Uso: detalhes, filtros avançados, transações.
Parâmetros: altura animada, duration 220–260ms, easing standard; rotacionar chevron 0–180°.
Objetivo: revelação fluida sem “quebras” no layout.

Count-up numérico
Uso: KPIs, ganhos, totais.
Parâmetros: duration 380–520ms, easing emphasized, atualização legível (locale/mascara).
Objetivo: sensação de progresso e “conquista” ao carregar números.

Skeleton com shimmer
Uso: placeholders de cards/listas durante fetch.
Parâmetros: barra de luz 1.2–1.6s; contraste baixo.
Objetivo: percepção de velocidade e polimento enquanto dados chegam.

D. Realce & Micro-interações

Reflexo/“shine” em superfícies
Uso: barras, headers com gradiente, cartões “glass”.
Parâmetros: faixa luminosa translúcida com translação lenta (2–3s).
Objetivo: premium feel sem competir com conteúdo.

Flutuação de background (parallax leve)
Uso: banners/artefatos decorativos.
Parâmetros: deslocamento 2–6px, ciclo 3–5s.
Objetivo: profundidade sutil, zero distração.

Respiração de calendário/chips
Uso: estados “ativo/selecionado”.
Parâmetros: scale 1.0 ↔ 1.02, 2–3s, pausa longa.
Objetivo: sensação orgânica de “vivo” sem ruído.

Tokens de Motion (recomendados)

Durações

xs 120ms (micro feedback)

sm 180ms (chips, itens pequenos)

md 250ms (cards/seções padrão)

lg 380ms (transições de tela/áreas grandes)

xl 520ms (destaques/celebrações)

Easings

standard: geral (bezier ~[0.2,0,0,1])

decel: entradas (suave no final)

accel: saídas (rápido para fora)

emphasized: destaques/springs leves

Offsets

translateY md: 16 (12–18 aceitável)

scale press: 0.96

stagger step: 50–60ms

Acessibilidade

“Reduzir Movimento” ⇒ durações 0–120ms, offsets ≈ 0, desliga loops decorativos.

Paleta de Cores (com papéis)
Azuis (marca/destaques)

Primário Interativo: #4A90E2
Botões primários, ícones ativos, realces importantes.

Primário Escuro (confirmação/seleção): #2A72E7
Estados pressed, confirmações, preços.

Links e Ações Secundárias: #007AFF
CTAs secundários, links contextuais.

Ações Relevantes/Brand Support: #1A73E8 / #4285F4
Gradientes, cabeçalhos, ações de ênfase moderada.

Gradientes & fundos azuis

Fundos suaves: #E0F7FA, #B3E0FF, #ADD8E6, #CDE8F7
Seções amplas, telas de sucesso.

Decorações translúcidas:
rgba(66,165,245,0.08), rgba(144,202,249,0.06), rgba(121,134,203,0.05), rgba(129,140,248,0.08)
Bolhas, overlays decorativos.

Nav/Barra/Detalhes: #67ADFDFF, #5C93ECFF, #7694F6FF, #BFD4F7C3, #9EC2F1FF
Banners, search bar, tabs.

Verdes (sucesso/positivo)

Sucesso padrão: #28A745
Estados concluídos, badges positivos.

Sucesso forte: #218838
Pressed/confirm pressed, toques finais.

Hoje/indicadores especiais: #00BFA5, #4CAF50
Calendário, pontos, gamificação.

Amarelos (atenção/avaliação)

Destaque/estrela: #FFD700 / #FFC107
Ratings, pontos, chips de destaque.

Neutros (fundo/legibilidade)

Fundos: #FFFFFF, #F0F2F5, #F8FAFB, #F4F7FC, #F0F8FF, #F5F5F5

Bordas/inputs: #E0E0E0, #CED4DA, #E9ECEF, #DDEEFF, #F0F0F0

Texto:
Títulos: #2C3E50, #212529
Corpo: #333, #475569, #495057
Auxiliar: #666, #777, #868E96

Vermelhos (erro/destrutivo)

Erro/alerta: #D32F2F

Ação destrutiva: #E74C3C

Contextos sensíveis: #FFE0E6, #FFC0CB, rgba(211,47,47,0.05)

Regras de Aplicação de Cor (papel → componente)

CTA primário: fundo #4A90E2, pressed #2A72E7, texto branco.

CTA secundário (link): texto #007AFF, sem preenchimento pesado.

Estados de foco/seleção: borda #2A72E7 com glow rgba(42,114,231,0.25).

Feedback sucesso/erro: texto/ícone verdes/vermelhos, fundos rgba(cor, 0.06–0.12).

Cards: fundo branco, sombra leve rgba(0,0,0,0.06–0.12), raio 16–24.

Gradientes de header/banner: misture #4285F4 → #1A73E8 com brilho diagonal suave.

Padrões de Tipografia & Layout

Títulos (H1/H2): 18–22px, peso 700–800, cor #2C3E50.

Subtítulos/labels: 12–16px, peso 500–600, cinzas médios.

Valores/Preços: 16–24px, peso 700–900, azul/verde quando relevante.

Texto de botão: 13–17px, peso 600–700, alto contraste.

Line-height generoso em blocos descritivos; textShadow mínimo em títulos-chave.

Do / Don’t (qualidade e performance)

DO

Animar opacity e transform (60fps no thread nativo).

Reusar timings/easings (consistência perceptiva).

Limitar loops decorativos a telas específicas.

Aplicar stagger apenas quando melhora leitura.

DON’T

Animar height/width com alta frequência (use container/measure para expand/collapse).

Exagerar offsets (desalinha layout e cansa).

Usar cores vibrantes para longos fundos (prefira translúcidas/tons claros).

Criar “surpresas” de navegação (mantenha previsibilidade).

Acessibilidade & Conforto

Reduzir Movimento: encurte ou remova deslocamentos; mantenha fades curtos.

Áreas tocáveis ≥ 44px, contraste AA/AAA em botões/links.

Estados visuais claros: foco, pressed, disabled distintos.

Receitas Rápidas (padrões prontos)

Seção padrão: Fade-in + Slide-up (250ms, 16px, decel)

Lista: Stagger 60ms + Fade-in

Botão: Press-in 0.96 (spring) / Press-out 1.0

KPI: Count-up 380–520ms + Fade-in

Detalhe revelado: Accordion 240ms + Chevron 0–180°

Carregamento: Skeleton shimmer 1.3–1.6s