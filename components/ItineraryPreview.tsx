'use client';

import { motion } from 'framer-motion';
import { Clock, MapPin, Smartphone, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { TripPlan } from '../lib/trip-types';

interface ItineraryPreviewProps {
  plan: TripPlan;
  onApplyTweaks: (notes: string) => void;
  isApplyingTweaks: boolean;
}

export default function ItineraryPreview({ plan, onApplyTweaks, isApplyingTweaks }: ItineraryPreviewProps) {
  const [tweakNotes, setTweakNotes] = useState('');
  const firstDay = plan.itinerary_days[0];
  const topApps = plan.recommended_apps.slice(0, 4);

  const handleTweakSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!tweakNotes.trim()) {
      return;
    }
    onApplyTweaks(tweakNotes.trim());
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="py-16 px-6 max-w-6xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Your AI-Generated Trip to {plan.request.destination}
        </h2>
        <p className="text-gray-300 text-lg">
          {plan.request.duration_days} days • Budget: {plan.request.budget_text} • Interests: {plan.request.interests.join(', ')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Clock className="w-6 h-6 mr-2" />
            Trip Snapshot
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-purple-300 mb-3">Research Summary</h4>
              <p className="text-gray-300 leading-relaxed">{plan.research_summary.city_summary}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-300 mb-3">Season & Travel Context</h4>
              <p className="text-gray-300 leading-relaxed">{plan.research_summary.seasonal_context}</p>
            </div>

            {firstDay && (
              <div>
                <h4 className="text-lg font-semibold text-green-300 mb-3">Day 1 Highlights</h4>
                <div className="space-y-3">
                  {firstDay.items.slice(0, 4).map((item) => (
                    <div key={item.item_id} className="flex items-start space-x-3">
                      <div className="text-sm text-gray-400 w-24">{item.start_time}</div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{item.title}</div>
                        <div className="text-gray-400 text-sm flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {item.place_name}, {item.neighborhood}
                        </div>
                        <div className="text-gray-500 text-sm mt-1">{item.why_this_fits}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Smartphone className="w-6 h-6 mr-2" />
            Recommended Apps & Tweaks
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {topApps.map((app) => (
              <div
                key={app.name}
                className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="text-white font-medium text-sm">{app.name}</div>
                <div className="text-purple-300 text-xs mt-1">{app.category}</div>
                <div className="text-gray-400 text-xs mt-2">{app.reason}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleTweakSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Sparkles className="w-5 h-5 text-cyan-300" />
              Lightly Adjust The Plan
            </div>
            <textarea
              value={tweakNotes}
              onChange={(event) => setTweakNotes(event.target.value)}
              placeholder="Example: I am recovering from illness, keep activities after 6pm and avoid long walks."
              className="w-full min-h-32 rounded-2xl bg-black/20 border border-white/15 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="submit"
              disabled={isApplyingTweaks || !tweakNotes.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplyingTweaks ? 'Regenerating itinerary...' : 'Apply These Tweaks'}
            </button>
          </form>
        </motion.div>
      </div>
    </motion.section>
  );
}