import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage,
} from "firebase/storage";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId);
}

export function isStorageConfigured(): boolean {
  return Boolean(config.storageBucket && isFirebaseConfigured());
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (_app) return _app;
  if (!isFirebaseConfigured()) return null;
  _app = initializeApp({
    apiKey: config.apiKey!,
    authDomain: config.authDomain!,
    projectId: config.projectId!,
    storageBucket: config.storageBucket,
    appId: config.appId,
  });
  return _app;
}

export function getFirebaseAuth(): Auth | null {
  if (_auth) return _auth;
  const app = getFirebaseApp();
  if (!app) return null;
  _auth = getAuth(app);
  return _auth;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (_storage) return _storage;
  const app = getFirebaseApp();
  if (!app || !config.storageBucket) return null;
  _storage = getStorage(app);
  return _storage;
}

export type MediaKind = "image" | "video" | "audio" | "document";

export function detectMediaKind(file: File): MediaKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

export async function uploadMedia(
  file: File,
  folder = "general",
): Promise<{ url: string; kind: MediaKind }> {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase Storage is not configured. Enable it in Firebase Console (Blaze plan required).");
  const kind = detectMediaKind(file);
  const storageRef = ref(storage, `uploads/${folder}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, kind };
}

export async function uploadImage(file: File, folder = "general"): Promise<string> {
  const { url } = await uploadMedia(file, folder);
  return url;
}

let _provider: GoogleAuthProvider | null = null;
export function getGoogleProvider(): GoogleAuthProvider {
  if (!_provider) _provider = new GoogleAuthProvider();
  return _provider;
}
