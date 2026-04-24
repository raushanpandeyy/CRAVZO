<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Smartphone, Trash2 } from "lucide-react";

import { getProfile, updateProfile } from "../../services/userService.js";

const buildUpiState = (profile) => profile?.paymentMethods?.upiIds || [];

export default function PaymentMethods() {
  const [profile, setProfile] = useState(null);
  const [savedUPI, setSavedUPI] = useState([]);
  const [newUpiId, setNewUpiId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const user = await getProfile();
        setProfile(user);
        setSavedUPI(buildUpiState(user));
      } catch (requestError) {
        setError(requestError.message || "Failed to load payment methods");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const primaryUpiId = useMemo(() => savedUPI[0] || "", [savedUPI]);

  const persistUpiIds = async (nextUpiIds, successMessage) => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updatedUser = await updateProfile({
        paymentMethods: {
          upiIds: nextUpiIds,
        },
      });
      setProfile(updatedUser);
      setSavedUPI(buildUpiState(updatedUser));
      setMessage(successMessage);
    } catch (requestError) {
      setError(requestError.message || "Failed to save UPI details");
    } finally {
      setSaving(false);
    }
  };

  const handleAddUpi = async () => {
    const upiId = newUpiId.trim().toLowerCase();

    if (!upiId) {
      setError("Enter a UPI ID to save it.");
      return;
    }

    if (savedUPI.includes(upiId)) {
      setError("This UPI ID is already saved.");
      return;
    }

    await persistUpiIds([...savedUPI, upiId], "UPI ID saved successfully.");
    setNewUpiId("");
  };

  const handleRemoveUpi = async (upiId) => {
    await persistUpiIds(savedUPI.filter((entry) => entry !== upiId), "UPI ID removed successfully.");
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10 sm:pl-80">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-md">
          <h1 className="text-3xl font-bold text-indigo-900">UPI Payment Methods</h1>
          <p className="mt-2 text-sm text-slate-600">
            Save your preferred UPI IDs here. Checkout uses Razorpay UPI with your saved payment preference.
          </p>
        </div>

        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-md">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-indigo-900">Saved UPI IDs</h2>
                <p className="text-sm text-slate-500">The first saved UPI ID is treated as your preferred payment method.</p>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {savedUPI.length} saved
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Loading UPI IDs...</div>
            ) : savedUPI.length ? (
              <div className="space-y-3">
                {savedUPI.map((upiId, index) => (
                  <div key={upiId} className="flex items-center justify-between rounded-2xl bg-indigo-900 px-4 py-4 text-white">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5" />
                      <div>
                        <p className="text-base font-semibold">{upiId}</p>
                        <p className="text-xs text-indigo-200">{index === 0 ? "Preferred at checkout" : "Saved UPI ID"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUpi(upiId)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-white disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
=======
import React, { useState } from "react";
import { Smartphone, CreditCard, Landmark, Wallet, Plus, Trash2 } from "lucide-react";

export default function PaymentMethods() {
  const [selected, setSelected] = useState("UPI");
  const [newEntry, setNewEntry] = useState({ value: "", bank: "", cardType: "" });

  const [savedUPI, setSavedUPI] = useState(["raushan@oksbi", "pandey123@paytm", "cravzo_user@ybl"]);
  const [savedCards, setSavedCards] = useState([
    { id: 1, bank: "HDFC Bank", number: "**** **** **** 4521", type: "Visa" },
    { id: 2, bank: "SBI Bank", number: "**** **** **** 9082", type: "Mastercard" }
  ]);
  const [savedBanks, setSavedBanks] = useState(["HDFC Net Banking", "SBI Net Banking", "ICICI Net Banking"]);

  const paymentOptions = [
    { id: "UPI", label: "UPI", icon: <Smartphone className="w-5 h-5" /> },
    { id: "CARD", label: "Cards", icon: <CreditCard className="w-5 h-5" /> },
    { id: "NET", label: "Net Banking", icon: <Landmark className="w-5 h-5" /> },
    { id: "COD", label: "Cash on Delivery", icon: <Wallet className="w-5 h-5" /> }
  ];

  const handleRemoveUPI = (index) => setSavedUPI((prev) => prev.filter((_, i) => i !== index));
  const handleRemoveCard = (id) => setSavedCards((prev) => prev.filter((card) => card.id !== id));
  const handleRemoveBank = (index) => setSavedBanks((prev) => prev.filter((_, i) => i !== index));

  const handleAddPayment = () => {
    if (selected === "UPI") {
      if (!newEntry.value.trim()) return alert("Please enter a UPI ID.");
      setSavedUPI((prev) => [...prev, newEntry.value.trim()]);
    }

    if (selected === "CARD") {
      if (!newEntry.bank || !newEntry.value || !newEntry.cardType) return alert("Please fill in all card details.");
      setSavedCards((prev) => [
        ...prev,
        {
          id: Date.now(),
          bank: newEntry.bank,
          number: `**** **** **** ${newEntry.value.slice(-4)}`,
          type: newEntry.cardType
        }
      ]);
    }

    if (selected === "NET") {
      if (!newEntry.value.trim()) return alert("Please enter a bank name.");
      setSavedBanks((prev) => [...prev, newEntry.value.trim()]);
    }

    setNewEntry({ value: "", bank: "", cardType: "" });
  };

  return (
    <div className="min-h-screen bg-gray-100 sm:pl-80 px-6 py-10 flex flex-col">
      <h1 className="text-3xl font-bold text-indigo-900 mb-8">Payment Methods</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
        <div className="col-span-1 flex flex-col bg-white rounded-2xl shadow-md border border-indigo-200 p-4">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4">Saved Methods</h2>
          {paymentOptions.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelected(method.id)}
              className={`flex items-center gap-3 p-3 mb-2 rounded-xl transition 
                ${selected === method.id
                  ? "bg-indigo-900 text-white scale-[1.02]"
                  : "bg-white text-indigo-900 border border-indigo-300 hover:bg-indigo-50"
                }`}
            >
              {method.icon}
              <span className="font-medium">{method.label}</span>
            </button>
          ))}
        </div>

        <div className="col-span-3 bg-white rounded-2xl shadow-md border border-indigo-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-indigo-900 mb-1">
                {selected === "UPI" && "Your UPI Accounts"}
                {selected === "CARD" && "Your Saved Cards"}
                {selected === "NET" && "Your Banks"}
                {selected === "COD" && "Cash on Delivery"}
              </h2>
              <p className="text-gray-600">Manage saved payment methods and add new details here.</p>
            </div>
            <button
              onClick={handleAddPayment}
              className="inline-flex items-center gap-2 bg-indigo-900 text-white px-4 py-2 rounded-xl hover:bg-indigo-800 transition"
            >
              <Plus className="w-5 h-5" /> Add
            </button>
          </div>

          {selected === "UPI" && (
            <>
              <div className="space-y-3 mb-6">
                {savedUPI.map((upi, index) => (
                  <div key={upi} className="flex justify-between items-center bg-indigo-900 text-white px-4 py-3 rounded-xl">
                    <span className="text-lg">{upi}</span>
                    <button onClick={() => handleRemoveUPI(index)} className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-white">
                      <Trash2 className="w-4 h-4" /> Remove
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
                    </button>
                  </div>
                ))}
              </div>
<<<<<<< HEAD
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                No UPI IDs saved yet.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold text-indigo-900">Add UPI ID</h2>
            <p className="mt-1 text-sm text-slate-500">Only UPI is managed here. Cards, banks, and COD have been removed.</p>

            <div className="mt-6 space-y-4">
              <input
                value={newUpiId}
                onChange={(event) => setNewUpiId(event.target.value)}
                placeholder="Enter UPI ID"
                className="w-full rounded-2xl border border-indigo-200 px-4 py-3"
              />
              <button
                onClick={handleAddUpi}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-900 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {saving ? "Saving..." : "Save UPI ID"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p><strong>Account:</strong> {profile?.name || "Customer"}</p>
              <p className="mt-1"><strong>Preferred UPI:</strong> {primaryUpiId || "Not set"}</p>
              <p className="mt-1"><strong>Checkout mode:</strong> Razorpay UPI</p>
            </div>
          </div>
=======
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={newEntry.value}
                  onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
                  placeholder="Enter UPI ID"
                  className="px-4 py-3 border border-indigo-200 rounded-2xl"
                />
              </div>
            </>
          )}

          {selected === "CARD" && (
            <>
              <div className="space-y-4 mb-6">
                {savedCards.map((card) => (
                  <div key={card.id} className="p-4 bg-indigo-900 text-white rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold">{card.bank}</p>
                      <p className="text-sm text-indigo-200">{card.number} • {card.type}</p>
                    </div>
                    <button onClick={() => handleRemoveCard(card.id)} className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-white">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  value={newEntry.bank}
                  onChange={(e) => setNewEntry({ ...newEntry, bank: e.target.value })}
                  placeholder="Bank Name"
                  className="px-4 py-3 border border-indigo-200 rounded-2xl"
                />
                <input
                  value={newEntry.value}
                  onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
                  placeholder="Card Last 4 digits"
                  className="px-4 py-3 border border-indigo-200 rounded-2xl"
                />
                <input
                  value={newEntry.cardType}
                  onChange={(e) => setNewEntry({ ...newEntry, cardType: e.target.value })}
                  placeholder="Card Type"
                  className="px-4 py-3 border border-indigo-200 rounded-2xl"
                />
              </div>
            </>
          )}

          {selected === "NET" && (
            <>
              <div className="space-y-3 mb-6">
                {savedBanks.map((bank, index) => (
                  <div key={bank} className="flex justify-between items-center bg-indigo-900 text-white px-4 py-3 rounded-xl">
                    <span className="text-lg">{bank}</span>
                    <button onClick={() => handleRemoveBank(index)} className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-white">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={newEntry.value}
                  onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
                  placeholder="Bank Name"
                  className="px-4 py-3 border border-indigo-200 rounded-2xl"
                />
              </div>
            </>
          )}

          {selected === "COD" && (
            <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-900">
              <p className="text-lg font-semibold">Cash on Delivery</p>
              <p className="text-gray-600 mt-2">No payment details are required. Pay in cash when your order arrives.</p>
            </div>
          )}

          <button className="mt-10 w-full bg-indigo-900 text-white text-lg font-semibold px-6 py-3 rounded-xl hover:bg-indigo-800 transition">
            Save Payment Settings
          </button>
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
        </div>
      </div>
    </div>
  );
}
<<<<<<< HEAD
=======




>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
