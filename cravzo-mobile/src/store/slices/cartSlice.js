import { createSlice } from "@reduxjs/toolkit";
import { storage } from "../../services/storage";

const migrateItem = (item) => {
  if (item.itemKey) return item;
  const sideDishKey = (item.selectedSideDishes || [])
    .map((s) => s.name)
    .sort()
    .join(",");
  return {
    ...item,
    itemKey: `${item.menuItemId}|${item.restaurantId}|${item.size || ""}|${sideDishKey}`,
    selectedSideDishes: item.selectedSideDishes || [],
    notes: item.notes || "",
  };
};

const loadCart = () => {
  try {
    const raw = storage.getString("cart");
    const items = raw ? JSON.parse(raw) : [];
    return items.map(migrateItem);
  } catch {
    return [];
  }
};

const saveCart = (items) => {
  storage.set("cart", JSON.stringify(items));
};

const makeItemKey = (payload) => {
  const sideDishKey = (payload.selectedSideDishes || [])
    .map((s) => s.name)
    .sort()
    .join(",");
  return `${payload.menuItemId}|${payload.restaurantId}|${payload.size || ""}|${sideDishKey}`;
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: loadCart(),
  },
  reducers: {
    addItem: (state, action) => {
      const payload = action.payload;
      const itemKey = makeItemKey(payload);
      const existing = state.items.find((item) => item.itemKey === itemKey);
      if (existing) {
        existing.quantity += payload.quantity || 1;
      } else {
        state.items.push({
          ...payload,
          itemKey,
          quantity: payload.quantity || 1,
          selectedSideDishes: payload.selectedSideDishes || [],
          notes: payload.notes || "",
        });
      }
      saveCart(state.items);
    },
    updateQuantity: (state, action) => {
      const { itemKey, quantity } = action.payload;
      const item = state.items.find((i) => i.itemKey === itemKey);
      if (item) {
        item.quantity = quantity;
      }
      saveCart(state.items);
    },
    removeItem: (state, action) => {
      const { itemKey } = action.payload;
      state.items = state.items.filter((i) => i.itemKey !== itemKey);
      saveCart(state.items);
    },
    updateItemNotes: (state, action) => {
      const { itemKey, notes } = action.payload;
      const item = state.items.find((i) => i.itemKey === itemKey);
      if (item) {
        item.notes = notes;
      }
      saveCart(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      saveCart([]);
    },
  },
});

export const { addItem, updateQuantity, removeItem, updateItemNotes, clearCart } = cartSlice.actions;

export const selectCartItemCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => {
    const baseTotal = item.price * item.quantity;
    const sideTotal =
      (item.selectedSideDishes || []).reduce((s, sd) => s + Number(sd.price), 0) * item.quantity;
    return sum + baseTotal + sideTotal;
  }, 0);

export default cartSlice.reducer;
