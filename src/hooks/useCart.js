import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dodagoCart";

const loadCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cartChange"));
};

const getPrice = (price) => {
  if (typeof price === "number") return price;
  return parseInt(price.toString().replace(/[^0-9]/g, ""), 10) || 0;
};

export default function useCart() {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    const handler = () => setCart(loadCart());
    window.addEventListener("cartChange", handler);
    return () => window.removeEventListener("cartChange", handler);
  }, []);

  const updateCart = useCallback((newCart) => {
    const safe = Array.isArray(newCart) ? newCart : [];
    setCart(safe);
    saveCart(safe);
  }, []);

  const addItem = useCallback((item) => {
    const cartKey = item.cartKey || item.id;
    setCart((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      const updated = existing
        ? prev.map((i) =>
            i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...prev, { ...item, cartKey, quantity: 1 }];
      saveCart(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((cartKey, delta) => {
    setCart((prev) => {
      const updated = prev
        .map((i) =>
          i.cartKey === cartKey
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i,
        )
        .filter((i) => i.quantity > 0);
      saveCart(updated);
      return updated;
    });
  }, []);

  const removeItem = useCallback((cartKey) => {
    setCart((prev) => {
      const updated = prev.filter((i) => i.cartKey !== cartKey);
      saveCart(updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    saveCart([]);
  }, []);

  const itemTotal = useMemo(
    () => cart.reduce((acc, i) => acc + getPrice(i.price) * i.quantity, 0),
    [cart],
  );

  const cartItemCount = useMemo(
    () => cart.reduce((total, i) => total + Number(i.quantity || 0), 0),
    [cart],
  );

  return {
    cart,
    updateCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemTotal,
    cartItemCount,
  };
}

export { getPrice, loadCart };
