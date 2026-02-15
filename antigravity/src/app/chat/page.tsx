'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    agent?: string;
    status?: 'thinking' | 'executing' | 'done' | 'error';
    steps?: string[];
}

interface Suggestion {
    icon: string;
    label: string;
    command: string;
}

const QUICK_SUGGESTIONS: Suggestion[] = [
    { icon: '📸', label: 'Post to Instagram', command: 'Post my latest photo to Instagram with trending hashtags' },
    { icon: '🎬', label: 'YouTube → Everywhere', command: 'Distribute my latest YouTube video to all platforms' },
    { icon: '📝', label: 'Generate Blog Post', command: 'Write a blog post about AI automation trends' },
    { icon: '📊', label: 'Social Analytics', command: 'Show me my social media analytics for this week' },
    { icon: '📅', label: 'Content Calendar', command: 'Create a 30-day content calendar for my brand' },
    { icon: '#️⃣', label: 'Find Hashtags', command: 'Generate trending hashtags for tech content' },
    { icon: '✍️', label: 'Write Caption', command: 'Generate an engaging Instagram caption for a sunset photo' },
    { icon: '🔄', label: 'Cross-Post', command: 'Share this everywhere — Instagram, Twitter, LinkedIn, TikTok' },
];

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'system',
            content: '👋 Welcome to **Antigravity**! I\'m your AI automation agent. Just tell me what you need — post to social media, generate content, schedule workflows, or analyze data. I handle everything automatically.',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;

        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsProcessing(true);

        // Simulate agent thinking
        const thinkingId = `think_${Date.now()}`;
        setMessages(prev => [...prev, {
            id: thinkingId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            status: 'thinking',
            agent: detectAgent(input),
            steps: [],
        }]);

        // Simulate step-by-step execution
        const steps = generateSteps(input);
        for (let i = 0; i < steps.length; i++) {
            await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
            setMessages(prev => prev.map(m =>
                m.id === thinkingId
                    ? { ...m, status: 'executing' as const, steps: steps.slice(0, i + 1) }
                    : m
            ));
        }

        await new Promise(r => setTimeout(r, 500));

        // Final response
        setMessages(prev => prev.map(m =>
            m.id === thinkingId
                ? {
                    ...m,
                    content: generateResponse(input),
                    status: 'done' as const,
                    steps: steps,
                }
                : m
        ));

        setIsProcessing(false);
    };

    const handleSuggestionClick = (command: string) => {
        setInput(command);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[var(--dark-bg)]">
            {/* Nav */}
            <nav className="glass-heavy border-b border-white/10 shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-7 h-7 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">A</span>
                            </div>
                            <span className="text-white font-bold text-lg neon-text-cyan">Antigravity</span>
                        </Link>
                        <div className="hidden md:flex items-center space-x-6 text-sm">
                            <Link href="/dashboard" className="text-gray-400 hover:text-[var(--neon-cyan)] transition-colors">Dashboard</Link>
                            <Link href="/builder" className="text-gray-400 hover:text-[var(--neon-cyan)] transition-colors">Builder</Link>
                            <Link href="/marketplace" className="text-gray-400 hover:text-[var(--neon-cyan)] transition-colors">Marketplace</Link>
                            <Link href="/chat" className="neon-text-cyan font-medium">Chat</Link>
                            <Link href="/settings" className="text-gray-400 hover:text-[var(--neon-cyan)] transition-colors">Settings</Link>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-green-400 text-xs font-medium">10 Agents Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}

                    {/* Quick Suggestions (only when no user messages yet) */}
                    {messages.length <= 1 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                            {QUICK_SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(s.command)}
                                    className="glass-panel rounded-xl p-4 text-left hover:border-[var(--neon-cyan)]/50 transition-all duration-300 group cursor-pointer"
                                >
                                    <span className="text-2xl block mb-2">{s.icon}</span>
                                    <span className="text-white/80 text-sm font-medium group-hover:text-[var(--neon-cyan)] transition-colors">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="shrink-0 border-t border-white/10 glass-heavy px-4 py-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-end space-x-3">
                        <div className="flex-1 glass-panel rounded-2xl p-1 flex items-end">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tell me what to do… e.g. &quot;Post my video to Instagram&quot;"
                                rows={1}
                                className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 resize-none focus:outline-none text-sm"
                                style={{ minHeight: '44px', maxHeight: '120px' }}
                                onInput={(e) => {
                                    const t = e.target as HTMLTextAreaElement;
                                    t.style.height = 'auto';
                                    t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isProcessing}
                                className="m-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] text-white text-sm font-medium disabled:opacity-30 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center space-x-1">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>Working…</span>
                                    </span>
                                ) : 'Send'}
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-gray-600 text-xs mt-2">
                        Antigravity can execute real actions. Review before approving sensitive operations.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Message Bubble Component ─────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
    if (message.role === 'system') {
        return (
            <div className="flex justify-center">
                <div className="glass-panel rounded-2xl px-6 py-4 max-w-lg text-center">
                    <p className="text-gray-300 text-sm" dangerouslySetInnerHTML={{
                        __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong class="neon-text-cyan">$1</strong>')
                    }} />
                </div>
            </div>
        );
    }

    if (message.role === 'user') {
        return (
            <div className="flex justify-end">
                <div className="max-w-md bg-gradient-to-r from-[var(--neon-purple)]/20 to-[var(--neon-pink)]/20 border border-[var(--neon-purple)]/30 rounded-2xl rounded-br-md px-5 py-3">
                    <p className="text-white text-sm">{message.content}</p>
                    <p className="text-gray-500 text-xs mt-1">{formatTime(message.timestamp)}</p>
                </div>
            </div>
        );
    }

    // Assistant message
    return (
        <div className="flex justify-start">
            <div className="max-w-lg space-y-3">
                {/* Agent Badge */}
                {message.agent && (
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-green)] flex items-center justify-center">
                            <span className="text-xs">🤖</span>
                        </div>
                        <span className="text-[var(--neon-cyan)] text-xs font-medium">{message.agent}</span>
                        {message.status === 'thinking' && (
                            <span className="text-yellow-400 text-xs flex items-center space-x-1">
                                <span className="animate-pulse">●</span>
                                <span>Thinking…</span>
                            </span>
                        )}
                        {message.status === 'executing' && (
                            <span className="text-blue-400 text-xs flex items-center space-x-1">
                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>Executing…</span>
                            </span>
                        )}
                        {message.status === 'done' && (
                            <span className="text-green-400 text-xs">✓ Complete</span>
                        )}
                    </div>
                )}

                {/* Step Progress */}
                {message.steps && message.steps.length > 0 && (
                    <div className="glass-panel rounded-xl p-3 space-y-1.5">
                        {message.steps.map((step, i) => (
                            <div key={i} className="flex items-center space-x-2 text-xs">
                                <span className={`${i === message.steps!.length - 1 && message.status !== 'done'
                                    ? 'text-blue-400 animate-pulse'
                                    : 'text-green-400'}`}>
                                    {i === message.steps!.length - 1 && message.status !== 'done' ? '⏳' : '✅'}
                                </span>
                                <span className="text-gray-300">{step}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Response Content */}
                {message.content && (
                    <div className="glass-panel rounded-2xl rounded-bl-md px-5 py-3 border-l-2 border-[var(--neon-cyan)]/50">
                        <p className="text-gray-200 text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-gray-500 text-xs mt-2">{formatTime(message.timestamp)}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function detectAgent(input: string): string {
    const lower = input.toLowerCase();
    if (/post|share|upload|instagram|youtube|twitter|tiktok|linkedin|social|tweet/.test(lower)) return 'Social Media Agent';
    if (/caption|blog|article|carousel|seo|hashtag|content calendar/.test(lower)) return 'Content Agent';
    if (/email|mail|send.*message/.test(lower)) return 'Email Agent';
    if (/schedule|meeting|calendar|remind/.test(lower)) return 'Calendar Agent';
    if (/scrape|browse|website|url/.test(lower)) return 'Browser Agent';
    if (/code|generate|deploy|test|debug/.test(lower)) return 'Code Agent';
    if (/file|search|organize|move|download/.test(lower)) return 'File Agent';
    if (/data|analyze|query|database/.test(lower)) return 'Data Agent';
    return 'General Agent';
}

function generateSteps(input: string): string[] {
    const lower = input.toLowerCase();

    if (/post.*instagram|instagram.*post/.test(lower)) {
        return [
            'Scanning for media files…',
            'Checking video/photo format…',
            'Generating AI caption…',
            'Finding trending hashtags…',
            'Determining best posting time…',
            'Uploading to Instagram…',
            'Post published successfully!',
        ];
    }
    if (/distribute|everywhere|all platform|cross.?post/.test(lower)) {
        return [
            'Analyzing source content…',
            'Creating Instagram version (1080×1080)…',
            'Creating Twitter thread…',
            'Creating LinkedIn article…',
            'Creating TikTok clip…',
            'Scheduling optimal posting times…',
            'Distributed to 4 platforms!',
        ];
    }
    if (/blog|article/.test(lower)) {
        return [
            'Researching topic…',
            'Generating outline with 6 sections…',
            'Writing introduction…',
            'Expanding key sections…',
            'Adding SEO optimization…',
            'Blog post ready!',
        ];
    }
    if (/caption/.test(lower)) {
        return [
            'Analyzing content context…',
            'Generating 3 caption variants…',
            'Selecting best hashtags…',
            'Caption generated!',
        ];
    }
    if (/analytic|stats|performance/.test(lower)) {
        return [
            'Connecting to social platforms…',
            'Pulling engagement data…',
            'Calculating metrics…',
            'Analytics report ready!',
        ];
    }
    if (/calendar|plan.*content/.test(lower)) {
        return [
            'Analyzing your audience…',
            'Planning topics for 30 days…',
            'Assigning platforms and times…',
            'Content calendar generated!',
        ];
    }
    return [
        'Understanding your request…',
        'Selecting best agent…',
        'Executing task…',
        'Done!',
    ];
}

function generateResponse(input: string): string {
    const lower = input.toLowerCase();

    if (/post.*instagram|instagram.*post/.test(lower)) {
        return '✅ Your post has been published to Instagram!\n\n📸 Media: Uploaded successfully\n✍️ Caption: AI-generated with 20 hashtags\n⏰ Posted at optimal engagement time (6:30 PM)\n📈 Expected reach: 2,500-3,800\n\nI\'ll monitor comments and auto-reply to the top 3 within the next hour.';
    }
    if (/distribute|everywhere|all platform|cross.?post/.test(lower)) {
        return '✅ Content distributed to 4 platforms!\n\n📱 Instagram — Carousel posted\n🐦 Twitter — Thread with 5 tweets\n💼 LinkedIn — Professional article\n🎵 TikTok — 60s vertical clip\n\n📊 I\'ll send you a consolidated analytics report in 24 hours.';
    }
    if (/blog|article/.test(lower)) {
        return '✅ Blog post generated!\n\n📝 Title: "The Ultimate Guide to AI Automation"\n📖 Word count: 1,847 words\n⏱️ Read time: ~9 minutes\n🔍 SEO Score: 87/100\n\nIncludes 6 sections, 3 images, and meta descriptions. Ready to publish!';
    }
    if (/caption/.test(lower)) {
        return '✅ Here are 3 caption variants:\n\n1️⃣ "Chasing golden hours and making memories ✨🌅 Sometimes the best moments are the ones you almost missed."\n\n2️⃣ "That sunset hit different tonight 🔥🌇 #GoldenHour"\n\n3️⃣ "Proof that the sky is the world\'s greatest artist 🎨"\n\n#sunset #goldenhour #nature #photography #vibes';
    }
    if (/analytic|stats|performance/.test(lower)) {
        return '📊 This Week\'s Social Analytics:\n\n📱 Instagram: 12.4K reach (+23%), 847 engagements\n🐦 Twitter: 8.2K impressions, 234 link clicks\n💼 LinkedIn: 3.1K views, 89 reactions\n🎵 TikTok: 45.6K views, 2.3K likes\n\n🏆 Best performing: TikTok behind-the-scenes video (45.6K views)\n💡 Suggestion: Post more video content — it\'s outperforming photos by 3x.';
    }
    if (/calendar|plan.*content/.test(lower)) {
        return '📅 30-Day Content Calendar Generated!\n\n• 30 posts planned across Instagram, Twitter, LinkedIn\n• Mix: 40% educational, 30% behind-the-scenes, 20% product, 10% engagement\n• Each post has suggested time, platform, and content type\n• 8 carousel designs auto-queued\n\nWould you like me to auto-schedule them or review first?';
    }
    if (/hashtag/.test(lower)) {
        return '🏷️ Top Trending Hashtags for Tech:\n\n#TechInnovation #AIAutomation #FutureOfWork #DigitalTransformation #StartupLife #TechTrends #Coding #DevLife #MachineLearning #Innovation #SaaS #ProductHunt #BuildInPublic #IndieHacker #NoCode\n\nRecommendation: Use 15-20 hashtags on Instagram, 3-5 on Twitter, 5 on LinkedIn.';
    }
    return '✅ Task completed successfully! Let me know if you need anything else.';
}
