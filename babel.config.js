// LimpeJaApp/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 'expo-router/babel', // << REMOVA ESTA LINHA
      // Para os aliases de caminho como @/* que você configurou no tsconfig.json
      [
        'module-resolver',
        {
          root: ['./'], 
          alias: {
            '@': './', 
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
            '.json'
          ],
        },
      ],
      // Se você for usar o React Native Reanimated, adicione o plugin dele.
      // Certifique-se de que ele seja o último plugin da lista.
      // 'react-native-reanimated/plugin', 
    ],
  };
};