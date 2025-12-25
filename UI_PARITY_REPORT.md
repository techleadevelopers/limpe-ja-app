# Relatório de Paridade UI

## Arquivos alterados
- `app/_shared/ui/parity.ts`: camada central para sombras, texto, inputs e pressables no Android (`shadow`, `textBase`, `inputBase`, `pressableBase`, `mergeStyles`).  
- `components/common/Button.tsx`: o botão base agora usa `shadow(2)`, `pressableBase()` + ripple controlado e `textBase` no texto.  
- `components/common/PrimaryButton.tsx`: animação continua, mas o container usa `shadow(3)` e aplica `textBase`/`overflow` para manter o visual do iOS no Android.  
- `components/common/Card.tsx`: o cartão usa `shadow(2)` em vez de propriedades hardcoded.  
- `components/common/TextInputWithIcon.tsx`: o campo reaplica `textBase`, `inputBase` e `shadow(1)` no ícone para garantir lineHeight/padding pareados.  
- `components/common/ScreenContainer.tsx`: substitui o container genérico por `SafeAreaView` + `KeyboardAvoidingView` com ajustes de insets e offsets para o Android.

## Padrões aplicados
- **Sombras unificadas**: `shadow(n)` agora padroniza cards e botões críticos (`components/common/Card.tsx:25`, `components/common/Button.tsx:109`, `components/common/PrimaryButton.tsx:108`, `components/common/TextInputWithIcon.tsx:148`).  
- **Texto alinhado**: `textBase` remove `includeFontPadding` e ajusta `lineHeight`/`letterSpacing` em `Button` e `PrimaryButton` (`components/common/Button.tsx:101`, `components/common/PrimaryButton.tsx:99`).  
- **Inputs com alinhamento vertical**: `inputBase()` centraliza o cursor no Android enquanto preserva o estilo atual (`components/common/TextInputWithIcon.tsx:111`).  
- **Pressables limpos**: `pressableBase()` entrega `overflow: 'hidden'` e ripple transparente para os botões principais (`components/common/Button.tsx:85`, `components/common/PrimaryButton.tsx:81`).  
- **SafeArea + teclado**: `ScreenContainer` agora usa `SafeAreaView`, `KeyboardAvoidingView` e ajustes de offsets (StatusBar + insets) para que o notch ou teclado não cortem o conteúdo (`components/common/ScreenContainer.tsx:33-101`).

## Top 10 telas com gaps Android → iOS corrigidos
1. `app/auth/login.tsx`: herda botões e inputs com `shadow`, ripple controlado e `inputBase` para evitar textos desalinhados e sombras “pesadas”.  
2. `app/auth/forgot-password.tsx`: mesma base de botões e campos, agora com `textBase` e `inputBase` para manter o espaçamento iOS.  
3. `app/auth/client-register.tsx`: forms com múltiplos `TextInputWithIcon` agora centralizam o conteúdo do keyboard.  
4. `app/client/bookings/index.tsx`: os cards de agendamento usam `components/common/Card` e o container geral respeita SafeArea + KeyboardAvoidingView.  
5. `app/client/profile/edit.tsx`: formulários de perfil compartilham `TextInputWithIcon` e recebem os ajustes de texto/padding.  
6. `app/client/explore/index.tsx`: botões e cartões reutilizam a camada de sombra e ripple para ficar visualmente idêntico ao iOS.  
7. `app/client/coupons/index.tsx`: a pilha de cards se apoia na nova `shadow(n)` e nos botões limpos.  
8. `app/client/support/index.tsx`: `ScreenContainer` garante que o SafeArea/teclado não “coma” entradas longas.  
9. `app/client/messages/[chatId].tsx`: botões e inputs dentro do chat passam a usar `textBase`/`inputBase` e a rolagem respeita o notch.  
10. `app/provider/withdraw/index.tsx`: cards de saldo e botões críticos agora replicam o look iOS graças a `shadow`, `pressableBase` e ao container atualizado.

## Checklist manual (15 rotas principais para comparar)
- `app/auth/login.tsx`
- `app/auth/forgot-password.tsx`
- `app/auth/client-register.tsx`
- `app/client/bookings/index.tsx`
- `app/client/profile/edit.tsx`
- `app/client/explore/index.tsx`
- `app/client/coupons/index.tsx`
- `app/client/notifications/index.tsx`
- `app/client/support/index.tsx`
- `app/client/messages/[chatId].tsx`
- `app/provider/index.tsx`
- `app/provider/dashboard.tsx`
- `app/provider/services/index.tsx`
- `app/provider/schedule/manage-availability.tsx`
- `app/provider/withdraw/index.tsx`

