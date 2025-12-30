module.exports = {
  LinkingManager: {},
  Linking: {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    openURL: jest.fn().mockResolvedValue(true),
  },
  ImageLoader: {},
  ImageViewManager: {},
  UIManager: {},
  NativeUnimoduleProxy: {
    viewManagersMetadata: {},
  },
};
