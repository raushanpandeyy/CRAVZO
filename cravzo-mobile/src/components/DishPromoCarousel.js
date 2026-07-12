import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { apiRequest } from "../services/api";
import OptimizedImage from "./OptimizedImage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
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
    if (total < 2) return;
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
    if (slide.linkType === "dish" && slide.linkValue) {
      navigation.navigate("DishScreen", { dishId: slide.linkValue });
    } else if (slide.linkType === "restaurant" && slide.linkValue) {
      navigation.navigate("RestaurantMenu", { restaurantId: slide.linkValue });
    }
  }, [navigation]);

  if (loading) {
    return (
      <View className="w-full h-60 items-center justify-center bg-slate-100">
        <ActivityIndicator size="small" color="#818cf8" />
      </View>
    );
  }

  if (total === 0) {
    return (
      <View className="w-full h-60 bg-gradient-to-br from-indigo-100 to-indigo-200 items-center justify-center">
        <Text className="text-xl font-black text-indigo-400">DODAGO</Text>
        <Text className="text-xs font-semibold text-indigo-400 mt-1">
          Affordable food delivery
        </Text>
      </View>
    );
  }

  return (
    <View className="relative w-full h-60 overflow-hidden bg-slate-100">
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
        {promotions.map((slide, i) => (
          <TouchableOpacity
            key={slide.id}
            activeOpacity={0.95}
            onPress={() => handlePress(slide)}
            style={{ width: SCREEN_WIDTH, height: 240 }}
            accessibilityLabel={slide.title || slide.subtitle || "Promotion"}
          >
            <OptimizedImage
              source={{ uri: slide.imageUrl }}
              style={{ width: SCREEN_WIDTH, height: 240 }}
              resizeMode="cover"
            />
            <View style={styles.slideOverlay} />
            {slide.title ? (
              <Text className="absolute bottom-3 left-3 text-sm font-black text-white">
                {slide.title}
              </Text>
            ) : null}
            {slide.subtitle ? (
              <View className="absolute bottom-3 right-3 rounded-full bg-indigo-600 px-3 py-1 shadow">
                <Text className="text-[11px] font-extrabold text-white">
                  {slide.subtitle}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {total > 1 && (
        <View className="absolute bottom-2 inset-x-0 flex-row justify-center items-center gap-1.5 z-10">
          {promotions.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goTo(i)}
              className={`h-1.5 rounded-full ${
                i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
              accessibilityLabel={`Go to slide ${i + 1}`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default React.memo(DishPromoCarousel);

const styles = StyleSheet.create({
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.24)",
  },
});
