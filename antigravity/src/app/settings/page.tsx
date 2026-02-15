'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_PROVIDERS, PROVIDER_CATEGORIES, APIProviderCategory } from '@/lib/integrations/providers';
import { getAllStoredKeys, saveApiKey, removeApiKey, StoredKey } from '@/lib/integrations/api-key-store';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'api-keys' | 'mcp-servers' | 'usage'>('api-keys');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<APIProviderCategory | 'all'>('all');
    const [storedKeys, setStoredKeys] = useState<StoredKey[]>([]);
    const [editingProvider, setEditingProvider] = useState<string | null>(null);
    const [keyInput, setKeyInput] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setStoredKeys(getAllStoredKeys());
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveKey = (providerId: string) => {
        if (!keyInput.trim()) return;
        saveApiKey(providerId, keyInput.trim());
        setStoredKeys(getAllStoredKeys());
        setEditingProvider(null);
        setKeyInput('');
        showToast(`Connected successfully!`, 'success');
    };

    const handleRemoveKey = (providerId: string) => {
        removeApiKey(providerId);
        setStoredKeys(getAllStoredKeys());
        showToast(`Key removed`, 'success');
    };

    const isConnected = (providerId: string) => storedKeys.some(k => k.providerId === providerId);

    const filteredProviders = API_PROVIDERS.filter(p => {
        const matchesSearch = !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const connectedCount = storedKeys.length;
    const totalProviders = API_PROVIDERS.length;

    return (
        <div className="min-h-screen bg-[var(--dark-bg)] text-white font-sans selection:bg-[var(--neon-cyan)] selection:text-black">
            {/* Navigation */}
            <nav className="glass-panel sticky top-0 z-50 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="w-9 h-9 bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-pink)] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(189,0,255,0.4)] group-hover:shadow-[0_0_25px_rgba(189,0,255,0.6)] transition-all duration-300">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">Antigravity</span>
                        </Link>
                        <div className="hidden md:flex items-center space-x-1">
                            {['Builder', 'Marketplace', 'Dashboard'].map((item) => (
                                <Link
                                    key={item}
                                    href={`/${item.toLowerCase()}`}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    {item}
                                </Link>
                            ))}
                            <div className="h-6 w-px bg-white/10 mx-2" />
                            <Link href="/settings" className="px-4 py-2 text-sm font-medium text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 rounded-lg border border-[var(--neon-cyan)]/20">
                                ⚙️ Settings
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-purple)]/20 to-transparent blur-3xl -z-10" />
                    <h1 className="text-4xl font-extrabold text-white mb-3">
                        Settings & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)]">Integrations</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl text-lg">
                        Manage your API keys and connect powerful MCP tools to supercharge your agents.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex mb-10 border-b border-white/10">
                    {[
                        { id: 'api-keys', label: '🔑 API Keys', count: connectedCount },
                        { id: 'mcp-servers', label: '🔌 MCP Connectors', count: 40 },
                        { id: 'usage', label: '📊 Usage', count: null },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 px-6 text-sm font-medium transition-all duration-200 relative ${activeTab === tab.id
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                            {tab.count !== null && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                                    ? 'bg-white/10 text-white'
                                    : 'bg-white/5 text-gray-600'
                                    }`}>{tab.count}</span>
                            )}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* API Keys Tab */}
                {activeTab === 'api-keys' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Controls */}
                        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between">
                            <div className="relative w-full md:w-96 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 group-focus-within:text-[var(--neon-cyan)] transition-colors">🔍</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search 50+ providers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl leading-5 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-[var(--neon-cyan)]/50 focus:ring-1 focus:ring-[var(--neon-cyan)]/50 sm:text-sm transition-all"
                                />
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                                <button
                                    onClick={() => setActiveCategory('all')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${activeCategory === 'all'
                                        ? 'bg-white text-black border-white'
                                        : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    All
                                </button>
                                {Object.entries(PROVIDER_CATEGORIES).map(([key, cat]) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveCategory(key as APIProviderCategory)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${activeCategory === key
                                            ? 'bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30'
                                            : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        {cat.icon} {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredProviders.map(provider => {
                                const connected = isConnected(provider.id);
                                const isEditing = editingProvider === provider.id;

                                return (
                                    <div
                                        key={provider.id}
                                        className={`glass-card rounded-2xl p-6 relative group ${connected ? 'border-[var(--neon-cyan)]/30' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl border border-white/10 group-hover:border-white/20 transition-colors">
                                                {provider.icon}
                                            </div>
                                            {connected && (
                                                <div className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">Active</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[var(--neon-cyan)] transition-colors">
                                                {provider.name}
                                            </h3>
                                            <p className="text-gray-400 text-sm line-clamp-2 h-10">{provider.description}</p>
                                        </div>

                                        {isEditing ? (
                                            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                <input
                                                    type="password"
                                                    placeholder={provider.keyPlaceholder}
                                                    value={keyInput}
                                                    onChange={(e) => setKeyInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveKey(provider.id)}
                                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-[var(--neon-cyan)] outline-none"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSaveKey(provider.id)}
                                                        className="flex-1 py-1.5 bg-[var(--neon-cyan)] text-black text-xs font-bold rounded hover:opacity-90 transition-opacity"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingProvider(null); setKeyInput(''); }}
                                                        className="px-3 py-1.5 bg-white/5 text-gray-300 text-xs font-bold rounded hover:bg-white/10 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                                                {connected ? (
                                                    <>
                                                        <button
                                                            onClick={() => { setEditingProvider(provider.id); setKeyInput(''); }}
                                                            className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            Update Key
                                                        </button>
                                                        <div className="h-3 w-px bg-white/10" />
                                                        <button
                                                            onClick={() => handleRemoveKey(provider.id)}
                                                            className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                                                        >
                                                            Disconnect
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => { setEditingProvider(provider.id); setKeyInput(''); }}
                                                        className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-gray-300 hover:text-white transition-all group-hover:border-[var(--neon-cyan)]/30 group-hover:text-[var(--neon-cyan)]"
                                                    >
                                                        Connect
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* MCP Servers Tab */}
                {activeTab === 'mcp-servers' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Categories Loop */}
                        {[
                            { cat: 'web-scraping', label: 'Web Scraping & Automation' },
                            { cat: 'social-media', label: 'Social Media' },
                            { cat: 'communication', label: 'Communication' },
                            { cat: 'database', label: 'Databases' },
                            { cat: 'ai', label: 'AI & ML Models' },
                        ].map(({ cat, label }) => {
                            const mcpProviders = filteredProviders.filter(p => {
                                const catMap: Record<string, string[]> = {
                                    'web-scraping': ['apify', 'browserless', 'scrapingbee', 'firecrawl'],
                                    'social-media': ['twitter', 'linkedin', 'discord', 'telegram', 'instagram', 'youtube', 'reddit'],
                                    'communication': ['sendgrid', 'resend', 'twilio', 'slack'],
                                    'database': ['supabase', 'mongodb', 'firebase', 'planetscale', 'upstash', 'neon'],
                                    'ai': ['openai', 'anthropic', 'groq', 'huggingface', 'replicate', 'perplexity', 'tavily', 'brave_search'],
                                };
                                return (catMap[cat] || []).includes(p.id);
                            });

                            if (mcpProviders.length === 0) return null;

                            return (
                                <div key={cat}>
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                        {label}
                                        <span className="h-px flex-1 bg-white/10" />
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {mcpProviders.map(provider => (
                                            <div key={provider.id} className="glass-card p-4 rounded-xl flex items-center gap-4 hover:bg-white/5">
                                                <div className="text-2xl">{provider.icon}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-white truncate">{provider.name}</div>
                                                    <div className="text-xs text-gray-500 truncate">{provider.description}</div>
                                                </div>
                                                {isConnected(provider.id) ? (
                                                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                                                ) : (
                                                    <button
                                                        onClick={() => { setActiveTab('api-keys'); setActiveCategory(provider.category); }}
                                                        className="text-[var(--neon-cyan)] text-lg hover:scale-110 transition-transform"
                                                    >
                                                        +
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Usage Tab */}
                {activeTab === 'usage' && (
                    <div className="glass-panel rounded-2xl p-8 border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-bold text-white mb-2">Usage & Limits</h2>
                        <p className="text-gray-400 mb-8">Monitor your API consumption across all connected providers.</p>

                        {storedKeys.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl">
                                <p className="text-gray-500">No active connections found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {storedKeys.map(key => {
                                    const provider = API_PROVIDERS.find(p => p.id === key.providerId);
                                    if (!provider) return null;
                                    return (
                                        <div key={key.providerId} className="bg-white/5 rounded-xl p-5 border border-white/5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{provider.icon}</span>
                                                    <span className="font-bold">{provider.name}</span>
                                                </div>
                                                <span className="text-xs font-mono text-gray-400">{key.lastValidated ? 'Verified' : 'Unchecked'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-400">Monthly Limit</span>
                                                <span className="text-white">{provider.freeTier.limit || 'Unknown'}</span>
                                            </div>
                                            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                                                <div className="bg-[var(--neon-cyan)] h-full w-[15%]" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Notification Toast */}
            {toast && (
                <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-right fade-in duration-300">
                    <div className={`glass-panel px-6 py-4 rounded-xl border-l-4 shadow-2xl flex items-center gap-3 ${toast.type === 'success' ? 'border-green-500' : 'border-red-500'
                        }`}>
                        <span className="text-xl">{toast.type === 'success' ? '✅' : '🚨'}</span>
                        <span className="font-medium text-white">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
