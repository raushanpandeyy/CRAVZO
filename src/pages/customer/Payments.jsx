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
                    </button>
                  </div>
                ))}
              </div>
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
        </div>
      </div>
    </div>
  );
}
