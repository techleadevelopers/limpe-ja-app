const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const projectRoot = __dirname;

const config = getSentryExpoConfig(projectRoot);

// Add JSON extension so Metro can load .typeface.json assets
config.resolver.assetExts = [...config.resolver.assetExts, 'json'];

// Ensure Metro resolves tslib from the project root node_modules
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  tslib: path.resolve(projectRoot, 'node_modules/tslib'),
};

// Hide Hermes internal bytecode frames to avoid symbolication errors
const previousCustomizeFrame = config.symbolicator?.customizeFrame;
config.symbolicator = {
  ...config.symbolicator,
  customizeFrame(frame, ...rest) {
    if (frame.file && frame.file.includes('InternalBytecode')) {
      return { collapse: true };
    }
    return previousCustomizeFrame
      ? previousCustomizeFrame(frame, ...rest)
      : null;
  },
};

module.exports = config;
