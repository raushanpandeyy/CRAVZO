import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiRequest } from "../services/api.js";
import { COLORS } from "../constants/config.js";

const STAGES = [
  { stage: 1, ordersRequired: 35, payout: 300 },
  { stage: 2, ordersRequired: 50, payout: 300 },
  { stage: 3, ordersRequired: 75, payout: 400 },
];
const TOTAL = 1000;

// ─── API helper ───────────────────────────────────────────────────────────────
const fetchRiderReferrals = ({ page = 1, search = "" } = {}) => {
  const params = new URLSearchParams({ page, limit: 30 });
  if (search) params.set("search", search);
  return apiRequest(`/api/admin/rider-referrals?${params}`);
};

// ─── Stage Pill ───────────────────────────────────────────────────────────────
function StagePill({ stage, unlocked }) {
  return (
    <View style={[pill.wrap, unlocked ? pill.done : pill.todo]}>
      <Text style={[pill.text, unlocked ? pill.textDone : pill.textTodo]}>
        {unlocked ? `✓ S${stage.stage}` : `S${stage.stage}: ${stage.ordersRequired}ord`}
      </Text>
    </View>
  );
}

// ─── Referral Row ─────────────────────────────────────────────────────────────
function ReferralRow({ item }) {
  const progress = item.referredOrderCount;
  const next = item.nextStage;
  const pct = next ? Math.min(100, (progress / next.ordersRequired) * 100) : 100;
  const allDone = !next;

  return (
    <View style={row.card}>
      {/* Referrer → Referred */}
      <View style={row.names}>
        <View style={row.nameBlock}>
          <Text style={row.nameLabel}>Referrer</Text>
          <Text style={row.name}>{item.referrer?.name || "—"}</Text>
          <Text style={row.phone}>{item.referrer?.phone || ""}</Text>
        </View>
        <Text style={row.arrow}>→</Text>
        <View style={[row.nameBlock, { alignItems: "flex-end" }]}>
          <Text style={row.nameLabel}>Referred Rider</Text>
          <Text style={row.name}>{item.referred?.name || "—"}</Text>
          <Text style={row.phone}>{item.referred?.phone || ""}</Text>
        </View>
      </View>

      {/* Stage badges */}
      <View style={row.stages}>
        {STAGES.map((s, idx) => (
          <StagePill key={s.stage} stage={s} unlocked={item.stages?.[idx]?.unlocked} />
        ))}
      </View>

      {/* Progress bar */}
      <View style={row.progressWrap}>
        <View style={row.bar}>
          <View style={[row.fill, { width: `${pct}%` }]} />
        </View>
        <Text style={row.progressLabel}>
          {allDone
            ? "✅ All stages complete"
            : `${progress}/${next.ordersRequired} orders → ₹${next.payout}`}
        </Text>
      </View>

      {/* Earned + date */}
      <View style={row.footer}>
        <Text style={row.earned}>₹{item.totalPaid} / ₹{TOTAL} earned</Text>
        <Text style={row.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );
}

// ─── Summary Banner ───────────────────────────────────────────────────────────
function SummaryBanner({ summary }) {
  if (!summary) return null;
  return (
    <View style={banner.wrap}>
      <View style={banner.stat}>
        <Text style={banner.num}>{summary.totalReferrals}</Text>
        <Text style={banner.label}>Total</Text>
      </View>
      <View style={banner.divider} />
      <View style={banner.stat}>
        <Text style={banner.num}>{summary.fullyCompleted}</Text>
        <Text style={banner.label}>Completed</Text>
      </View>
      <View style={banner.divider} />
      <View style={banner.stat}>
        <Text style={banner.num}>₹{summary.totalPaidOut}</Text>
        <Text style={banner.label}>Paid Out</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RiderReferralsScreen() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async ({ reset = false, silent = false } = {}) => {
    if (!silent) setLoading(true);
    const targetPage = reset ? 1 : page;
    try {
      const res = await fetchRiderReferrals({ page: targetPage, search });
      const newItems = res.data?.referrals || [];
      const pagination = res.data?.pagination;
      setSummary(res.data?.summary || null);
      setData(reset ? newItems : (prev) => [...prev, ...newItems]);
      setHasMore(targetPage < (pagination?.pages || 1));
      if (reset) setPage(1);
    } catch (err) {
      console.error("Rider referrals load error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [page, search]);

  useEffect(() => { load({ reset: true }); }, [search]);
  useEffect(() => { if (page > 1) load(); }, [page]);

  const refresh = () => { setRefreshing(true); load({ reset: true, silent: true }); };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  };

  if (loading && data.length === 0) {
    return (
      <SafeAreaView style={s.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      {/* Title */}
      <View style={s.titleBar}>
        <Text style={s.title}>Rider Referrals</Text>
        <Text style={s.sub}>Payout: ₹300 @ 35 · ₹300 @ 50 · ₹400 @ 75 orders</Text>
      </View>

      {/* Summary */}
      <SummaryBanner summary={summary} />

      {/* Search */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.search}
          placeholder="Search by name or phone…"
          placeholderTextColor={COLORS.subtle}
          value={search}
          onChangeText={(v) => { setSearch(v); setPage(1); }}
        />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReferralRow item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No rider referrals found.</Text>
          </View>
        }
        contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
  titleBar: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.ink },
  sub: { fontSize: 12, fontWeight: "700", color: COLORS.muted, marginTop: 2 },
  searchWrap: { paddingHorizontal: 12, paddingBottom: 8 },
  search: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: "700", color: COLORS.ink },
  empty: { alignItems: "center", padding: 32 },
  emptyText: { color: COLORS.muted, fontWeight: "700" },
});

const banner = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: COLORS.primary, marginHorizontal: 12, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, marginBottom: 4 },
  stat: { flex: 1, alignItems: "center" },
  num: { color: "#fff", fontWeight: "900", fontSize: 20 },
  label: { color: "#c7d2fe", fontWeight: "700", fontSize: 11 },
  divider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
});

const row = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, gap: 10, borderWidth: 1, borderColor: COLORS.line },
  names: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameBlock: { flex: 1 },
  nameLabel: { color: COLORS.subtle, fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  name: { color: COLORS.ink, fontWeight: "900", fontSize: 14 },
  phone: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  arrow: { color: COLORS.muted, fontSize: 18, fontWeight: "900" },
  stages: { flexDirection: "row", gap: 6 },
  progressWrap: { gap: 4 },
  bar: { height: 6, borderRadius: 99, backgroundColor: "#f1f5f9", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99, backgroundColor: COLORS.primary },
  progressLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "800" },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  earned: { color: "#059669", fontWeight: "900", fontSize: 13 },
  date: { color: COLORS.subtle, fontWeight: "700", fontSize: 12 },
});

const pill = StyleSheet.create({
  wrap: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  done: { backgroundColor: "#ecfdf5", borderColor: "#6ee7b7" },
  todo: { backgroundColor: "#f8fafc", borderColor: COLORS.line },
  text: { fontSize: 10, fontWeight: "900" },
  textDone: { color: "#059669" },
  textTodo: { color: COLORS.muted },
});
