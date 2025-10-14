/// <reference types="expo-router/types" />

// __DEV__ é global no RN, mas o TS precisa saber
declare const __DEV__: boolean;

// (Opcional) Se o editor ainda reclamar de expo-blur/linear-gradient,
// pode manter estes shims. Normalmente não é necessário.
declare module 'expo-blur';
declare module 'expo-linear-gradient';
