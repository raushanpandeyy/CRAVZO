export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.dodago.shop";

export const API_ENDPOINTS = {
  auth: {
    login:          "/api/v1/auth/login",
    signup:         "/api/v1/auth/signup",
    sendOtp:        "/api/v1/auth/send-otp",
    verifyOtp:      "/api/v1/auth/verify-otp",
    me:             "/api/v1/auth/me",
    logout:         "/api/v1/auth/logout",
  },
  user: {
    profile: "/api/v1/users/profile",
    account: "/api/v1/users/account",
  },
  rider: {
    status:   "/api/v1/rider/status",
    location: "/api/v1/rider/location",
    earnings: "/api/v1/rider/earnings",
    stats:    "/api/v1/rider/stats",
  },
  orders: {
    rider:                "/api/v1/orders/rider",
    riderHistory:         "/api/v1/orders/rider/history",
    status:          (id) => `/api/v1/orders/${id}/status`,
    verifyDeliveryOtp:(id) => `/api/v1/orders/${id}/verify-delivery-otp`,
    tracking:        (id) => `/api/v1/orders/${id}/tracking`,
  },
  chat: {
    orderRoom: (id) => `/api/v1/chats/orders/${id}`,
    rooms:              "/api/v1/chats/rooms",
  },
  notifications: {
    fcmToken: "/api/v1/notifications/fcm-token",
  },
};
