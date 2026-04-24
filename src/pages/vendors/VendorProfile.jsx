import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, CreditCard, Edit, ImagePlus, MapPin, Store } from "lucide-react";

<<<<<<< HEAD
import { getMyRestaurant, saveVendorRestaurant } from "../../services/vendorService.js";
import { uploadImage } from "../../services/userService.js";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
=======
import { getMyRestaurant, saveVendorRestaurant } from "../../services/vendorService";
import { uploadImage } from "../../services/userService";
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

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
  isOpen: true,
<<<<<<< HEAD
  openingTime: "09:00",
  closingTime: "22:00",
  openDays: [...DAYS_OF_WEEK],
  bankDetails: {
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
  },
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
};

const VendorProfile = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRestaurant = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyRestaurant();
      setRestaurant(data);
      setForm(
        data
          ? {
              name: data.name || "",
              description: data.description || "",
              cuisine: data.cuisine || "",
              phone: data.phone || "",
              imageUrl: data.imageUrl || "",
              addressLine1: data.addressLine1 || "",
              addressLine2: data.addressLine2 || "",
              city: data.city || "",
              state: data.state || "",
              postalCode: data.postalCode || "",
              isOpen: data.isOpen ?? true,
<<<<<<< HEAD
              openingTime: data.openingTime || "09:00",
              closingTime: data.closingTime || "22:00",
              openDays: data.openDays?.length ? data.openDays : [...DAYS_OF_WEEK],
              bankDetails: {
                accountHolderName: data.bankDetails?.accountHolderName || "",
                bankName: data.bankDetails?.bankName || "",
                accountNumber: data.bankDetails?.accountNumber || "",
                ifsc: data.bankDetails?.ifsc || "",
              },
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
            }
          : emptyProfile,
      );
    } catch (requestError) {
      setError(requestError.message || "Failed to load vendor profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurant();
  }, []);

  const addressLine = useMemo(
    () => [restaurant?.addressLine1, restaurant?.addressLine2, restaurant?.city, restaurant?.state, restaurant?.postalCode].filter(Boolean).join(", "),
    [restaurant],
  );

  const handleSaveProfile = async () => {
    setMessage("");
    setError("");

    if (!form.name || !form.cuisine || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.postalCode) {
      setError("Please fill in all required restaurant details.");
      return;
    }

    try {
      const savedRestaurant = await saveVendorRestaurant(
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
          status: "ACTIVE",
          isOpen: form.isOpen,
<<<<<<< HEAD
          openingTime: form.openingTime,
          closingTime: form.closingTime,
          openDays: form.openDays,
          bankDetails: form.bankDetails.accountHolderName || form.bankDetails.bankName || form.bankDetails.accountNumber || form.bankDetails.ifsc
            ? form.bankDetails
            : null,
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
        },
        restaurant?.id,
      );
      setRestaurant(savedRestaurant);
      await loadRestaurant();
      setMessage(restaurant ? "Restaurant profile updated successfully!" : "Restaurant created successfully!");
    } catch (requestError) {
      setError(requestError.message || "Failed to save restaurant profile");
    }
  };

<<<<<<< HEAD
  const toggleOpenDay = (day) => {
    setForm((prev) => ({
      ...prev,
      openDays: prev.openDays.includes(day) ? prev.openDays.filter((entry) => entry !== day) : [...prev.openDays, day],
    }));
  };

  const handleBankChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  const handleRestaurantImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingImage(true);
    setMessage("");
    setError("");

    try {
      const uploadedAsset = await uploadImage(file, "cravzo/restaurants");
      setForm((prev) => ({
        ...prev,
        imageUrl: uploadedAsset.url,
      }));
      setMessage("Restaurant image uploaded. Save profile to publish it.");
    } catch (requestError) {
      setError(requestError.message || "Failed to upload restaurant image");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  return (
    <div className="flex-1 sm:ml-40 ml-0 min-h-screen overflow-y-auto sm:px-8 sm:py-8 p-4 bg-[#F4F7FB]">
      <div className="max-w-4xl mr-auto ml-8 space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Vendor Profile</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your restaurant information and keep your storefront live.</p>
            </div>
            {restaurant ? (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Restaurant Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                <Store size={16} />
                <span className="text-sm font-medium">Create your restaurant</span>
              </div>
            )}
          </div>
        </div>

        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Edit size={20} />
            Restaurant Basics
          </h2>

          {loading ? <p className="text-gray-500">Loading profile...</p> : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
              <input type="text" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
              <input type="text" value={form.cuisine} onChange={(event) => setForm((prev) => ({ ...prev, cuisine: event.target.value }))} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} className="w-full p-3 border rounded-lg" />
            </div>
            <div className="md:row-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Image</label>
              <div className="rounded-2xl border border-dashed border-slate-300 p-4">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt={form.name || "Restaurant"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">No restaurant image uploaded yet</div>
                  )}
                </div>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
                  <ImagePlus size={16} />
                  {uploadingImage ? "Uploading..." : "Upload Image"}
                  <input type="file" accept="image/*" onChange={handleRestaurantImageChange} className="hidden" disabled={uploadingImage} />
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} className="w-full p-3 border rounded-lg" rows="4" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Restaurant Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input type="text" value={form.addressLine1} onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input type="text" value={form.addressLine2} onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" value={form.state} onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input type="text" value={form.postalCode} onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))} className="w-full p-3 border rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Store Status
          </h2>
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={form.isOpen} onChange={(event) => setForm((prev) => ({ ...prev, isOpen: event.target.checked }))} />
            Mark restaurant as open for orders
          </label>

<<<<<<< HEAD
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
              <input type="time" value={form.openingTime} onChange={(event) => setForm((prev) => ({ ...prev, openingTime: event.target.value }))} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
              <input type="time" value={form.closingTime} onChange={(event) => setForm((prev) => ({ ...prev, closingTime: event.target.value }))} className="w-full p-3 border rounded-lg" />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Open Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleOpenDay(day)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    form.openDays.includes(day) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          {restaurant ? (
            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
              <p><strong>Status:</strong> {restaurant.status}</p>
              <p><strong>Address:</strong> {addressLine || "Not set"}</p>
<<<<<<< HEAD
              <p><strong>Hours:</strong> {form.openingTime || "--:--"} - {form.closingTime || "--:--"}</p>
              <p><strong>Days:</strong> {form.openDays.length ? form.openDays.join(", ") : "Not set"}</p>
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
<<<<<<< HEAD
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Bank Account
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
              <input type="text" value={form.bankDetails.accountHolderName} onChange={(event) => handleBankChange("accountHolderName", event.target.value)} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input type="text" value={form.bankDetails.bankName} onChange={(event) => handleBankChange("bankName", event.target.value)} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input type="text" value={form.bankDetails.accountNumber} onChange={(event) => handleBankChange("accountNumber", event.target.value)} className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC</label>
              <input type="text" value={form.bankDetails.ifsc} onChange={(event) => handleBankChange("ifsc", event.target.value.toUpperCase())} className="w-full p-3 border rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
          <button onClick={handleSaveProfile} className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 font-semibold">
            {restaurant ? "Save Restaurant Profile" : "Create Restaurant"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
