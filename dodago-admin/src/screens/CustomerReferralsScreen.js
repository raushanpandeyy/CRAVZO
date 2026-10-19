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

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchReferrals = ({ page = 1, search = "", status = "", suspect = false } = {}) => {
  const p = new URLSearchParams({ page, limit: 30 });
  if (search)  p.set("search", search);
  if (status)  p.set("status", status);
  if (suspect) p.set("suspect", "true");
  return apiRequest(`/api/admin/customer-referrals?${p}`);
};

const fetchMilestones = ({ page = 1, status = "" } = {}) => {
  const p = new URLSearchParams({ page, limit: 30 });
  if (status) p.set("status", status);
  return apiRequest(`/api/admin/customer-referrals/milestones?${p}`);
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  PENDING:      { bg: "#fff7ed", text: "#c2410c" },
  OTP_VERIFIED: { bg: "#eff6ff", text: "#1d4ed8" },
  COMPLETED:    { bg: "#f0fdf4", text: "#166534" },
  SUSPECT:      { bg: "#fef2f2", text: "#991b1b" },
  CANCELLED:    { bg: "#f8fafc", text: "#64748b" },
};
function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || { bg: "#f8fafc", text: "#64748b" };
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: c.text, fontWeight: "900", fontSize: 11 }}>{status}</Text>
    </View>
  );
}

