# Deliverance Church Lugazi — Deployment Guide

This guide walks you through publishing the DCL Church Management System
to the internet using two free services:

- **Render** hosts the backend API + PostgreSQL database
- **Firebase** hosts the public website and handles user sign-in

You don't need to be a developer to follow this — just take it one
section at a time. Total time: about **45–60 minutes** the first time.

---

## What you will end up with

- A live website at something like `https://dcl-church.web.app`
  (or your own domain like `https://www.dclugazi.org`)
- A backend API at something like `https://dcl-api.onrender.com`
- A free Postgres database that holds your members, finance,
  announcements, etc.
- Sign-in via Google or email/password (the very first person to sign
  in becomes the **main admin** automatically)

---

## Before you start, you need

1. A **GitHub account** — free, sign up at https://github.com
2. A **Google account** — for Firebase
3. The project as a ZIP file (the one you already have)

---

## Part A — Put the project on GitHub

Render and Firebase both need to read your code from a Git repository.

1. Unzip the project on your computer.
2. Go to https://github.com/new and create a **new private repository**
   called `dcl-church` (don't tick "add README" or anything else).
3. On your computer, open a terminal in the unzipped project folder
   and run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/dcl-church.git
   git push -u origin main
   ```

   (Replace `YOUR-USERNAME` with your actual GitHub username.)

   GitHub will ask you to log in. If your password no longer works,
   create a **personal access token** at
   https://github.com/settings/tokens and use that as the password.

You should now see all the project files at
`https://github.com/YOUR-USERNAME/dcl-church`.

---

## Part B — Set up Firebase (sign-in + website hosting)

### B1. Create the Firebase project

1. Go to https://console.firebase.google.com and click **Add project**.
2. Name it `dcl-church` (or anything you like). You can disable
   Google Analytics — we don't need it.
3. Wait for the project to be created and click **Continue**.

### B2. Enable Authentication

1. In the left menu, click **Build → Authentication**, then
   **Get started**.
2. On the **Sign-in method** tab, enable:
   - **Google** (recommended — easiest for users)
   - **Email/Password**
3. Click **Save** for each.

### B3. Get your web app config

1. On the project home page, click the **`</>` (Web)** icon to add a
   web app.
2. Give it the nickname `dcl-web` and tick **Also set up Firebase
   Hosting**.
3. Click **Register app**.
4. Firebase shows you a config snippet. Copy these four values — you
   will need them in Part C:

   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`

### B4. Generate a service account key (so the backend can verify users)

1. In Firebase Console, click the **gear icon → Project settings**.
2. Open the **Service accounts** tab.
3. Click **Generate new private key** and confirm. A `.json` file
   downloads.
4. Open that file in a text editor. Select **all** of its contents
   (it's one big JSON object) and copy it — you'll paste it into
   Render in Part D.

   Keep this file safe. Anyone with it can act as your backend.

---

## Part C — Build and deploy the website to Firebase Hosting

You need [Node.js 20+](https://nodejs.org/) and pnpm installed:

```bash
npm install -g pnpm@10
npm install -g firebase-tools
```

Then in the project folder:

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create the file `artifacts/dcl-church/.env` (copy from
   `.env.example`) and fill in:

   ```
   VITE_API_BASE_URL=https://dcl-api.onrender.com
   VITE_FIREBASE_API_KEY=...        # from Part B3
   VITE_FIREBASE_AUTH_DOMAIN=...    # from Part B3
   VITE_FIREBASE_PROJECT_ID=...     # from Part B3
   VITE_FIREBASE_APP_ID=...         # from Part B3
   ```

   > Note: `VITE_API_BASE_URL` is the URL Render will give you in
   > Part D. You can leave it blank now and rebuild later — but it's
   > easier to set up Render first (jump to Part D, then come back).

3. Open `artifacts/dcl-church/.firebaserc` and replace
   `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` with your actual project ID.

4. Build the website:

   ```bash
   pnpm --filter @workspace/dcl-church run build
   ```

5. Log in to Firebase from the terminal:

   ```bash
   firebase login
   ```

6. Deploy:

   ```bash
   cd artifacts/dcl-church
   firebase deploy --only hosting
   ```

Firebase will print a URL like `https://dcl-church.web.app`. That's
your live site.

---

## Part D — Deploy the backend to Render

### D1. Create the Render account & connect GitHub

1. Go to https://render.com and sign up (you can use your GitHub
   account).
