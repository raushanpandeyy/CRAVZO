import { selectUserState, selectCurrentUser, selectIsLoggedIn } from "../store/selectors";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser, logoutUser } from "../store/slices/userSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { data: user, isHydrating, isLoggedIn } = useSelector(selectUserState);

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  const logout = () => dispatch(logoutUser());

  return { user, isHydrating, isLoggedIn, logout };
};
