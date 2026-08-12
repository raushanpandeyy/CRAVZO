import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OptimizedImage from "../../components/OptimizedImage";
import {
  Clock3,
  IndianRupee,
  ChevronRight,
  X,
  MessageCircle,
  RotateCcw,
  Ban,
  Star,
  Bike,
  UtensilsCrossed,
  CheckCircle2,
  Search,
  ReceiptText,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { TAB_SCREEN_BOTTOM_PADDING, MODAL_BOTTOM_PADDING } from "../../constants/layout";
import { useDispatch } from "react-redux";
import { getMyOrders, cancelOrder, getReorderData } from "../../services/orderService";
import { addItem } from "../../store/slices/cartSlice";
import { saveReview } from "../../services/reviewService";
import { saveRiderRating } from "../../services/riderRatingService";
import OrderProgressBar from "../../components/OrderProgressBar";
import { connectSocket, onNewOrder, onOrderStatusUpdate } from "../../services/chatSocket";

const statusColors = {
  DELIVERED: "text-emerald-600 bg-emerald-50",
  CANCELLED: "text-rose-600 bg-rose-50",
  PREPARING: "text-amber-600 bg-amber-50",
  OUT_FOR_DELIVERY: "text-blue-600 bg-blue-50",
  PENDING: "text-slate-600 bg-slate-50",
  ACCEPTED: "text-indigo-600 bg-indigo-50",
  REJECTED: "text-rose-600 bg-rose-50",
  READY_FOR_PICKUP: "text-teal-600 bg-teal-50",
};

const formatStatus = (status) =>
  (status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const closedStatuses = ["DELIVERED", "CANCELLED", "REJECTED"];
const cancellableStatuses = ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP"];

const formatMoney = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "Rs 0";
  return `Rs ${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
};

const formatDistance = (value) => {
  const distance = Number(value || 0);
  if (!Number.isFinite(distance) || distance <= 0) return "Distance pending";
  return `${distance.toFixed(distance < 10 ? 1 : 0)} km`;
};

const getRestaurantName = (order) => order?.restaurantName || order?.restaurant?.name || "Restaurant";
const getRestaurantImage = (order) => order?.restaurantImage || order?.restaurant?.imageUrl || null;
const getOrderItemsText = (order) =>
  order?.items?.map?.((item) => item.name || item.menuItem?.name).filter(Boolean).join(", ") ||
  `${order?.itemCount || 0} items`;

const calcCancelFee = (order) => {
  if (["PENDING", "ACCEPTED"].includes(order.status)) return 0;
  if (order.status === "PREPARING" && order.preparingAt) {
    const mins = (Date.now() - new Date(order.preparingAt).getTime()) / 60000;
    if (mins < 2) return 0;
    if (mins >= 10) return 20;
    return 15;
  }
  return 20;
};

const StarPicker = ({ value, onChange }) => (
  <View className="flex-row items-center gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <TouchableOpacity key={i} onPress={() => onChange(i + 1)}>
        <Star
          size={28}
          color={i < value ? "#f59e0b" : "#e2e8f0"}
          fill={i < value ? "#f59e0b" : "transparent"}
        />
      </TouchableOpacity>
    ))}
  </View>
);

const SkeletonOrder = () => (
  <View className="bg-white rounded-3xl p-4 shadow-sm mb-3">
    <View className="flex-row items-start gap-3">
      <View className="h-14 w-14 rounded-2xl bg-slate-200" />
      <View className="flex-1 space-y-2">
        <View className="h-4 w-2/3 rounded-full bg-slate-200" />
        <View className="h-3 w-1/2 rounded-full bg-slate-200" />
        <View className="h-3 w-1/3 rounded-full bg-slate-200" />
      </View>
    </View>
  </View>
);

export default function OrdersScreen({ navigation }) {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState(null);
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");


  const maybePromptForFeedback = useCallback(async (items = []) => {
    const delivered = items.find((order) => order.status === "DELIVERED");
    if (!delivered) return;
    const submitted = await AsyncStorage.getItem(`dodago_feedback_submitted_${delivered.id}`);
    const dismissed = await AsyncStorage.getItem(`dodago_feedback_dismissed_${delivered.id}`);
    if (!submitted && !dismissed) setFeedbackOrder(delivered);
  }, []);
  const loadOrders = useCallback(async () => {
    try {
      const { orders: data } = await getMyOrders();
      const nextOrders = data || [];
      setOrders(nextOrders);
      await maybePromptForFeedback(nextOrders);
      setError("");
    } catch {
      setError("Failed to load orders. Pull down to retry.");
    } finally {
      setLoading(false);
    }
  }, [maybePromptForFeedback]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { orders: data } = await getMyOrders();
      const nextOrders = data || [];
      setOrders(nextOrders);
      await maybePromptForFeedback(nextOrders);
      setError("");
    } catch {
      setError("Failed to load orders. Pull down to retry.");
    } finally {
      setRefreshing(false);
    }
  }, [maybePromptForFeedback]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    connectSocket();
    const offStatus = onOrderStatusUpdate((payload = {}) => {
      const updatedOrder = payload.order || payload.data || payload;
      const orderId = updatedOrder.id || payload.orderId;
      loadOrders();
      if (!orderId) return;
      setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, ...updatedOrder } : order)));
      setSelectedOrder((current) => current?.id === orderId ? { ...current, ...updatedOrder } : current);
    });
    const offNew = onNewOrder(loadOrders);
    return () => {
      offStatus?.();
      offNew?.();
    };
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return orders;
    return orders.filter((order) => {
      const haystack = [
        order.id,
        order.status,
        getRestaurantName(order),
        order.restaurant?.name,
        ...(order.items || []).map((item) => item.name || item.menuItem?.name),
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(value);
    });
  }, [orders, query]);

  const handleChat = () => {
    if (!selectedOrder) return;
    const order = selectedOrder;
    setSelectedOrder(null);
    navigation.navigate("CustomerChat", { orderId: order.id });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const handleReorder = async (order) => {
    setError("");
    try {
      const reorderData = await getReorderData(order.id);
      const items = reorderData?.items || order.items || [];
      if (!items.length) return;
      items.forEach((item) => {
        dispatch(addItem({
          menuItemId: item.menuItemId || item.id,
          restaurantId: order.restaurantId || order.restaurant?.id,
          restaurantName: getRestaurantName(order),
          name: item.name || item.menuItem?.name,
          price: Number(item.price || item.unitPrice || 0),
          quantity: item.quantity || 1,
          imageUrl: item.imageUrl || item.menuItem?.imageUrl,
          size: item.size || null,
          selectedSideDishes: item.selectedSideDishes || [],
          notes: item.notes || "",
        }));
      });
      setSelectedOrder(null);
      navigation.navigate("Cart");
    } catch (err) {
      setError(err.message || "Could not prepare reorder");
    }
  };

  const handleCancelRequest = (order) => {
    setCancelConfirmOrder(order);
  };

  const handleCancelConfirm = async () => {
    if (!cancelConfirmOrder) return;
    setError("");
    setMsg("");
    try {
      const data = await cancelOrder(cancelConfirmOrder.id);
      const fee = data?.cancelFee;
      if (fee && fee > 0) {
        setMsg(`Order cancelled. ${data.cancelFeePercent}% fee deducted: ₹${fee}. Refund: ₹${data.refundAmount}`);
      } else {
        setMsg("Order cancelled successfully.");
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === cancelConfirmOrder.id ? { ...o, status: "CANCELLED" } : o)),
      );
      setCancelConfirmOrder(null);
    } catch (err) {
      setError(err.message || "Failed to cancel order");
      setCancelConfirmOrder(null);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!restaurantRating || !feedbackOrder) return;
    setSavingFeedback(true);
    setFeedbackError("");
    try {
      await Promise.all([
        saveReview({
          restaurantId: feedbackOrder.restaurantId || feedbackOrder.restaurant?.id,
          rating: restaurantRating,
          comment: feedbackComment.trim() || null,
        }),
        ...(feedbackOrder.rider?.id
          ? [
              saveRiderRating({
                orderId: feedbackOrder.id,
                riderId: feedbackOrder.rider.id,
                rating: deliveryRating,
                comment: feedbackComment.trim() || null,
              }),
            ]
          : []),
      ]);
      await AsyncStorage.setItem(`dodago_feedback_submitted_${feedbackOrder.id}`, "1");
      setFeedbackDone(true);
      setTimeout(() => {
        setFeedbackOrder(null);
        setFeedbackDone(false);
        setDeliveryRating(5);
        setRestaurantRating(5);
        setFeedbackComment("");
      }, 2000);
    } catch (err) {
      setFeedbackError(err.message || "Failed to submit feedback");
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ScrollView
        className="flex-1 pt-16 px-4"
        contentContainerStyle={{ paddingBottom: TAB_SCREEN_BOTTOM_PADDING }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" colors={["#4f46e5"]} />
        }
      >
        <Text className="text-xl font-extrabold text-slate-900 mb-4">
          Your Orders
        </Text>

        <View className="mb-4 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Search size={18} color={colors.slate[400]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search order, restaurant or item"
            placeholderTextColor={colors.slate[400]}
            className="flex-1 text-sm font-semibold text-slate-900"
            autoCapitalize="none"
          />
        </View>

        {msg ? (
          <View className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3">
            <Text className="text-sm font-medium text-emerald-700">{msg}</Text>
          </View>
        ) : null}
        {error ? (
          <View className="mb-3 rounded-2xl bg-rose-50 px-4 py-3">
            <Text className="text-sm font-medium text-rose-700">{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View className="space-y-3">
            <SkeletonOrder />
            <SkeletonOrder />
            <SkeletonOrder />
          </View>
        ) : filteredOrders.length === 0 ? (
          <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 shadow-sm">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <ReceiptText size={26} color={colors.brand[700]} />
            </View>
            <Text className="mt-4 text-lg font-black text-slate-900">No orders yet</Text>
            <Text className="mt-1 text-center text-sm font-semibold text-slate-500">Your live and past orders will appear here.</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {filteredOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => setSelectedOrder(order)}
                className="rounded-3xl border border-white bg-white p-4 shadow-xl shadow-slate-200/70"
              >
                <View className="flex-row items-start gap-3">
                  {failedImages[order.id] || !getRestaurantImage(order) ? (
                    <View className="h-16 w-16 rounded-2xl bg-indigo-100 items-center justify-center">
                      <Text className="text-xl font-black text-indigo-600">
                        {getRestaurantName(order)?.[0] || "R"}
                      </Text>
                    </View>
                  ) : (
                    <OptimizedImage
                      source={{ uri: getRestaurantImage(order) }}
                      className="h-16 w-16 rounded-2xl"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [order.id]: true }))
                      }
                    />
                  )}
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-black text-slate-950" numberOfLines={1}>
                        {getRestaurantName(order)}
                      </Text>
                      <View className={`rounded-full px-2.5 py-0.5 ${statusColors[order.status] || "bg-slate-100"}`}>
                        <Text className="text-[10px] font-extrabold">{formatStatus(order.status)}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                      {getOrderItemsText(order)}
                    </Text>
                    <View className="mt-3 flex-row flex-wrap items-center gap-2">
                      <View className="flex-row items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1">
                        <IndianRupee size={12} color={colors.brand[700]} />
                        <Text className="text-xs font-black text-indigo-700">{formatMoney(order.totalAmount || order.total)}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Bike size={12} color={colors.slate[500]} />
                        <Text className="text-xs font-bold text-slate-700">{formatDistance(order.deliveryDistance)}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Clock3 size={12} color={colors.slate[500]} />
                        <Text className="text-xs text-slate-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                        </Text>
                      </View>
                    </View>
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      <Text className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">Food {formatMoney(order.subtotal)}</Text>
                      <Text className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">Delivery {formatMoney(order.deliveryFee)}</Text>
                      <Text className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-700">Charges {formatMoney(Number(order.platformFee || 0) + Number(order.packagingFee || 0) + Number(order.gatewayFee || 0) + Number(order.codCharge || 0))}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.slate[400]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal animationType="slide" transparent={true} visible={!!selectedOrder} onRequestClose={() => setSelectedOrder(null)}>
        <View className="flex-1 bg-black/50">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setSelectedOrder(null)} />
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="items-center pt-2 pb-1">
              <View className="h-1 w-10 rounded-full bg-slate-300" />
            </View>
            <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: MODAL_BOTTOM_PADDING }}>
              <View className="flex-row items-start justify-between mt-2 mb-2">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-black text-slate-900">
                    {getRestaurantName(selectedOrder)}
                  </Text>
                  <Text className="text-xs font-bold text-indigo-700 mt-0.5">
                    Order #{selectedOrder?.id?.slice?.(-6) || ""}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">{formatDate(selectedOrder?.createdAt)}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedOrder(null)} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <X size={18} color={colors.slate[700]} />
                </TouchableOpacity>
              </View>

              {selectedOrder && (
                <View className="mb-4">
                  <View className={`self-start rounded-full px-3 py-1 ${statusColors[selectedOrder.status] || "bg-slate-100"}`}>
                    <Text className="text-xs font-extrabold">{formatStatus(selectedOrder.status)}</Text>
                  </View>
                </View>
              )}

              {selectedOrder && <OrderProgressBar status={selectedOrder.status} />}

              {selectedOrder?.items?.length > 0 && (
                <View className="mt-4">
                  <Text className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-2">Items</Text>
                  {selectedOrder.items.map((item, i) => (
                    <View key={item.id || i} className="flex-row items-center justify-between py-2 border-b border-slate-100">
                      <View className="flex-row items-center gap-2 flex-1">
                        <Text className="text-xs font-extrabold text-slate-300 w-5">{item.quantity || 1}x</Text>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>{item.name || item.menuItem?.name}</Text>
                          {item.selectedSideDishes?.length > 0 && (
                            <Text className="text-[10px] text-amber-700 mt-0.5">
                              + {item.selectedSideDishes.map((s) => s.name).join(", ")}
                            </Text>
                          )}
                          {item.notes ? (
                            <Text className="text-[10px] text-slate-400 italic mt-0.5">Note: {item.notes}</Text>
                          ) : null}
                        </View>
                      </View>
                      <Text className="text-sm font-bold text-slate-700">{formatMoney(item.totalPrice || item.price)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {selectedOrder && (
                <View className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <Text className="text-xs font-black uppercase text-slate-500">Restaurant and charges</Text>
                  <View className="mt-3 flex-row justify-between">
                    <Text className="text-sm text-slate-600">Restaurant distance</Text>
                    <Text className="text-sm font-bold text-slate-900">{formatDistance(selectedOrder.deliveryDistance)}</Text>
                  </View>
                  <View className="mt-2 flex-row justify-between">
                    <Text className="text-sm text-slate-600">Food subtotal</Text>
                    <Text className="text-sm font-bold text-slate-900">{formatMoney(selectedOrder.subtotal)}</Text>
                  </View>
                  <View className="mt-2 flex-row justify-between">
                    <Text className="text-sm text-slate-600">Delivery charge</Text>
                    <Text className="text-sm font-bold text-slate-900">{formatMoney(selectedOrder.deliveryFee)}</Text>
                  </View>
                  <View className="mt-2 flex-row justify-between">
                    <Text className="text-sm text-slate-600">Platform, packing and payment</Text>
                    <Text className="text-sm font-bold text-slate-900">{formatMoney(Number(selectedOrder.platformFee || 0) + Number(selectedOrder.packagingFee || 0) + Number(selectedOrder.gatewayFee || 0) + Number(selectedOrder.codCharge || 0))}</Text>
                  </View>
                  {Number(selectedOrder.discount || 0) > 0 ? (
                    <View className="mt-2 flex-row justify-between">
                      <Text className="text-sm text-emerald-700">Discount</Text>
                      <Text className="text-sm font-bold text-emerald-700">-{formatMoney(selectedOrder.discount)}</Text>
                    </View>
                  ) : null}
                  <View className="mt-3 flex-row justify-between border-t border-slate-200 pt-3">
                    <Text className="text-sm font-black text-slate-900">Total</Text>
                    <Text className="text-sm font-black text-slate-900">{formatMoney(selectedOrder.totalAmount)}</Text>
                  </View>
                </View>
              )}

              {selectedOrder?.paymentStatus ? (
                <View className={`mt-4 rounded-2xl p-4 ${selectedOrder.paymentStatus === "REFUNDED" ? "bg-emerald-50" : "bg-slate-50"}`}>
                  <Text className="text-xs font-black uppercase text-slate-500">Payment / refund</Text>
                  <Text className="mt-1 font-extrabold text-slate-900">{formatStatus(selectedOrder.paymentStatus)}</Text>
                  <Text className="text-xs text-slate-500">{selectedOrder.paymentMethod}</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View className="mt-6 space-y-3">
                {cancellableStatuses.includes(selectedOrder?.status) && (
                  <TouchableOpacity
                    onPress={() => handleCancelRequest(selectedOrder)}
                    className="flex-row items-center justify-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 py-3.5"
                  >
                    <Ban size={16} color={colors.red[600]} />
                    <Text className="text-sm font-extrabold text-rose-600">Cancel Order</Text>
                  </TouchableOpacity>
                )}

                {selectedOrder?.status === "DELIVERED" && (
                  <TouchableOpacity
                    onPress={() => {
                      const o = selectedOrder;
                      setSelectedOrder(null);
                      setFeedbackOrder(o);
                    }}
                    className="flex-row items-center justify-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 py-3.5"
                  >
                    <Star size={16} color="#d97706" />
                    <Text className="text-sm font-extrabold text-amber-700">Rate your experience</Text>
                  </TouchableOpacity>
                )}

                {selectedOrder && !closedStatuses.includes(selectedOrder.status) && (
                  <TouchableOpacity onPress={() => { const id = selectedOrder.id; setSelectedOrder(null); navigation.navigate("OrderTracking", { orderId: id }); }} className="flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5">
                    <Bike size={18} color="#fff" />
                    <Text className="text-sm font-extrabold text-white">Live tracking & delivery OTP</Text>
                  </TouchableOpacity>
                )}
                {selectedOrder && !closedStatuses.includes(selectedOrder.status) && (
                  <TouchableOpacity
                    onPress={handleChat}
                    disabled={!selectedOrder.rider?.id}
                    className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 disabled:bg-slate-300"
                  >
                    <MessageCircle size={18} color="#fff" />
                    <Text className="text-sm font-extrabold text-white">{selectedOrder.rider?.id ? "Chat with Rider" : "Rider assigning"}</Text>
                  </TouchableOpacity>
                )}

                {selectedOrder && (
                  <TouchableOpacity
                    onPress={() => handleReorder(selectedOrder)}
                    className="flex-row items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5"
                  >
                    <RotateCcw size={16} color="#fff" />
                    <Text className="text-sm font-extrabold text-white">Reorder All</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal animationType="fade" transparent={true} visible={!!cancelConfirmOrder} onRequestClose={() => setCancelConfirmOrder(null)}>
        <View className="flex-1 bg-black/55 items-center justify-center px-4">
          <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <Text className="text-xl font-black text-slate-900">Cancel Order?</Text>
            <Text className="mt-2 text-sm text-slate-500">
              Order #{cancelConfirmOrder?.id?.slice?.(-6)} &middot; {cancelConfirmOrder ? formatStatus(cancelConfirmOrder.status) : ""}
            </Text>
            {cancelConfirmOrder && (() => {
              const pct = calcCancelFee(cancelConfirmOrder);
              const amt = Number(cancelConfirmOrder.totalAmount);
              const fee = Math.round(amt * pct / 100);
              const refund = amt - fee;
              return pct > 0 ? (
                <View className="mt-4 space-y-2 rounded-2xl bg-rose-50 p-4">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-rose-700">Cancellation fee ({pct}%)</Text>
                    <Text className="text-sm font-bold text-rose-600">-{formatMoney(fee)}</Text>
                  </View>
                  <View className="flex-row justify-between border-t border-rose-200 pt-2">
                    <Text className="text-sm font-bold text-rose-700">Amount to refund</Text>
                    <Text className="text-sm font-bold text-rose-700">{formatMoney(refund)}</Text>
                  </View>
                </View>
              ) : (
                <View className="mt-4 rounded-2xl bg-emerald-50 p-4">
                  <Text className="text-sm text-emerald-700">No cancellation fee for this order.</Text>
                </View>
              );
            })()}
            <View className="flex-row gap-3 mt-5">
              <TouchableOpacity
                onPress={() => setCancelConfirmOrder(null)}
                className="flex-1 rounded-xl bg-slate-100 py-3 items-center"
              >
                <Text className="text-sm font-bold text-slate-700">Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelConfirm}
                className="flex-1 rounded-xl bg-rose-600 py-3 items-center"
              >
                <Text className="text-sm font-bold text-white">Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal animationType="slide" transparent={true} visible={!!feedbackOrder} onRequestClose={() => setFeedbackOrder(null)}>
        <View className="flex-1 bg-black/50">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setFeedbackOrder(null)} />
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="items-center pt-2 pb-1">
              <View className="h-1 w-10 rounded-full bg-slate-300" />
            </View>
            <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: MODAL_BOTTOM_PADDING }}>
              {feedbackDone ? (
                <View className="items-center py-10">
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                    <CheckCircle2 size={32} color="#059669" />
                  </View>
                  <Text className="text-xl font-black text-slate-900">Thanks for the feedback!</Text>
                  <Text className="text-sm text-slate-500 mt-1">Your review helps others discover great food.</Text>
                </View>
              ) : (
                <>
                  <View className="flex-row items-start justify-between mt-2 mb-4">
                    <View>
                      <Text className="text-xs font-black uppercase tracking-[0.15em] text-indigo-600">Rate your experience</Text>
                      <Text className="text-xl font-black text-slate-900 mt-1">
                        {getRestaurantName(feedbackOrder)}
                      </Text>
                      <Text className="text-sm text-slate-500 mt-0.5">
                        Order delivered on {formatDate(feedbackOrder?.updatedAt || feedbackOrder?.createdAt)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setFeedbackOrder(null)} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                      <X size={18} color={colors.slate[700]} />
                    </TouchableOpacity>
                  </View>

                  {/* Delivery Rating */}
                  <View className="rounded-2xl bg-slate-50 p-4 mb-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                        <Bike size={16} color={colors.brand[600]} />
                      </View>
                      <Text className="text-sm font-black text-slate-900">
                        Delivery Experience {feedbackOrder?.rider?.name ? `(${feedbackOrder.rider.name})` : ""}
                      </Text>
                    </View>
                    <StarPicker value={deliveryRating} onChange={setDeliveryRating} />
                  </View>

                  {/* Restaurant Rating */}
                  <View className="rounded-2xl bg-slate-50 p-4 mb-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                        <UtensilsCrossed size={16} color={colors.brand[600]} />
                      </View>
                      <Text className="text-sm font-black text-slate-900">Food & Restaurant</Text>
                    </View>
                    <StarPicker value={restaurantRating} onChange={setRestaurantRating} />
                  </View>

                  <TextInput
                    value={feedbackComment}
                    onChangeText={setFeedbackComment}
                    multiline
                    numberOfLines={3}
                    maxLength={300}
                    placeholder="How was the food? How was the delivery? Tell others..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                    textAlignVertical="top"
                  />
                  <Text className="text-right text-xs text-slate-400 mt-1">{feedbackComment.length}/300</Text>

                  {feedbackError ? (
                    <View className="rounded-2xl bg-rose-50 px-4 py-3 mt-3">
                      <Text className="text-sm text-rose-700">{feedbackError}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleFeedbackSubmit}
                    disabled={savingFeedback || !restaurantRating}
                    className="w-full rounded-2xl bg-indigo-600 py-3.5 items-center mt-4 disabled:opacity-60"
                  >
                    <Text className="text-sm font-black text-white">
                      {savingFeedback ? "Submitting..." : "Submit Feedback"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      if (feedbackOrder?.id) await AsyncStorage.setItem(`dodago_feedback_dismissed_${feedbackOrder.id}`, "1");
                      setFeedbackOrder(null);
                    }}
                    className="w-full items-center mt-3"
                  >
                    <Text className="text-xs text-slate-400">Skip for now — remind me later</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}






