# AI City Navigator — Hackathon Runbook (5-Minute Setup)

Use this when you need the app running quickly with real AI generation.

## 1) Open the repo

```bash
cd /path/to/AI-City-Navigator-
```

## 2) Install frontend dependencies

```bash
npm install
```

## 3) Create Python environment and install backend dependency

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install boto3
```

## 4) Configure AWS credentials (same environment)

```bash
aws configure
```

Quick credential check:

```bash
.venv/bin/python3 -c "import boto3; c=boto3.Session().get_credentials(); print(bool(c), getattr(c,'method',None) if c else None)"
```

Expected: `True` and a credential method (for example `shared-credentials-file`).

## 5) Start the web app

```bash
npm run dev
```

Open:
- http://localhost:3000

## 6) Generate a real trip from UI

In the Hero form, fill:
- Destination city
- Duration
- Budget
- Interests
- Travel dates
- Traveller style
- Optional notes (health/pacing/preferences)

Then click **Generate My AI Trip**.

You should see:
- Real loading stages (research/planner/prompt/canvas)
- Real itinerary sections
- Real recommended apps
- Real budget guidance
- Real generated image gallery

## 7) Where outputs are saved

Backend writes files to:
- `backend/outputs/<output_name>.json`
- `backend/outputs/<output_name>_frontend_dump.md`
- `backend/outputs/<output_name>_scene_*.png`

## Optional: Run backend directly from terminal (no frontend)

```bash
.venv/bin/python3 backend/api.py \
  --destination "Toronto" \
  --duration "4 days" \
  --budget 2200 \
  --interests "food,culture,photography" \
  --travel-dates "2026-08-10 to 2026-08-14" \
  --travel-style balanced \
  --trip-notes "Prefer easier pace and less heat exposure" \
  --research-mode live \
  --planner-mode live \
  --prompt-mode live \
  --canvas-mode live \
  --max-images 4 \
  --debug \
  --quiet-plan-print \
  --output-name toronto_demo
```

## Demo-Day Troubleshooting

### A) `python3: command not found` or exit code 127
Use your venv interpreter explicitly:

```bash
.venv/bin/python3 backend/api.py --help
```

### B) Credentials missing / access denied
- Re-run `aws configure`
- Ensure Bedrock model access is enabled in `us-east-1` for:
  - `amazon.nova-pro-v1:0`
  - `amazon.nova-lite-v1:0`
  - `amazon.nova-canvas-v1:0`

### C) Frontend loads but generation fails
- Confirm backend deps are installed in `.venv`
- Confirm Next route can run Python from repo root
- Re-run with backend CLI command above to isolate issue

### D) Only a few images generated
Increase or uncap image count in backend call:
- `--max-images 4` (fixed count)
- `--max-images 0` (all scenes)
