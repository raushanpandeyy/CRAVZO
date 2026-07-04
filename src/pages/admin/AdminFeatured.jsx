import React, { useState, useEffect } from "react";
import { Star, Plus, ChevronLeft, ChevronRight, X, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { API_ENDPOINTS } from "../../constants/apiEndpoints.js";
import { apiRequest } from "../../services/api.js";

const PREVIEW_FEATURED_LIMIT = 4;
const PREVIEW_AD_LIMIT = 4;

const AdminFeatured = () => {
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [ads, setAds] = useState([]);
  const [featureEnabled, setFeatureEnabled] = useState(() => localStorage.getItem("dodagoFeatureEnabled") === "true");
  const [adsEnabled, setAdsEnabled] = useState(() => localStorage.getItem("dodagoAdsEnabled") === "true");
  const [showFeaturePanel, setShowFeaturePanel] = useState(false);
  const [showAdPanel, setShowAdPanel] = useState(false);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [featuredRes, adsRes] = await Promise.all([
        apiRequest(API_ENDPOINTS.public.featuredRestaurants, { skipAuth: true }),
        apiRequest(API_ENDPOINTS.public.ads, { skipAuth: true }),
      ]);
      setFeaturedRestaurants(featuredRes.data || []);
      setAds(adsRes.data || []);
    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showFeaturePanel && allRestaurants.length === 0) {
      loadRestaurants();
    }
  }, [showFeaturePanel]);

  const loadRestaurants = async () => {
    try {
      const response = await apiRequest("/api/restaurants?page=1&limit=100", { skipAuth: true });
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setAllRestaurants(data);
      setFilteredRestaurants(data);
    } catch (err) {
      console.error("Failed to load restaurants", err);
    }
  };

  const toggleFeature = () => {
    const newVal = !featureEnabled;
    setFeatureEnabled(newVal);
    localStorage.setItem("dodagoFeatureEnabled", String(newVal));
    window.dispatchEvent(new CustomEvent("dodagoFeatureUpdate"));
    setMessage(newVal ? "Featured enabled" : "Featured disabled");
  };

  const toggleAds = () => {
    const newVal = !adsEnabled;
    setAdsEnabled(newVal);
    localStorage.setItem("dodagoAdsEnabled", String(newVal));
    window.dispatchEvent(new CustomEvent("dodagoAdsUpdate"));
    setMessage(newVal ? "Ads enabled" : "Ads disabled");
  };

  const addToFeatured = async (restaurant) => {
    const activeList = featuredRestaurants.filter(Boolean);
    if (activeList.find((r) => r.restaurantId === restaurant.id)) return;
    try {
      const response = await apiRequest(API_ENDPOINTS.public.featuredRestaurants, {
        method: "POST",
        body: JSON.stringify({
          restaurantId: restaurant.id,
          name: restaurant.name,
          imageUrl: restaurant.imageUrl || null,
        }),
      });
      const newFeatured = response.data;
      if (newFeatured?.id) {
        setFeaturedRestaurants([newFeatured, ...activeList]);
        window.dispatchEvent(new CustomEvent("dodagoFeatureUpdate"));
        setMessage(`${restaurant.name} added`);
      }
    } catch {
      setError("Failed to add");
    }
  };

  const removeFromFeatured = async (id) => {
    const removed = featuredRestaurants.find((r) => r.id === id);
    try {
      await apiRequest(`${API_ENDPOINTS.public.featuredRestaurants}/${id}`, { method: "DELETE" });
      setFeaturedRestaurants(featuredRestaurants.filter((r) => r.id !== id));
      if (removed) setMessage(`${removed.name} removed`);
      window.dispatchEvent(new CustomEvent("dodagoFeatureUpdate"));
    } catch {
      setError("Failed to remove");
    }
  };

  const _moveLeft = async () => {
    if (featuredRestaurants.length < 2) return;
    const updated = [...featuredRestaurants];
    const last = updated.pop();
    updated.unshift(last);
    setFeaturedRestaurants(updated);
    try {
      await apiRequest(`${API_ENDPOINTS.public.featuredRestaurants}/order`, {
        method: "PUT",
        body: JSON.stringify({ order: updated }),
      });
    } catch (e) {
      console.error("Move left failed", e);
    }
  };

  const _moveRight = async () => {
    if (featuredRestaurants.length < 2) return;
    const updated = [...featuredRestaurants];
    const first = updated.shift();
    updated.push(first);
    setFeaturedRestaurants(updated);
    try {
      await apiRequest(`${API_ENDPOINTS.public.featuredRestaurants}/order`, {
        method: "PUT",
        body: JSON.stringify({ order: updated }),
      });
    } catch (e) {
      console.error("Move right failed", e);
    }
  };

  const addAd = async (imageUrl, link = "") => {
    try {
      const response = await apiRequest(API_ENDPOINTS.public.ads, {
        method: "POST",
        body: JSON.stringify({ imageUrl, link }),
      });
      const newAd = response.data;
      if (newAd?.id) {
        setAds([newAd, ...ads.filter(Boolean)]);
        window.dispatchEvent(new CustomEvent("dodagoAdsUpdate"));
        setMessage("Ad added");
      }
    } catch {
      setError("Failed to add ad");
    }
  };

  const removeAd = async (id) => {
    try {
      await apiRequest(`${API_ENDPOINTS.public.ads}/${id}`, { method: "DELETE" });
      setAds(ads.filter((a) => a.id !== id));
      window.dispatchEvent(new CustomEvent("dodagoAdsUpdate"));
      setMessage("Ad removed");
    } catch {
      setError("Failed to remove");
    }
  };

  const handleImageUrlAdd = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      const link = prompt("Target URL (optional):") || "";
      addAd(url, link);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("Uploading...");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        const response = await apiRequest("/api/users/uploads/image", {
          method: "POST",
          body: JSON.stringify({ dataUrl, folder: "dodago-ads" }),
        });
        if (response.data?.url) {
          await addAd(response.data.url, "");
          setMessage("Uploaded!");
        } else {
          setError("Upload failed");
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Upload failed");
    }
  };

  useEffect(() => {
    const filtered = allRestaurants.filter(
      (r) =>
        r.name?.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
        r.city?.toLowerCase().includes(restaurantSearch.toLowerCase())
    );
    setFilteredRestaurants(filtered);
  }, [restaurantSearch, allRestaurants]);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 md:pb-4">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold">Featured & Ads</h1>
        <p className="text-indigo-200 text-sm">Manage home page content</p>
      </div>

      {message && (
        <div className="mx-2 md:mx-0 rounded-xl bg-emerald-50 px-4 py-2.5 text-emerald-700 text-sm font-medium">{message}</div>
      )}
      {error && (
        <div className="mx-2 md:mx-0 rounded-xl bg-red-50 px-4 py-2.5 text-red-700 text-sm font-medium">{error}</div>
      )}

      {/* Featured Restaurants */}
      <div className="mx-2 md:mx-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${featureEnabled ? "bg-indigo-600" : "bg-slate-200"}`}>
              <Star className={`h-5 w-5 ${featureEnabled ? "text-white" : "text-slate-500"}`} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Featured</h2>
              <p className="text-xs text-slate-500">{featuredRestaurants.length} restaurants</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFeaturePanel(!showFeaturePanel)}
              className="text-xs font-semibold text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-full"
            >
              {showFeaturePanel ? "Done" : "Manage"}
            </button>
            <button
              onClick={toggleFeature}
              className={`w-11 h-6 rounded-full transition-colors ${featureEnabled ? "bg-indigo-600" : "bg-slate-300"}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${featureEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {featuredRestaurants.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <button onClick={_moveLeft} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button onClick={_moveRight} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] pb-2">
              {featuredRestaurants.slice(0, PREVIEW_FEATURED_LIMIT).map((r) => (
                <div key={r?.id} className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2 shrink-0">
                  {r?.imageUrl ? (
                    <img src={r.imageUrl} alt="" loading="lazy" decoding="async" className="w-8 h-8 rounded-lg object-cover bg-slate-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-200" />
                  )}
                  <span className="text-xs font-semibold text-slate-800 max-w-[80px] truncate">{r?.name}</span>
                  <button onClick={() => r?.id && removeFromFeatured(r.id)} className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {featuredRestaurants.length > PREVIEW_FEATURED_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowFeaturePanel(true)}
                  className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600"
                >
                  +{featuredRestaurants.length - PREVIEW_FEATURED_LIMIT}
                </button>
              )}
            </div>
          </div>
        )}

        {showFeaturePanel && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search restaurants..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl"
                value={restaurantSearch}
                onChange={(e) => setRestaurantSearch(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredRestaurants
                .filter((r) => !featuredRestaurants.filter(Boolean).find((f) => f.restaurantId === r.id))
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt="" loading="lazy" decoding="async" className="w-8 h-8 rounded-lg object-cover bg-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-200" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{r.name}</p>
                        <p className="text-[10px] text-slate-500">{r.city}</p>
                      </div>
                    </div>
                    <button onClick={() => addToFeatured(r)} className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Ads */}
      <div className="mx-2 md:mx-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900">Background Ads</h2>
            <p className="text-xs text-slate-500">{ads.filter(Boolean).length} ads</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdPanel(!showAdPanel)}
              className="text-xs font-semibold text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-full"
            >
              {showAdPanel ? "Done" : "Add"}
            </button>
            <button
              onClick={toggleAds}
              className={`w-11 h-6 rounded-full transition-colors ${adsEnabled ? "bg-indigo-600" : "bg-slate-300"}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${adsEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {ads.filter(Boolean).length > 0 && (
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] pb-2">
            {ads.filter(Boolean).slice(0, PREVIEW_AD_LIMIT).map((ad) => (
              <div key={ad?.id} className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                {ad?.imageUrl ? (
                  <img src={ad.imageUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-slate-200" />
                )}
                <button onClick={() => ad?.id && removeAd(ad.id)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {ads.filter(Boolean).length > PREVIEW_AD_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAdPanel(true)}
                className="h-16 shrink-0 rounded-lg bg-slate-100 px-3 text-xs font-black text-slate-600"
              >
                +{ads.filter(Boolean).length - PREVIEW_AD_LIMIT}
              </button>
            )}
          </div>
        )}

        {showAdPanel && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex gap-2">
              <label className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl text-center cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                Upload Image
              </label>
              <button onClick={handleImageUrlAdd} className="flex-1 border border-slate-300 text-slate-700 text-sm font-semibold py-2.5 rounded-xl">
                Add URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeatured;
