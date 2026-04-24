import React, { useEffect, useMemo, useState } from "react";
import { Menu, Plus, Edit, Trash2, Save, X, ImagePlus } from "lucide-react";

import {
  createVendorMenuItem,
  deleteVendorMenuItem,
  getMyRestaurant,
  updateVendorMenuItem,
<<<<<<< HEAD
} from "../../services/vendorService.js";
import { uploadImage } from "../../services/userService.js";
=======
} from "../../services/vendorService";
import { uploadImage } from "../../services/userService";
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

const categories = ["Main Course", "Starters", "Thali", "Beverages", "Desserts", "Biryani", "Sides"];

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
    isVeg: false,
    status: "ACTIVE",
  });

  const loadRestaurant = async () => {
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
  };

  useEffect(() => {
    loadRestaurant();
  }, []);

  const stats = useMemo(
    () => ({
      total: menuItems.length,
      active: menuItems.filter((item) => item.status === "ACTIVE").length,
      uniqueCategories: new Set(menuItems.map((item) => item.category)).size,
    }),
    [menuItems],
  );

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      isVeg: false,
      status: "ACTIVE",
    });
  };

  const handleImageUpload = async (event) => {
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
  };

  const handleAddItem = async () => {
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
  };

  const handleEditItem = (item) => {
    setEditingItem(item.id);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || "",
      isVeg: item.isVeg,
      status: item.status,
    });
  };

  const handleUpdateItem = async () => {
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
  };

  const handleDeleteItem = async (id) => {
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
  };

  const toggleAvailability = async (item) => {
    try {
      await updateVendorMenuItem(item.id, {
        status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      await loadRestaurant();
    } catch (requestError) {
      setError(requestError.message || "Failed to update item availability");
    }
  };

  return (
    <div className="px-6 py-6 bg-[#F4F7FB] min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Menu Management</h1>
        <p className="text-gray-600 text-sm mt-1">Manage your restaurant menu items</p>
      </div>

      {message ? <div className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Menu className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Items</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Categories</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{stats.uniqueCategories}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Edit className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Menu Items</h2>
          <button
            onClick={() => setIsAddingItem(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {(isAddingItem || editingItem) ? (
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">{isAddingItem ? "Add New Item" : "Edit Item"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rs) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" min="0" step="0.01" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dish Image</label>
                <div className="rounded-lg border border-dashed border-slate-300 p-3">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt={formData.name || "Dish preview"} className="mb-3 h-28 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">No dish image selected</div>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
                    <ImagePlus className="w-4 h-4" />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border rounded-lg" />
            </div>

            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" name="isVeg" checked={formData.isVeg} onChange={handleInputChange} />
                Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" name="status" checked={formData.status === "ACTIVE"} onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.checked ? "ACTIVE" : "INACTIVE" }))} />
                Available
              </label>
            </div>

            <div className="flex gap-2">
              <button onClick={isAddingItem ? handleAddItem : handleUpdateItem} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isAddingItem ? "Add Item" : "Update Item"}
              </button>
              <button
                onClick={() => {
                  setIsAddingItem(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading menu...</div>
        ) : menuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="mb-3 h-40 w-full rounded-lg object-cover" /> : null}
                <div className="flex justify-between items-start mb-2 gap-3">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {item.status === "ACTIVE" ? "Available" : "Unavailable"}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-lg text-indigo-600">Rs {item.price}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleEditItem(item)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center gap-1">
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button onClick={() => toggleAvailability(item)} className={`flex-1 px-3 py-1 rounded text-sm ${item.status === "ACTIVE" ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}>
                    {item.status === "ACTIVE" ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Menu className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No menu items yet</p>
            <p className="text-sm mt-2">Click "Add Item" to create your first menu item</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMenu;
