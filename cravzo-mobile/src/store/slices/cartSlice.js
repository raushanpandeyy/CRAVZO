import { createSlice } from "@reduxjs/toolkit";
import { storage } from "../../services/storage";

const loadCart = () => {
  try {
    const raw = storage.getString("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCart = (items) => {
  storage.set("cart", JSON.stringify(items));
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: loadCart(),
  },
  reducers: {
    addItem: (state, action) => {
      const existing = state.items.find(
        (item) =>
          item.menuItemId === action.payload.menuItemId &&
          item.restaurantId === action.payload.restaurantId
      );
      if (existing) {
        existing.quantity += action.payload.quantity || 1;
      } else {
        state.items.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      }
      saveCart(state.items);
    },
    updateQuantity: (state, action) => {
      const { menuItemId, restaurantId, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.menuItemId === menuItemId && i.restaurantId === restaurantId
      );
      if (item) {
        item.quantity = quantity;
      }
      saveCart(state.items);
    },
    removeItem: (state, action) => {
      const { menuItemId, restaurantId } = action.payload;
      state.items = state.items.filter(
        (i) => !(i.menuItemId === menuItemId && i.restaurantId === restaurantId)
      );
      saveCart(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      saveCart([]);
    },
  },
});

export const { addItem, updateQuantity, removeItem, clearCart } = cartSlice.actions;

export const selectCartItemCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export default cartSlice.reducer;
