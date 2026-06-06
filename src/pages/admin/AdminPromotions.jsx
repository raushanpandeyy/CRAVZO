import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { apiRequest } from "../../services/api.js";

const PROMO_API = "/api/promotions";

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState("dish");
  const [restaurants, setRestaurants] = useState([]);
  const [restSearch, setRestSearch] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [restLoading, setRestLoading] = useState(false);
  const [restError, setRestError] = useState("");
  const [dishesLoading, setDishesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await apiRequest(`${PROMO_API}/all`);
      setPromotions(res.data || []);
    } catch (err) {
      setPromotions([]);
      setFetchError(err.status === 401 ? "Session expired. Please log in again." : (err.message || "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!showModal) {
      setTab("dish");
      setRestSearch("");
      setSelectedRestaurant(null);
      setDishes([]);
      setEditId(null);
      setMessage("");
    }
  }, [showModal]);

  const loadRestaurants = useCallback(async (search) => {
    setRestLoading(true);
    setRestError("");
    try {
      const params = search ? `?query=${encodeURIComponent(search)}&limit=50` : "?limit=50";
      const res = await apiRequest(`/api/admin/restaurants${params}`);
      setRestaurants(res.data || []);
    } catch (err) {
      setRestaurants([]);
      if (err.status === 401) setRestError("Session expired. Please log in again.");
    } finally {
      setRestLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showModal) loadRestaurants(restSearch);
  }, [restSearch, showModal, loadRestaurants]);

  const loadDishes = useCallback(async (restaurantId) => {
    setDishesLoading(true);
    try {
      const res = await apiRequest(`/api/menu-items/restaurant/${restaurantId}`);
      setDishes(res.data?.items || []);
    } catch {
      setDishes([]);
    } finally {
      setDishesLoading(false);
    }
  }, []);

  const openAdd = () => {
    setEditId(null);
    setShowModal(true);
    loadRestaurants("");
  };

  const openEdit = async (p) => {
    setEditId(p.id);
    setTab(p.linkType === "nearby_free_delivery" ? "free_delivery" : "dish");
    setShowModal(true);
    setRestSearch(p.title || "");
    loadRestaurants(p.title || "");
  };

  const handleSelectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    if (tab === "free_delivery") {
      await handleSavePromo("free_delivery", restaurant.id);
    } else {
      loadDishes(restaurant.id);
    }
  };

  const handleSelectDish = async (dish) => {
    await handleSavePromo("dish", dish.id);
  };

  const handleSavePromo = async (referenceType, referenceId) => {
    setSaving(true);
    setMessage("");
    try {
      const body = { referenceType, referenceId };
      if (editId) {
        await apiRequest(`${PROMO_API}/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await apiRequest(PROMO_API, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
      }
      setMessage(editId ? "Updated" : "Created");
      setShowModal(false);
      load();
    } catch (err) {
      setMessage(err.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await apiRequest(`${PROMO_API}/${id}`, { method: "DELETE" });
      load();
    } catch {}
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dish Promotions</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the promo carousel on mobile home</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white shadow transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {message && !showModal && (
        <div className="mb-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700">{message}</div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 pt-14 sm:pt-0">
          <div className="w-full max-w-lg sm:rounded-2xl bg-white shadow-xl animate-in fade-in duration-200 max-h-[90vh] sm:max-h-[85vh] min-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                {selectedRestaurant && tab === "dish" && (
                  <button type="button" onClick={() => { setSelectedRestaurant(null); setDishes([]); }} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <h2 className="text-lg font-black text-slate-900">
                  {editId ? "Edit" : "Add"} Promotion
                </h2>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!selectedRestaurant && (
              <div className="flex border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setTab("dish")}
                  className={`flex-1 py-3 text-center text-sm font-extrabold transition ${
                    tab === "dish" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Dish
                </button>
                <button
                  type="button"
                  onClick={() => setTab("free_delivery")}
                  className={`flex-1 py-3 text-center text-sm font-extrabold transition ${
                    tab === "free_delivery" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Free Delivery
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              {!selectedRestaurant ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={restSearch}
                      onChange={(e) => setRestSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Search restaurant..."
                      autoFocus
                    />
                  </div>
                  {restLoading ? (
                    <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>
                  ) : restError ? (
                    <div className="py-8 text-center"><p className="text-sm font-bold text-red-500">{restError}</p></div>
                  ) : restaurants.length === 0 ? (
                    <p className="py-8 text-center text-sm font-semibold text-slate-400">No restaurants found. Create one from Restaurants page first.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {restaurants.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelectRestaurant(r)}
                          className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-indigo-100 hover:bg-indigo-50/50"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {r.imageUrl && <img src={r.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" width={48} height={48} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold text-slate-900 truncate">{r.name}</p>
                            <p className="text-xs font-semibold text-slate-500">{r.city || r.cuisine || ""}</p>
                          </div>
                          {tab === "free_delivery" && saving && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : tab === "dish" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                      {selectedRestaurant.imageUrl && <img src={selectedRestaurant.imageUrl} alt="" className="h-full w-full object-cover" width={40} height={40} />}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{selectedRestaurant.name}</p>
                      <p className="text-xs font-semibold text-slate-500">Select a dish to promote</p>
                    </div>
                  </div>
                  {dishesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    </div>
                  ) : dishes.length === 0 ? (
                    <p className="py-8 text-center text-sm font-semibold text-slate-400">No dishes found</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {dishes.map((dish) => (
                        <button
                          key={dish.id}
                          type="button"
                          disabled={saving}
                          onClick={() => handleSelectDish(dish)}
                          className={`flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-indigo-100 hover:bg-indigo-50/50 ${
                            saving ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {dish.imageUrl && <img src={dish.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" width={48} height={48} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold text-slate-900 truncate">{dish.name}</p>
                            <p className="text-xs font-semibold text-slate-500">{dish.category} | ₹{Number(dish.price)}</p>
                          </div>
                          {dish.isVeg && (
                            <span className="shrink-0 rounded-full border border-green-500 px-1.5 py-0.5 text-[10px] font-extrabold text-green-600">VEG</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : fetchError ? (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 py-12 text-center">
          <p className="text-lg font-bold text-red-600">{fetchError}</p>
          <p className="mt-1 text-sm text-red-500">Try refreshing the page or logging in again</p>
          <button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white shadow transition hover:bg-red-700">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="text-lg font-bold text-slate-400">No promotions yet</p>
          <p className="mt-1 text-sm text-slate-400">Tap "Add" to create your first promotion</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" width={96} height={64} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900">{p.title || "Untitled"}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {p.linkType === "dish" ? `Dish: ${p.linkValue || "-"}` : "Free Delivery Nearby"}
                  {p.subtitle && <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">{p.subtitle}</span>}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
              <button type="button" onClick={() => openEdit(p)} className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={() => remove(p.id)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;
