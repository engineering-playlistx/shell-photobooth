# Setup & Configuration Guide

Complete guide to set up all backend services and integrations for the AI Racing Photobooth app.

## Architecture Overview

```
┌─────────────────────┐      HTTPS/Bearer Token      ┌──────────────────────────┐
│  Electron Frontend  │ ──────────────────────────▶   │  Cloudflare Workers      │
│  (apps/frontend)    │                               │  (apps/web)              │
│                     │                               │                          │
│  - Camera capture   │                               │  - POST /api/photo       │
│  - Local SQLite DB  │                               │  - POST /api/ai-generate │
│  - Supabase client  │                               │  - Supabase admin client │
│    (photo upload)   │                               │  - Replicate AI          │
│                     │                               │  - Resend email          │
└─────────────────────┘                               └──────────────────────────┘
         │                                                       │
         │  Direct upload (anon)                                 │  Service role
         ▼                                                       ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                     Supabase                                 │
    │  - Storage: photobooth-bucket bucket                     │
    │  - PostgreSQL: users table                                  │
    └──────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create a New Supabase Project](#2-create-a-new-supabase-project)
3. [Set Up Supabase Database (Users Table)](#3-set-up-supabase-database-users-table)
4. [Set Up Supabase Storage Bucket](#4-set-up-supabase-storage-bucket)
5. [Set Up Replicate (AI Face Swap)](#5-set-up-replicate-ai-face-swap)
6. [Prepare Racing Template Images](#6-prepare-racing-template-images)
7. [Set Up Resend (Email Service)](#7-set-up-resend-email-service)
8. [Generate a New API Client Key](#8-generate-a-new-api-client-key)
9. [Configure Environment Variables](#9-configure-environment-variables)
10. [Deploy Web Backend to Cloudflare Workers](#10-deploy-web-backend-to-cloudflare-workers)
11. [Set Cloudflare Workers Secrets](#11-set-cloudflare-workers-secrets)
12. [Update Frontend Environment](#12-update-frontend-environment)
13. [Local Development Setup](#13-local-development-setup)
14. [Testing the Full Flow](#14-testing-the-full-flow)
15. [Environment Variables Reference](#15-environment-variables-reference)

---

## 1. Prerequisites

- **Node.js** >= 24.10
- **pnpm** 10.18.2+ (`corepack enable && corepack prepare pnpm@10.18.2 --activate`)
- **Wrangler CLI** (included as devDependency, or install globally: `npm i -g wrangler`)
- **Supabase CLI** (included as devDependency, or install globally: `npm i -g supabase`)
- A **Cloudflare** account (free tier works)
- A **Supabase** account (free tier works)
- A **Replicate** account (pay-per-use)
- A **Resend** account (free tier: 100 emails/day)

Install all dependencies first:

```bash
pnpm install
```

---

## 2. Create a New Supabase Project

The current `.env` files reference an old Supabase project (`yacmockmjbrfnlkdcpln.supabase.co`). You need to create a fresh one.

### Steps:

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Choose your organization (or create one)
4. Fill in:
   - **Project name**: `racing-photobooth` (or any name you prefer)
   - **Database password**: Generate a strong password and save it somewhere safe
   - **Region**: Choose the closest to your users (e.g., `Southeast Asia (Singapore)` for Indonesia)
5. Click **"Create new project"** and wait for provisioning (~2 minutes)

### Collect your credentials:

Once the project is ready, go to **Settings → API** and note down:

| Credential | Where to find it | Used by |
|---|---|---|
| **Project URL** | `Settings → API → Project URL` | Both frontend and backend |
| **anon public key** | `Settings → API → Project API Keys → anon public` | Both frontend and backend |
| **service_role key** | `Settings → API → Project API Keys → service_role secret` | Backend only (KEEP SECRET) |

> **WARNING**: The `service_role` key bypasses Row Level Security. Never expose it in the frontend or commit it to git.

### Link to local Supabase CLI (optional, for migrations):

```bash
cd apps/web
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

The project ref is the subdomain of your Supabase URL (e.g., if URL is `https://abcdefg.supabase.co`, the ref is `abcdefg`).

