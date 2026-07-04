export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;

export const API_ENDPOINTS = {
  auth: {
    login: `${API_PREFIX}/auth/login`,
    signup: `${API_PREFIX}/auth/signup`,
    sendOtp: `${API_PREFIX}/auth/send-otp`,
    verifyOtp: `${API_PREFIX}/auth/verify-otp`,
    forgotPassword: `${API_PREFIX}/auth/forgot-password`,
    resetPassword: `${API_PREFIX}/auth/reset-password`,
    me: `${API_PREFIX}/auth/me`,
    logout: `${API_PREFIX}/auth/logout`,
  },
  user: {
    profile: `${API_PREFIX}/users/profile`,
    uploadImage: `${API_PREFIX}/users/uploads/image`,
    addresses: `${API_PREFIX}/users/addresses`,
    addressById: (id) => `${API_PREFIX}/users/addresses/${id}`,
  },
  payments: {
    razorpayConfig: `${API_PREFIX}/payments/razorpay/config`,
    razorpayOrder: `${API_PREFIX}/payments/razorpay/order`,
    razorpayVerify: `${API_PREFIX}/payments/razorpay/verify`,
    codOrder: `${API_PREFIX}/payments/cod/order`,
  },
  favorites: {
    list: `${API_PREFIX}/favorites`,
    create: `${API_PREFIX}/favorites`,
    remove: (id) => `${API_PREFIX}/favorites/${id}`,
  },
  reviews: {
    mine: `${API_PREFIX}/reviews/my`,
    byRestaurant: (id) => `${API_PREFIX}/reviews/restaurant/${id}`,
    save: `${API_PREFIX}/reviews`,
    remove: (id) => `${API_PREFIX}/reviews/${id}`,
  },
  admin: {
    overview: `${API_PREFIX}/admin/overview`,
    users: `${API_PREFIX}/admin/users`,
    user: (id) => `${API_PREFIX}/admin/users/${id}`,
    userOrders: (id) => `${API_PREFIX}/admin/users/${id}/orders`,
    restaurants: `${API_PREFIX}/admin/restaurants`,
    pendingVendors: `${API_PREFIX}/admin/vendors/pending`,
    approveVendor: (id) => `${API_PREFIX}/admin/vendors/${id}/approve`,
    pendingRiders: `${API_PREFIX}/admin/riders/pending`,
    approveRider: (id) => `${API_PREFIX}/admin/riders/${id}/approve`,
  },
  restaurant: {
    list: `${API_PREFIX}/restaurants`,
    nearby: (lat, lng) => `${API_PREFIX}/restaurants/nearby?lat=${lat}&lng=${lng}`,
    byId: (id) => `${API_PREFIX}/restaurants/${id}`,
  },
  public: {
    home: `${API_PREFIX}/public/home`,
    featuredRestaurants: `${API_PREFIX}/public/featured-restaurants`,
    ads: `${API_PREFIX}/public/ads`,
  },
};

export const ORDER_SOCKET_EVENTS = {
  STATUS_UPDATED: "order:status-updated",
  NEW_ORDER: "order:new",
  ORDER_CREATED: "order:created",
};
