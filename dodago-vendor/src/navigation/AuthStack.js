import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen         from "../screens/LoginScreen";
import SignupScreen        from "../screens/SignupScreen";
import OtpScreen           from "../screens/OtpScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#f3f6fb" },
      }}
    >
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="Signup"         component={SignupScreen} />
      <Stack.Screen name="Otp"            component={OtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
