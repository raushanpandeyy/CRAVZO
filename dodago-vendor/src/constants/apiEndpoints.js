import Constants from "expo-constants";

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl || "https://api.dodago.shop";

const BASE = "/api/v1";

export const API_ENDPOINTS = {
  auth: {
    login:          `${BASE}/auth/login`,
    signup:         `${BASE}/auth/signup`,
    sendOtp:        `${BASE}/auth/send-otp`,
    verifyOtp:      `${BASE}/auth/verify-otp`,
    forgotPassword: `${BASE}/auth/forgot-password`,
    resetPassword:  `${BASE}/auth/reset-password`,
    me:             `${BASE}/auth/me`,
    logout:         `${BASE}/auth/logout`,
  },
  vendor: {
    // GET  /restaurants/mine   → returns array of all vendor restaurants (with menuItems)
    myRestaurant:        `${BASE}/restaurants/mine`,
    myRestaurants:       `${BASE}/restaurants/mine`,
    // PUT  /restaurants/:id    → update restaurant profile (name, hours, isOpen, bankDetails…)
    saveRestaurant: (id) => `${BASE}/restaurants/${id}`,
    reports:             `${BASE}/analytics/vendor/reports`,
  },
  menuItems: {
    // POST /menu-items/                → create item  (body must include restaurantId)
    create:              `${BASE}/menu-items`,
    // PUT  /menu-items/:id             → update item
    byId:           (id) => `${BASE}/menu-items/${id}`,
    // GET  /menu-items/restaurant/:id  → list items for a restaurant (public)
    byRestaurant:   (id) => `${BASE}/menu-items/restaurant/${id}`,
  },
  orders: {
    vendor:               `${BASE}/orders/vendor`,
    vendorHistory:        `${BASE}/orders/vendor/history`,
    updateStatus:    (id) => `${BASE}/orders/${id}/status`,
  },
  platformMarkup:        `${BASE}/platform-markup`,
  chat: {
    support:              `${BASE}/chats/support`,
    orderVendorRoom: (id) => `${BASE}/chats/orders/${id}/vendor`,
    roomMessages:    (id) => `${BASE}/chats/rooms/${id}/messages`,
    roomImages:      (id) => `${BASE}/chats/rooms/${id}/images`,
  },
  uploads: {
    image: `${BASE}/users/uploads/image`,
  },
  reviews: {
    byRestaurant: (id) => `${BASE}/reviews/restaurant/${id}`,
    reply:        (id) => `${BASE}/reviews/${id}/reply`,
  },
};
