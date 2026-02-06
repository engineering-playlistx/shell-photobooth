# Change Plan: Convert to AI Racing Photobooth

## Context

The current app is a L'Occitane-branded photobooth that captures 2 photos, runs a personality quiz (6 archetypes), composites a final image locally with archetype-specific frames + text, then saves/prints/emails the result.

We're converting it into an **AI-generated racing photobooth**: user picks a racing theme (Pitcrew / MotoGP / F1), takes 1 photo, and gets an AI face-swapped result via Replicate — all processed through the web backend.

**New flow:** `/ → /select → /camera → /form → /loading → /result`

---

## Stage 1: Remove Quiz System

### Delete files
- `apps/frontend/src/routes/quiz.tsx`
- `apps/frontend/src/hooks/useQuiz.tsx`

### Delete assets (old archetype frames + quiz images)
- `apps/frontend/public/images/frame-1.png` through `frame-6.png`
- `apps/frontend/public/images/scent-1.png`, `scent-2.png`, `scent-3.png`
- `apps/frontend/public/images/bg-card.png`

---

## Stage 2: Update PhotoboothContext

**File:** `apps/frontend/src/contexts/PhotoboothContext.tsx`

- Remove: `Archetype` type, `ArchetypeContent` type, `CONTENT_TYPES`, entire `ARCHETYPES` object (~254 lines), `QuizResult` interface
- Add new types:
  ```ts
  export type RacingTheme = "pitcrew" | "motogp" | "f1";

  export const RACING_THEMES: Record<RacingTheme, { title: string; description: string }> = {
    pitcrew: { title: "Pit Crew", description: "Join the elite racing support team" },
    motogp: { title: "MotoGP Racer", description: "Feel the speed on two wheels" },
    f1: { title: "F1 Racer", description: "Experience Formula 1 glory" },
  };
  ```
- Rename in context interface: `quizResult` → `selectedTheme` (type `{ theme: RacingTheme } | null`)
- Rename setter: `setQuizResult` → `setSelectedTheme`
- Update provider state + reset function accordingly

---

## Stage 3: Create Theme Selection Page

**New file:** `apps/frontend/src/routes/select.tsx`

- Display 3 large, touch-friendly cards for Pitcrew / MotoGP / F1
- Each card shows a preview image + title + description
- On selection: store in context via `setSelectedTheme({ theme })`, navigate to `/camera`
- Back button to `/`
- Reuse existing styling patterns (bg image, 9:16 aspect ratio layout, font-sans)
- Preview images: `/images/theme-pitcrew.png`, `theme-motogp.png`, `theme-f1.png` (placeholders for now)

---

## Stage 4: Simplify Camera to 1 Photo

**File:** `apps/frontend/src/routes/camera.tsx`

