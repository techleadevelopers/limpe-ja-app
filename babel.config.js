// LimpeJaApp/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',       // mantém o preset do Expo
      '@babel/preset-typescript' // necessário para Detox + Jest com TS
    ],
    plugins: [
      // 'expo-router/babel', // mantenha comentado se já estava assim
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@assets': './assets',
            '@3d': './assets/images/3d',
            '@constants': './constants',
            '@components': './components',
          },
          extensions: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.android.js',
            '.android.tsx',
            '.ios.js',
            '.ios.tsx',
            '.json',
          ],
        },
      ],
      'react-native-reanimated/plugin', // deixe por último
    ],
  };
};
