// jest.config.js
module.exports = {
  // Use o preset 'ts-jest' para TypeScript
  preset: 'ts-jest',

  // *** ALTERAÇÃO CRÍTICA AQUI ***
  // Use o ambiente de teste customizado do Detox
  testEnvironment: '<rootDir>/environment.js',

  // Define o timeout para os testes. Detox recomenda um valor alto.
  // Movemos o timeout de jest.setup.js para cá.
  testTimeout: 400000,

  // *** ALTERAÇÕES CRÍTICAS AQUI ***
  // Configurações globais para Jest e Detox.
  // Estes são os hooks que o Jest executa antes e depois de TODOS os testes.
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',

  // Detox recomenda 'jest-circus' como o test runner
  testRunner: 'jest-circus/runner',

  // Inclui apenas arquivos .e2e.ts na pasta e2e
  testMatch: ['<rootDir>/**/*.e2e.ts'], // Ajustado para buscar dentro da pasta de testes

  // Transforma arquivos TS/TSX com ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Ignora node_modules, exceto se precisar transformar libs específicas
  transformIgnorePatterns: [
    'node_modules/(?!react-native|@react-native|@react-navigation)',
  ],

  // Você pode remover setupFilesAfterEnv se jest.setup.js não tiver outras configurações importantes
  // ou manter se você tiver outras configurações específicas para cada arquivo de teste.
  // Se jest.setup.js for apenas para o timeout, pode ser removido.
  setupFilesAfterEnv: [], // Removido se não houver outras configurações
};
