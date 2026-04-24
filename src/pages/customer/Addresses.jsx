import React, { useEffect, useMemo, useState } from "react";
import { Building, Home, MapPin, Plus, Save, Trash2 } from "lucide-react";

import { createAddress, deleteAddress, getAddresses, updateAddress } from "../../services/addressService.js";
import { getStoredUser } from "../../services/authService.js";

const emptyForm = {
  label: "HOME",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  isDefault: false,
  lat: null,
  lng: null,
};

const categories = [
  { id: "HOME", label: "Home", icon: Home },
  { id: "WORK", label: "Work", icon: Building },
  { id: "OTHER", label: "Others", icon: MapPin },
];

const labelToCategory = (label) => {
  const normalized = (label || "").toUpperCase();
  if (normalized.includes("WORK") || normalized.includes("OFFICE")) return "WORK";
  if (normalized.includes("HOME")) return "HOME";
  return "OTHER";
};

const buildForm = (user) => ({
  ...emptyForm,
  fullName: user?.name || "",
  phone: user?.phone || "",
});

export default function SavedAddresses() {
  const storedUser = getStoredUser();
  const [selected, setSelected] = useState("HOME");
  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(buildForm(storedUser));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAddresses = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (requestError) {
      setError(requestError.message || "Failed to load saved addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const groupedAddresses = useMemo(
    () =>
      addresses.reduce(
        (accumulator, address) => {
          const key = labelToCategory(address.label);
          accumulator[key].push(address);
          return accumulator;
        },
        { HOME: [], WORK: [], OTHER: [] },
      ),
    [addresses],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(buildForm(storedUser));
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUseCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );

          const data = await res.json();
          const addr = data.address || {};

          setForm((prev) => ({
            ...prev,
            lat,
            lng,
            line1: addr.road || addr.neighbourhood || "",
            line2: addr.suburb || addr.village || "",
            city: addr.city || addr.town || addr.village || "",
            state: addr.state || "",
            postalCode: addr.postcode || "",
          }));

          setMessage("Location auto-filled");
        } catch {
          setError("Failed to fetch address");
        }
      },
      () => setError("Location permission denied"),
      { enableHighAccuracy: true }
    );
  };

  const handleEdit = (address) => {
    setEditingId(address.id);
    setSelected(labelToCategory(address.label));
    setForm({
      label: labelToCategory(address.label),
      fullName: address.fullName || "",
      phone: address.phone || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      isDefault: Boolean(address.isDefault),
    });
  };

  const handleSubmit = async () => {
    if (
      !form.fullName ||
      !form.phone ||
      !form.line1 ||
      !form.city ||
      !form.state ||
      !form.postalCode
    ) {
      setError("Complete address fill karo (House, Area, City, State, Pincode)");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      label: form.label,
      fullName: form.fullName,
      phone: form.phone,
      line1: form.line1,
      line2: form.line2 || null,
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
      isDefault: form.isDefault,
      lat: form.lat,
      lng: form.lng,
    };

    try {
      if (editingId) {
        await updateAddress(editingId, payload);
        setMessage("Address updated successfully.");
      } else {
        await createAddress(payload);
        setMessage("Address added successfully.");
      }

      resetForm();
      await loadAddresses();
    } catch (requestError) {
      setError(requestError.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (addressId) => {
    try {
      setMessage("");
      setError("");
      await deleteAddress(addressId);
      setMessage("Address removed successfully.");
      if (editingId === addressId) {
        resetForm();
      }
      await loadAddresses();
    } catch (requestError) {
      setError(requestError.message || "Failed to remove address");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Saved Addresses</h1>
          <p className="mt-2 text-sm text-slate-500">Manage delivery locations for faster checkout and smoother repeat orders.</p>
        </div>

        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Address Categories</h2>
            <div className="mt-5 space-y-3">
              {categories.map((category) => {
                const CategoryIcon = category.icon;

                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelected(category.id);
                      setForm((prev) => ({ ...prev, label: category.id }));
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${selected === category.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      <CategoryIcon className="h-5 w-5" />
                      <span className="font-medium">{category.label}</span>
                    </span>
                    <span className="text-xs font-semibold">{groupedAddresses[category.id].length}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Quick note</p>
              <p className="mt-1">The default address automatically becomes the first choice during future checkout improvements.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selected === "HOME" ? "Home Addresses" : selected === "WORK" ? "Work Addresses" : "Other Saved Places"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Your saved addresses in the selected category.</p>
                </div>
              </div>

              {loading ? (
                <div className="py-10 text-center text-sm text-slate-500">Loading addresses...</div>
              ) : groupedAddresses[selected].length ? (
                <div className="space-y-4">
                  {groupedAddresses[selected].map((address) => (
                    <div key={address.id} className="rounded-3xl bg-indigo-900 p-5 text-white shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">{address.label || "Saved Address"}</p>
                          <p className="mt-1 text-sm text-indigo-100">
                            {[address.line1, address.line2, address.city, address.state, address.postalCode]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                          <p className="mt-2 text-sm text-indigo-200">
                            {address.fullName} · {address.phone}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(address)}
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemove(address.id)}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>

                      {address.isDefault ? (
                        <div className="mt-4 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                          Default Address
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                  No saved addresses in this category yet.
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {editingId ? "Edit Address" : "Add New Address"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">Save a clean delivery address for faster future checkout.</p>
                </div>
                <button
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  <Plus className="h-4 w-4" />
                  New Form
                </button>
              </div>
              <button
                onClick={handleUseCurrentLocation}
                className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
              >
                📍 Use Current Location
              </button>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={form.fullName}
                  onChange={(event) => handleFieldChange("fullName", event.target.value)}
                  placeholder="Full Name"
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                />
                <input
                  value={form.phone}
                  onChange={(event) => handleFieldChange("phone", event.target.value)}
                  placeholder="Phone Number"
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                />
                <input
                  value={form.line1}
                  onChange={(event) => handleFieldChange("line1", event.target.value)}
                  placeholder="House / Flat / Street"
                  className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"
                />
                <input
                  value={form.line2}
                  onChange={(event) => handleFieldChange("line2", event.target.value)}
                  placeholder="Area / Landmark"
                  className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"
                />
                <input
                  value={form.city}
                  onChange={(event) => handleFieldChange("city", event.target.value)}
                  placeholder="City"
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                />
                <input
                  value={form.state}
                  onChange={(event) => handleFieldChange("state", event.target.value)}
                  placeholder="State"
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                />
                <input
                  value={form.postalCode}
                  onChange={(event) => handleFieldChange("postalCode", event.target.value)}
                  placeholder="Postal Code"
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                />
                <select
                  value={form.label}
                  onChange={(event) => handleFieldChange("label", event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <label className="mt-5 flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) => handleFieldChange("isDefault", event.target.checked)}
                />
                Set as default delivery address
              </label>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
