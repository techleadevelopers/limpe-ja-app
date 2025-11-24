import { Platform } from "react-native";

export const fix = {
  padTop: (valueIOS: number, valueAndroid: number) =>
    Platform.OS === "android" ? valueAndroid : valueIOS,

  font: (value: number) =>
    Platform.OS === "android" ? value * 1.06 : value, // +6% Android

  blurBg: Platform.OS === "android"
    ? { backgroundColor: "rgba(255,255,255,0.9)" }
    : {},
};
