from __future__ import annotations

import argparse
import base64
import json
import os
import platform
import re
import sys
from urllib.parse import quote_plus
from urllib.request import Request, urlopen
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError, PartialCredentialsError


PLANNER_MODEL_ID = "amazon.nova-lite-v1:0"
RESEARCH_MODEL_ID = "amazon.nova-pro-v1:0"
CANVAS_MODEL_ID = "amazon.nova-canvas-v1:0"
DEFAULT_REGION = "us-east-1"
OUTPUT_DIR = Path(__file__).resolve().parent / "outputs"


def truncate_text(value: str, max_chars: int) -> str:
    if len(value) <= max_chars:
        return value
    hidden = len(value) - max_chars
    return f"{value[:max_chars]}... [truncated {hidden} chars]"


def debug_log(enabled: bool, label: str, payload: dict[str, Any] | None = None, max_chars: int = 1200) -> None:
    if not enabled:
        return
    print(f"\n[DEBUG] {label}")
    if payload is None:
        return

    serialized = json.dumps(payload, indent=2, default=str)
    print(truncate_text(serialized, max_chars))


def emit_progress(enabled: bool, stage: str, status: str, message: str) -> None:
    if not enabled:
        return
    print(json.dumps({"event": "progress", "stage": stage, "status": status, "message": message}), flush=True)


def get_live_api_stages(research_mode: str, planner_mode: str, prompt_mode: str, canvas_mode: str) -> list[str]:
    stages: list[str] = []
    if research_mode == "live":
        stages.append("research")
    if planner_mode == "live":
        stages.append("planner")
    if prompt_mode == "live":
        stages.append("prompt_polish")
    if canvas_mode == "live":
        stages.append("canvas")
    return stages


def _expected_aws_files_for_runtime() -> dict[str, str]:
    if os.name == "nt":
        base = Path(os.environ.get("USERPROFILE", str(Path.home()))) / ".aws"
    else:
        base = Path.home() / ".aws"
    return {"credentials": str(base / "credentials"), "config": str(base / "config")}


def _mask_access_key(access_key: str) -> str:
    if len(access_key) <= 8:
        return "*" * len(access_key)
    return f"{access_key[:4]}...{access_key[-4:]}"


def print_bedrock_preflight(region: str, live_api_stages: list[str]) -> bool:
    expected = _expected_aws_files_for_runtime()
    profile = os.environ.get("AWS_PROFILE") or os.environ.get("AWS_DEFAULT_PROFILE") or "default"

    print("\nBedrock preflight")
    print(f"- Python executable: {sys.executable}")
    print(f"- Runtime platform: {platform.system()} ({platform.platform()})")
    print(f"- Region: {region}")
    print(f"- Live stages requested: {', '.join(live_api_stages)}")
    print(f"- AWS profile: {profile}")
    print(f"- Expected credentials file: {expected['credentials']}")
    print(f"- Expected config file: {expected['config']}")

    session = boto3.Session(region_name=region)
    credentials = session.get_credentials()
    if credentials is None:
        print("- Credential visibility: none detected from this interpreter environment")
        print("  Run aws configure in this same environment or export AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.")
        return False

    method = getattr(credentials, "method", "unknown")
    try:
        frozen = credentials.get_frozen_credentials()
        masked_key = _mask_access_key(frozen.access_key or "")
    except Exception:
        masked_key = "unavailable"

    print(f"- Credential visibility: detected (provider={method}, access_key={masked_key})")
    return True


def build_bedrock_error_message(error: Exception, stage: str, region: str, model_id: str) -> str:
    base = [
        f"Bedrock stage '{stage}' failed.",
        f"Region: {region}",
        f"Model: {model_id}",
    ]

    if isinstance(error, NoCredentialsError):
        base.extend(
            [
                "Cause: No AWS credentials were found for this Python runtime.",
                "Fix: Configure credentials in this same environment and re-run.",
            ]
        )
        return "\n".join(base)

    if isinstance(error, PartialCredentialsError):
        base.extend(
            [
                "Cause: Partial AWS credentials were found (missing key parts).",
                "Fix: Re-run aws configure and ensure access key + secret key are both present.",
            ]
        )
        return "\n".join(base)

    if isinstance(error, ClientError):
        data = error.response.get("Error", {}) if getattr(error, "response", None) else {}
        code = data.get("Code", "Unknown")
        message = data.get("Message", str(error))
        base.append(f"AWS error: {code} - {message}")

        if code in {"AccessDeniedException", "UnauthorizedOperation"}:
            base.append("Fix: Verify IAM permissions include bedrock:Converse and/or bedrock:InvokeModel.")
            base.append(f"Fix: Confirm model access is enabled in {region} for {model_id}.")
        elif code in {"UnrecognizedClientException", "InvalidSignatureException", "ExpiredTokenException"}:
            base.append("Fix: Refresh credentials/session token and verify this runtime is using the intended AWS profile.")
        elif code in {"ResourceNotFoundException", "ValidationException"}:
            base.append(f"Fix: Confirm the model ID is available in region {region} and your account has access.")
        else:
            base.append("Fix: Check debug logs for Bedrock request metadata and verify account/model configuration.")
        return "\n".join(base)

    if isinstance(error, BotoCoreError):
        base.extend(
            [
                f"SDK error: {error}",
                "Fix: Check network/region configuration and AWS SDK credentials setup.",
            ]
        )
        return "\n".join(base)

    base.append(f"Unhandled error: {error}")
    return "\n".join(base)

MEDIA_STYLE_RULES = [
    "Photorealistic travel photography with cinematic composition.",
    "Keep landmarks geographically plausible and avoid fantasy elements.",
    "Show season, weather, time of day, and crowd level consistent with the itinerary context.",
    "Use natural lighting and a premium editorial travel aesthetic.",
    "Do not include text overlays, logos, watermarks, or collage layouts.",
]

PLANNER_SYSTEM_PROMPT = """
You are an itinerary planner for an AI travel application.

Your job is to transform a normalized trip request plus a grounded research packet into a strict JSON object.

Hard requirements:
1. Output valid JSON only. Do not use markdown fences.
2. Follow the schema shape provided by the user exactly.
3. Use only facts present in the research packet for weather, hours, events, transit, and attraction details.
4. If a required detail is missing from the research packet, mark it as "estimated" or "unknown" instead of inventing it.
5. Keep the itinerary coherent in time and budget.
6. Recommend realistic visit times, durations, and neighborhoods.
7. Prefer concise factual language over marketing copy.
8. Include warnings for anything that should be verified with live data.

You may infer soft planning choices such as morning vs evening placement, but you may not fabricate live facts.
""".strip()

PROMPT_POLISH_SYSTEM_PROMPT = """
You generate premium image prompts for a travel app.

Hard requirements:
1. Output valid JSON only.
2. Keep each prompt grounded in the supplied itinerary scene.
3. Apply the shared media rules exactly.
4. Make prompts vivid, specific, and photorealistic without becoming fantastical.
5. Do not mention camera brands or artist names.
""".strip()

