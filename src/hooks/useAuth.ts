"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCurrentUser,
  logoutUser,
  selectUser,
  selectIsLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectHasCompletedOnboarding,
} from "@/store/slices/authSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const user = useAppSelector(selectUser);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const hasCompletedOnboarding = useAppSelector(selectHasCompletedOnboarding);

  useEffect(() => {
    if (user === null) {
      dispatch(fetchCurrentUser());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = async () => {
    await dispatch(logoutUser());
    router.push("/login");
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    hasCompletedOnboarding,
    logout,
  };
}
