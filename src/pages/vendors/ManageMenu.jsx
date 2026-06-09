import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Menu, Plus, Edit, Trash2, Save, X, ImagePlus } from "lucide-react";

import {
  createVendorMenuItem,
  deleteVendorMenuItem,
  getMyRestaurant,
  updateVendorMenuItem,
} from "../../services/vendorService.js";
import { uploadImage } from "../../services/userService.js";
import { Skeleton, SkeletonCard } from "../../components/Skeleton.jsx";
import { getCloudinaryUrl } from "../../utils/cloudinary.js";

const categories = ["Main Course", "Starters", "Thali", "Beverages", "Desserts", "Biryani", "Sides"];
const ALL_SIZES = ["S", "M", "L"];

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect fill='%23f1f5f9' width='150' height='150'/%3E%3Ctext fill='%2394a3b8' font-family='Arial' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const optimizeImageUrl = (url, width = 400) => {
  if (!url) return FALLBACK_IMG;
  if (url.includes("res.cloudinary.com")) return getCloudinaryUrl(url, { width });
  return url;
};

const ManageMenu = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    sizes: [],
    sideDishes: [],
    isVeg: false,
    status: "ACTIVE",
  });

  const loadRestaurant = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyRestaurant();
      setRestaurant(data);
      setMenuItems(data?.menuItems || []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  const stats = useMemo(
    () => ({
      total: menuItems.length,
      active: menuItems.filter((item) => item.status === "ACTIVE").length,
      uniqueCategories: new Set(menuItems.map((item) => item.category)).size,
    }),
    [menuItems],
  );

  const handleInputChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      sizes: [],
      sideDishes: [],
      isVeg: false,
      status: "ACTIVE",
    });
  }, []);

  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingImage(true);
    setMessage("");
    setError("");

    try {
      const uploadedAsset = await uploadImage(file, "cravzo/menu-items");
      setFormData((prev) => ({
        ...prev,
        imageUrl: uploadedAsset.url,
      }));
      setMessage("Dish image uploaded successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to upload dish image");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }, []);

  const handleAddItem = useCallback(async () => {
    if (!restaurant) {
      setError("Create your restaurant profile first.");
      return;
    }

    if (!formData.name || !formData.price || !formData.category) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await createVendorMenuItem({
        restaurantId: restaurant.id,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        imageUrl: formData.imageUrl || null,
        sizes: formData.sizes.length > 0 ? formData.sizes : undefined,
        sideDishes: formData.sideDishes.length > 0 ? formData.sideDishes : undefined,
        isVeg: formData.isVeg,
        status: formData.status,
      });
      setMessage("Menu item added successfully.");
      setIsAddingItem(false);
      resetForm();
      await loadRestaurant();
    } catch (requestError) {
      setError(requestError.message || "Failed to add item");
    }
  }, [restaurant, formData, loadRestaurant]);

  const handleEditItem = useCallback((item) => {
    setEditingItem(item.id);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || "",
      sizes: item.sizes || [],
      sideDishes: item.sideDishes || [],
      isVeg: item.isVeg,
      status: item.status,
    });
  }, []);

  const handleUpdateItem = useCallback(async () => {
    if (!editingItem) {
      return;
    }

    if (!formData.name || !formData.price || !formData.category) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await updateVendorMenuItem(editingItem, {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        imageUrl: formData.imageUrl || null,
        sizes: formData.sizes.length > 0 ? formData.sizes : undefined,
        sideDishes: formData.sideDishes.length > 0 ? formData.sideDishes : undefined,
        isVeg: formData.isVeg,
        status: formData.status,
      });
      setMessage("Menu item updated successfully.");
      setEditingItem(null);
      resetForm();
      await loadRestaurant();
    } catch (requestError) {
      setError(requestError.message || "Failed to update item");
    }
  }, [editingItem, formData, loadRestaurant]);

  const handleDeleteItem = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      await deleteVendorMenuItem(id);
      setMessage("Menu item deleted successfully.");
      await loadRestaurant();
    } catch (requestError) {
      setError(requestError.message || "Failed to delete item");
    }
  }, [loadRestaurant]);

  const toggleAvailability = useCallback(async (item) => {
    try {
      await updateVendorMenuItem(item.id, {
        status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      await loadRestaurant();
    } catch (requestError) {
      setError(requestError.message || "Failed to update item availability");
    }
  }, [loadRestaurant]);

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 bg-[#F4F7FB] min-h-screen">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 text-xs md:text-sm mt-1">Manage your restaurant menu items</p>
        </div>
      </div>

      {message ? <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">{message}</div> : null}
      {error ? <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{error}</div> : null}

      {/* Stats Section: Stacked on mobile, 3-columns on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Total Items</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-50 p-2 md:p-3 rounded-xl">
              <Menu className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Active Items</p>
              <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="bg-green-50 p-2 md:p-3 rounded-xl">
              <Plus className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Categories</p>
              <p className="text-xl md:text-2xl font-bold text-purple-600 mt-1">{stats.uniqueCategories}</p>
            </div>
            <div className="bg-purple-50 p-2 md:p-3 rounded-xl">
              <Edit className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex flex-row justify-between items-center mb-6 gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Menu Items</h2>
          <button
            onClick={() => setIsAddingItem(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm font-medium md:px-4 md:py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {(isAddingItem || editingItem) ? (
          <div className="border rounded-xl p-4 mb-6 bg-gray-50/50">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{isAddingItem ? "Add New Item" : "Edit Item"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price (Rs) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" min="0" step="0.01" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sizes &amp; Prices (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((size) => {
                    const entry = formData.sizes.find((s) => s.size === size);
                    return (
                      <label key={size} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs cursor-pointer hover:border-indigo-300">
                        <input
                          type="checkbox"
                          checked={!!entry}
                          onChange={(e) => {
                            const current = [...formData.sizes];
                            if (e.target.checked) {
                              current.push({ size, price: formData.price || "" });
                            } else {
                              setFormData((prev) => ({ ...prev, sizes: current.filter((s) => s.size !== size) }));
                              return;
                            }
                            setFormData((prev) => ({ ...prev, sizes: current }));
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
                            className="w-16 border border-gray-200 rounded px-1 py-0.5 text-xs"
                            value={entry.price}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const current = [...formData.sizes];
                              const idx = current.findIndex((s) => s.size === size);
                              if (idx >= 0) {
                                current[idx] = { ...current[idx], price: e.target.value };
                                setFormData((prev) => ({ ...prev, sizes: current }));
                              }
                            }}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Side Dishes (optional)</label>
                <div className="space-y-2">
                  {formData.sideDishes.map((sd, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Name"
                        className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs"
                        value={sd.name}
                        onChange={(e) => {
                          const current = [...formData.sideDishes];
                          current[idx] = { ...current[idx], name: e.target.value };
                          setFormData((prev) => ({ ...prev, sideDishes: current }));
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        className="w-20 border border-gray-200 rounded px-2 py-1.5 text-xs"
                        value={sd.price}
                        onChange={(e) => {
                          const current = [...formData.sideDishes];
                          current[idx] = { ...current[idx], price: e.target.value };
                          setFormData((prev) => ({ ...prev, sideDishes: current }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, sideDishes: prev.sideDishes.filter((_, i) => i !== idx) }));
                        }}
                        className="text-red-500 hover:text-red-700 px-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, sideDishes: [...prev.sideDishes, { name: "", price: "" }] }));
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="w-3 h-3" />
                    Add Side Dish
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Dish Image</label>
                <div className="rounded-lg border border-dashed border-gray-300 p-3 bg-white">
                  {formData.imageUrl ? (
                    <img src={optimizeImageUrl(formData.imageUrl, 300)} alt={formData.name || "Dish preview"} className="mb-3 h-28 w-full rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">No dish image selected</div>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                    <ImagePlus className="w-3.5 h-3.5" />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
                <input type="checkbox" name="isVeg" checked={formData.isVeg} onChange={handleInputChange} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
                <input type="checkbox" name="status" checked={formData.status === "ACTIVE"} onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.checked ? "ACTIVE" : "INACTIVE" }))} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Available
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={isAddingItem ? handleAddItem : handleUpdateItem} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors">
                <Save className="w-4 h-4" />
                {isAddingItem ? "Add Item" : "Update Item"}
              </button>
              <button
                onClick={() => {
                  setIsAddingItem(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : menuItems.length > 0 ? (
          /* Cards Grid Layout: Mobile size pe fully 1-column responsive grid structure */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {menuItems.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all bg-white flex flex-col justify-between">
                <div>
                  {item.imageUrl ? (
                    <img 
                      src={optimizeImageUrl(item.imageUrl, 400)} 
                      alt={item.name} 
                      className="mb-3 h-40 md:h-44 w-full rounded-lg object-cover" 
                      loading="lazy"
                    />
                  ) : null}
                  
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-base md:text-lg text-gray-900 line-clamp-1">{item.name}</h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${item.status === "ACTIVE" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      {item.status === "ACTIVE" ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <p className="text-gray-500 text-xs md:text-sm mb-3 line-clamp-2 min-h-[2rem]">{item.description || "No description provided."}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-extrabold text-base md:text-lg text-indigo-600">Rs {item.price}</span>
                    <div className="flex items-center gap-1.5">
                      {item.sizes && item.sizes.length > 0 ? (
                        <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {item.sizes.map((s) => s.size).join("/")}
                        </span>
                      ) : null}
                      <span className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">{item.category}</span>
                    </div>
                  </div>
                  {item.sideDishes && item.sideDishes.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {item.sideDishes.map((sd, idx) => (
                        <span key={idx} className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md">
                          {sd.name} (Rs {sd.price})
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Buttons Layout: Proper flex gap, padding adjusted for small taps on mobile */}
                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  <button onClick={() => handleEditItem(item)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-2 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button onClick={() => toggleAvailability(item)} className={`flex-1 font-medium px-2 py-2 rounded-lg text-xs transition-colors ${item.status === "ACTIVE" ? "bg-orange-50 hover:bg-orange-100 text-orange-700" : "bg-green-50 hover:bg-green-100 text-green-700"}`}>
                    {item.status === "ACTIVE" ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs flex items-center justify-center transition-colors" title="Delete Item">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Menu className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">No menu items yet</p>
            <p className="text-xs mt-1 text-gray-400">Click "Add Item" to create your first menu item</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMenu;
