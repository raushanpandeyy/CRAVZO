import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors } from "../constants/colors";
import {
  ChefHat, ClipboardList, Home, UtensilsCrossed, User,
} from "../components/Icons";
import DashboardScreen from "../screens/DashboardScreen";
import OrdersScreen    from "../screens/OrdersScreen";
import KitchenScreen   from "../screens/KitchenScreen";
import MenuScreen      from "../screens/MenuScreen";
import ProfileScreen   from "../screens/ProfileScreen";
import { AboutScreen, ContactUsScreen, PrivacyScreen } from "../screens/LegalScreens";
import ChatScreen    from "../screens/ChatScreen";
import SupportScreen from "../screens/SupportScreen";
import ReviewsScreen from "../screens/ReviewsScreen";
import ReportsScreen from "../screens/ReportsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab bar icon ──────────────────────────────────────────
const TabIcon = ({ icon: Icon, label, focused }) => (
  <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
    <Icon
      size={22}
      color={focused ? colors.primary : colors.muted}
      strokeWidth={focused ? 2.5 : 1.8}
    />
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  </View>
);

// ── Bottom tabs ───────────────────────────────────────────
function Tabs() {
  const insets = useSafeAreaInsets();
  // paddingBottom = system nav bar height + small gap (8px)
  // minimum 12px so icons don't sit flush on the bar
  const tabPaddingBottom = Math.max(insets.bottom + 8, 12);
  const tabHeight = tabPaddingBottom + 52; // 52px for icons+labels

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, {
          height: tabHeight,
          paddingBottom: tabPaddingBottom,
        }],
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Home} label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={ClipboardList} label="Orders" focused={focused} /> }}
      />
      <Tab.Screen
        name="Kitchen"
        component={KitchenScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={ChefHat} label="Kitchen" focused={focused} /> }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={UtensilsCrossed} label="Menu" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={User} label="Profile" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ── Main stack (tabs + legal screens pushed on top) ───────
export default function MainTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="Tabs"      component={Tabs} />
      <Stack.Screen name="About"     component={AboutScreen} />
      <Stack.Screen name="Contact"   component={ContactUsScreen} />
      <Stack.Screen name="Privacy"   component={PrivacyScreen} />
      <Stack.Screen name="Chat"      component={ChatScreen} />
      <Stack.Screen name="Support"   component={SupportScreen} />
      <Stack.Screen name="Reviews"   component={ReviewsScreen} />
      <Stack.Screen name="Reports"   component={ReportsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 8,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "rgba(226,232,240,0.9)",
    elevation: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    minWidth: 56,
  },
  tabIconWrapActive: { backgroundColor: colors.primarySoft },
  tabLabel:          { fontSize: 10, fontWeight: "800", color: colors.muted },
  tabLabelActive:    { color: colors.primary },
});
