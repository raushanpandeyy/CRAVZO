import React, { useEffect, useMemo, useState } from "react";
import { Bike, Camera, Mail, Phone, Save, User } from "lucide-react";

import { getStoredUser } from "../../services/authService.js";
import { getProfile, updateProfile, uploadImage } from "../../services/userService.js";

const fallbackAvatar =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80";

const buildInitialForm = (user) => ({
  name: user?.name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  avatarUrl: user?.avatarUrl || "",
  bankDetails: {
    accountHolderName: user?.bankDetails?.accountHolderName || "",
    bankName: user?.bankDetails?.bankName || "",
    accountNumber: user?.bankDetails?.accountNumber || "",
    ifsc: user?.bankDetails?.ifsc || "",
  },
  vehicleDetails: {
    type: user?.vehicleDetails?.type || "BICYCLE",
    registrationNumber: user?.vehicleDetails?.registrationNumber || "",
  },
});

const RiderProfile = () => {
  const [profile, setProfile] = useState(getStoredUser());
  const [form, setForm] = useState(buildInitialForm(getStoredUser()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const previewAvatar = useMemo(() => form.avatarUrl || fallbackAvatar, [form.avatarUrl]);

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const user = await getProfile();
      setProfile(user);
      setForm(buildInitialForm(user));
    } catch (requestError) {
      setError(requestError.message || "Failed to load rider profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    setMessage("");
    setError("");

    try {
      const uploadedAsset = await uploadImage(file, "dodago/riders");
      handleFieldChange("avatarUrl", uploadedAsset.url);
      setMessage("Profile photo uploaded. Save profile to apply it.");
    } catch (requestError) {
      setError(requestError.message || "Failed to upload rider photo");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updatedUser = await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        avatarUrl: form.avatarUrl || null,
        bankDetails: form.bankDetails.accountHolderName || form.bankDetails.bankName || form.bankDetails.accountNumber || form.bankDetails.ifsc
          ? form.bankDetails
          : null,
        vehicleDetails: {
          type: form.vehicleDetails.type,
          registrationNumber: form.vehicleDetails.type === "BIKE" ? form.vehicleDetails.registrationNumber || null : null,
        },
      });

      setProfile(updatedUser);
      setForm(buildInitialForm(updatedUser));
      setMessage("Rider profile updated successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to update rider profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-4 md:pb-10 md:pt-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl border border-indigo-300 bg-indigo-700 p-8 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={previewAvatar} alt={form.name || "Rider"} className="h-16 w-16 rounded-full border border-white/30 object-cover" />
              <div>
                <h1 className="text-3xl font-black">{form.name || "Rider Profile"}</h1>
                <p className="text-sm opacity-90">{profile?.email || "Keep your rider account updated from here."}</p>
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 font-bold hover:bg-white/30 disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {message ? <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-indigo-900">Profile Photo</h2>
            <div className="flex flex-col items-center text-center">
              <img src={previewAvatar} loading="lazy" alt={form.name || "Rider"} className="h-32 w-32 rounded-full border-4 border-indigo-100 object-cover shadow-sm" />
              <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
                <Camera className="h-4 w-4" />
                {uploadingAvatar ? "Uploading..." : "Change Photo"}
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploadingAvatar} />
              </label>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg lg:col-span-2">
            <h2 className="mb-4 text-xl font-bold text-indigo-900">Rider Details</h2>
            {loading ? (
              <div className="py-10 text-sm text-slate-500">Loading rider profile...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <input type="text" value={form.name} onChange={(event) => handleFieldChange("name", event.target.value)} className="w-full bg-transparent text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input type="email" value={form.email} onChange={(event) => handleFieldChange("email", event.target.value)} className="w-full bg-transparent text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <input type="tel" value={form.phone} onChange={(event) => handleFieldChange("phone", event.target.value)} className="w-full bg-transparent text-sm outline-none" />
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p><strong>Role:</strong> {profile?.role || "RIDER"}</p>
                  <p className="mt-1"><strong>Status:</strong> {profile?.status || "PENDING"}</p>
                  <p className="mt-1"><strong>Availability:</strong> {profile?.isOnline ? "Online" : "Offline"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-indigo-900">Bank Details</h2>
            <div className="space-y-3">
              <input value={form.bankDetails.accountHolderName} onChange={(event) => handleNestedChange("bankDetails", "accountHolderName", event.target.value)} className="w-full rounded-xl border p-3" placeholder="Account Holder Name" />
              <input value={form.bankDetails.bankName} onChange={(event) => handleNestedChange("bankDetails", "bankName", event.target.value)} className="w-full rounded-xl border p-3" placeholder="Bank Name" />
              <input value={form.bankDetails.accountNumber} onChange={(event) => handleNestedChange("bankDetails", "accountNumber", event.target.value)} className="w-full rounded-xl border p-3" placeholder="Account Number" />
              <input value={form.bankDetails.ifsc} onChange={(event) => handleNestedChange("bankDetails", "ifsc", event.target.value.toUpperCase())} className="w-full rounded-xl border p-3" placeholder="IFSC Code" />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg lg:col-span-2">
            <h2 className="mb-4 text-xl font-bold text-indigo-900">Vehicle Details</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Vehicle Type</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <Bike className="h-4 w-4 text-slate-400" />
                  <select value={form.vehicleDetails.type} onChange={(event) => handleNestedChange("vehicleDetails", "type", event.target.value)} className="w-full bg-transparent text-sm outline-none">
                    <option value="BICYCLE">Bicycle</option>
                    <option value="BIKE">Bike</option>
                  </select>
                </div>
              </div>
              {form.vehicleDetails.type === "BIKE" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Bike Registration Number</label>
                  <input value={form.vehicleDetails.registrationNumber} onChange={(event) => handleNestedChange("vehicleDetails", "registrationNumber", event.target.value.toUpperCase())} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Enter bike number" />
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  Bicycle selected. Registration number is not required.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderProfile;
