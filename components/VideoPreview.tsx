'use client';

import { motion } from 'framer-motion';
import { ImageIcon, Video } from 'lucide-react';
import { useState } from 'react';
import type { GeneratedImage, TripPlan } from '../lib/trip-types';

interface VideoPreviewProps {
  plan: TripPlan | null;
  generatedImages: GeneratedImage[];
}

export default function VideoPreview({ plan, generatedImages }: VideoPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = generatedImages[activeIndex] ?? null;
  const activeScene = activeImage
    ? plan?.media_scenes.find(scene => scene.scene_id === activeImage.scene_id || activeImage.scene_id.endsWith(scene.scene_id))
    : null;

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            {generatedImages.length > 0 ? 'Your AI Travel Preview' : 'Your AI Travel Preview'}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 mx-auto mb-6 rounded-full"></div>
        </motion.div>
        <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
          Experience your destination before you go. Our AI generates immersive video previews
          that bring your itinerary to life with stunning visuals and local insights.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
        className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-1 shadow-2xl border border-white/20 overflow-hidden group"
      >
        {/* Gradient Border */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>

        <div className="relative bg-white/5 rounded-3xl overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-3xl flex items-center justify-center relative overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-bounce"></div>
            <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>

            {activeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeImage.url}
                alt={activeScene?.title ?? 'Generated trip scene'}
                className="relative z-10 h-full w-full object-cover"
              />
            ) : (
              <div className="relative z-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-8 hover:shadow-2xl transition-all">
                <ImageIcon className="w-10 h-10 text-white" />
              </div>
            )}

            <motion.div 
              className="absolute top-6 right-6 bg-black/60 backdrop-blur-sm rounded-full p-3 border border-white/20"
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <Video className="w-6 h-6 text-white" />
            </motion.div>
          </div>

          {/* Video Info */}
          <div className="mt-8 text-center px-6 pb-8">
            <h3 className="text-2xl font-bold text-white mb-3">
              {activeScene?.title ?? 'AI-Generated Travel Gallery'}
            </h3>
            <p className="text-gray-400 leading-relaxed">
              {activeScene?.prompt ?? 'Generate your trip to see a visual slideshow of the itinerary highlights and destination mood.'}
            </p>
          </div>

          {generatedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 pb-8">
              {generatedImages.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`overflow-hidden rounded-2xl border ${index === activeIndex ? 'border-cyan-300' : 'border-white/10'} bg-white/5`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={`Scene ${index + 1}`} className="h-28 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}