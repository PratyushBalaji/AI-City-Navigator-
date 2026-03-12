'use client';

import { motion } from 'framer-motion';
import { MapPin, Sparkles } from 'lucide-react';

const cities = [
  {
    name: 'Toronto',
    country: 'Canada',
    description: 'Vibrant multicultural city with stunning architecture and diverse food scene.',
    image: '🏙️',
    highlights: ['CN Tower', 'Food Scene', 'Nightlife'],
  },
  {
    name: 'New York',
    country: 'USA',
    description: 'The city that never sleeps, offering endless entertainment and cultural experiences.',
    image: '🗽',
    highlights: ['Times Square', 'Broadway', 'Museums'],
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    description: 'A perfect blend of traditional culture and cutting-edge technology.',
    image: '🏯',
    highlights: ['Shibuya', 'Sushi', 'Technology'],
  },
  {
    name: 'Paris',
    country: 'France',
    description: 'The city of lovecity of love#39;s, famous for its art, fashion, and romantic atmosphere.',
    image: '🗼',
    highlights: ['Eiffel Tower', 'Art Museums', 'Cafés'],
  },
  {
    name: 'London',
    country: 'UK',
    description: 'Historic landmarks meet modern culture in this iconic global city.',
    image: '🏰',
    highlights: ['Big Ben', 'Theater', 'Royal Parks'],
  },
  {
    name: 'Barcelona',
    country: 'Spain',
    description: 'Mediterranean charm with Gaudí architecture and vibrant beach culture.',
    image: '🏖️',
    highlights: ['Sagrada Familia', 'Beaches', 'Tapas'],
  },
];

export default function ExplorePopularCities() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-20"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-yellow-400" />
            Explore Popular Destinations
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 mx-auto mb-6 rounded-full"></div>
        </motion.div>
        <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
          Discover AI-generated itineraries for the world&apos;s most exciting destinations.
          Each city is ready to inspire your next adventure.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cities.map((city, index) => (
          <motion.div
            key={city.name}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.12 }}
            viewport={{ once: true }}
            whileHover={{ y: -10, boxShadow: '0 20px 50px rgba(168, 85, 247, 0.3)' }}
            className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all duration-300"></div>
            
            <div className="relative z-10">
              {/* City Image/Icon */}
              <motion.div 
                className="text-7xl mb-6 text-center"
                whileHover={{ scale: 1.2, rotate: 5 }}
              >
                {city.image}
              </motion.div>

              {/* City Info */}
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">{city.name}</h3>
                <p className="text-purple-300 text-sm font-medium">{city.country}</p>
              </div>

              <p className="text-gray-400 text-sm mb-6 leading-relaxed group-hover:text-gray-300 transition-colors">
                {city.description}
              </p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2 mb-6">
                {city.highlights.map((highlight) => (
                  <motion.span
                    key={highlight}
                    whileHover={{ scale: 1.05 }}
                    className="text-xs bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-gray-300 px-3 py-1.5 rounded-full border border-white/10 group-hover:border-white/30 transition-colors"
                  >
                    {highlight}
                  </motion.span>
                ))}
              </div>

              {/* Button */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(168, 85, 247, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
              >
                <MapPin className="w-4 h-4" />
                <span>✨ Generate Trip</span>
              </motion.button>
            </div>

            {/* Bottom Border Accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/0 via-pink-500 to-blue-500/0 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}