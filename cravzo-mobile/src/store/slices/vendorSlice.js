import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";

export const fetchVendorOrders = createAsyncThunk(
  "vendor/fetchOrders",
  async (params) => {
    return await apiRequest("/api/orders/vendor", { params });
  }
);

export const fetchMyRestaurant = createAsyncThunk(
  "vendor/fetchMyRestaurant",
  async () => {
    return await apiRequest("/api/vendor/restaurant");
  }
);

const vendorSlice = createSlice({
  name: "vendor",
  initialState: {
    orders: [],
    restaurant: null,
    menuItems: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      })
      .addCase(fetchMyRestaurant.fulfilled, (state, action) => {
        state.restaurant = action.payload;
      });
  },
});

export default vendorSlice.reducer;
