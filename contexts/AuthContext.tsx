"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authApi } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const verifiedUidRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);
  const registeringRef = useRef(false);

  // `forceTokenRefresh` re-mints the ID token. Needed on registration: the
  // token created by createUserWithEmailAndPassword predates displayName, so
  // its `name` claim is empty and the backend would fall back to the email
  // local-part when provisioning the profile.
  const fetchAndSetUser = useCallback(
    async (fbUser: FirebaseUser, forceTokenRefresh = false) => {
      if (verifiedUidRef.current === fbUser.uid && fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        const token = await fbUser.getIdToken(forceTokenRefresh);
        const userData = await authApi.verify(token);
        setUser(userData);
        verifiedUidRef.current = fbUser.uid;
      } catch (error) {
        // Keep the current user session. A transient backend failure (network,
        // rate-limit, etc.) should NOT log the user out — the Firebase session
        // is still valid. Only an explicit logout clears the user.
        console.error("Failed to refresh user from backend:", error);
      } finally {
        fetchingRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Signing up also fires this listener, immediately and with the same
        // stale token. Verifying here would race register()'s own call and let
        // whichever request lands first provision the profile — so
        // registration owns this first sync.
        if (!registeringRef.current) {
          await fetchAndSetUser(fbUser);
        }
      } else {
        setUser(null);
        queryClient.clear();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAndSetUser, queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      setUser(null);
      queryClient.clear();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await fetchAndSetUser(credential.user);
    },
    [fetchAndSetUser, queryClient]
  );

  const loginWithGoogle = useCallback(async () => {
    setUser(null);
    queryClient.clear();
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    await fetchAndSetUser(credential.user);
  }, [fetchAndSetUser, queryClient]);

  const register = useCallback(
    async (email: string, password: string, username: string) => {
      setUser(null);
      queryClient.clear();
      // Set before creating the account so the onAuthStateChanged listener
      // stands down; cleared in `finally` so a failed signup can still sync.
      registeringRef.current = true;
      try {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateProfile(credential.user, { displayName: username });
        await fetchAndSetUser(credential.user, true);
      } finally {
        registeringRef.current = false;
      }
    },
    [fetchAndSetUser, queryClient]
  );

  const logout = useCallback(async () => {
    queryClient.clear();
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (fbUser) {
      await fetchAndSetUser(fbUser);
    }
  }, [fetchAndSetUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
