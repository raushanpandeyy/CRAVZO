export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";

export const assertProductionApiConfiguration = () => {
  const invalid = !API_BASE_URL || !/^https:\/\//i.test(API_BASE_URL) || /localhost|127\.0\.0\.1/i.test(API_BASE_URL);
  if (!__DEV__ && invalid) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must be a production HTTPS URL");
  }
};

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
    account: `${BASE}/users/account`,
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
  restaurant: {
    list: `${BASE}/restaurants`,
    nearby: (lat, lng, radius) =>
      `${BASE}/restaurants/nearby?lat=${lat}&lng=${lng}${radius ? `&radius=${radius}` : ""}`,
    byId: (id) => `${BASE}/restaurants/${id}`,
    menuItems: (restaurantId) => `${BASE}/menu-items/restaurant/${restaurantId}`,
  },
  public: {
    config: `${BASE}/public/config`,
    home: `${BASE}/public/home`,
    featuredRestaurants: `${BASE}/public/featured-restaurants`,
    ads: `${BASE}/public/ads`,
    locationLeads: `${BASE}/public/location-leads`,
  },
coupons: {
    validate: `${BASE}/coupons/validate`,
  },
  referrals: {
    me: `${BASE}/referrals/me`,
    apply: `${BASE}/referrals/apply`,
  },
};







