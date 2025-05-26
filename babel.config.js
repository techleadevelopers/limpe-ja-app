// LimpeJaApp/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Requerido para expo-router
      'expo-router/babel',
      // Para os aliases de caminho como @/* que você configurou no tsconfig.json
      [
        'module-resolver',
        {
          root: ['./'], // Define a raiz do projeto (onde está o tsconfig.json)
          alias: {
            '@': './', // Mapeia @ para a raiz do projeto
            // Se suas pastas como 'components', 'contexts', etc., estiverem dentro de 'src/',
            // você usaria:
            // root: ['./src'],
            // alias: {
            //   '@': './src',
            // }
            // Mas com base na nossa estrutura acordada, elas estão na raiz junto com 'app'.
          },
          extensions: [ // extensões que o resolver deve procurar
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