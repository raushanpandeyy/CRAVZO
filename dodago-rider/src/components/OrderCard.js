import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MapPin, MessageCircle, Navigation, PackageCheck } from "./Icons";
import { Card, PrimaryButton } from "./Primitives";
import { colors } from "../constants/colors";
import { formatCurrency, formatCustomerAddress, formatDistance, formatRestaurantAddress } from "../utils/formatters";

export const OrderCard = ({ order, onView, onAccept, onReject, onPickup, onChat, compact = false }) => {
  const pickedUp = order.status === "OUT_FOR_DELIVERY";
  const isAvailable = Boolean(order.isAvailable);
  const destinationText = pickedUp ? formatCustomerAddress(order.address) : formatRestaurantAddress(order.restaurant);

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.badge}>{isAvailable ? "AVAILABLE" : order.status?.replaceAll?.("_", " ") || "ORDER"}</Text>
          <Text style={styles.title}>{order.restaurant?.name || "Restaurant"}</Text>
          <View style={styles.metaRow}>
            <MapPin size={14} color={colors.muted} />
            <Text numberOfLines={2} style={styles.address}>{destinationText}</Text>
          </View>
        </View>
        <View style={styles.moneyBox}>
          <Text style={styles.money}>{formatCurrency(order.deliveryFee)}</Text>
          <Text style={styles.moneyLabel}>earning</Text>
          <Text style={styles.distance}>{formatDistance(order.deliveryDistance)}</Text>
        </View>
      </View>

      {!compact ? (
        <View style={styles.detailStrip}>
          <PackageCheck size={16} color={colors.primary} />
          <Text style={styles.detailText}>Delivery km: {formatDistance(order.deliveryDistance)}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton title="View" tone="dark" onPress={() => onView?.(order)} style={styles.flexButton} />
        {isAvailable ? (
          <>
            <PrimaryButton title="Reject" tone="danger" onPress={() => onReject?.(order)} style={styles.flexButton} />
            <PrimaryButton title="Accept" tone="success" onPress={() => onAccept?.(order)} style={styles.flexButton} />
          </>
        ) : (
          <>
            {onChat ? <PrimaryButton title="Chat" tone="dark" onPress={() => onChat(order)} style={styles.flexButton} /> : null}
            {order.status === "READY_FOR_PICKUP" ? (
              <PrimaryButton title="Picked Up" onPress={() => onPickup?.(order)} style={styles.flexButton} />
            ) : null}
          </>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: 14 },
  topRow: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  titleWrap: { flex: 1 },
  badge: { alignSelf: "flex-start", color: colors.primary, backgroundColor: "#eef2ff", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontWeight: "900" },
  title: { marginTop: 8, color: colors.ink, fontSize: 18, fontWeight: "900" },
  metaRow: { marginTop: 6, flexDirection: "row", gap: 6, alignItems: "flex-start" },
  address: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 18 },
  moneyBox: { alignItems: "flex-end", minWidth: 82 },
  money: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  moneyLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  distance: { marginTop: 8, color: colors.primary, fontSize: 13, fontWeight: "900" },
  detailStrip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#eef2ff", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  detailText: { color: colors.primaryDark, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  flexButton: { flex: 1, minWidth: 86 },
});


