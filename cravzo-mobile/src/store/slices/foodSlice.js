import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";

export const fetchFeaturedRestaurants = createAsyncThunk(
  "food/fetchFeatured",
  async () => {
    return await apiRequest(API_ENDPOINTS.public.featuredRestaurants);
  }
);

export const fetchRestaurants = createAsyncThunk(
  "food/fetchRestaurants",
  async (params) => {
    return await apiRequest(API_ENDPOINTS.restaurant.list, { params });
  }
);

export const fetchRestaurantById = createAsyncThunk(
  "food/fetchRestaurantById",
  async (id) => {
    return await apiRequest(API_ENDPOINTS.restaurant.byId(id));
  }
);

export const fetchMenuItems = createAsyncThunk(
  "food/fetchMenuItems",
  async (restaurantId) => {
    return await apiRequest(API_ENDPOINTS.restaurant.menuItems(restaurantId));
  }
);

export const fetchAds = createAsyncThunk("food/fetchAds", async () => {
  return await apiRequest(API_ENDPOINTS.public.ads);
});

const foodSlice = createSlice({
  name: "food",
  initialState: {
    featured: [],
    restaurants: [],
    currentRestaurant: null,
    menuItems: [],
    ads: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeaturedRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedRestaurants.fulfilled, (state, action) => {
        state.featured = action.payload;
        state.loading = false;
      })
      .addCase(fetchFeaturedRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.restaurants = action.payload;
      })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.currentRestaurant = action.payload;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.menuItems = action.payload;
      })
      .addCase(fetchAds.fulfilled, (state, action) => {
        state.ads = action.payload;
      });
  },
});

export default foodSlice.reducer;
