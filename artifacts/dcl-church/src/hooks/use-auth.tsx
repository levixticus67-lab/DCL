import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  customFetch,
  type AuthUser,
} from "@workspace/api-client-react";
import {
  getFirebaseAuth,
  getGoogleProvider,
  isFirebaseConfigured,
} from "@/lib/firebase";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  login: () => void;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(): Promise<AuthUser | null> {
  try {
    const data = await customFetch<{ user: AuthUser | null }>("/api/auth/user");
    return data.user ?? null;
  } catch {
    return null;
  }
}

function ensureAuth() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Sign-in is not configured. Add your Firebase web config (VITE_FIREBASE_*) and rebuild.",
    );
  }
  return auth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const profile = await fetchProfile();
      setUser(profile);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = ensureAuth();
    await signInWithPopup(auth, getGoogleProvider());
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const auth = ensureAuth();
      await signInWithEmailAndPassword(auth, email, password);
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const auth = ensureAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  }, []);

  const login = useCallback(() => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "";
    window.location.href = `${base}/sign-in`;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!firebaseUser && !!user,
      isConfigured: isFirebaseConfigured(),
      login,
      logout,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
    }),
    [
      user,
      isLoading,
      firebaseUser,
      login,
      logout,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}

export type { AuthUser };
