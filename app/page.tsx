'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';
import HeroSection from '../components/HeroSection';
import ItineraryPreview from '../components/ItineraryPreview';
import VideoPreview from '../components/VideoPreview';
import FeaturesGrid from '../components/FeaturesGrid';
import InteractiveMapSection from '../components/InteractiveMapSection';
import TripTimeline from '../components/TripTimeline';
import RecommendedAppsSection from '../components/RecommendedAppsSection';
import ExplorePopularCities from '../components/ExplorePopularCities';
import AIGenerationLoading from '../components/AIGenerationLoading';
import SmartBudgetTracker from '../components/SmartBudgetTracker';
import FloatingAIAssistant from '../components/FloatingAIAssistant';
import Footer from '../components/Footer';
import SectionDivider from '../components/SectionDivider';

interface TripData {
  destination: string;
  duration: string;
  budget: string;
  interests: string[];
}

export default function Home() {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateTrip = (data: TripData) => {
    setIsGenerating(true);
    // Simulate generation time
    setTimeout(() => {
      setTripData(data);
      setIsGenerating(false);
    }, 9500); // Total of all step durations
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Navigation />
      <HeroSection onGenerateTrip={handleGenerateTrip} />

      {tripData && (
        <>
          <SectionDivider variant="wave" />
          <section className="py-24 px-6 max-w-7xl mx-auto">
            <ItineraryPreview tripData={tripData} />
          </section>
          <SectionDivider variant="gradient" />

          <section className="py-24 px-6">
            <InteractiveMapSection />
          </section>
          <SectionDivider variant="dots" />

          <section className="py-24 px-6">
            <TripTimeline />
          </section>
          <SectionDivider variant="gradient" />

          <section className="py-24 px-6">
            <RecommendedAppsSection />
          </section>
          <SectionDivider variant="wave" />

          <section className="py-24 px-6">
            <SmartBudgetTracker />
          </section>
          <SectionDivider variant="gradient" />
        </>
      )}

      <section id="video" className="py-24 px-6">
        <VideoPreview />
      </section>
      <SectionDivider variant="dots" />

      <FeaturesGrid />
      <SectionDivider variant="gradient" />

      <section id="cities" className="py-24 px-6">
        <ExplorePopularCities />
      </section>
      <SectionDivider variant="wave" />

      <Footer />

      <FloatingAIAssistant />

      <AIGenerationLoading
        isLoading={isGenerating}
        onComplete={() => setIsGenerating(false)}
      />
    </div>
  );
}
