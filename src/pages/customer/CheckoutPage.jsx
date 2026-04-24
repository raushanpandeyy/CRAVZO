import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { createAddress as saveAddress, getAddresses } from "../../services/addressService.js";
import { getProfile } from "../../services/userService.js";
import {
  createCODOrder,
  createRazorpayCheckoutOrder,
  getRazorpayConfig,
  loadRazorpayCheckout,
  verifyRazorpayPaymentAndCreateOrder,
} from "../../services/paymentService.js";
=======

import { createAddress as saveAddress, getAddresses } from "../../services/addressService";
import { createOrder } from "../../services/orderService";
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

const emptyAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
<<<<<<< HEAD
  const [profile, setProfile] = useState(null);
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  const [address, setAddress] = useState(emptyAddress);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [saveForLater, setSaveForLater] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [message, setMessage] = useState("");
<<<<<<< HEAD
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

  useEffect(() => {
    const hydrateCheckout = async () => {
      const stored = JSON.parse(localStorage.getItem("cravzoCart"));
<<<<<<< HEAD
      if (stored) {
        setCart(stored);
      }

      try {
        const [addresses, user] = await Promise.all([getAddresses(), getProfile()]);
        setSavedAddresses(addresses);
        setProfile(user);
=======
      if (stored) setCart(stored);

      try {
        const addresses = await getAddresses();
        setSavedAddresses(addresses);
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

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
          });
        }
<<<<<<< HEAD
      } catch (requestError) {
        setSavedAddresses([]);
        setError(requestError.message || "Failed to load checkout data");
=======
      } catch {
        setSavedAddresses([]);
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
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
<<<<<<< HEAD
    window.dispatchEvent(new Event("cartChange"));
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  };

  const getPrice = (price) => {
    if (typeof price === "number") return price;
    return parseInt(price.toString().replace("Rs", "").replace("?", "").trim(), 10) || 0;
  };

  const removeItem = (id) => {
    setRemoveId(id);
    setTimeout(() => {
      updateCart(cart.filter((item) => item.id !== id));
      setRemoveId(null);
    }, 200);
  };

  const handleSelectSavedAddress = (addressId) => {
    setSelectedAddressId(addressId);
    const savedAddress = savedAddresses.find((entry) => entry.id === addressId);

    if (!savedAddress) {
      return;
    }

    setAddress({
      fullName: savedAddress.fullName || "",
      phone: savedAddress.phone || "",
      line1: savedAddress.line1 || "",
      line2: savedAddress.line2 || "",
      city: savedAddress.city || "",
      state: savedAddress.state || "",
      postalCode: savedAddress.postalCode || "",
    });
  };

  const handleAddressFieldChange = (field, value) => {
    setSelectedAddressId("");
    setAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const itemTotal = cart.reduce((acc, item) => acc + getPrice(item.price) * item.quantity, 0);
  const deliveryFee = itemTotal > 500 ? 0 : 40;
  const packagingFee = Math.round(itemTotal * 0.03);
  const gst = Math.round(itemTotal * 0.18);
  const grandTotal = itemTotal + deliveryFee + packagingFee + gst;
<<<<<<< HEAD
  const preferredUpiId = profile?.paymentMethods?.upiIds?.[0] || "";

  const ensureAddressSavedIfNeeded = async () => {
    if (selectedAddressId) {
      return selectedAddressId;
    }

    if (!saveForLater) {
      return null;
    }

    const savedAddress = await saveAddress({
      label: "HOME",
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || null,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      isDefault: savedAddresses.length === 0,
    });

    return savedAddress.id;
  };


=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setMessage("");
<<<<<<< HEAD
    setError("");
    setIsSubmitting(true);

    try {
      const resolvedAddressId = await ensureAddressSavedIfNeeded();
      const orderPayload = {
=======
    setIsSubmitting(true);

    try {
      let resolvedAddressId = selectedAddressId || null;

      if (!resolvedAddressId && saveForLater) {
        const savedAddress = await saveAddress({
          label: "HOME",
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 || null,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          isDefault: savedAddresses.length === 0,
        });

        resolvedAddressId = savedAddress.id;
      }

      await createOrder({
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
        restaurantId: cart[0]?.restaurantId,
        items: cart.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        addressId: resolvedAddressId,
        address,
<<<<<<< HEAD
        paymentMethod,
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
        amount: checkoutData.razorpayOrder.amount,
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
            setError(requestError.message || "Payment was captured but order creation failed");
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
        prefill: {
          name: address.fullName || profile?.name || "",
          email: profile?.email || "",
          contact: address.phone || profile?.phone || "",
        },
        notes: preferredUpiId ? { preferred_upi_id: preferredUpiId } : undefined,
        theme: {
          color: "#4f46e5",
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI",
                instruments: [
                  {
                    method: "upi",
                  },
                ],
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
=======
        paymentMethod: "COD",
      });
      localStorage.removeItem("cravzoCart");
      setCart([]);
      navigate("/account/orders");
    } catch (error) {
      setMessage(error.message || "Failed to place order");
    } finally {
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
<<<<<<< HEAD
      <div className="flex h-screen flex-col items-center justify-center p-4 pt-32 text-center">
        <div className="mb-4 text-6xl">Cart</div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <button onClick={() => navigate("/")} className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-white">
=======
      <div className="pt-32 text-center h-screen flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">Cart</div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <button onClick={() => navigate("/")} className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl">
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          Go Back
        </button>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="mx-auto mb-20 max-w-6xl p-4 pt-24">
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex-1">
          <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

          <form onSubmit={handlePlaceOrder} className="space-y-6">
            {message ? <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{message}</div> : null}
            {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <div className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-3 font-bold">Delivery Address</h2>
=======
    <div className="pt-24 max-w-6xl mx-auto p-4 mb-20">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          <form onSubmit={handlePlaceOrder} className="space-y-6">
            {message ? <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{message}</div> : null}

            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold mb-3">Delivery Address</h2>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

              {isLoadingAddresses ? (
                <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading saved addresses...</div>
              ) : savedAddresses.length ? (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-slate-700">Choose a saved address</p>
                  <div className="space-y-2">
                    {savedAddresses.map((savedAddress) => (
                      <button
                        key={savedAddress.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(savedAddress.id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          selectedAddressId === savedAddress.id
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <p className="font-semibold text-slate-900">{savedAddress.label || "Saved Address"}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {[savedAddress.line1, savedAddress.line2, savedAddress.city, savedAddress.state, savedAddress.postalCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No saved addresses yet. Fill the form below or add one from your addresses page.
                </div>
              )}

<<<<<<< HEAD
              <input required placeholder="Full Name" className="mb-3 w-full rounded border p-2" value={address.fullName} onChange={(event) => handleAddressFieldChange("fullName", event.target.value)} />
              <input required placeholder="Phone" className="mb-3 w-full rounded border p-2" value={address.phone} onChange={(event) => handleAddressFieldChange("phone", event.target.value)} />
              <input required placeholder="House / Flat" className="mb-3 w-full rounded border p-2" value={address.line1} onChange={(event) => handleAddressFieldChange("line1", event.target.value)} />
              <input placeholder="Area / Landmark" className="mb-3 w-full rounded border p-2" value={address.line2} onChange={(event) => handleAddressFieldChange("line2", event.target.value)} />
              <input required placeholder="City" className="mb-3 w-full rounded border p-2" value={address.city} onChange={(event) => handleAddressFieldChange("city", event.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="State" className="w-full rounded border p-2" value={address.state} onChange={(event) => handleAddressFieldChange("state", event.target.value)} />
                <input required placeholder="Postal Code" className="w-full rounded border p-2" value={address.postalCode} onChange={(event) => handleAddressFieldChange("postalCode", event.target.value)} />
=======
              <input required placeholder="Full Name" className="w-full mb-3 p-2 border rounded" value={address.fullName} onChange={(event) => handleAddressFieldChange("fullName", event.target.value)} />
              <input required placeholder="Phone" className="w-full mb-3 p-2 border rounded" value={address.phone} onChange={(event) => handleAddressFieldChange("phone", event.target.value)} />
              <input required placeholder="House / Flat" className="w-full mb-3 p-2 border rounded" value={address.line1} onChange={(event) => handleAddressFieldChange("line1", event.target.value)} />
              <input placeholder="Area / Landmark" className="w-full mb-3 p-2 border rounded" value={address.line2} onChange={(event) => handleAddressFieldChange("line2", event.target.value)} />
              <input required placeholder="City" className="w-full mb-3 p-2 border rounded" value={address.city} onChange={(event) => handleAddressFieldChange("city", event.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="State" className="w-full p-2 border rounded" value={address.state} onChange={(event) => handleAddressFieldChange("state", event.target.value)} />
                <input required placeholder="Postal Code" className="w-full p-2 border rounded" value={address.postalCode} onChange={(event) => handleAddressFieldChange("postalCode", event.target.value)} />
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
              </div>
              {!selectedAddressId ? (
                <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={saveForLater} onChange={(event) => setSaveForLater(event.target.checked)} />
                  Save this address for future orders
                </label>
              ) : null}
            </div>

<<<<<<< HEAD
            <div className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-3 font-bold">Payment</h2>
              <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <label className="flex items-center gap-3 text-sm font-medium text-emerald-900">
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                  />
                  Cash on Delivery
                </label>
                <p className="mt-2 text-xs text-slate-600">Pay in cash when your food is delivered.</p>
              </div>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <label className="flex items-center gap-3 text-sm font-medium text-indigo-900">
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "UPI"}
                    onChange={() => setPaymentMethod("UPI")}
                  />
                  Pay with Razorpay UPI
                </label>
                <p className="mt-3 text-sm text-slate-600">
                  Preferred UPI ID: <strong>{preferredUpiId || "Not saved yet"}</strong>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Saved UPI IDs are managed from your Payments page. Checkout opens Razorpay in UPI-only mode.
                </p>
              </div>
            </div>

            <button disabled={isSubmitting} className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white disabled:opacity-70">
              {isSubmitting
                ? paymentMethod === "COD"
                  ? "Placing order..."
                  : "Opening Razorpay..."
                : paymentMethod === "COD"
                  ? `Place COD Order - Rs ${grandTotal}`
                  : `Pay Rs ${grandTotal} with UPI`}
=======
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold mb-3">Payment</h2>
              <label className="block">
                <input type="radio" name="pay" defaultChecked /> Cash on Delivery
              </label>
              <label className="block mt-2 opacity-50">
                <input type="radio" name="pay" disabled /> UPI / Card
              </label>
            </div>

            <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:opacity-70">
              {isSubmitting ? "Placing Order..." : `Place Order Rs ${grandTotal}`}
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
            </button>
          </form>
        </div>

        <div className="w-full lg:w-96">
<<<<<<< HEAD
          <div className="sticky top-28 rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 flex justify-between font-bold">
=======
          <div className="bg-white p-6 rounded-xl shadow sticky top-28">
            <h2 className="font-bold mb-4 flex justify-between">
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
              Order Summary
              <span className="text-sm text-gray-500">{cart.length} items</span>
            </h2>

<<<<<<< HEAD
            <div className="max-h-72 space-y-4 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between ${removeId === item.id ? "scale-95 opacity-0" : ""}`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
=======
            <div className="space-y-4 max-h-72 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`flex justify-between items-center ${removeId === item.id ? "opacity-0 scale-95" : ""}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Rs {getPrice(item.price) * item.quantity}</span>
<<<<<<< HEAD
                    <button onClick={() => removeItem(item.id)} type="button" className="text-lg font-bold text-red-500 hover:scale-110">
=======
                    <button onClick={() => removeItem(item.id)} type="button" className="text-red-500 text-lg font-bold hover:scale-110">
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
                      x
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <hr className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Item Total</span><span>Rs {itemTotal}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee === 0 ? "FREE" : `Rs ${deliveryFee}`}</span></div>
              <div className="flex justify-between"><span>Packaging</span><span>Rs {packagingFee}</span></div>
              <div className="flex justify-between"><span>GST (18%)</span><span>Rs {gst}</span></div>
            </div>

            <hr className="my-4" />
<<<<<<< HEAD
            <div className="flex justify-between text-lg font-bold"><span>Grand Total</span><span>Rs {grandTotal}</span></div>
=======
            <div className="flex justify-between font-bold text-lg"><span>Grand Total</span><span>Rs {grandTotal}</span></div>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
