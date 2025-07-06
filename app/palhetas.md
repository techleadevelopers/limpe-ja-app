Mapa de Cores do Aplicativo: Detalhamento por Componente e Efeito
Este mapa de cores detalha a paleta utilizada no aplicativo, separando-a pelos componentes e efeitos visuais específicos onde cada cor ou gradiente é aplicado. A predominância de tons de azul com variações de opacidade e saturação é evidente, criando uma linguagem visual coesa e moderna.

1. CalendarHeader: Elegância na Navegação de Datas
O CalendarHeader emprega gradientes para um design suave e funcional, focando na clareza do mês atual.

Gradiente de Fundo do Cabeçalho (3 Cores):

Cores: ['rgba(173, 216, 230, 0.01)', 'rgba(135, 206, 250, 0.8)', 'rgba(100, 148, 237, 0)']

Efeito: Inicia com um azul muito claro e quase transparente, transita para um azul vibrante com alta opacidade e finaliza em um azul diferente, completamente transparente. Isso cria uma transição sutil e arejada no fundo do cabeçalho, permitindo que a luz ou os elementos abaixo transpareçam em partes.

Direção: Diagonal, do canto superior esquerdo para o inferior direito.

Gradiente de Destaque do Mês Atual (2 Cores):

Cores: ['rgba(109, 179, 253, 0.9)', 'rgba(12, 88, 170, 0.8)']

Efeito: Um gradiente mais intenso de azuis vibrantes e profundos com alta opacidade. Usado para realçar o mês atualmente selecionado, conferindo-lhe um aspecto "flutuante" e um contraste visual forte.

Direção: Diagonal, do canto superior esquerdo para o inferior direito.

Outras Cores no CalendarHeader:

Texto Mês Atual: Branco (#FFFFFF) - Alto contraste sobre o gradiente azul.

Texto Meses de Navegação: Cinza Suave (#666) - Diferencia os meses adjacentes, tornando-os secundários visualmente.

Sombra Mês Atual (Cor): Roxo/Violeta (#673AB7) - Um toque de contraste sutil para a sombra, adicionando profundidade ao destaque.

2. SuccessScreen: Confirmação Moderna e Dinâmica
A SuccessScreen utiliza múltiplos gradientes e cores para criar um ambiente visualmente rico e com feedback positivo.

Gradiente de Fundo da Tela (4 Cores):

Cores: ['#E0F7FA', '#B3E0FF', '#ADD8E6', '#CDE8F7']

Efeito: Uma sequência de tons de azul muito claros, que variam de um ciano a azuis padrão, criando um fundo geral suave, luminoso e calmante para a tela de sucesso.

Direção: Diagonal, espalhando-se um pouco para dentro das bordas (start={{ x: 0.1, y: 0.1 }}, end={{ x: 0.9, y: 0.9 }}).

Gradiente da "Bolha" Abstrata (3 Cores):

Cores: ['rgba(173, 216, 230, 0.4)', 'rgba(65, 153, 225, 0.15)', 'rgba(133, 168, 231, 0.05)']

Efeito: Cores azuis com altíssima transparência, que variam em saturação. Isso cria um objeto de fundo translúcido e etéreo, que se mistura suavemente com o fundo da tela enquanto se move e gira.

Direção: Diagonal, com pontos mais próximos do centro (start={{ x: 0.2, y: 0.2 }}, end={{ x: 0.8, y: 0.8 }}).

Outras Cores e Efeitos Visuais na SuccessScreen:

Azul Principal (Destacado): #4A90E2 - Usado para headerPrimaryColor e iconColor, indicando elementos-chave e ações.

Azul Secundário (Claro): #A8D8FF - Para headerSecondaryColor, complementando o azul principal em componentes específicos.

Cor de Sucesso (Verde): #28a745 - Um verde padrão e reconhecível para indicar conclusão bem-sucedida.

Fundo da Tela (Padrão): #F0F2F5 - Um cinza muito claro, serve como base de fallback, embora geralmente coberto por gradientes.

Efeito de Blur na Bolha: tint="light" - O desfoque aplicado à bolha tem um tom claro, reforçando a sensação de leveza e transparência.

Sombras: Utiliza preto com baixa opacidade (rgba(0, 0, 0, 0.1)) para criar profundidade em elementos, tanto no iOS (shadows) quanto no Android (elevation).