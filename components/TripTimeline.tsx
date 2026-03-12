'use client';

import { motion } from 'framer-motion';
import { Clock, Coffee, Camera, Moon } from 'lucide-react';

const timelineItems = [
  {
    time: '8:00 AM',
    icon: Coffee,
    title: 'Morning Coffee & Breakfast',
    description: 'Start your day at a local café with fresh pastries and artisanal coffee.',
    period: 'morning',
  },
  {
    time: '10:00 AM',
    icon: Camera,
    title: 'Historic Museum Visit',
    description: 'Explore fascinating exhibits and learn about the city\'s rich history.',
    period: 'morning',
  },
  {
    time: '12:00 PM',
    icon: Coffee,
    title: 'Lunch at Food District',
    description: 'Enjoy authentic local cuisine at a recommended restaurant.',
    period: 'afternoon',
  },
  {
    time: '2:00 PM',
    icon: Camera,
    title: 'Central Park Exploration',
    description: 'Take a relaxing walk through beautiful gardens and scenic views.',
    period: 'afternoon',
  },
  {
    time: '6:00 PM',
    icon: Camera,
    title: 'Sunset Hill Viewpoint',
    description: 'Witness breathtaking sunset views from the city\'s highest point.',
    period: 'evening',
  },
  {
    time: '8:00 PM',
    icon: Moon,
    title: 'Nightlife Experience',
    description: 'Dive into the vibrant nightlife with live music and local entertainment.',
    period: 'evening',
  },
];

const periodColors = {
  morning: 'from-orange-400 to-yellow-400',
  afternoon: 'from-blue-400 to-cyan-400',
  evening: 'from-purple-400 to-pink-400',
};

export default function TripTimeline() {
  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center">
          <Clock className="w-8 h-8 mr-3" />
          Your Day-by-Day Itinerary
        </h2>
        <p className="text-gray-300 text-lg">
          Follow this AI-optimized schedule for the perfect trip experience.
        </p>
      </motion.div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-cyan-500"></div>

        <div className="space-y-8">
          {timelineItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative flex items-start space-x-6"
            >
              {/* Timeline Dot */}
              <div className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-r ${periodColors[item.period as keyof typeof periodColors]} flex items-center justify-center shadow-lg`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex-1 bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <span className="text-sm font-medium text-gray-300 bg-white/10 px-3 py-1 rounded-full">
                    {item.time}
                  </span>
                </div>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}