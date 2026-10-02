import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, BadgePercent, CheckCircle2, ChevronLeft,
  Loader2, Pencil, Plus, RefreshCw, Tag, Trash2, TrendingUp, X,
} from "lucide-react";
import { apiRequest } from "../../services/api.js";

const API = "/api/admin/promo-codes";

const DISCOUNT_TYPE_LABELS = {
  FLAT:         "Flat Amount (₹)",
  FREE_DELIVERY: "Free Delivery",
  PERCENTAGE:   "Percentage (%)",
};

const badge = (code) => {
  const now = new Date();
  if (!code.isActive)                                   return { label: "Inactive",  cls: "bg-slate-100 text-slate-600" };
  if (code.expiresAt && new Date(code.expiresAt) < now) return { label: "Expired",   cls: "bg-red-100 text-red-600" };
  if (code.maxUses && code.currentUses >= code.maxUses) return { label: "Used up",   cls: "bg-orange-100 text-orange-600" };
  return { label: "Live", cls: "bg-emerald-100 text-emerald-700" };
};

const formatDiscount = (c) => {
  if (c.discountType === "FLAT")          return `₹${c.discountValue} off`;
  if (c.discountType === "FREE_DELIVERY") return `Free delivery (up to ₹${c.discountValue})`;
  if (c.discountType === "PERCENTAGE")    return `${c.discountValue}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}`;
  return `₹${c.discountValue}`;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const toInputDate = (d) => d ? new Date(d).toISOString().slice(0, 16) : "";

const emptyForm = {
  code: "", label: "", discountType: "FLAT", discountValue: "",
  minOrderValue: "", maxDiscount: "", maxUses: "", perUserLimit: "1",
  startsAt: "", expiresAt: "",
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminPromoCodes() {
  const [codes,   setCodes]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("all"); // all | active | expired | inactive

  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create
  const [form,       setForm]       = useState(emptyForm);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [detailCode,  setDetailCode]  = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Load list ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [codesRes, statsRes] = await Promise.all([
        apiRequest(`${API}?status=${filter}&limit=100`),
        apiRequest(`${API}/stats`),
      ]);
      setCodes(codesRes.data?.codes || []);
      setStats(statsRes.data || null);
    } catch (err) {
      setError(err.message || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // ── Open create modal ──────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setSuccessMsg("");
    setShowModal(true);
  };

  // ── Open edit modal ────────────────────────────────────────────────────────
  const openEdit = (c) => {
    setEditTarget(c);
    setForm({
      code:          c.code,
      label:         c.label,
      discountType:  c.discountType,
      discountValue: String(c.discountValue),
      minOrderValue: c.minOrderValue != null ? String(c.minOrderValue) : "",
      maxDiscount:   c.maxDiscount   != null ? String(c.maxDiscount)   : "",
      maxUses:       c.maxUses       != null ? String(c.maxUses)       : "",
      perUserLimit:  String(c.perUserLimit ?? 1),
      startsAt:      toInputDate(c.startsAt),
      expiresAt:     toInputDate(c.expiresAt),
    });
    setFormError("");
    setSuccessMsg("");
    setShowModal(true);
  };

  // ── Open detail panel ──────────────────────────────────────────────────────
  const openDetail = async (c) => {
    setDetailCode(c);
    setDetailLoading(true);
    try {
      const res = await apiRequest(`${API}/${c.id}`);
      setDetailCode(res.data);
    } catch {
      // keep basic data
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.code.trim())         return setFormError("Code is required");
    if (!form.label.trim())        return setFormError("Label / description is required");
    if (!form.discountValue)       return setFormError("Discount value is required");
    if (form.discountType === "PERCENTAGE" && !form.maxDiscount)
      return setFormError("Percentage discount requires a max discount cap");

    setSaving(true);
    setFormError("");
    try {
      const body = {
        code:          form.code.trim().toUpperCase(),
        label:         form.label.trim(),
        discountType:  form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        maxDiscount:   form.maxDiscount   ? Number(form.maxDiscount)   : null,
        maxUses:       form.maxUses       ? Number(form.maxUses)       : null,
        perUserLimit:  Number(form.perUserLimit) || 1,
        startsAt:      form.startsAt  ? new Date(form.startsAt).toISOString()  : null,
        expiresAt:     form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      if (editTarget) {
        await apiRequest(`${API}/${editTarget.id}`, { method: "PATCH", body: JSON.stringify(body) });
        setSuccessMsg("Promo code updated!");
      } else {
        await apiRequest(API, { method: "POST", body: JSON.stringify(body) });
        setSuccessMsg("Promo code created!");
      }
      await load();
      setTimeout(() => { setShowModal(false); setSuccessMsg(""); }, 900);
    } catch (err) {
      setFormError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const toggleActive = async (c) => {
    try {
      await apiRequest(`${API}/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      await load();
    } catch (err) {
      setError(err.message || "Failed to update");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.code}"? ${c.currentUses > 0 ? "It has redemptions so it will be deactivated instead." : "This cannot be undone."}`)) return;
    try {
      await apiRequest(`${API}/${c.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-6 space-y-4 px-2 md:px-0">

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-4 md:p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <BadgePercent className="h-6 w-6" /> Promo Codes
            </h1>
            <p className="text-sm text-violet-200 mt-1">Create and manage campaign discount codes for customers</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-white text-violet-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-violet-50 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Code
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Codes",    value: stats.total,            icon: Tag,         color: "text-slate-700" },
            { label: "Live Now",       value: stats.active,           icon: CheckCircle2, color: "text-emerald-600" },
            { label: "Expired",        value: stats.expired,          icon: AlertTriangle, color: "text-red-500" },
            { label: "Total Redeemed", value: stats.totalRedemptions, icon: TrendingUp,   color: "text-violet-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "active", "expired", "inactive"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === f ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={load} className="ml-auto flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-medium px-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
      ) : codes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BadgePercent className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-500">No promo codes found</p>
          <p className="text-sm text-slate-400 mt-1">Create your first campaign code to get started</p>
          <button onClick={openCreate} className="mt-4 bg-violet-600 text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-violet-700">
            Create Code
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Discount</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Uses</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Expiry</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const b = badge(c);
                  return (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(c)} className="text-left">
                          <p className="font-black text-violet-700 tracking-wider">{c.code}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{formatDiscount(c)}</p>
                        {c.minOrderValue && <p className="text-xs text-slate-400">Min ₹{c.minOrderValue}</p>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {c.currentUses}
                        {c.maxUses ? <span className="text-slate-400 font-normal"> / {c.maxUses}</span> : <span className="text-slate-400 font-normal"> / ∞</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(c.expiresAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${b.cls}`}>{b.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleActive(c)}
                            title={c.isActive ? "Deactivate" : "Activate"}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                              c.isActive
                                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            }`}
                          >
                            {c.isActive ? "Pause" : "Activate"}
                          </button>
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top codes */}
      {stats?.topCodes?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="font-bold text-slate-800 mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-violet-500" /> Top Used Codes</p>
          <div className="flex flex-wrap gap-2">
            {stats.topCodes.map((c) => (
              <div key={c.code} className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
                <span className="font-black text-violet-700 text-sm tracking-wider">{c.code}</span>
                <span className="text-xs text-slate-500">{c.currentUses} uses</span>
                <span className="text-xs text-slate-400">{formatDiscount(c)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
              <h2 className="font-black text-slate-900 text-lg">
                {editTarget ? `Edit — ${editTarget.code}` : "New Promo Code"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {successMsg}
                </div>
              )}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> {formError}
                </div>
              )}

              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Code <span className="text-red-500">*</span></label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") }))}
                  disabled={!!editTarget}
                  placeholder="DIWALI50"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
                {editTarget && <p className="text-xs text-slate-400 mt-1">Code cannot be changed after creation</p>}
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Description / Label <span className="text-red-500">*</span></label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="Diwali 2026 sale campaign"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Discount Type <span className="text-red-500">*</span></label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value, maxDiscount: "" }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    {Object.entries(DISCOUNT_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    {form.discountType === "PERCENTAGE" ? "Percentage (%)" : "Amount (₹)"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" min="0"
                    value={form.discountValue}
                    onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                    placeholder={form.discountType === "PERCENTAGE" ? "20" : "50"}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>

              {/* Max discount (only for PERCENTAGE) */}
              {form.discountType === "PERCENTAGE" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Max Discount Cap (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" min="0"
                    value={form.maxDiscount}
                    onChange={(e) => setForm((p) => ({ ...p, maxDiscount: e.target.value }))}
                    placeholder="100"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">Prevents runaway discounts on large orders</p>
                </div>
              )}

              {/* Min order + max uses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Min Order Value (₹)</label>
                  <input
                    type="number" min="0"
                    value={form.minOrderValue}
                    onChange={(e) => setForm((p) => ({ ...p, minOrderValue: e.target.value }))}
                    placeholder="150 (optional)"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Max Total Uses</label>
                  <input
                    type="number" min="1"
                    value={form.maxUses}
                    onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                    placeholder="500 (blank = unlimited)"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>

              {/* Per user limit */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Per User Limit</label>
                <input
                  type="number" min="1" max="100"
                  value={form.perUserLimit}
                  onChange={(e) => setForm((p) => ({ ...p, perUserLimit: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <p className="text-xs text-slate-400 mt-1">How many times one customer can use this code (usually 1)</p>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Starts At (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>

              {/* Preview */}
              {form.discountValue && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-violet-700 mb-1">Preview</p>
                  <p className="text-sm font-semibold text-violet-900">
                    Code <span className="font-black tracking-wider">{form.code || "___"}</span> gives {" "}
                    {form.discountType === "FLAT" && `₹${form.discountValue} off`}
                    {form.discountType === "FREE_DELIVERY" && `free delivery (up to ₹${form.discountValue})`}
                    {form.discountType === "PERCENTAGE" && `${form.discountValue}% off${form.maxDiscount ? ` (max ₹${form.maxDiscount})` : ""}`}
                    {form.minOrderValue && ` on orders above ₹${form.minOrderValue}`}
                    {form.maxUses && ` · ${form.maxUses} total uses`}
                    {form.expiresAt && ` · expires ${fmtDate(form.expiresAt)}`}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-3 justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editTarget ? "Save Changes" : "Create Code"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Panel ─────────────────────────────────────────────────────── */}
      {detailCode && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-black text-slate-900 text-lg tracking-wider">{detailCode.code}</h2>
                <p className="text-xs text-slate-500">{detailCode.label}</p>
              </div>
              <button onClick={() => setDetailCode(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-violet-400" /></div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Discount",     formatDiscount(detailCode)],
                    ["Status",       badge(detailCode).label],
                    ["Total Uses",   `${detailCode.currentUses}${detailCode.maxUses ? ` / ${detailCode.maxUses}` : " / ∞"}`],
                    ["Per User",     `${detailCode.perUserLimit}x`],
                    ["Min Order",    detailCode.minOrderValue ? `₹${detailCode.minOrderValue}` : "None"],
                    ["Expires",      fmtDate(detailCode.expiresAt)],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 font-medium">{k}</p>
                      <p className="font-bold text-slate-800 mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>

                {detailCode.recentRedemptions?.length > 0 && (
                  <div>
                    <p className="font-bold text-slate-700 mb-2 text-sm">Recent Redemptions</p>
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {detailCode.recentRedemptions.map((r) => (
                        <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{r.user?.name || "—"}</p>
                            <p className="text-xs text-slate-400">{r.user?.phone || r.user?.email || "—"}</p>
                          </div>
                          <p className="text-xs text-slate-500">{fmtDate(r.redeemedAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setDetailCode(null); openEdit(detailCode); }}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => { setDetailCode(null); toggleActive(detailCode); }}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                      detailCode.isActive
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {detailCode.isActive ? "Pause Code" : "Activate Code"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
