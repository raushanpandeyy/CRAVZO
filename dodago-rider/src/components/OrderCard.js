import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MapPin, MessageCircle, PackageCheck } from "./Icons";
import { Card, PrimaryButton } from "./Primitives";
import { colors } from "../constants/colors";
import { formatCurrency, formatCustomerAddress, formatDistance, formatRestaurantAddress, openNavigation } from "../utils/formatters";

const OrderCardComponent = ({ order, onView, onAccept, onReject, onPickup, onReachedDestination, onCancel, onChat, compact = false }) => {
  const pickedUp    = order.status === "OUT_FOR_DELIVERY";
  const isAvailable = Boolean(order.isAvailable);
  const isActive    = !isAvailable && ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(order.status);
  const destinationText = pickedUp
    ? formatCustomerAddress(order.address)
    : formatRestaurantAddress(order.restaurant);
  const statusLabel = isAvailable ? "New request" : order.status?.replaceAll?.("_", " ") || "Order";

  return (
    <Card style={[styles.card, isAvailable && styles.cardLive]}>
      <View style={styles.accentLine} />
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.badge, isAvailable && styles.badgeLive]}>{statusLabel}</Text>
          <Text numberOfLines={1} style={styles.title}>{order.restaurant?.name || "Restaurant"}</Text>
          <View style={styles.metaRow}>
            <View style={styles.pinWrap}><MapPin size={14} color={colors.primaryDark} /></View>
            <Text numberOfLines={2} style={styles.address}>{destinationText}</Text>
          </View>
        </View>
        <View style={styles.moneyBox}>
          <Text style={styles.money}>{formatCurrency(Number(order.deliveryFee || 0) + Number(order.tipAmount || 0))}</Text>
          <Text style={styles.moneyLabel}>{Number(order.tipAmount || 0) > 0 ? "earning + tip" : "earning"}</Text>
          <Text style={styles.distance}>{formatDistance(order.deliveryDistance)}</Text>
        </View>
      </View>

      {!compact ? (
        <View style={styles.detailStrip}>
          <PackageCheck size={17} color={colors.primaryDark} />
          <Text style={styles.detailText}>Delivery km: {formatDistance(order.deliveryDistance)}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {isAvailable ? (
          /* ── New request: Reject + Accept ── */
          <>
            <PrimaryButton title="Reject"  tone="danger"   onPress={() => onReject?.(order)}  style={styles.actionButton} />
            <PrimaryButton title="Accept"  tone="success"  onPress={() => onAccept?.(order)}  style={styles.actionButtonWide} />
          </>
        ) : !pickedUp ? (
          /* ── Phase 1: going to restaurant (ACCEPTED / PREPARING / READY_FOR_PICKUP) ── */
          <>
            <PrimaryButton
              title="Navigate"
              tone="dark"
              onPress={() => openNavigation(order.restaurant, formatRestaurantAddress(order.restaurant))}
              style={styles.actionButton}
            />
            {onChat ? (
              <PrimaryButton title="Chat" tone="dark" onPress={() => onChat(order)} style={styles.actionButton} />
            ) : null}
            {order.restaurant?.phone ? (
              <PrimaryButton
                title="📞 Call"
                tone="success"
                onPress={() => Linking.openURL(`tel:${order.restaurant.phone}`)}
                style={styles.actionButton}
              />
            ) : null}
            {order.status === "READY_FOR_PICKUP" ? (
              <PrimaryButton title="Picked Up" tone="primary" onPress={() => onPickup?.(order)} style={styles.actionButtonWide} />
            ) : null}
          </>
        ) : (
          /* ── Phase 2: going to customer (OUT_FOR_DELIVERY) ── */
          <>
            <PrimaryButton
              title="Navigate"
              tone="dark"
              onPress={() => openNavigation(order.address, formatCustomerAddress(order.address))}
              style={styles.actionButton}
            />
            {onChat ? (
              <PrimaryButton title="Chat" tone="dark" onPress={() => onChat(order)} style={styles.actionButton} />
            ) : null}
            <PrimaryButton
              title="Reached Destination"
              tone="success"
              onPress={() => onReachedDestination?.(order)}
              style={styles.actionButtonWide}
            />
          </>
        )}
      </View>

      {/* ── Cancel link — only for active assigned orders ── */}
      {isActive && onCancel ? (
        <TouchableOpacity style={styles.cancelLink} onPress={() => onCancel(order)}>
          <Text style={styles.cancelLinkText}>Having trouble? Cancel order</Text>
        </TouchableOpacity>
      ) : null}
    </Card>
  );
};

export const OrderCard = React.memo(OrderCardComponent);

const styles = StyleSheet.create({
  card: { gap: 15, overflow: "hidden", borderColor: "#eef2ff", shadowOpacity: 0.14, shadowRadius: 22 },
  cardLive: { borderColor: "#bbf7d0", backgroundColor: "#ffffff" },
  accentLine: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5, backgroundColor: colors.primary },
  topRow: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  titleWrap: { flex: 1, minWidth: 0 },
  badge: { alignSelf: "flex-start", overflow: "hidden", color: colors.primaryDark, backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  badgeLive: { color: "#065f46", backgroundColor: colors.accentSoft },
  title: { marginTop: 9, color: colors.ink, fontSize: 19, fontWeight: "900" },
  metaRow: { marginTop: 8, flexDirection: "row", gap: 8, alignItems: "flex-start" },
  pinWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  address: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  moneyBox: { alignItems: "flex-end", minWidth: 96, padding: 10, borderRadius: 18, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#eef2ff" },
  money: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  moneyLabel: { color: colors.subtle, fontSize: 11, fontWeight: "800" },
  distance: { marginTop: 8, color: colors.primaryDark, fontSize: 13, fontWeight: "900", backgroundColor: colors.primarySoft, overflow: "hidden", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  detailStrip: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#f8fafc", paddingHorizontal: 12, paddingVertical: 11, borderRadius: 16, borderWidth: 1, borderColor: "#eef2ff" },
  detailText: { color: colors.primaryDark, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionButton: { flex: 1, minWidth: 88, minHeight: 46, borderRadius: 15 },
  actionButtonWide: { flex: 1.25, minWidth: 98, minHeight: 46, borderRadius: 15 },
  cancelLink:     { alignSelf: "center", paddingVertical: 4, paddingHorizontal: 8 },
  cancelLinkText: { color: colors.danger, fontSize: 12, fontWeight: "800", textDecorationLine: "underline" },
});


