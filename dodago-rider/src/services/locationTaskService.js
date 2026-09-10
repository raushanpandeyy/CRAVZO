/**
 * Background Location Task Service
 *
 * Uses expo-task-manager + expo-location to keep syncing the rider's
 * GPS position even when the app is backgrounded or the screen is off.
 *
 * Android: requires FOREGROUND_SERVICE + ACCESS_BACKGROUND_LOCATION.
 *          A persistent foreground-service notification is shown by the OS
 *          while tracking is active (required on Android 8+).
 * iOS:     requires UIBackgroundModes: ["location"] in infoPlist and
 *          "always" location permission.
 *
 * HOW IT WORKS
 * ─────────────
 * 1. At app startup (index.js / App.js) TaskManager.defineTask() registers
 *    the task handler — this must happen before registerRootComponent().
 * 2. When the rider goes Online, DashboardScreen calls startBackgroundLocation().
 * 3. expo-location wakes the JS runtime (or a native background service on
 *    Android) every ~12 s / 30 m and passes new coords to the task handler.
 * 4. The task handler reads the stored auth token from AsyncStorage and
 *    POSTs the location to the backend — no React component needed.
 * 5. When the rider goes Offline (or logs out), stopBackgroundLocation() is
 *    called to unregister the task.
 */

import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BACKGROUND_LOCATION_TASK = "DODAGO_RIDER_BACKGROUND_LOCATION";

// ── These must match the values used in riderService / api.js ────────────────
const AUTH_TOKEN_KEY = "authToken";   // adjust if your AsyncStorage key differs
// We inline the fetch call here so this module has zero React/hook dependencies
// and can safely run in a headless / background JS context.
const getApiBaseUrl = () => {
  // Pulled from app.json extra.apiBaseUrl — hardcoded as fallback for background context
  try {
    const Constants = require("expo-constants").default;
    return Constants.expoConfig?.extra?.apiBaseUrl || "https://api.dodago.shop";
  } catch {
    return "https://api.dodago.shop";
  }
};

// ── Task definition — must be called at module load time (before app mounts) ─
export const defineBackgroundLocationTask = () => {
  // Guard: don't redefine if already defined (hot-reload safe)
  if (TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) return;

  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn("[BgLocation] Task error:", error.message);
      return;
    }

    const locations = data?.locations;
    if (!locations?.length) return;

    const { latitude, longitude, accuracy, heading, speed } = locations[0].coords;

    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return; // rider logged out — skip silently

      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/v1/rider/location`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude,
          longitude,
          accuracy:  accuracy  ?? null,
          heading:   heading   ?? null,
          speed:     speed     ?? null,
          timestamp: Date.now(),
        }),
      });
    } catch (err) {
      // Silently swallow — don't crash the background task
      console.warn("[BgLocation] Upload failed:", err.message);
    }
  });
};

// ── Start background location updates ────────────────────────────────────────
export const startBackgroundLocation = async () => {
  try {
    // Check if already running — avoid double-registration
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (isRunning) return;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy:            Location.Accuracy.Balanced,
      timeInterval:        12000,   // ms — fire at most every 12 s
      distanceInterval:    30,      // m  — fire only if moved ≥ 30 m
      deferredUpdatesInterval:    5000,
      deferredUpdatesDistance:    20,
      showsBackgroundLocationIndicator: true,  // iOS blue bar
      foregroundService: {
        // Android foreground-service notification keeps the process alive
        notificationTitle:   "Dodago Rider — Active",
        notificationBody:    "Your location is being shared for deliveries.",
        notificationColor:   "#059669",
        killServiceOnDestroy: false,  // keep running even if app is swiped away
      },
      pausesUpdatesAutomatically: false,  // iOS — don't pause when stationary
    });

    console.log("[BgLocation] Background location started");
  } catch (err) {
    console.warn("[BgLocation] Could not start:", err.message);
  }
};

// ── Stop background location updates ─────────────────────────────────────────
export const stopBackgroundLocation = async () => {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log("[BgLocation] Background location stopped");
    }
  } catch (err) {
    console.warn("[BgLocation] Could not stop:", err.message);
  }
};
