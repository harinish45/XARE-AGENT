import Link from 'next/link';

export default function ContactPage() {
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
                <div className="max-w-3xl mx-auto">
                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Get in Touch
                        </h1>
                        <p className="text-xl text-gray-400">
                            Have questions? We'd love to hear from you.
                        </p>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-12">
                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-white font-medium mb-2">First Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white font-medium mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-white font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-white font-medium mb-2">Company</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Your Company"
                                />
                            </div>
                            <div>
                                <label className="block text-white font-medium mb-2">Subject</label>
                                <select className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="">Select a topic</option>
                                    <option value="sales">Sales Inquiry</option>
                                    <option value="support">Technical Support</option>
                                    <option value="partnership">Partnership</option>
                                    <option value="enterprise">Enterprise Pricing</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-white font-medium mb-2">Message</label>
                                <textarea
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none"
                                    placeholder="Tell us more about your needs..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                            >
                                Send Message
                            </button>
                        </form>
                    </div>

                    {/* Contact Information */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
                            <div className="text-3xl mb-4">📧</div>
                            <h3 className="text-white font-semibold mb-2">Email</h3>
                            <p className="text-gray-400">support@antigravity.ai</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
                            <div className="text-3xl mb-4">💬</div>
                            <h3 className="text-white font-semibold mb-2">Live Chat</h3>
                            <p className="text-gray-400">Available 24/7</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
                            <div className="text-3xl mb-4">📞</div>
                            <h3 className="text-white font-semibold mb-2">Phone</h3>
                            <p className="text-gray-400">+1 (555) 123-4567</p>
                        </div>
                    </div>

                    {/* Office Locations */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Our Offices</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-white font-semibold mb-2">San Francisco</h3>
                                <p className="text-gray-400">
                                    123 Market Street<br />
                                    San Francisco, CA 94105<br />
                                    United States
                                </p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">London</h3>
                                <p className="text-gray-400">
                                    456 Oxford Street<br />
                                    London W1C 1AP<br />
                                    United Kingdom
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
