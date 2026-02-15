'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import TriggerSystem from '@/components/TriggerSystem';

// Animated background particles
const Particles = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-purple-500/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Floating orbs
const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large purple orb */}
      <motion.div
        className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Pink orb */}
      <motion.div
        className="absolute top-1/3 -right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, -30, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Blue orb */}
      <motion.div
        className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, 40, 0],
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

// Animated gradient text
const GradientText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">{children}</span>
      <span className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">{children}</span>
    </span>
  );
};

// Glowing button
const GlowButton = ({ children, href, primary = false, onClick }: { children: React.ReactNode; href?: string; primary?: boolean; onClick?: () => void }) => {
  const Component = href ? Link : 'button';
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group"
    >
      {primary && (
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition duration-500 animate-pulse-slow" />
      )}
      <Component
        href={href || '#'}
        onClick={onClick}
        className={`relative flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 ${primary
            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-xl shadow-purple-500/25'
            : 'bg-white/5 backdrop-blur-sm text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
          }`}
      >
        {children}
      </Component>
    </motion.div>
  );
};

// Feature card with 3D tilt effect
const FeatureCard = ({ icon, title, description, gradient, delay }: { icon: React.ReactNode; title: string; description: string; gradient: string; delay: number }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX((y - centerY) / 10);
    setRotateY((centerX - x) / 10);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" style={{ background: gradient }} />
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all duration-300 group-hover:bg-white/[0.05]">
        <motion.div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${gradient}`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {icon}
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

// Animated counter
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// MCP Server card with hover effect
const MCPServerCard = ({ name, icon, color, delay }: { name: string; icon: string; color: string; delay: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative group cursor-pointer"
    >
      <div className={`absolute inset-0 ${color} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
      <div className="relative bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-6 text-center hover:border-white/10 transition-all duration-300 group-hover:bg-white/[0.05]">
        <motion.div
          className="text-4xl mb-3"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {icon}
        </motion.div>
        <div className="text-white font-medium text-sm">{name}</div>
      </div>
    </motion.div>
  );
};

