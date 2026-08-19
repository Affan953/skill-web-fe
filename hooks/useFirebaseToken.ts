"use client";

import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useFirebaseToken() {
  const { firebaseUser } = useAuth();

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!firebaseUser) return null;
    return firebaseUser.getIdToken();
  }, [firebaseUser]);

  return { getToken, isAuthenticated: !!firebaseUser };
}