---

## 3. Set Up Supabase Database (Users Table)

The app stores photobooth user submissions (name, email, phone, photo path) in a `users` table.

### Option A: Push migrations via Supabase CLI

If you linked your project in the previous step:

```bash
cd apps/web
npx supabase db push
```

This will run all migrations in `supabase/migrations/` on your remote Supabase project:
- `20251116083518_create_users_table.sql` — Creates the `users` table with RLS
- `20251116112602_bucket_policy.sql` — Sets up storage bucket policies

### Option B: Run SQL manually via Supabase Dashboard

If you prefer not to use the CLI, go to **SQL Editor** in your Supabase dashboard and run these in order:

**Step 1 — Create users table:**

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for admins only"
  ON users AS PERMISSIVE FOR INSERT
  TO supabase_admin WITH CHECK (true);

CREATE POLICY "Enable read access for admins only"
  ON users AS PERMISSIVE FOR SELECT
  TO supabase_admin USING (true);
```

> **Note**: The RLS policies only allow `supabase_admin` (i.e., the `service_role` key) to read/write. The backend uses `service_role`, so this is correct. Anonymous users cannot read/modify user data.

**Step 2 — Grant permissions** (needed for the service role to work):

```sql
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
```

---

## 4. Set Up Supabase Storage Bucket

The app uses a storage bucket named `photobooth-bucket` for:
- **Permanent storage**: Final user photos in `public/` folder (uploaded by frontend)
- **Temporary storage**: User photos in `temp/` folder (uploaded by backend for AI processing, then deleted)

### Create the bucket:

1. Go to **Storage** in your Supabase dashboard
2. Click **"New bucket"**
3. Set:
   - **Bucket name**: `photobooth-bucket`
   - **Public bucket**: **YES** (toggle ON) — needed so Replicate can access the temp photos via URL
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: `image/png, image/jpeg, image/webp`
4. Click **"Create bucket"**

### Set up bucket policies:

Go to **Storage → Policies** (or the bucket → **Policies** tab) and add these policies:

**Policy 1 — Allow anonymous read from public folder:**

```
- Policy name: "Give anon users access to public folder"
- Allowed operation: SELECT
- Target roles: public
- USING expression:
    bucket_id = 'photobooth-bucket'
    AND LOWER((storage.foldername(name))[1]) = 'public'
    AND auth.role() = 'anon'
```

**Policy 2 — Allow anonymous upload to public folder:**

```
- Policy name: "Give anon users access to upload to public folder"
- Allowed operation: INSERT
- Target roles: public
- WITH CHECK expression:
    bucket_id = 'photobooth-bucket'
    AND LOWER((storage.foldername(name))[1]) = 'public'
    AND auth.role() = 'anon'
