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
Two map libraries are in use, do not mix them up:

- `react-native-maps` (MapView) — used for interactive pick/place maps:
  - `src/components/AddressMapPicker.js` (customer address pick)
  - `src/screens/vendor/DeliveryAreaScreen.js` (vendor delivery zone)
  - `src/screens/rider/ActiveDeliveryScreen.js` (rider active delivery, uses PROVIDER_GOOGLE)
  On Android these need a Google Maps API key. Set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
  in `.env` and re-run `npx expo prebuild --clean` so the `plugins/withGoogleMapsKey.js`
  config plugin writes it into AndroidManifest.xml as `com.google.android.geo.API_KEY`.
  iOS uses Apple Maps by default (no key needed) except ActiveDeliveryScreen which forces
  PROVIDER_GOOGLE, so the key is needed there too.

- `@maplibre/maplibre-react-native` — used for the lightweight live rider tracking map:
  - `src/components/LightweightTrackingMap.js` (rendered by customer OrderTrackingScreen)
  Free, no API key. Style URL comes from `EXPO_PUBLIC_MAPLIBRE_STYLE_URL` (.env),
  default `https://tiles.openfreemap.org/styles/liberty`. Web fallback shows a static
  message because MapLibre RN is native-only.

Google Maps deep-links (`google.com/maps/dir/?api=1&...` and `/search/?api=1&...`) are
used for "Navigate" / "Open map" buttons and need no key.
