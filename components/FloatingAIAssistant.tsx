'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Bot } from 'lucide-react';
import { useState } from 'react';

const examplePrompts = [
  "Best nightlife spots in Toronto",
  "Hidden gems in Paris",
  "Budget-friendly restaurants in Tokyo",
  "Family activities in New York",
  "Romantic dinner spots in Barcelona",
];

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean}>>([
    { text: "Hi! I'm your AI travel assistant. How can I help you plan your trip?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    setMessages(prev => [...prev, { text: inputValue, isUser: true }]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: "That's a great question! Let me analyze the best options for you. Based on current data, I recommend checking out some amazing spots that match your interests.",
        isUser: false
      }]);
    }, 1000);
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:shadow-purple-500/50 hover:shadow-2xl transition-all border border-white/20"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-0"
          />
          <MessageCircle className="w-8 h-8 text-white relative z-10" />
        </motion.button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-purple-600/30 to-blue-600/30 p-5 flex items-center justify-between border-b border-white/20">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: 10 }}
                  >
                    <Bot className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-white font-bold">AI Travel Assistant</h3>
                    <motion.p 
                      className="text-gray-300 text-xs font-medium"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ● Online now
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-transparent to-black/10">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`max-w-[80%] p-4 rounded-2xl backdrop-blur-sm ${
                        message.isUser
                          ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-none shadow-lg'
                          : 'bg-white/15 text-gray-100 rounded-bl-none border border-white/20'
                      }`}
                    >
                      {message.text}
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Example Prompts */}
              {messages.length === 1 && (
                <motion.div 
                  className="px-5 py-4 bg-black/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wider">💡 Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.slice(0, 3).map((prompt) => (
                      <motion.button
                        key={prompt}
                        whileHover={{ scale: 1.05, y: -2 }}
                        onClick={() => handlePromptClick(prompt)}
                        className="text-xs bg-white/10 hover:bg-gradient-to-r hover:from-purple-500/50 hover:to-blue-500/50 text-gray-300 hover:text-white px-3 py-2 rounded-full transition-all border border-white/20 hover:border-white/40"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-white/20 bg-black/10">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about your trip..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/15 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSendMessage}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl hover:shadow-lg transition-all"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}