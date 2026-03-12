'use client';

import { motion } from 'framer-motion';
import { Smartphone, Star, ExternalLink } from 'lucide-react';

const apps = [
  {
    name: 'Uber',
    icon: '🚗',
    description: 'Ride sharing and transportation',
    rating: 4.8,
    category: 'Transport',
  },
  {
    name: 'Transit',
    icon: '🚌',
    description: 'Public transportation schedules',
    rating: 4.6,
    category: 'Transport',
  },
  {
    name: 'Eventbrite',
    icon: '🎭',
    description: 'Local events and experiences',
    rating: 4.7,
    category: 'Events',
  },
  {
    name: 'Yelp',
    icon: '🍽️',
    description: 'Restaurant reviews and dining',
    rating: 4.5,
    category: 'Food',
  },
  {
    name: 'TripAdvisor',
    icon: '🗺️',
    description: 'Travel reviews and attractions',
    rating: 4.4,
    category: 'Travel',
  },
  {
    name: 'Spotify',
    icon: '🎵',
    description: 'Local music and playlists',
    rating: 4.9,
    category: 'Entertainment',
  },
];

export default function RecommendedAppsSection() {
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
          <Smartphone className="w-8 h-8 mr-3" />
          Essential Apps for Your Trip
        </h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Download these recommended apps to enhance your travel experience and stay connected.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app, index) => (
          <motion.div
            key={app.name}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{app.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{app.name}</h3>
                  <span className="text-sm text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                    {app.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-300">{app.rating}</span>
              </div>
            </div>

            <p className="text-gray-400 mb-6 leading-relaxed">{app.description}</p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 hover:shadow-lg transition-shadow"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open App</span>
            </motion.button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}