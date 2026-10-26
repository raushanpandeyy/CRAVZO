import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ExpoClipboard from "expo-clipboard";
import { ChevronLeft, Copy, Share2, Trophy, Users, Zap } from "../components/Icons";
import { Card } from "../components/Primitives";
import { colors } from "../constants/colors";
import { getRiderReferralStats, RIDER_REFERRAL_STAGES, RIDER_REFERRAL_TOTAL } from "../services/riderReferralService";

const STAGE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b"];

export default function RiderReferralScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getRiderReferralStats();
      setStats(data);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not load referral data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleShare = async () => {
    if (!stats?.referralCode) return;
    try {
      await Share.share({
        title: "Join Dodago as a Rider",
        message: `Join me on Dodago Rider! Use my referral code: ${stats.referralCode}\n\nDownload the app and enter this code during signup. You and I both benefit when you start delivering!`,
      });
    } catch {}
  };

  const copyCode = async () => {
    if (!stats?.referralCode) return;
    await ExpoClipboard.setStringAsync(stats.referralCode);
    Alert.alert("Copied!", "Referral code copied to clipboard.");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const referralCode = stats?.referralCode || "";
  const referrals = stats?.referrals || [];

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer a Rider</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load({ silent: true }); }} />}
      >
        {/* ── Hero / Code Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Trophy size={22} color="#fbbf24" />
            <Text style={styles.heroTitle}>Earn up to ₹{RIDER_REFERRAL_TOTAL}</Text>
          </View>
          <Text style={styles.heroSub}>
            Share your code with a rider friend. When they join and complete orders, you get paid in stages.
          </Text>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralCode || "Loading…"}</Text>
            <TouchableOpacity onPress={copyCode} style={styles.copyBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Copy size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={!referralCode}>
            <Share2 size={18} color="#fff" />
            <Text style={styles.shareBtnText}>Share Code</Text>
          </TouchableOpacity>
        </View>

        {/* ── Payout Stages ── */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>How payouts work</Text>
          <Text style={styles.sectionSub}>
            Once your referred rider joins, you earn as they complete deliveries. Payouts are per stage — not cumulative.
          </Text>
          {RIDER_REFERRAL_STAGES.map((stage, idx) => (
            <View key={stage.stage} style={[styles.stageRow, idx < RIDER_REFERRAL_STAGES.length - 1 && styles.stageBorder]}>
              <View style={[styles.stageDot, { backgroundColor: STAGE_COLORS[idx] }]}>
                <Text style={styles.stageDotText}>{stage.stage}</Text>
              </View>
              <View style={styles.stageInfo}>
                <Text style={styles.stageOrders}>{stage.ordersRequired} orders completed</Text>
                <Text style={styles.stageNote}>by the referred rider</Text>
              </View>
              <Text style={[styles.stagePayout, { color: STAGE_COLORS[idx] }]}>+₹{stage.payout}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total possible</Text>
            <Text style={styles.totalValue}>₹{RIDER_REFERRAL_TOTAL}</Text>
          </View>
        </Card>

        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Users size={18} color={colors.primary} />
            <Text style={styles.statNum}>{stats?.totalReferrals || 0}</Text>
            <Text style={styles.statLabel}>Total Referred</Text>
          </Card>
          <Card style={styles.statCard}>
            <Zap size={18} color="#f59e0b" />
            <Text style={styles.statNum}>{stats?.activeReferrals || 0}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </Card>
          <Card style={styles.statCard}>
            <Trophy size={18} color="#10b981" />
            <Text style={styles.statNum}>₹{stats?.totalEarned || 0}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </Card>
        </View>

        {/* ── Referred Riders List ── */}
        {referrals.length > 0 ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Referred Riders</Text>
            {referrals.map((rr) => (
              <ReferredRiderRow key={rr.id} rr={rr} />
            ))}
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Users size={28} color={colors.muted} />
            <Text style={styles.emptyTitle}>No referrals yet</Text>
            <Text style={styles.emptyBody}>Share your code with rider friends to start earning.</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function ReferredRiderRow({ rr }) {
  const progress = rr.referredOrderCount;
  const nextStage = rr.nextStage;
  const pct = nextStage
    ? Math.min(100, (progress / nextStage.ordersRequired) * 100)
    : 100;

  return (
    <View style={rrStyles.wrap}>
      <View style={rrStyles.top}>
        <View style={rrStyles.avatar}>
          <Text style={rrStyles.initials}>{(rr.referred?.name || "R").slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={rrStyles.info}>
          <Text style={rrStyles.name}>{rr.referred?.name || "Rider"}</Text>
          <Text style={rrStyles.orders}>{progress} orders completed</Text>
        </View>
        <Text style={rrStyles.paid}>₹{rr.totalPaid}</Text>
      </View>

      {/* Stage badges */}
      <View style={rrStyles.stages}>
        {RIDER_REFERRAL_STAGES.map((s, idx) => {
          const unlocked = rr.stages?.[idx]?.unlocked;
          return (
            <View key={s.stage} style={[rrStyles.badge, unlocked ? rrStyles.badgeUnlocked : rrStyles.badgeLocked]}>
              <Text style={[rrStyles.badgeText, unlocked ? rrStyles.badgeTextUnlocked : rrStyles.badgeTextLocked]}>
                {unlocked ? "✓" : s.ordersRequired} {unlocked ? `₹${s.payout}` : "orders"}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Progress bar toward next stage */}
      {nextStage ? (
        <View style={rrStyles.progressWrap}>
          <View style={rrStyles.progressTrack}>
            <View style={[rrStyles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={rrStyles.progressLabel}>
            {progress}/{nextStage.ordersRequired} for ₹{nextStage.payout} unlock
          </Text>
        </View>
      ) : (
        <Text style={rrStyles.completedText}>🎉 All stages completed — ₹{RIDER_REFERRAL_TOTAL} earned</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f7fb" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { backgroundColor: colors.primaryDark, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 48 },

  heroCard: { borderRadius: 24, backgroundColor: colors.primaryDark, padding: 20, gap: 12 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  heroSub: { color: "#c7d2fe", fontWeight: "700", lineHeight: 20 },
  codeLabel: { color: "#a5b4fc", fontWeight: "800", fontSize: 12, textTransform: "uppercase" },
  codeBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  codeText: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 4 },
  copyBtn: { padding: 4 },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, backgroundColor: colors.primary, paddingVertical: 14 },
  shareBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  card: { gap: 12 },
  sectionTitle: { color: colors.primaryDark, fontSize: 18, fontWeight: "900" },
  sectionSub: { color: colors.muted, fontWeight: "700", lineHeight: 19, fontSize: 13 },

  stageRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  stageBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  stageDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stageDotText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  stageInfo: { flex: 1 },
  stageOrders: { color: colors.ink, fontWeight: "800" },
  stageNote: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  stagePayout: { fontSize: 20, fontWeight: "900" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10, marginTop: 4 },
  totalLabel: { color: colors.muted, fontWeight: "900" },
  totalValue: { color: colors.primaryDark, fontSize: 22, fontWeight: "900" },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 14 },
  statNum: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", textAlign: "center" },

  emptyCard: { alignItems: "center", gap: 10, paddingVertical: 28 },
  emptyTitle: { color: colors.ink, fontWeight: "900", fontSize: 16 },
  emptyBody: { color: colors.muted, fontWeight: "700", textAlign: "center", lineHeight: 20 },
});

const rrStyles = StyleSheet.create({
  wrap: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingVertical: 14, gap: 10 },
  top: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  initials: { color: colors.primaryDark, fontWeight: "900", fontSize: 18 },
  info: { flex: 1 },
  name: { color: colors.ink, fontWeight: "900" },
  orders: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  paid: { color: "#059669", fontWeight: "900", fontSize: 18 },
  stages: { flexDirection: "row", gap: 8 },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  badgeUnlocked: { backgroundColor: "#ecfdf5", borderColor: "#6ee7b7" },
  badgeLocked: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" },
  badgeText: { fontWeight: "900", fontSize: 11 },
  badgeTextUnlocked: { color: "#059669" },
  badgeTextLocked: { color: colors.muted },
  progressWrap: { gap: 4 },
  progressTrack: { height: 6, borderRadius: 99, backgroundColor: "#e2e8f0", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99, backgroundColor: colors.primary },
  progressLabel: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  completedText: { color: "#059669", fontWeight: "900", fontSize: 13 },
});