RESEARCH_SYSTEM_PROMPT = """
You are a travel research agent for an itinerary app.

You will receive:
- a normalized trip request
- lightweight web source snippets

Return valid JSON only with exactly these keys:
city_summary, seasonal_context, transport_notes, budget_notes, facts, suggested_apps, place_candidates, warnings

Rules:
1. Ground outputs in provided snippets when possible.
2. If uncertain, mark details as estimated/unknown rather than inventing facts.
3. Provide 4-8 place_candidates with real local flavor tied to the destination.
4. Keep place_candidates realistic and not generic placeholders.
5. Keep warnings concise and practical.
""".strip()


@dataclass
class TripRequest:
    destination: str
    duration_text: str
    budget_text: str
    interests: list[str]
    travel_dates: str = ""
    travel_month: str = ""
    travel_style: str = "balanced"
    trip_notes: str = ""


@dataclass
class NormalizedTripRequest:
    destination: str
    duration_days: int
    budget_amount: int | None
    budget_text: str
    interests: list[str]
    travel_dates: str
    travel_month: str
    travel_style: str
    trip_notes: str


@dataclass
class PlaceSuggestion:
    name: str
    category: str
    neighborhood: str
    best_time_of_day: str
    estimated_duration_minutes: int
    crowd_level_estimate: str
    general_description: str
    things_to_do: list[str]
    source_confidence: str = "medium"


@dataclass
class ResearchPacket:
    city_summary: str
    seasonal_context: str
    transport_notes: list[str]
    budget_notes: list[str]
    facts: list[str]
    suggested_apps: list[dict[str, str]]
    place_candidates: list[PlaceSuggestion]
    warnings: list[str]


@dataclass
class ItineraryItem:
    item_id: str
    title: str
    start_time: str
    end_time: str
    place_name: str
    neighborhood: str
    activity_type: str
    estimated_cost: str
    transit_note: str
    why_this_fits: str


@dataclass
class ItineraryDay:
    day: int
    theme: str
    items: list[ItineraryItem]


@dataclass
class MediaScene:
    scene_id: str
    itinerary_item_id: str
    title: str
    priority: str
    prompt: str
    style_rules: list[str]


@dataclass
class TripPlan:
    request: dict[str, Any]
    research_summary: dict[str, Any]
    places: list[dict[str, Any]]
    itinerary_days: list[dict[str, Any]]
    recommended_apps: list[dict[str, str]]
    budget_breakdown: dict[str, str]
    warnings: list[str]
    media_scenes: list[dict[str, Any]]


