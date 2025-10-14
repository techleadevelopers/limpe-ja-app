// LimpeJaApp/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-typescript',
    ],
    plugins: [
      // 'expo-router/babel',
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
      // Remove consoles no build de produção (mantém error/warn)
      ...(process.env.NODE_ENV === 'production'
        ? [[
            'babel-plugin-transform-remove-console',
            { exclude: ['error', 'warn'] },
          ]]
        : []),
      'react-native-reanimated/plugin', // deixe por último
    ],
  };
};
