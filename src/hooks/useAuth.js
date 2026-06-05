/**
 * useAuth — singleton pattern.
 *
 * Problem: useAuth() was called in 7 components (App, Navbar, RestaurantPage,
 * Profile, PartnerMobileNav, AccessPending, etc.). Each call created its own
 * useEffect that fired loadCurrentUser() → /api/auth/me. Result: 7+ API calls
 * on every page load just for auth hydration.
 *
 * Fix: module-level singleton. The /api/auth/me call fires ONCE ever.
 * All useAuth() consumers share the same state and get instant updates
 * via a subscriber pattern — zero extra API calls on subsequent mounts.
 */

import { useEffect, useState } from "react";
import { getStoredUser, loadCurrentUser, logout as logoutRequest } from "../services/authService";

// ── Module-level singleton state ──────────────────────────────────────────────
let _user = getStoredUser();
let _isHydrating = true;
let _hydrated = false;
let _hydrating = false;
let _subscribers = new Set();

const notify = () => _subscribers.forEach((fn) => fn({ user: _user, isHydrating: _isHydrating }));

const hydrateOnce = async () => {
  if (_hydrated || _hydrating) return;
  _hydrating = true;

  try {
    const user = await loadCurrentUser();
    _user = user;
  } catch {
    _user = null;
  } finally {
    _isHydrating = false;
    _hydrated = true;
    _hydrating = false;
    notify();
  }
};

// Re-sync from localStorage when userChange event fires (login/logout/etc.)
if (typeof window !== "undefined") {
  window.addEventListener("userChange", () => {
    _user = getStoredUser();
    notify();
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const [state, setState] = useState({ user: _user, isHydrating: _isHydrating });

  useEffect(() => {
    // Subscribe to singleton updates
    const subscriber = (next) => setState(next);
    _subscribers.add(subscriber);

    // Trigger hydration only once across the whole app
    if (!_hydrated) {
      hydrateOnce();
    } else {
      // Already hydrated — push current state immediately
      setState({ user: _user, isHydrating: false });
    }

    return () => _subscribers.delete(subscriber);
  }, []);

  const logout = async () => {
    await logoutRequest();
    _user = null;
    _isHydrating = false;
    notify();
  };

  return {
    user: state.user,
    isHydrating: state.isHydrating,
    logout,
  };
}
