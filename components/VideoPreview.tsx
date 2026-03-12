'use client';

import { motion } from 'framer-motion';
import { Play, Video } from 'lucide-react';

export default function VideoPreview() {
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
            Your AI Travel Preview
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
          {/* Video Placeholder */}
          <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-3xl flex items-center justify-center relative overflow-hidden">
            {/* Animated Background */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-bounce"></div>
            <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>

            {/* Play Button */}
            <motion.button
              whileHover={{ scale: 1.15, boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)' }}
              whileTap={{ scale: 0.9 }}
              className="relative z-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-8 hover:shadow-2xl transition-all"
            >
              <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
            </motion.button>

            {/* Video Icon Overlay */}
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
              AI-Generated Travel Video
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Watch a personalized preview of your trip, featuring key attractions,
              local culture, and hidden gems tailored to your preferences.
            </p>
          </div>

          {/* Coming Soon Badge */}
          <motion.div 
            className="absolute top-6 left-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            ✨ Coming Soon
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}