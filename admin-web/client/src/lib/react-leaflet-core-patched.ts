import { createElement } from "react";
import {
  useAttribution,
  updateCircle,
  createContainerComponent,
  createDivOverlayComponent,
  createLeafComponent,
  CONTEXT_VERSION,
  createLeafletContext,
  extendContext,
  useLeafletContext,
  LeafletContext as OriginalLeafletContext,
  createControlHook,
  createDivOverlayHook,
  addClassName,
  removeClassName,
  updateClassName,
  createElementHook,
  createElementObject,
  useEventHandlers,
  createControlComponent,
  createLayerComponent,
  createOverlayComponent,
  createPathComponent,
  createTileLayerComponent,
  updateGridLayer,
  createLayerHook,
  useLayerLifecycle,
  updateMediaOverlay,
  withPane,
  createPathHook,
  usePathOptions,
} from "../../../node_modules/@react-leaflet/core/lib/index.js";

const LeafletContext = Object.assign(
  function LeafletContextProvider(props: Parameters<typeof OriginalLeafletContext.Provider>[0]) {
    return createElement(OriginalLeafletContext.Provider, props);
  },
  {
    Provider: OriginalLeafletContext.Provider,
    Consumer: OriginalLeafletContext.Consumer,
    displayName: OriginalLeafletContext.displayName,
  }
);

export {
  useAttribution,
  updateCircle,
  createContainerComponent,
  createDivOverlayComponent,
  createLeafComponent,
  CONTEXT_VERSION,
  createLeafletContext,
  extendContext,
  useLeafletContext,
  createControlHook,
  createDivOverlayHook,
  addClassName,
  removeClassName,
  updateClassName,
  createElementHook,
  createElementObject,
  useEventHandlers,
  createControlComponent,
  createLayerComponent,
  createOverlayComponent,
  createPathComponent,
  createTileLayerComponent,
  updateGridLayer,
  createLayerHook,
  useLayerLifecycle,
  updateMediaOverlay,
  withPane,
  createPathHook,
  usePathOptions,
};

export { LeafletContext };
