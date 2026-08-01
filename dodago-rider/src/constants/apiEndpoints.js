export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.dodago.shop";

export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    me: "/api/auth/me",
    logout: "/api/auth/logout",
  },
  user: {
    profile: "/api/users/profile",
    account: "/api/users/account",
  },
  rider: {
    status: "/api/rider/status",
    location: "/api/rider/location",
    earnings: "/api/rider/earnings",
    stats: "/api/rider/stats",
  },
  orders: {
    rider: "/api/orders/rider",
    status: (id) => `/api/orders/${id}/status`,
    verifyDeliveryOtp: (id) => `/api/v1/orders/${id}/verify-delivery-otp`,
    tracking: (id) => `/api/orders/${id}/tracking`,
  },
  chat: {
    orderRoom: (id) => `/api/chat/order/${id}`,
    rooms: "/api/chat/rooms",
  },
};

