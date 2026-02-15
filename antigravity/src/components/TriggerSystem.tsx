'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

// Types
interface Suggestion {
  id: string;
  type: 'agent' | 'command' | 'workflow' | 'recent';
  icon: string;
  title: string;
  description: string;
  category?: string;
}

interface TriggerSystemProps {
  onCommand: (command: string) => void;
  onAgentSelect: (agentId: string) => void;
  onWorkflowSelect: (workflowId: string) => void;
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

// Default suggestions
const defaultSuggestions: Suggestion[] = [
  { id: 'email', type: 'agent', icon: '📧', title: 'Email Agent', description: 'Compose, send, and manage emails', category: 'agents' },
  { id: 'browser', type: 'agent', icon: '🌐', title: 'Browser Agent', description: 'Navigate and interact with websites', category: 'agents' },
  { id: 'file', type: 'agent', icon: '📁', title: 'File Agent', description: 'Read, write, and organize files', category: 'agents' },
  { id: 'calendar', type: 'agent', icon: '📅', title: 'Calendar Agent', description: 'Schedule and manage events', category: 'agents' },
  { id: 'code', type: 'agent', icon: '💻', title: 'Code Agent', description: 'Generate, review, and debug code', category: 'agents' },
  { id: 'data', type: 'agent', icon: '📊', title: 'Data Agent', description: 'Analyze and visualize data', category: 'agents' },
  { id: 'compose', type: 'command', icon: '✍️', title: 'Compose Email', description: 'Write and send an email', category: 'commands' },
  { id: 'schedule', type: 'command', icon: '📆', title: 'Schedule Meeting', description: 'Create a new calendar event', category: 'commands' },
  { id: 'search', type: 'command', icon: '🔍', title: 'Search Files', description: 'Find files across your workspace', category: 'commands' },
  { id: 'analyze', type: 'command', icon: '📈', title: 'Analyze Data', description: 'Run data analysis on datasets', category: 'commands' },
  { id: 'generate', type: 'command', icon: '⚡', title: 'Generate Code', description: 'Create code from description', category: 'commands' },
  { id: 'scrape', type: 'command', icon: '🕷️', title: 'Scrape Website', description: 'Extract data from websites', category: 'commands' },
  { id: 'daily-report', type: 'workflow', icon: '📋', title: 'Daily Report', description: 'Generate daily summary report', category: 'workflows' },
  { id: 'email-triage', type: 'workflow', icon: '📬', title: 'Email Triage', description: 'Sort and prioritize emails', category: 'workflows' },
  { id: 'backup', type: 'workflow', icon: '💾', title: 'Backup Files', description: 'Backup important files', category: 'workflows' },
];

const recentCommands: Suggestion[] = [
  { id: 'recent-1', type: 'recent', icon: '🕐', title: 'Send weekly report to team', description: 'Used 2 hours ago', category: 'recent' },
  { id: 'recent-2', type: 'recent', icon: '🕐', title: 'Schedule meeting with John', description: 'Used yesterday', category: 'recent' },
];

// Animated background particles
const BackgroundParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

export default function TriggerSystem({
  onCommand,
  onAgentSelect,
  onWorkflowSelect,
  externalOpen,
  onExternalClose
}: TriggerSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalOpen) {
      setIsOpen(true);
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [externalOpen]);

  const allSuggestions = [...recentCommands, ...defaultSuggestions];

  const filteredSuggestions = allSuggestions.filter(suggestion => {
    const matchesQuery = query === '' ||
      suggestion.title.toLowerCase().includes(query.toLowerCase()) ||
      suggestion.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === 'all' || suggestion.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '@' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
        setQuery('');
        setSelectedIndex(0);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        onExternalClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onExternalClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < filteredSuggestions.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : filteredSuggestions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredSuggestions[selectedIndex]) {
          handleSelect(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Tab':
        e.preventDefault();
        const categories = ['all', 'agents', 'commands', 'workflows', 'recent'];
        const currentIndex = categories.indexOf(activeCategory);
        setActiveCategory(categories[(currentIndex + 1) % categories.length]);
        break;
    }
  }, [selectedIndex, filteredSuggestions, activeCategory]);

