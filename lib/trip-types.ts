export interface TripFormData {
  destination: string;
  duration: string;
  budget: string;
  interests: string[];
  travelDates: string;
  travelStyle: string;
  tripNotes: string;
}

export interface TripPlanRequest {
  destination: string;
  duration_days: number;
  budget_text: string;
  travel_dates?: string;
  travel_month?: string;
  travel_style?: string;
  trip_notes?: string;
  interests: string[];
}

export interface ResearchSummary {
  city_summary: string;
  seasonal_context: string;
  transport_notes: string[];
  budget_notes: string[];
}

export interface PlaceSuggestion {
  name: string;
  category: string;
  neighborhood: string;
  best_time_of_day: string;
  estimated_duration_minutes: number;
  crowd_level_estimate: string;
  general_description: string;
  things_to_do: string[];
  source_confidence: string;
}

export interface ItineraryItem {
  item_id: string;
  title: string;
  start_time: string;
  end_time: string;
  place_name: string;
  neighborhood: string;
  activity_type: string;
  estimated_cost: string;
  transit_note: string;
  why_this_fits: string;
}

export interface ItineraryDay {
  day: number;
  theme: string;
  items: ItineraryItem[];
}

export interface MediaScene {
  scene_id: string;
  itinerary_item_id: string;
  title: string;
  priority: string;
  prompt: string;
  style_rules: string[];
}

export interface RecommendedApp {
  name: string;
  category: string;
  reason: string;
}

export interface TripPlan {
  request: TripPlanRequest;
  research_summary: ResearchSummary;
  places: PlaceSuggestion[];
  itinerary_days: ItineraryDay[];
  recommended_apps: RecommendedApp[];
  budget_breakdown: Record<string, string>;
  warnings: string[];
  media_scenes: MediaScene[];
}

export interface GeneratedImage {
  scene_id: string;
  file: string;
  url: string;
}

export interface GenerateTripResult {
  plan: TripPlan;
  generatedImages: GeneratedImage[];
  markdownPath: string | null;
  outputName: string;
}

export interface ProgressEvent {
  type: 'progress';
  stage: string;
  status: string;
  message: string;
}

export interface ResultEvent {
  type: 'result';
  data: GenerateTripResult;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

export type GenerateTripStreamEvent = ProgressEvent | ResultEvent | ErrorEvent;
