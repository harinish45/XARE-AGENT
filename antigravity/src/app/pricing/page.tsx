import Link from 'next/link';

export default function PricingPage() {
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
                            <Link href="/pricing" className="text-white font-medium">
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
                {/* Page Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-400">
                        Start free, scale as you grow
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Free Tier */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h3 className="text-xl font-semibold text-white mb-2">Free</h3>
                        <p className="text-gray-400 mb-6">For hobbyists and testing</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">$0</span>
                            <span className="text-gray-400">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                1 active agent
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                10,000 actions/month
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                10 MCP servers
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Community support
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Cloud deployment only
                            </li>
                        </ul>
                        <button className="w-full bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                            Get Started
                        </button>
                    </div>

                    {/* Pro Tier */}
                    <div className="bg-gradient-to-b from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-2 border-purple-500 rounded-2xl p-8 relative">
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                            Most Popular
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
                        <p className="text-gray-400 mb-6">For individuals</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">$29</span>
                            <span className="text-gray-400">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                5 active agents
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                100,000 actions/month
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Unlimited MCP servers
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Email support (24h)
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Self-hosting option
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Custom domains
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                99.5% uptime SLA
                            </li>
                        </ul>
                        <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:opacity-90 transition-opacity">
                            Get Started
                        </button>
                    </div>

                    {/* Team Tier */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h3 className="text-xl font-semibold text-white mb-2">Team</h3>
                        <p className="text-gray-400 mb-6">For small businesses</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">$99</span>
                            <span className="text-gray-400">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                25 active agents
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                1M actions/month
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Unlimited team members
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Priority support (8h)
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                SSO/SAML
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Team collaboration
                            </li>
                            <li className="flex items-center text-gray-300">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                99.9% uptime SLA
                            </li>
                        </ul>
                        <button className="w-full bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                            Get Started
                        </button>
                    </div>
                </div>

                {/* Enterprise CTA */}
                <div className="text-center mt-12">
                    <p className="text-gray-400 mb-4">Need enterprise features?</p>
                    <Link href="/contact" className="text-purple-400 hover:text-purple-300 font-medium">
                        Contact us for custom pricing →
                    </Link>
                </div>

                {/* Enterprise Features */}
                <div className="mt-20">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        Enterprise Features
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <div className="text-3xl mb-4">🔒</div>
                            <h3 className="text-white font-semibold mb-2">SOC 2 Type II</h3>
                            <p className="text-gray-400 text-sm">Enterprise-grade security compliance</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <div className="text-3xl mb-4">🏥</div>
                            <h3 className="text-white font-semibold mb-2">HIPAA Compliant</h3>
                            <p className="text-gray-400 text-sm">Healthcare data protection</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <div className="text-3xl mb-4">☁️</div>
                            <h3 className="text-white font-semibold mb-2">VPC Deployment</h3>
                            <p className="text-gray-400 text-sm">Private cloud infrastructure</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <div className="text-3xl mb-4">📞</div>
                            <h3 className="text-white font-semibold mb-2">24/7 Support</h3>
                            <p className="text-gray-400 text-sm">Dedicated account manager</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-20">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="max-w-3xl mx-auto space-y-4">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <h3 className="text-white font-semibold mb-2">Can I switch plans at any time?</h3>
                            <p className="text-gray-400">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <h3 className="text-white font-semibold mb-2">What happens if I exceed my limits?</h3>
                            <p className="text-gray-400">We'll notify you when you're approaching your limits. You can upgrade your plan or purchase additional actions.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <h3 className="text-white font-semibold mb-2">Do you offer refunds?</h3>
                            <p className="text-gray-400">Yes, we offer a 30-day money-back guarantee for all paid plans.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <h3 className="text-white font-semibold mb-2">Can I use my own LLM API keys?</h3>
                            <p className="text-gray-400">Yes, on Pro and Team plans, you can bring your own Anthropic, OpenAI, or other LLM API keys.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
