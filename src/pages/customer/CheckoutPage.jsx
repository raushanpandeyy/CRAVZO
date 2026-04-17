import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createAddress as saveAddress, getAddresses } from "../../services/addressService";
import { createOrder } from "../../services/orderService";

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
  const [address, setAddress] = useState(emptyAddress);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [saveForLater, setSaveForLater] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const hydrateCheckout = async () => {
      const stored = JSON.parse(localStorage.getItem("cravzoCart"));
      if (stored) setCart(stored);

      try {
        const addresses = await getAddresses();
        setSavedAddresses(addresses);

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
      } catch {
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

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setMessage("");
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
        restaurantId: cart[0]?.restaurantId,
        items: cart.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        addressId: resolvedAddressId,
        address,
        paymentMethod: "COD",
      });
      localStorage.removeItem("cravzoCart");
      setCart([]);
      navigate("/account/orders");
    } catch (error) {
      setMessage(error.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="pt-32 text-center h-screen flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">Cart</div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <button onClick={() => navigate("/")} className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 max-w-6xl mx-auto p-4 mb-20">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          <form onSubmit={handlePlaceOrder} className="space-y-6">
            {message ? <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{message}</div> : null}

            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold mb-3">Delivery Address</h2>

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

              <input required placeholder="Full Name" className="w-full mb-3 p-2 border rounded" value={address.fullName} onChange={(event) => handleAddressFieldChange("fullName", event.target.value)} />
              <input required placeholder="Phone" className="w-full mb-3 p-2 border rounded" value={address.phone} onChange={(event) => handleAddressFieldChange("phone", event.target.value)} />
              <input required placeholder="House / Flat" className="w-full mb-3 p-2 border rounded" value={address.line1} onChange={(event) => handleAddressFieldChange("line1", event.target.value)} />
              <input placeholder="Area / Landmark" className="w-full mb-3 p-2 border rounded" value={address.line2} onChange={(event) => handleAddressFieldChange("line2", event.target.value)} />
              <input required placeholder="City" className="w-full mb-3 p-2 border rounded" value={address.city} onChange={(event) => handleAddressFieldChange("city", event.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="State" className="w-full p-2 border rounded" value={address.state} onChange={(event) => handleAddressFieldChange("state", event.target.value)} />
                <input required placeholder="Postal Code" className="w-full p-2 border rounded" value={address.postalCode} onChange={(event) => handleAddressFieldChange("postalCode", event.target.value)} />
              </div>
              {!selectedAddressId ? (
                <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={saveForLater} onChange={(event) => setSaveForLater(event.target.checked)} />
                  Save this address for future orders
                </label>
              ) : null}
            </div>

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
            </button>
          </form>
        </div>

        <div className="w-full lg:w-96">
          <div className="bg-white p-6 rounded-xl shadow sticky top-28">
            <h2 className="font-bold mb-4 flex justify-between">
              Order Summary
              <span className="text-sm text-gray-500">{cart.length} items</span>
            </h2>

            <div className="space-y-4 max-h-72 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`flex justify-between items-center ${removeId === item.id ? "opacity-0 scale-95" : ""}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Rs {getPrice(item.price) * item.quantity}</span>
                    <button onClick={() => removeItem(item.id)} type="button" className="text-red-500 text-lg font-bold hover:scale-110">
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
            <div className="flex justify-between font-bold text-lg"><span>Grand Total</span><span>Rs {grandTotal}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