2. When asked, give Render permission to read your `dcl-church`
   repository.

### D2. Use the Blueprint

The project already includes a `render.yaml` file that describes
the backend and database for you.

1. In Render dashboard, click **New + → Blueprint**.
2. Pick your `dcl-church` repository.
3. Render will detect `render.yaml` and show:
   - A **Postgres database** called `dcl-postgres`
   - A **web service** called `dcl-api`
4. Click **Apply**.

### D3. Fill in the secret values

Render will prompt you for two values it cannot guess:

- **`CORS_ORIGINS`** — paste your Firebase Hosting URL.
  Example:

  ```
  https://dcl-church.web.app
  ```

  If you use a custom domain too, separate with a comma:

  ```
  https://dcl-church.web.app,https://www.dclugazi.org
  ```

- **`FIREBASE_SERVICE_ACCOUNT`** — paste the **entire JSON** you
  downloaded in Part B4 (one long string, with all the curly braces).

Click **Create New Resources**. Render will spend 3–5 minutes
building and starting your API. When it's green, copy its URL
(something like `https://dcl-api.onrender.com`).

### D4. Tell the website where the API lives

1. Open `artifacts/dcl-church/.env` and put the Render URL into
   `VITE_API_BASE_URL`.
2. Rebuild and redeploy the website:

   ```bash
   pnpm --filter @workspace/dcl-church run build
   cd artifacts/dcl-church
   firebase deploy --only hosting
   ```

---

## Part E — Take ownership as the main admin

1. Open your Firebase Hosting URL in the browser.
2. Click **Sign in** (top right).
3. Sign in with **Google** (or create an email account).

   The very **first** person to sign in is automatically promoted
   to **main admin** — that's you.

4. From the portal you can now create branches, add pastors, post
   announcements, log finances, etc.

---

## Optional — Use your own domain (e.g. `dclugazi.org`)

### Frontend (Firebase)

1. Buy the domain (Namecheap, Google Domains, etc.).
2. Firebase Console → **Hosting → Add custom domain**, follow the
   DNS steps.
3. Add the new domain to `CORS_ORIGINS` in Render and redeploy
   (Render → Environment → Save).

### Backend (Render)

You don't usually need a custom domain for the API — `dcl-api.onrender.com`
is fine. But if you want one, in Render: service → **Settings → Custom
Domains → Add**.

---

## Troubleshooting

**"Sign in works, but I see no data in the portal."**
The API URL is probably wrong. Check `VITE_API_BASE_URL` in
`artifacts/dcl-church/.env`, rebuild, and redeploy hosting.

**Browser console says "CORS blocked".**
Add your exact website URL (with `https://`) to `CORS_ORIGINS` in
Render → Environment → Save changes. Render will restart the API.

**API returns 401 / 403 on every request.**
The Firebase Service Account JSON is missing or malformed in Render.
Re-paste it as one block of text (no extra escaping needed).

**Render shows "Application failed to respond".**
Open Render → service → **Logs** and look for the error. Most often:
- Database not yet created → wait a minute and refresh
- `DATABASE_URL` not linked → re-apply the blueprint

**Render free service goes to sleep after 15 minutes.**
That's the free plan. The first request after a sleep takes ~30 seconds
to wake. Upgrade to **Starter ($7/month)** to keep it always on.

**I forgot to be the first to sign in and someone else became main admin.**
Open the Postgres database (Render → dcl-postgres → **Connect → External
Connection**) with any SQL client and run:

```sql
UPDATE users SET role = 'main_admin' WHERE email = 'you@example.com';
```

---

## Updating the site later

Whenever you change something in the code:

```bash
# 1. Push to GitHub — Render auto-deploys the backend
git add .
git commit -m "Update something"
git push

# 2. Rebuild + redeploy the frontend manually
pnpm --filter @workspace/dcl-church run build
cd artifacts/dcl-church
firebase deploy --only hosting
```

That's it. May the Lord prosper the work of your hands.
