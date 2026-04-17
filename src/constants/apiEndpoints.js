export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

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

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
    sendOtp: "/auth/send-otp",
    verifyOtp: "/auth/verify-otp",
    me: "/auth/me",
    logout: "/auth/logout",
  },

  user: {
    profile: "/users/profile",
    uploadImage: "/users/uploads/image",
    addresses: "/users/addresses",
    addressById: (id) => `/users/addresses/${id}`,
  },

  favorites: {
    list: "/favorites",
    create: "/favorites",
    remove: (id) => `/favorites/${id}`,
  },

  reviews: {
    mine: "/reviews/my",
    byRestaurant: (id) => `/reviews/restaurant/${id}`,
    save: "/reviews",
    remove: (id) => `/reviews/${id}`,
  },

  admin: {
    overview: (params) => withQuery("/admin/overview", params),
    supportUserSearch: (query) =>
      `/admin/support/user-search?query=${encodeURIComponent(query)}`,
    users: (params) => withQuery("/admin/users", params),
    restaurants: (params) => withQuery("/admin/restaurants", params),
    userStatus: (id) => `/admin/users/${id}/status`,
    restaurantStatus: (id) => `/admin/restaurants/${id}/status`,
    pendingVendors: "/admin/vendors/pending",
    approveVendor: (id) => `/admin/vendors/${id}/approve`,
    pendingRiders: "/admin/riders/pending",
    approveRider: (id) => `/admin/riders/${id}/approve`,
  },
};
