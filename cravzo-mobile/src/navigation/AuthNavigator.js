import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import SplashScreen from "../screens/auth/SplashScreen";
import VendorSignupScreen from "../screens/vendor/VendorSignupScreen";
import RiderSignupScreen from "../screens/rider/RiderSignupScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VendorSignup" component={VendorSignupScreen} />
      <Stack.Screen name="RiderSignup" component={RiderSignupScreen} />
    </Stack.Navigator>
  );
}
