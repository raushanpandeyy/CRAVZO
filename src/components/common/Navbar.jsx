import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, MapPin, MessageCircle, ShoppingCart, User as UserIcon } from "lucide-react";

import {cravzologo} from "../../assets/images/logos.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useChatNotifications } from "../../hooks/useChatNotifications.js";
import { getAddresses } from "../../services/addressService.js";
import { deleteCookie, getCookie, setCookie } from "../../utils/cookies.js";

const DELIVERY_ADDRESS_COOKIE = "cravzoDeliveryAddress";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, getChatPath, markAllRead, markNotificationRead } = useChatNotifications(user);

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
        deleteCookie(DELIVERY_ADDRESS_COOKIE);
        setIsLoadingAddress(false);
        return;
      }

      const cachedAddress = getCookie(DELIVERY_ADDRESS_COOKIE);
      if (cachedAddress) {
        // Fix 3: Cookie is fresh — skip API call, show cached address immediately.
        // API is only hit when the cookie is absent (first load or after 30-day expiry)
        // or when the "addressesChange" event fires (user updates address in settings).
        setAddress(cachedAddress);
        setIsLoadingAddress(false);
        return;
      }

      setIsLoadingAddress(true);

      try {
        const savedAddresses = await getAddresses();
        const defaultAddress = savedAddresses.find((entry) => entry.isDefault) || savedAddresses[0];
        const nextAddress = defaultAddress ? [defaultAddress.line1, defaultAddress.city].filter(Boolean).join(", ") : "";
        setAddress(nextAddress);
        if (nextAddress) {
          setCookie(DELIVERY_ADDRESS_COOKIE, nextAddress, { maxAgeDays: 30 });
        } else {
          deleteCookie(DELIVERY_ADDRESS_COOKIE);
        }
      } catch {
        setAddress("");
      } finally {
        setIsLoadingAddress(false);
      }
    };

    syncAddress();

    const handleAddressesChange = () => {
      // Invalidate cookie so syncAddress re-fetches fresh data from API
      deleteCookie(DELIVERY_ADDRESS_COOKIE);
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

  const openChatNotification = (notification) => {
    markNotificationRead(notification.id);
    setChatMenuOpen(false);
    setMobileMenuOpen(false);
    navigate(getChatPath(notification));
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

  const ChatNotificationButton = ({ compact = false }) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setChatMenuOpen((current) => !current);
          if (!chatMenuOpen) markAllRead();
        }}
        className={`relative flex items-center justify-center gap-2 rounded-full font-bold ${
          compact
            ? "h-10 w-10 bg-indigo-950 text-white shadow-md"
            : "bg-white px-5 py-2 text-indigo-900"
        }`}
        aria-label={`Chat notifications with ${unreadCount} unread`}
        aria-expanded={chatMenuOpen}
      >
        <MessageCircle className="h-5 w-5" />
        {!compact ? <span>Chat</span> : null}
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[11px] leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {chatMenuOpen ? (
        <div className="absolute right-0 top-12 z-[70] w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-950 shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-black">Chat notifications</p>
            <p className="text-xs text-slate-500">Tap any item to open that chat.</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openChatNotification(notification)}
                  className="flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{notification.title || "Chat message"}</span>
                    <span className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
                      {notification.subtitle || notification.text || "New message"}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No new chat notifications</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-transparent md:bg-indigo-900 text-slate-950 md:text-white font-sans">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-4 py-2 md:hidden">
        <button type="button" onClick={navigateToUserHome} className="shrink-0">
          <img src={cravzologo} alt="Cravzo Logo" className="h-9 w-9 rounded-xl object-cover" width={36} height={36} />
        </button>

        <button
          type="button"
          onClick={handleAddressClick}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800">
            <MapPin className="h-4 w-4" />
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

        {user ? (
          <ChatNotificationButton compact />
        ) : null}

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
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-950 text-white shadow-md"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-3 hidden md:flex md:flex-row md:justify-between items-center gap-3">
        <div onClick={navigateToUserHome} className="flex items-center gap-2 cursor-pointer">
          <img src={cravzologo} alt="Cravzo Logo" className="h-10 md:h-12 rounded-2xl" width={48} height={48} />
          <span className="hidden md:block text-2xl font-bold uppercase">CRAVZO</span>
        </div>

        <button
          type="button"
          onClick={handleAddressClick}
          className="relative w-full rounded-full bg-white text-left md:w-auto"
        >
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-900">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="w-full truncate pl-10 pr-4 py-2 text-sm text-indigo-900 md:w-[300px]">
            {displayAddress}
          </div>
        </button>

        <div className="hidden md:flex items-center gap-4">
          {user ? <ChatNotificationButton /> : null}

          {user?.accountType === "customer" || !user ? <CartButton /> : null}

          {!user && (
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white text-indigo-900 px-5 py-2 rounded-full flex items-center gap-2 font-bold"
              >
                Partner <ChevronDown className="h-4 w-4" />
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
