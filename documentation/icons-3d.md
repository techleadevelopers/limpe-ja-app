) Inventário de PNGs (nome do arquivo → caminho absoluto)

Todos em: /assets/images/3d/

+ticket.png

bookmark.png

calender.png (mantive o nome como está no arquivo; se preferir corrigir para calendar.png, avise)

call.png

cam.png

cashback.png

champions.png

champions2.png

chat.png

chat2.png

check.png

crown.png

doc-check.png

doc-check2.png

doc-check3.png

document.png

document2.png

flame.png

flame2.png

gift.png

gift2.png

like.png

like2.png

location.png

map.png

medical.png

notification.png

panic-sos.png

payments.png

perfil.png

podium.png

policies.png

price.png

price2.png

privacidade.png

qrcode.png

qrcode2.png

rating.png

rating2.png

rating3.png

security.png

share.png

step1-card-profile.png

step2-book-calendar.png

support.png

support2.png

ticket.png

ticket3.png

tickets.png

time.png

time2.png

time3.png

uptrend.png

Arquivos com sufixo 2/3 são reservas/variantes do mesmo tema — podemos alternar via A/B, tema escuro/claro ou densidade (p.ex., chat.png e chat2.png).

2) Onde injetar (mapeamento por módulo/área)
A. Header superior (todas as telas principais)

Hamburger mini-menu (abre lateral “Settings/Quick Actions”): menu padrão do app + chat.png à direita (atalho de mensagens), notification.png (alertas), perfil.png (avatar/conta).

Ação global de busca (quando aplicável): map.png ou location.png (quando a busca é geolocalizada).
Animações: fade+scale-in ao montar; onPress = scale 0.96 + Haptics leve; badge de notificação com micro-pulso.

B. Menu lateral (side-sheet) aberto pelo mini-hamburger

Sessões e ícones:

Profile & Account: perfil.png, privacidade.png, policies.png, doc-check.png

Pagamentos: payments.png, qrcode.png, price.png

Cupons & Cashback: ticket.png, cashback.png, gift.png

Missões & Ranking: step1-card-profile.png, step2-book-calendar.png, rating.png, crown.png, podium.png

Suporte & Segurança: support.png, document.png (abrir ticket), panic-sos.png, security.png, medical.png

Sobre/Compartilhar: share.png, bookmark.png
Animações: slide-in da direita (easing out-quad, 350ms), overlay com fade 0→0.35; cada item entra com stagger (20–30ms) em translateX + fade.

C. Home/Explore do cliente

Banner / Carrossel de ofertas: gift2.png, ticket.png, cashback.png

Categorias/Mapa/Por perto: map.png, location.png, call.png, cam.png, share.png

Avisos/Boas-vindas: notification.png (badge leve), step1-card-profile.png
Animações: parallax sutil no carrossel; pulse respirando no cupom durante 1s depois de aparecer; slide-up nos cards.
(A doc já prevê CouponWelcome/ReturnCoupon etc.; ícones plugam direto.) 

D. Missões (cliente e provedor)

Stepper: step1-card-profile.png (perfil), step2-book-calendar.png (agendar), rating3.png (avaliar), gift.png (benefícios).

Progresso: rating2.png/rating.png (estrela), uptrend.png (tendência), time2.png (tempo restante).

Recompensas: ticket3.png, cashback.png, gift2.png, check.png (claim OK).
Animações: barra/ring de progresso com preenchimento animado; claim button com micro-bounce; shimmer suave no item “pronto para resgate”.
(Compatível com MissionList, MissionProgressSnack, MissionReminderCard.) 

E. Ranking / Leaderboard

Topo (pódio): crown.png, podium.png, champions.png/champions2.png (troféus alternativos).

Linhas da tabela: rating.png (score), uptrend.png (subiu), time3.png (SLA).
Animações: scale-in para top-3; confete sutil ao ganhar posição (+ shimmer breve no nome).

F. Segurança (Safety)

Botão SOS flutuante: panic-sos.png

Hub de Segurança: security.png (shield), medical.png, flame2.png, doc-check2.png (políticas).
Animações: glow respirando no SOS; slide-up dos cards; sombra suave com blur.
(Alinha com FAB_SOS e telas /safety.) 

G. Suporte

Abertura de ticket: +ticket.png, ticket.png, tickets.png

Estados: time.png (pendente), check.png (fechado)

Chat do ticket: chat2.png
Animações: slide-in vertical dos cards; tap com spring e Haptics.

H. Pagamentos e PIX

payments.png, qrcode.png/qrcode2.png, price2.png
Animações: fade-in + leve tilt ao exibir QR; check com pop no sucesso.

I. Notificações

notification.png no header + badge; nos itens, ícone contextual (document2.png, support.png, ticket.png, etc.).
Animações: entrada por translateY (8–12px) + fade; “marcar lida” com shrink/fade.

J. Perfil & Preferências

perfil.png (avatar), privacidade.png (privacidade), policies.png (termos), bookmark.png (favoritos).
Animações: stagger na lista; ícones com hover lift (translateY −2px no pressIn).

3) Injeção limpa no código (sem ../../) — alias + map
3.1. Configure alias para assets

babel.config.js

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        alias: {
          '@assets': './assets',
          '@3d': './assets/images/3d'
        }
      }]
    ],
  };
};


tsconfig.json

