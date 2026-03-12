'use client';

import { motion } from 'framer-motion';
import { Brain, MapPin, Route, Video, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const loadingSteps = [
  {
    icon: Brain,
    title: 'AI analyzing city data',
    description: 'Processing local attractions, weather, and cultural insights',
    duration: 2000,
  },
  {
    icon: MapPin,
    title: 'Finding the best places',
    description: 'Discovering hidden gems and must-visit locations',
    duration: 2500,
  },
  {
    icon: Route,
    title: 'Optimizing travel routes',
    description: 'Creating efficient itineraries with minimal travel time',
    duration: 2000,
  },
  {
    icon: Video,
    title: 'Generating video preview',
    description: 'Creating an immersive AI travel video for your trip',
    duration: 3000,
  },
];

interface AIGenerationLoadingProps {
  isLoading: boolean;
  onComplete: () => void;
}

export default function AIGenerationLoading({ isLoading, onComplete }: AIGenerationLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isLoading) return;

    let timeoutId: NodeJS.Timeout;

    const runSteps = async () => {
      for (let i = 0; i < loadingSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, loadingSteps[i].duration);
        });
        setCompletedSteps(prev => [...prev, i]);
      }
      onComplete();
    };

    runSteps();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, onComplete]);

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
          <p className="text-gray-300">Please wait while our AI creates your perfect itinerary...</p>
        </div>

        <div className="space-y-4">
          {loadingSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;

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
                    {step.description}
                  </p>
                  {isCurrent && (
                    <motion.div
                      className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: loadingSteps[index].duration / 1000, ease: "easeInOut" }}
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