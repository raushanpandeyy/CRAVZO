import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import PressableScale from "./PressableScale";

export const Screen = ({ children, style }) => <View style={[styles.screen, style]}>{children}</View>;

export const Card = ({ children, style }) => <View style={[styles.card, style]}>{children}</View>;

export const PrimaryButton = ({ title, onPress, disabled, loading, tone = "primary", style }) => (
  <PressableScale
    onPress={onPress}
    disabled={disabled || loading}
    style={[styles.button, toneStyles[tone] || toneStyles.primary, (disabled || loading) && styles.buttonDisabled, style]}
  >
    {loading ? <ActivityIndicator color="#fff" /> : <Text numberOfLines={1} style={styles.buttonText}>{title}</Text>}
  </PressableScale>
);

export const EmptyState = ({ title, body }) => (
  <Card style={styles.emptyCard}>
    <View style={styles.emptyMark} />
    <Text style={styles.emptyTitle}>{title}</Text>
    {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
  </Card>
);

const toneStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.accent },
  danger: { backgroundColor: colors.danger },
  dark: { backgroundColor: colors.ink },
  muted: { backgroundColor: "#e2e8f0" },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
    padding: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  button: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  buttonDisabled: { opacity: 0.55, shadowOpacity: 0, elevation: 0 },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  emptyCard: { alignItems: "center", paddingVertical: 34 },
  emptyMark: { width: 46, height: 5, borderRadius: 999, backgroundColor: colors.primarySoft, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "900", color: colors.ink },
  emptyBody: { marginTop: 7, color: colors.muted, textAlign: "center", lineHeight: 21, fontWeight: "700" },
});