  const handleSelect = (suggestion: Suggestion) => {
    setIsOpen(false);
    onExternalClose?.();

    switch (suggestion.type) {
      case 'agent':
        onAgentSelect(suggestion.id);
        break;
      case 'workflow':
        onWorkflowSelect(suggestion.id);
        break;
      case 'command':
      case 'recent':
        onCommand(suggestion.title);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onExternalClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onExternalClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const getTypeBadge = (type: Suggestion['type']) => {
    switch (type) {
      case 'agent':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', gradient: 'from-purple-500 to-pink-500' };
      case 'command':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', gradient: 'from-emerald-500 to-teal-500' };
      case 'workflow':
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', gradient: 'from-amber-500 to-orange-500' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', gradient: 'from-gray-500 to-gray-600' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50"
          >
            <BackgroundParticles />
          </motion.div>

          {/* Command Palette */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.9, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-[12%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
            <div className="relative">
              {/* Glow effect */}
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-3xl blur-xl opacity-30"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <div className="relative bg-[#0a0a0f]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                {/* Search Input */}
                <div className="relative border-b border-white/5">
                  <motion.div
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <span className="text-white font-bold text-lg">@</span>
                  </motion.div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command or search..."
                    className="w-full bg-transparent text-white pl-16 pr-24 py-5 text-lg outline-none placeholder-gray-500 font-medium"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <kbd className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 font-mono">ESC</kbd>
                  </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-1 p-3 border-b border-white/5 bg-white/[0.02]">
                  {[
                    { id: 'all', label: 'All', icon: '✨' },
                    { id: 'agents', label: 'Agents', icon: '🤖' },
                    { id: 'commands', label: 'Commands', icon: '⚡' },
                    { id: 'workflows', label: 'Workflows', icon: '🔄' },
                    { id: 'recent', label: 'Recent', icon: '🕐' },
                  ].map((cat) => (
                    <motion.button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${activeCategory === cat.id
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Suggestions List */}
                <div className="max-h-80 overflow-y-auto p-2">
                  {filteredSuggestions.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <motion.div
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-3xl">🔍</span>
                      </motion.div>
                      <p className="text-gray-400 font-medium mb-1">No results found</p>
                      <p className="text-gray-500 text-sm">Try a different search term</p>
                    </motion.div>
                  ) : (
                    filteredSuggestions.map((suggestion, index) => {
                      const badge = getTypeBadge(suggestion.type);
                      return (
                        <motion.button
                          key={suggestion.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleSelect(suggestion)}
                          className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all relative group ${index === selectedIndex
                              ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30'
                              : 'hover:bg-white/5 border border-transparent'
                            }`}
                        >
                          {/* Selection indicator */}
                          {index === selectedIndex && (
                            <motion.div
                              layoutId="selection"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full"
                            />
                          )}

                          <motion.div
                            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${badge.gradient} bg-opacity-20 flex items-center justify-center flex-shrink-0`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            style={{ background: `linear-gradient(135deg, ${badge.gradient.split(' ')[0].replace('from-', '')}20, ${badge.gradient.split(' ')[1].replace('to-', '')}20)` }}
                          >
                            <span className="text-xl">{suggestion.icon}</span>
                          </motion.div>

                          <div className="flex-1 text-left min-w-0">
                            <p className="text-white font-medium truncate">{suggestion.title}</p>
                            <p className="text-gray-500 text-sm truncate">{suggestion.description}</p>
                          </div>

                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${badge.bg} ${badge.text} border ${badge.border}`}>
                            {suggestion.type}
                          </span>
                        </motion.button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-white/5 bg-white/[0.02]">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">↑</kbd>
                        <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">↓</kbd>
                      </div>
                      <span>Navigate</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">↵</kbd>
                      <span>Select</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">Tab</kbd>
                      <span>Cycle</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Press</span>
                    <motion.kbd
                      className="px-2.5 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg text-purple-300 font-mono font-bold"
                      whileHover={{ scale: 1.1 }}
                    >
                      @
                    </motion.kbd>
                    <span className="text-gray-500">anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
