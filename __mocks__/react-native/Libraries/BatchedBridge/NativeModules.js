module.exports = {
  __esModule: true,
  default: {
    ImageLoader: {},
    ImageViewManager: {},
    Linking: {
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      openURL: jest.fn(() => Promise.resolve()),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
    NativeUnimoduleProxy: {
      modulesConstants: {
        mockDefinition: {
          ExponentConstants: {
            experienceUrl: { mock: '' },
            linkingUri: { mock: '' },
          },
        },
      },
      viewManagersMetadata: {},
    },
    UIManager: {},
  },
};