CITY_KNOWLEDGE: dict[str, dict[str, Any]] = {
    "paris": {
        "city_summary": "Dense, walkable city with strong museum, food, and landmark coverage across central neighborhoods.",
        "transport_notes": [
            "Use the Metro for most cross-city movements.",
            "Cluster activities by arrondissement to reduce transit time.",
        ],
        "apps": [
            {"name": "Citymapper", "category": "transport", "reason": "Reliable route planning for Metro and buses."},
            {"name": "TheFork", "category": "food", "reason": "Useful for restaurant discovery and reservations."},
            {"name": "GetYourGuide", "category": "activities", "reason": "Good for timed-entry bookings and tours."},
        ],
        "places": [
            {
                "name": "Eiffel Tower",
                "category": "landmark",
                "neighborhood": "7th arrondissement",
                "best_time_of_day": "sunset",
                "estimated_duration_minutes": 90,
                "crowd_level_estimate": "high",
                "general_description": "Iconic Paris landmark with the best ambience in late afternoon into evening.",
                "things_to_do": ["tower exterior photos", "Champ de Mars stroll", "nearby river views"],
            },
            {
                "name": "Louvre Museum",
                "category": "museum",
                "neighborhood": "1st arrondissement",
                "best_time_of_day": "morning",
                "estimated_duration_minutes": 180,
                "crowd_level_estimate": "high",
                "general_description": "Large museum best approached with a focused route rather than a full-day attempt.",
                "things_to_do": ["masterpiece highlights", "courtyard photos", "Richelieu wing walk"],
            },
            {
                "name": "Le Marais",
                "category": "district",
                "neighborhood": "3rd and 4th arrondissement",
                "best_time_of_day": "afternoon",
                "estimated_duration_minutes": 150,
                "crowd_level_estimate": "medium",
                "general_description": "Walkable historic district with boutiques, cafes, and good casual food options.",
                "things_to_do": ["street wandering", "coffee stop", "shopping", "people watching"],
            },
        ],
    },
    "tokyo": {
        "city_summary": "Large, transit-heavy city where neighborhood clustering matters more than straight-line distance.",
        "transport_notes": [
            "Rail is usually the fastest option.",
            "Plan by district to avoid excessive transfers.",
        ],
        "apps": [
            {"name": "Google Maps", "category": "transport", "reason": "Strong for train timing and station exits."},
            {"name": "Tabelog", "category": "food", "reason": "Useful for restaurant rankings in Japan."},
            {"name": "Klook", "category": "activities", "reason": "Good for attraction and transport bookings."},
        ],
        "places": [
            {
                "name": "Senso-ji",
                "category": "temple",
                "neighborhood": "Asakusa",
                "best_time_of_day": "morning",
                "estimated_duration_minutes": 90,
                "crowd_level_estimate": "medium",
                "general_description": "Historic temple area that works well as an early-day cultural stop.",
                "things_to_do": ["temple grounds", "Nakamise shopping street", "traditional snack stop"],
            },
            {
                "name": "Shibuya",
                "category": "district",
                "neighborhood": "Shibuya",
                "best_time_of_day": "evening",
                "estimated_duration_minutes": 180,
                "crowd_level_estimate": "high",
                "general_description": "High-energy area suited to nightlife, shopping, and city atmosphere.",
                "things_to_do": ["crossing views", "shopping", "dinner", "night walk"],
            },
            {
                "name": "Meiji Shrine",
                "category": "cultural",
                "neighborhood": "Harajuku",
                "best_time_of_day": "morning",
                "estimated_duration_minutes": 120,
                "crowd_level_estimate": "low",
                "general_description": "Quiet shrine precinct that balances busier urban districts nearby.",
                "things_to_do": ["forest walk", "shrine visit", "photo stop"],
            },
        ],
    },
    "toronto": {
        "city_summary": "Broad city with strong neighborhood contrast, good food diversity, and easy downtown transit.",
        "transport_notes": [
            "TTC covers most core sightseeing efficiently.",
            "Use rideshare selectively for late-night returns or outer neighborhoods.",
        ],
        "apps": [
            {"name": "TTC Watch", "category": "transport", "reason": "Useful for Toronto transit arrival information."},
            {"name": "OpenTable", "category": "food", "reason": "Restaurant discovery and reservations."},
            {"name": "Eventbrite", "category": "events", "reason": "Event discovery in the city."},
        ],
        "places": [
            {
                "name": "CN Tower",
                "category": "landmark",
                "neighborhood": "Downtown",
                "best_time_of_day": "late afternoon",
                "estimated_duration_minutes": 120,
                "crowd_level_estimate": "high",
                "general_description": "Signature attraction with skyline views and easy pairing with nearby waterfront stops.",
                "things_to_do": ["observation deck", "city photos", "harbourfront walk"],
            },
            {
                "name": "Distillery District",
                "category": "district",
                "neighborhood": "Old Toronto",
                "best_time_of_day": "afternoon",
                "estimated_duration_minutes": 120,
                "crowd_level_estimate": "medium",
                "general_description": "Pedestrian-friendly district with cafes, galleries, and atmospheric brick streets.",
                "things_to_do": ["street photos", "coffee", "boutiques", "casual dining"],
            },
            {
                "name": "Kensington Market",
                "category": "food",
                "neighborhood": "Downtown West",
                "best_time_of_day": "midday",
                "estimated_duration_minutes": 150,
                "crowd_level_estimate": "medium",
                "general_description": "Best used for casual food exploration and neighborhood wandering.",
                "things_to_do": ["snack crawl", "vintage shops", "street art"],
            },
        ],
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mock backend for AI City Navigator")
    parser.add_argument("--destination")
    parser.add_argument("--duration")
    parser.add_argument("--budget")
    parser.add_argument("--interests")
    parser.add_argument("--travel-dates", default="")
    parser.add_argument("--travel-month", default="")
    parser.add_argument("--travel-style", default="balanced")
    parser.add_argument("--trip-notes", default="")
    parser.add_argument("--region", default=DEFAULT_REGION)
    parser.add_argument("--research-mode", choices=["mock", "live"], default="live")
    parser.add_argument("--planner-mode", choices=["mock", "live"], default="mock")
    parser.add_argument("--prompt-mode", choices=["template", "live"], default="template")
    parser.add_argument("--canvas-mode", choices=["skip", "live"], default="skip")
    parser.add_argument("--output-name", default="trip_plan")
    parser.add_argument("--max-images", type=int, default=4)
    parser.add_argument("--debug", action="store_true")
    parser.add_argument("--debug-max-chars", type=int, default=1600)
    parser.add_argument("--quiet-plan-print", action="store_true")
    parser.add_argument("--progress-json", action="store_true")
    return parser.parse_args()


def prompt_for_missing_args(args: argparse.Namespace) -> TripRequest:
    destination = args.destination or input("Destination city: ").strip()
    duration = args.duration or input("Trip duration (for example 5 days): ").strip()
    budget = args.budget or input("Budget (for example $2000): ").strip()
    interests_raw = args.interests or input("Interests (comma separated): ").strip()
    travel_dates = args.travel_dates or input("Travel dates (optional, for example 2026-08-10 to 2026-08-14): ").strip()
    travel_month = args.travel_month or input("Travel month or dates (optional): ").strip()
    travel_style = args.travel_style or input("Travel style [balanced]: ").strip() or "balanced"
    trip_notes = args.trip_notes or input("Trip notes (optional): ").strip()

    interests = [item.strip() for item in interests_raw.split(",") if item.strip()]
    return TripRequest(
        destination=destination,
        duration_text=duration,
        budget_text=budget,
        interests=interests,
        travel_dates=travel_dates,
        travel_month=travel_month,
        travel_style=travel_style,
        trip_notes=trip_notes,
    )


def infer_travel_month(travel_dates: str, travel_month: str) -> str:
    if travel_month.strip():
        return travel_month.strip()

    month_map = {
        "01": "January",
        "02": "February",
        "03": "March",
        "04": "April",
        "05": "May",
        "06": "June",
        "07": "July",
        "08": "August",
        "09": "September",
        "10": "October",
        "11": "November",
        "12": "December",
    }
    match = re.search(r"\b\d{4}-(\d{2})-\d{2}\b", travel_dates)
    if match:
        return month_map.get(match.group(1), travel_dates.strip())
    return travel_dates.strip()


def normalize_trip_request(request: TripRequest) -> NormalizedTripRequest:
    duration_match = re.search(r"(\d+)", request.duration_text)
    duration_days = int(duration_match.group(1)) if duration_match else 3

    budget_digits = re.sub(r"[^\d]", "", request.budget_text)
    budget_amount = int(budget_digits) if budget_digits else None

    return NormalizedTripRequest(
        destination=request.destination.strip(),
        duration_days=max(duration_days, 1),
        budget_amount=budget_amount,
        budget_text=request.budget_text.strip(),
        interests=request.interests or ["culture", "food"],
        travel_dates=request.travel_dates.strip(),
        travel_month=infer_travel_month(request.travel_dates, request.travel_month),
        travel_style=request.travel_style.strip() or "balanced",
        trip_notes=request.trip_notes.strip(),
    )


def season_summary(month_text: str) -> str:
    lowered = month_text.lower()
    if any(token in lowered for token in ["dec", "jan", "feb", "winter"]):
        return "Cool or cold season context. Shorter daylight and heavier outerwear may matter."
    if any(token in lowered for token in ["mar", "apr", "may", "spring"]):
        return "Spring shoulder season context with variable temperatures and moderate daylight."
    if any(token in lowered for token in ["jun", "jul", "aug", "summer"]):
        return "Warm or hot season context. Outdoor activities and peak crowds may be more likely."
    if any(token in lowered for token in ["sep", "oct", "nov", "autumn", "fall"]):
        return "Autumn shoulder season context with milder weather and good walking conditions."
    return "Seasonal conditions are estimated because exact travel dates were not supplied."


def build_research_packet_mock(request: NormalizedTripRequest) -> ResearchPacket:
    city_key = request.destination.lower().strip()
    city_data = CITY_KNOWLEDGE.get(city_key)

    if city_data is None:
        generic_places = [
            PlaceSuggestion(
                name=f"Central district in {request.destination}",
                category="district",
                neighborhood="central area",
                best_time_of_day="afternoon",
                estimated_duration_minutes=150,
                crowd_level_estimate="medium",
                general_description="Generic downtown exploration block used because no destination-specific provider is wired yet.",
                things_to_do=["walk main streets", "sample local food", "visit a top landmark"],
                source_confidence="low",
            )
        ]
        return ResearchPacket(
            city_summary="No destination-specific provider is configured yet, so this research packet is generic.",
            seasonal_context=season_summary(request.travel_month),
            transport_notes=["Use live maps data before production launch."],
            budget_notes=["Budget guidance is approximate because prices were not sourced from live providers."],
            facts=["Place suggestions are placeholders until a live places provider is integrated."],
            suggested_apps=[
                {"name": "Google Maps", "category": "navigation", "reason": "Baseline navigation and place lookup."},
                {"name": "Uber", "category": "transport", "reason": "Fallback point-to-point transport."},
            ],
            place_candidates=generic_places,
            warnings=[
                "Destination facts are generic placeholders.",
                "Weather, opening hours, and event details should be verified with live APIs.",
            ],
        )

    places = [PlaceSuggestion(**place) for place in city_data["places"]]
    budget_notes = [
        "Use one paid anchor attraction per day to keep spending predictable.",
        "Cluster meals and major attractions by neighborhood to reduce transport waste.",
    ]
    if request.budget_amount is not None and request.budget_amount < request.duration_days * 120:
        budget_notes.append("Budget appears tight for a comfort-first trip, so prioritize free landmarks and casual dining.")

    facts = [
        f"Travel style requested: {request.travel_style}.",
        f"Interests provided: {', '.join(request.interests)}.",
        "Crowd levels are estimated, not live measurements.",
    ]

    return ResearchPacket(
        city_summary=city_data["city_summary"],
        seasonal_context=season_summary(request.travel_month),
        transport_notes=city_data["transport_notes"],
        budget_notes=budget_notes,
        facts=facts,
        suggested_apps=city_data["apps"],
        place_candidates=places,
        warnings=[
            "Opening hours and event listings are not yet connected to live providers.",
            "Weather is seasonal guidance, not a live forecast.",
        ],
    )


def fetch_json_url(url: str, *, timeout: int = 10) -> dict[str, Any] | list[Any] | None:
    req = Request(
        url,
        headers={
            "User-Agent": "AI-City-Navigator/0.1 (hackathon-research-stage)",
            "Accept": "application/json",
        },
    )
    try:
        with urlopen(req, timeout=timeout) as response:
            payload = response.read().decode("utf-8", errors="ignore")
            return json.loads(payload)
    except Exception:
        return None


def fetch_city_source_snippets(destination: str) -> dict[str, Any]:
    snippets: dict[str, Any] = {"destination": destination, "sources": []}

    nominatim_url = f"https://nominatim.openstreetmap.org/search?q={quote_plus(destination)}&format=json&limit=1"
    nominatim = fetch_json_url(nominatim_url)
    if isinstance(nominatim, list) and nominatim:
        first = nominatim[0]
        snippets["geo"] = {
            "display_name": first.get("display_name"),
            "lat": first.get("lat"),
            "lon": first.get("lon"),
        }
        snippets["sources"].append("nominatim")

    wiki_title = destination.replace(" ", "_")
    wiki_summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote_plus(wiki_title)}"
    wiki = fetch_json_url(wiki_summary_url)
    if isinstance(wiki, dict):
        snippets["wikipedia"] = {
            "title": wiki.get("title"),
            "description": wiki.get("description"),
            "extract": wiki.get("extract"),
        }
        snippets["sources"].append("wikipedia")

    wikivoyage_url = (
        "https://en.wikivoyage.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1"
        f"&titles={quote_plus(destination)}&format=json"
    )
    wikivoyage = fetch_json_url(wikivoyage_url)
    if isinstance(wikivoyage, dict):
        pages = (((wikivoyage.get("query") or {}).get("pages")) or {})
        if isinstance(pages, dict) and pages:
            page = next(iter(pages.values()))
            snippets["wikivoyage"] = {
                "title": page.get("title"),
                "extract": page.get("extract"),
            }
            snippets["sources"].append("wikivoyage")

    return snippets


def build_research_schema_hint() -> dict[str, Any]:
    return {
        "city_summary": "string",
        "seasonal_context": "string",
        "transport_notes": ["string"],
        "budget_notes": ["string"],
        "facts": ["string"],
        "suggested_apps": [
            {"name": "string", "category": "string", "reason": "string"}
        ],
        "place_candidates": [
            {
                "name": "string",
                "category": "string",
                "neighborhood": "string",
                "best_time_of_day": "string",
                "estimated_duration_minutes": "number",
                "crowd_level_estimate": "string",
                "general_description": "string",
                "things_to_do": ["string"],
                "source_confidence": "string",
            }
        ],
        "warnings": ["string"],
    }


def coerce_research_packet(payload: dict[str, Any], request: NormalizedTripRequest) -> ResearchPacket:
    place_rows = payload.get("place_candidates") if isinstance(payload.get("place_candidates"), list) else []
    places: list[PlaceSuggestion] = []
    def parse_duration(value: Any) -> int:
        try:
            return max(int(value), 30)
        except Exception:
            return 90

    for row in place_rows:
        if not isinstance(row, dict):
            continue
        name = str(row.get("name") or "").strip()
        if not name:
            continue
        things = row.get("things_to_do") if isinstance(row.get("things_to_do"), list) else []
        places.append(
            PlaceSuggestion(
                name=name,
                category=str(row.get("category") or "attraction"),
                neighborhood=str(row.get("neighborhood") or "central area"),
                best_time_of_day=str(row.get("best_time_of_day") or "afternoon"),
                estimated_duration_minutes=parse_duration(row.get("estimated_duration_minutes") or 90),
                crowd_level_estimate=str(row.get("crowd_level_estimate") or "medium"),
                general_description=str(row.get("general_description") or f"Suggested stop in {request.destination}."),
                things_to_do=[str(item) for item in things if str(item).strip()],
                source_confidence=str(row.get("source_confidence") or "medium"),
            )
        )

    if not places:
        places = [
            PlaceSuggestion(
                name=f"Central district in {request.destination}",
                category="district",
                neighborhood="central area",
                best_time_of_day="afternoon",
                estimated_duration_minutes=150,
                crowd_level_estimate="medium",
                general_description="Fallback place because live research returned no valid place candidates.",
                things_to_do=["walk main streets", "sample local food", "visit a top landmark"],
                source_confidence="low",
            )
        ]

    apps_raw = payload.get("suggested_apps") if isinstance(payload.get("suggested_apps"), list) else []
    apps: list[dict[str, str]] = []
    for app in apps_raw:
        if not isinstance(app, dict):
            continue
        name = str(app.get("name") or "").strip()
        if not name:
            continue
        apps.append(
            {
                "name": name,
                "category": str(app.get("category") or "utility"),
                "reason": str(app.get("reason") or "Useful during travel."),
            }
        )
    if not apps:
        apps = [
            {"name": "Google Maps", "category": "navigation", "reason": "Baseline navigation and place lookup."},
            {"name": "Uber", "category": "transport", "reason": "Fallback point-to-point transport."},
        ]

    def ensure_list(value: Any, fallback: list[str]) -> list[str]:
        if isinstance(value, list):
            cleaned = [str(item) for item in value if str(item).strip()]
            if cleaned:
                return cleaned
        return fallback

    return ResearchPacket(
        city_summary=str(payload.get("city_summary") or f"Research summary for {request.destination} generated from web snippets."),
        seasonal_context=str(payload.get("seasonal_context") or season_summary(request.travel_month)),
        transport_notes=ensure_list(payload.get("transport_notes"), ["Use local transit and rideshare as needed; verify live conditions."]),
        budget_notes=ensure_list(payload.get("budget_notes"), ["Budget guidance is estimated and should be validated with live prices."]),
        facts=ensure_list(payload.get("facts"), ["Some details are estimated due to limited source coverage."]),
        suggested_apps=apps,
        place_candidates=places,
        warnings=ensure_list(payload.get("warnings"), ["Verify opening hours, events, and ticketing with live providers."]),
    )


def build_research_packet_live(
    region: str,
    request: NormalizedTripRequest,
    *,
    debug: bool,
    debug_max_chars: int,
) -> ResearchPacket:
    source_snippets = fetch_city_source_snippets(request.destination)
    debug_log(
        debug,
        "Live research source snippets",
        {
            "destination": request.destination,
            "sources": source_snippets.get("sources", []),
            "has_geo": bool(source_snippets.get("geo")),
            "has_wikipedia": bool(source_snippets.get("wikipedia")),
            "has_wikivoyage": bool(source_snippets.get("wikivoyage")),
        },
        max_chars=debug_max_chars,
    )

    research_prompt = json.dumps(
        {
            "normalized_request": asdict(request),
            "source_snippets": source_snippets,
            "required_schema": build_research_schema_hint(),
        },
        indent=2,
    )
    payload = converse_json(
        region,
        RESEARCH_MODEL_ID,
        RESEARCH_SYSTEM_PROMPT,
        research_prompt,
        debug=debug,
        debug_max_chars=debug_max_chars,
    )
    if not isinstance(payload, dict):
        raise ValueError("Research stage must return a JSON object.")
    return coerce_research_packet(payload, request)


def build_planner_schema_hint() -> dict[str, Any]:
    return {
        "request": {
            "destination": "string",
            "duration_days": "number",
            "budget_text": "string",
            "travel_dates": "string",
            "travel_month": "string",
            "travel_style": "string",
            "trip_notes": "string",
            "interests": ["string"],
        },
        "research_summary": {
            "city_summary": "string",
            "seasonal_context": "string",
            "transport_notes": ["string"],
            "budget_notes": ["string"],
        },
        "places": [
            {
                "name": "string",
                "category": "string",
                "neighborhood": "string",
                "best_time_of_day": "string",
                "estimated_duration_minutes": "number",
                "crowd_level_estimate": "string",
                "general_description": "string",
                "things_to_do": ["string"],
                "source_confidence": "string",
            }
        ],
        "itinerary_days": [
            {
                "day": "number",
                "theme": "string",
                "items": [
                    {
                        "item_id": "string",
                        "title": "string",
                        "start_time": "string",
                        "end_time": "string",
                        "place_name": "string",
                        "neighborhood": "string",
                        "activity_type": "string",
                        "estimated_cost": "string",
                        "transit_note": "string",
                        "why_this_fits": "string",
                    }
                ],
            }
        ],
        "recommended_apps": [
            {"name": "string", "category": "string", "reason": "string"}
        ],
        "budget_breakdown": {
            "lodging": "string",
            "food": "string",
            "transport": "string",
            "activities": "string",
            "buffer": "string",
        },
        "warnings": ["string"],
        "media_scenes": [
            {
                "scene_id": "string",
                "itinerary_item_id": "string",
                "title": "string",
                "priority": "string",
                "prompt": "string",
                "style_rules": ["string"],
            }
        ],
    }


def build_planner_user_prompt(request: NormalizedTripRequest, packet: ResearchPacket) -> str:
    payload = {
        "normalized_request": asdict(request),
        "research_packet": {
            "city_summary": packet.city_summary,
            "seasonal_context": packet.seasonal_context,
            "transport_notes": packet.transport_notes,
            "budget_notes": packet.budget_notes,
            "facts": packet.facts,
            "suggested_apps": packet.suggested_apps,
            "place_candidates": [asdict(place) for place in packet.place_candidates],
            "warnings": packet.warnings,
        },
        "required_schema": build_planner_schema_hint(),
        "planning_guidance": {
            "respect_trip_notes": request.trip_notes or "No extra notes supplied.",
            "travel_dates": request.travel_dates or "Not supplied.",
        },
    }
    return json.dumps(payload, indent=2)


def render_scene_prompt(request: NormalizedTripRequest, packet: ResearchPacket, item: ItineraryItem) -> str:
    interest_text = ", ".join(request.interests[:3]) if request.interests else "city exploration"
    return (
        f"A photorealistic premium travel scene in {request.destination} featuring {item.place_name} in "
        f"{item.neighborhood} during the {item.start_time} to {item.end_time} part of the itinerary. "
        f"Reflect a {request.travel_style} trip style, {packet.seasonal_context.lower()} Show realistic crowd density, "
        f"subtle local atmosphere, and activities connected to {interest_text}."
    )


def build_mock_itinerary(request: NormalizedTripRequest, packet: ResearchPacket) -> TripPlan:
    places = packet.place_candidates or []
    itinerary_days: list[ItineraryDay] = []
    media_scenes: list[MediaScene] = []

    for day_index in range(request.duration_days):
        selected = places[day_index % len(places)]
        anchor = places[(day_index + 1) % len(places)] if len(places) > 1 else selected

        morning_id = f"day{day_index + 1}-morning"
        evening_id = f"day{day_index + 1}-evening"
        items = [
            ItineraryItem(
                item_id=morning_id,
                title=f"Explore {selected.name}",
                start_time="09:00",
                end_time="11:30",
                place_name=selected.name,
                neighborhood=selected.neighborhood,
                activity_type=selected.category,
                estimated_cost="$25-40",
                transit_note=packet.transport_notes[0],
                why_this_fits=f"Fits {', '.join(request.interests[:2]) or 'general sightseeing'} and works best in the {selected.best_time_of_day}.",
            ),
            ItineraryItem(
                item_id=evening_id,
                title=f"Slow evening around {anchor.name}",
                start_time="17:00",
                end_time="20:00",
                place_name=anchor.name,
                neighborhood=anchor.neighborhood,
                activity_type=anchor.category,
                estimated_cost="$35-60",
                transit_note=packet.transport_notes[-1],
                why_this_fits=f"Balances the day with a {request.travel_style} pace and a stronger evening atmosphere.",
            ),
        ]
        itinerary_days.append(
            ItineraryDay(
                day=day_index + 1,
                theme=f"{request.destination} day {day_index + 1}",
                items=items,
            )
        )

        media_scenes.append(
            MediaScene(
                scene_id=f"scene-{morning_id}",
                itinerary_item_id=morning_id,
                title=f"Morning at {selected.name}",
                priority="high",
                prompt=render_scene_prompt(request, packet, items[0]),
                style_rules=MEDIA_STYLE_RULES,
            )
        )
        media_scenes.append(
            MediaScene(
                scene_id=f"scene-{evening_id}",
                itinerary_item_id=evening_id,
                title=f"Evening at {anchor.name}",
                priority="medium",
                prompt=render_scene_prompt(request, packet, items[1]),
                style_rules=MEDIA_STYLE_RULES,
            )
        )

    budget_breakdown = {
        "lodging": "35-45% of total budget",
        "food": "20-25% of total budget",
        "transport": "10-15% of total budget",
        "activities": "15-25% of total budget",
        "buffer": "10% contingency",
    }

    return TripPlan(
        request={
            "destination": request.destination,
            "duration_days": request.duration_days,
            "budget_text": request.budget_text,
            "travel_dates": request.travel_dates,
            "travel_month": request.travel_month,
            "travel_style": request.travel_style,
            "trip_notes": request.trip_notes,
            "interests": request.interests,
        },
        research_summary={
            "city_summary": packet.city_summary,
            "seasonal_context": packet.seasonal_context,
            "transport_notes": packet.transport_notes,
            "budget_notes": packet.budget_notes,
        },
        places=[asdict(place) for place in packet.place_candidates],
        itinerary_days=[asdict(day) for day in itinerary_days],
        recommended_apps=packet.suggested_apps,
        budget_breakdown=budget_breakdown,
        warnings=packet.warnings,
        media_scenes=[asdict(scene) for scene in media_scenes],
    )


def make_bedrock_client(region: str):
    return boto3.client("bedrock-runtime", region_name=region)


def extract_json(text: str) -> Any:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            pass

    start = cleaned.find("[")
    end = cleaned.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError("Model response did not contain valid JSON.")


def validate_trip_plan(payload: dict[str, Any]) -> None:
    required_keys = {
        "request",
        "research_summary",
        "places",
        "itinerary_days",
        "recommended_apps",
        "budget_breakdown",
        "warnings",
        "media_scenes",
    }
    missing = required_keys.difference(payload)
    if missing:
        raise ValueError(f"Missing keys in planner response: {sorted(missing)}")

    if not isinstance(payload["itinerary_days"], list) or not payload["itinerary_days"]:
        raise ValueError("Planner response must include at least one itinerary day.")

    for day in payload["itinerary_days"]:
        if "items" not in day or not isinstance(day["items"], list) or not day["items"]:
            raise ValueError("Each itinerary day must include at least one item.")


def converse_json(
    region: str,
    model_id: str,
    system_prompt: str,
    user_prompt: str,
    *,
    debug: bool,
    debug_max_chars: int,
) -> Any:
    client = make_bedrock_client(region)
    debug_log(
        debug,
        "Bedrock converse request",
        {
            "region": region,
            "model_id": model_id,
            "inference_config": {"maxTokens": 4000, "temperature": 0.2, "topP": 0.9},
            "system_prompt_chars": len(system_prompt),
            "user_prompt_chars": len(user_prompt),
            "user_prompt_preview": truncate_text(user_prompt, 900),
        },
        max_chars=debug_max_chars,
    )

    response = client.converse(
        modelId=model_id,
        system=[{"text": system_prompt}],
        messages=[{"role": "user", "content": [{"text": user_prompt}]}],
        inferenceConfig={"maxTokens": 4000, "temperature": 0.2, "topP": 0.9},
    )
    text_chunks = []
    for block in response["output"]["message"].get("content", []):
        if "text" in block:
            text_chunks.append(block["text"])

    raw_text = "\n".join(text_chunks)
    debug_log(
        debug,
        "Bedrock converse response",
        {
            "stop_reason": response.get("stopReason"),
            "usage": response.get("usage"),
            "metrics": response.get("metrics"),
            "response_metadata": response.get("ResponseMetadata"),
            "text_chars": len(raw_text),
            "text_preview": truncate_text(raw_text, 900),
        },
        max_chars=debug_max_chars,
    )

    return extract_json(raw_text)


def plan_with_live_model(
    region: str,
    request: NormalizedTripRequest,
    packet: ResearchPacket,
    *,
    debug: bool,
    debug_max_chars: int,
) -> TripPlan:
    prompt = build_planner_user_prompt(request, packet)

    try:
        payload = converse_json(
            region,
            PLANNER_MODEL_ID,
            PLANNER_SYSTEM_PROMPT,
            prompt,
            debug=debug,
            debug_max_chars=debug_max_chars,
        )
        validate_trip_plan(payload)
        return TripPlan(**payload)
    except (ValueError, ClientError, BotoCoreError) as first_error:
        debug_log(
            debug,
            "Planner first attempt failed, sending repair prompt",
            {"error": str(first_error)},
            max_chars=debug_max_chars,
        )
        repair_prompt = json.dumps(
            {
                "instruction": "Repair the invalid JSON response. Return valid JSON only and keep the same schema.",
                "schema": build_planner_schema_hint(),
                "error": str(first_error),
                "original_request": json.loads(prompt),
            },
            indent=2,
        )
        payload = converse_json(
            region,
            PLANNER_MODEL_ID,
            PLANNER_SYSTEM_PROMPT,
            repair_prompt,
            debug=debug,
            debug_max_chars=debug_max_chars,
        )
        validate_trip_plan(payload)
        return TripPlan(**payload)


def polish_prompts_with_live_model(region: str, plan: TripPlan, *, debug: bool, debug_max_chars: int) -> list[dict[str, Any]]:
    scene_payload = {
        "media_rules": MEDIA_STYLE_RULES,
        "media_scenes": plan.media_scenes,
    }
    polished = converse_json(
        region,
        PLANNER_MODEL_ID,
        PROMPT_POLISH_SYSTEM_PROMPT,
        json.dumps(scene_payload, indent=2),
        debug=debug,
        debug_max_chars=debug_max_chars,
    )
    if isinstance(polished, list):
        scenes = polished
    elif isinstance(polished, dict):
        scenes = polished.get("media_scenes") or polished.get("media_prompts")
    else:
        scenes = None

    if not isinstance(scenes, list) or not scenes:
        raise ValueError("Prompt polish response did not include media_scenes.")

    normalized: list[dict[str, Any]] = []
    for index, scene in enumerate(scenes, start=1):
        if not isinstance(scene, dict):
            continue
        prompt = str(scene.get("prompt", "")).strip()
        if not prompt:
            continue
        normalized.append(
            {
                "scene_id": str(scene.get("scene_id") or f"scene-{index}"),
                "itinerary_item_id": str(scene.get("itinerary_item_id") or f"item-{index}"),
                "title": str(scene.get("title") or f"Scene {index}"),
                "priority": str(scene.get("priority") or "medium"),
                "prompt": prompt,
                "style_rules": scene.get("style_rules") if isinstance(scene.get("style_rules"), list) else MEDIA_STYLE_RULES,
            }
        )

    if not normalized:
        raise ValueError("Prompt polish response contained no usable scene prompts.")
    return normalized


def generate_canvas_image(
    region: str,
    destination: str,
    prompt: str,
    output_file: Path,
    *,
    debug: bool,
    debug_max_chars: int,
) -> Path:
    client = make_bedrock_client(region)
    grounded_prompt = (
        f"Location anchor: {destination}. Keep architecture, vegetation, signage style, and streetscape consistent with this destination. "
        f"Avoid visual cues from unrelated countries or regions. {prompt}"
    )
    payload = {
        "taskType": "TEXT_IMAGE",
        "textToImageParams": {"text": grounded_prompt},
        "imageGenerationConfig": {
            "numberOfImages": 1,
            "height": 1024,
            "width": 1024,
            "cfgScale": 8.0,
        },
    }
    debug_log(
        debug,
        "Bedrock canvas request",
        {
            "region": region,
            "model_id": CANVAS_MODEL_ID,
            "prompt_chars": len(grounded_prompt),
            "prompt_preview": truncate_text(grounded_prompt, 700),
            "image_config": payload["imageGenerationConfig"],
        },
        max_chars=debug_max_chars,
    )

    response = client.invoke_model(
        modelId=CANVAS_MODEL_ID,
        body=json.dumps(payload),
        contentType="application/json",
        accept="application/json",
    )
    response_body = json.loads(response["body"].read())
    debug_log(
        debug,
        "Bedrock canvas response",
        {
            "response_metadata": response.get("ResponseMetadata"),
            "result_keys": sorted(response_body.keys()),
            "has_images": bool(response_body.get("images")),
            "error": response_body.get("error"),
        },
        max_chars=debug_max_chars,
    )
    image_bytes = base64.b64decode(response_body["images"][0])
    output_file.write_bytes(image_bytes)
    return output_file


def attach_canvas_outputs(
    region: str,
    plan: TripPlan,
    output_name: str,
    max_images: int,
    *,
    debug: bool,
    debug_max_chars: int,
) -> list[dict[str, str]]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    generated: list[dict[str, str]] = []
    destination = str(plan.request.get("destination", "the destination city"))
    if max_images <= 0:
        selected_scenes = plan.media_scenes
    else:
        selected_scenes = plan.media_scenes[:max_images]

    for index, scene in enumerate(selected_scenes, start=1):
        output_file = OUTPUT_DIR / f"{output_name}_scene_{index}.png"
        saved_path = generate_canvas_image(
            region,
            destination,
            scene["prompt"],
            output_file,
            debug=debug,
            debug_max_chars=debug_max_chars,
        )
        generated.append({"scene_id": scene["scene_id"], "file": str(saved_path)})
    return generated


def get_frontend_trip_header(plan: TripPlan) -> dict[str, Any]:
    request = plan.request or {}
    return {
        "destination": request.get("destination", "Unknown destination"),
        "duration_days": request.get("duration_days", "unknown"),
        "travel_month": request.get("travel_month", ""),
        "travel_style": request.get("travel_style", "balanced"),
        "interests": request.get("interests", []),
        "city_summary": (plan.research_summary or {}).get("city_summary", ""),
        "seasonal_context": (plan.research_summary or {}).get("seasonal_context", ""),
    }


def get_frontend_budget_section(plan: TripPlan) -> dict[str, str]:
    return dict(plan.budget_breakdown or {})


def get_frontend_apps_section(plan: TripPlan) -> list[dict[str, str]]:
    apps = plan.recommended_apps or []
    return [app for app in apps if isinstance(app, dict)]


def get_frontend_itinerary_section(plan: TripPlan) -> list[dict[str, Any]]:
    days = plan.itinerary_days or []
    return [day for day in days if isinstance(day, dict)]


def get_frontend_media_section(plan: TripPlan, generated_images: list[dict[str, str]]) -> list[dict[str, Any]]:
    image_by_scene = {row.get("scene_id"): row.get("file") for row in generated_images if isinstance(row, dict)}
    rows: list[dict[str, Any]] = []
    for scene in plan.media_scenes or []:
        if not isinstance(scene, dict):
            continue
        scene_id = str(scene.get("scene_id", ""))
        rows.append(
            {
                "scene_id": scene_id,
                "title": scene.get("title", "Scene"),
                "priority": scene.get("priority", "medium"),
                "prompt": scene.get("prompt", ""),
                "image_file": image_by_scene.get(scene_id),
            }
        )
    return rows


def build_frontend_view_model(plan: TripPlan, generated_images: list[dict[str, str]]) -> dict[str, Any]:
    return {
        "header": get_frontend_trip_header(plan),
        "budget": get_frontend_budget_section(plan),
        "apps": get_frontend_apps_section(plan),
        "itinerary": get_frontend_itinerary_section(plan),
        "media": get_frontend_media_section(plan, generated_images),
        "warnings": list(plan.warnings or []),
        "transport_notes": list((plan.research_summary or {}).get("transport_notes", [])),
    }


def save_frontend_markdown_dump(plan: TripPlan, generated_images: list[dict[str, str]], output_name: str) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    model = build_frontend_view_model(plan, generated_images)
    header = model["header"]

    lines: list[str] = []
    lines.append(f"# AI City Navigator — Trip Output ({header['destination']})")
    lines.append("")
    lines.append("## Trip Overview")
    lines.append(f"- **Destination:** {header['destination']}")
    lines.append(f"- **Duration:** {header['duration_days']} days")
    if header.get("travel_month"):
        lines.append(f"- **Travel Month:** {header['travel_month']}")
    lines.append(f"- **Travel Style:** {header.get('travel_style', 'balanced')}")
    interests = header.get("interests") or []
    lines.append(f"- **Interests:** {', '.join(interests) if interests else 'n/a'}")
    lines.append("")

    if header.get("city_summary"):
        lines.append("## City Summary")
        lines.append(str(header["city_summary"]))
        lines.append("")
    if header.get("seasonal_context"):
        lines.append("## Seasonal Context")
        lines.append(str(header["seasonal_context"]))
        lines.append("")

    transport_notes = model.get("transport_notes") or []
    if transport_notes:
        lines.append("## Transport Notes")
        for note in transport_notes:
            lines.append(f"- {note}")
        lines.append("")

    budget = model.get("budget") or {}
    if budget:
        lines.append("## Budget Breakdown")
        for key, value in budget.items():
            lines.append(f"- **{key.capitalize()}:** {value}")
        lines.append("")

    apps = model.get("apps") or []
    if apps:
        lines.append("## Recommended Apps")
        lines.append("| Name | Category | Why It Helps |")
        lines.append("| --- | --- | --- |")
        for app in apps:
            lines.append(f"| {app.get('name', '')} | {app.get('category', '')} | {app.get('reason', '')} |")
        lines.append("")

    itinerary = model.get("itinerary") or []
    if itinerary:
        lines.append("## Itinerary")
        for day in itinerary:
            lines.append("")
            lines.append(f"### Day {day.get('day', '?')} — {day.get('theme', 'Plan')}")
            items = day.get("items") if isinstance(day.get("items"), list) else []
            for item in items:
                lines.append(
                    f"- **{item.get('start_time', '--')}–{item.get('end_time', '--')}** {item.get('title', 'Activity')}"
                    f" ({item.get('place_name', 'Place')}, {item.get('neighborhood', 'Area')})"
                )
                lines.append(f"  - Type: {item.get('activity_type', 'activity')} | Cost: {item.get('estimated_cost', 'n/a')}")
                lines.append(f"  - Transit: {item.get('transit_note', 'n/a')}")
                lines.append(f"  - Why: {item.get('why_this_fits', '')}")
        lines.append("")

    media = model.get("media") or []
    if media:
        lines.append("## Media Scenes")
        for scene in media:
            lines.append("")
            lines.append(f"### {scene.get('title', 'Scene')} ({scene.get('priority', 'medium')})")
            lines.append(f"- Prompt: {scene.get('prompt', '')}")
            image_file = scene.get("image_file")
            if image_file:
                image_name = Path(str(image_file)).name
                lines.append(f"- Image File: `{image_name}`")
                lines.append(f"![{scene.get('title', 'Scene image')}]({image_name})")
            else:
                lines.append("- Image File: not generated in this run")
        lines.append("")

    warnings = model.get("warnings") or []
    if warnings:
        lines.append("## Warnings")
        for warning in warnings:
            lines.append(f"- {warning}")
        lines.append("")

    output_file = OUTPUT_DIR / f"{output_name}_frontend_dump.md"
    output_file.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
    return output_file


def save_plan(plan: TripPlan, output_name: str) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_file = OUTPUT_DIR / f"{output_name}.json"
    output_file.write_text(json.dumps(asdict(plan), indent=2), encoding="utf-8")
    return output_file


def main() -> None:
    args = parse_args()
    live_api_stages = get_live_api_stages(args.research_mode, args.planner_mode, args.prompt_mode, args.canvas_mode)
    emit_progress(args.progress_json, "init", "start", "Preparing generation request")

    if live_api_stages:
        print(f"Bedrock API calls enabled for stages: {', '.join(live_api_stages)}")
        credentials_visible = print_bedrock_preflight(args.region, live_api_stages)
        if not credentials_visible:
            print("\nAborting before live Bedrock calls due to missing credentials.")
            raise SystemExit(1)
    else:
        print("Bedrock API calls are disabled. Current run is fully mock/template mode.")
        print("Use --research-mode live/--planner-mode live/--prompt-mode live/--canvas-mode live to enable Bedrock stages.")

    debug_log(
        args.debug,
        "Execution config",
        {
            "region": args.region,
            "research_mode": args.research_mode,
            "planner_mode": args.planner_mode,
            "prompt_mode": args.prompt_mode,
            "canvas_mode": args.canvas_mode,
            "max_images": args.max_images,
            "live_api_stages": live_api_stages,
            "output_name": args.output_name,
            "debug_max_chars": args.debug_max_chars,
        },
        max_chars=args.debug_max_chars,
    )

    request = prompt_for_missing_args(args)
    normalized = normalize_trip_request(request)
    emit_progress(args.progress_json, "input", "complete", "Trip input normalized")
    debug_log(
        args.debug,
        "Normalized request",
        asdict(normalized),
        max_chars=args.debug_max_chars,
    )

    if args.research_mode == "live":
        emit_progress(args.progress_json, "research", "start", "Researching destination context")
        try:
            packet = build_research_packet_live(
                args.region,
                normalized,
                debug=args.debug,
                debug_max_chars=args.debug_max_chars,
            )
        except (NoCredentialsError, PartialCredentialsError, ClientError, BotoCoreError) as error:
            print("\n[ERROR]")
            print(build_bedrock_error_message(error, "research", args.region, RESEARCH_MODEL_ID))
            raise SystemExit(1) from error
        except Exception as error:
            print("\n[WARN] Live research failed, falling back to mock research packet.")
            print(f"Reason: {error}")
            packet = build_research_packet_mock(normalized)
        emit_progress(args.progress_json, "research", "complete", "Destination research ready")
    else:
        packet = build_research_packet_mock(normalized)
        emit_progress(args.progress_json, "research", "complete", "Mock destination research ready")

    debug_log(
        args.debug,
        "Research packet summary",
        {
            "city_summary": packet.city_summary,
            "seasonal_context": packet.seasonal_context,
            "warnings": packet.warnings,
            "transport_notes": packet.transport_notes,
            "place_count": len(packet.place_candidates),
        },
        max_chars=args.debug_max_chars,
    )

    if args.planner_mode == "live":
        emit_progress(args.progress_json, "planner", "start", "Generating itinerary plan")
        try:
            plan = plan_with_live_model(
                args.region,
                normalized,
                packet,
                debug=args.debug,
                debug_max_chars=args.debug_max_chars,
            )
        except (NoCredentialsError, PartialCredentialsError, ClientError, BotoCoreError) as error:
            print("\n[ERROR]")
            print(build_bedrock_error_message(error, "planner", args.region, PLANNER_MODEL_ID))
            raise SystemExit(1) from error
        emit_progress(args.progress_json, "planner", "complete", "Itinerary plan generated")
    else:
        plan = build_mock_itinerary(normalized, packet)
        emit_progress(args.progress_json, "planner", "complete", "Mock itinerary plan generated")

    if args.prompt_mode == "live":
        fallback_scenes = plan.media_scenes
        emit_progress(args.progress_json, "prompt_polish", "start", "Polishing media prompts")
        try:
            plan.media_scenes = polish_prompts_with_live_model(
                args.region,
                plan,
                debug=args.debug,
                debug_max_chars=args.debug_max_chars,
            )
        except (NoCredentialsError, PartialCredentialsError, ClientError, BotoCoreError) as error:
            print("\n[ERROR]")
            print(build_bedrock_error_message(error, "prompt_polish", args.region, PLANNER_MODEL_ID))
            raise SystemExit(1) from error
        except Exception as error:
            print("\n[WARN] Prompt polish failed, continuing with planner-generated scene prompts.")
            print(f"Reason: {error}")
            plan.media_scenes = fallback_scenes
        emit_progress(args.progress_json, "prompt_polish", "complete", "Media prompts ready")
    else:
        emit_progress(args.progress_json, "prompt_polish", "complete", "Template media prompts ready")

    output_file = save_plan(plan, args.output_name)
    print(f"Saved trip plan JSON to {output_file}")

    generated_files: list[dict[str, str]] = []
    if args.canvas_mode == "live":
        emit_progress(args.progress_json, "canvas", "start", "Generating trip visuals")
        try:
            generated_files = attach_canvas_outputs(
                args.region,
                plan,
                args.output_name,
                args.max_images,
                debug=args.debug,
                debug_max_chars=args.debug_max_chars,
            )
        except (NoCredentialsError, PartialCredentialsError, ClientError, BotoCoreError) as error:
            print("\n[ERROR]")
            print(build_bedrock_error_message(error, "canvas", args.region, CANVAS_MODEL_ID))
            raise SystemExit(1) from error
        print(json.dumps({"generated_images": generated_files}, indent=2))
        emit_progress(args.progress_json, "canvas", "complete", "Trip visuals generated")
    else:
        emit_progress(args.progress_json, "canvas", "complete", "Visual generation skipped")

    markdown_file = save_frontend_markdown_dump(plan, generated_files, args.output_name)
    print(f"Saved frontend markdown dump to {markdown_file}")
    emit_progress(args.progress_json, "finalize", "complete", "Frontend-ready output saved")

    if not args.quiet_plan_print:
        print(json.dumps(asdict(plan), indent=2))


if __name__ == "__main__":
    main()