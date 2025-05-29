// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Forçando o Metro a encontrar o tslib na node_modules da raiz
config.resolver = config.resolver || {}; // Garante que config.resolver exista
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}), // Preserva outros extraNodeModules se houver
  tslib: path.resolve(projectRoot, 'node_modules/tslib'),
};

// Se você estiver em um monorepo, você pode precisar ajustar os watchFolders.
// Para um projeto Expo padrão, isso geralmente não é necessário.
// config.watchFolders = [projectRoot, path.resolve(projectRoot, '../outra-pasta-do-monorepo')];

// Se você tem symlinks, pode ser necessário configurar o 'preserveSymlinks'
// config.resolver.preserveSymlinks = true; // Cuidado com esta opção

module.exports = config;