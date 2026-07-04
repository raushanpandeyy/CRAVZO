import React, { useEffect, useMemo, useState } from "react";
import { ImagePlus, Plus, Save, Trash2, X } from "lucide-react";

import { API_ENDPOINTS } from "../../constants/apiEndpoints.js";
import { apiRequest } from "../../services/api.js";
import { uploadImage } from "../../services/userService.js";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MENU_CATEGORIES = ["Main Course", "Starters", "Thali", "Beverages", "Desserts", "Biryani", "Sides"];

const emptyForm = {
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  password: "",
  restaurantName: "",
  description: "",
  cuisine: "",
  restaurantPhone: "",
  imageUrl: "",
  latitude: null,
  longitude: null,
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  status: "ACTIVE",
  isOpen: true,
  openingTime: "09:00",
  closingTime: "22:00",
  openDays: [...DAYS_OF_WEEK],
};

const ALL_SIZES = ["S", "M", "L"];
const emptyMenuItem = {
  name: "",
  description: "",
  category: "",
  price: "",
  imageUrl: "",
  sizes: [],
  isVeg: false,
  status: "ACTIVE",
};

const optimizeImageUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_320/");
};

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [menuItems, setMenuItems] = useState([{ ...emptyMenuItem }]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadingKey, setUploadingKey] = useState("");

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(
        API_ENDPOINTS.admin.restaurants({
          page,
          limit: 10,
          query: search,
          status: statusFilter,
        }),
      );
      setRestaurants(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [page, search, statusFilter]);

  const validMenuItems = useMemo(
    () =>
      menuItems.filter((item) => item.name.trim() || item.category.trim() || item.price || item.imageUrl),
    [menuItems],
  );

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleOpenDay = (day) => {
    setForm((prev) => ({
      ...prev,
      openDays: prev.openDays.includes(day)
        ? prev.openDays.filter((entry) => entry !== day)
        : [...prev.openDays, day],
    }));
  };

  const handleMenuChange = (index, field, value) => {
    setMenuItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const addMenuRow = () => {
    setMenuItems((prev) => [...prev, { ...emptyMenuItem }]);
  };

  const removeMenuRow = (index) => {
    setMenuItems((prev) => (prev.length === 1 ? [{ ...emptyMenuItem }] : prev.filter((_, itemIndex) => itemIndex !== index)));
  };

  const uploadAdminImage = async (file, folder, key, onUploaded) => {
    if (!file) return;

    setUploadingKey(key);
    setMessage("");
    setError("");

    try {
      const uploadedAsset = await uploadImage(file, folder);
      onUploaded(uploadedAsset.url);
      setMessage("Image uploaded successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to upload image");
    } finally {
      setUploadingKey("");
    }
  };

  const resetCreateForm = () => {
    setForm(emptyForm);
    setMenuItems([{ ...emptyMenuItem }]);
  };

  const createRestaurant = async () => {
    setMessage("");
    setError("");

    const requiredFields = [
      form.ownerName,
      form.ownerEmail,
      form.ownerPhone,
      form.password,
      form.restaurantName,
      form.addressLine1,
      form.city,
      form.state,
      form.postalCode,
    ];

    if (requiredFields.some((value) => !value?.toString().trim())) {
      setError("Please fill all required account and restaurant fields.");
      return;
    }

    const incompleteMenu = validMenuItems.some((item) => !item.name.trim() || !item.category.trim() || !item.price);
    if (incompleteMenu) {
      setError("Menu rows need item name, category and price.");
      return;
    }
    const invalidSizes = validMenuItems.some((item) =>
      item.sizes.some((s) => !s.size || !s.price),
    );
    if (invalidSizes) {
      setError("Each size row needs a size selected and a price.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest(API_ENDPOINTS.admin.createRestaurant, {
        method: "POST",
        body: JSON.stringify({
          owner: {
            name: form.ownerName,
            email: form.ownerEmail,
            phone: form.ownerPhone || null,
            password: form.password,
          },
          restaurant: {
            name: form.restaurantName,
            description: form.description || null,
            cuisine: form.cuisine || null,
            phone: form.restaurantPhone || form.ownerPhone || null,
            imageUrl: form.imageUrl || null,
            latitude: form.latitude ?? null,
            longitude: form.longitude ?? null,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2 || null,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            status: form.status,
            isOpen: form.isOpen,
            openingTime: form.openingTime || null,
            closingTime: form.closingTime || null,
            openDays: form.openDays,
          },
          menuItems: validMenuItems.map((item) => ({
            name: item.name,
            description: item.description || null,
            category: item.category,
            price: Number(item.price),
            imageUrl: item.imageUrl || null,
            sizes: item.sizes.length > 0 ? item.sizes : undefined,
            isVeg: item.isVeg,
            status: item.status,
          })),
        }),
      });

      setMessage("Restaurant account created. Owner can login with the email and password now.");
      setShowCreateForm(false);
      resetCreateForm();
      setPage(1);
      await loadRestaurants();
    } catch (requestError) {
      setError(requestError.message || "Failed to create restaurant account");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (restaurantId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiRequest(API_ENDPOINTS.admin.restaurantStatus(restaurantId), {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setRestaurants((prev) =>
        prev.map((restaurant) => (restaurant.id === restaurantId ? { ...restaurant, status: newStatus } : restaurant)),
      );
    } catch (err) {
      setError(err.message || "Failed to update restaurant status");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-700";
      case "INACTIVE":
        return "bg-slate-100 text-slate-500";
      case "PENDING_APPROVAL":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-500";
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-20 md:pb-4">
      <div className="mx-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:mx-0 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-950 md:text-2xl">Vendors</h1>
            <p className="text-sm text-slate-500">Manage restaurants, owners and onboarding</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreateForm ? "Close" : "Create Restaurant"}
          </button>
        </div>
      </div>

      {message ? <div className="mx-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:mx-0">{message}</div> : null}
      {error ? <div className="mx-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-0">{error}</div> : null}

      {showCreateForm ? (
        <div className="mx-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:mx-0 md:p-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Owner Account</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Owner name *" value={form.ownerName} onChange={(e) => handleFormChange("ownerName", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Owner email *" type="email" value={form.ownerEmail} onChange={(e) => handleFormChange("ownerEmail", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Mobile number *" inputMode="tel" value={form.ownerPhone} onChange={(e) => handleFormChange("ownerPhone", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Login password *" type="password" value={form.password} onChange={(e) => handleFormChange("password", e.target.value)} />
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">Restaurant Image</h2>
                <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-3">
                  {form.imageUrl ? (
                    <img src={optimizeImageUrl(form.imageUrl)} alt={form.restaurantName || "Restaurant"} className="h-36 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">No image selected</div>
                  )}
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
                    <ImagePlus className="h-4 w-4" />
                    {uploadingKey === "restaurant" ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingKey === "restaurant"}
                      className="hidden"
                      onChange={(e) =>
                        uploadAdminImage(e.target.files?.[0], "dodago/restaurants", "restaurant", (url) =>
                          handleFormChange("imageUrl", url),
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Restaurant Details</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Restaurant name *" value={form.restaurantName} onChange={(e) => handleFormChange("restaurantName", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Cuisine" value={form.cuisine} onChange={(e) => handleFormChange("cuisine", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Restaurant phone (optional)" inputMode="tel" value={form.restaurantPhone} onChange={(e) => handleFormChange("restaurantPhone", e.target.value)} />
                  <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.status} onChange={(e) => handleFormChange("status", e.target.value)}>
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING_APPROVAL">Pending</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Address line 1 *" value={form.addressLine1} onChange={(e) => handleFormChange("addressLine1", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Address line 2" value={form.addressLine2} onChange={(e) => handleFormChange("addressLine2", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="City *" value={form.city} onChange={(e) => handleFormChange("city", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="State *" value={form.state} onChange={(e) => handleFormChange("state", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Postal code *" value={form.postalCode} onChange={(e) => handleFormChange("postalCode", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Latitude (Google Maps)" type="number" step="any" value={form.latitude ?? ""} onChange={(e) => handleFormChange("latitude", e.target.value ? Number(e.target.value) : null)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Longitude (Google Maps)" type="number" step="any" value={form.longitude ?? ""} onChange={(e) => handleFormChange("longitude", e.target.value ? Number(e.target.value) : null)} />
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.isOpen} onChange={(e) => handleFormChange("isOpen", e.target.checked)} />
                    Open for orders
                  </label>
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" type="time" value={form.openingTime} onChange={(e) => handleFormChange("openingTime", e.target.value)} />
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" type="time" value={form.closingTime} onChange={(e) => handleFormChange("closingTime", e.target.value)} />
                  <textarea className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" rows={3} placeholder="Description" value={form.description} onChange={(e) => handleFormChange("description", e.target.value)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleOpenDay(day)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${form.openDays.includes(day) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-slate-900">Initial Menu</h2>
                  <button type="button" onClick={addMenuRow} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {menuItems.map((item, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 p-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Item name" value={item.name} onChange={(e) => handleMenuChange(index, "name", e.target.value)} />
                        <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Price" type="number" min="0" step="0.01" value={item.price} onChange={(e) => handleMenuChange(index, "price", e.target.value)} />
                        <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={item.category} onChange={(e) => handleMenuChange(index, "category", e.target.value)}>
                          <option value="">Category</option>
                          {MENU_CATEGORIES.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Sizes &amp; Prices (optional)</label>
                          <div className="flex gap-2">
                            {ALL_SIZES.map((size) => {
                              const entry = (item.sizes || []).find((s) => s.size === size);
                              return (
                                <label key={size} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs cursor-pointer hover:border-indigo-300">
                                  <input
                                    type="checkbox"
                                    checked={!!entry}
                                    onChange={(e) => {
                                      const current = [...(item.sizes || [])];
                                      if (e.target.checked) {
                                        current.push({ size, price: item.price || "" });
                                      } else {
                                        handleMenuChange(index, "sizes", current.filter((s) => s.size !== size));
                                        return;
                                      }
                                      handleMenuChange(index, "sizes", current);
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <span className="font-medium">{size}</span>
                                  {entry && (
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="Price"
                                      className="w-16 border border-slate-200 rounded px-1 py-0.5 text-xs"
                                      value={entry.price}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        const current = [...(item.sizes || [])];
                                        const idx = current.findIndex((s) => s.size === size);
                                        if (idx >= 0) {
                                          current[idx] = { ...current[idx], price: e.target.value };
                                          handleMenuChange(index, "sizes", current);
                                        }
                                      }}
                                    />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={item.isVeg} onChange={(e) => handleMenuChange(index, "isVeg", e.target.checked)} />
                            Veg
                          </label>
                          <button type="button" onClick={() => removeMenuRow(index)} className="ml-auto rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100" title="Remove item">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" rows={2} placeholder="Description" value={item.description} onChange={(e) => handleMenuChange(index, "description", e.target.value)} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {item.imageUrl ? <img src={optimizeImageUrl(item.imageUrl)} alt={item.name || "Menu item"} className="h-14 w-20 rounded-lg object-cover" /> : null}
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
                          <ImagePlus className="h-4 w-4" />
                          {uploadingKey === `menu-${index}` ? "Uploading..." : "Upload Dish Image"}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingKey === `menu-${index}`}
                            className="hidden"
                            onChange={(e) =>
                              uploadAdminImage(e.target.files?.[0], "dodago/menu-items", `menu-${index}`, (url) =>
                                handleMenuChange(index, "imageUrl", url),
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={createRestaurant}
                disabled={saving || Boolean(uploadingKey)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Creating..." : "Create Account And Restaurant"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-2 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:mx-0 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
        <input
          type="text"
          placeholder="Search by name, city, owner..."
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm sm:w-48"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      <div className="mx-2 space-y-2 md:mx-0">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : restaurants.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">No restaurants found</div>
        ) : (
          restaurants.map((restaurant) => (
            <div key={restaurant.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {restaurant.imageUrl ? (
                  <img src={optimizeImageUrl(restaurant.imageUrl)} alt={restaurant.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{restaurant.name}</p>
                  <p className="truncate text-xs text-slate-500">{[restaurant.addressLine1, restaurant.city].filter(Boolean).join(", ")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(restaurant.status)}`}>
                      {restaurant.status === "PENDING_APPROVAL" ? "Pending" : restaurant.status}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${restaurant.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {restaurant.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Vendor: {restaurant.vendor?.name || "NA"} {restaurant.vendor?.email ? `- ${restaurant.vendor.email}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => updateStatus(restaurant.id, restaurant.status)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${restaurant.status === "ACTIVE" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}
                >
                  {restaurant.status === "ACTIVE" ? "Suspend" : "Activate"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mx-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 md:mx-0">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="text-sm font-semibold text-slate-600 disabled:opacity-50">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="text-sm font-semibold text-slate-600 disabled:opacity-50">Next</button>
        </div>
      ) : null}
    </div>
  );
};

export default AdminRestaurants;
