'use client';

import { motion } from 'framer-motion';
import { Clock, MapPin, Smartphone, Star } from 'lucide-react';

interface ItineraryPreviewProps {
  tripData: {
    destination: string;
    duration: string;
    budget: string;
    interests: string[];
  };
}

export default function ItineraryPreview({ tripData }: ItineraryPreviewProps) {
  const mockItinerary = {
    morning: [
      { time: '8:00 AM', activity: 'Breakfast at local café', location: 'Downtown' },
      { time: '10:00 AM', activity: 'Visit historic museum', location: 'City Center' },
    ],
    afternoon: [
      { time: '12:00 PM', activity: 'Lunch at recommended restaurant', location: 'Food District' },
      { time: '2:00 PM', activity: 'Explore nature park', location: 'Outskirts' },
    ],
    evening: [
      { time: '6:00 PM', activity: 'Sunset viewing', location: 'Hilltop' },
      { time: '8:00 PM', activity: 'Dinner and nightlife', location: 'Entertainment District' },
    ],
  };

  const recommendedApps = [
    { name: 'Uber', icon: '🚗', description: 'Ride sharing' },
    { name: 'Transit', icon: '🚌', description: 'Public transport' },
    { name: 'Eventbrite', icon: '🎭', description: 'Local events' },
    { name: 'Yelp', icon: '🍽️', description: 'Restaurant reviews' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="py-16 px-6 max-w-6xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Your AI-Generated Trip to {tripData.destination}
        </h2>
        <p className="text-gray-300 text-lg">
          {tripData.duration} • Budget: {tripData.budget} • Interests: {tripData.interests.join(', ')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Itinerary Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Clock className="w-6 h-6 mr-2" />
            Daily Itinerary
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-purple-300 mb-3">Morning</h4>
              <div className="space-y-3">
                {mockItinerary.morning.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="text-sm text-gray-400 w-16">{item.time}</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{item.activity}</div>
                      <div className="text-gray-400 text-sm flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-300 mb-3">Afternoon</h4>
              <div className="space-y-3">
                {mockItinerary.afternoon.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="text-sm text-gray-400 w-16">{item.time}</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{item.activity}</div>
                      <div className="text-gray-400 text-sm flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-green-300 mb-3">Evening</h4>
              <div className="space-y-3">
                {mockItinerary.evening.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="text-sm text-gray-400 w-16">{item.time}</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{item.activity}</div>
                      <div className="text-gray-400 text-sm flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Apps Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Smartphone className="w-6 h-6 mr-2" />
            Recommended Apps
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {recommendedApps.map((app, index) => (
              <motion.div
                key={app.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="text-3xl mb-2">{app.icon}</div>
                <div className="text-white font-medium text-sm">{app.name}</div>
                <div className="text-gray-400 text-xs">{app.description}</div>
                <div className="flex justify-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}