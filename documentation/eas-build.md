# Gerar APK teste
eas build --platform android --profile apk_direct_test

# APK Play Store
eas build --platform android --profile production

# IPAA Apple Store
eas build --platform ios --profile production

eas submit --platform ios --profile production