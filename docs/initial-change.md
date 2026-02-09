Implementation Complete
Files Deleted
apps/frontend/src/routes/quiz.tsx
apps/frontend/src/hooks/useQuiz.tsx
Files Created
apps/frontend/src/routes/select.tsx — New theme selection page (Pitcrew / MotoGP / F1)
apps/web/src/services/ai-generation.service.ts — Replicate face-swap service
apps/web/src/routes/api.ai-generate.ts — POST /api/ai-generate endpoint
Files Modified
File	What Changed
PhotoboothContext.tsx	Replaced archetype system with RacingTheme type + RACING_THEMES config
renderer.tsx	Swapped quiz route for /select route
index.tsx	Navigates to /select instead of /camera
camera.tsx	Simplified to 1-photo capture, navigates to /form
loading.tsx	Complete rewrite — calls AI API, applies racing frame
result.tsx	quizResult → selectedTheme references
data.tsx	Updated column from "Archetype" to "Theme"
database.ts	Updated PhotoResultDocument interface
sqlite.ts	Maps SQL column to new selectedTheme field
package.json	Added replicate dependency
Before You Can Run
Install deps: pnpm install in apps/web/

Set env vars in apps/web/.env:


REPLICATE_API_KEY=<your-key>
RACING_TEMPLATE_PITCREW_URL=<url>
RACING_TEMPLATE_MOTOGP_URL=<url>
RACING_TEMPLATE_F1_URL=<url>
Provide assets (placeholder paths are set up):

Theme previews: public/images/theme-pitcrew.png, theme-motogp.png, theme-f1.png
Racing frames: public/images/frame-racing-pitcrew.png, frame-racing-motogp.png, frame-racing-f1.png
Template images for face swap: hosted on Supabase/CDN (URLs go in env vars)
Marketing page (apps/web/src/routes/index.tsx) still has old branding copy — update when you're ready with racing-themed content.