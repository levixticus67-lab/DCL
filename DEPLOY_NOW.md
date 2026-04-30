# DCL — Deploy Guide (Bulletproof Edition)

This is the deploy guide for the rebuilt version of DCL. The sign-in loop
is fixed at the root cause: **the API server now creates its own
database tables on startup**, so the schema can never be out of sync
with the code, and the brittle `drizzle-kit push-force` step is gone
forever.

## What changed vs. your old code

1. **`artifacts/api-server/src/lib/bootstrap.ts`** — new file. Runs
   `CREATE TABLE IF NOT EXISTS` for all 11 tables before the server
   accepts any traffic. Idempotent and deterministic. If the database
   is unreachable or the schema is incomplete, the server exits with a
   clear error instead of silently looping users back to sign-in.
2. **`artifacts/api-server/src/index.ts`** — calls `bootstrapDatabase()`
   before `app.listen()`.
3. **`artifacts/api-server/src/routes/health.ts`** — new endpoint
   `GET /api/healthz/db` that lists every required table and reports
   any that are missing. Use this to verify your deploy in 1 click.
4. **`artifacts/api-server/src/middlewares/authMiddleware.ts`** —
   surfaces a clear 401/500 with details when Firebase auth fails,
   instead of silently treating the user as anonymous (which was the
   *direct cause* of your sign-in loop).
5. **`render.yaml`** — removed `drizzle-kit push-force` entirely.
   Build is just `pnpm install && api-server build`. Start is just
   `api-server start`. Nothing fancy, nothing to break. Also pins the
   database to **the same Frankfurt region** as the web service so the
   internal hostname can resolve.
6. **Auto-retry on first connect** — on a brand-new Render deploy there
   is a short window (a few seconds to ~1 minute) where the database is
   provisioned but its internal DNS name doesn't resolve yet. The
   bootstrap now retries with exponential backoff (12 attempts, ~100s
   total) and only gives up if the database is genuinely unreachable.
   This kills the `getaddrinfo ENOTFOUND` startup crash that bit your
   first deploy attempt.

This was tested end-to-end against a real Postgres database. The exact
endpoint that was returning 500 in your old Render logs (`/api/settings`)
now returns the church's default settings on first run. The retry logic
was tested against a deliberately-bad hostname and behaves correctly
(2s → 4s → 8s → 15s → ... backoff, with clear log lines for each retry).

---

## Step 1 — Push this code to GitHub

You already have `https://github.com/levixticus67-lab/DCL`. Replace its
contents with this ZIP.

1. Unzip this file on your computer.
2. Open a terminal in the unzipped folder. Then:

   ```bash
   git init
   git remote add origin https://github.com/levixticus67-lab/DCL.git
   git checkout -b main
   git add .
   git commit -m "Bulletproof rebuild: self-bootstrapping schema, no more drizzle-kit at deploy"
   git push -f origin main
   ```

   The `-f` overwrites whatever's currently on GitHub. That's intentional —
   this ZIP is the new source of truth.

   On Windows in PowerShell, use the same commands (they all work).

---

## Step 2 — Render: deploy the API + database

If you've already deployed once with this same repo, skip to **2b**.

> **Did your previous deploy fail with `getaddrinfo ENOTFOUND
> dpg-...` ?** Then your old database was created in the wrong region
> and Render cannot move it. Before doing anything else:
>
> 1. Render dashboard → click the old **`dcl-postgres`** database →
>    **Settings** → scroll to the bottom → **Delete Database**. Type
>    the name to confirm.
> 2. Also delete the old **`dcl-api`** web service the same way.
> 3. Now follow **2a** below as if it's a fresh deploy. The new
>    `render.yaml` pins both the web service and the database to the
>    Frankfurt region, so the internal hostname will resolve this time.

### 2a — First-time deploy (Render creates the database for you)

1. Go to https://dashboard.render.com → **New + → Blueprint**.
2. Connect GitHub if needed, pick `levixticus67-lab/DCL`.
3. Render reads `render.yaml` and shows two new resources:
   - Database `dcl-postgres` (free)
   - Web service `dcl-api` (free)
4. Render asks you to fill in two secrets right there:
   - `CORS_ORIGINS` — leave blank for now, you'll set this after Step 3.
   - `FIREBASE_SERVICE_ACCOUNT` — leave blank for now, you'll set this in Step 4.
5. Click **Apply / Create new resources**.
6. The first build will deploy successfully but the API will fail to
   serve auth requests — that's expected because Firebase isn't
   configured yet. The schema bootstrap WILL still run and create all
   the tables.

### 2b — Already deployed

You only need to push to GitHub (Step 1) and Render auto-redeploys.

### Verify the schema is live (one click)

Once Render says "Live", open this URL in your browser
(replace with your actual Render URL):

```
https://dcl-api.onrender.com/api/healthz/db
```

You should see something like:

```json
{
  "status": "ok",
  "tables": ["sessions","users","site_settings","branches","people",
             "departments","announcements","finance_transactions",
             "attendance_services","storage_items","social_links"]
}
```

If you see this, **the database is fully set up and the back end is healthy.**

---

## Step 3 — Firebase: create the project (only once)

Skip if you already have a Firebase project.

1. https://console.firebase.google.com → **Add project** → name it
   `dcl-church` → disable Analytics → **Create project**.
