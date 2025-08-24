Relatório — Como usar o Motion Design System (Reanimated)
0) Visão rápida

O que é: pacote src/motion/ com tokens (tempos/curvas), provider (reduce motion), hooks (fade, press, stagger, count-up, accordion) e componentes (Section, Pressable, Skeleton).

Objetivo: padronizar animações, dar conforto visual e acelerar implementação.

1) Pré-requisitos & instalação
1.1 Reanimated configurado

babel.config.js (garanta o plugin antes de outros):

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};

1.2 Gradiente (shimmer do Skeleton)

Expo: expo install expo-linear-gradient

RN puro: yarn add react-native-linear-gradient && npx pod-install

1.3 (Opcional) alias de import

No tsconfig.json:

{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}


Ajuste seus imports para usar @/motion.

2) Onde ficam os arquivos

Coloque a pasta criada no canvas em:

src/motion/
  tokens.ts
  provider/MotionProvider.tsx
  hooks/...
  components/...
  index.ts

3) Plugando no app (root)
3.1 Envolva a árvore
// app/_layout.tsx (ou seu root)
import { MotionProvider } from '@/motion';

export default function RootLayout() {
  return (
    <MotionProvider>
      {/* sua navegação / providers */}
    </MotionProvider>
  );
}

3.2 (Opcional) override de tokens
<MotionProvider overrideTokens={{ duration: { md: 280 } }}>
  {children}
</MotionProvider>

4) Padrões de uso (receitas prontas)
4.1 Entrada suave de seção (Fade + SlideY)
import { AnimatedSection } from '@/motion';

<AnimatedSection delay={80}>
  <YourCard />
</AnimatedSection>


Use em: headers, cards, seções (dashboard, earnings, explore).

Dica: combine com useStaggerList para listas.

4.2 Lista em cascata (Stagger)
import { AnimatedSection, useStaggerList } from '@/motion';

const { getDelay } = useStaggerList({ baseDelay: 120, itemStep: 60 });

{items.map((item, i) => (
  <AnimatedSection key={item.id} delay={getDelay(i)}>
    <ListItem item={item} />
  </AnimatedSection>
))}

4.3 Feedback de toque (Press in/out com spring)
import { AnimatedPressable } from '@/motion';

<AnimatedPressable onPress={() => doAction()}>
  <CardPrimary />
</AnimatedPressable>


Use em: botões, cards clicáveis, quick actions, chips.

4.4 Contagem de KPI/valor (Count-up)
import { useCountUp, AnimatedSection } from '@/motion';

const { display } = useCountUp({
  from: 0, to: 12750.35, formatter: n => `R$ ${n.toFixed(2)}`
});

<AnimatedSection><Text>{display}</Text></AnimatedSection>


Use em: ganhos, totais, métricas, badges.

4.5 Acordeão (expand/colapse + chevron)
import { useAccordion } from '@/motion';

const { toggle, onContentLayout, containerStyle, chevronStyle } = useAccordion();

<TouchableOpacity onPress={toggle}>
  <Animated.View style={chevronStyle}><ChevronIcon/></Animated.View>
</TouchableOpacity>

<Animated.View style={containerStyle}>
  <View onLayout={onContentLayout}><Details/></View>
</Animated.View>


Use em: transações, filtros avançados, FAQ.

4.6 Skeleton com shimmer (carregamento elegante)
import { AnimatedSkeleton } from '@/motion';

<AnimatedSkeleton width="100%" height={120} radius={16} />


Use em: cards, listas, telas de dashboard enquanto busca dados.

5) Aplicações concretas por tela
5.1 (provider)/dashboard.tsx

Header / KPIs: AnimatedSection + useCountUp

Quick Actions: useStaggerList + AnimatedPressable

Solicitações/Próximos serviços: lista com getDelay(i)

Logout: AnimatedSection (fade out ao sair)

5.2 (provider)/earnings/index.tsx

Resumo & gráficos: AnimatedSection por bloco

Valor total: useCountUp sincronizado com o circular progress

Transações: useAccordion nos itens, Stagger na lista

5.3 (client)/bookings/*

Lista: AnimatedSection + Stagger

Detalhe: seções com AnimatedSection

PIX sucesso: shimmer/sutilezas + micro-interações nos botões

5.4 (common)/notifications/index.tsx

Itens: Stagger + AnimatedPressable

Swipe to dismiss: combine com lib de gestures (quando aplicar)

6) Acessibilidade & conforto

Reduce Motion: já suportado no MotionProvider (limita durações, remove deslocamentos).

Toques & tamanhos: mantenha áreas ≥ 44px.

Contraste: preserve contraste em estados animados.

Preferências do usuário: permita “reduzir animações” nas Settings se quiser complementar.

7) Performance & boas práticas

Sempre preferir Reanimated (worklet) para opacity/transform.

Evite animar height/width (exceto no acordeão que já trata isso).

Reaproveite hooks (não duplique lógicas de timing/easing).

Batch updates (carregue dados antes de acionar as entradas animadas).

Shimmer ao invés de loaders genéricos (melhor percepção de velocidade).

8) Padrões (tokens) a seguir

Durations padrão: xs:120, sm:180, md:250, lg:380, xl:520

Easings:

standard: tudo-uso

decel: entradas

accel: saídas

emphasized: destaques/contagem

Offsets: translateY md: 16 para entradas

Scale press: 0.96 (toque natural, não agressivo)

9) Troubleshooting

Erro “Reanimated plugin não encontrado”
→ Verifique plugin no babel.config.js e reinicie Metro (expo start -c).

Animações travando no iOS
→ Certifique-se de que o app está rodando com Hermes (Expo já cuida) e sem logs excessivos.

Skeleton parado
→ expo-linear-gradient instalado? O loop (withRepeat) está sendo chamado?

Glitches ao navegar
→ Evite useNativeDriver: false para opacity/transform (o sistema já usa Reanimated).

10) Checklist de adoção por tela

 Envolver app com MotionProvider

 Substituir botões por AnimatedPressable onde faz sentido

 Aplicar AnimatedSection em headers/cards

 Usar useStaggerList nas listas longas

 KPIs/valores com useCountUp

 Exibir AnimatedSkeleton durante fetch

 Respeitar Reduce Motion (já vem pronto)