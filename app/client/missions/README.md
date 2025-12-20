README — Módulo Missões (Front-end / React Native + Expo Router)

Este guia documenta arquitetura, componentes, props, estados, efeitos de motion, cores e integrações do módulo de Missões no app do cliente. Inclui exemplos de código reais, práticas de acessibilidade/telemetria e um roadmap de melhorias avançadas.

A tela base referenciada aqui é app/(client)/home/missions.tsx. 

1) Visão geral

Objetivo: aumentar retenção e frequência de compra com tarefas claras, progresso visível e recompensas (cupons/pontos).

Fluxo do usuário: abrir Minhas Missões → ver lista (ativas / concluídas / elegíveis) → progredir → claim da recompensa → deep-link para usar a vantagem.

Stack: Expo Router (Stack.Screen), RN Animated (fade/slide), RefreshControl, tema por useColorScheme + Colors, serviço missionService (getMyMissions, claimMission).

2) Arquitetura & State
MissionsScreen
 ├── Custom Header (back, título)
 ├── <ScrollView refreshControl=...>
 │    └── <MissionList
 │          missions
 │          onClaimMission
 │          isRefreshing
 │          claimingMissionId
 │        />
 └── (Globais: Toast, Alert)


Estados chave

allMissions: MissionItemType[] — fonte de verdade.

isLoading / isRefreshing — loading inicial e pull-to-refresh.

claimingMissionId — bloqueia o botão de claim enquanto processa.

Efeitos

Animated.timing no header e conteúdo (fade + slide).

useEffect inicial para:

animar header/conteúdo,

loadMissions() (fetch com tratamento de erro + Toast).

3) Tema & Cores

O módulo usa um hook simples de tema:

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}


Chaves de cor usadas

theme.primary – header / ícones ativos.

theme.textLight – texto sobre o header.

theme.background – fundo da tela.

theme.textMuted – feedback/sutilezas.

Padrões recomendados (mantidos no Colors.ts):

Azuis (brand): #4A90E2 primário; #2A72E7 pressed; links #007AFF.

Fundos claros: #F0F8FF, #F8FAFB.

Texto: títulos #2C3E50, corpo #333, auxiliar #6C757D.

4) Motion & Conforto

Tokens (sugestão consistente no app)

duration.md = 250ms (entradas de bloco).

easing.decel para entrada; easing.standard geral.

offsetY = 16 no slide inicial.

Padrões aplicados

Header: fade + slide-down (500ms).

Conteúdo: fade + slide-up (700ms, delay:100ms).

Botões/itens: press-in spring (scale:0.96) e relax-out.

Respeitar “Reduzir Movimento” (iOS/Android): reduzir durações e offsets; desativar loops decorativos.

5) Componentes
5.1 <MissionList />

Props

missions: MissionItemType[]

onClaimMission(id: string): Promise<void>

isRefreshing: boolean

claimingMissionId: string | null

Responsabilidades

Renderizar cards de missões.

Delegar “claim” para onClaimMission.

Exibir estado vazio com ilustração.

5.2 <MissionItem />

Props sugeridas

item: MissionItemType

onClaim(id: string)

disabled?: boolean (quando claimingMissionId === item.id)

style?

UI/Estados

Ativa (em progresso): barra de progresso current/target.

Pronta para claim: CTA “Resgatar” (primário).

Concluída: selo/check + CTA secundário “Ver recompensa”.

Micro-interações

Press-in scale no card e no CTA.

Shimmer opcional no placeholder de progresso.

5.3 <MissionReminderCard />

Banner contextual (ex.: “Você está a 1 passo de ganhar R$10”).

Dismissable (ícone X) → persistir em AsyncStorage/kv por 48h.

Ação secundária: “Ver detalhes”.

5.4 <MissionProgressSnack />

Snack flutuante (slide-in pelo bottom) para evolução de progresso:

Ex.: “2/3 concluídas — Falta pouco!” com progress ring.

Auto-dismiss em 4–6s; botão “Continuar”.

6) Serviço & Contratos (API)
6.1 Fetch
const missions = await getMyMissions(MissionAudience.CLIENT);


Back-end: preferir GET /missions?audience=CLIENT.
Se seu serviço estiver chamando GET /missions/client e o back não expor essa rota, retornará 404 — alinhe o controller ou ajuste o service do front.

DTO mínimo (MissionItemType)

type MissionItemType = {
  id: string;
  code: string;
  title: string;
  description?: string;
  audience: 'CLIENT' | 'PROVIDER';
  kind: 'COUNT_EVENT' | 'WITHIN_WINDOW' | 'STREAK_DAYS';
  status: 'ACTIVE' | 'READY_TO_CLAIM' | 'COMPLETED' | 'EXPIRED';
  currentValue?: number;
  targetValue?: number;
  rewardType: 'COUPON' | 'POINTS';
  rewardValue?: number;         // pts ou centavos
  couponTemplateId?: string;
  expiresAt?: string;           // ISO
};

6.2 Claim
const res = await claimMission(missionId); // { ok: boolean, reason?: string }


Em sucesso: emitir cupom ou adicionar pontos (decidido pelo back).

