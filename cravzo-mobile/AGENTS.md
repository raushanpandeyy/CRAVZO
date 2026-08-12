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

## Maps setup

One native map library is used in the customer app:

- `react-native-maps` (MapView) is used for both interactive address picking and customer live order tracking:
  - `src/components/AddressMapPicker.js` (customer address pick)
  - `src/components/LightweightTrackingMap.js` (customer OrderTrackingScreen)
  On Android these need a Google Maps API key. Set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
  in `.env` and re-run `npx expo prebuild --clean` so the `plugins/withGoogleMapsKey.js`
  config plugin writes it into AndroidManifest.xml as `com.google.android.geo.API_KEY`.
  iOS uses Apple Maps by default.

Google Maps deep-links (`google.com/maps/dir/?api=1&...` and `/search/?api=1&...`) are
used for "Navigate" / "Open map" buttons and need no key.
