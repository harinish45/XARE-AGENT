'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getWorkflows, incrementDownloads, Workflow } from '../../services/marketplace-service';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';

export default function MarketplacePage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: 'all', name: 'All Workflows', count: workflows.length, color: 'cyan' },
        { id: 'productivity', name: 'Productivity', count: workflows.filter(w => w.category === 'productivity').length, color: 'purple' },
        { id: 'business', name: 'Business', count: workflows.filter(w => w.category === 'business').length, color: 'pink' },
        { id: 'marketing', name: 'Marketing', count: workflows.filter(w => w.category === 'marketing').length, color: 'green' },
        { id: 'development', name: 'Development', count: workflows.filter(w => w.category === 'development').length, color: 'cyan' },
    ];

    useEffect(() => {
        const fetchWorkflows = async () => {
            setLoading(true);
            try {
                const data = await getWorkflows();
                setWorkflows(data);
            } catch (error) {
                console.error('Failed to load workflows:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkflows();
    }, []);

    const filteredWorkflows = workflows.filter((wf) => {
        const matchesSearch = wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            wf.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || wf.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleInstall = async (workflow: Workflow) => {
        try {
            await incrementDownloads(workflow.id);
            localStorage.setItem('importedWorkflow', JSON.stringify(workflow));
            router.push('/builder');
        } catch (error) {
            console.error('Failed to install workflow:', error);
        }
    };

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
                        <div className="flex items-center space-x-8">
                            <Link href="/builder" className="text-gray-400 hover:text-[var(--neon-cyan)] transition-colors">
                                Agent Builder
                            </Link>
                            <Link href="/marketplace" className="neon-text-cyan font-medium">
                                Marketplace
                            </Link>
                            <Link href="/dashboard" className="text-gray-400 hover:text-[var(--neon-pink)] transition-colors">
                                Dashboard
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" asChild>
                                <Link href="/login">Sign In</Link>
                            </Button>
                            <Button variant="neon" asChild>
                                <Link href="/login">Get Started</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold neon-text-pink mb-2">
                        Workflow Marketplace
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Discover and install pre-built automation workflows
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="mb-8 space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search workflows..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-6 py-4 glass rounded-xl border border-[var(--neon-cyan)]/30 bg-transparent text-white placeholder-gray-500 focus:outline-none focus:border-[var(--neon-cyan)] focus:neon-glow-cyan transition-all text-lg"
                        />
                        <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Categories */}
                    <div className="flex gap-3 flex-wrap">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-4 py-2 rounded-lg transition-all ${selectedCategory === category.id
                                        ? 'glass-heavy border-2 border-[var(--neon-cyan)] text-[var(--neon-cyan)] neon-glow-cyan'
                                        : 'glass border border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                                    }`}
                            >
                                {category.name} ({category.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-16 h-16 border-4 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin neon-glow-cyan"></div>
                    </div>
                )}

                {/* Workflows Grid */}
                {!loading && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredWorkflows.map((workflow, index) => (
                            <GlassCard
                                key={workflow.id}
                                hover
                                glowColor={index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'purple' : 'pink'}
                                className="p-6 flex flex-col"
                            >
                                {/* Category Badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="glass px-3 py-1 rounded-full text-xs border border-white/20 text-gray-300">
                                        {workflow.category}
                                    </span>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        {workflow.downloads}
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:neon-text-cyan transition-all">
                                    {workflow.name}
                                </h3>
                                <p className="text-gray-400 text-sm mb-4 flex-grow">
                                    {workflow.description}
                                </p>

                                {/* Metadata */}
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                    <span>{workflow.author}</span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        {workflow.rating}
                                    </span>
                                </div>

                                {/* Install Button */}
                                <Button
                                    variant={index % 3 === 0 ? 'neon' : index % 3 === 1 ? 'neonPurple' : 'neonPink'}
                                    className="w-full"
                                    onClick={() => handleInstall(workflow)}
                                >
                                    Import Workflow
                                </Button>
                            </GlassCard>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredWorkflows.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-gray-500 text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">No workflows found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
