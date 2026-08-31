/**
 * ReportsScreen — daily/weekly/monthly revenue, order stats, fee breakdown.
 *
 * API: GET /api/v1/analytics/vendor/reports?range=daily|weekly|monthly
 */
import {
  ActivityIndicator, Alert, RefreshControl,
  ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { colors } from "../constants/colors";
import { ArrowLeft, IndianRupee, Package, RefreshCw } from "../components/Icons";
import { Card } from "../components/Primitives";
import { getReports } from "../services/vendorService";

// ── Helpers ──────────────────────────────────────────────────────
const fmt  = (v) => `Rs ${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtN = (v) => Number(v || 0).toLocaleString("en-IN");

const RANGES = [
  { key: "daily",   label: "Today" },
  { key: "weekly",  label: "This Week" },
  { key: "monthly", label: "This Month" },
];

const StatCard = ({ label, value, icon: Icon, tone = "primary" }) => {
  const bg = { primary: colors.primarySoft, success: colors.accentSoft, warning: colors.warningSoft, danger: colors.dangerSoft }[tone];
  const fg = { primary: colors.primary, success: colors.accent, warning: colors.warning, danger: colors.danger }[tone];
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Icon size={18} color={fg} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
};

const FeeRow = ({ label, value, highlight }) => {
  if (value === undefined || value === null) return null;
  const num = Number(value || 0);
  return (
    <View style={[styles.feeRow, highlight && styles.feeRowHighlight]}>
      <Text style={[styles.feeLabel, highlight && styles.feeLabelHighlight]}>{label}</Text>
      <Text style={[styles.feeValue, highlight && styles.feeValueHighlight,
        num < 0 && { color: colors.danger }
      ]}>
        {num < 0 ? `− Rs ${Math.abs(num).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                 : fmt(num)}
      </Text>
    </View>
  );
};

const StatusRow = ({ label, count, tone = "muted" }) => {
  const fg = { primary: colors.primary, success: colors.accent, warning: colors.warning, danger: colors.danger, muted: colors.muted }[tone];
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, { backgroundColor: fg }]} />
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusCount, { color: fg }]}>{count}</Text>
    </View>
  );
};

