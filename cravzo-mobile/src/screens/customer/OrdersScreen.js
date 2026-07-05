import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  Clock3,
  IndianRupee,
  ChevronRight,
  X,
  MessageCircle,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getMyOrders } from "../../services/orderService";
import OrderProgressBar from "../../components/OrderProgressBar";

const statusColors = {
  DELIVERED: "text-emerald-600 bg-emerald-50",
  CANCELLED: "text-rose-600 bg-rose-50",
  PREPARING: "text-amber-600 bg-amber-50",
  ON_THE_WAY: "text-blue-600 bg-blue-50",
  PENDING: "text-slate-600 bg-slate-50",
  ACCEPTED: "text-indigo-600 bg-indigo-50",
};

const formatStatus = (status) =>
  (status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const closedStatuses = ["DELIVERED", "CANCELLED", "REJECTED"];

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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      const { orders: data } = await getMyOrders();
      setOrders(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { orders: data } = await getMyOrders();
      setOrders(data);
    } catch {} finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ScrollView
        className="flex-1 pt-16 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" colors={["#4f46e5"]} />
        }
      >
        <Text className="text-xl font-extrabold text-slate-900 mb-4">
          Your Orders
        </Text>
        {loading ? (
          <View className="space-y-3">
            <SkeletonOrder />
            <SkeletonOrder />
            <SkeletonOrder />
          </View>
        ) : orders.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-5xl mb-4">📋</Text>
            <Text className="text-lg font-bold text-slate-900">
              No orders yet
            </Text>
            <Text className="text-sm text-slate-500 mt-1">
              Your orders will appear here
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => setSelectedOrder(order)}
                className="bg-white rounded-3xl p-4 shadow-sm"
              >
                <View className="flex-row items-start gap-3">
                  {failedImages[order.id] || !order.restaurantImage ? (
                    <View className="h-14 w-14 rounded-2xl bg-indigo-100 items-center justify-center">
                      <Text className="text-xl font-black text-indigo-600">
                        {order.restaurantName?.[0] || "R"}
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: order.restaurantImage }}
                      className="h-14 w-14 rounded-2xl"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [order.id]: true,
                        }))
                      }
                    />
                  )}
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="font-bold text-slate-900"
                        numberOfLines={1}
                      >
                        {order.restaurantName || "Restaurant"}
                      </Text>
                      <View
                        className={`rounded-full px-2.5 py-0.5 ${
                          statusColors[order.status] || "bg-slate-100"
                        }`}
                      >
                        <Text className="text-[10px] font-extrabold">
                          {formatStatus(order.status)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="text-xs text-slate-500 mt-0.5"
                      numberOfLines={1}
                    >
                      {order.items
                        ?.map?.((i) => i.name)
                        .join(", ") ||
                        `${order.itemCount || 0} items`}
                    </Text>
                    <View className="flex-row items-center gap-3 mt-2">
                      <View className="flex-row items-center gap-1">
                        <IndianRupee size={12} color={colors.slate[500]} />
                        <Text className="text-xs font-bold text-slate-700">
                          {order.total}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Clock3 size={12} color={colors.slate[500]} />
                        <Text className="text-xs text-slate-500">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : ""}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.slate[400]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedOrder}
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View className="flex-1 bg-black/50">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setSelectedOrder(null)}
          />
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="items-center pt-2 pb-1">
              <View className="h-1 w-10 rounded-full bg-slate-300" />
            </View>
            <ScrollView className="px-5 pb-8">
              <View className="flex-row items-start justify-between mt-2 mb-2">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-black text-slate-900">
                    {selectedOrder?.restaurantName || "Order"}
                  </Text>
                  <Text className="text-xs font-bold text-indigo-700 mt-0.5">
                    Order #{selectedOrder?.id?.slice?.(-6) || ""}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {formatDate(selectedOrder?.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedOrder(null)}
                  className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
                >
                  <X size={18} color={colors.slate[700]} />
                </TouchableOpacity>
              </View>

              {selectedOrder && (
                <View className="mb-4">
                  <View
                    className={`self-start rounded-full px-3 py-1 ${
                      statusColors[selectedOrder.status] || "bg-slate-100"
                    }`}
                  >
                    <Text className="text-xs font-extrabold">
                      {formatStatus(selectedOrder.status)}
                    </Text>
                  </View>
                </View>
              )}

              {selectedOrder && (
                <OrderProgressBar status={selectedOrder.status} />
              )}

              {selectedOrder?.items?.length > 0 && (
                <View className="mt-4">
                  <Text className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                    Items
                  </Text>
                  {selectedOrder.items.map((item, i) => (
                    <View
                      key={item.id || i}
                      className="flex-row items-center justify-between py-2 border-b border-slate-100"
                    >
                      <View className="flex-row items-center gap-2 flex-1">
                        <Text className="text-xs font-extrabold text-slate-300 w-5">
                          {item.quantity || 1}x
                        </Text>
                        <Text
                          className="text-sm font-semibold text-slate-900 flex-1"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </View>
                      {item.price != null && (
                        <Text className="text-sm font-bold text-slate-700">
                          ₹{item.price}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {selectedOrder?.total != null && (
                <View className="flex-row items-center justify-between mt-3 pt-2">
                  <Text className="text-sm font-black text-slate-900">
                    Total
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <IndianRupee size={14} color={colors.slate[900]} />
                    <Text className="text-sm font-black text-slate-900">
                      {selectedOrder.total}
                    </Text>
                  </View>
                </View>
              )}

              {selectedOrder &&
                !closedStatuses.includes(selectedOrder.status) && (
                  <TouchableOpacity
                    onPress={handleChat}
                    className="flex-row items-center justify-center gap-2 mt-6 rounded-2xl bg-indigo-600 py-3.5"
                  >
                    <MessageCircle size={18} color="#fff" />
                    <Text className="text-sm font-extrabold text-white">
                      Chat with Rider
                    </Text>
                  </TouchableOpacity>
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