- Change from capturing 2 photos to **1 photo**
- Remove `VIDEO_VERTICAL_OFFSET` array logic — use a single centered position
- Remove second-photo capture flow (the offset switch from 318→798)
- After capture: enable "Next" immediately (no waiting for photo #2)
- Update `handleNext`: navigate to `/form` instead of `/quiz`
- Keep: countdown timer, mirrored preview, retake functionality, frame overlay for preview

---

## Stage 5: Update Routing

**File:** `apps/frontend/src/renderer.tsx`

- Remove `QuizPage` import and route
- Add `SelectPage` import and `/select` route
- Route order: `index → /select → /camera → /form → /loading → /result → /data`

**File:** `apps/frontend/src/routes/index.tsx`

- Change navigation from `/camera` to `/select`

---

## Stage 6: New Backend API Endpoint for AI Generation

### Add dependency
**File:** `apps/web/package.json` — add `"replicate": "^1.0.1"`

### New file: `apps/web/src/services/ai-generation.service.ts`

- Initialize Replicate client with `process.env.REPLICATE_API_KEY`
- Map theme → template image URL (from env vars: `RACING_TEMPLATE_PITCREW_URL`, etc.)
- Method `generateFaceSwap({ userPhotoUrl, theme })`:
  - Calls Replicate face-swap model (e.g. `lucataco/face-swap`)
  - Input: `source_image` (user photo URL), `target_image` (racing template URL)
  - Returns generated image URL
- Method to download result and convert to base64

### New file: `apps/web/src/routes/api.ai-generate.ts`

- POST `/api/ai-generate`
- Validate Bearer token (reuse `validateApiKey` pattern from `api.photo.ts`)
- Request body: `{ userPhotoBase64: string, theme: RacingTheme }`
- Flow:
  1. Upload user photo to Supabase Storage (temp folder) to get a public URL for Replicate
  2. Call `AIGenerationService.generateFaceSwap()`
  3. Download Replicate result, convert to base64
  4. Return `{ generatedImageBase64: string }`
- Error handling: timeout, Replicate errors, invalid theme

### Environment variables to add
```
REPLICATE_API_KEY=<key>
RACING_TEMPLATE_PITCREW_URL=<url>
RACING_TEMPLATE_MOTOGP_URL=<url>
RACING_TEMPLATE_F1_URL=<url>
```

---

## Stage 7: Rewrite Loading Page

**File:** `apps/frontend/src/routes/loading.tsx`

- Remove all canvas compositing logic (`processImageWithFrame`, `getFrameNumberFromArchetype`, `getWrappedLines`, `drawWrappedLines`)
- Remove `ARCHETYPES`/`CONTENT_TYPES` imports
- New logic:
  1. On mount, call `POST /api/ai-generate` with `originalPhotos[0]` + `selectedTheme.theme`
  2. Show progress updates with status text: "Uploading photo..." → "AI is generating your photo..." → "Applying frame..."
  3. On response, apply racing frame overlay via canvas compositing (AI result + frame PNG)
  4. Set `finalPhoto` in context
  5. Navigate to `/result`
- Frame overlay mapping:
  ```ts
  const frameMap = {
    pitcrew: "/images/frame-racing-pitcrew.png",
    motogp: "/images/frame-racing-motogp.png",
    f1: "/images/frame-racing-f1.png",
  };
  ```
- Keep: video background, progress bar UI (but make it dynamic based on real progress, not fixed timer)
- Handle errors: show retry option or error message with "back to home"

---

## Stage 8: Update Result Page

**File:** `apps/frontend/src/routes/result.tsx`

- Line 40: Change `quizResult` → `selectedTheme` in destructuring
- Line 95: Update guard `!quizResult` → `!selectedTheme`
- Line 224: Update `savePhotoResult` call — pass `selectedTheme` instead of `quizResult`
- Line 277: Update useEffect dependency — `quizResult` → `selectedTheme`
- Line 291: Update conditional render — `!!quizResult` → `!!selectedTheme`
- Keep everything else: email flow, auto-save, auto-print, download, toast system

---

## Stage 9: Update Database Utility

**File:** `apps/frontend/src/utils/database.ts`

- Change import: `Archetype` → `RacingTheme`
- Update `PhotoResultDocument` interface:
  ```ts
  selectedTheme: { theme: RacingTheme }  // was: quizResult: { archetype: Archetype }
  ```
- `savePhotoResult` param type automatically updates via `Omit<PhotoResultDocument, ...>`

**Note:** SQLite stores this as JSON string — no migration needed, new records will just have the new shape. Old records in the DB will have the old `quizResult` field but that's fine for an event app.

---

## Stage 10: Update Data/Admin Page

**File:** `apps/frontend/src/routes/data.tsx`

- Update any references from `quizResult.archetype` to `selectedTheme.theme` in the table display
- Update column header from "Archetype" to "Theme"

---

## Assets Required (User Will Provide)

| Asset | Path | Dimensions | Purpose |
|-------|------|-----------|---------|
| Theme preview (Pitcrew) | `public/images/theme-pitcrew.png` | ~400x600 | Selection page card |
| Theme preview (MotoGP) | `public/images/theme-motogp.png` | ~400x600 | Selection page card |
| Theme preview (F1) | `public/images/theme-f1.png` | ~400x600 | Selection page card |
| Frame overlay (Pitcrew) | `public/images/frame-racing-pitcrew.png` | 1280x1920 | Result frame overlay |
| Frame overlay (MotoGP) | `public/images/frame-racing-motogp.png` | 1280x1920 | Result frame overlay |
| Frame overlay (F1) | `public/images/frame-racing-f1.png` | 1280x1920 | Result frame overlay |
| Template (Pitcrew) | Hosted on Supabase/CDN | Any (for Replicate) | Face swap target |
| Template (MotoGP) | Hosted on Supabase/CDN | Any (for Replicate) | Face swap target |
| Template (F1) | Hosted on Supabase/CDN | Any (for Replicate) | Face swap target |

Placeholder images will be used during development until the user provides final assets.

---

## Implementation Order

1. **Stage 2** — Update context (foundation, everything depends on this)
2. **Stage 1** — Delete quiz files
3. **Stage 3** — Create select page
4. **Stage 4** — Simplify camera
5. **Stage 5** — Update routing + index navigation
6. **Stage 9** — Update database utility
7. **Stage 8** — Update result page references
8. **Stage 10** — Update data page
9. **Stage 6** — Backend AI endpoint + Replicate service
10. **Stage 7** — Rewrite loading page (depends on backend being ready)

---

## Verification

1. **Frontend flow:** Navigate Home → Select → Camera → Form → Loading → Result — confirm no broken routes
2. **Context:** Verify `selectedTheme` is set in select page, readable in loading/result
3. **Camera:** Confirm single photo capture works, retake works, photo stored in context
4. **Backend:** Test `POST /api/ai-generate` with a sample base64 image + theme — confirm Replicate call succeeds
5. **Loading:** Confirm AI-generated image returns, frame overlay applies, `finalPhoto` is set
6. **Result:** Confirm auto-save to SQLite with new `selectedTheme` field, email sends, print works
7. **Data page:** Confirm admin view shows "Theme" column with correct values

---

## Summary of All File Changes

### Files to DELETE (2 code files + ~10 assets)
| File | Reason |
|------|--------|
| `apps/frontend/src/routes/quiz.tsx` | Quiz removed |
| `apps/frontend/src/hooks/useQuiz.tsx` | Quiz removed |
| `apps/frontend/public/images/frame-[1-6].png` | Old archetype frames |
| `apps/frontend/public/images/scent-[1-3].png` | Quiz scent images |
| `apps/frontend/public/images/bg-card.png` | Quiz card background |

### Files to CREATE (2 frontend + 2 backend + 9 assets)
| File | Purpose |
|------|---------|
| `apps/frontend/src/routes/select.tsx` | Theme selection page |
| `apps/frontend/public/images/theme-*.png` (x3) | Theme preview images |
| `apps/frontend/public/images/frame-racing-*.png` (x3) | Result frame overlays |
| `apps/frontend/public/images/template-*.png` (x3) | Face swap templates |
| `apps/web/src/routes/api.ai-generate.ts` | AI generation API endpoint |
| `apps/web/src/services/ai-generation.service.ts` | Replicate integration service |

### Files to MODIFY (8 files)
| File | Scope of Change |
|------|----------------|
| `apps/frontend/src/contexts/PhotoboothContext.tsx` | **Major** — replace archetype system with racing themes |
| `apps/frontend/src/routes/loading.tsx` | **Major** — replace canvas compositing with AI API call |
| `apps/frontend/src/routes/camera.tsx` | **Major** — simplify to single photo capture |
| `apps/frontend/src/renderer.tsx` | Minor — update routes |
| `apps/frontend/src/routes/index.tsx` | Minor — change nav target to `/select` |
| `apps/frontend/src/routes/result.tsx` | Minor — rename `quizResult` → `selectedTheme` |
| `apps/frontend/src/utils/database.ts` | Minor — update `PhotoResultDocument` type |
| `apps/frontend/src/routes/data.tsx` | Minor — update column display |
| `apps/web/package.json` | Minor — add `replicate` dependency |
