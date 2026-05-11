import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiChevronDown } from "react-icons/fi";
import { LogOut, ShoppingCart, User as UserIcon } from "lucide-react";

import {cravzologo} from "../../assets/images/logos.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getAddresses } from "../../services/addressService.js";

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

  const handleCartClick = () => {
    navigate("/checkout");
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate("/signin", { replace: true });
  };

  const CartButton = ({ compact = false }) => (
    <button
      type="button"
      onClick={handleCartClick}
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

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white text-slate-950 shadow-sm shadow-slate-200/80 md:bg-indigo-900 md:text-white md:shadow-md font-sans">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-4 py-2 md:hidden">
        <button type="button" onClick={navigateToUserHome} className="shrink-0">
          <img src={cravzologo} alt="Cravzo Logo" className="h-9 w-9 rounded-xl object-cover" />
        </button>

        <button
          type="button"
          onClick={handleAddressClick}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800">
            <FiMapPin />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Deliver to
            </span>
            <span className="block truncate text-sm font-extrabold leading-5 text-slate-950">
              {displayAddress}
            </span>
          </span>
        </button>

        {user?.accountType === "customer" ? (
          <CartButton compact />
        ) : !user ? (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="shrink-0 rounded-full bg-indigo-950 px-4 py-2.5 text-xs font-extrabold text-white shadow-md"
            aria-expanded={mobileMenuOpen}
          >
            Sign up
          </button>
        ) : null}
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-3 hidden md:flex md:flex-row md:justify-between items-center gap-3">
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
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-indigo-900"
              >
                <LogOut className="h-4 w-4" />
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

      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white p-3 text-slate-950 shadow-xl flex flex-col gap-3">
          {!user && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    navigate("/rider-signup");
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-bold text-indigo-950"
                >
                  Rider
                </button>
                <button
                  onClick={() => {
                    navigate("/vendor-signup");
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-bold text-indigo-950"
                >
                  Business
                </button>
              </div>
              <button
                onClick={() => {
                  navigate("/signin");
                  setMobileMenuOpen(false);
                }}
                className="rounded-xl bg-indigo-950 p-2.5 text-sm font-bold text-white"
              >
                Sign In
              </button>
            </>
          )}

          {user ? (
            <>
              <div onClick={navigateToUserHome} className="flex items-center gap-3 cursor-pointer">
                <UserIcon />
                <span className="font-bold">
                  {user.name ? `${user.name.split(" ")[0]} (${user.accountType})` : user.accountType}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-indigo-950 p-2.5 text-sm font-bold text-white"
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