```

> **Note**: The `temp/` folder is accessed using the `service_role` key (from the backend), which bypasses RLS — so no additional policy is needed for temp uploads.

Alternatively, if you ran `supabase db push` in Step 3, the bucket policies are already applied via the migration file. But you still need to **manually create the bucket** via the dashboard (migrations only create policies, not the bucket itself).

---

## 5. Set Up Replicate (AI Face Swap)

Replicate is used to run the `google/nano-banana-pro` (Gemini-based) model that performs AI face swap — placing the user's face onto a racing template image using natural language prompts.

### Steps:

1. Go to [https://replicate.com](https://replicate.com) and sign up / log in
2. Go to **Account Settings → API tokens** ([https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens))
3. Click **"Create token"**, give it a name (e.g., `racing-photobooth`), and copy the token

> **Pricing**: Check the [model page](https://replicate.com/google/nano-banana-pro) for current pricing.

### How it works in the app:

1. Frontend captures a photo and sends it as base64 to `POST /api/ai-generate`
2. Backend uploads the photo to Supabase `temp/` folder to get a public URL
3. Backend calls Replicate `google/nano-banana-pro` with a face-swap prompt + both images (user photo and template) via the `image_input` array
4. Replicate returns a URL to the generated image
5. Backend downloads the result, converts to base64, returns to frontend
6. Backend deletes the temp photo from Supabase

---

## 6. Prepare Racing Template Images

The Nano Banana Pro model needs a "target" image for each racing theme — this is the image the user's face gets swapped onto via prompt-based instructions.

You need **3 template images** (one per theme):

| Theme | Env Variable | Description |
|---|---|---|
| Pit Crew | `RACING_TEMPLATE_PITCREW_URL` | Photo of a pit crew member |
| MotoGP | `RACING_TEMPLATE_MOTOGP_URL` | Photo of a MotoGP rider |
| F1 | `RACING_TEMPLATE_F1_URL` | Photo of an F1 driver |

### Requirements for good face-swap results:

- Clear, well-lit **front-facing portrait** or 3/4 view
- Visible face (not obscured by helmet visor — use images without helmet or with visor up)
- High resolution (at least 512x512, ideally 1024x1024)
- JPEG or PNG format

### Where to host them:

**Option A — Supabase Storage (recommended):**

1. In your Supabase bucket `photobooth-bucket`, create a folder called `templates/`
2. Upload your 3 template images (e.g., `pitcrew.png`, `motogp.png`, `f1.png`)
3. Get the public URL for each:
   ```
   https://<your-project-ref>.supabase.co/storage/v1/object/public/photobooth-bucket/templates/pitcrew.png
   ```

**Option B — Any public URL:**

You can use any publicly accessible image URL (e.g., Cloudflare R2, S3, Imgur). The URL must be directly accessible without authentication since Replicate needs to fetch it.

### Set the URLs in your environment:

```env
RACING_TEMPLATE_PITCREW_URL=https://<your-project-ref>.supabase.co/storage/v1/object/public/photobooth-bucket/templates/pitcrew.png
RACING_TEMPLATE_MOTOGP_URL=https://<your-project-ref>.supabase.co/storage/v1/object/public/photobooth-bucket/templates/motogp.png
RACING_TEMPLATE_F1_URL=https://<your-project-ref>.supabase.co/storage/v1/object/public/photobooth-bucket/templates/f1.png
```

---

## 7. Set Up Resend (Email Service)

Resend is used to email the final photobooth image to users. It only runs in production (`NODE_ENV=production`); in development, emails are logged to the console.

### Steps:

1. Go to [https://resend.com](https://resend.com) and sign up / log in
2. Go to **API Keys** ([https://resend.com/api-keys](https://resend.com/api-keys))
3. Click **"Create API Key"**:
   - Name: `racing-photobooth`
   - Permission: **Sending access**
   - Domain: Select your verified domain (or use the default `onboarding@resend.dev` for testing)
4. Copy the API key (starts with `re_`)

### Verify your sending domain:

The current code sends from `L'Occitane <no-reply@loccitane.id>`. To use this:

1. Go to **Domains** → **Add Domain** → enter `loccitane.id`
2. Add the DNS records Resend provides (SPF, DKIM, DMARC)
3. Wait for verification

If you want to change the sender email, edit [apps/web/src/services/email.service.tsx](apps/web/src/services/email.service.tsx) line 6:

```ts
const RESEND_FROM_EMAIL = "Your Brand <no-reply@yourdomain.com>"
```

> **Free tier**: 100 emails/day, 1 custom domain. Enough for development and small events.

---

## 8. Generate a New API Client Key

The frontend authenticates to the backend using a Bearer token. The old project has existing keys — you should generate a new one for security.

### Generate a random key:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

This will output something like:
```
aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB3cD4eF5gH6iJ7kL8m
```

**This same key must be set in TWO places:**

1. `apps/web/.env` → `API_CLIENT_KEY=<your-key>`
2. `apps/frontend/.env` → `VITE_API_CLIENT_KEY=<your-key>`

And also as a Cloudflare Workers secret (see Step 11).

---

## 9. Configure Environment Variables

### apps/web/.env (Backend)

