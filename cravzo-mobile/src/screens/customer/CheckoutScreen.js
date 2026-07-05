import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  MapPin,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Wallet,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import CouponInput from "../../components/CouponInput";
import { clearCart, selectCartItemCount } from "../../store/slices/cartSlice";
import { getAddresses, addAddress } from "../../services/addressService";
import { getProfile } from "../../services/userService";
import { getRestaurantById } from "../../services/foodService";
import { createCODOrder } from "../../services/paymentService";

const FOOD_GST_RATE = 0.05;
const DELIVERY_GST_RATE = 0.18;
const PLATFORM_FEE = 0;
const PACKAGING_PERCENT = 0.01;
const COD_CHARGE = 5;
const DELIVERY_SLABS = [
  { maxKm: 1, fee: 17 },
  { maxKm: 2, fee: 23 },
  { maxKm: 3, fee: 30 },
  { maxKm: 4, fee: 35 },
];

const emptyAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  latitude: null,
  longitude: null,
};

const formatCurrency = (amount) => `₹${Math.floor(amount)}`;

const getPrice = (price) => {
  if (typeof price === "number") return price;
  return parseInt(price.toString().replace(/[^0-9]/g, ""), 10) || 0;
};

const calculateDeliveryBase = (distanceKm) => {
  const distance = distanceKm || 1;
  for (const slab of DELIVERY_SLABS) {
    if (distance <= slab.maxKm) return slab.fee;
  }
  const lastSlab = DELIVERY_SLABS[DELIVERY_SLABS.length - 1];
  return lastSlab.fee + Math.ceil(distance - lastSlab.maxKm) * 10;
};

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const AddressCard = ({ address, isSelected, onSelect }) => {
  const addressText = [address.line1, address.line2, address.city, address.state, address.postalCode].filter(Boolean).join(", ");
  return (
    <TouchableOpacity
      onPress={() => onSelect(address.id)}
      className={`w-full rounded-2xl border-2 p-4 ${isSelected ? "border-indigo-600 bg-indigo-50" : "border-slate-200"}`}
    >
      <View className="flex-row items-start gap-4">
        <View
          className={`h-10 w-10 items-center justify-center rounded-full ${isSelected ? "bg-indigo-600" : "bg-slate-100"}`}
        >
          <MapPin size={20} color={isSelected ? "#fff" : colors.slate[600]} />
        </View>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-slate-900">{address.label || "Address"}</Text>
            {isSelected ? (
              <View className="h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
                <Check size={16} color="#fff" />
              </View>
            ) : null}
          </View>
          <Text className="mt-1 text-sm text-slate-600" numberOfLines={2}>
            {addressText}
          </Text>
          {address.phone ? <Text className="mt-1 text-xs text-slate-400">{address.phone}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};





const PricingSummary = ({
  itemTotal,
  packagingFeeBase,
  deliveryAndTax,
  codCharge,
  discount,
  finalTotal,
  distanceKm,
  deliveryBase,
  deliveryGst,
  foodGst,
  packagingTax,
  platformFee,
  cgst,
  sgst,
}) => {
  const [showTax, setShowTax] = useState(false);

  return (
    <View className="space-y-3">
      <View className="flex-row justify-between">
        <Text className="text-sm text-slate-600">Item Total</Text>
        <Text className="text-sm font-medium">{formatCurrency(itemTotal)}</Text>
      </View>

      {packagingFeeBase > 0 ? (
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-600">Packaging</Text>
          <Text className="text-sm font-medium">{formatCurrency(packagingFeeBase)}</Text>
        </View>
      ) : null}

      <View className="rounded-xl bg-slate-50">
        <TouchableOpacity
          onPress={() => setShowTax(!showTax)}
          className="flex-row items-center justify-between p-3"
        >
          <Text className="text-sm font-bold text-slate-800">Delivery & Tax</Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-sm">{formatCurrency(deliveryAndTax)}</Text>
            {showTax ? (
              <ChevronUp size={16} color={colors.slate[800]} />
            ) : (
              <ChevronDown size={16} color={colors.slate[800]} />
            )}
          </View>
        </TouchableOpacity>
        {showTax ? (
          <View className="px-3 pb-3 border-t border-slate-200 pt-2.5 space-y-1.5">
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">Delivery ({distanceKm.toFixed(1)} km)</Text>
              <Text className="text-xs">{formatCurrency(deliveryBase)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">Food GST (5%)</Text>
              <Text className="text-xs">{formatCurrency(foodGst + packagingTax)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">Delivery GST (18%)</Text>
              <Text className="text-xs">{formatCurrency(deliveryGst)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">Platform Fee (incl. GST)</Text>
              <Text className="text-xs">{formatCurrency(platformFee)}</Text>
            </View>
            <View className="border-t border-slate-200 pt-1.5 mt-1.5 flex-row justify-between">
              <Text className="text-xs font-medium text-slate-600">CGST (50%)</Text>
              <Text className="text-xs font-medium text-slate-600">{formatCurrency(cgst)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs font-medium text-slate-600">SGST (50%)</Text>
              <Text className="text-xs font-medium text-slate-600">{formatCurrency(sgst)}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {codCharge > 0 ? (
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-600">COD Charge</Text>
          <Text className="text-sm font-medium">{formatCurrency(codCharge)}</Text>
        </View>
      ) : null}

      {discount > 0 ? (
        <View className="flex-row justify-between">
          <Text className="text-sm text-emerald-600">Coupon Discount</Text>
          <Text className="text-sm font-medium text-emerald-600">-{formatCurrency(discount)}</Text>
        </View>
      ) : null}

      <View className="border-t-2 border-indigo-600 pt-3">
        <View className="flex-row justify-between">
          <Text className="text-lg font-bold text-slate-900">Total</Text>
          <Text className="text-xl font-extrabold text-indigo-700">{formatCurrency(finalTotal)}</Text>
        </View>
      </View>

      <Text className="text-xs text-slate-400">All prices inclusive of taxes.</Text>
    </View>
  );
};

export default function CheckoutScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = useSelector(selectCartItemCount);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [saveForLater, setSaveForLater] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [distanceKm, setDistanceKm] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const init = async () => {
      let restCoords = null;
      const restaurantId = cartItems[0]?.restaurantId;
      if (restaurantId) {
        try {
          const restaurant = await getRestaurantById(restaurantId);
          if (restaurant?.latitude && restaurant?.longitude) {
            restCoords = { lat: restaurant.latitude, lng: restaurant.longitude };
          }
        } catch {}
      }

      try {
        const [addresses, user] = await Promise.all([getAddresses(), getProfile()]);
        setSavedAddresses(addresses);
        setProfile(user);

        const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setAddress({
            fullName: defaultAddr.fullName || "",
            phone: defaultAddr.phone || "",
            line1: defaultAddr.line1 || "",
            line2: defaultAddr.line2 || "",
            city: defaultAddr.city || "",
            state: defaultAddr.state || "",
            postalCode: defaultAddr.postalCode || "",
            latitude: defaultAddr.latitude ?? null,
            longitude: defaultAddr.longitude ?? null,
          });
          if (restCoords && defaultAddr.latitude && defaultAddr.longitude) {
            setDistanceKm(
              haversineKm(restCoords.lat, restCoords.lng, defaultAddr.latitude, defaultAddr.longitude)
            );
          }
        }
      } catch {
        setSavedAddresses([]);
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (route.params?.pickedLocation) {
      const loc = route.params.pickedLocation;
      setAddress((prev) => ({
        ...prev,
        line1: loc.line1 || prev.line1,
        line2: loc.line2 || prev.line2,
        city: loc.city || prev.city,
        state: loc.state || prev.state,
        postalCode: loc.postalCode || prev.postalCode,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));
      setSelectedAddressId("");
      navigation.setParams({ pickedLocation: undefined });
    }
  }, [route.params?.pickedLocation]);

  const handleSelectSavedAddress = useCallback(
    (addressId) => {
      setSelectedAddressId(addressId);
      const saved = savedAddresses.find((a) => a.id === addressId);
      if (!saved) return;
      setAddress({
        fullName: saved.fullName || "",
        phone: saved.phone || "",
        line1: saved.line1 || "",
        line2: saved.line2 || "",
        city: saved.city || "",
        state: saved.state || "",
        postalCode: saved.postalCode || "",
        latitude: saved.latitude ?? null,
        longitude: saved.longitude ?? null,
      });
      setShowNewAddressForm(false);
    },
    [savedAddresses]
  );

  const handleAddressFieldChange = useCallback((field, value) => {
    setSelectedAddressId("");
    setAddress((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyCoupon = async (code) => {
    const validCoupons = { DODAGO10: 10, SAVE20: 20, FIRST50: 50 };
    if (validCoupons[code]) {
      setCouponDiscount(validCoupons[code]);
      setMessage("Coupon applied!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      throw new Error("Invalid coupon code");
    }
  };

  const handleRemoveCoupon = () => setCouponDiscount(0);

  const itemTotal = useMemo(
    () =>
      cartItems.reduce((acc, item) => {
        const baseTotal = getPrice(item.price) * item.quantity;
        const sideTotal =
          (item.selectedSideDishes || []).reduce((sum, sd) => sum + Number(sd.price), 0) * item.quantity;
        return acc + baseTotal + sideTotal;
      }, 0),
    [cartItems]
  );

  const {
    deliveryBase,
    deliveryGst,
    deliveryTotal,
    packagingFeeBase,
    foodGst,
    packagingTax,
    platformFeeBase,
    platformTax,
    deliveryAndTax,
    totalTax,
    grandTotal,
    cgst,
    sgst,
  } = useMemo(() => {
    const dBase = calculateDeliveryBase(distanceKm);
    const dGst = dBase * DELIVERY_GST_RATE;
    const dTotal = dBase + dGst;
    const pkgBase = Math.floor(itemTotal * PACKAGING_PERCENT);
    const fGst = itemTotal * FOOD_GST_RATE;
    const pkgTax = pkgBase * FOOD_GST_RATE;
    const pf = PLATFORM_FEE;
    const pfBase = PLATFORM_FEE / (1 + DELIVERY_GST_RATE);
    const pfTax = PLATFORM_FEE - pfBase;
    const dAndT = dTotal + fGst + pkgTax + pf;
    const tTax = fGst + pkgTax + dGst + pfTax;
    const gTotal = itemTotal + pkgBase + dAndT;
    return {
      deliveryBase: dBase,
      deliveryGst: dGst,
      deliveryTotal: dTotal,
      packagingFeeBase: pkgBase,
      foodGst: fGst,
      packagingTax: pkgTax,
      platformFeeBase: pfBase,
      platformTax: pfTax,
      deliveryAndTax: Math.floor(dAndT),
      totalTax: tTax,
      grandTotal: Math.floor(gTotal),
      cgst: tTax / 2,
      sgst: tTax / 2,
    };
  }, [itemTotal, distanceKm]);

  const finalTotal = useMemo(
    () => Math.floor(grandTotal - couponDiscount + COD_CHARGE),
    [grandTotal, couponDiscount]
  );

  const ensureAddressSavedIfNeeded = async () => {
    if (selectedAddressId) return selectedAddressId;
    if (!saveForLater) return null;
    const saved = await addAddress({
      label: "HOME",
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || null,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      lat: address.latitude,
      lng: address.longitude,
      isDefault: savedAddresses.length === 0,
    });
    return saved.id;
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId && !address.line1) {
      Alert.alert("Address Required", "Please select or enter a delivery address.");
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert("Cart Empty", "Your cart is empty.");
      return;
    }
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const resolvedAddressId = await ensureAddressSavedIfNeeded();
      const orderPayload = {
        restaurantId: cartItems[0]?.restaurantId,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItemId || item.id,
          quantity: item.quantity,
          size: item.size || null,
          notes: item.notes || null,
          selectedSideDishes:
            item.selectedSideDishes?.length ? item.selectedSideDishes : undefined,
        })),
        addressId: resolvedAddressId,
        address,
        paymentMethod: "COD",
        pricing: {
          itemTotal,
          deliveryFee: deliveryTotal,
          platformFee: PLATFORM_FEE,
          packagingFee: packagingFeeBase,
          codCharge: COD_CHARGE,
          couponDiscount,
          finalTotal,
        },
      };

      await createCODOrder(orderPayload);
      dispatch(clearCart());
      navigation.navigate("Orders");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-4">
        <Text className="text-5xl mb-6">🍽️</Text>
        <Text className="text-2xl font-bold text-slate-900">Your cart is empty</Text>
        <Text className="mt-2 text-slate-500">Add some delicious items to get started!</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          className="mt-6 rounded-2xl bg-indigo-600 px-8 py-3 shadow-lg shadow-indigo-200"
        >
          <Text className="font-bold text-white">Browse Restaurants</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="bg-white shadow-sm pt-14 pb-4">
        <View className="flex-row items-center gap-4 px-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          >
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Checkout</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6 pb-4" keyboardShouldPersistTaps="handled">
        {message ? (
          <View className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 flex-row items-center gap-2">
            <Check size={20} color="#059669" />
            <Text className="text-sm font-medium text-emerald-700">{message}</Text>
          </View>
        ) : null}
        {error ? (
          <View className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 flex-row items-center gap-2">
            <X size={20} color="#e11d48" />
            <Text className="text-sm font-medium text-rose-700">{error}</Text>
          </View>
        ) : null}

        <View className="rounded-3xl bg-white p-6 shadow-sm mb-4">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
              <MapPin size={16} color={colors.brand[600]} />
            </View>
            <Text className="text-lg font-bold text-slate-900">Delivery Address</Text>
          </View>

          {isLoadingAddresses ? (
            <View className="space-y-3">
              <View className="h-20 w-full rounded-2xl bg-slate-100" />
              <View className="h-20 w-full rounded-2xl bg-slate-100" />
            </View>
          ) : savedAddresses.length > 0 ? (
            <View className="space-y-3">
              {savedAddresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  isSelected={selectedAddressId === addr.id}
                  onSelect={handleSelectSavedAddress}
                />
              ))}
              <TouchableOpacity
                onPress={() => {
                  setShowNewAddressForm((prev) => !prev);
                  setSelectedAddressId("");
                }}
                className={`flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 ${
                  showNewAddressForm
                    ? "border-indigo-400 bg-indigo-50/50"
                    : "border-slate-300"
                }`}
              >
                <Plus
                  size={20}
                  color={showNewAddressForm ? colors.brand[600] : colors.slate[500]}
                />
                <Text
                  className={`font-medium ${
                    showNewAddressForm ? "text-indigo-600" : "text-slate-500"
                  }`}
                >
                  {showNewAddressForm ? "Cancel" : "Add New Address"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {(showNewAddressForm || savedAddresses.length === 0) ? (
            <View className="mt-4 space-y-4 rounded-2xl border-2 border-slate-200 p-4">
              <TextInput
                placeholder="Full Name"
                placeholderTextColor={colors.slate[500]}
                value={address.fullName}
                onChangeText={(t) => handleAddressFieldChange("fullName", t)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              />
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor={colors.slate[500]}
                keyboardType="phone-pad"
                value={address.phone}
                onChangeText={(t) => handleAddressFieldChange("phone", t)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              />
              <TextInput
                placeholder="House/Flat/Building"
                placeholderTextColor={colors.slate[500]}
                value={address.line1}
                onChangeText={(t) => handleAddressFieldChange("line1", t)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              />
              <TextInput
                placeholder="Landmark (optional)"
                placeholderTextColor={colors.slate[500]}
                value={address.line2}
                onChangeText={(t) => handleAddressFieldChange("line2", t)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              />
              <View className="flex-row gap-3">
                <TextInput
                  placeholder="City"
                  placeholderTextColor={colors.slate[500]}
                  value={address.city}
                  onChangeText={(t) => handleAddressFieldChange("city", t)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                />
                <TextInput
                  placeholder="State"
                  placeholderTextColor={colors.slate[500]}
                  value={address.state}
                  onChangeText={(t) => handleAddressFieldChange("state", t)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                />
              </View>
              <TextInput
                placeholder="Postal Code"
                placeholderTextColor={colors.slate[500]}
                keyboardType="number-pad"
                value={address.postalCode}
                onChangeText={(t) => handleAddressFieldChange("postalCode", t)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              />
              <TouchableOpacity
                onPress={() => navigation.navigate("AddressMapPicker", { returnRoute: "Checkout" })}
                className="flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/50 py-4"
              >
                <MapPin size={20} color={colors.brand[600]} />
                <Text className="font-bold text-indigo-600">Pick on Map</Text>
              </TouchableOpacity>

              {address.latitude != null && address.longitude != null ? (
                <View className="flex-row items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                  <Check size={16} color="#059669" />
                  <Text className="text-sm text-emerald-700">
                    Coordinates: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                onPress={() => setSaveForLater(!saveForLater)}
                className="flex-row items-center gap-3"
              >
                <View
                  className={`h-5 w-5 rounded border-2 items-center justify-center ${
                    saveForLater
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-slate-300"
                  }`}
                >
                  {saveForLater ? <Check size={14} color="#fff" /> : null}
                </View>
                <Text className="text-sm font-medium text-slate-600">
                  Save this address for future orders
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View className="rounded-3xl bg-white p-6 shadow-sm mb-4">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
              <Wallet size={16} color={colors.brand[600]} />
            </View>
            <Text className="text-lg font-bold text-slate-900">Payment Method</Text>
          </View>
          <View className="flex-row items-center gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <Wallet size={24} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-900">Cash on Delivery</Text>
              <Text className="text-sm text-slate-500">Pay when your order arrives</Text>
            </View>
          </View>
        </View>

        <View className="rounded-3xl bg-white p-6 shadow-sm mb-4">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
              <Tag size={16} color={colors.brand[600]} />
            </View>
            <Text className="text-lg font-bold text-slate-900">Coupon</Text>
          </View>
          <CouponInput
            onApply={handleApplyCoupon}
            currentDiscount={couponDiscount}
            onRemove={handleRemoveCoupon}
          />
        </View>

        <View className="rounded-3xl bg-white p-6 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-900">Order Summary</Text>
            <View className="rounded-full bg-slate-100 px-3 py-1">
              <Text className="text-sm font-medium text-slate-600">{cartCount} items</Text>
            </View>
          </View>
          <PricingSummary
            itemTotal={itemTotal}
            packagingFeeBase={packagingFeeBase}
            deliveryAndTax={deliveryAndTax}
            codCharge={COD_CHARGE}
            discount={couponDiscount}
            finalTotal={finalTotal}
            distanceKm={distanceKm}
            deliveryBase={deliveryBase}
            deliveryGst={deliveryGst}
            foodGst={foodGst}
            packagingTax={packagingTax}
            platformFee={PLATFORM_FEE}
            cgst={cgst}
            sgst={sgst}
          />
        </View>
      </ScrollView>

      <View className="border-t border-slate-200 bg-white px-4 pt-4 pb-8 shadow-lg">
        <TouchableOpacity
          disabled={isSubmitting || (!selectedAddressId && !address.line1)}
          onPress={handlePlaceOrder}
          className="rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200 items-center justify-center disabled:bg-slate-300 disabled:shadow-none"
        >
          {isSubmitting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-base font-extrabold text-white">Placing Order...</Text>
            </View>
          ) : (
            <Text className="text-base font-extrabold text-white">
              Place Order — {formatCurrency(finalTotal)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
