import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

const getPayload = (response) => {
  const payload = response?.data ?? response;
  return payload?.data ?? payload;
};

const getList = (response, keys = []) => {
  const payload = getPayload(response);
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    const value = payload?.[key] ?? payload?.data?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
};

const normalizeMenuItem = (item = {}) => ({
  ...item,
  id: item.id || item._id,
  restaurantId: item.restaurantId || item.restaurant || item.restaurant_id,
  imageUrl: item.imageUrl || item.image || item.photoUrl,
});

const normalizeRestaurant = (restaurant = {}) => ({
  ...restaurant,
  id: restaurant.id || restaurant._id,
  imageUrl: restaurant.imageUrl || restaurant.image || restaurant.logoUrl || restaurant.coverImage,
  location: restaurant.location || restaurant.address || restaurant.area,
  cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(", ") : restaurant.cuisine,
  menuItems: Array.isArray(restaurant.menuItems) ? restaurant.menuItems.map(normalizeMenuItem) : restaurant.menuItems,
  menuPreview: Array.isArray(restaurant.menuPreview) ? restaurant.menuPreview.map(normalizeMenuItem) : restaurant.menuPreview,
});

export const listRestaurants = async (params = {}) => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const path = query ? `${API_ENDPOINTS.restaurant.list}?${query}` : API_ENDPOINTS.restaurant.list;
  const response = await apiRequest(path);
  return getList(response, ["restaurants", "items", "results"]).map(normalizeRestaurant);
};

export const getRestaurantById = async (id) => {
  const response = await apiRequest(API_ENDPOINTS.restaurant.byId(id));
  const payload = getPayload(response);
  return normalizeRestaurant(payload?.restaurant || payload?.item || payload);
};

export const getNearbyRestaurants = async (lat, lng, radiusKm = 5) => {
  const response = await apiRequest(API_ENDPOINTS.restaurant.nearby(lat, lng, radiusKm));
  return getList(response, ["restaurants", "items", "results"]).map(normalizeRestaurant);
};

export const listMenuItems = async (restaurantId) => {
  const response = await apiRequest(API_ENDPOINTS.restaurant.menuItems(restaurantId));
  return getList(response, ["items", "menuItems", "menus", "menu"]).map(normalizeMenuItem);
};

export const searchRestaurantsAndDishes = async (query, options = {}) => {
  const params = new URLSearchParams({ q: query });
  if (options.lat) params.append("lat", options.lat);
  if (options.lng) params.append("lng", options.lng);
  if (options.radius) params.append("radius", options.radius);
  const response = await apiRequest(`${API_ENDPOINTS.restaurant.list}/search?${params}`);
  const payload = getPayload(response) || {};
  return {
    restaurants: getList({ data: payload }, ["restaurants"]).map(normalizeRestaurant),
    dishes: getList({ data: payload }, ["dishes", "items"]).map(normalizeMenuItem),
  };
};


