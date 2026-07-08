const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Injects the Google Maps Android API key into AndroidManifest.xml as
 * <meta-data android:name="com.google.android.geo.API_KEY" android:value="..."/>.
 *
 * The key is read from the EXPO_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
 * so it can be supplied via .env / EAS secrets without being committed to the repo.
 *
 * Without this key, react-native-maps MapView renders blank tiles on Android
 * (AddressMapPicker, DeliveryAreaScreen, ActiveDeliveryScreen).
 *
 * Re-run `npx expo prebuild --clean` after setting the env var so the plugin
 * regenerates the android folder with the new manifest entry.
 */
const withGoogleMapsKey = (config) => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === "your_google_maps_android_api_key") {
    console.warn(
      "[withGoogleMapsKey] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set. " +
        "Google Maps tiles on Android will be blank. Set it in your .env file."
    );
    return config;
  }

  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) return config;

    application["meta-data"] = application["meta-data"] || [];

    const existing = application["meta-data"].find(
      (item) => item?.$?.["android:name"] === "com.google.android.geo.API_KEY"
    );
    if (existing) {
      existing.$["android:value"] = apiKey;
    } else {
      application["meta-data"].push({
        $: {
          "android:name": "com.google.android.geo.API_KEY",
          "android:value": apiKey,
        },
      });
    }

    return config;
  });
};

module.exports = withGoogleMapsKey;
