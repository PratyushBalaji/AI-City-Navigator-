'use client';

import { motion } from 'framer-motion';

interface SectionDividerProps {
  variant?: 'wave' | 'gradient' | 'dots' | 'line';
}

export default function SectionDivider({
  variant = 'wave',
}: SectionDividerProps) {
  if (variant === 'wave') {
    return (
      <div className="w-full overflow-hidden">
        <svg
          className="w-full h-20 md:h-32 fill-current text-purple-500/30"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,50 Q300,30 600,50 T1200,50 L1200,120 L0,120 Z"></path>
        </svg>
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent my-16"></div>
    );
  }

  if (variant === 'dots') {
    return (
      <motion.div
        className="flex justify-center items-center my-16 gap-3"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </motion.div>
    );
  }

  return (
    <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent my-16"></div>
  );
}
