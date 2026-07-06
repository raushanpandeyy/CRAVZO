import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loadCurrentUser, logout as logoutApi } from "../../services/authService";

export const fetchUser = createAsyncThunk("user/fetchUser", async () => {
  return await loadCurrentUser();
});

export const logoutUser = createAsyncThunk("user/logoutUser", async () => {
  await logoutApi();
});

const userSlice = createSlice({
  name: "user",
  initialState: {
    data: null,
    isHydrating: false,
    isLoggedIn: false,
    showAuthModal: false,
    pendingNavigationRoute: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.data = action.payload;
      state.isLoggedIn = !!action.payload;
      state.isHydrating = false;
      if (action.payload) {
        state.showAuthModal = false;
      } else {
        state.showAuthModal = true;
      }
    },
    setShowAuthModal: (state, action) => {
      state.showAuthModal = action.payload;
    },
    setPendingNavigationRoute: (state, action) => {
      state.pendingNavigationRoute = action.payload;
    },
    clearUser: (state) => {
      state.data = null;
      state.isHydrating = false;
      state.isLoggedIn = false;
      state.showAuthModal = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.data = action.payload;
        state.isLoggedIn = !!action.payload;
        state.isHydrating = false;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.data = null;
        state.isLoggedIn = false;
        state.isHydrating = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.data = null;
        state.isLoggedIn = false;
        state.isHydrating = false;
        state.showAuthModal = true;
      });
  },
});

export const { setUser, setShowAuthModal, setPendingNavigationRoute, clearUser } = userSlice.actions;
export default userSlice.reducer;