Idempotência: repetir chamadas deve retornar o mesmo resultado sem duplicar recompensa.

7) Exemplo de tela (trecho essencial)
export default function MissionsScreen() {
  const theme = useTheme();
  const [allMissions, setAllMissions] = useState<MissionItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string|null>(null);

  const loadMissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getMyMissions(MissionAudience.CLIENT);
      setAllMissions(data);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Erro', text2: e?.response?.data?.message || 'Falha ao carregar.' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadMissions(); }, [loadMissions]);

  const handleClaimMission = async (id: string) => {
    try {
      setClaimingMissionId(id);
      const { ok, reason } = await claimMission(id);
      ok ? Alert.alert('Sucesso', 'Recompensa resgatada!') : Alert.alert('Erro', reason ?? 'Tente novamente.');
      await loadMissions();
    } finally {
      setClaimingMissionId(null);
    }
  };

  return (
    <View style={{ flex:1, backgroundColor: theme.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={loadMissions} />}
      >
        <MissionList
          missions={allMissions}
          onClaimMission={handleClaimMission}
          claimingMissionId={claimingMissionId}
          isRefreshing={isRefreshing}
        />
      </ScrollView>
    </View>
  );
}

8) Acessibilidade

Alvos de toque ≥ 44px.

Anunciar progresso com accessibilityLabel (ex.: “Missão 2 de 3 concluída”).

Respeitar Reduce Motion.

Contraste AA para CTA primário (texto branco sobre azul).

9) Telemetria (eventos)

Dispare via seu analytics:

mission_viewed, mission_scrolled

mission_claim_clicked, mission_claim_succeeded, mission_claim_failed

mission_progress_snack_shown/dismissed

mission_banner_dismissed, mission_banner_cta_clicked

Payload: { missionId, code, audience, kind, status, currentValue, targetValue }.

10) Testes

Unidade: formatação de progresso, habilitação do botão claim.

Integração (msw): getMyMissions e claimMission (200/4xx/5xx).

Visuais: estados loading, vazio, erro, READY_TO_CLAIM.

A11y: auditoria de roles/labels e contraste.

E2E (Detox): fluxo “claim” → ver cupom/pontos → voltar.

11) Erros comuns & soluções

404 em /missions/client: alinhe para GET /missions?audience=CLIENT ou implemente a rota no back.

Botão “Resgatar” libera spam: sempre trave por claimingMissionId e trate idempotência no back.

Tema divergente no header: use theme.primary + theme.textLight e evite hard-code.

12) Plano de refatoração

Migrar para Zustand/Redux slice missions (cache + selectors).

react-query/@tanstack/query para cache, retry/backoff e optimistic update do claim.

Extrair tokens de motion e tokens de cor para módulos globais.

Componentizar ProgressBar/ProgressRing reutilizáveis (Lottie opcional).

13) Melhorias avançadas (UX que engaja sem cansar)

Streak semanal com progress ring

Animação de count-up ao abrir; confetti (Lottie) ao completar.

Bônus crescente por semanas consecutivas (exibir “+10% pontos”).

Missions dinâmicas (DDA light)

Ajustar metas ao perfil: quem conclui rápido recebe desafios um pouco mais difíceis, mantendo flow.

Feed de progresso proativo

Snack “Falta 1 para ganhar R$10” quando um booking é concluído.

Lembretes T-24h para missões que expiram (push + in-app).

Card “Quase lá” na Home

Mini-card fixo com CTA direto para a ação que falta (ex.: “Avaliar serviço”).

Economia clara da recompensa

Para cupons: mostrar “Economize até R$10 hoje”.

Para pontos: “+200 pontos (~R$4 em créditos)”.

Haptics

Selection no scroll da lista; success no claim; warning em erros.

Gamificação social (leve)

“Seus amigos estão no nível Ouro” (privacy-safe). Badge temporário para top 10% da região.

A/B Testing nativo

Título, cópia, CTA, animações e timings como flags configuráveis (Remote Config / app_config).

Acessibilidade reforçada

Alternativa sem animação (modo conforto), textos maiores e voice hints curtos ao progredir.

Offline-first

Cache de missões + fila de claim com reenvio quando voltar a rede.

14) Check-list de entrega (produção)

 Contratos API validados (GET /missions?audience=CLIENT, POST /missions/:id/claim).

 Estados (loading/empty/error/ready/completed) cobertos visualmente.

 Claim idempotente + bloqueio por claimingMissionId.

 Telemetria mission_* integrada ao funil.

 Acessibilidade (Reduce Motion, contraste, targets).

 QA com dados de seed contemplando: ativa, pronta pra claim, concluída e expirada.

Anexo — Snippet de MissionItem (press-in + claim bloqueado)
const MissionItem = ({ item, onClaim, disabled }: Props) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const claimDisabled = disabled || item.status !== 'READY_TO_CLAIM';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity activeOpacity={0.9} onPressIn={pressIn} onPressOut={pressOut}>
        {/* conteúdo do card */}
        <Button
          title="Resgatar"
          onPress={() => onClaim(item.id)}
          disabled={claimDisabled}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};