```env
# API Security
API_CLIENT_KEY=<your-generated-key-from-step-8>
CORS_ORIGIN=*

# Supabase (use your NEW project credentials from Step 2)
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-role-key>

# Resend (from Step 7)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sentry (optional — leave blank to disable)
VITE_SENTRY_DSN=
VITE_SENTRY_ORG=
VITE_SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Replicate (from Step 5)
REPLICATE_API_KEY=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Racing template images (from Step 6)
RACING_TEMPLATE_PITCREW_URL=https://...
RACING_TEMPLATE_MOTOGP_URL=https://...
RACING_TEMPLATE_F1_URL=https://...
```

### apps/frontend/.env (Frontend)

```env
# API Configuration (will be updated after deploying in Step 10)
VITE_API_BASE_URL=http://localhost:3000
VITE_API_CLIENT_KEY=<same-key-as-backend-API_CLIENT_KEY>

# Supabase (same project URL and anon key — NOT service_role!)
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# DigiCamControl (Windows DSLR tethering — adjust paths as needed)
DIGICAMCONTROL_URL=http://localhost:5513
DIGICAMCONTROL_EXE_PATH=C:\Program Files (x86)\digiCamControl\CameraControl.exe
```

---

## 10. Deploy Web Backend to Cloudflare Workers

The web backend runs on Cloudflare Workers using TanStack Start.

### First-time setup:

1. **Login to Cloudflare**:
   ```bash
   cd apps/web
   npx wrangler login
   ```
   This opens a browser to authenticate with your Cloudflare account.

2. **Update the worker name** (optional):
   Edit [apps/web/wrangler.jsonc](apps/web/wrangler.jsonc) and change the name if desired:
   ```jsonc
   {
     "name": "racing-photobooth-web",  // change this
     "compatibility_date": "2025-09-02",
     "compatibility_flags": ["nodejs_compat"],
     "main": "@tanstack/react-start/server-entry"
   }
   ```

3. **Build and deploy**:
   ```bash
   cd apps/web
   pnpm build
   pnpm deploy
   ```
   Or from the root:
   ```bash
   pnpm wb build
   pnpm wb deploy
   ```

4. After deployment, Wrangler will output your Worker URL:
   ```
   Published racing-photobooth-web (x.xx sec)
     https://racing-photobooth-web.<your-subdomain>.workers.dev
   ```

   **Save this URL** — you'll need it for Step 12.

---

## 11. Set Cloudflare Workers Secrets

Environment variables in `.env` are only for local development. For production on Cloudflare Workers, you must set secrets via Wrangler:

```bash
cd apps/web

# API Key (must match frontend's VITE_API_CLIENT_KEY)
npx wrangler secret put API_CLIENT_KEY

# Supabase
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY

# Resend
npx wrangler secret put RESEND_API_KEY

# Replicate
npx wrangler secret put REPLICATE_API_KEY

# Racing template URLs
npx wrangler secret put RACING_TEMPLATE_PITCREW_URL
npx wrangler secret put RACING_TEMPLATE_MOTOGP_URL
npx wrangler secret put RACING_TEMPLATE_F1_URL
```

Each command will prompt you to paste the secret value. Alternatively, you can set them all at once from a file:

```bash
# Create a temporary secrets file (do NOT commit this!)
cat > .prod.vars <<EOF
API_CLIENT_KEY=<your-key>
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
RESEND_API_KEY=re_xxx
REPLICATE_API_KEY=r8_xxx
RACING_TEMPLATE_PITCREW_URL=https://...
RACING_TEMPLATE_MOTOGP_URL=https://...
RACING_TEMPLATE_F1_URL=https://...
CORS_ORIGIN=*
EOF
```

> Wrangler automatically reads `.prod.vars` for production. Make sure this file is in `.gitignore`.

---

## 12. Update Frontend Environment

Now that the backend is deployed, update the frontend to point to it:

Edit `apps/frontend/.env`:

```env
VITE_API_BASE_URL=https://racing-photobooth-web.<your-subdomain>.workers.dev
```

This is the URL from Step 10's deployment output.

---

## 13. Local Development Setup

### Start both apps simultaneously:

```bash
# From the repo root
pnpm dev
```

