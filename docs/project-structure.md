# Shell Photobooth - Project Structure & Data Flow

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [Frontend App (Electron)](#frontend-app-electron)
  - [Technology Stack](#frontend-technology-stack)
  - [User Flow](#user-flow)
  - [Route Details](#route-details)
  - [State Management](#state-management)
  - [Electron IPC Communication](#electron-ipc-communication)
  - [Local Persistence (SQLite)](#local-persistence-sqlite)
- [Web App (TanStack Start)](#web-app-tanstack-start)
  - [Technology Stack](#web-technology-stack)
  - [Routes & API Endpoints](#routes--api-endpoints)
  - [Backend Architecture](#backend-architecture)
- [Complete Data Flow](#complete-data-flow)
  - [Photo Capture to Final Composite](#photo-capture-to-final-composite)
  - [Email Delivery Flow](#email-delivery-flow)
  - [Local Save & Print Flow](#local-save--print-flow)
- [Key Integrations](#key-integrations)
  - [Supabase](#supabase)
  - [Resend (Email)](#resend-email)
  - [Printing](#printing)
- [Archetype System](#archetype-system)
- [Security](#security)

---

## Overview

Shell Photobooth is a kiosk-style photobooth application built for L'Occitane. Users take photos, complete a personality quiz, fill out a contact form, and receive a personalized composite image via email and print.

The app is **offline-first** — all photos and data are persisted locally via SQLite and the filesystem, with cloud delivery (Supabase storage + email via Resend) as an optional enhancement.

---

## Monorepo Structure

```
shell-photobooth/
├── package.json              # Root workspace config (pnpm)
├── pnpm-workspace.yaml
├── apps/
│   ├── frontend/             # Electron desktop app (photobooth kiosk)
│   │   ├── src/
│   │   │   ├── main.ts           # Electron main process
│   │   │   ├── preload.ts        # IPC bridge (electronAPI)
│   │   │   ├── renderer.tsx      # React app entry point
│   │   │   ├── routes/           # React Router pages
│   │   │   ├── components/       # Shared UI components
│   │   │   ├── contexts/         # React context (PhotoboothContext)
│   │   │   ├── database/         # SQLite setup & queries
│   │   │   ├── types/            # TypeScript type definitions
│   │   │   └── utils/            # Supabase client, helpers
│   │   └── package.json
│   └── web/                  # TanStack Start web app (API + marketing site)
│       ├── src/
│       │   ├── start.ts          # Server entry point
│       │   ├── router.tsx        # TanStack Router config
│       │   ├── routes/           # File-based routes + API endpoints
│       │   ├── services/         # Email service + templates
│       │   ├── usecases/         # Business logic (use case pattern)
│       │   ├── repositories/     # Data access layer
│       │   ├── middleware/       # CORS, logging
│       │   └── utils/            # Supabase clients
│       └── package.json
```

**Package Manager:** pnpm (v10.18.2)
**Node.js:** >= 24.10
**Dev Scripts:**
- `pnpm fe` — run frontend (Electron)
- `pnpm wb` — run web app
- `pnpm dev` — run both concurrently

---

## Frontend App (Electron)

### Frontend Technology Stack

| Technology        | Purpose                          |
|-------------------|----------------------------------|
| Electron 39       | Desktop app shell                |
| React 19.2        | UI framework                     |
| React Router      | Client-side routing (HashRouter) |
| Tailwind CSS 4.1  | Styling                          |
| simple-keyboard   | On-screen touch keyboard         |
| SQLite (native)   | Local data persistence           |
| Supabase JS       | Cloud photo upload               |

### User Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│  Home   │───>│ Camera  │───>│  Quiz   │───>│  Form   │───>│ Loading  │───>│ Result  │
│   /     │    │ /camera │    │ /quiz   │    │ /form   │    │ /loading │    │ /result │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └──────────┘    └─────────┘
 Tap to         Capture 2      Personality    Collect user    Composite       Display,
 enter          photos         quiz (4 Qs)    info + consent  image build     print, email

                                                              Hidden admin route: /data (Cmd+D)
```

### Route Details

#### 1. Home (`/`) — `routes/index.tsx`

- Landing screen with "Tap to enter" button
- Background image display
- Single action: navigate to `/camera`

#### 2. Camera (`/camera`) — `routes/camera.tsx`

- Captures **2 photos** in sequence using the `getUserMedia` Web API
- **9:16 aspect ratio** (portrait orientation, kiosk display)
- Features:
  - Live camera preview with **mirrored display** (selfie mode)
  - **3-2-1 countdown timer** before each capture
  - Frame overlay (`/images/frame.png`) composited on canvas
  - Photos positioned at vertical offsets: `[318, 798]`
  - Maximum **2 retakes** allowed (`MAX_RETAKE_COUNT = 2`)
- Canvas compositing: draws video frames + overlay frame onto a single canvas
- Captured photos stored as **base64 strings** in `PhotoboothContext.originalPhotos`
- Navigates to `/quiz` after both photos are captured

#### 3. Quiz (`/quiz`) — `routes/quiz.tsx`

- Interactive personality quiz with **4 questions**
- Question types:
  - **Q1:** Multiple choice with images (scent selection)
  - **Q2–Q4:** Single choice text-based questions
- Scoring determines a user **archetype** via weighted logic:
  - Primary archetypes: `morning`, `midday`, `night`
  - Hybrid archetypes: `brunch`, `golden`, `chill`
- Result stored in `PhotoboothContext.quizResult`
- Navigates to `/form`

#### 4. Form (`/form`) — `routes/form.tsx`

- Collects user information:
  - **Name** (required)
  - **Email** (validated with regex)
  - **Phone** (Indonesian format: `(\+62|62|0)[0-9\-]{9,15}`)
  - **Consent checkbox** (required)
- **On-screen keyboard** (`SimpleKeyboard` component) for touch/kiosk input
- All fields validated before allowing submission
- Data stored in `PhotoboothContext.userInfo`
- Navigates to `/loading`

#### 5. Loading (`/loading`) — `routes/loading.tsx`

- Progress bar animation (15 seconds in production, 1 second in dev)
- **Final image compositing** on a **1280x1920 canvas**:
  1. Draws 2 captured photos at fixed positions
  2. Applies archetype-specific frame (`/images/frame-1.png` through `frame-6.png`)
  3. Adds personalized text content using custom font "LOccitaneSerif":
     - Randomly selects 2 content types from archetype data
     - Content categories: color, soundtrack, gift, craving, numbers, prediction
- Final composite saved to `PhotoboothContext.finalPhoto`
- Navigates to `/result`

#### 6. Result (`/result`) — `routes/result.tsx`

- Displays the final composite photo
- **Automatic actions (on mount):**
  1. Saves photo to local filesystem (`userData/photos/`)
  2. Saves record to SQLite database (photo path, quiz result, user info)
  3. Auto-prints after 1-second delay (production only)
- **User actions:**
  - **"Email Result"** button — triggers the cloud upload + email flow
  - **"Back to Home"** — resets context and navigates to `/`
- Dev-only: Download and Print debug buttons
- After email or timeout, navigates back to home

#### 7. Data (`/data`) — `routes/data.tsx` (Hidden Admin)

- Admin view to browse all locally saved photo results
- Loads data from SQLite database
- Accessible via keyboard shortcut: `Cmd/Ctrl+D`

### State Management

All transient session data is held in **PhotoboothContext** (React Context):

```typescript
interface PhotoboothContextType {
  originalPhotos: string[];        // 2 base64 photos from camera
  finalPhoto: string | null;       // Final composite image (base64)
  quizResult: {
    archetype: Archetype;          // e.g. "morning", "golden", etc.
  } | null;
  userInfo: {
    name: string;
    email: string;
    phone: string;
  } | null;
  reset(): void;                   // Clear all state for next user
}
```

Data flows through context across routes:
- **Camera** writes `originalPhotos`
- **Quiz** writes `quizResult`
- **Form** writes `userInfo`
- **Loading** reads all three, writes `finalPhoto`
- **Result** reads everything, triggers save/print/email

### Electron IPC Communication

The **preload script** (`preload.ts`) bridges the renderer (React) and main process via `contextBridge`:

```typescript
window.electronAPI = {
  // System
  platform: string;                           // OS detection
  isElectron: boolean;                         // Environment flag

  // Printing
  print(filePath: string): Promise<void>;      // Send to printer

  // File System
  savePhotoFile(base64: string, fileName: string): Promise<string>;

  // Database (SQLite)
  db: {
    savePhotoResult(document: object): Promise<void>;
    getAllPhotoResults(): Promise<PhotoResult[]>;
    getPhotoResultById(id: string): Promise<PhotoResult>;
  };

  // Navigation (from menu shortcuts)
  onNavigateToHome(callback: () => void): void;   // Cmd+H
  onNavigateToData(callback: () => void): void;    // Cmd+D
};
```

**Main process IPC handlers** (`main.ts`):

| IPC Channel                | Handler                        |
|----------------------------|--------------------------------|
| `save-photo-file`          | `savePhotoFileToFilesystem()`  |
| `db-save-photo-result`     | `savePhotoResultToSQLite()`    |
| `db-get-all-photo-results` | Retrieves all records           |
| `db-get-photo-result-by-id`| Retrieves single record         |
| `print-window`             | Creates hidden BrowserWindow, generates print HTML, sends to printer |
| `print-window-pdf`         | Generates PDF (dev/debug)      |

### Local Persistence (SQLite)

**Database location:** `app.getPath('userData')/photobooth.db`

**Schema:**

```sql
CREATE TABLE photo_results (
  id          TEXT PRIMARY KEY,
  photo_path  TEXT NOT NULL,
  quiz_result TEXT NOT NULL,    -- JSON string
  user_info   TEXT NOT NULL,    -- JSON string
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

**Photo files location:** `app.getPath('userData')/photos/`

---

## Web App (TanStack Start)

### Web Technology Stack

| Technology       | Purpose                          |
|------------------|----------------------------------|
| TanStack Start   | Full-stack React SSR framework   |
| TanStack Router  | File-based routing               |
| Supabase         | PostgreSQL + Storage             |
| Resend           | Transactional email delivery     |
| React Email      | Email template components        |
| Sentry           | Error tracking                   |
| Vite             | Build tool                       |

### Routes & API Endpoints

| Route               | Type     | Description                        |
|----------------------|----------|------------------------------------|
| `/`                  | Page     | Marketing homepage (hero, features, CTA) |
| `/api/photo`         | API POST | Receives photo data, saves user, sends email |
| `/demo/*`            | Pages    | Various demo/test routes           |

### Backend Architecture

The web backend follows a **clean architecture** pattern:

```
routes/api.photo.ts          # HTTP layer — validation, auth, response
    │
    ▼
usecases/submit-photo.ts     # Business logic — orchestrates the flow
    │
    ├──▶ repositories/user.repository.ts    # Data access — Supabase INSERT
    │
    └──▶ services/email.service.tsx          # Email delivery — Resend API
              │
              └──▶ services/emails/photo-result.tsx  # React Email template
```

---

## Complete Data Flow

### Photo Capture to Final Composite

```
1. getUserMedia() → camera stream
2. Draw video frame onto canvas (mirrored)
3. Composite frame overlay on top
4. Store as base64 → PhotoboothContext.originalPhotos[0]
5. Repeat for second photo → PhotoboothContext.originalPhotos[1]
6. Quiz answers → weighted scoring → archetype determined
7. User fills form → name, email, phone validated
8. Loading page creates 1280x1920 canvas:
   a. Draw originalPhotos[0] at position offset [318]
   b. Draw originalPhotos[1] at position offset [798]
   c. Draw archetype-specific frame overlay
   d. Randomly select 2 content types from archetype data
   e. Render personalized text with custom font
9. Export canvas as base64 → PhotoboothContext.finalPhoto
```

### Email Delivery Flow

```
[Electron — Result Page]
│
├── 1. Convert finalPhoto base64 → Blob
│
├── 2. Upload to Supabase Storage
│      Bucket: "loccitane-photobooth"
│      Path:   "public/{uuid}-{sanitized-name}.png"
│
├── 3. HTTP POST → {API_BASE_URL}/api/photo
│      Headers: { Authorization: "Bearer {API_CLIENT_KEY}" }
│      Body:    { photoPath, name, email, phone }
│
▼
[Web Backend — api.photo.ts]
│
├── 4. Validate API key (Bearer token check)
├── 5. Sanitize name (strip < >), validate email & phone
├── 6. Normalize phone to +62 format
│
▼
[SubmitPhotoUseCase.execute()]
│
├── 7. UserRepository.save()
│      → INSERT INTO "users" (name, email, phone, photo_path, created_at)
│      → Uses Supabase admin client (service key)
│
├── 8. Get public URL for uploaded photo
│      → supabase.storage.from('loccitane-photobooth').getPublicUrl(path)
│
├── 9. EmailService.sendPhotoResult()
│      → Resend API call
│      → From: "L'Occitane <no-reply@loccitane.id>"
│      → To: user's email
│      → Subject: "Your L'Occitane Provence Holiday Prediction"
│      → Template: PhotoResultEmail (React Email component)
│      → Idempotency key: "{email}-{filename}"
│
▼
[Response]
│
└── 10. Return { photoUrl, message } → Electron shows success toast
```

### Local Save & Print Flow

```
[Electron — Result Page (on mount)]
│
├── 1. electronAPI.savePhotoFile(base64, fileName)
│      → Main process saves to userData/photos/{fileName}
│
├── 2. electronAPI.db.savePhotoResult({
│        id, photo_path, quiz_result, user_info, timestamps
│      })
│      → Main process INSERTs into SQLite
│
└── 3. electronAPI.print(filePath)        [production only, 1s delay]
       → Main process creates hidden BrowserWindow
       → Generates HTML with photo embedded
       → Sends to system printer (DS-RX1 thermal printer)
```

---

## Key Integrations

### Supabase

**Two separate clients exist across the apps:**

| Client       | Location              | Key Used              | Purpose                    |
|--------------|-----------------------|-----------------------|----------------------------|
| Frontend     | `frontend/src/utils/supabase.ts` | Anon key     | Upload photos to Storage   |
| Web (admin)  | `web/src/utils/supabase-admin.ts`| Service role key | Database writes (users table) |
| Web (server) | `web/src/utils/supabase.ts`      | Anon key     | SSR session management     |

**Storage bucket:** `loccitane-photobooth`
**Upload path pattern:** `public/{uuid}-{sanitized-name}.png`

**Database table (`users`):**

| Column      | Type      | Description              |
|-------------|-----------|--------------------------|
| id          | PK        | Auto-generated           |
| name        | TEXT      | User's name              |
| email       | TEXT      | User's email             |
| phone       | TEXT      | User's phone (+62 format)|
| photo_path  | TEXT      | Storage path of photo    |
| created_at  | TIMESTAMP | Record creation time     |

### Resend (Email)

- **API Key:** `process.env.RESEND_API_KEY`
- **Sender:** `L'Occitane <no-reply@loccitane.id>`
- **Behavior:**
  - Production: sends real emails via Resend API
  - Development: logs email content to console (no send)
- **Template:** `PhotoResultEmail` — styled HTML email with download button and direct photo link
- **Idempotency:** keyed by `{email}-{filename}` to prevent duplicate sends

### Printing

- Target printer: **DS-RX1** (thermal photo printer)
- Mechanism: Electron creates a hidden `BrowserWindow`, injects HTML with the photo, and calls `webContents.print()`
- PDF generation available as a dev/debug alternative

---

## Archetype System

The quiz produces one of **6 archetypes**, each with unique theming:

| Archetype | Type    | Frame File    |
|-----------|---------|---------------|
| morning   | Primary | frame-1.png   |
| midday    | Primary | frame-2.png   |
| night     | Primary | frame-3.png   |
| brunch    | Hybrid  | frame-4.png   |
| golden    | Hybrid  | frame-5.png   |
| chill     | Hybrid  | frame-6.png   |

Each archetype defines personalized content across these categories:
- **Color** — a signature color
- **Soundtrack** — a song recommendation
- **Gift** — a L'Occitane product suggestion
- **Craving** — a food/drink craving
- **Numbers** — lucky numbers
- **Prediction** — a Provence-themed fortune

During loading, **2 random content types** are selected and rendered onto the final composite image.

---

## Security

| Concern              | Implementation                                    |
|----------------------|---------------------------------------------------|
| API Authentication   | Bearer token (`API_CLIENT_KEY`) on `/api/photo`   |
| Input Sanitization   | Name stripped of `<>`, email/phone regex validated |
| Phone Normalization  | Converted to `+62` international format           |
| Supabase Access      | Service role key server-side only, anon key client-side |
| Environment Secrets  | All keys via `process.env` / `.env` files         |
| Kiosk Security       | Fullscreen mode, no exposed dev tools in production|
