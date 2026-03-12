'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, PieChart, Brain } from 'lucide-react';

const budgetCategories = [
  {
    name: 'Food & Dining',
    amount: 450,
    color: 'from-orange-400 to-red-400',
    percentage: 45,
    icon: '🍽️',
  },
  {
    name: 'Transportation',
    amount: 200,
    color: 'from-blue-400 to-cyan-400',
    percentage: 20,
    icon: '🚗',
  },
  {
    name: 'Activities',
    amount: 250,
    color: 'from-purple-400 to-pink-400',
    percentage: 25,
    icon: '🎭',
  },
  {
    name: 'Accommodation',
    amount: 100,
    color: 'from-green-400 to-emerald-400',
    percentage: 10,
    icon: '🏨',
  },
];

export default function SmartBudgetTracker() {
  const totalBudget = 1000;
  const spent = budgetCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const remaining = totalBudget - spent;
  const spentPercentage = (spent / totalBudget) * 100;

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
          <PieChart className="w-8 h-8 mr-3" />
          Smart Budget Tracker
        </h2>
        <p className="text-gray-300 text-lg">
          AI-optimized spending breakdown to keep your trip on budget.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Budget Overview */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Budget Overview</h3>
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>

          <div className="space-y-4 w-full">
            <div className="grid grid-cols-2 gap-4 items-center">
              <span className="text-gray-300">Total Budget</span>
              <span className="text-white font-semibold text-right">${totalBudget}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <span className="text-gray-300">Spent</span>
              <span className="text-orange-400 font-semibold text-right">${spent}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <span className="text-gray-300">Remaining</span>
              <span className="text-green-400 font-semibold text-right">${remaining}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Progress</span>
              <span className="text-white">{spentPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${spentPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              ></motion.div>
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Spending Breakdown</h3>
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>

          <div className="space-y-4">
            {budgetCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl min-w-0 overflow-hidden"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span className="text-2xl flex-shrink-0">{category.icon}</span>
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">{category.name}</div>
                    <div className="text-gray-400 text-sm">{category.percentage}%</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-white font-semibold whitespace-nowrap">${category.amount}</div>
                  <div className={`w-16 h-2 bg-gradient-to-r ${category.color} rounded-full mt-1`}></div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true }}
        className="mt-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">AI Budget Insights</h3>
        </div>
        <p className="text-gray-300">
          Your spending is well-balanced! The AI suggests allocating 15% more to activities for a richer experience,
          while staying within your $1000 budget. Consider local dining options to save on food costs.
        </p>
      </motion.div>
    </section>
  );
}