import { useDispatch, useSelector } from "react-redux";
import {
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  selectCartItemCount,
  selectCartTotal,
} from "../store/slices/cartSlice";

export const useCart = () => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const itemCount = useSelector(selectCartItemCount);
  const total = useSelector(selectCartTotal);

  return {
    items: cart.items,
    itemCount,
    total,
    addItem: (item) => dispatch(addItem(item)),
    updateQuantity: (menuItemId, restaurantId, quantity) =>
      dispatch(updateQuantity({ menuItemId, restaurantId, quantity })),
    removeItem: (menuItemId, restaurantId) =>
      dispatch(removeItem({ menuItemId, restaurantId })),
    clearCart: () => dispatch(clearCart()),
  };
};