// ─── Referral row ─────────────────────────────────────────────────────────────
function ReferralRow({ item }) {
  return (
    <View style={row.card}>
      <View style={row.top}>
        <View style={row.names}>
          <View>
            <Text style={row.roleLabel}>Referrer</Text>
            <Text style={row.name}>{item.referrer?.name || "—"}</Text>
            <Text style={row.phone}>{item.referrer?.phone || item.referrer?.email || ""}</Text>
          </View>
          <Text style={row.arrow}>→</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={row.roleLabel}>Referred</Text>
            <Text style={row.name}>{item.referred?.name || "—"}</Text>
            <Text style={row.phone}>{item.referred?.phone || item.referred?.email || ""}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>
      {item.suspectFlag ? (
        <View style={row.suspectBar}>
          <Text style={row.suspectText}>⚠ Suspect — {item.suspectReason || "Flagged"}</Text>
        </View>
      ) : null}
      <View style={row.footer}>
        <Text style={row.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        {item.completedAt ? (
          <Text style={row.completed}>✓ Qualified {new Date(item.completedAt).toLocaleDateString()}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Milestone row ────────────────────────────────────────────────────────────
const MILESTONE_STATUS_COLOR = {
  ISSUED:   { bg: "#eff6ff", text: "#1d4ed8" },
  REDEEMED: { bg: "#f0fdf4", text: "#166534" },
  EXPIRED:  { bg: "#fef2f2", text: "#991b1b" },
};
function MilestoneRow({ item }) {
  const c = MILESTONE_STATUS_COLOR[item.status] || MILESTONE_STATUS_COLOR.EXPIRED;
  return (
    <View style={mrow.card}>
      <View style={mrow.top}>
        <View style={{ flex: 1 }}>
          <Text style={mrow.name}>{item.user?.name || "—"}</Text>
          <Text style={mrow.phone}>{item.user?.phone || ""}</Text>
        </View>
        <View style={[mrow.badge, { backgroundColor: c.bg }]}>
          <Text style={[mrow.badgeText, { color: c.text }]}>{item.status}</Text>
        </View>
      </View>
      <View style={mrow.details}>
        <Text style={mrow.code}>{item.voucherCode}</Text>
        <Text style={mrow.reward}>
          Tier {item.tier} · {item.rewardType === "FREE_DELIVERY" ? `Free delivery ₹${item.rewardValue}` : `₹${item.rewardValue} off`}
        </Text>
      </View>
      <View style={mrow.footer}>
        <Text style={mrow.date}>Issued {new Date(item.issuedAt).toLocaleDateString()}</Text>
        {item.redeemedAt ? (
          <Text style={mrow.redeemed}>Redeemed {new Date(item.redeemedAt).toLocaleDateString()}</Text>
        ) : (
          <Text style={mrow.expires}>Expires {new Date(item.expiresAt).toLocaleDateString()}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Summary Banner ───────────────────────────────────────────────────────────
function SummaryBanner({ summary }) {
  if (!summary) return null;
  return (
    <View style={ban.wrap}>
      {[
        { num: summary.totalReferrals,    label: "Total" },
        { num: summary.pendingReferrals,  label: "Pending" },
        { num: summary.completedReferrals,label: "Qualified" },
        { num: summary.suspectReferrals,  label: "Suspect" },
      ].map((item, i, arr) => (
        <React.Fragment key={item.label}>
          <View style={ban.stat}>
            <Text style={ban.num}>{item.num}</Text>
            <Text style={ban.label}>{item.label}</Text>
          </View>
          {i < arr.length - 1 && <View style={ban.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TABS = ["Referrals", "Milestones"];
const STATUS_FILTERS = ["", "PENDING", "OTP_VERIFIED", "COMPLETED", "SUSPECT"];
const MILESTONE_FILTERS = ["", "ISSUED", "REDEEMED"];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CustomerReferralsScreen() {
  const [tab, setTab] = useState(0); // 0 = Referrals, 1 = Milestones

  // Referrals state
  const [referrals, setReferrals] = useState([]);
  const [refSummary, setRefSummary] = useState(null);
  const [refPage, setRefPage] = useState(1);
  const [refTotal, setRefTotal] = useState(0);
  const [refLoading, setRefLoading] = useState(false);
  const [refRefreshing, setRefRefreshing] = useState(false);
  const [refSearch, setRefSearch] = useState("");
  const [refStatus, setRefStatus] = useState("");
  const [refSuspect, setRefSuspect] = useState(false);

  // Milestones state
  const [milestones, setMilestones] = useState([]);
  const [msPage, setMsPage] = useState(1);
  const [msTotal, setMsTotal] = useState(0);
  const [msSummary, setMsSummary] = useState(null);
  const [msLoading, setMsLoading] = useState(false);
  const [msStatus, setMsStatus] = useState("");

  // ── Load referrals ──────────────────────────────────────────────────────────
  const loadReferrals = useCallback(async ({ reset = false } = {}) => {
    setRefLoading(true);
    const p = reset ? 1 : refPage;
    try {
      const res = await fetchReferrals({ page: p, search: refSearch, status: refStatus, suspect: refSuspect });
      const items = res.data?.referrals || [];
      setReferrals(reset ? items : (prev) => [...prev, ...items]);
      setRefTotal(res.data?.pagination?.total || 0);
      setRefSummary(res.data?.summary || null);
      if (reset) setRefPage(1);
    } catch (e) { console.error(e.message); }
    finally { setRefLoading(false); setRefRefreshing(false); }
  }, [refPage, refSearch, refStatus, refSuspect]);

  useEffect(() => { loadReferrals({ reset: true }); }, [refSearch, refStatus, refSuspect]);
  useEffect(() => { if (refPage > 1) loadReferrals(); }, [refPage]);

  // ── Load milestones ─────────────────────────────────────────────────────────
  const loadMilestones = useCallback(async ({ reset = false } = {}) => {
    setMsLoading(true);
    const p = reset ? 1 : msPage;
    try {
      const res = await fetchMilestones({ page: p, status: msStatus });
      const items = res.data?.milestones || [];
      setMilestones(reset ? items : (prev) => [...prev, ...items]);
      setMsTotal(res.data?.pagination?.total || 0);
      setMsSummary(res.data?.summary || null);
      if (reset) setMsPage(1);
    } catch (e) { console.error(e.message); }
    finally { setMsLoading(false); }
  }, [msPage, msStatus]);

  useEffect(() => { if (tab === 1) loadMilestones({ reset: true }); }, [tab, msStatus]);
  useEffect(() => { if (msPage > 1) loadMilestones(); }, [msPage]);

  return (
    <SafeAreaView style={s.screen}>
      {/* Title */}
      <View style={s.titleBar}>
        <Text style={s.title}>Customer Referrals</Text>
        <Text style={s.sub}>Refer & Earn — milestone voucher program</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} onPress={() => setTab(i)} style={[s.tab, tab === i && s.tabActive]}>
            <Text style={[s.tabText, tab === i && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 0 ? (
        <>
          <SummaryBanner summary={refSummary} />

          {/* Search + filters */}
          <View style={s.filterRow}>
            <TextInput
              style={s.search}
              placeholder="Search name, phone, email…"
              placeholderTextColor={COLORS.subtle}
              value={refSearch}
              onChangeText={(v) => { setRefSearch(v); setRefPage(1); }}
            />
          </View>
          <View style={s.chips}>
            {STATUS_FILTERS.map((f) => (
              <TouchableOpacity key={f || "all"} onPress={() => { setRefStatus(f); setRefPage(1); }}
                style={[s.chip, refStatus === f && s.chipActive]}>
                <Text style={[s.chipText, refStatus === f && s.chipTextActive]}>{f || "All"}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => { setRefSuspect((p) => !p); setRefPage(1); }}
              style={[s.chip, refSuspect && s.chipDanger]}>
              <Text style={[s.chipText, refSuspect && { color: "#fff" }]}>⚠ Suspect</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={referrals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ReferralRow item={item} />}
            refreshControl={<RefreshControl refreshing={refRefreshing} onRefresh={() => { setRefRefreshing(true); loadReferrals({ reset: true }); }} />}
            onEndReached={() => { if (referrals.length < refTotal) setRefPage((p) => p + 1); }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={refLoading && referrals.length > 0 ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null}
            ListEmptyComponent={!refLoading ? <View style={s.empty}><Text style={s.emptyText}>No referrals found.</Text></View> : null}
            contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 32 }}
          />
        </>
      ) : (
        <>
          {/* Milestone summary */}
          {msSummary ? (
            <View style={ban.wrap}>
              {[
                { num: msSummary.issued,   label: "Issued",   color: "#1d4ed8" },
                { num: msSummary.redeemed, label: "Redeemed", color: "#166534" },
                { num: msSummary.expired,  label: "Expired",  color: "#991b1b" },
              ].map((item, i, arr) => (
                <React.Fragment key={item.label}>
                  <View style={ban.stat}>
                    <Text style={[ban.num, { color: item.color }]}>{item.num}</Text>
                    <Text style={ban.label}>{item.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={ban.divider} />}
                </React.Fragment>
              ))}
            </View>
          ) : null}

          {/* Milestone status filter */}
          <View style={[s.chips, { paddingHorizontal: 12 }]}>
            {MILESTONE_FILTERS.map((f) => (
              <TouchableOpacity key={f || "all"} onPress={() => { setMsStatus(f); setMsPage(1); }}
                style={[s.chip, msStatus === f && s.chipActive]}>
                <Text style={[s.chipText, msStatus === f && s.chipTextActive]}>{f || "All"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={milestones}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MilestoneRow item={item} />}
            onEndReached={() => { if (milestones.length < msTotal) setMsPage((p) => p + 1); }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={msLoading && milestones.length > 0 ? <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} /> : null}
            ListEmptyComponent={!msLoading ? <View style={s.empty}><Text style={s.emptyText}>No milestones found.</Text></View> : null}
            contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 32 }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  titleBar: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.ink },
  sub: { fontSize: 12, fontWeight: "700", color: COLORS.muted, marginTop: 2 },
  tabs: { flexDirection: "row", marginHorizontal: 12, marginBottom: 8, borderRadius: 14, backgroundColor: "#e2e8f0", padding: 4 },
  tab: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontWeight: "800", fontSize: 13, color: COLORS.muted },
  tabTextActive: { color: COLORS.primaryDark },
  filterRow: { paddingHorizontal: 12, marginBottom: 6 },
  search: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: "700", color: COLORS.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 12, marginBottom: 8 },
  chip: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.line },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipDanger: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  chipText: { fontWeight: "800", fontSize: 12, color: COLORS.ink },
  chipTextActive: { color: "#fff" },
  empty: { alignItems: "center", padding: 32 },
  emptyText: { color: COLORS.muted, fontWeight: "700" },
});

const ban = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: COLORS.primary, marginHorizontal: 12, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, marginBottom: 6 },
  stat: { flex: 1, alignItems: "center" },
  num: { color: "#fff", fontWeight: "900", fontSize: 20 },
  label: { color: "#c7d2fe", fontWeight: "700", fontSize: 11 },
  divider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
});

const row = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: COLORS.line },
  top: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  names: { flex: 1, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  roleLabel: { color: COLORS.subtle, fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  name: { color: COLORS.ink, fontWeight: "900", fontSize: 14 },
  phone: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  arrow: { color: COLORS.muted, fontWeight: "900", fontSize: 16 },
  suspectBar: { backgroundColor: "#fef2f2", borderRadius: 8, padding: 8 },
  suspectText: { color: "#991b1b", fontWeight: "800", fontSize: 12 },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  date: { color: COLORS.subtle, fontWeight: "700", fontSize: 12 },
  completed: { color: "#059669", fontWeight: "800", fontSize: 12 },
});

const mrow = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: COLORS.line },
  top: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { color: COLORS.ink, fontWeight: "900", fontSize: 14 },
  phone: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontWeight: "900", fontSize: 11 },
  details: { gap: 2 },
  code: { color: COLORS.primaryDark, fontWeight: "900", fontSize: 15, letterSpacing: 2 },
  reward: { color: COLORS.muted, fontWeight: "700", fontSize: 12 },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  date: { color: COLORS.subtle, fontWeight: "700", fontSize: 12 },
  redeemed: { color: "#059669", fontWeight: "800", fontSize: 12 },
  expires: { color: "#d97706", fontWeight: "800", fontSize: 12 },
});
