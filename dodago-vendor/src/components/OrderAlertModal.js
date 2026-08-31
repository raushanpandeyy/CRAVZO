import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { PrimaryButton } from "./Primitives";
import { Bell, X } from "./Icons";
import { playAlertSound, stopAlertSound } from "../utils/alertSound";
import { useEffect, useRef, useState } from "react";

const formatCurrency = (v) => `Rs ${Math.floor(v || 0)}`;
const formatTime     = (v) => new Date(v).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

export default function OrderAlertModal({ order, onAccept, onReject, onDismiss }) {
  const [countdown, setCountdown] = useState(30);
  const [accepting, setAccepting]  = useState(false);
  const [rejecting, setRejecting]  = useState(false);
  const dismissed = useRef(false);

  // Sound + countdown when order appears
  useEffect(() => {
    if (!order) return;
    dismissed.current = false;
    setCountdown(30);
    playAlertSound();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!dismissed.current) {
            dismissed.current = true;
            stopAlertSound();
            onDismiss?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      stopAlertSound();
    };
  }, [order?.id]);

  const handleAccept = async () => {
    dismissed.current = true;
    stopAlertSound();
    setAccepting(true);
    try { await onAccept(order); } finally { setAccepting(false); }
  };

  const handleReject = async () => {
    dismissed.current = true;
    stopAlertSound();
    setRejecting(true);
    try { await onReject(order); } finally { setRejecting(false); }
  };

  const handleDismiss = () => {
    dismissed.current = true;
    stopAlertSound();
    onDismiss?.();
  };

  return (
    <Modal
      visible={Boolean(order)}
      transparent
      animationType="slide"
      hardwareAccelerated
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.shade}>
        <View style={styles.card}>

          {/* ── Red alert header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.bellWrap}>
                <Bell size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>🔔  New Order!</Text>
                <Text numberOfLines={1} style={styles.headerTitle}>
                  Order #{order?.id?.slice(-6) || "------"}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Countdown bar ── */}
          <View style={styles.countdownTrack}>
            <View style={[styles.countdownFill, { width: `${(countdown / 30) * 100}%` }]} />
          </View>
          <Text style={styles.countdownText}>Auto-dismiss in {countdown}s</Text>

          <ScrollView
            style={{ maxHeight: 320 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {/* ── Stats row ── */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, styles.statGreen]}>
                <Text style={styles.statLabel}>💰 Order Value</Text>
                <Text style={styles.statValueGreen}>{formatCurrency(order?.totalAmount)}</Text>
              </View>
              <View style={[styles.statBox, styles.statBlue]}>
                <Text style={styles.statLabel}>📦 Items</Text>
                <Text style={styles.statValueBlue}>{order?.items?.length || 0}</Text>
              </View>
            </View>

            {/* ── Customer ── */}
            {order?.customer ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{order.customer.name || "Customer"}</Text>
              </View>
            ) : null}

            {/* ── Order items ── */}
            {order?.items?.length > 0 ? (
              <View style={styles.itemsBox}>
                <Text style={styles.itemsTitle}>Items</Text>
                {order.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <View style={styles.itemQtyBadge}>
                      <Text style={styles.itemQty}>{item.quantity}</Text>
                    </View>
                    <Text style={styles.itemName}>{item.menuItem?.name || "Item"}</Text>
                    <Text style={styles.itemPrice}>Rs {Math.floor(item.totalPrice || 0)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* ── Notes ── */}
            {order?.notes ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>📝 Customer note</Text>
                <Text style={styles.noteText}>{order.notes}</Text>
              </View>
            ) : null}

            {/* ── Placed at ── */}
            <Text style={styles.timestamp}>
              Placed at {order?.createdAt ? formatTime(order.createdAt) : "—"}
            </Text>
          </ScrollView>

          {/* ── Action buttons ── */}
          <View style={styles.actions}>
            <PrimaryButton
              title="✕  Reject"
              tone="muted"
              onPress={handleReject}
              loading={rejecting}
              disabled={accepting}
              style={styles.flex}
            />
            <PrimaryButton
              title="✓  Accept"
              tone="success"
              onPress={handleAccept}
              loading={accepting}
              disabled={rejecting}
              style={[styles.flex, styles.acceptBtn]}
            />
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shade: { flex: 1, backgroundColor: "rgba(15,23,42,0.75)", justifyContent: "center", padding: 16 },
  card:  { borderRadius: 28, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#0f172a", shadowOpacity: 0.3, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 16 },

  header:     { backgroundColor: colors.danger, padding: 18, flexDirection: "row", alignItems: "center", gap: 12 },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  bellWrap:   { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  eyebrow:    { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  headerTitle:{ color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 2 },
  closeBtn:   { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },

  countdownTrack: { height: 4, backgroundColor: "#fee2e2" },
  countdownFill:  { height: "100%", backgroundColor: colors.danger },
  countdownText:  { textAlign: "right", paddingHorizontal: 16, paddingTop: 5, color: colors.muted, fontSize: 11, fontWeight: "800" },

  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 12 },

  statsRow:      { flexDirection: "row", gap: 10 },
  statBox:       { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1 },
  statGreen:     { backgroundColor: colors.accentSoft, borderColor: "#6ee7b7" },
  statBlue:      { backgroundColor: colors.primarySoft, borderColor: "#c7d2fe" },
  statLabel:     { color: colors.muted, fontSize: 11, fontWeight: "900" },
  statValueGreen:{ color: "#065f46", fontSize: 24, fontWeight: "900", marginTop: 4 },
  statValueBlue: { color: colors.primaryDark, fontSize: 24, fontWeight: "900", marginTop: 4 },

  infoRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { color: colors.muted, fontWeight: "800", fontSize: 13 },
  infoValue: { color: colors.ink, fontWeight: "900", fontSize: 14 },

  itemsBox:   { backgroundColor: "#f8fafc", borderRadius: 16, padding: 12, gap: 8, borderWidth: 1, borderColor: colors.line },
  itemsTitle: { color: colors.muted, fontWeight: "900", fontSize: 11, textTransform: "uppercase", marginBottom: 2 },
  itemRow:    { flexDirection: "row", alignItems: "center", gap: 10 },
  itemQtyBadge:{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center" },
  itemQty:    { color: "#fff", fontWeight: "900", fontSize: 13 },
  itemName:   { flex: 1, color: colors.ink, fontWeight: "700", fontSize: 14 },
  itemPrice:  { color: colors.muted, fontWeight: "800", fontSize: 13 },

  noteBox:  { backgroundColor: colors.warningSoft, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#fde68a" },
  noteLabel:{ color: colors.warning, fontWeight: "900", fontSize: 12, marginBottom: 4 },
  noteText: { color: colors.ink, fontWeight: "700", fontSize: 13, lineHeight: 19 },

  timestamp: { color: colors.subtle, fontSize: 12, fontWeight: "700", textAlign: "center", paddingBottom: 4 },

  actions:   { flexDirection: "row", gap: 10, padding: 16, paddingTop: 8 },
  flex:      { flex: 1 },
  acceptBtn: { shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
});
