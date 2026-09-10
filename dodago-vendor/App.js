import "react-native-gesture-handler";
import { useCallback, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "./src/services/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";

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
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer onReady={onReady}>
          <StatusBar style="dark" backgroundColor="#ffffff" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
