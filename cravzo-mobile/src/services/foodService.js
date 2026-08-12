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
  price: Number(item.price || 0),
});

const getLowestSizePrice = (sizes) => {
  if (!Array.isArray(sizes)) return null;
  const prices = sizes.map((size) => Number(size?.price)).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : null;
};

const getDishPrice = (item = {}) => {
  const basePrice = Number(item.price);
  const sizePrice = getLowestSizePrice(item.sizes);
  if (Number.isFinite(basePrice) && basePrice > 0 && sizePrice) return Math.min(basePrice, sizePrice);
  if (Number.isFinite(basePrice) && basePrice > 0) return basePrice;
  return sizePrice;
};

const getStartingDishPrice = (restaurant = {}) => {
  const menuItems = [
    ...(Array.isArray(restaurant.menuItems) ? restaurant.menuItems : []),
    ...(Array.isArray(restaurant.menuPreview) ? restaurant.menuPreview : []),
    ...(Array.isArray(restaurant.matchingDishes) ? restaurant.matchingDishes : []),
  ];
  const prices = menuItems.map(getDishPrice).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : null;
};

const formatDistanceLabel = (distance) => {
  const distanceKm = Number(distance);
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return "";
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;
};

const normalizeRestaurant = (restaurant = {}) => {
  const menuItems = Array.isArray(restaurant.menuItems) ? restaurant.menuItems.map(normalizeMenuItem) : restaurant.menuItems;
  const menuPreview = Array.isArray(restaurant.menuPreview) ? restaurant.menuPreview.map(normalizeMenuItem) : restaurant.menuPreview;
  const reviewCountValue = restaurant.reviewCount ?? restaurant.totalReviews ?? restaurant.reviewsCount;
  const hasReviewCount = reviewCountValue !== undefined && reviewCountValue !== null;
  const reviewCount = Number(reviewCountValue || 0);
  const rawRating = restaurant.averageRating ?? restaurant.rating;
  const hasRating = hasReviewCount ? reviewCount > 0 : Number(rawRating || 0) > 0;
  const averageRating = hasRating ? Number(Number(rawRating || 0).toFixed(1)) : 0;
  const normalized = {
    ...restaurant,
    id: restaurant.id || restaurant._id,
    imageUrl: restaurant.imageUrl || restaurant.image || restaurant.logoUrl || restaurant.coverImage,
    location: restaurant.location || restaurant.address || restaurant.area,
    cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(", ") : restaurant.cuisine,
    menuItems,
    menuPreview,
    reviewCount,
    averageRating,
    rating: averageRating,
    hasRating: hasRating && averageRating > 0,
    distanceLabel: restaurant.distanceLabel || formatDistanceLabel(restaurant.distance ?? restaurant.distanceKm),
  };

  return {
    ...normalized,
    startingDishPrice: getStartingDishPrice(normalized),
  };
};

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

export const getNearbyRestaurants = async (lat, lng, radiusKm = 8) => {
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



