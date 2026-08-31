import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import PressableScale from "./PressableScale";

// ── Screen wrapper ───────────────────────────────────────────────
export const Screen = ({ children, style }) => (
  <View style={[styles.screen, style]}>{children}</View>
);

// ── Card ─────────────────────────────────────────────────────────
export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ── Primary Button ────────────────────────────────────────────────
// tone: "primary" | "success" | "danger" | "warning" | "dark" | "muted" | "outline"
export const PrimaryButton = ({
  title, onPress, disabled, loading,
  tone = "primary", style, textStyle,
}) => (
  <PressableScale
    onPress={onPress}
    disabled={disabled || loading}
    style={[
      styles.button,
      toneStyles[tone] || toneStyles.primary,
      (disabled || loading) && styles.buttonDisabled,
      style,
    ]}
  >
    {loading
      ? <ActivityIndicator color={tone === "outline" ? colors.primary : "#fff"} />
      : <Text numberOfLines={1} style={[styles.buttonText, tone === "outline" && styles.outlineText, textStyle]}>
          {title}
        </Text>
    }
  </PressableScale>
);

// ── Ghost / text button ───────────────────────────────────────────
export const TextButton = ({ title, onPress, color, style }) => (
  <PressableScale onPress={onPress} style={[styles.textBtn, style]}>
    <Text style={[styles.textBtnLabel, color && { color }]}>{title}</Text>
  </PressableScale>
);

// ── Input field ───────────────────────────────────────────────────
import { TextInput } from "react-native";
export const InputField = ({ label, error, style, inputStyle, ...props }) => (
  <View style={[styles.inputWrap, style]}>
    {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
    <TextInput
      style={[styles.input, error && styles.inputError, inputStyle]}
      placeholderTextColor={colors.subtle}
      {...props}
    />
    {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}
  </View>
);

// ── Section header ────────────────────────────────────────────────
export const SectionHeader = ({ title, right, style }) => (
  <View style={[styles.sectionHeader, style]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {right || null}
  </View>
);

// ── Badge ─────────────────────────────────────────────────────────
export const Badge = ({ label, tone = "primary", style }) => (
  <View style={[styles.badge, badgeTone[tone] || badgeTone.primary, style]}>
    <Text style={[styles.badgeText, badgeTextTone[tone] || badgeTextTone.primary]}>
      {label}
    </Text>
  </View>
);

// ── Empty state ───────────────────────────────────────────────────
export const EmptyState = ({ title, body, icon }) => (
  <Card style={styles.emptyCard}>
    {icon ? <Text style={styles.emptyIcon}>{icon}</Text> : null}
    <Text style={styles.emptyTitle}>{title}</Text>
    {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
  </Card>
);

// ── Divider ───────────────────────────────────────────────────────
export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const toneStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.accent },
  danger:  { backgroundColor: colors.danger },
  warning: { backgroundColor: colors.warning },
  dark:    { backgroundColor: colors.ink },
  muted:   { backgroundColor: "#e2e8f0" },
  outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary },
});

const badgeTone = StyleSheet.create({
  primary: { backgroundColor: colors.primarySoft },
  success: { backgroundColor: colors.accentSoft },
  danger:  { backgroundColor: colors.dangerSoft },
  warning: { backgroundColor: colors.warningSoft },
  orange:  { backgroundColor: colors.orangeSoft },
  muted:   { backgroundColor: "#f1f5f9" },
});

const badgeTextTone = StyleSheet.create({
  primary: { color: colors.primary },
  success: { color: colors.accent },
  danger:  { color: colors.danger },
  warning: { color: colors.warning },
  orange:  { color: colors.orange },
  muted:   { color: colors.muted },
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
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  buttonDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  buttonText:  { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 0.2 },
  outlineText: { color: colors.primary },

  textBtn:      { paddingVertical: 6, paddingHorizontal: 4, alignSelf: "flex-start" },
  textBtnLabel: { color: colors.primary, fontWeight: "800", fontSize: 14 },

  inputWrap:      { gap: 6 },
  inputLabel:     { color: colors.ink, fontWeight: "800", fontSize: 13 },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: "#fff",
  },
  inputError:     { borderColor: colors.danger },
  inputErrorText: { color: colors.danger, fontSize: 12, fontWeight: "700" },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle:  { color: colors.ink, fontSize: 18, fontWeight: "900" },

  badge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
  badgeText: { fontSize: 12, fontWeight: "900" },

  emptyCard:  { alignItems: "center", paddingVertical: 36, gap: 10 },
  emptyIcon:  { fontSize: 36 },
  emptyTitle: { fontSize: 17, fontWeight: "900", color: colors.ink },
  emptyBody:  { color: colors.muted, textAlign: "center", lineHeight: 21, fontWeight: "700" },

  divider: { height: 1, backgroundColor: colors.line },
});
