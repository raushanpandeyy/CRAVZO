import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

const CartButton = ({ cartCount, compact = false }) => {
  const navigate = useNavigate();

  const handleClick = () => navigate("/checkout");

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative flex items-center justify-center gap-2 rounded-full font-bold ${
        compact
          ? "h-10 w-10 bg-[#ff6b5f] text-white shadow-md shadow-rose-200"
          : "bg-white px-5 py-2 text-indigo-900"
      }`}
      aria-label={`Cart with ${cartCount} item${cartCount === 1 ? "" : "s"}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {!compact ? <span>Cart</span> : null}
      {cartCount > 0 ? (
        <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[11px] leading-4 text-white">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      ) : null}
    </button>
  );
};

export default CartButton;
