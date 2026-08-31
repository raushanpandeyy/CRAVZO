import { apiRequest, uploadRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

// ── Restaurant ──────────────────────────────────────────────────

/** Returns the first restaurant for this vendor (single-restaurant use case). */
export const getMyRestaurant = async () => {
  const res = await apiRequest(API_ENDPOINTS.vendor.myRestaurant);
  const list = Array.isArray(res.data) ? res.data : [];
  return list[0] || null;
};

/** Returns ALL restaurants managed by this vendor. */
export const getMyRestaurants = async () => {
  const res = await apiRequest(API_ENDPOINTS.vendor.myRestaurants);
  return Array.isArray(res.data) ? res.data : [];
};

/**
 * Save (update) a restaurant's profile.
 * Requires the restaurant ID — obtained from getMyRestaurant/getMyRestaurants.
 */
export const saveRestaurant = async (id, payload) => {
  const res = await apiRequest(API_ENDPOINTS.vendor.saveRestaurant(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
};

/**
 * Toggle restaurant open/closed status.
 * Uses the same PUT /restaurants/:id endpoint — just sends { isOpen }.
 */
export const updateAvailability = async (restaurantId, { isOpen }) => {
  const res = await apiRequest(
    API_ENDPOINTS.vendor.saveRestaurant(restaurantId),
    {
      method: "PUT",
      body: JSON.stringify({ isOpen }),
    }
  );
  return res.data;
};

// ── Menu items ───────────────────────────────────────────────────

export const getMenuItems = async (restaurantId) => {
  const res = await apiRequest(
    API_ENDPOINTS.menuItems.byRestaurant(restaurantId)
  );
  return Array.isArray(res.data) ? res.data : [];
};

export const createMenuItem = async (payload) => {
  const res = await apiRequest(API_ENDPOINTS.menuItems.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
};

export const updateMenuItem = async (id, payload) => {
  const res = await apiRequest(API_ENDPOINTS.menuItems.byId(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
};

export const deleteMenuItem = async (id) => {
  const res = await apiRequest(API_ENDPOINTS.menuItems.byId(id), {
    method: "DELETE",
  });
  return res.data;
};

// ── Image upload ─────────────────────────────────────────────────

export const uploadImage = async (localUri) => {
  const filename = localUri.split("/").pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  const formData = new FormData();
  formData.append("image", { uri: localUri, name: filename, type });

  const res = await uploadRequest(API_ENDPOINTS.uploads.image, formData);
  return res.data?.url || res.data?.imageUrl || res.url;
};

// ── Reports ──────────────────────────────────────────────────────

export const getReports = async (range = "daily") => {
  const res = await apiRequest(`${API_ENDPOINTS.vendor.reports}?range=${range}`);
  return res.data;
};

// ── Reviews ──────────────────────────────────────────────────────

export const getReviews = async (restaurantId) => {
  const res = await apiRequest(API_ENDPOINTS.reviews.byRestaurant(restaurantId));
  return Array.isArray(res.data) ? res.data : [];
};

export const replyToReview = async (reviewId, reply) => {
  const res = await apiRequest(API_ENDPOINTS.reviews.reply(reviewId), {
    method: "POST",
    body: JSON.stringify({ reply }),
  });
  return res.data;
};

// ── Chat ─────────────────────────────────────────────────────────

/** Get or create the vendor-customer chat room for an order. */
export const getOrderChatRoom = async (orderId) => {
  const res = await apiRequest(
    API_ENDPOINTS.chat.orderVendorRoom(orderId)
  );
  return res.data;
};

/** Get or create vendor's support room with admin. */
export const getSupportRoom = async () => {
  const res = await apiRequest(API_ENDPOINTS.chat.support);
  return res.data;
};

/** Fetch messages for a chat room. */
export const getChatMessages = async (roomId, cursor) => {
  const url = cursor
    ? `${API_ENDPOINTS.chat.roomMessages(roomId)}?cursor=${cursor}`
    : API_ENDPOINTS.chat.roomMessages(roomId);
  const res = await apiRequest(url);
  return res.data;
};

/** Send a text message to a chat room. */
export const sendChatMessage = async (roomId, text) => {
  const res = await apiRequest(API_ENDPOINTS.chat.roomMessages(roomId), {
    method: "POST",
    body: JSON.stringify({ content: text }),
  });
  return res.data;
};
