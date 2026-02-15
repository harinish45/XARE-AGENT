'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('overview');

    const stats = [
        { label: 'Active Agents', value: '12', change: '+2', positive: true },
        { label: 'Total Executions', value: '1,234', change: '+156', positive: true },
        { label: 'Success Rate', value: '98.5%', change: '+0.3%', positive: true },
        { label: 'Avg Response Time', value: '1.2s', change: '-0.1s', positive: true },
    ];

    const recentAgents = [
        { id: 1, name: 'Customer Support Bot', status: 'active', executions: 456, lastRun: '2 hours ago' },
        { id: 2, name: 'Data Processing Pipeline', status: 'active', executions: 234, lastRun: '5 hours ago' },
        { id: 3, name: 'Email Auto-Responder', status: 'paused', executions: 123, lastRun: '1 day ago' },
        { id: 4, name: 'Social Media Monitor', status: 'active', executions: 89, lastRun: '3 hours ago' },
    ];

    return (
        <div className="min-h-screen bg-[var(--dark-bg)]">
            {/* Navigation */}
            <nav className="glass-heavy border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] rounded-lg flex items-center justify-center neon-glow-purple">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <span className="text-white font-bold text-xl neon-text-cyan">Antigravity</span>
                        </Link>
                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/builder" className="text-gray-400 hover:text-[var(--neon-cyan)] transition-colors">
                                Agent Builder
                            </Link>
                            <Link href="/marketplace" className="text-gray-400 hover:text-[var(--neon-cyan)] transition-colors">
                                MCP Marketplace
                            </Link>
                            <Link href="/dashboard" className="neon-text-cyan font-medium">
                                Dashboard
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] rounded-full flex items-center justify-center neon-glow-pink">
                                <span className="text-white text-sm font-bold">JD</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold neon-text-cyan mb-2">Dashboard</h1>
                        <p className="text-gray-400">Welcome back, John!</p>
                    </div>
                    <Button variant="neon" size="lg" asChild>
                        <Link href="/builder">
                            + New Agent
                        </Link>
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <GlassCard
                            key={stat.label}
                            hover
                            glowColor={index % 2 === 0 ? 'cyan' : 'purple'}
                            className="p-6"
                        >
                            <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-white">{stat.value}</span>
                                <span className={`text-sm ${stat.positive ? 'text-[var(--neon-green)]' : 'text-red-400'}`}>
                                    {stat.change}
                                </span>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Recent Agents */}
                    <div className="lg:col-span-2">
                        <GlassCard className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold neon-text-pink">Recent Agents</h2>
                                <button className="text-[var(--neon-purple)] hover:text-[var(--neon-pink)] text-sm font-medium transition-colors">
                                    View All
                                </button>
                            </div>
                            <div className="space-y-4">
                                {recentAgents.map((agent) => (
                                    <div key={agent.id} className="flex items-center justify-between p-4 glass rounded-lg hover:bg-white/10 transition-all cursor-pointer group">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-[var(--neon-green)] neon-glow-green' : 'bg-yellow-500'}`}></div>
                                            <div>
                                                <h3 className="text-white font-medium group-hover:neon-text-cyan transition-all">{agent.name}</h3>
                                                <p className="text-gray-400 text-sm">{agent.executions} executions • {agent.lastRun}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button className="text-gray-400 hover:text-[var(--neon-cyan)] p-2 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                            </button>
                                            <button className="text-gray-400 hover:text-[var(--neon-pink)] p-2 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Sidebar */}
                    <div>
                        {/* Quick Actions */}
                        <GlassCard className="p-6 mb-6" glowColor="purple">
                            <h2 className="text-xl font-semibold neon-text-purple mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                <Link href="/builder" className="flex items-center space-x-3 p-3 glass rounded-lg hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] rounded-lg flex items-center justify-center neon-glow-purple">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <span className="text-white group-hover:neon-text-cyan transition-all">Create New Agent</span>
                                </Link>
                                <Link href="/marketplace" className="flex items-center space-x-3 p-3 glass rounded-lg hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] rounded-lg flex items-center justify-center neon-glow-cyan">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <span className="text-white group-hover:neon-text-pink transition-all">Browse MCP Servers</span>
                                </Link>
                                <Link href="/docs" className="flex items-center space-x-3 p-3 glass rounded-lg hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 bg-gradient-to-r from-[var(--neon-green)] to-emerald-500 rounded-lg flex items-center justify-center neon-glow-green">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <span className="text-white group-hover:neon-text-purple transition-all">View Documentation</span>
                                </Link>
                            </div>
                        </GlassCard>

                        {/* Usage */}
                        <GlassCard className="p-6" glowColor="pink">
                            <h2 className="text-xl font-semibold neon-text-pink mb-4">Usage This Month</h2>
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Actions Used</span>
                                    <span className="text-white">45,678 / 100,000</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] h-2 rounded-full neon-glow-purple" style={{ width: '45%' }}></div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">MCP Servers</span>
                                    <span className="text-white">8 / Unlimited</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] h-2 rounded-full neon-glow-cyan" style={{ width: '20%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Active Agents</span>
                                    <span className="text-white">12 / 25</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-[var(--neon-green)] to-emerald-500 h-2 rounded-full neon-glow-green" style={{ width: '48%' }}></div>
                                </div>
                            </div>
                            <Button variant="neonPink" className="w-full mt-6" asChild>
                                <Link href="/pricing">
                                    Upgrade Plan →
                                </Link>
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
