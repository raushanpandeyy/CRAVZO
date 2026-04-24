// Base URL (from Vercel env)
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// 🔥 API prefix (backend uses /api)
const BASE = "/api";

// 🔥 Helper: query params
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

<<<<<<< HEAD



=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
export const API_ENDPOINTS = {
  auth: {
    login: `${BASE}/auth/login`,
    signup: `${BASE}/auth/signup`,
    sendOtp: `${BASE}/auth/send-otp`,
    verifyOtp: `${BASE}/auth/verify-otp`,
<<<<<<< HEAD
    forgotPassword: `${BASE}/auth/forgot-password`,
    resetPassword: `${BASE}/auth/reset-password`,
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
    me: `${BASE}/auth/me`,
    logout: `${BASE}/auth/logout`,
  },

  user: {
    profile: `${BASE}/users/profile`,
    uploadImage: `${BASE}/users/uploads/image`,
    addresses: `${BASE}/users/addresses`,
    addressById: (id) => `${BASE}/users/addresses/${id}`,
  },

<<<<<<< HEAD
  payments: {
    razorpayConfig: `${BASE}/payments/razorpay/config`,
    razorpayOrder: `${BASE}/payments/razorpay/order`,
    razorpayVerify: `${BASE}/payments/razorpay/verify`,
    codOrder: `${BASE}/payments/cod/order`,
  },

=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  favorites: {
    list: `${BASE}/favorites`,
    create: `${BASE}/favorites`,
    remove: (id) => `${BASE}/favorites/${id}`,
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
    restaurants: (params) => withQuery(`${BASE}/admin/restaurants`, params),
    userStatus: (id) => `${BASE}/admin/users/${id}/status`,
    restaurantStatus: (id) => `${BASE}/admin/restaurants/${id}/status`,
    pendingVendors: `${BASE}/admin/vendors/pending`,
    approveVendor: (id) => `${BASE}/admin/vendors/${id}/approve`,
    pendingRiders: `${BASE}/admin/riders/pending`,
    approveRider: (id) => `${BASE}/admin/riders/${id}/approve`,
  },
<<<<<<< HEAD

 restaurant: {
  list: `${BASE}/restaurants`,
  nearby: (lat, lng) =>
    `${BASE}/restaurants/nearby?lat=${lat}&lng=${lng}`,
  byId: (id) => `${BASE}/restaurants/${id}`,
},


=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
};
