import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";

export const Screen = ({ children, style }) => <View style={[styles.screen, style]}>{children}</View>;

export const Card = ({ children, style }) => <View style={[styles.card, style]}>{children}</View>;

export const PrimaryButton = ({ title, onPress, disabled, loading, tone = "primary", style }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    disabled={disabled || loading}
    style={[styles.button, toneStyles[tone] || toneStyles.primary, (disabled || loading) && styles.buttonDisabled, style]}
  >
    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{title}</Text>}
  </TouchableOpacity>
);

export const EmptyState = ({ title, body }) => (
  <Card style={styles.emptyCard}>
    <Text style={styles.emptyTitle}>{title}</Text>
    {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
  </Card>
);

const toneStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.accent },
  danger: { backgroundColor: colors.danger },
  dark: { backgroundColor: colors.ink },
  muted: { backgroundColor: colors.muted },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  emptyCard: { alignItems: "center", paddingVertical: 28 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: colors.ink },
  emptyBody: { marginTop: 6, color: colors.muted, textAlign: "center" },
});
