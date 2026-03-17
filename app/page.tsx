'use client';

import { useMemo, useState } from 'react';
import Navigation from '../components/Navigation';
import HeroSection from '../components/HeroSection';
import ItineraryPreview from '../components/ItineraryPreview';
import VideoPreview from '../components/VideoPreview';
import FeaturesGrid from '../components/FeaturesGrid';
import InteractiveMapSection from '../components/InteractiveMapSection';
import TripTimeline from '../components/TripTimeline';
import RecommendedAppsSection from '../components/RecommendedAppsSection';
import ExplorePopularCities from '../components/ExplorePopularCities';
import SmartBudgetTracker from '../components/SmartBudgetTracker';
import FloatingAIAssistant from '../components/FloatingAIAssistant';
import Footer from '../components/Footer';
import SectionDivider from '../components/SectionDivider';
import AIGenerationLoading, { loadingSteps, type LoadingStepState } from '../components/AIGenerationLoading';
import type { GenerateTripResult, GenerateTripStreamEvent, TripFormData } from '../lib/trip-types';

function createInitialStepState(): LoadingStepState[] {
  return loadingSteps.map((step) => ({
    key: step.key,
    status: 'pending',
    message: step.description,
  }));
}

export default function Home() {
  const [tripFormData, setTripFormData] = useState<TripFormData | null>(null);
  const [generatedTrip, setGeneratedTrip] = useState<GenerateTripResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<LoadingStepState[]>(createInitialStepState());
  const [progressMessage, setProgressMessage] = useState<string>('Connecting to the local AI backend...');

  const visiblePlan = generatedTrip?.plan ?? null;

  const markdownFileName = useMemo(() => {
    if (!generatedTrip?.markdownPath) {
      return null;
    }
    return generatedTrip.markdownPath.split('/').pop() ?? generatedTrip.markdownPath;
  }, [generatedTrip]);

  const updateProgress = (stage: string, status: string, message: string) => {
    setProgressMessage(message);
    const stageOrder = loadingSteps.map(step => step.key);
    const currentStageIndex = stageOrder.indexOf(stage);

    setProgressSteps((previous) =>
      previous.map((step, index) => {
        if (step.key === stage) {
          return { ...step, status: status === 'complete' ? 'complete' : 'active', message };
        }
        if (currentStageIndex !== -1 && index < currentStageIndex) {
          return { ...step, status: 'complete' };
        }
        if (status === 'complete' && currentStageIndex !== -1 && index === currentStageIndex) {
          return { ...step, status: 'complete', message };
        }
        return step;
      })
    );
  };

  const runGeneration = async (data: TripFormData) => {
    setTripFormData(data);
    setIsGenerating(true);
    setGenerationError(null);
    setProgressSteps(createInitialStepState());
    setProgressMessage('Connecting to the local AI backend...');

    const response = await fetch('/api/generate-trip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Generation request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('The generation stream is unavailable.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }
        const event = JSON.parse(line) as GenerateTripStreamEvent;
        if (event.type === 'progress') {
          updateProgress(event.stage, event.status, event.message);
        } else if (event.type === 'result') {
          setGeneratedTrip(event.data);
        } else if (event.type === 'error') {
          throw new Error(event.message);
        }
      }
    }
  };

  const handleGenerateTrip = async (data: TripFormData) => {
    try {
      await runGeneration(data);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyTweaks = async (tweakNotes: string) => {
    if (!tripFormData) {
      return;
    }

    const nextFormData: TripFormData = {
      ...tripFormData,
      tripNotes: [tripFormData.tripNotes, tweakNotes].filter(Boolean).join(' '),
    };

    try {
      await runGeneration(nextFormData);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Regeneration failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Navigation />
      <HeroSection onGenerateTrip={handleGenerateTrip} isGenerating={isGenerating} />

      {generationError && (
        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-red-400/30 bg-red-500/10 px-6 py-4 text-red-100">
          {generationError}
        </div>
      )}

      {visiblePlan && (
        <>
          <SectionDivider variant="wave" />
          <section className="py-24 px-6 max-w-7xl mx-auto">
            <ItineraryPreview
              plan={visiblePlan}
              onApplyTweaks={handleApplyTweaks}
              isApplyingTweaks={isGenerating}
            />
          </section>
          <SectionDivider variant="gradient" />

          <section className="py-24 px-6">
            <InteractiveMapSection />
          </section>
          <SectionDivider variant="dots" />

          <section className="py-24 px-6">
            <TripTimeline plan={visiblePlan} />
          </section>
          <SectionDivider variant="gradient" />

          <section className="py-24 px-6">
            <RecommendedAppsSection apps={visiblePlan.recommended_apps} />
          </section>
          <SectionDivider variant="wave" />

          <section className="py-24 px-6">
            <SmartBudgetTracker plan={visiblePlan} />
          </section>
          <SectionDivider variant="gradient" />
        </>
      )}

      <section id="video" className="py-24 px-6">
        <VideoPreview plan={visiblePlan} generatedImages={generatedTrip?.generatedImages ?? []} />
      </section>

      {generatedTrip && markdownFileName && (
        <section className="px-6 pb-10 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-cyan-100">
            Frontend dump saved as <span className="font-semibold">{markdownFileName}</span> in <span className="font-semibold">backend/outputs</span>.
          </div>
        </section>
      )}
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
        steps={progressSteps}
        helperText={progressMessage}
      />
    </div>
  );
}
