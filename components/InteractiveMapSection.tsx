'use client';

import { motion } from 'framer-motion';
import { Route } from 'lucide-react';

export default function InteractiveMapSection() {
  const itineraryStops = [
    { name: 'Downtown Café', time: '8:00 AM', coords: { x: 20, y: 30 } },
    { name: 'Historic Museum', time: '10:00 AM', coords: { x: 40, y: 50 } },
    { name: 'Central Park', time: '2:00 PM', coords: { x: 60, y: 40 } },
    { name: 'Sunset Hill', time: '6:00 PM', coords: { x: 80, y: 60 } },
    { name: 'Nightlife District', time: '8:00 PM', coords: { x: 70, y: 80 } },
  ];

  return (
    <section className="py-16 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center">
          <Route className="w-8 h-8 mr-3" />
          Explore Your Route
        </h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Visualize your AI-generated itinerary on an interactive map with optimized routes and key stops.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
        className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 overflow-hidden"
      >
        {/* Map Placeholder */}
        <div className="aspect-[16/10] bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>

          {/* Route Line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M20,30 Q40,25 40,50 T60,40 Q70,45 80,60 Q75,70 70,80"
              stroke="url(#routeGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
            />
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Itinerary Markers */}
          {itineraryStops.map((stop, index) => (
            <motion.div
              key={stop.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.2 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${stop.coords.x}%`, top: `${stop.coords.y}%` }}
            >
              <div className="relative group">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="font-semibold">{stop.name}</div>
                  <div className="text-gray-300">{stop.time}</div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Map Controls Placeholder */}
          <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-2">
            <div className="w-6 h-6 bg-white/20 rounded"></div>
          </div>
        </div>

        {/* Map Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {itineraryStops.map((stop, index) => (
            <motion.div
              key={stop.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
              className="flex items-center space-x-2 bg-white/5 rounded-full px-4 py-2"
            >
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
              <span className="text-white text-sm">{stop.name}</span>
              <span className="text-gray-400 text-xs">{stop.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}