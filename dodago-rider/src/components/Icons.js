import { StyleSheet, Text } from "react-native";

const glyphs = {
  BatteryWarning: "!",
  Bike: "R",
  ClipboardList: "#",
  Home: "H",
  LogOut: "Q",
  Mail: "@",
  MapPin: "P",
  MessageCircle: "C",
  Navigation: ">",
  PackageCheck: "?",
  Phone: "T",
  Power: "I",
  Send: ">",
  Star: "*",
  User: "U",
  X: "x",
};

const makeIcon = (name) => ({ size = 20, color = "#0f172a" }) => (
  <Text style={[styles.icon, { width: size, height: size, lineHeight: size, fontSize: Math.max(11, size * 0.72), color }]}>
    {glyphs[name] || "•"}
  </Text>
);

export const BatteryWarning = makeIcon("BatteryWarning");
export const Bike = makeIcon("Bike");
export const ClipboardList = makeIcon("ClipboardList");
export const Home = makeIcon("Home");
export const LogOut = makeIcon("LogOut");
export const Mail = makeIcon("Mail");
export const MapPin = makeIcon("MapPin");
export const MessageCircle = makeIcon("MessageCircle");
export const Navigation = makeIcon("Navigation");
export const PackageCheck = makeIcon("PackageCheck");
export const Phone = makeIcon("Phone");
export const Power = makeIcon("Power");
export const Send = makeIcon("Send");
export const Star = makeIcon("Star");
export const User = makeIcon("User");
export const X = makeIcon("X");

const styles = StyleSheet.create({
  icon: {
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
  },
});