2. **Build → Authentication → Get started**.
   - On **Sign-in method** tab, enable **Google** AND **Email/Password**.
3. On the project home, click the **`</>`** icon to add a web app.
   - Nickname: `dcl-web`
   - Tick **Also set up Firebase Hosting**.
   - Click **Register app**.
   - Copy these four values for Step 5:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `appId`
4. Click the **gear icon → Project settings → Service accounts** tab.
   - Click **Generate new private key**. This downloads a JSON file.
   - Open it in a text editor.
   - Use any "JSON minify" online tool (or just remove all line breaks
     by hand) to put the entire JSON on **one single line**.
   - Save this minified JSON for Step 4.

---

## Step 4 — Fill in the two Render secrets

In Render dashboard → `dcl-api` → **Environment** tab.

1. **`FIREBASE_SERVICE_ACCOUNT`** — paste the single-line JSON from
   Step 3.4. Save.
2. **`CORS_ORIGINS`** — your Firebase Hosting URLs, comma separated,
   no trailing slashes. Example:
   ```
   https://dcl-church.web.app,https://dcl-church.firebaseapp.com
   ```
   Save.

Render will redeploy automatically. Watch the **Logs** tab. You should see:

```
Bootstrap: ensuring database schema...
Bootstrap: schema ready (tables: 11)
Server listening (port: 10000)
```

If you see those three lines, the back end is fully operational.

---

## Step 5 — Build and deploy the website to Firebase

On your computer, in the unzipped project folder:

1. Create a file at `artifacts/dcl-church/.env` with this content
   (replace with your Step 3.3 values):

   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=dcl-church.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=dcl-church
   VITE_FIREBASE_APP_ID=1:1234:web:abcd
   VITE_API_BASE_URL=https://dcl-api.onrender.com
   ```

   `VITE_API_BASE_URL` = your Render service URL (no trailing slash).

2. One-time install:

   ```bash
   npm install -g pnpm@9
   pnpm install
   pnpm --filter @workspace/dcl-church run build
   ```

3. One-time Firebase CLI install:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

4. Deploy:

   ```bash
   cd artifacts/dcl-church
   firebase use --add        # pick your dcl-church project
   firebase deploy --only hosting
   ```

   Firebase will print your live URL (e.g. `https://dcl-church.web.app`).

---

## Step 6 — Sign in and test

1. Open your Firebase URL in an Incognito window.
2. Click **Sign in** → choose Google or email.
3. You should land on `/portal` and stay there.

The first account to sign in is automatically promoted to **main_admin**.
Make sure that's *your* account, not someone else testing the link.

---

## Troubleshooting

### "Sign in succeeds but kicks me back to sign-in"

This used to be silent. Now it tells you exactly what's wrong. Open
DevTools (F12) → **Network** tab → sign in again → click the
`/api/auth/user` request → look at the **Response** tab. You'll see
one of:

- `{"error":"Invalid auth token","detail":"..."}` — your
  `FIREBASE_SERVICE_ACCOUNT` is missing or pointing at the wrong
  Firebase project. Recheck Step 4.
- `{"error":"Auth backend failure — could not persist user","detail":"..."}` —
  the database has a real problem. Check `/api/healthz/db`.
- A CORS error in the **Console** tab — your `CORS_ORIGINS` doesn't
  match your Firebase Hosting URL. Add it.

### `/api/healthz/db` shows `status:"error"` with missing tables

This shouldn't happen — the bootstrap should have created them — but
if it does, hit Render → **Manual Deploy → Clear build cache & deploy**.
The startup will rerun the bootstrap.

### Render build fails on first deploy

Open **Build logs**. Common causes:
- `pnpm install` ran out of memory on free tier — retry the deploy.
- `pnpm-lock.yaml` is missing from the repo — make sure it was committed.

### My free Render service spins down after inactivity

That's the free plan. After 15 min idle, the next request takes ~50 sec
to wake up. Either upgrade to the $7/month Starter plan, or use a free
service like UptimeRobot to ping `/api/healthz` every 10 minutes.

### Where to look first when ANYTHING is wrong

Always start at:
```
https://dcl-api.onrender.com/api/healthz/db
```
- 200 OK → back end is fine, problem is in the front end / Firebase config / CORS.
- 500 with `missing` → schema didn't bootstrap. Check Render runtime logs.
- Network error → Render service is asleep or crashed. Check Render runtime logs.

---

## What's bulletproof about this version (vs. before)

| Failure mode you hit before | Why it can't happen now |
| --- | --- |
| `drizzle-kit push --force` failed: `__filename` redeclared | drizzle-kit isn't called at deploy time anymore |
| `drizzle-kit push --force` failed: `No schema files found` (Windows backslashes) | drizzle-kit isn't called at deploy time anymore |
| `getaddrinfo ENOTFOUND` for the database hostname during build | Schema setup runs at runtime, where the internal hostname resolves |
| `/api/settings` 500 because `site_settings` table missing | Server refuses to start until all tables exist |
| Sign-in loop: auth middleware silently swallowed DB errors | Auth middleware now returns 401/500 with details |
| You couldn't tell if the schema deployed or not | One URL to check: `/api/healthz/db` |

The only deploy step that can fail is your `pnpm install` running out
of memory on Render's free tier — and that just retries cleanly.

---

If you hit any wall, paste the response from `/api/healthz/db` plus the
Render runtime logs from the same minute, and we can debug from there.
