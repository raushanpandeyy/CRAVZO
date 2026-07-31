// ======================
// OPTIMIZED VENDOR PROFILE
// ======================

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Link } from "react-router-dom";

import {
  BarChart3,
  CheckCircle,
  ChefHat,
  Clock,
  CreditCard,
  Edit,
  ImagePlus,
  Loader2,
  MessageCircle,
  Plus,
  MapPin,
  Star,
  Store,
} from "lucide-react";

import {
  getMyRestaurants,
  saveVendorRestaurant,
} from "../../services/vendorService.js";

import { uploadImage } from "../../services/userService.js";
import { VerifiedBadge, ProfileProgress, VerifiedBadgeLarge } from "../../components/vendors/VerifiedBadge.jsx";
import { getCloudinaryUrl } from "../../utils/cloudinary.js";
import { SkeletonAvatar, SkeletonForm } from "../../components/Skeleton.jsx";
import GoogleAddressPicker from "../../components/GoogleAddressPicker.jsx";
import RestaurantQrCard from "../../components/vendors/RestaurantQrCard.jsx";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const profileLinks = [
  { label: "Kitchen", to: "/vendor-dashboard/kitchen", icon: ChefHat },
  { label: "Reports", to: "/vendor-dashboard/reports", icon: BarChart3 },
  { label: "Reviews", to: "/vendor-dashboard/reviews", icon: Star },
  { label: "Chat", to: "/vendor-dashboard/chat", icon: MessageCircle },
];

// ======================
// IMAGE OPTIMIZATION
// ======================

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect fill='%23f1f5f9' width='600' height='400'/%3E%3Ctext fill='%2394a3b8' font-family='Arial' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const getOptimizedImage = (
  url,
  width = 600,
  height = 400
) => {
  if (!url) return FALLBACK_IMG;
  if (url.includes("cloudinary.com")) return getCloudinaryUrl(url, { width, height });
  return url;
};

// ======================
// EMPTY PROFILE
// ======================

const emptyProfile = {
  name: "",
  description: "",
  cuisine: "",
  phone: "",
  imageUrl: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  latitude: null,
  longitude: null,
  fssaiNumber: "",
  isOpen: true,
  openingTime: "09:00",
  closingTime: "22:00",
  openDays: [...DAYS_OF_WEEK],

  bankDetails: {
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
  },
};

const createFormFromRestaurant = (restaurant) => restaurant
  ? {
    name: restaurant.name || "",
    description: restaurant.description || "",
    cuisine: restaurant.cuisine || "",
    phone: restaurant.phone || "",
    imageUrl: restaurant.imageUrl || "",
    addressLine1: restaurant.addressLine1 || "",
    addressLine2: restaurant.addressLine2 || "",
    city: restaurant.city || "",
    state: restaurant.state || "",
    postalCode: restaurant.postalCode || "",
    latitude: restaurant.latitude ?? null,
    longitude: restaurant.longitude ?? null,
    fssaiNumber: restaurant.fssaiNumber || "",
    isOpen: restaurant.isOpen ?? true,
    openingTime: restaurant.openingTime || "09:00",
    closingTime: restaurant.closingTime || "22:00",
    openDays: restaurant.openDays?.length ? restaurant.openDays : [...DAYS_OF_WEEK],
    bankDetails: {
      accountHolderName: restaurant.bankDetails?.accountHolderName || "",
      bankName: restaurant.bankDetails?.bankName || "",
      accountNumber: restaurant.bankDetails?.accountNumber || "",
      ifsc: restaurant.bankDetails?.ifsc || "",
    },
  }
  : {
    ...emptyProfile,
    openDays: [...DAYS_OF_WEEK],
    bankDetails: { ...emptyProfile.bankDetails },
  };
// ======================
// MAIN COMPONENT
// ======================

