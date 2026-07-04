import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const SWIPE_THRESHOLD = 50;
const INTERVAL_MS = 7000;
const INTERACTION_COOLDOWN = 10000;

const DishPromoCarousel = ({ promotions: propPromotions }) => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState(propPromotions || []);
  const [loading, setLoading] = useState(!propPromotions);
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, swiped: false });
  const lastInteractionRef = useRef(Date.now());

  useEffect(() => {
    if (propPromotions) {
      setPromotions(propPromotions);
      setLoading(false);
      return;
    }
    const fetchPromos = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${base}/api/promotions`, { credentials: "include" });
        const json = await res.json();
        setPromotions(json.data || []);
      } catch {
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, [propPromotions]);

  const total = promotions.length;

  const updateCurrentFromScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !container.children.length) return;
    const slideWidth = container.children[0].offsetWidth;
    if (!slideWidth) return;
    setCurrent(Math.min(Math.round(container.scrollLeft / slideWidth), total - 1));
  }, [total]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => updateCurrentFromScroll();
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [updateCurrentFromScroll]);

  useEffect(() => {
    if (total < 2) return;
    const tick = () => {
      if (Date.now() - lastInteractionRef.current < INTERACTION_COOLDOWN) return;
      const container = scrollRef.current;
      if (!container || !container.children.length) return;
      const slideWidth = container.children[0].offsetWidth;
      if (!slideWidth) return;
      const curIndex = Math.round(container.scrollLeft / slideWidth);
      if (curIndex >= total - 1) {
        container.scrollTo({ left: 0, behavior: "instant" });
        setCurrent(0);
      } else {
        container.scrollTo({ left: (curIndex + 1) * slideWidth, behavior: "smooth" });
        setCurrent(curIndex + 1);
      }
    };
    const timer = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [total]);

  const goTo = useCallback((index) => {
    const container = scrollRef.current;
    if (!container || !container.children.length) return;
    const slideWidth = container.children[0].offsetWidth;
    if (!slideWidth) return;
    lastInteractionRef.current = Date.now();
    container.scrollTo({ left: index * slideWidth, behavior: "smooth" });
    setCurrent(index);
  }, []);

  const onTouchStart = (e) => {
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.startY = e.touches[0].clientY;
    touchRef.current.swiped = false;
    lastInteractionRef.current = Date.now();
  };

  const onTouchEnd = (e) => {
    const diffX = e.changedTouches[0].clientX - touchRef.current.startX;
    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
      touchRef.current.swiped = true;
    }
    lastInteractionRef.current = Date.now();
  };

  const handleClick = (slide) => {
    if (touchRef.current.swiped) {
      touchRef.current.swiped = false;
      return;
    }
    if (slide.linkType === "dish" && slide.linkValue) {
      navigate(`/dish/${encodeURIComponent(slide.linkValue)}`);
    } else if (slide.linkType === "restaurant" && slide.linkValue) {
      navigate(`/restaurant/${slide.linkValue}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-100" style={{ height: "320px" }}>
        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div
        className="w-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center"
        style={{ height: "320px" }}
      >
        <div className="text-center">
          <p className="text-xl font-black text-indigo-400">DODAGO</p>
          <p className="text-xs font-semibold text-indigo-400 mt-1">Affordable food delivery</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-100"
      style={{ height: "320px" }}
      role="region"
      aria-label="Promotions"
    >
      <div
        ref={scrollRef}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {promotions.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => handleClick(slide)}
            className="relative w-full h-full shrink-0 snap-start focus:outline-none"
            style={{ scrollSnapAlign: "start", minWidth: "100%" }}
            aria-label={slide.title || slide.subtitle || "Promotion"}
          >
            <img
              src={slide.imageUrl}
              alt={slide.title || ""}
              className="w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              decoding="async"
              width={360}
              height={320}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {slide.title && (
              <span className="absolute bottom-3 left-3 text-sm font-black text-white drop-shadow-md">
                {slide.title}
              </span>
            )}
            {slide.subtitle && (
              <span className="absolute bottom-3 right-3 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-extrabold text-white shadow">
                {slide.subtitle}
              </span>
            )}
          </button>
        ))}
      </div>

      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {promotions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(DishPromoCarousel);
