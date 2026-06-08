import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, CreditCard, Check, X, Tag, ChevronDown, ChevronUp, Trash2, Receipt } from "lucide-react";

import { createAddress as saveAddress, getAddresses } from "../../services/addressService.js";
import { getProfile } from "../../services/userService.js";
import { getRestaurantById } from "../../services/foodService.js";
import {
  createCODOrder,
  createRazorpayCheckoutOrder,
  getRazorpayConfig,
  loadRazorpayCheckout,
  verifyRazorpayPaymentAndCreateOrder,
} from "../../services/paymentService.js";

const FOOD_GST_RATE = 0.05;
const DELIVERY_GST_RATE = 0.18;
const PLATFORM_FEE = 10;
const PACKAGING_PERCENT = 0.04;
const RAZORPAY_PERCENT = 0.02;
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
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getPrice = (price) => {
  if (typeof price === "number") return price;
  return parseInt(price.toString().replace(/[^0-9]/g, ""), 10) || 0;
};

const CouponInput = ({ onApply, currentDiscount, onRemove }) => {
  const [couponCode, setCouponCode] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!couponCode.trim()) return;
    setIsApplying(true);
    setError("");
    try {
      await onApply(couponCode);
      setCouponCode("");
      setIsExpanded(false);
    } catch (err) {
      setError(err.message || "Invalid coupon code");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="border-t border-slate-100 pt-4">
      {currentDiscount > 0 ? (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Tag className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-700">Coupon Applied</p>
              <p className="text-sm text-emerald-600">-{formatCurrency(currentDiscount)}</p>
            </div>
          </div>
          <button onClick={onRemove} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 p-4 text-left transition hover:border-indigo-400 hover:bg-indigo-50/50"
          >
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-slate-400" />
              <span className="font-medium text-slate-700">Apply Coupon</span>
            </div>
            {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </button>
          {isExpanded && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                onClick={handleApply}
                disabled={!couponCode.trim() || isApplying}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:bg-slate-300"
              >
                {isApplying ? "..." : "Apply"}
              </button>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
};

const AddressCard = ({ address, isSelected, onSelect }) => {
  const addressText = [address.line1, address.line2, address.city, address.state, address.postalCode].filter(Boolean).join(", ");

  return (
    <button
      type="button"
      onClick={() => onSelect(address.id)}
      className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
        isSelected ? "border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          <MapPin className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-900">{address.label || "Address"}</p>
            {isSelected && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                <Check className="h-4 w-4" />
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{addressText}</p>
          {address.phone && <p className="mt-1 text-xs text-slate-400">{address.phone}</p>}
        </div>
      </div>
    </button>
  );
};

const PaymentOption = ({ icon: Icon, title, subtitle, isSelected, onSelect, badge, extra }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
      isSelected ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"
    }`}
  >
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="font-bold text-slate-900">{title}</p>
        {badge && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{badge}</span>}
      </div>
      <p className="text-sm text-slate-500">{subtitle}</p>
      {extra && <p className="mt-1 text-xs text-slate-400">{extra}</p>}
    </div>
    <div className={`h-5 w-5 rounded-full border-2 ${isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
      {isSelected && <Check className="h-4 w-4 text-white" />}
    </div>
  </button>
);

const PricingSummary = ({ cart, itemTotal, deliveryAndTax, packagingFeeBase, razorpayFee, codCharge, discount, finalTotal, distanceKm, deliveryBase, deliveryGst, foodGst, packagingTax, platformFee, platformTax, cgst, sgst }) => {
  const [showTax, setShowTax] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Item Total</span>
        <span className="font-medium">{formatCurrency(itemTotal)}</span>
      </div>

      {packagingFeeBase > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Packaging</span>
          <span className="font-medium">{formatCurrency(packagingFeeBase)}</span>
        </div>
      )}

      <div className="rounded-xl bg-slate-50">
        <button
          type="button"
          onClick={() => setShowTax(!showTax)}
          className="flex w-full items-center justify-between p-3 text-sm font-bold text-slate-800"
        >
          <span>Delivery & Tax</span>
          <span className="flex items-center gap-1.5">
            {formatCurrency(deliveryAndTax)}
            {showTax ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        {showTax && (
          <div className="px-3 pb-3 space-y-1.5 text-xs text-slate-500 border-t border-slate-200 pt-2.5">
            <div className="flex justify-between">
              <span>Delivery ({distanceKm.toFixed(1)} km)</span>
              <span>{formatCurrency(deliveryBase)}</span>
            </div>
            <div className="flex justify-between">
              <span>Food GST (5%)</span>
              <span>{formatCurrency(foodGst + packagingTax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery GST (18%)</span>
              <span>{formatCurrency(deliveryGst)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee (incl. GST)</span>
              <span>{formatCurrency(platformFee)}</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 mt-1.5 flex justify-between font-medium text-slate-600">
              <span>CGST (50%)</span>
              <span>{formatCurrency(cgst)}</span>
            </div>
            <div className="flex justify-between font-medium text-slate-600">
              <span>SGST (50%)</span>
              <span>{formatCurrency(sgst)}</span>
            </div>
          </div>
        )}
      </div>

      {razorpayFee > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Gateway Fee</span>
          <span className="font-medium">{formatCurrency(razorpayFee)}</span>
        </div>
      )}

      {codCharge > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">COD Charge</span>
          <span className="font-medium">{formatCurrency(codCharge)}</span>
        </div>
      )}

      {discount > 0 && (
        <div className="flex justify-between text-sm text-emerald-600">
          <span>Coupon Discount</span>
          <span className="font-medium">-{formatCurrency(discount)}</span>
        </div>
      )}

      <div className="border-t-2 border-indigo-600 pt-3">
        <div className="flex justify-between">
          <span className="text-lg font-bold text-slate-900">Total</span>
          <span className="text-xl font-extrabold text-indigo-700">{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      <p className="text-xs text-slate-400">All prices inclusive of taxes.</p>
    </div>
  );
};

const InvoiceDownload = ({ cart, itemTotal, packagingFeeBase, foodGst, packagingTax, deliveryBase, deliveryGst, platformFee, platformBase, platformTax, totalTax, grandTotal, distanceKm }) => {
  const handleDownload = () => {
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const itemsHtml = cart.map((item, i) =>
      `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${i + 1}</td><td style="padding:8px;border-bottom:1px solid #ddd">${item.name}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">₹${getPrice(item.price)}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">₹${getPrice(item.price) * item.quantity}</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Invoice - Cravzo</title>
<style>
body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#333}
h1{text-align:center;color:#5b21b6;margin-bottom:4px}
.sub{text-align:center;color:#666;font-size:14px;margin-bottom:30px}
table{width:100%;border-collapse:collapse;margin:20px 0}
th{background:#5b21b6;color:#fff;padding:10px;text-align:left}
td{padding:8px;border-bottom:1px solid #eee}
.totals td{padding:6px 8px;border:none}
.grand td{font-size:18px;font-weight:bold;border-top:2px solid #5b21b6;padding-top:10px}
.footer{text-align:center;margin-top:40px;color:#999;font-size:12px}
.right{text-align:right}
.center{text-align:center}
</style></head><body>
<h1>CRAVZO</h1>
<p class="sub">Tax Invoice</p>
<table>
<tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
${itemsHtml}
</table>
<table class="totals">
<tr><td><strong>Item Total</strong></td><td class="right">₹${Math.floor(itemTotal)}</td></tr>
<tr><td>Packaging Charge</td><td class="right">₹${Math.floor(packagingFeeBase)}</td></tr>
<tr><td style="padding-top:10px"><strong>Tax Breakdown</strong></td><td></td></tr>
<tr><td style="padding-left:20px">Food GST (5% on items + packaging)</td><td class="right">₹${Math.floor(foodGst + packagingTax)}</td></tr>
<tr><td style="padding-left:20px">Delivery GST (18% on ₹${deliveryBase})</td><td class="right">₹${Math.floor(deliveryGst)}</td></tr>
<tr><td style="padding-left:20px">Platform Fee (₹${platformFee} incl. 18% GST)</td><td class="right">₹${Math.floor(platformFee)}</td></tr>
<tr><td style="padding-left:20px">  Platform Base</td><td class="right">₹${platformBase.toFixed(2)}</td></tr>
<tr><td style="padding-left:20px">  Platform GST @18%</td><td class="right">₹${Math.floor(platformTax)}</td></tr>
<tr><td><strong>Total Tax (GST)</strong></td><td class="right"><strong>₹${Math.floor(totalTax)}</strong></td></tr>
<tr><td style="padding-left:20px">  CGST (50%)</td><td class="right">₹${Math.floor(cgst)}</td></tr>
<tr><td style="padding-left:20px">  SGST (50%)</td><td class="right">₹${Math.floor(sgst)}</td></tr>
<tr class="grand"><td>Grand Total</td><td class="right">₹${Math.floor(grandTotal)}</td></tr>
</table>
<p class="footer">Distance: ${distanceKm ? distanceKm.toFixed(2) : "—"} km | Generated by Cravzo</p>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cravzo-invoice-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 active:scale-95"
    >
      <Receipt className="h-3.5 w-3.5" />
      Download Invoice
    </button>
  );
};

const OrderItemCard = ({ item, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(item.id), 200);
  };

  return (
    <div className={`flex items-center gap-4 transition-all ${isRemoving ? "scale-95 opacity-0" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{item.name}</p>
        <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-900">{formatCurrency(getPrice(item.price) * item.quantity)}</span>
        <button
          onClick={handleRemove}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition hover:bg-rose-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(null);
  const [address, setAddress] = useState(emptyAddress);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [saveForLater, setSaveForLater] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [distanceKm, setDistanceKm] = useState(3);
  const [restaurantCoords, setRestaurantCoords] = useState(null);

  useEffect(() => {
    const hydrateCheckout = async () => {
      const stored = JSON.parse(localStorage.getItem("cravzoCart"));
      if (stored) setCart(stored);

      let restCoords = null;
      const restaurantId = stored?.[0]?.restaurantId;
      if (restaurantId) {
        try {
          const restaurant = await getRestaurantById(restaurantId);
          if (restaurant?.latitude && restaurant?.longitude) {
            restCoords = { lat: restaurant.latitude, lng: restaurant.longitude };
            setRestaurantCoords(restCoords);
          }
        } catch {
          // restaurant fetch failed, distance stays default
        }
      }

      try {
        const [addresses, user] = await Promise.all([getAddresses(), getProfile()]);
        setSavedAddresses(addresses);
        setProfile(user);

        const defaultAddress = addresses.find((entry) => entry.isDefault) || addresses[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setAddress({
            fullName: defaultAddress.fullName || "",
            phone: defaultAddress.phone || "",
            line1: defaultAddress.line1 || "",
            line2: defaultAddress.line2 || "",
            city: defaultAddress.city || "",
            state: defaultAddress.state || "",
            postalCode: defaultAddress.postalCode || "",
            latitude: defaultAddress.latitude ?? null,
            longitude: defaultAddress.longitude ?? null,
          });
          if (restCoords && defaultAddress.latitude && defaultAddress.longitude) {
            setDistanceKm(haversineKm(restCoords.lat, restCoords.lng, defaultAddress.latitude, defaultAddress.longitude));
          }
        }
      } catch (requestError) {
        setSavedAddresses([]);
      } finally {
        setIsLoadingAddresses(false);
      }

      window.scrollTo(0, 0);
    };

    hydrateCheckout();
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cravzoCart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartChange"));
  };

  const removeItem = (id) => {
    updateCart(cart.filter((item) => item.id !== id));
  };

  const handleSelectSavedAddress = (addressId) => {
    setSelectedAddressId(addressId);
    const savedAddress = savedAddresses.find((entry) => entry.id === addressId);
    if (!savedAddress) return;

    setAddress({
      fullName: savedAddress.fullName || "",
      phone: savedAddress.phone || "",
      line1: savedAddress.line1 || "",
      line2: savedAddress.line2 || "",
      city: savedAddress.city || "",
      state: savedAddress.state || "",
      postalCode: savedAddress.postalCode || "",
      latitude: savedAddress.latitude ?? null,
      longitude: savedAddress.longitude ?? null,
    });
    if (restaurantCoords && savedAddress.latitude && savedAddress.longitude) {
      setDistanceKm(haversineKm(restaurantCoords.lat, restaurantCoords.lng, savedAddress.latitude, savedAddress.longitude));
    }
    setShowNewAddressForm(false);
  };

  const handleAddressFieldChange = (field, value) => {
    setSelectedAddressId("");
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyCoupon = async (code) => {
    const validCoupons = {
      CRAVZO10: 10,
      SAVE20: 20,
      FIRST50: 50,
    };

    if (validCoupons[code]) {
      setCouponDiscount(validCoupons[code]);
      setMessage("Coupon applied!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      throw new Error("Invalid coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
  };

  const itemTotal = useMemo(() => cart.reduce((acc, item) => acc + getPrice(item.price) * item.quantity, 0), [cart]);

  const { deliveryBase, deliveryGst, deliveryTotal, packagingFeeBase, foodGst, packagingTax, platformFeeBase, platformTax, deliveryAndTax, totalTax, grandTotal, cgst, sgst } = useMemo(() => {
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

  const subtotalBeforeFees = useMemo(() => grandTotal - couponDiscount, [grandTotal, couponDiscount]);

  const razorpayFee = useMemo(() => {
    if (paymentMethod !== "UPI") return 0;
    return Math.floor(subtotalBeforeFees * RAZORPAY_PERCENT);
  }, [subtotalBeforeFees, paymentMethod]);

  const codCharge = useMemo(() => {
    if (paymentMethod !== "COD") return 0;
    return COD_CHARGE;
  }, [paymentMethod]);

  const finalTotal = useMemo(() => subtotalBeforeFees + razorpayFee + codCharge, [subtotalBeforeFees, razorpayFee, codCharge]);

  const preferredUpiId = profile?.paymentMethods?.upiIds?.[0] || "";

  const ensureAddressSavedIfNeeded = async () => {
    if (selectedAddressId) return selectedAddressId;
    if (!saveForLater) return null;

    const savedAddress = await saveAddress({
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

    return savedAddress.id;
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const resolvedAddressId = await ensureAddressSavedIfNeeded();
      const orderPayload = {
        restaurantId: cart[0]?.restaurantId,
        items: cart.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        addressId: resolvedAddressId,
        address,
        paymentMethod,
        pricing: {
          itemTotal,
          deliveryFee: deliveryTotal,
          platformFee: PLATFORM_FEE,
          packagingFee: packagingFeeBase,
          razorpayFee,
          codCharge,
          couponDiscount,
          finalTotal,
        },
      };

      if (paymentMethod === "COD") {
        await createCODOrder(orderPayload);
        localStorage.removeItem("cravzoCart");
        window.dispatchEvent(new Event("cartChange"));
        setCart([]);
        navigate("/account/orders");
        return;
      }

      const [RazorpayCheckout, razorpayConfig, checkoutData] = await Promise.all([
        loadRazorpayCheckout(),
        getRazorpayConfig(),
        createRazorpayCheckoutOrder(orderPayload),
      ]);

      const razorpay = new RazorpayCheckout({
        key: razorpayConfig.keyId,
        amount: Math.floor(finalTotal * 100),
        currency: checkoutData.razorpayOrder.currency,
        name: "Cravzo",
        description: "Food order payment",
        order_id: checkoutData.razorpayOrder.id,
        handler: async (response) => {
          try {
            await verifyRazorpayPaymentAndCreateOrder({
              ...orderPayload,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            localStorage.removeItem("cravzoCart");
            window.dispatchEvent(new Event("cartChange"));
            setCart([]);
            navigate("/account/orders");
          } catch (requestError) {
            setError(requestError.message || "Payment captured but order failed");
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
        prefill: {
          name: address.fullName || profile?.name || "",
          email: profile?.email || "",
          contact: address.phone || profile?.phone || "",
        },
        notes: preferredUpiId ? { preferred_upi_id: preferredUpiId } : undefined,
        theme: {
          color: "#5b21b6",
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: ["block.upi"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
      });

      razorpay.open();
    } catch (requestError) {
      setError(requestError.message || "Failed to start payment");
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="mb-6 text-6xl">🍽️</div>
        <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
        <p className="mt-2 text-slate-500">Add some delicious items to get started!</p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 rounded-2xl bg-indigo-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-8 mt-14 md:mt-0">
      <div className="sticky top-14 md:top-0 z-30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-extrabold text-slate-900">Checkout</h1>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="mx-auto max-w-5xl px-4 py-6">
        {message && (
          <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 flex items-center gap-2">
            <Check className="h-5 w-5" /> {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 flex items-center gap-2">
            <X className="h-5 w-5" /> {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <MapPin className="h-4 w-4" />
                </div>
                Delivery Address
              </h2>

              {isLoadingAddresses ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-20 rounded-2xl bg-slate-100"></div>
                  <div className="h-20 rounded-2xl bg-slate-100"></div>
                </div>
              ) : savedAddresses.length > 0 ? (
                <div className="space-y-3">
                  {savedAddresses.map((addr) => (
                    <AddressCard
                      key={addr.id}
                      address={addr}
                      isSelected={selectedAddressId === addr.id}
                      onSelect={handleSelectSavedAddress}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => { setShowNewAddressForm(!showNewAddressForm); setSelectedAddressId(""); }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-4 font-medium text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600"
                  >
                    <Plus className="h-5 w-5" /> Add New Address
                  </button>
                </div>
              ) : null}

              {(showNewAddressForm || savedAddresses.length === 0) && (
                <div className="mt-4 space-y-4 rounded-2xl border-2 border-slate-200 p-4">
                  <input
                    required
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={address.fullName}
                    onChange={(e) => handleAddressFieldChange("fullName", e.target.value)}
                  />
                  <input
                    required
                    placeholder="Phone Number"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={address.phone}
                    onChange={(e) => handleAddressFieldChange("phone", e.target.value)}
                  />
                  <input
                    required
                    placeholder="House/Flat/Building"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={address.line1}
                    onChange={(e) => handleAddressFieldChange("line1", e.target.value)}
                  />
                  <input
                    placeholder="Landmark (optional)"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={address.line2}
                    onChange={(e) => handleAddressFieldChange("line2", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      placeholder="City"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      value={address.city}
                      onChange={(e) => handleAddressFieldChange("city", e.target.value)}
                    />
                    <input
                      required
                      placeholder="State"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      value={address.state}
                      onChange={(e) => handleAddressFieldChange("state", e.target.value)}
                    />
                  </div>
                  <input
                    required
                    placeholder="Postal Code"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={address.postalCode}
                    onChange={(e) => handleAddressFieldChange("postalCode", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Latitude (Google Maps)"
                      type="number"
                      step="any"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      value={address.latitude ?? ""}
                      onChange={(e) => handleAddressFieldChange("latitude", e.target.value ? Number(e.target.value) : null)}
                    />
                    <input
                      placeholder="Longitude (Google Maps)"
                      type="number"
                      step="any"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      value={address.longitude ?? ""}
                      onChange={(e) => handleAddressFieldChange("longitude", e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={saveForLater}
                      onChange={(e) => setSaveForLater(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Save this address for future orders
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                Payment Method
              </h2>

              <div className="space-y-3">
                <PaymentOption
                  icon={CreditCard}
                  title="Online (UPI/Card)"
                  subtitle={preferredUpiId ? `Pay with ${preferredUpiId}` : "Pay using any UPI app or card"}
                  isSelected={paymentMethod === "UPI"}
                  onSelect={() => setPaymentMethod("UPI")}
                  badge="Recommended"
                />
                <PaymentOption
                  icon={svgCashIcon}
                  title="Cash on Delivery"
                  subtitle="Pay when your order arrives"
                  isSelected={paymentMethod === "COD"}
                  onSelect={() => setPaymentMethod("COD")}
                />
              </div>

              {paymentMethod === "UPI" && !preferredUpiId && (
                <button
                  type="button"
                  onClick={() => navigate("/account/payments")}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
                >
                  <Plus className="h-4 w-4" /> Add Preferred UPI ID
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">Order Summary</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">{cart.length} items</span>
              </h2>

              <div className="mb-4 max-h-48 space-y-3 overflow-y-auto">
                {cart.map((item) => (
                  <OrderItemCard key={item.id} item={item} onRemove={removeItem} />
                ))}
              </div>

              <CouponInput
                onApply={handleApplyCoupon}
                currentDiscount={couponDiscount}
                onRemove={handleRemoveCoupon}
              />

              <div className="mt-6 border-t border-slate-100 pt-4">
                <PricingSummary
                  cart={cart}
                  itemTotal={itemTotal}
                  deliveryAndTax={deliveryAndTax}
                  packagingFeeBase={packagingFeeBase}
                  razorpayFee={razorpayFee}
                  codCharge={codCharge}
                  discount={couponDiscount}
                  finalTotal={finalTotal}
                  distanceKm={distanceKm}
                  deliveryBase={deliveryBase}
                  deliveryGst={deliveryGst}
                  foodGst={foodGst}
                  packagingTax={packagingTax}
                  platformFee={PLATFORM_FEE}
                  platformTax={platformTax}
                  cgst={cgst}
                  sgst={sgst}
                />
              </div>

              <div className="mt-3">
                <InvoiceDownload
                  cart={cart}
                  itemTotal={itemTotal}
                  packagingFeeBase={packagingFeeBase}
                  foodGst={foodGst}
                  packagingTax={packagingTax}
                  deliveryBase={deliveryBase}
                  deliveryGst={deliveryGst}
                  platformFee={PLATFORM_FEE}
                  platformBase={platformFeeBase}
                  platformTax={platformTax}
                  totalTax={totalTax}
                  grandTotal={grandTotal}
                  distanceKm={distanceKm}
                />
              </div>

              <button
                disabled={isSubmitting || (!selectedAddressId && !address.line1)}
                className="mt-6 w-full rounded-2xl bg-indigo-600 py-4 text-base font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    {paymentMethod === "COD" ? "Placing Order..." : "Opening Payment..."}
                  </span>
                ) : (
                  `Pay ${formatCurrency(finalTotal)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4 shadow-lg md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Total to pay</p>
            <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(finalTotal)}</p>
          </div>
          <button
            onClick={(e) => handlePlaceOrder(e)}
            disabled={isSubmitting || (!selectedAddressId && !address.line1)}
            className="rounded-2xl bg-indigo-600 px-8 py-4 font-extrabold text-white shadow-lg transition hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none active:scale-95"
          >
            {isSubmitting ? "..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

const svgCashIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

export default CheckoutPage;