// ── Screen ───────────────────────────────────────────────────────
export default function ReportsScreen({ navigation }) {
  const [range,   setRange]   = useState("daily");
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = async (r = range) => {
    setLoading(true);
    setError("");
    try {
      const data = await getReports(r);
      setReport(data);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [range]);

  const summary = report?.summary || {};
  const statusBreakdown = useMemo(
    () => Object.entries(report?.statusBreakdown || {}),
    [report]
  );

  const fees = useMemo(() => [
    ["Subtotal",         summary.subtotal],
    ["Packaging Fee",    summary.packagingFee],
    ["Delivery Fee",     summary.deliveryFee],
    ["Tax",              summary.tax],
    ["Platform Fee",     summary.platformFee],
    ["Payment Gateway",  summary.gatewayFee],
    ["COD Charge",       summary.codCharge],
    ["Tips",             summary.tips],
    ["Discount",         summary.discount ? -Number(summary.discount) : 0],
  ], [summary]);

  const STATUS_META = {
    PENDING:          { label: "Pending",           tone: "warning" },
    ACCEPTED:         { label: "Accepted",           tone: "primary" },
    PREPARING:        { label: "Preparing",          tone: "warning" },
    READY_FOR_PICKUP: { label: "Ready for Pickup",   tone: "success" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery",   tone: "primary" },
    DELIVERED:        { label: "Delivered",          tone: "success" },
    CANCELLED:        { label: "Cancelled",          tone: "danger"  },
    REJECTED:         { label: "Rejected",           tone: "danger"  },
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.ink} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <TouchableOpacity onPress={() => load(range)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <RefreshCw size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Range tabs */}
      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.rangeBtn, range === r.key && styles.rangeBtnActive]}
            onPress={() => setRange(r.key)}
          >
            <Text style={[styles.rangeBtnText, range === r.key && styles.rangeBtnTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading report…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Summary stats ── */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Revenue"
              value={fmt(summary.totalRevenue ?? summary.revenue)}
              icon={IndianRupee}
              tone="success"
            />
            <StatCard
              label="Total Orders"
              value={fmtN(summary.totalOrders ?? summary.orders)}
              icon={Package}
              tone="primary"
            />
            <StatCard
              label="Avg Order Value"
              value={fmt(
                summary.avgOrderValue ??
                (summary.totalOrders > 0
                  ? (summary.totalRevenue || 0) / summary.totalOrders
                  : 0)
              )}
              icon={IndianRupee}
              tone="warning"
            />
            <StatCard
              label="Completed"
              value={fmtN(summary.completedOrders ?? summary.delivered)}
              icon={Package}
              tone="success"
            />
          </View>

          {/* ── Fee breakdown ── */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>💰  Revenue Breakdown</Text>
            {fees.map(([label, val]) => (
              <FeeRow key={label} label={label} value={val} />
            ))}
            <View style={styles.divider} />
            <FeeRow
              label="Net Revenue"
              value={summary.netRevenue ?? summary.totalRevenue ?? summary.revenue}
              highlight
            />
          </Card>

          {/* ── Order status breakdown ── */}
          {statusBreakdown.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>📦  Order Status Breakdown</Text>
              {statusBreakdown.map(([status, count]) => {
                const meta = STATUS_META[status] || { label: status, tone: "muted" };
                return (
                  <StatusRow key={status} label={meta.label} count={count} tone={meta.tone} />
                );
              })}
            </Card>
          )}

          {/* ── Chart placeholder ── */}
          {report?.dailyRevenue && report.dailyRevenue.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>📈  Daily Revenue</Text>
              {report.dailyRevenue.map((entry, i) => {
                const max = Math.max(...report.dailyRevenue.map((e) => e.revenue || 0), 1);
                const pct = ((entry.revenue || 0) / max) * 100;
                return (
                  <View key={i} style={styles.barRow}>
                    <Text style={styles.barLabel}>{entry.date || entry.day || `Day ${i + 1}`}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.max(pct, 2)}%` }]} />
                    </View>
                    <Text style={styles.barValue}>{fmt(entry.revenue)}</Text>
                  </View>
                );
              })}
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: colors.ink, flex: 1, marginLeft: 10 },

  rangeRow: {
    flexDirection: "row", backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.line,
    paddingHorizontal: 16, paddingBottom: 0,
  },
  rangeBtn: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 2, borderBottomColor: "transparent", marginBottom: -1,
  },
  rangeBtnActive:    { borderBottomColor: colors.primary },
  rangeBtnText:      { fontSize: 14, fontWeight: "800", color: colors.muted },
  rangeBtnTextActive:{ color: colors.primary },

  loadingText: { color: colors.muted, fontWeight: "700", marginTop: 8 },
  errorEmoji:  { fontSize: 40 },
  errorText:   { fontSize: 15, color: colors.danger, fontWeight: "700", textAlign: "center" },
  retryBtn:    { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primarySoft, borderRadius: 12 },
  retryBtnText:{ color: colors.primary, fontWeight: "900" },

  scroll: { padding: 16, gap: 14, paddingBottom: 32 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard:  { flex: 1, minWidth: "45%", alignItems: "center", gap: 6, paddingVertical: 16 },
  statIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 20, fontWeight: "900", color: colors.ink, textAlign: "center" },
  statLabel: { fontSize: 11, fontWeight: "800", color: colors.muted, textAlign: "center" },

  section:      { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "900", color: colors.ink, marginBottom: 2 },

  feeRow:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 5 },
  feeRowHighlight: { backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 2 },
  feeLabel:        { fontSize: 14, color: colors.ink, fontWeight: "700" },
  feeLabelHighlight: { fontWeight: "900" },
  feeValue:        { fontSize: 14, color: colors.ink, fontWeight: "800" },
  feeValueHighlight: { fontWeight: "900", color: colors.primary },

  divider:     { height: 1, backgroundColor: colors.line, marginVertical: 4 },

  statusRow:   { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 10 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.ink },
  statusCount: { fontSize: 15, fontWeight: "900" },

  barRow:      { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  barLabel:    { fontSize: 11, color: colors.muted, fontWeight: "700", width: 50 },
  barTrack:    { flex: 1, height: 10, backgroundColor: "#f1f5f9", borderRadius: 5, overflow: "hidden" },
  barFill:     { height: "100%", backgroundColor: colors.primary, borderRadius: 5 },
  barValue:    { fontSize: 11, color: colors.ink, fontWeight: "800", width: 60, textAlign: "right" },
});
