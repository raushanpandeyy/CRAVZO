export const EMPTY_USER_STATE = {
  data: null,
  isHydrating: false,
  isLoggedIn: false,
  showAuthModal: false,
  pendingNavigationRoute: null,
};

export const selectUserState = (state) => state?.user || EMPTY_USER_STATE;
export const selectCurrentUser = (state) => selectUserState(state).data;
export const selectIsLoggedIn = (state) => !!selectUserState(state).isLoggedIn;
