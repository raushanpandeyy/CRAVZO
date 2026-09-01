import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClipboardList, Home, MessageCircle, User } from "../components/Icons";
import DashboardScreen from "../screens/DashboardScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileScreen from "../screens/ProfileScreen";
import LoginScreen from "../screens/LoginScreen";
import { colors } from "../constants/colors";
import { useAuth } from "../services/AuthContext";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const visibleTabs = {
  Dashboard: { label: "Home", icon: Home },
  Orders: { label: "Analytics", icon: ClipboardList },
  Chat: { label: "Chat", icon: MessageCircle },
  Profile: { label: "Profile", icon: User },
};

const lazyTabScreens = {
  Reviews: () => require("../screens/ReviewsScreen").default,
  Support: () => require("../screens/SupportScreen").default,
  OrderHistory: () => require("../screens/OrderHistoryScreen").default,
  About: () => require("../screens/LegalScreens").AboutScreen,
  ContactUs: () => require("../screens/LegalScreens").ContactUsScreen,
  Privacy: () => require("../screens/LegalScreens").PrivacyScreen,
};

function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((route) => visibleTabs[route.name]);

  return (
    <View pointerEvents="box-none" style={[styles.tabWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}> 
      <View style={styles.tabPill}>
        {routes.map((route) => {
          const index = state.routes.findIndex((item) => item.key === route.key);
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const config = visibleTabs[route.name];
          const Icon = config.icon;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} accessibilityRole="button" accessibilityState={isFocused ? { selected: true } : {}} accessibilityLabel={options.tabBarAccessibilityLabel} activeOpacity={0.86} onPress={onPress} style={styles.tabItem}>
              <View style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                <Icon size={20} color={isFocused ? "#fff" : colors.muted} />
              </View>
              <Text numberOfLines={1} style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function RiderTabs() {
  return (
    <Tabs.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, lazy: true, freezeOnBlur: true }}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Orders" component={OrdersScreen} />
      <Tabs.Screen name="Chat" component={ChatScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
      {Object.entries(lazyTabScreens).map(([name, getComponent]) => (
        <Tabs.Screen key={name} name={name} getComponent={getComponent} />
      ))}
    </Tabs.Navigator>
  );
}

function LoadingScreen() {
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;
}

export default function AppNavigator() {
  const { user, booting } = useAuth();
  if (booting) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right", freezeOnBlur: true }}>
      {user ? (
        <Stack.Screen name="RiderApp" component={RiderTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" getComponent={() => require("../screens/SignupScreen").default} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 14, zIndex: 50 },
  tabPill: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    gap: 4,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 7,
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tabItem: { flex: 1, minWidth: 64, alignItems: "center", gap: 3 },
  tabIcon: { width: 40, height: 38, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  tabIconActive: { backgroundColor: colors.primaryDark },
  tabLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", marginTop: 1 },
  tabLabelActive: { color: colors.primaryDark },
});