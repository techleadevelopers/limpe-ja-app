// LimpeJaApp/src/types/navigation.ts
// Este arquivo seria mais crucial se você estivesse usando React Navigation programaticamente
// para definir os tipos de parâmetros de cada rota. Com Expo Router, os tipos de
// parâmetros de rota são frequentemente inferidos ou podem ser definidos com useLocalSearchParams.
// No entanto, você ainda pode querer tipos para props de tela se as passar explicitamente.

// Exemplo para props de tela (se não usar useLocalSearchParams para tudo)
// Para uso com Stack.Screen<ParamList, 'RouteName'> ou NativeStackScreenProps
// Você precisaria definir suas ParamLists para cada navegador.

// Exemplo genérico para parâmetros de rota que podem ser acessados via useLocalSearchParams
export type ProviderDetailsRouteParams = {
  providerId: string;
};

export type BookingDetailsRouteParams = {
  bookingId: string;
};

export type ChatRouteParams = {
  chatId?: string; // Pode ser 'new' ou um ID existente
  recipientId?: string;
  recipientName?: string;
  bookingId?: string; // Contexto opcional para o chat
};

export type FeedbackRouteParams = {
  targetId: string;
  type?: 'service' | 'provider_profile' | 'app_feedback';
  serviceName?: string;
  providerName?: string;
};

// Para tipar os navegadores se você precisar acessar o objeto de navegação com tipos fortes
// Exemplo para o Client Tab Navigator (se você estivesse definindo programaticamente)
// export type ClientTabParamList = {
//   ExploreStack: NavigatorScreenParams<ExploreStackParamList>; // Se Explore for um Stack
//   explore: undefined; // Se explore for uma tela direta na tab
//   bookings: undefined;
//   messages: undefined;
//   profile: undefined;
// };

// export type ExploreStackParamList = {
//   ExploreHome: undefined;
//   SearchResults: { query?: string; location?: string };
//   ProviderDetails: ProviderDetailsRouteParams;
// };

// E assim por diante para outros navegadores e stacks...
// Com Expo Router, muito disso é implícito ou tratado por useLocalSearchParams e useGlobalSearchParams.
// Você pode criar tipos para os resultados de useLocalSearchParams se quiser mais segurança:
// const params = useLocalSearchParams<ProviderDetailsRouteParams>();