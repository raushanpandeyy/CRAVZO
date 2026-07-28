import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { apiRequest } from "../services/api";
import OptimizedImage from "./OptimizedImage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PROMO_HEIGHT = 240;
const INTERVAL_MS = 7000;
const INTERACTION_COOLDOWN = 10000;

const DishPromoCarousel = ({ promotions: propPromotions, navigation }) => {
  const [promotions, setPromotions] = useState(propPromotions || []);
  const [loading, setLoading] = useState(!propPromotions);
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef(null);
  const currentRef = useRef(0);
  const lastInteractionRef = useRef(Date.now());
  const touchRef = useRef({ startX: 0, swiped: false });

  useEffect(() => {
    if (propPromotions) {
      setPromotions(propPromotions);
      setLoading(false);
      return;
    }

    const fetchPromos = async () => {
      try {
        const response = await apiRequest("/api/promotions");
        setPromotions(response.data || []);
      } catch {
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();
  }, [propPromotions]);

  const total = promotions.length;

  const handleMomentumScrollEnd = useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    currentRef.current = index;
    setCurrent(index);
  }, []);

  useEffect(() => {
    if (total < 2) return undefined;

    const timer = setInterval(() => {
      if (Date.now() - lastInteractionRef.current < INTERACTION_COOLDOWN) return;
      const nextIndex = (currentRef.current + 1) % total;
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      currentRef.current = nextIndex;
      setCurrent(nextIndex);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [total]);

  const goTo = useCallback((index) => {
    lastInteractionRef.current = Date.now();
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    currentRef.current = index;
    setCurrent(index);
  }, []);

  const onTouchStart = (e) => {
    touchRef.current.startX = e.nativeEvent.pageX;
    touchRef.current.swiped = false;
    lastInteractionRef.current = Date.now();
  };

  const onTouchEnd = (e) => {
    if (Math.abs(e.nativeEvent.pageX - touchRef.current.startX) > 50) {
      touchRef.current.swiped = true;
    }
    lastInteractionRef.current = Date.now();
  };

  const handlePress = useCallback((slide) => {
    if (touchRef.current.swiped) {
      touchRef.current.swiped = false;
      return;
    }
    if (!navigation?.navigate) return;

    if (slide.linkType === "dish" && slide.linkValue) {
      navigation.navigate("DishScreen", { dishId: slide.linkValue });
    } else if (slide.linkType === "restaurant" && slide.linkValue) {
      navigation.navigate("RestaurantMenu", { restaurantId: slide.linkValue });
    }
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="small" color="#818cf8" />
      </View>
    );
  }

  if (total === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>DODAGO</Text>
        <Text style={styles.emptySubtitle}>Affordable food delivery</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {promotions.map((slide) => (
          <TouchableOpacity
            key={slide.id}
            activeOpacity={0.95}
            onPress={() => handlePress(slide)}
            style={styles.slide}
            accessibilityLabel={slide.title || slide.subtitle || "Promotion"}
          >
            <OptimizedImage
              source={{ uri: slide.imageUrl }}
              style={styles.slideImage}
              resizeMode="cover"
            />
            <View style={styles.slideOverlay} />
            {slide.title ? <Text style={styles.slideTitle}>{slide.title}</Text> : null}
            {slide.subtitle ? (
              <View style={styles.slideBadge}>
                <Text style={styles.slideBadgeText}>{slide.subtitle}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {total > 1 ? (
        <View style={styles.dots}>
          {promotions.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goTo(i)}
              style={[styles.dot, i === current ? styles.dotActive : styles.dotInactive]}
              accessibilityLabel={`Go to slide ${i + 1}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

export default React.memo(DishPromoCarousel);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    height: PROMO_HEIGHT,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
  },
  loadingState: {
    width: "100%",
    height: PROMO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  emptyState: {
    width: "100%",
    height: PROMO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbeafe",
  },
  emptyTitle: {
    color: "#818cf8",
    fontSize: 20,
    fontWeight: "900",
  },
  emptySubtitle: {
    marginTop: 4,
    color: "#818cf8",
    fontSize: 12,
    fontWeight: "600",
  },
  slide: {
    width: SCREEN_WIDTH,
    height: PROMO_HEIGHT,
  },
  slideImage: {
    width: SCREEN_WIDTH,
    height: PROMO_HEIGHT,
  },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.24)",
  },
  slideTitle: {
    position: "absolute",
    left: 12,
    bottom: 12,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  slideBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 999,
    backgroundColor: "#4f46e5",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  slideBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  dots: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
  dotActive: {
    width: 20,
    backgroundColor: "#ffffff",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});