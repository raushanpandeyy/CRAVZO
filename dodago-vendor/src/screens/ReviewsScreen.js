/**
 * ReviewsScreen — vendor views and replies to customer reviews.
 *
 * API:
 *   GET  /api/v1/reviews/restaurant/:restaurantId  → list reviews
 *   POST /api/v1/reviews/:reviewId/reply           → submit reply
 */
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { colors } from "../constants/colors";
import { ArrowLeft, Star } from "../components/Icons";
import { Card, EmptyState } from "../components/Primitives";
import { getMyRestaurant, getReviews, replyToReview } from "../services/vendorService";

// ── Helpers ──────────────────────────────────────────────────────
const fmtDate = (v) => {
  if (!v) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(v));
};

const RatingStars = ({ rating = 0, size = 14 }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        color={s <= rating ? "#f59e0b" : "#e2e8f0"}
        strokeWidth={1.5}
        filled={s <= rating}
      />
    ))}
  </View>
);

const SummaryBadge = ({ label, value, tone = "primary" }) => {
  const bg = tone === "success" ? colors.accentSoft
           : tone === "warning" ? colors.warningSoft
           : colors.primarySoft;
  const fg = tone === "success" ? colors.accent
           : tone === "warning" ? colors.warning
           : colors.primary;
  return (
    <View style={[styles.summaryBadge, { backgroundColor: bg }]}>
      <Text style={[styles.summaryVal, { color: fg }]}>{value}</Text>
      <Text style={[styles.summaryLbl, { color: fg }]}>{label}</Text>
    </View>
  );
};

