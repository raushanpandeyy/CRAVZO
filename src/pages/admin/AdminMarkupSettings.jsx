import { useEffect, useState } from "react";
import { IndianRupee, Pencil, Save, X } from "lucide-react";
import { apiRequest } from "../../services/api.js";

const API = "/api/v1/platform-markup";

const CATEGORY_DESCRIPTIONS = {
  "Main Course":  "Full meals — curry, sabzi, rice dishes",
  "Starters":     "Soup, tikka, kebab, spring rolls",
  "Biryani":      "All biryani variants",
  "Thali":        "Full thali meals",
  "Desserts":     "Ice cream, gulab jamun, cake",
  "Breads":       "Roti, naan, kulcha, paratha (per piece)",
  "Beverages":    "Chai, lassi, juice, cold drinks",
  "Sides":        "Chutney, dahi, raita, pickle",
  "Snacks":       "Default snack markup (if no size selected)",
  "Snacks-half":  "Snacks — Half portion",
  "Snacks-full":  "Snacks — Full portion",
};

export default function AdminMarkupSettings() {
  const [markups,   setMarkups]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editingId, setEditingId] = useState(null); // category being edited
  const [editValue, setEditValue] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(API);
      setMarkups(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load markups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (m) => {
    setEditingId(m.category);
    setEditValue(String(m.markup));
    setSuccess("");
    setError("");
  };

  const cancelEdit = () => { setEditingId(null); setEditValue(""); };

  const saveEdit = async (category) => {
    const val = Number(editValue);
    if (!Number.isFinite(val) || val < 0) {
      setError("Markup must be a non-negative number");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiRequest(`${API}/${encodeURIComponent(category)}`, {
        method: "PUT",
        body: JSON.stringify({ markup: val }),
      });
      setSuccess(`Markup for "${category}" updated to Rs ${val}`);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message || "Failed to update markup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-4 space-y-4">
      {/* Header */}
      <div className="mx-2 md:mx-0 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <IndianRupee className="h-6 w-6" />
          Platform Markup Settings
        </h1>
        <p className="text-indigo-200 text-sm mt-1">
          Set how much Dodago earns per dish category.
          Projected price shown to customers = Restaurant base price + markup.
        </p>
      </div>

      {/* How it works */}
      <div className="mx-2 md:mx-0 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
        <p className="font-bold mb-1">How it works</p>
        <ul className="list-disc list-inside space-y-1 text-indigo-700">
          <li>Restaurant sets their <strong>base price</strong> (what they want to earn)</li>
          <li>System adds the category markup → <strong>projected price</strong> shown to customers</li>
          <li>Payout to restaurant = base price only</li>
          <li>Dodago profit = markup amount per item sold</li>
        </ul>
        <p className="mt-2 font-semibold text-indigo-900">
          Snacks special rule: Half portion = Rs 20, Full portion = Rs 30 (not editable here — hardcoded by size)
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-2 md:mx-0 rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-2 md:mx-0 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-700 text-sm font-semibold">
          ✅ {success}
        </div>
      )}

      {/* Markups table */}
      <div className="mx-2 md:mx-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-black text-slate-700">Category</th>
                <th className="text-left px-4 py-3 font-black text-slate-700 hidden md:table-cell">Description</th>
                <th className="text-center px-4 py-3 font-black text-slate-700">Markup (Rs)</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {markups.map((m) => (
                <tr key={m.category} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{m.category}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">
                    {CATEGORY_DESCRIPTIONS[m.category] || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === m.category ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 text-center border-2 border-indigo-400 rounded-lg px-2 py-1 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(m.category);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    ) : (
                      <span className="inline-flex items-center gap-1 font-black text-indigo-700">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {m.markup}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === m.category ? (
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => saveEdit(m.category)}
                          disabled={saving}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {saving ? "…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Snacks info card */}
      <div className="mx-2 md:mx-0 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-bold text-amber-900 mb-1">🍟 Snacks size markups</p>
        <p className="text-amber-700 text-xs">
          <strong>Snacks-half</strong> and <strong>Snacks-full</strong> appear in the table above and can be edited like any other category.
          When a vendor selects "Snacks" and picks half/full, the corresponding size markup is applied automatically.
        </p>
      </div>
    </div>
  );
}
