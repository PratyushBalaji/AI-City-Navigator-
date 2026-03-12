'use client';

import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, DollarSign, Heart } from 'lucide-react';
import { useState } from 'react';
import Globe from './Globe';

interface HeroSectionProps {
  onGenerateTrip: (data: TripData) => void;
}

interface TripData {
  destination: string;
  duration: string;
  budget: string;
  interests: string[];
}

export default function HeroSection({ onGenerateTrip }: HeroSectionProps) {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const interestOptions = ['Food', 'Nightlife', 'Culture', 'Nature', 'Adventure', 'Relaxation'];

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Trip data:', { destination, duration, budget, interests });
    onGenerateTrip({ destination, duration, budget, interests });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-black pt-32 pb-20">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Website Name */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-6"
        >
          <motion.h1 
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-4 tracking-tight leading-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            AI City{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Navigator
            </span>
          </motion.h1>
          <motion.p 
            className="text-xl md:text-3xl text-gray-300 font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Discover your next adventure with AI-powered travel planning
          </motion.p>
        </motion.div>

        {/* 3D Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className="mb-12"
        >
          <Globe />
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          className="relative -mt-12 z-20 w-full"
        >
          <motion.div
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 max-w-4xl mx-auto hover:bg-white/15 transition-all duration-300"
            whileHover={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.2)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div 
                  className="relative group"
                  whileFocus="focus"
                  variants={{
                    focus: { scale: 1.02 },
                  }}
                >
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 transition-colors group-focus-within:text-purple-300" />
                  <input
                    type="text"
                    placeholder="Destination City"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/10 focus:border-purple-400 transition-all"
                    required
                  />
                </motion.div>
                <motion.div 
                  className="relative group"
                  whileFocus="focus"
                  variants={{
                    focus: { scale: 1.02 },
                  }}
                >
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 transition-colors group-focus-within:text-blue-300" />
                  <input
                    type="text"
                    placeholder="Travel Duration (e.g., 5 days)"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 focus:border-blue-400 transition-all"
                    required
                  />
                </motion.div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div 
                  className="relative group"
                  whileFocus="focus"
                  variants={{
                    focus: { scale: 1.02 },
                  }}
                >
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5 transition-colors group-focus-within:text-green-300" />
                  <input
                    type="text"
                    placeholder="Budget (e.g., $2000)"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white/10 focus:border-green-400 transition-all"
                    required
                  />
                </motion.div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Heart className="text-pink-400 w-5 h-5" />
                    <span className="text-white font-semibold">Choose Interests</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((interest) => (
                      <motion.button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          interests.includes(interest)
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
                        }`}
                      >
                        {interest}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 0 30px rgba(168, 85, 247, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)'
                }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>✨ Generate My AI Trip</span>
                </div>
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}