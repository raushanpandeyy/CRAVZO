// Base URL (from Vercel env)
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

//  API prefix (backend uses /api/v1 for versioned)
const BASE = "/api/v1";

//  Helper: query params
const withQuery = (path, params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
};




export const API_ENDPOINTS = {
  auth: {
    login: `${BASE}/auth/login`,
    signup: `${BASE}/auth/signup`,
    sendOtp: `${BASE}/auth/send-otp`,
    verifyOtp: `${BASE}/auth/verify-otp`,
    forgotPassword: `${BASE}/auth/forgot-password`,
    resetPassword: `${BASE}/auth/reset-password`,
    me: `${BASE}/auth/me`,
    logout: `${BASE}/auth/logout`,
  },

  user: {
    profile: `${BASE}/users/profile`,
    deleteAccount: `${BASE}/users/account`,
    uploadImage: `${BASE}/users/uploads/image`,
    addresses: `${BASE}/users/addresses`,
    addressById: (id) => `${BASE}/users/addresses/${id}`,
  },

  referrals: {
    me: `${BASE}/referrals/me`,
    apply: `${BASE}/referrals/apply`,
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
  },

  reviews: {
    mine: `${BASE}/reviews/my`,
    byRestaurant: (id) => `${BASE}/reviews/restaurant/${id}`,
    save: `${BASE}/reviews`,
    reply: (id) => `${BASE}/reviews/${id}/reply`,
    remove: (id) => `${BASE}/reviews/${id}`,
  },

  admin: {
    overview: (params) => withQuery(`${BASE}/admin/overview`, params),
    pricingSettings: `${BASE}/admin/pricing-settings`,
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
    initiateRefund: (orderId) => `${BASE}/admin/orders/${orderId}/refund/initiate`,
    reconcileRefund: (orderId) => `${BASE}/admin/orders/${orderId}/refund/reconcile`,
  },

restaurant: {
   list: `${BASE}/restaurants`,
   nearby: (lat, lng) =>
     `${BASE}/restaurants/nearby?lat=${lat}&lng=${lng}`,
   byId: (id) => `${BASE}/restaurants/${id}`,
 },

 public: {
    home: `${BASE}/public/home`,
    featuredRestaurants: `${BASE}/public/featured-restaurants`,
    ads: `${BASE}/public/ads`,
  },

};

