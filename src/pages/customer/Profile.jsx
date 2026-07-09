import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, Camera, Gift, LogOut, Mail, Phone, Save, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getStoredUser } from "../../services/authService.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ensureFcmToken } from "../../firebase/notificationService.js";
import { deleteAccount, getProfile, updateProfile, uploadImage } from "../../services/userService.js";
import { getMyReferral } from "../../services/referralService.js";
import { SkeletonAvatar, SkeletonForm } from "../../components/Skeleton.jsx";

const fallbackAvatar =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80";

const buildInitialForm = (user) => ({
  name: user?.name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  avatarUrl: user?.avatarUrl || "",
});

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(getStoredUser());
  const [form, setForm] = useState(buildInitialForm(getStoredUser()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [referralStats, setReferralStats] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const user = await getProfile();
      setProfile(user);
      setForm(buildInitialForm(user));
    } catch (requestError) {
      setError(requestError.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    getMyReferral().then(setReferralStats).catch(() => setReferralStats(null));
  }, []);

  const previewAvatar = useMemo(() => form.avatarUrl || fallbackAvatar, [form.avatarUrl]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    setMessage("");
    setError("");

    uploadImage(file, "dodago/customers")
      .then((uploadedAsset) => {
        handleFieldChange("avatarUrl", uploadedAsset.url);
        setMessage("Profile photo uploaded. Save profile to keep it.");
      })
      .catch((requestError) => {
        setError(requestError.message || "Failed to upload image");
      })
      .finally(() => {
        setUploadingAvatar(false);
        event.target.value = "";
      });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updatedUser = await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        avatarUrl: form.avatarUrl || null,
      });

      setProfile(updatedUser);
      setForm(buildInitialForm(updatedUser));
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setMessage("");
    setError("");

    try {
      await deleteAccount(deleteConfirmation);
      navigate("/");
    } catch (requestError) {
      setError(requestError.message || "Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleEnableNotifications = async () => {
    setEnablingNotifications(true);
    setMessage("");
    setError("");

    try {
      const token = await ensureFcmToken({ forcePrompt: true });
      if (token) {
        setMessage("Notifications enabled successfully.");
      } else if (!("Notification" in window)) {
        setError("This browser does not support web notifications.");
      } else if (Notification.permission === "denied") {
        setError("Notifications are blocked. Enable them from your browser site settings.");
      } else {
        setError("Notifications could not be enabled on this device.");
      }
    } catch (requestError) {
      setError(requestError.message || "Failed to enable notifications.");
    } finally {
      setEnablingNotifications(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-3 py-3 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[28px] bg-indigo-950 p-5 text-white shadow-xl shadow-indigo-950/15 sm:rounded-3xl sm:bg-white sm:p-8 sm:text-slate-900 sm:shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-200 sm:hidden">Account</p>
              <h1 className="text-2xl font-black sm:text-3xl sm:font-bold sm:text-slate-900">My Profile</h1>
              <p className="mt-2 text-sm leading-6 text-indigo-100 sm:text-slate-500">
                Keep your personal details up to date so checkout and support stay smooth.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                onClick={handleEnableNotifications}
                disabled={enablingNotifications}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-xl sm:bg-amber-50 sm:px-5 sm:font-semibold sm:text-amber-700 sm:hover:bg-amber-100"
              >
                <Bell className="h-4 w-4" />
                {enablingNotifications ? "Enabling..." : "Notifications"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-indigo-950 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-xl sm:bg-indigo-600 sm:px-5 sm:font-semibold sm:text-white sm:hover:bg-indigo-700"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition active:scale-95 sm:rounded-xl sm:bg-rose-50 sm:px-5 sm:font-semibold sm:text-rose-700 sm:hover:bg-rose-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/account/refer")}
            className="flex items-center justify-between rounded-[28px] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-3xl sm:p-6"
          >
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-indigo-600">Refer & Earn</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">{referralStats?.qualifiedReferrals || 0} qualified friends</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Code: {referralStats?.referralCode || "Loading"}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <Gift className="h-6 w-6" />
            </div>
          </button>

          <div className="rounded-[28px] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-slate-900">Delete Account</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">Type DELETE to remove personal account data. Active orders must be completed first.</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    placeholder="Type DELETE"
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-rose-400"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== "DELETE" || deletingAccount}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:bg-slate-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingAccount ? "Deleting" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8">
            <h2 className="text-lg font-black text-slate-900 sm:text-xl sm:font-semibold">Profile Photo</h2>
            <p className="mt-1 text-sm text-slate-500">Upload a clear photo so your account feels personal and trusted.</p>

            <div className="mt-6 flex flex-col items-center text-center sm:mt-8">
              <img
                loading="lazy"
                decoding="async"
                src={previewAvatar}
                alt={form.name || "Customer profile"}
                className="h-28 w-28 rounded-full border-4 border-indigo-100 object-cover shadow-sm sm:h-36 sm:w-36"
              />

              <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
                <Camera className="h-4 w-4" />
                {uploadingAvatar ? "Uploading..." : "Change Photo"}
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploadingAvatar} />
              </label>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8">
            <h2 className="text-lg font-black text-slate-900 sm:text-xl sm:font-semibold">Personal Details</h2>
            <p className="mt-1 text-sm text-slate-500">These details are synced with your authenticated account.</p>

            {loading ? (
              <div className="mt-6 sm:mt-8">
                <SkeletonAvatar className="mb-8" />
                <SkeletonForm rows={3} />
              </div>
            ) : (
              <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-indigo-500">
                    <User className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => handleFieldChange("name", event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-indigo-500">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => handleFieldChange("email", event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-indigo-500">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => handleFieldChange("phone", event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p>
                    <strong>Account role:</strong> {profile?.role || "CUSTOMER"}
                  </p>
                  <p className="mt-1">
                    <strong>Status:</strong> {profile?.status || "ACTIVE"}
                  </p>
                  <p className="mt-1">
                    <strong>Joined:</strong>{" "}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recently"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
