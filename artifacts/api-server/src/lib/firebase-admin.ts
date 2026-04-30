import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let _app: App | null = null;

function loadServiceAccount(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        projectId: parsed.project_id ?? parsed.projectId,
        clientEmail: parsed.client_email ?? parsed.clientEmail,
        privateKey: (parsed.private_key ?? parsed.privateKey).replace(
          /\\n/g,
          "\n",
        ),
      };
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON: " +
          (err as Error).message,
      );
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT (JSON), " +
        "or all of FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

export function getFirebaseApp(): App {
  if (_app) return _app;

  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0]!;
    return _app;
  }

  const sa = loadServiceAccount();
  _app = initializeApp({
    credential: cert({
      projectId: sa.projectId,
      clientEmail: sa.clientEmail,
      privateKey: sa.privateKey,
    }),
    projectId: sa.projectId,
  });
  return _app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