const VendorProfile = () => {
  const [restaurants, setRestaurants] =
    useState([]);

  const [restaurant, setRestaurant] =
    useState(null);

  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState("");

  const [isCreatingNew, setIsCreatingNew] =
    useState(false);

  const [form, setForm] =
    useState(emptyProfile);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ======================
  // LOAD RESTAURANT
  // ======================

  const loadRestaurant =
    useCallback(async (preferredRestaurantId = null) => {
      setLoading(true);
      setError("");

      try {
        const data = await getMyRestaurants();
        const nextRestaurants = Array.isArray(data) ? data : [];
        const nextRestaurant = preferredRestaurantId
          ? nextRestaurants.find((entry) => entry.id === preferredRestaurantId) || nextRestaurants[0] || null
          : nextRestaurants[0] || null;

        setRestaurants(nextRestaurants);
        setRestaurant(nextRestaurant);
        setSelectedRestaurantId(nextRestaurant?.id || "");
        setIsCreatingNew(!nextRestaurant && nextRestaurants.length === 0);
        setForm(createFormFromRestaurant(nextRestaurant));
      } catch (requestError) {
        setError(
          requestError.message ||
          "Failed to load vendor profile"
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);
  const handleSelectRestaurant = useCallback((restaurantId) => {
    const nextRestaurant = restaurants.find((entry) => entry.id === restaurantId) || null;
    setSelectedRestaurantId(nextRestaurant?.id || "");
    setRestaurant(nextRestaurant);
    setIsCreatingNew(false);
    setForm(createFormFromRestaurant(nextRestaurant));
    setMessage("");
    setError("");
  }, [restaurants]);

  const handleAddRestaurant = useCallback(() => {
    setSelectedRestaurantId("new");
    setRestaurant(null);
    setIsCreatingNew(true);
    setForm(createFormFromRestaurant(null));
    setMessage("");
    setError("");
  }, []);

  // ======================
  // MEMOIZED ADDRESS
  // ======================

  const addressLine = useMemo(
    () =>
      [
        restaurant?.addressLine1,
        restaurant?.addressLine2,
        restaurant?.city,
        restaurant?.state,
        restaurant?.postalCode,
      ]
        .filter(Boolean)
        .join(", "),
    [restaurant]
  );

  // ======================
  // FORM HANDLER
  // ======================

  const handleInputChange =
    useCallback((field, value) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }, []);

  // ======================
  // BANK HANDLER
  // ======================

  const handleBankChange =
    useCallback((field, value) => {
      setForm((prev) => ({
        ...prev,

        bankDetails: {
          ...prev.bankDetails,
          [field]: value,
        },
      }));
    }, []);

  // ======================
  // TOGGLE OPEN DAY
  // ======================

  const toggleOpenDay =
    useCallback((day) => {
      setForm((prev) => ({
        ...prev,

        openDays:
          prev.openDays.includes(day)
            ? prev.openDays.filter(
              (entry) =>
                entry !== day
            )
            : [
              ...prev.openDays,
              day,
            ],
      }));
    }, []);

  // ======================
  // IMAGE UPLOAD
  // ======================

  const handleRestaurantImageChange =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      // IMAGE SIZE VALIDATION
      if (
        file.size >
        2 * 1024 * 1024
      ) {
        setError(
          "Image must be below 2MB"
        );

        return;
      }

      setUploadingImage(true);

      setMessage("");
      setError("");

      try {
        const uploadedAsset =
          await uploadImage(
            file,
            "dodago/restaurants"
          );

        setForm((prev) => ({
          ...prev,

          imageUrl:
            uploadedAsset.url,
        }));

        setMessage(
          "Restaurant image uploaded"
        );
      } catch (requestError) {
        setError(
          requestError.message ||
          "Failed to upload image"
        );
      } finally {
        setUploadingImage(false);

        event.target.value =
          "";
      }
    };

  // ======================
  // SAVE PROFILE
  // ======================

  const handleSaveProfile = async () => {
    setMessage("");
    setError("");

    if (
      !form.name ||
      !form.cuisine ||
      !form.phone ||
      !form.addressLine1 ||
      !form.city ||
      !form.state ||
      !form.postalCode
    ) {
      setError(
        "Please fill all required fields."
      );

      return;
    }

    setSaving(true);

    try {
      const savedRestaurant =
        await saveVendorRestaurant(
          {
            name: form.name,
            description: form.description,
            cuisine: form.cuisine,
            phone: form.phone,
            imageUrl: form.imageUrl || null,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2 || null,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            fssaiNumber: form.fssaiNumber || null,
            status: "ACTIVE",
            isOpen: form.isOpen,
            openingTime: form.openingTime,
            closingTime: form.closingTime,
            openDays: form.openDays,
            latitude: form.latitude ?? form._lat ?? null,
            longitude: form.longitude ?? form._lng ?? null,
            bankDetails:
              form.bankDetails.accountHolderName ||
              form.bankDetails.bankName ||
              form.bankDetails.accountNumber ||
              form.bankDetails.ifsc
                ? form.bankDetails
                : null,
          },
          isCreatingNew ? null : restaurant?.id
        );

      await loadRestaurant(savedRestaurant?.id);

      setMessage(
        isCreatingNew
          ? "Restaurant created successfully!"
          : "Restaurant updated successfully!"
      );
    } catch (requestError) {
      setError(
        requestError.message ||
        "Failed to save profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================
  // LOADING
  // ======================

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#F4F7FB] p-4 pb-32 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <SkeletonAvatar />
          <SkeletonForm rows={6} />
          <SkeletonForm rows={4} />
          <SkeletonForm rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F4F7FB] p-4 pb-32 sm:p-6 sm:pb-32 lg:p-8 lg:pb-8">

      <div className="max-w-5xl mx-auto space-y-6">

        {/* STATUS */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">
                  Vendor Profile
                </h1>
                <VerifiedBadge restaurant={restaurant} />
              </div>

              <p className="text-sm text-slate-500 mt-1">
                Manage your restaurant information
              </p>
            </div>

            {restaurant ? (
              <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold w-fit">
                <CheckCircle size={16} />
                Restaurant Active
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold w-fit">
                <Store size={16} />
                Create Restaurant
              </div>
            )}
          </div>
        </div>


        {/* RESTAURANT SWITCHER */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700">
                Select Restaurant
              </label>
              <select
                value={isCreatingNew ? "new" : selectedRestaurantId}
                onChange={(event) => {
                  if (event.target.value === "new") {
                    handleAddRestaurant();
                    return;
                  }
                  handleSelectRestaurant(event.target.value);
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {restaurants.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name || "Unnamed Restaurant"}{entry.city ? ` - ${entry.city}` : ""}
                  </option>
                ))}
                <option value="new">+ Add another restaurant</option>
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {restaurants.length
                  ? `${restaurants.length} restaurant${restaurants.length > 1 ? "s" : ""} connected to this profile.`
                  : "No restaurant created yet."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddRestaurant}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={16} />
              Add Another Restaurant
            </button>
          </div>

          {isCreatingNew ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You are creating a new restaurant under this same vendor profile. Existing restaurants will stay unchanged.
            </div>
          ) : null}
        </div>
        {/* ALERTS */}

        {message && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 md:hidden">
          {profileLinks.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-white p-3 text-center text-[11px] font-black text-indigo-950 shadow-sm active:scale-95"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </Link>
          ))}
        </div>

        {/* PROGRESS STATUS */}
        {restaurant && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <VerifiedBadgeLarge restaurant={restaurant} />
            <div className="mt-4">
              <ProfileProgress restaurant={restaurant} />
            </div>
          </div>
        )}

        <RestaurantQrCard restaurant={restaurant} />

        {/* BASIC INFO */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Edit size={18} />
            Restaurant Basics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* IMAGE */}

            <div>

              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">

                {form.imageUrl ? (
                  <img
                    src={getOptimizedImage(
                      form.imageUrl,
                      600,
                      400
                    )}
                    alt={form.name || "Restaurant"}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                    No image uploaded
                  </div>
                )}
              </div>

              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-all duration-200">

                <ImagePlus size={16} />

                {uploadingImage
                  ? "Uploading..."
                  : "Upload Restaurant Image"}

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleRestaurantImageChange
                  }
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>

            {/* FORM */}

            <div className="space-y-4">

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Restaurant Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    handleInputChange(
                      "name",
                      e.target.value
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Dodago Kitchen"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Cuisine
                </label>

                <input
                  type="text"
                  value={form.cuisine}
                  onChange={(e) =>
                    handleInputChange(
                      "cuisine",
                      e.target.value
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="North Indian"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    handleInputChange(
                      "phone",
                      e.target.value
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  FSSAI Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>

                <input
                  type="text"
                  value={form.fssaiNumber}
                  onChange={(e) =>
                    handleInputChange(
                      "fssaiNumber",
                      e.target.value
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 12345678901234"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    handleInputChange(
                      "description",
                      e.target.value
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your restaurant..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ADDRESS */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <MapPin size={18} />
            Restaurant Address
            <span className="ml-auto text-xs text-slate-400 font-normal">Required for customers to find you</span>
          </h2>

          <div className="mb-4">
            <GoogleAddressPicker
              value={{
                line1: form.addressLine1,
                line2: form.addressLine2,
                city: form.city,
                state: form.state,
                postalCode: form.postalCode,
                latitude: form.latitude ?? form._lat,
                longitude: form.longitude ?? form._lng,
              }}
              onChange={(nextAddress) => {
                setForm((prev) => ({
                  ...prev,
                  ...(nextAddress.line1 ? { addressLine1: nextAddress.line1 } : {}),
                  ...(nextAddress.line2 ? { addressLine2: nextAddress.line2 } : {}),
                  ...(nextAddress.city ? { city: nextAddress.city } : {}),
                  ...(nextAddress.state ? { state: nextAddress.state } : {}),
                  ...(nextAddress.postalCode ? { postalCode: nextAddress.postalCode } : {}),
                  latitude: nextAddress.latitude ?? prev.latitude,
                  longitude: nextAddress.longitude ?? prev.longitude,
                  _lat: nextAddress.latitude ?? prev._lat,
                  _lng: nextAddress.longitude ?? prev._lng,
                }));
                setMessage("Location selected. Save profile to apply.");
                setError("");
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              type="text"
              value={form.addressLine1}
              onChange={(e) =>
                handleInputChange(
                  "addressLine1",
                  e.target.value
                )
              }
              placeholder="Address Line 1"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              value={form.addressLine2}
              onChange={(e) =>
                handleInputChange(
                  "addressLine2",
                  e.target.value
                )
              }
              placeholder="Address Line 2"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              value={form.city}
              onChange={(e) =>
                handleInputChange(
                  "city",
                  e.target.value
                )
              }
              placeholder="City"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              value={form.state}
              onChange={(e) =>
                handleInputChange(
                  "state",
                  e.target.value
                )
              }
              placeholder="State"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              value={form.postalCode}
              onChange={(e) =>
                handleInputChange(
                  "postalCode",
                  e.target.value
                )
              }
              placeholder="Postal Code"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="number"
              step="any"
              value={form.latitude ?? form._lat ?? ""}
              onChange={(e) => handleInputChange("latitude", e.target.value ? Number(e.target.value) : null)}
              placeholder="Latitude (Google Maps)"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="number"
              step="any"
              value={form.longitude ?? form._lng ?? ""}
              onChange={(e) => handleInputChange("longitude", e.target.value ? Number(e.target.value) : null)}
              placeholder="Longitude (Google Maps)"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* BANK DETAILS */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Clock size={18} />
            Business Hours
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-semibold text-slate-700">Opening Time</label>
              <input
                type="time"
                value={form.openingTime}
                onChange={(e) => handleInputChange("openingTime", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Closing Time</label>
              <input
                type="time"
                value={form.closingTime}
                onChange={(e) => handleInputChange("closingTime", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-3 block">Open Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleOpenDay(day)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    form.openDays.includes(day)
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Selected: {form.openDays.length} days ({form.openDays.join(", ")})
            </p>
          </div>
        </div>

        {/* BANK DETAILS */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <CreditCard size={18} />
            Bank Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              type="text"
              value={
                form.bankDetails
                  .accountHolderName
              }
              onChange={(e) =>
                handleBankChange(
                  "accountHolderName",
                  e.target.value
                )
              }
              placeholder="Account Holder Name"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              value={
                form.bankDetails.bankName
              }
              onChange={(e) =>
                handleBankChange(
                  "bankName",
                  e.target.value
                )
              }
              placeholder="Bank Name"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              inputMode="numeric"
              value={
                form.bankDetails
                  .accountNumber
              }
              onChange={(e) =>
                handleBankChange(
                  "accountNumber",
                  e.target.value
                )
              }
              placeholder="Account Number"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              value={form.bankDetails.ifsc}
              onChange={(e) =>
                handleBankChange(
                  "ifsc",
                  e.target.value
                )
              }
              placeholder="IFSC Code"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* SAVE BUTTON */}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
          >
            {saving
              ? "Saving..."
              : restaurant
                ? "Save Restaurant Profile"
                : "Create Restaurant"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default VendorProfile;

