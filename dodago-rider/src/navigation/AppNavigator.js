import { ActivityIndicator, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Bike, ClipboardList, Home, MessageCircle, User } from "../components/Icons";
import DashboardScreen from "../screens/DashboardScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileScreen from "../screens/ProfileScreen";
import LoginScreen from "../screens/LoginScreen";
import { colors } from "../constants/colors";
import { useAuth } from "../services/AuthContext";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const tabIcon = (Icon) => ({ color, size }) => <Icon size={size} color={color} />;

function RiderTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 68, paddingTop: 8, paddingBottom: 10 },
        tabBarLabelStyle: { fontWeight: "800", fontSize: 12 },
      }}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Home", tabBarIcon: tabIcon(Home) }} />
      <Tabs.Screen name="Orders" component={OrdersScreen} options={{ title: "Orders", tabBarIcon: tabIcon(ClipboardList) }} />
      <Tabs.Screen name="Chat" component={ChatScreen} options={{ title: "Chat", tabBarIcon: tabIcon(MessageCircle) }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile", tabBarIcon: tabIcon(User) }} />
    </Tabs.Navigator>
  );
}

function LoadingScreen() {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.primary} size="large" /></View>;
}

export default function AppNavigator() {
  const { user, booting } = useAuth();
  if (booting) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="RiderApp" component={RiderTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}


