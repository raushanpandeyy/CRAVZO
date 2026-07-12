import { selectUserState, selectCurrentUser, selectIsLoggedIn } from "../store/selectors";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import PhoneSignupModal from "./PhoneSignupModal";
import { setPendingNavigationRoute, setShowAuthModal } from "../store/slices/userSlice";

export default function AuthModalHost() {
  const dispatch = useDispatch();
  const { isLoggedIn, showAuthModal } = useSelector(selectUserState);

  return (
    <PhoneSignupModal
      visible={showAuthModal && !isLoggedIn}
      onClose={() => {
        dispatch(setPendingNavigationRoute(null));
        dispatch(setShowAuthModal(false));
      }}
    />
  );
}
