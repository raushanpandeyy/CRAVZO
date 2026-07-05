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
    clearUser: () => {
      return { data: null, isHydrating: false, isLoggedIn: false, showAuthModal: true };
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
      });
  },
});

export const { setUser, setShowAuthModal, clearUser } = userSlice.actions;
export default userSlice.reducer;