// Pricing card
const PricingCard = ({ name, price, description, features, popular = false, delay }: { name: string; price: string; description: string; features: string[]; popular?: boolean; delay: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={`relative group ${popular ? 'lg:-mt-4' : ''}`}
    >
      {popular && (
        <motion.div
          className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-3xl blur-lg opacity-50"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div className={`relative h-full bg-white/[0.03] backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 ${popular ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/5 hover:border-white/10'}`}>
        {popular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Most Popular
            </motion.div>
          </div>
        )}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
        <div className="mb-6">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-gray-500">/month</span>
        </div>
        <ul className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: delay + i * 0.1 }}
              className="flex items-center text-gray-300 text-sm"
            >
              <svg className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </motion.li>
          ))}
        </ul>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${popular
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-lg shadow-purple-500/25'
              : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
            }`}
        >
          Get Started
        </motion.button>
      </div>
    </motion.div>
  );
};

export default function HomePage() {
  const [triggerOpen, setTriggerOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const handleCommand = (command: string) => {
    console.log('Command:', command);
    alert(`Executing: ${command}`);
  };

  const handleAgentSelect = (agentId: string) => {
    console.log('Agent selected:', agentId);
    alert(`Agent selected: ${agentId}`);
  };

  const handleWorkflowSelect = (workflowId: string) => {
    console.log('Workflow selected:', workflowId);
    alert(`Workflow selected: ${workflowId}`);
  };

  return (
    <div className="min-h-screen bg-[#030008] font-sans antialiased overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <FloatingOrbs />
        <Particles />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl">
            <div className="flex justify-between items-center h-16 px-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-3"
              >
                <Link href="/" className="flex items-center space-x-3 group">
                  <motion.div
                    className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <span className="text-white font-black text-lg tracking-tight">A</span>
                  </motion.div>
                  <span className="text-white font-bold text-lg tracking-tight">Antigravity</span>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="hidden md:flex items-center space-x-1"
              >
                {[
                  { href: '/builder', label: 'Agent Builder' },
                  { href: '/marketplace', label: 'MCP Marketplace' },
                  { href: '/pricing', label: 'Pricing' },
                  { href: '/docs', label: 'Docs' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5 text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-3"
              >
                <button className="text-gray-400 hover:text-white transition-colors px-4 py-2 text-sm font-medium">
                  Sign In
                </button>
                <Link href="/builder">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/20 cursor-pointer"
                  >
                    Get Started
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </motion.span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20">
        <motion.div style={{ y, opacity }} className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8"
          >
            <span className="relative flex h-2.5 w-2.5 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span className="text-purple-300 text-sm font-medium">Now in Public Beta — 100+ MCP Servers Available</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight leading-[1.1]"
          >
            Build AI Agents That
            <br />
            <GradientText className="text-5xl md:text-7xl lg:text-8xl">Actually Work</GradientText>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            The ultimate AI agent builder platform. Create powerful automation workflows visually,
            connect to <span className="text-white font-medium">100+ MCP servers</span>, and deploy anywhere — no code required.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <GlowButton href="/builder" primary>
              <span>Start Building Free</span>
              <motion.svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            </GlowButton>
            <GlowButton>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Watch Demo</span>
            </GlowButton>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center flex-wrap gap-6 text-gray-500 text-sm"
          >
            {['No credit card required', 'Free forever tier', 'Setup in 2 minutes'].map((text, i) => (
              <span key={text} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {text}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
            <motion.div
              className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 100, suffix: '+', label: 'MCP Servers' },
              { value: 50, suffix: 'K+', label: 'Agents Created' },
              { value: 99, suffix: '.9%', label: 'Uptime SLA' },
              { value: 10, suffix: 'K+', label: 'Active Users' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Everything You Need
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Powerful features that make agent creation simple, scalable, and secure
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>}
              title="Visual Agent Builder"
              description="Drag-and-drop workflow designer with real-time preview. No coding required — just describe what you want in plain English."
              gradient="bg-gradient-to-br from-purple-500 to-pink-500"
              delay={0.1}
            />
            <FeatureCard
              icon={<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
              title="100+ MCP Servers"
              description="Connect to Google Cloud, GitHub, Stripe, Notion, and 100+ more services. One-click installation from our marketplace."
              gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
              delay={0.2}
            />
            <FeatureCard
              icon={<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              title="Enterprise-Ready"
              description="SOC 2 Type II, HIPAA compliant. VPC deployment, custom SLAs up to 99.99%, and dedicated support for enterprise teams."
              gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* MCP Servers Showcase */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Integrations</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Connect to Anything
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Our MCP server library is the largest in the industry — connect to any service in seconds
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Google Cloud', icon: '🔷', color: 'bg-blue-500' },
              { name: 'GitHub', icon: '🐙', color: 'bg-gray-500' },
              { name: 'Stripe', icon: '💳', color: 'bg-purple-500' },
              { name: 'Notion', icon: '📝', color: 'bg-gray-400' },
              { name: 'Slack', icon: '💬', color: 'bg-purple-400' },
              { name: 'AWS', icon: '☁️', color: 'bg-amber-500' },
              { name: 'MongoDB', icon: '🍃', color: 'bg-green-500' },
              { name: 'PostgreSQL', icon: '🐘', color: 'bg-blue-400' },
              { name: 'Redis', icon: '🔴', color: 'bg-red-500' },
              { name: 'Figma', icon: '🎨', color: 'bg-pink-500' },
              { name: 'Linear', icon: '📊', color: 'bg-blue-600' },
              { name: 'Jira', icon: '📋', color: 'bg-blue-500' },
            ].map((service, i) => (
              <MCPServerCard key={service.name} {...service} delay={i * 0.05} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/marketplace" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors group">
              <span>View all 100+ MCP servers</span>
              <motion.svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              description="For hobbyists and testing"
              features={['1 active agent', '10,000 actions/month', '10 MCP servers', 'Community support']}
              delay={0.1}
            />
            <PricingCard
              name="Pro"
              price="$29"
              description="For individuals"
              features={['5 active agents', '100,000 actions/month', 'Unlimited MCP servers', 'Email support (24h)', 'Self-hosting option', 'Custom domains']}
              popular
              delay={0.2}
            />
            <PricingCard
              name="Team"
              price="$99"
              description="For small businesses"
              features={['25 active agents', '1M actions/month', 'Unlimited team members', 'Priority support (8h)', 'SSO/SAML', '99.9% uptime SLA']}
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-6 text-center relative"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Build Your First AI Agent?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of developers and businesses who are already building with Antigravity
          </p>
          <GlowButton href="/builder" primary>
            <span>Start Building Free</span>
            <motion.svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </motion.svg>
          </GlowButton>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center space-x-3 mb-4">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <span className="text-white font-black text-lg tracking-tight">A</span>
                </motion.div>
                <span className="text-white font-bold text-lg tracking-tight">Antigravity</span>
              </Link>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Build AI agents that actually work. No code required. Connect to 100+ services and deploy anywhere.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Agent Builder', 'MCP Marketplace', 'Pricing', 'Documentation'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Security'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold mb-4 text-sm">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">© 2026 Antigravity. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              {['twitter', 'github', 'linkedin'].map((social) => (
                <a key={social} href="#" className="text-gray-500 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <span className="text-sm">{social[0].toUpperCase()}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* @ Trigger System */}
      <TriggerSystem
        onCommand={handleCommand}
        onAgentSelect={handleAgentSelect}
        onWorkflowSelect={handleWorkflowSelect}
        externalOpen={triggerOpen}
        onExternalClose={() => setTriggerOpen(false)}
      />

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setTriggerOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl shadow-2xl shadow-purple-500/30 flex items-center justify-center text-white text-2xl font-bold z-40 group"
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          @
        </motion.span>
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-2xl bg-purple-500 animate-ping opacity-20" />
        <span className="absolute inset-0 rounded-2xl bg-purple-500 animate-pulse opacity-30" />
      </motion.button>

      {/* Floating hint */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-24 right-6 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 text-gray-400 text-sm flex items-center gap-2 z-40"
      >
        <span>Press</span>
        <kbd className="bg-white/10 px-2 py-0.5 rounded-md text-white font-mono text-xs">@</kbd>
        <span>to trigger AI</span>
      </motion.div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