This runs:
- Frontend (Electron): via Vite dev server
- Backend (TanStack Start): on `http://localhost:3000`

### Local Supabase (optional):

For fully local development with a local Supabase instance:

```bash
cd apps/web
npx supabase start
```

This starts local Supabase services on:
- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- Database: `localhost:54322`

The local Supabase keys are already pre-filled in `env.sample`. Copy them to `.env` if using local Supabase.

After starting, create the bucket manually via local Studio (`http://127.0.0.1:54323` → Storage → New Bucket → `photobooth-bucket`, make it public).

Then apply schemas:

```bash
cd apps/web
npx supabase db reset
```

### Preview emails locally:

```bash
cd apps/web
pnpm dev:email
```

Opens React Email preview at `http://localhost:3001`.

---

## 14. Testing the Full Flow

### Checklist:

1. **Supabase connectivity**: Verify the frontend can connect to Supabase by checking the browser console for errors on load.

2. **Photo upload**: After taking a photo and filling the form, the photo should appear in your Supabase bucket under `public/`.

3. **AI generation**: On the loading screen, the app calls `/api/ai-generate`. Check for:
   - Temp photo appears briefly in Supabase `temp/` folder
   - Replicate processes the face swap
   - Temp photo is cleaned up after
   - Result image displays on the result page

4. **Email delivery**: On the result page, when a user's photo is submitted, an email should be sent to their address. Check the Resend dashboard for delivery logs.

### Common issues:

| Issue | Cause | Fix |
|---|---|---|
| `401 Unauthorized` on API calls | API key mismatch | Ensure `API_CLIENT_KEY` (backend) matches `VITE_API_CLIENT_KEY` (frontend) |
| `Missing Supabase environment variables` | Missing or wrong Supabase env vars | Check both `.env` files have correct URL and keys |
| `Template image URL not configured` | Missing template URLs | Set `RACING_TEMPLATE_*_URL` env vars with valid public URLs |
| `REPLICATE_API_KEY environment variable is required` | Missing Replicate key | Set `REPLICATE_API_KEY` in backend `.env` and Cloudflare secrets |
| CORS errors in browser | Backend CORS not configured | Set `CORS_ORIGIN=*` (or specific frontend origin) in backend env |
| Email not received | Resend domain not verified, or dev mode | Verify domain in Resend dashboard; emails only send when `NODE_ENV=production` |
| Face swap poor quality | Bad template image | Use clear, front-facing portraits without obstructions (helmets, sunglasses) |

---

## 15. Environment Variables Reference

### apps/web/.env (Backend)

| Variable | Required | Description |
|---|---|---|
| `API_CLIENT_KEY` | Yes | Bearer token for frontend→backend auth |
| `CORS_ORIGIN` | Yes | Allowed CORS origin (`*` for all, or specific URL) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key (admin access, bypasses RLS) |
| `RESEND_API_KEY` | Prod only | Resend API key for sending emails |
| `REPLICATE_API_KEY` | Yes | Replicate API token for AI face swap |
| `RACING_TEMPLATE_PITCREW_URL` | Yes | Public URL to pit crew template image |
| `RACING_TEMPLATE_MOTOGP_URL` | Yes | Public URL to MotoGP template image |
| `RACING_TEMPLATE_F1_URL` | Yes | Public URL to F1 template image |
| `VITE_SENTRY_DSN` | No | Sentry DSN for error tracking |
| `VITE_SENTRY_ORG` | No | Sentry organization slug |
| `VITE_SENTRY_PROJECT` | No | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | No | Sentry auth token for source maps |

### apps/frontend/.env (Frontend)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend URL (local: `http://localhost:3000`, prod: Workers URL) |
| `VITE_API_CLIENT_KEY` | Yes | Must match backend's `API_CLIENT_KEY` |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (same as backend) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key (same as backend, NOT service_role) |
| `DIGICAMCONTROL_URL` | No | DigiCamControl HTTP server URL (default: `http://localhost:5513`) |
| `DIGICAMCONTROL_EXE_PATH` | No | Path to DigiCamControl executable |