// ── Screen ───────────────────────────────────────────────────────
export default function ReviewsScreen({ navigation }) {
  const [restaurant, setRestaurant] = useState(null);
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replies,    setReplies]    = useState({}); // { reviewId: draft text }
  const [saving,     setSaving]     = useState(""); // reviewId being saved

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const rest = await getMyRestaurant();
      setRestaurant(rest);
      if (rest?.id) {
        const data = await getReviews(rest.id);
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    const total = reviews.length;
    const avg   = total
      ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total).toFixed(1)
      : "0.0";
    const replied = reviews.filter((r) => r.reply?.trim()).length;
    return { total, avg, replied, pending: total - replied };
  }, [reviews]);

  const handleReply = async (reviewId) => {
    const text = (replies[reviewId] || "").trim();
    if (!text) { Alert.alert("Empty reply", "Please type a reply first."); return; }
    setSaving(reviewId);
    try {
      await replyToReview(reviewId, text);
      setReviews((prev) =>
        prev.map((r) => r.id === reviewId ? { ...r, reply: text } : r)
      );
      setReplies((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (err) {
      Alert.alert("Failed", err.message || "Could not save reply");
    } finally {
      setSaving("");
    }
  };

  const renderReview = ({ item }) => {
    const hasReply   = Boolean(item.reply?.trim());
    const draftReply = replies[item.id] ?? (item.reply || "");

    return (
      <Card style={styles.reviewCard}>
        {/* Top row */}
        <View style={styles.reviewTop}>
          <View style={styles.reviewerWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.customer?.name || item.userName || "?")[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.reviewerName}>
                {item.customer?.name || item.userName || "Customer"}
              </Text>
              <Text style={styles.reviewDate}>{fmtDate(item.createdAt)}</Text>
            </View>
          </View>
          <RatingStars rating={item.rating} />
        </View>

        {/* Comment */}
        {item.comment?.trim() ? (
          <Text style={styles.reviewComment}>"{item.comment}"</Text>
        ) : (
          <Text style={styles.reviewNoComment}>No written comment</Text>
        )}

        {/* Existing reply */}
        {hasReply && (
          <View style={styles.replyBubble}>
            <Text style={styles.replyLabel}>🏪  Your reply</Text>
            <Text style={styles.replyText}>{item.reply}</Text>
          </View>
        )}

        {/* Reply input */}
        <View style={styles.replyInputWrap}>
          <TextInput
            style={styles.replyInput}
            placeholder={hasReply ? "Update your reply…" : "Write a reply…"}
            placeholderTextColor={colors.subtle}
            value={draftReply === item.reply ? "" : draftReply}
            onChangeText={(v) => setReplies((p) => ({ ...p, [item.id]: v }))}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.replyBtn,
              (saving === item.id || !((replies[item.id] || "").trim())) && styles.replyBtnDisabled,
            ]}
            onPress={() => handleReply(item.id)}
            disabled={saving === item.id || !((replies[item.id] || "").trim())}
          >
            {saving === item.id
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.replyBtnText}>{hasReply ? "Update" : "Reply"}</Text>
            }
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.ink} strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Customer Reviews</Text>
          {restaurant?.name ? (
            <Text style={styles.headerSub}>{restaurant.name}</Text>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading reviews…</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.id}
          renderItem={renderReview}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load({ silent: true }); }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={() => (
            <View style={styles.summaryRow}>
              <SummaryBadge label="Avg Rating" value={`⭐ ${summary.avg}`} />
              <SummaryBadge label="Total" value={summary.total} tone="warning" />
              <SummaryBadge label="Replied" value={summary.replied} tone="success" />
              <SummaryBadge label="Pending" value={summary.pending} tone="primary" />
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="⭐"
                title="No reviews yet"
                body="Customer reviews will appear here once orders are delivered."
              />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },

  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  backBtn:    { padding: 4 },
  headerTitle:{ fontSize: 18, fontWeight: "900", color: colors.ink },
  headerSub:  { fontSize: 12, color: colors.muted, fontWeight: "700", marginTop: 1 },

  loadingText: { color: colors.muted, fontWeight: "700", marginTop: 8 },

  summaryRow: {
    flexDirection: "row", gap: 8, flexWrap: "wrap",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  summaryBadge: { flex: 1, minWidth: 70, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center", gap: 2 },
  summaryVal:   { fontSize: 18, fontWeight: "900" },
  summaryLbl:   { fontSize: 10, fontWeight: "800" },

  list:   { paddingHorizontal: 16, paddingBottom: 32, gap: 12, paddingTop: 8 },

  reviewCard:  { gap: 10 },
  reviewTop:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewerWrap:{ flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center",
  },
  avatarText:     { fontSize: 15, fontWeight: "900", color: colors.primary },
  reviewerName:   { fontSize: 14, fontWeight: "900", color: colors.ink },
  reviewDate:     { fontSize: 11, color: colors.muted, fontWeight: "700", marginTop: 1 },
  starsRow:       { flexDirection: "row", gap: 2 },

  reviewComment:  { fontSize: 14, color: colors.ink, lineHeight: 21, fontStyle: "italic", fontWeight: "600" },
  reviewNoComment:{ fontSize: 13, color: colors.subtle, fontWeight: "700", fontStyle: "italic" },

  replyBubble: {
    backgroundColor: colors.primarySoft, borderRadius: 12,
    padding: 10, borderLeftWidth: 3, borderLeftColor: colors.primary,
    gap: 4,
  },
  replyLabel: { fontSize: 11, fontWeight: "900", color: colors.primary },
  replyText:  { fontSize: 13, color: colors.ink, lineHeight: 19, fontWeight: "600" },

  replyInputWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  replyInput: {
    flex: 1, minHeight: 40, maxHeight: 100,
    borderRadius: 12, borderWidth: 1.5, borderColor: colors.line,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 13, color: colors.ink, backgroundColor: "#f8fafc", fontWeight: "600",
  },
  replyBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.primary, justifyContent: "center", alignItems: "center",
    minWidth: 70,
  },
  replyBtnDisabled: { opacity: 0.4 },
  replyBtnText:     { color: "#fff", fontWeight: "900", fontSize: 13 },

  emptyWrap: { padding: 24 },
});
