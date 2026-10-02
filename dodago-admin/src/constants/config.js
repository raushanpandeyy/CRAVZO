// ─── Backend URL ──────────────────────────────────────────────────────────────
// Change this to your production URL when deploying
export const API_BASE_URL = "https://api.dodago.shop"; // replace with your machine IP or production URL
export const SOCKET_URL   = API_BASE_URL;

// ─── Order status display helpers ────────────────────────────────────────────
export const ORDER_STATUS_LABELS = {
  PENDING:          "Pending",
  ACCEPTED:         "Accepted",
  PREPARING:        "Preparing",
  READY_FOR_PICKUP: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED:        "Delivered",
  CANCELLED:        "Cancelled",
  REJECTED:         "Rejected",
};

export const LIVE_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
];

export const STATUS_COLORS = {
  PENDING:          { bg: "#fff7ed", text: "#c2410c", dot: "#f97316" },
  ACCEPTED:         { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  PREPARING:        { bg: "#fdf4ff", text: "#7e22ce", dot: "#a855f7" },
  READY_FOR_PICKUP: { bg: "#f0fdf4", text: "#166534", dot: "#22c55e" },
  OUT_FOR_DELIVERY: { bg: "#eff6ff", text: "#1e40af", dot: "#60a5fa" },
  DELIVERED:        { bg: "#f0fdf4", text: "#14532d", dot: "#16a34a" },
  CANCELLED:        { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
  REJECTED:         { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
};

export const COLORS = {
  primary:     "#4f46e5",
  primaryDark: "#1e1b4b",
  danger:      "#ef4444",
  warning:     "#f59e0b",
  success:     "#10b981",
  bg:          "#f4f7fb",
  card:        "#ffffff",
  ink:         "#0f172a",
  muted:       "#64748b",
  subtle:      "#94a3b8",
  line:        "#e2e8f0",
};
