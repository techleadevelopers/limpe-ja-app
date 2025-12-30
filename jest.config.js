module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/android/',
    '/ios/',
    'services/api.test.ts',
    'hooks/useBookingQuote.test.tsx',
  ],
  roots: [
    '<rootDir>/app',
    '<rootDir>/components',
    '<rootDir>/contexts',
    '<rootDir>/hooks',
    '<rootDir>/services',
    '<rootDir>/utils',
    '<rootDir>/types',
  ],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^react-native/Libraries/BatchedBridge/NativeModules$':
      '<rootDir>/__mocks__/react-native/Libraries/BatchedBridge/NativeModules.js',
    '^services/(.*)$': '<rootDir>/services/$1',
    '^(?:\\.\\.\\/)+services/(.*)$': '<rootDir>/services/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  modulePaths: ['<rootDir>', '<rootDir>/node_modules'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo-router|@expo|expo|react-native-reanimated|react-native-gesture-handler|@sentry|@react-native-async-storage/async-storage|socket.io-client|react-native-toast-message)/)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