{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@assets/*": ["assets/*"],
      "@3d/*": ["assets/images/3d/*"]
    }
  }
}


Agora você pode importar direto:
import CrownPng from '@3d/crown.png';

3.2. Mapa tipado (centralizado)

src/constants/icons3d.ts

export const Icons3D = {
  ticketAdd: require('@3d/+ticket.png'),
  bookmark: require('@3d/bookmark.png'),
  calendar: require('@3d/calender.png'),
  call: require('@3d/call.png'),
  cam: require('@3d/cam.png'),
  cashback: require('@3d/cashback.png'),
  champions: require('@3d/champions.png'),
  champions2: require('@3d/champions2.png'),
  chat: require('@3d/chat.png'),
  chat2: require('@3d/chat2.png'),
  check: require('@3d/check.png'),
  crown: require('@3d/crown.png'),
  docCheck: require('@3d/doc-check.png'),
  docCheck2: require('@3d/doc-check2.png'),
  docCheck3: require('@3d/doc-check3.png'),
  document: require('@3d/document.png'),
  document2: require('@3d/document2.png'),
  flame: require('@3d/flame.png'),
  flame2: require('@3d/flame2.png'),
  gift: require('@3d/gift.png'),
  gift2: require('@3d/gift2.png'),
  like: require('@3d/like.png'),
  like2: require('@3d/like2.png'),
  location: require('@3d/location.png'),
  map: require('@3d/map.png'),
  medical: require('@3d/medical.png'),
  notification: require('@3d/notification.png'),
  panic: require('@3d/panic-sos.png'),
  payments: require('@3d/payments.png'),
  profile: require('@3d/perfil.png'),
  podium: require('@3d/podium.png'),
  policies: require('@3d/policies.png'),
  price: require('@3d/price.png'),
  price2: require('@3d/price2.png'),
  privacy: require('@3d/privacidade.png'),
  qrcode: require('@3d/qrcode.png'),
  qrcode2: require('@3d/qrcode2.png'),
  rating: require('@3d/rating.png'),
  rating2: require('@3d/rating2.png'),
  rating3: require('@3d/rating3.png'),
  security: require('@3d/security.png'),
  share: require('@3d/share.png'),
  stepProfile: require('@3d/step1-card-profile.png'),
  stepCalendar: require('@3d/step2-book-calendar.png'),
  support: require('@3d/support.png'),
  support2: require('@3d/support2.png'),
  ticket: require('@3d/ticket.png'),
  ticket3: require('@3d/ticket3.png'),
  tickets: require('@3d/tickets.png'),
  time: require('@3d/time.png'),
  time2: require('@3d/time2.png'),
  time3: require('@3d/time3.png'),
  uptrend: require('@3d/uptrend.png'),
} as const;

export type Icon3DKey = keyof typeof Icons3D;

3.3. Componente de ícone com animações suaves

src/components/ui/Icon3D.tsx

import React, { useRef } from 'react';
import { Animated, ImageProps, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icons3D, Icon3DKey } from '../../constants/icons3d';

type Props = {
  name: Icon3DKey;
  size?: number;          // default 28
  onPress?: () => void;
  testID?: string;
};

export default function Icon3D({ name, size = 28, onPress, testID }: Props) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.96, friction: 4, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();

  const pressable = !!onPress;

  const Img = (
    <Animated.Image
      testID={testID}
      source={Icons3D[name]}
      style={{ width: size, height: size, transform: [{ scale }], opacity }}
      resizeMode="contain"
    />
  );

  if (!pressable) return Img;

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={8}
    >
      {Img}
    </Pressable>
  );
}


Uso:
<Icon3D name="crown" size={36} onPress={() => router.push('/(client)/ranking')} />

3.4. Preload (opcional)

No app root (por ex., _layout.tsx), faça:

import { Asset } from 'expo-asset';
import { Icons3D } from './src/constants/icons3d';
await Asset.loadAsync(Object.values(Icons3D));

4) Menu lateral (side-sheet) plug-and-play

Botão mini-hamburger no header direito abre <RightSideSheet />.

A folha mostra atalhos com os ícones mapeados acima (Perfil, Pagamentos, Cupons, Missões, Ranking, Suporte, Segurança, Configurações).

Fechamento por tap no overlay ou arrastar 12–16px para direita (gesture handler opcional).

Essa entrada lateral organiza navegação “Minha conta / Minhas métricas / Cupons / Ranking / Suporte / Segurança”, reforçando os fluxos descritos na documentação do projeto. 

5) Padrões de animação (reutilizáveis)

Entrada: translateY(10) → 0 + opacity 0 → 1 (220–300ms).

Press: scale 1 → 0.96 → 1 com spring suave + Haptics leve.

Pulse (para chamar atenção moderada): scale 1 ↔ 1.04 loop 1–2x na primeira renderização.

Badges: micro-pulse 1x quando contador muda.

Conclusão

Lista completa de PNGs pronta.

Caminhos absolutos via alias @3d para evitar ../../.

Mapeamento de injeção por área do app com animações premium.

Componente Icon3D centraliza comportamento e facilita manutenção.

Menu lateral no header superior dá acesso rápido a Cupons, Ranking, Safety, Suporte e mais — UX consistente com a arquitetura e fluxos do projeto. 

Se quiser, te mando também o RightSideSheet.tsx completo já com os itens e ícones mapeados nos