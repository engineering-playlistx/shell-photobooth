# Shell Photobooth - Design Document

## 1. Overview

Shell Photobooth is a racing-themed photobooth kiosk application designed for deployment at racing events. Attendees capture a photo, select a racing theme, and receive an AI-generated face-swapped photo composited onto a racing template — delivered via email and optional physical print.

The system is built as a **pnpm monorepo** with two applications:

- **`apps/frontend`** — Electron desktop app (kiosk UI, camera capture, local storage)
- **`apps/web`** — TanStack Start backend API (AI generation, email delivery, cloud persistence)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Electron Desktop App                  │
│  ┌───────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │  React UI │  │  SQLite DB │  │  Local Filesystem  │  │
│  │ (Renderer)│  │  (Main)    │  │  (Photos)          │  │
│  └─────┬─────┘  └────────────┘  └────────────────────┘  │
│        │                                                │
│        │  HTTP (Bearer Token)                           │
└────────┼────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│               TanStack Start Backend API                │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │  API Routes   │  │  Use Cases  │  │  Services     │  │
│  │  /api/*       │  │  (Business) │  │  (External)   │  │
│  └──────┬───────┘  └──────┬──────┘  └───────┬───────┘  │
│         │                 │                  │          │
│         ▼                 ▼                  ▼          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            External Services                     │   │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │   │
│  │  │ Supabase │  │ Replicate │  │    Resend    │   │   │
│  │  │ (DB+S3)  │  │   (AI)    │  │   (Email)    │   │   │
│  │  └──────────┘  └───────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Deployment Targets

| Component | Target |
|-----------|--------|
| Frontend  | Electron installer (Windows/macOS/Linux) |
| Backend   | Cloudflare Workers (via Wrangler) |
| Database  | Supabase (hosted PostgreSQL) |
| Storage   | Supabase Storage (S3-compatible) |

---

## 3. Tech Stack

### Frontend (`apps/frontend`)

| Concern        | Technology |
|----------------|------------|
| Runtime        | Electron 39 |
| UI Framework   | React 19 + React Router 7 |
| Build Tool     | Vite 5 + Electron Forge 7 |
| Styling        | Tailwind CSS 4 |
| Local Database | Node.js `DatabaseSync` (SQLite) |
| Cloud Storage  | Supabase JS Client |
| Icons          | @iconify/react |
| Input          | simple-keyboard (on-screen kiosk keyboard) |
| Language       | TypeScript 5.4 |

### Backend (`apps/web`)

| Concern        | Technology |
|----------------|------------|
| Framework      | TanStack Start 1.132 + TanStack Router |
| Runtime        | Node.js >= 24.10 / Cloudflare Workers |
| Database       | Supabase (PostgreSQL) |
| AI Service     | Replicate API (`google/nano-banana-pro`) |
| Email          | Resend + React Email |
| Monitoring     | Sentry |
| Build/Deploy   | Vite 7 + Wrangler (Cloudflare) |
| Language       | TypeScript 5.7 |

### Shared / Tooling

| Concern        | Technology |
|----------------|------------|
| Package Mgr    | pnpm 10.18 |
| Monorepo       | pnpm workspaces |
| Linting        | ESLint + Prettier |
| Git Hooks      | Husky + lint-staged |
| Node Version   | >= 24.10 |

---

## 4. User Flow

```
┌──────┐    ┌────────┐    ┌────────┐    ┌──────┐    ┌─────────┐    ┌────────┐
│ Home │───▶│ Select │───▶│ Camera │───▶│ Form │───▶│ Loading │───▶│ Result │
│  /   │    │ Theme  │    │Capture │    │      │    │  (AI)   │    │        │
└──────┘    └────────┘    └────────┘    └──────┘    └─────────┘    └────────┘
  Tap to     Pit Crew     Countdown     Name        Face swap      View photo
  enter      MotoGP       + Capture     Email       processing     Email / Print
             F1           Retake(x2)    Phone                      Download
                                        Consent
```

### Step-by-step

1. **Home (`/`)** — "Tap to enter" splash screen with background video.
2. **Theme Selection (`/select`)** — User picks a racing theme: Pit Crew, MotoGP, or F1.
3. **Camera Capture (`/camera`)** — Live camera preview with countdown timer. User can retake up to 2 times.
4. **Form (`/form`)** — Collects name, email, and phone number with on-screen keyboard. Includes data consent checkbox.
5. **Loading (`/loading`)** — Photo is sent to the backend for AI face-swap processing. Progress bar shown.
6. **Result (`/result`)** — Final composited photo displayed. Options to email, print (4"x6"), or retake.

---

## 5. Racing Themes

Each theme consists of three assets and a configurable AI prompt:

| Theme    | Template Image | Frame Overlay | AI Prompt |
|----------|---------------|---------------|-----------|
| Pit Crew | Racing template URL (env) | `frame-pitcrew.png` | Configurable via `RACING_PROMPT_PITCREW` |
| MotoGP   | Racing template URL (env) | `frame-motogp.png`  | Configurable via `RACING_PROMPT_MOTOGP` |
| F1       | Racing template URL (env) | `frame-f1.png`      | Configurable via `RACING_PROMPT_F1` |

- **Template images** are hosted externally and referenced via environment variables.
- **Frame overlays** are local PNG assets composited client-side on a canvas after AI generation.
- **AI prompts** are configured in `wrangler.jsonc` (production) and `.env` (development).

---

## 6. API Endpoints

### `POST /api/ai-generate`

Generates an AI face-swapped photo.

- **Auth:** `Authorization: Bearer <API_CLIENT_KEY>`
- **Request Body:**
  ```json
  {
    "userPhotoBase64": "data:image/png;base64,...",
    "theme": "pitcrew" | "motogp" | "f1"
  }
  ```
- **Response:**
  ```json
  {
    "generatedImageBase64": "data:image/png;base64,..."
  }
  ```
- **Processing Flow:**
  1. Decode base64 photo → upload to Supabase temp storage
  2. Get public URL for the temp file
  3. Call Replicate AI with user photo URL + racing template URL
  4. Download generated result from Replicate
  5. Cleanup temp file from Supabase
  6. Return base64-encoded result

### `POST /api/photo`

Submits user data and triggers email delivery.

- **Auth:** `Authorization: Bearer <API_CLIENT_KEY>`
- **Request Body:**
  ```json
  {
    "photoPath": "public/uuid-name.png",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "selectedTheme": "f1"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Photo submitted successfully",
    "photoUrl": "https://...supabase.../public/uuid-name.png"
  }
  ```
- **Processing Flow:**
  1. Validate input fields
  2. Insert user record into Supabase `users` table
  3. Generate public URL for the stored photo
  4. Send email via Resend with photo URL and attachment
  5. Return success with photo URL

---

## 7. Data Models

### Supabase PostgreSQL — `users` Table

| Column         | Type                       | Constraints |
|----------------|----------------------------|-------------|
| `id`           | `uuid`                     | PK, auto-generated |
| `name`         | `text`                     | NOT NULL |
| `email`        | `text`                     | NOT NULL, indexed |
| `phone`        | `text`                     | NOT NULL |
| `photo_path`   | `text`                     | nullable |
| `selected_theme` | `text`                   | nullable |
| `created_at`   | `timestamp with time zone` | indexed (DESC) |

**Row Level Security (RLS):** Enabled. Admin-only insert/select policies.

### Supabase Storage — `photobooth-bucket`

| Path       | Purpose |
|------------|---------|
| `public/`  | Permanent photo storage (publicly readable) |
| `temp/`    | Temporary uploads during AI processing (cleaned up after use) |

### Local SQLite — `photo_results` Table (Frontend)

| Column          | Type   | Constraints |
|-----------------|--------|-------------|
| `id`            | `TEXT` | PK |
| `photo_path`    | `TEXT` | NOT NULL |
| `selected_theme`| `TEXT` | NOT NULL |
| `user_info`     | `TEXT` | NOT NULL (JSON stringified) |
| `created_at`    | `TEXT` | NOT NULL |
| `updated_at`    | `TEXT` | NOT NULL |

The local SQLite database enables offline data viewing and CSV export from the admin data page.

---

## 8. AI Face Swap Pipeline

```
User Photo (base64)          Racing Template (URL from env)
       │                              │
       ▼                              │
  Upload to Supabase                  │
  temp storage                        │
       │                              │
       ▼                              ▼
  ┌─────────────────────────────────────────┐
  │         Replicate AI API                │
  │    Model: google/nano-banana-pro        │
  │    Resolution: 2K                       │
  │    Format: PNG                          │
  │    Safety: block_only_high              │
  │    Prompt: theme-specific (env config)  │
  └────────────────┬────────────────────────┘
                   │
                   ▼
          Generated Image URL
                   │
                   ▼
          Download as buffer
                   │
                   ▼
          Encode to base64
                   │
                   ▼
        Return to Frontend
                   │
                   ▼
  ┌──────────────────────────────┐
  │  Client-side Canvas Compose  │
  │  Generated image + Frame     │
  │  overlay (theme-specific)    │
  │  Output: 1080x1920 PNG       │
  └──────────────────────────────┘
                   │
                   ▼
         Final composited photo
         (saved locally + uploaded to Supabase)
```

---

## 9. Email System

**Service:** Resend API

**Template:** Built with React Email components (`apps/web/src/services/emails/photo-result.tsx`)

**Email Contents:**
- Personalized greeting with user's name
- Inline photo preview
- Download button linking to the Supabase public URL
- Photo file attached directly to the email

**Features:**
- Idempotency key to prevent duplicate sends
- Fallback logging when `RESEND_API_KEY` is not configured (development mode)
- Email preview server available at `localhost:3001` via `pnpm wb dev:email`

---

## 10. Frontend Architecture

### Electron Process Model

```
┌─────────────────────────────────┐
│         Main Process            │
│  - Window management            │
│  - SQLite database              │
│  - Filesystem operations        │
│  - Print management             │
│  - Menu/keyboard shortcuts      │
│  - IPC handlers                 │
└────────────┬────────────────────┘
             │ IPC Bridge
┌────────────┴────────────────────┐
│        Preload Script           │
│  - Exposes safe APIs to         │
│    renderer via contextBridge   │
│  - DB operations                │
│  - File operations              │
│  - Print operations             │
└────────────┬────────────────────┘
             │ contextBridge
┌────────────┴────────────────────┐
│       Renderer Process          │
│  - React 19 UI                  │
│  - React Router 7               │
│  - Tailwind CSS 4               │
│  - Camera API (getUserMedia)    │
│  - Canvas compositing           │
│  - On-screen keyboard           │
└─────────────────────────────────┘
```

### State Management

Global state is managed via `PhotoboothContext` (React Context), holding:
- Selected theme
- Captured photo data
- User form information
- Generated result photo
- Navigation state

### Display

- **Aspect Ratio:** 9:16 (portrait kiosk mode)
- **Resolution:** 1080x1920 for photo output
- **Fullscreen:** Supported for kiosk deployment
- **Keyboard Shortcuts:** `Cmd+H` (home), `Cmd+D` (data viewer)

---

## 11. Backend Architecture

### Layered Design

```
Routes (API handlers)
  └──▶ Use Cases (business logic orchestration)
        └──▶ Repositories (data access via Supabase)
        └──▶ Services (external integrations)
              ├── AI Generation Service (Replicate)
              ├── Email Service (Resend)
              └── Supabase Admin Client
```

### Middleware Stack

1. **CORS Middleware** — Configurable origin via `CORS_ORIGIN` env var
2. **Logging Middleware** — Request method, path, and timing

### Environment Bindings (Cloudflare Workers)

Environment variables are accessed via `getEvent().context.cloudflare.env` when deployed to Cloudflare Workers, ensuring compatibility with the Workers runtime model.

---

## 12. Printing

- **Target Device:** DS-RX1 thermal photo printer
- **Print Format:** 4" x 6" (standard photo size)
- **Implementation:** Native Electron `webContents.print()` API
- **Behavior:**
  - Auto-print triggered after photo generation
  - Manual print button available on result screen
  - PDF export as fallback

---

## 13. Security

| Layer | Mechanism |
|-------|-----------|
| API Authentication | Bearer token (`API_CLIENT_KEY`) shared between frontend and backend |
| Database Access | Supabase RLS policies; backend uses service role key |
| Storage Access | Public read for `public/` folder; anon upload restricted to `public/` path |
| Input Validation | Server-side validation on all API inputs (name, email, phone) |
| CORS | Configurable origin restriction |
| Monitoring | Sentry error tracking on backend |

---

## 14. Environment Configuration

### Frontend (`apps/frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_API_CLIENT_KEY` | Bearer token for API auth |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Backend (`apps/web/.env` + `wrangler.jsonc`)

| Variable | Description |
|----------|-------------|
| `API_CLIENT_KEY` | Bearer token for API auth |
| `CORS_ORIGIN` | Allowed CORS origin |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (full access) |
| `REPLICATE_API_KEY` | Replicate API authentication |
| `REPLICATE_MODEL` | AI model identifier |
| `RACING_TEMPLATE_PITCREW_URL` | Pit Crew theme template image URL |
| `RACING_TEMPLATE_MOTOGP_URL` | MotoGP theme template image URL |
| `RACING_TEMPLATE_F1_URL` | F1 theme template image URL |
| `RACING_PROMPT_PITCREW` | AI prompt for Pit Crew theme |
| `RACING_PROMPT_MOTOGP` | AI prompt for MotoGP theme |
| `RACING_PROMPT_F1` | AI prompt for F1 theme |
| `RESEND_API_KEY` | Resend email service key |
| `RESEND_FROM_EMAIL` | Sender email address |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN |

---

## 15. Development

### Prerequisites

- Node.js >= 24.10
- pnpm 10.18+
- Supabase CLI (for local database)

### Commands

```bash
# Install dependencies
pnpm install

# Start local Supabase (PostgreSQL + Storage)
pnpm wb supabase start

# Start backend dev server
pnpm wb dev

# Start frontend Electron app
pnpm fe start

# Preview email templates
pnpm wb dev:email

# Lint
pnpm lint

# Deploy backend to Cloudflare
pnpm wb deploy
```

### Workspace Aliases

| Alias | Workspace |
|-------|-----------|
| `pnpm fe <cmd>` | `apps/frontend` |
| `pnpm wb <cmd>` | `apps/web` |

---

## 16. Key File Map

```
shell-photobooth/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── main.ts                    # Electron main process
│   │   │   ├── preload.ts                 # IPC bridge
│   │   │   ├── contexts/
│   │   │   │   └── PhotoboothContext.tsx   # Global state
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx               # Splash screen
│   │   │   │   ├── SelectTheme.tsx        # Theme picker
│   │   │   │   ├── Camera.tsx             # Photo capture
│   │   │   │   ├── Form.tsx               # User info form
│   │   │   │   ├── Loading.tsx            # AI processing
│   │   │   │   ├── Result.tsx             # Final photo
│   │   │   │   └── Data.tsx               # Admin data viewer
│   │   │   ├── components/
│   │   │   │   └── SimpleKeyboard.tsx     # On-screen keyboard
│   │   │   └── utils/
│   │   │       ├── database.ts            # SQLite operations
│   │   │       ├── supabase.ts            # Supabase client
│   │   │       └── assets.ts              # Asset path resolver
│   │   ├── public/
│   │   │   └── images/                    # Frames, themes, UI assets
│   │   └── forge.config.ts                # Electron Forge packaging
│   │
│   └── web/
│       ├── src/
│       │   ├── routes/
│       │   │   ├── api.ai-generate.ts     # AI face-swap endpoint
│       │   │   └── api.photo.ts           # Photo submission endpoint
│       │   ├── use-cases/
│       │   │   ├── generate-ai-photo.ts   # AI generation orchestration
│       │   │   └── submit-photo.ts        # Photo submission orchestration
│       │   ├── repositories/
│       │   │   └── user.repository.ts     # Supabase user data access
│       │   ├── services/
│       │   │   ├── ai-generation.service.ts  # Replicate API client
│       │   │   ├── email.service.tsx          # Resend email client
│       │   │   └── emails/
│       │   │       └── photo-result.tsx       # Email template
│       │   ├── middlewares/
│       │   │   ├── cors.middleware.ts      # CORS handling
│       │   │   └── logging.middleware.ts   # Request logging
│       │   └── utils/
│       │       └── supabase-admin.ts      # Supabase admin client
│       ├── supabase/
│       │   ├── config.toml                # Local Supabase config
│       │   └── migrations/                # Database migrations
│       └── wrangler.jsonc                 # Cloudflare Workers config
│
├── package.json                           # Root workspace config
├── pnpm-workspace.yaml                    # Monorepo workspace definition
└── tsconfig.json                          # Base TypeScript config
```
