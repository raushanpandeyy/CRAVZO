import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { ShoppingCart, User as UserIcon } from "lucide-react";

import cravzologo from "../../assets/logos/cravzologo.png";
import { useAuth } from "../../hooks/useAuth";
import { getAddresses } from "../../services/addressService";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const syncCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cravzoCart") || "[]");
      const count = Array.isArray(cart)
        ? cart.reduce((total, item) => total + Number(item.quantity || 0), 0)
        : 0;
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    syncCartCount();

    const handleCartChange = () => syncCartCount();

    window.addEventListener("storage", handleCartChange);
    window.addEventListener("cartChange", handleCartChange);

    return () => {
      window.removeEventListener("storage", handleCartChange);
      window.removeEventListener("cartChange", handleCartChange);
    };
  }, []);

  useEffect(() => {
    const syncAddress = async () => {
      if (!user?.isLoggedIn || user.accountType !== "customer") {
        setAddress("");
        setIsLoadingAddress(false);
        return;
      }

      setIsLoadingAddress(true);

      try {
        const savedAddresses = await getAddresses();
        const defaultAddress = savedAddresses.find((entry) => entry.isDefault) || savedAddresses[0];
        setAddress(defaultAddress ? [defaultAddress.line1, defaultAddress.city].filter(Boolean).join(", ") : "");
      } catch {
        setAddress("");
      } finally {
        setIsLoadingAddress(false);
      }
    };

    syncAddress();

    const handleAddressesChange = () => {
      syncAddress();
    };

    window.addEventListener("addressesChange", handleAddressesChange);

    return () => {
      window.removeEventListener("addressesChange", handleAddressesChange);
    };
  }, [user]);

  const handleAddressClick = () => {
    if (user?.accountType === "customer") {
      navigate("/account/addresses");
      return;
    }

    if (!user) {
      navigate("/signin");
      return;
    }

    navigateToUserHome();
  };

  const addressPlaceholder = user?.accountType === "customer" ? "Add your delivery address" : "Location";

  const displayAddress = isLoadingAddress ? "Loading address..." : address || addressPlaceholder;

  const navigateToUserHome = () => {
    if (!user) {
      navigate("/");
      setAddress("");
      return;
    }

    if (user.accountType === "rider") {
      navigate("/rider-dashboard");
    } else if (user.accountType === "vendor") {
      navigate("/vendor-dashboard");
    } else if (user.accountType === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleCartClick = () => {
    navigate("/checkout");
    setMobileMenuOpen(false);
  };

  const CartButton = ({ compact = false }) => (
    <button
      type="button"
      onClick={handleCartClick}
      className={`relative flex items-center justify-center gap-2 rounded-full bg-white font-bold text-indigo-900 ${
        compact ? "h-10 w-10" : "px-5 py-2"
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

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-indigo-900 text-white shadow-md font-sans">
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex flex-col md:flex-row md:justify-between items-center gap-3">
        <div onClick={navigateToUserHome} className="flex items-center gap-2 cursor-pointer">
          <img src={cravzologo} alt="Cravzo Logo" className="h-10 md:h-12 rounded-2xl" />
          <span className="hidden md:block text-2xl font-bold uppercase">CRAVZO</span>
        </div>

        <button
          type="button"
          onClick={handleAddressClick}
          className="relative w-full rounded-full bg-white text-left md:w-auto"
        >
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-900">
            <FiMapPin />
          </span>
          <div className="w-full truncate pl-10 pr-4 py-2 text-sm text-indigo-900 md:w-[300px]">
            {displayAddress}
          </div>
        </button>

        <div className="hidden md:flex items-center gap-4">
          {user?.accountType === "customer" || !user ? <CartButton /> : null}

          {!user && (
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white text-indigo-900 px-5 py-2 rounded-full flex items-center gap-2 font-bold"
              >
                Partner <FiChevronDown />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-indigo-900 rounded-xl shadow-xl">
                  <button
                    onClick={() => {
                      navigate("/rider-signup");
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-3 hover:bg-gray-100"
                  >
                    Rider Partner
                  </button>
                  <button
                    onClick={() => {
                      navigate("/vendor-signup");
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-3 hover:bg-gray-100"
                  >
                    Business Partner
                  </button>
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3 ml-2 border-l pl-4">
              <div onClick={navigateToUserHome} className="flex items-center gap-2 cursor-pointer">
                <UserIcon className="w-6 h-6" />
                <span className="font-bold">
                  {user.name ? `${user.name.split(" ")[0]} (${user.accountType})` : user.accountType}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="bg-red-500 px-4 py-2 rounded-full text-xs font-bold"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/signin")}
              className="bg-black text-white px-6 py-2 rounded-full font-bold"
            >
              Sign In
            </button>
          )}
        </div>

        <div className="absolute right-14 top-4 md:hidden">
          {user?.accountType === "customer" || !user ? <CartButton compact /> : null}
        </div>

        <div className="absolute right-4 top-4 md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-900 p-6 flex flex-col gap-6">
          {!user && (
            <>
              <p className="text-xs text-indigo-300">Join as Partner</p>
              <button onClick={() => navigate("/rider-signup")} className="bg-white text-indigo-900 p-3 rounded-xl">
                Rider
              </button>
              <button onClick={() => navigate("/vendor-signup")} className="bg-white text-indigo-900 p-3 rounded-xl">
                Vendor
              </button>
            </>
          )}

          {user ? (
            <>
              {user.accountType === "customer" ? (
                <button onClick={handleCartClick} className="flex items-center justify-center gap-2 rounded-xl bg-white p-3 font-bold text-indigo-900">
                  <ShoppingCart className="h-5 w-5" />
                  Cart {cartCount > 0 ? `(${cartCount})` : ""}
                </button>
              ) : null}

              <div onClick={navigateToUserHome} className="flex items-center gap-3 cursor-pointer">
                <UserIcon />
                <span className="font-bold">
                  {user.name ? `${user.name.split(" ")[0]} (${user.accountType})` : user.accountType}
                </span>
              </div>

              <button onClick={handleLogout} className="bg-red-600 p-3 rounded-xl">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={handleCartClick} className="flex items-center justify-center gap-2 rounded-xl bg-white p-3 font-bold text-indigo-900">
                <ShoppingCart className="h-5 w-5" />
                Cart {cartCount > 0 ? `(${cartCount})` : ""}
              </button>
              <button onClick={() => navigate("/signin")} className="bg-black p-3 rounded-xl">
                Sign In
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
