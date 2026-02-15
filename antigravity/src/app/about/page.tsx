import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Navigation */}
            <nav className="border-b border-white/10 backdrop-blur-sm bg-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <span className="text-white font-bold text-xl">Antigravity</span>
                        </Link>
                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/builder" className="text-gray-300 hover:text-white transition-colors">
                                Agent Builder
                            </Link>
                            <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors">
                                MCP Marketplace
                            </Link>
                            <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                                Pricing
                            </Link>
                            <Link href="/docs" className="text-gray-300 hover:text-white transition-colors">
                                Docs
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="text-gray-300 hover:text-white transition-colors">
                                Sign In
                            </button>
                            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                {/* Hero Section */}
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        Building the Future of AI Automation
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        We're on a mission to democratize AI agent creation and make powerful automation accessible to everyone.
                    </p>
                </div>

                {/* Mission */}
                <section className="mb-20">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12">
                        <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            At Antigravity, we believe that AI automation shouldn't be limited to developers with deep technical expertise.
                            Our mission is to empower anyone—from solo entrepreneurs to enterprise teams—to build sophisticated AI agents
                            that can automate complex workflows, connect to any service, and scale effortlessly.
                        </p>
                    </div>
                </section>

                {/* Story */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Story</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <div className="text-4xl mb-4">🚀</div>
                            <h3 className="text-xl font-semibold text-white mb-3">2024: The Beginning</h3>
                            <p className="text-gray-400">
                                Founded by a team of AI researchers and automation experts who saw the potential of combining
                                visual programming with large language models.
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <div className="text-4xl mb-4">🔌</div>
                            <h3 className="text-xl font-semibold text-white mb-3">2025: MCP Integration</h3>
                            <p className="text-gray-400">
                                Pioneered the integration of MCP (Model Context Protocol) servers, enabling seamless connections
                                to 100+ external services.
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <div className="text-4xl mb-4">🌍</div>
                            <h3 className="text-xl font-semibold text-white mb-3">2026: Global Launch</h3>
                            <p className="text-gray-400">
                                Launched publicly with enterprise-grade features, SOC 2 compliance, and a thriving community of builders.
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <div className="text-4xl mb-4">🎯</div>
                            <h3 className="text-xl font-semibold text-white mb-3">The Future</h3>
                            <p className="text-gray-400">
                                Continuing to innovate with AI-native features, self-learning agents, and the world's largest MCP ecosystem.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Values</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <div className="text-3xl mb-4">🎨</div>
                            <h3 className="text-white font-semibold mb-2">Simplicity First</h3>
                            <p className="text-gray-400">
                                Complex automation should be simple. We design intuitive interfaces that hide complexity while preserving power.
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <div className="text-3xl mb-4">🔓</div>
                            <h3 className="text-white font-semibold mb-2">Open & Accessible</h3>
                            <p className="text-gray-400">
                                We believe in democratizing AI. Our free tier and open ecosystem ensure everyone can participate.
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <div className="text-3xl mb-4">🛡️</div>
                            <h3 className="text-white font-semibold mb-2">Security & Trust</h3>
                            <p className="text-gray-400">
                                Enterprise-grade security isn't optional. SOC 2, HIPAA, and end-to-end encryption are standard.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Leadership Team</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">JD</span>
                            </div>
                            <h3 className="text-white font-semibold">Jane Doe</h3>
                            <p className="text-gray-400 text-sm">CEO & Co-Founder</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">AS</span>
                            </div>
                            <h3 className="text-white font-semibold">Alex Smith</h3>
                            <p className="text-gray-400 text-sm">CTO & Co-Founder</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">MJ</span>
                            </div>
                            <h3 className="text-white font-semibold">Maria Johnson</h3>
                            <p className="text-gray-400 text-sm">VP of Engineering</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">DW</span>
                            </div>
                            <h3 className="text-white font-semibold">David Wilson</h3>
                            <p className="text-gray-400 text-sm">VP of Product</p>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="mb-20">
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-12">
                        <div className="grid md:grid-cols-4 gap-8 text-center">
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">100K+</div>
                                <div className="text-gray-400">Active Users</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">1M+</div>
                                <div className="text-gray-400">Agents Built</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">100+</div>
                                <div className="text-gray-400">MCP Servers</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                                <div className="text-gray-400">Uptime SLA</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Join Our Mission</h2>
                    <p className="text-xl text-gray-400 mb-8">
                        We're always looking for talented people to join our team.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/contact" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity">
                            View Open Positions
                        </Link>
                        <Link href="/pricing" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-colors border border-white/20">
                            Get Started Free
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
