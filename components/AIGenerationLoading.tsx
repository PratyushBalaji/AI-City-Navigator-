'use client';

import { motion } from 'framer-motion';
import { Brain, MapPin, Route, Video, CheckCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export const loadingSteps = [
  {
    key: 'research',
    icon: Brain,
    title: 'AI analyzing city data',
    description: 'Processing local attractions, weather, and cultural insights',
  },
  {
    key: 'planner',
    icon: MapPin,
    title: 'Building your itinerary',
    description: 'Structuring days, places, and route logic from the live research packet',
  },
  {
    key: 'prompt_polish',
    icon: Route,
    title: 'Refining media prompts',
    description: 'Preparing destination-grounded prompts for visual generation',
  },
  {
    key: 'canvas',
    icon: Video,
    title: 'Generating trip visuals',
    description: 'Creating image previews for the highlighted itinerary moments',
  },
];

export interface LoadingStepState {
  key: string;
  status: 'pending' | 'active' | 'complete';
  message?: string;
}

interface AIGenerationLoadingProps {
  isLoading: boolean;
  steps: LoadingStepState[];
  helperText?: ReactNode;
}

export default function AIGenerationLoading({ isLoading, steps, helperText }: AIGenerationLoadingProps) {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-2">Generating Your AI Trip</h3>
          <p className="text-gray-300">Please wait while our AI creates your itinerary and visuals...</p>
        </div>

        {helperText && <div className="mb-6 text-center text-sm text-cyan-200">{helperText}</div>}

        <div className="space-y-4">
          {loadingSteps.map((step) => {
            const state = steps.find(candidate => candidate.key === step.key);
            const isCompleted = state?.status === 'complete';
            const isCurrent = state?.status === 'active';

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`flex items-start space-x-4 p-4 rounded-xl transition-colors ${
                  isCompleted ? 'bg-green-500/20' : isCurrent ? 'bg-white/10' : 'bg-white/5'
                }`}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <step.icon className="w-6 h-6 text-purple-400" />
                    </motion.div>
                  ) : (
                    <step.icon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${isCompleted ? 'text-green-300' : isCurrent ? 'text-white' : 'text-gray-400'}`}>
                    {step.title}
                  </h4>
                  <p className={`text-sm ${isCompleted ? 'text-green-200' : 'text-gray-400'}`}>
                    {state?.message || step.description}
                  </p>
                  {isCurrent && (
                    <motion.div
                      className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}