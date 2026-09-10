import React, { useCallback, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "./src/services/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

// Keep native splash visible until NavigationContainer is mounted —
// no artificial delay, hides as fast as possible.
SplashScreen.preventAutoHideAsync();

export default function App() {
  const hiddenRef = useRef(false);

  const onReady = useCallback(async () => {
    if (hiddenRef.current) return;
    hiddenRef.current = true;
    await SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer onReady={onReady}>
            <StatusBar style="light" backgroundColor="#059669" />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
