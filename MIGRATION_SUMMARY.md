# Migration Summary — AI City Navigator (March 16, 2026)

## Why this file exists
This is a complete handoff for the next AI agent in a fresh chat on another laptop (with npm installed) so they can continue work immediately and finish real frontend+backend wiring for hackathon demo readiness.

---

## Current Objective
Convert the currently mocked Next.js frontend into a real flow that:
1) accepts user travel inputs,
2) calls real backend generation stages (research/planner/prompt/canvas),
3) shows real progress in loading UI,
4) renders generated itinerary/apps/budget/media,
5) supports lightweight itinerary tweaks,
6) outputs a markdown “frontend dump” + generated images.

---

## What was implemented already

### Backend (Python)
Main file: `backend/api.py`

Key upgrades already present:
- Added staged any-city pipeline:
   - `--research-mode mock|live` (live uses Nova Pro + web snippets)
   - `--planner-mode mock|live` (Nova Lite)
   - `--prompt-mode template|live`
   - `--canvas-mode skip|live` (Nova Canvas)
- Added extra user context fields:
   - `--travel-dates`
   - `--trip-notes`
   - travel month inference from dates
- Added robust model JSON handling:
   - accepts fenced JSON
   - accepts object or array
   - handles `media_scenes` and `media_prompts`
- Added graceful fail-open behavior for prompt polish parse issues.
- Added destination-grounding in canvas prompts to reduce wrong-city visuals.
- Added configurable image count:
   - `--max-images N`
   - `--max-images 0` means all scenes
- Added runtime preflight and clearer Bedrock credential/auth/model errors.
- Added progress events for frontend streaming:
   - `--progress-json`
   - emits JSON lines like `{ "event":"progress", "stage":..., ... }`
- Added frontend-dump markdown export:
   - `backend/outputs/<output_name>_frontend_dump.md`

### Frontend + Next API wiring (TypeScript)

Added server routes:
- `app/api/generate-trip/route.ts`
   - spawns Python backend process
   - streams NDJSON progress/result events
   - loads generated plan JSON + image filenames
- `app/api/generated-asset/route.ts`
   - serves generated image files from `backend/outputs`

Added shared types:
- `lib/trip-types.ts`

Updated UI flow:
- `app/page.tsx`
   - replaced fake timeout flow with real stream consumption
   - progress state driven by backend events
   - supports re-generation using tweak notes
- `components/HeroSection.tsx`
   - added form fields:
      - travel dates
      - traveller style
      - freeform trip notes
- `components/AIGenerationLoading.tsx`
   - now externally controlled by real stage state (not fake timer)
- `components/ItineraryPreview.tsx`
   - now renders real plan data + tweak textarea submit action
- `components/TripTimeline.tsx`
   - now maps from generated itinerary items
- `components/RecommendedAppsSection.tsx`
   - now maps from generated recommended apps
- `components/SmartBudgetTracker.tsx`
   - now maps from generated budget breakdown and notes
- `components/VideoPreview.tsx`
   - now shows generated image gallery/slideshow
   - note: still image-based, not real video generation

---

## Important caveat from this environment
In this workspace run, Node/npm were missing, so Next lint/build could not be executed here.

That means the next agent must validate and fix any remaining TS/runtime issues on the npm-enabled laptop.

---

## Files changed (high priority review list)
- `backend/api.py`
- `app/api/generate-trip/route.ts`
- `app/api/generated-asset/route.ts`
- `lib/trip-types.ts`
- `app/page.tsx`
- `components/HeroSection.tsx`
- `components/AIGenerationLoading.tsx`
- `components/ItineraryPreview.tsx`
- `components/TripTimeline.tsx`
- `components/RecommendedAppsSection.tsx`
- `components/SmartBudgetTracker.tsx`
- `components/VideoPreview.tsx`

---

## Step-by-step instructions for the next agent (fresh chat)

### 1) Environment setup (must do first)
Run in repo root:

```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install boto3
```

If additional Python packages are missing during runtime, install them in `.venv`.

### 2) AWS setup
Use the same environment as backend runtime:

```bash
aws configure
```

Then verify:

```bash
.venv/bin/python3 -c "import boto3; c=boto3.Session().get_credentials(); print(bool(c), getattr(c,'method',None) if c else None)"
```

Confirm Bedrock model access in `us-east-1`:
- `amazon.nova-pro-v1:0`
- `amazon.nova-lite-v1:0`
- `amazon.nova-canvas-v1:0`

### 3) Backend sanity test (CLI)

```bash
.venv/bin/python3 backend/api.py \
   --destination "Toronto" \
   --duration "4 days" \
   --budget 2200 \
   --interests "food,culture,photography" \
   --travel-dates "2026-08-10 to 2026-08-14" \
   --travel-style balanced \
   --trip-notes "Prefer easy walking pace; avoid intense heat in daytime" \
   --research-mode live \
   --planner-mode live \
   --prompt-mode live \
   --canvas-mode live \
   --max-images 4 \
   --output-name toronto_live_check \
   --debug \
   --quiet-plan-print
```

Expected outputs:
- `backend/outputs/toronto_live_check.json`
- `backend/outputs/toronto_live_check_frontend_dump.md`
- `backend/outputs/toronto_live_check_scene_*.png`

### 4) Run frontend

```bash
npm run dev
```

Open `http://localhost:3000` and perform full flow from Hero form.

### 5) Validate real wiring in UI
Checklist:
- Loading modal shows real stage progress (research/planner/prompt/canvas).
- Generated itinerary content appears in:
   - itinerary summary
   - timeline
   - app recommendations
   - budget section
- Gallery section displays generated PNGs via `/api/generated-asset` URLs.
- Tweak textbox re-runs generation and updates output.

### 6) Fix-first items if anything breaks
Prioritized fixes for next agent:
1. Ensure Next route can find Python interpreter robustly on target OS.
2. Ensure streamed NDJSON parsing handles noisy stdout lines safely.
3. Ensure route returns clear errors when Python exits non-zero.
4. Ensure `trip_notes` are actually reflected in planner behavior (prompt weighting may need strengthening).
5. Ensure generated image count aligns with itinerary scenes (`--max-images` handling already added; verify in UI run).

---

## Known remaining product gaps (not blockers for MVP demo)
- “Video” section is currently an image slideshow, not real AI video generation.
- Research stage uses lightweight web snippets + Nova Pro synthesis; not full production-grade travel data APIs yet.
- Budget section maps string guidance, not strict numeric accounting.

---

## Suggested first prompt for next fresh-chat agent
Use this exact prompt on the new laptop:

> Continue from MIGRATION_SUMMARY.md in this repo. Validate and finish the real frontend-backend integration end-to-end. Start by running npm install, then run next dev and test the Generate flow from the UI. Fix any TypeScript/runtime errors in the new files (`app/api/generate-trip/route.ts`, `app/api/generated-asset/route.ts`, `app/page.tsx`, and updated components). Ensure loading progress is driven by backend stage events, itinerary/apps/budget/media render from real generated data, tweak notes trigger a regeneration, and generated images display in the gallery. Keep changes minimal and provide final run commands + verification checklist.

---

## Final note for team
The architecture direction is correct for hackathon MVP:
- Nova Pro for research synthesis
- Nova Lite for structured planning
- Nova Canvas for visuals
- Next.js route as orchestration bridge

Primary remaining work is execution validation on a fully provisioned Node/npm machine.
