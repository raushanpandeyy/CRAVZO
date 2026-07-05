# DODAGO React Native (Expo)

## Important
- Expo SDK 56
- NativeWind v4 for styling
- Redux Toolkit for state
- MMKV for local storage
- React Navigation v7

## Commands
- `npm start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web

## Conventions
- Use NativeWind className for styling (Tailwind v4)
- No inline StyleSheet.create unless absolutely necessary
- Import colors from src/constants/colors.js for non-Tailwind values
- All API calls go through src/services/api.js
- Screens in src/screens/{role}/
- Navigation config in src/navigation/
