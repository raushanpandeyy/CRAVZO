export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";

const BASE = "/api";

const withQuery = (path, params = {}) => {
  const entries = Object.entries(params).filter(
    ([_, v]) => v !== undefined && v !== null && v !== ""
  );
  if (!entries.length) return path;
  const qs = entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return `${path}?${qs}`;
};

export const API_ENDPOINTS = {
  auth: {
    login: `${BASE}/auth/login`,
    signup: `${BASE}/auth/signup`,
    phoneSignup: `${BASE}/auth/phone-signup`,
    verifyPhoneOtp: `${BASE}/auth/verify-phone-otp`,
    sendOtp: `${BASE}/auth/send-otp`,
    verifyOtp: `${BASE}/auth/verify-otp`,
    forgotPassword: `${BASE}/auth/forgot-password`,
    resetPassword: `${BASE}/auth/reset-password`,
    me: `${BASE}/auth/me`,
    logout: `${BASE}/auth/logout`,
  },
  user: {
    profile: `${BASE}/users/profile`,
    uploadImage: `${BASE}/users/uploads/image`,
    addresses: `${BASE}/users/addresses`,
    addressById: (id) => `${BASE}/users/addresses/${id}`,
  },
  payments: {
    razorpayConfig: `${BASE}/payments/razorpay/config`,
    razorpayOrder: `${BASE}/payments/razorpay/order`,
    razorpayVerify: `${BASE}/payments/razorpay/verify`,
    codOrder: `${BASE}/payments/cod/order`,
  },
  favorites: {
    list: `${BASE}/favorites`,
    create: `${BASE}/favorites`,
    remove: (id) => `${BASE}/favorites/${id}`,
    check: (restaurantId) => `${BASE}/favorites/check?restaurantId=${restaurantId}`,
  },
  reviews: {
    mine: `${BASE}/reviews/my`,
    byRestaurant: (id) => `${BASE}/reviews/restaurant/${id}`,
    save: `${BASE}/reviews`,
    remove: (id) => `${BASE}/reviews/${id}`,
  },
  admin: {
    overview: (params) => withQuery(`${BASE}/admin/overview`, params),
    supportUserSearch: (query) =>
      `${BASE}/admin/support/user-search?query=${encodeURIComponent(query)}`,
    users: (params) => withQuery(`${BASE}/admin/users`, params),
    user: (id) => `${BASE}/admin/users/${id}`,
    userOrders: (id) => `${BASE}/admin/users/${id}/orders`,
    restaurants: (params) => withQuery(`${BASE}/admin/restaurants`, params),
    createRestaurant: `${BASE}/admin/restaurants`,
    userStatus: (id) => `${BASE}/admin/users/${id}/status`,
    restaurantStatus: (id) => `${BASE}/admin/restaurants/${id}/status`,
    pendingVendors: `${BASE}/admin/vendors/pending`,
    approveVendor: (id) => `${BASE}/admin/vendors/${id}/approve`,
    pendingRiders: `${BASE}/admin/riders/pending`,
    approveRider: (id) => `${BASE}/admin/riders/${id}/approve`,
  },
  restaurant: {
    list: `${BASE}/restaurants`,
    nearby: (lat, lng) =>
      `${BASE}/restaurants/nearby?lat=${lat}&lng=${lng}`,
    byId: (id) => `${BASE}/restaurants/${id}`,
    menuItems: (restaurantId) => `${BASE}/menu-items/restaurant/${restaurantId}`,
  },
  public: {
    home: `${BASE}/public/home`,
    featuredRestaurants: `${BASE}/public/featured-restaurants`,
    ads: `${BASE}/public/ads`,
  },
};
