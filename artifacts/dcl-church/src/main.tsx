import { createRoot } from "react-dom/client";
import {
  setBaseUrl,
  setAuthTokenGetter,
} from "@workspace/api-client-react";
import { getFirebaseAuth } from "./lib/firebase";
import App from "./App";
import "./index.css";

// Configure API base URL — leave empty to use same-origin (e.g. when proxied
// or served behind a reverse proxy). Set VITE_API_BASE_URL=https://your-api
// when frontend (Firebase Hosting) and backend (Render) are on different
// origins.
const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
if (apiBase) {
  setBaseUrl(apiBase);
}

// Attach a Firebase ID token to every API call (when signed in).
setAuthTokenGetter(async () => {
  try {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return null;
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
