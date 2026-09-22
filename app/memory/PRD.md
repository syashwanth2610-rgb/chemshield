# ChemShield AI — Chemical Exposure Risk Mapper

## Original Problem
Build a premium AI-powered web app "CHEMSHIELD AI" that analyzes a photo of a chemical product label and estimates its potential exposure risk. Hackathon prototype — must display "AI-generated risk assessment — verify with SDS".

## Architecture
- **Frontend**: React 19 + Tailwind + shadcn/ui + Recharts + Lucide + Sonner. `@/` alias for src.
- **Backend**: FastAPI (Python) with routes prefixed `/api`, motor + MongoDB.
- **AI**: Gemini 3 Flash Vision via `emergentintegrations` + Emergent Universal Key.
- **Storage**: Emergent Object Storage (image uploads).
- **Auth**: JWT (bcrypt) + Emergent Google OAuth (session_token cookie + Bearer).
- **Theme**: dark (default) + light toggle in Settings.

## User Personas
1. **Worker / student** – wants to quickly know how risky a chemical container is before handling.
2. **Safety officer** – needs a quick visual dashboard + printable report.

## Core Requirements (static)
- Scan a photo of a product label → identify hazards + risk score + safety tips.
- Store scan history per user.
- Show visual dashboard, risk map, safety library, printable report.
- Never provide dangerous handling procedures or exact exposure limits.

## Implemented (2026-09-15)
- Landing page (hero, how-it-works, why-it-matters, CTA, footer), animated molecule particles, gradient text.
- JWT signup + login, Emergent Google OAuth callback.
- Dashboard: stats cards, risk distribution donut chart, recent activity list.
- Scanner: upload + live camera capture, animated scanning steps.
- Result: animated circular risk gauge, factor bars, hazards, exposure routes, AI insight card, recommendations.
- Scan History (table with view/delete).
- Risk Map: stylized SVG with animated markers + filters.
- Safety Library: categories + hazard symbol guide.
- Reports grid + printable per-scan Report.
- Profile + Settings (dark/light, notifications).
- Backend: 17/17 pytest tests pass (auth, scans, files, stats).
- Safety disclaimers on every risk surface.

## Prioritized Backlog
- **P0** — none open.
- **P1** — Streaming AI analysis with SSE token-by-token progress overlay.
- **P1** — Real geospatial risk map (map tiles + backend location data).
- **P2** — Team workspaces & shared scan archives.
- **P2** — Actual PDF export (currently uses browser print).
- **P2** — Multilingual UI (i18n).
