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
    updateQuantity: (itemKey, quantity) =>
      dispatch(updateQuantity({ itemKey, quantity })),
    removeItem: (itemKey) => dispatch(removeItem({ itemKey })),
    clearCart: () => dispatch(clearCart()),
  };
};
