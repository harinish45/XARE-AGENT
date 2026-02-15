import Link from 'next/link';

export default function BlogPage() {
    const posts = [
        {
            id: 1,
            title: "Introducing Antigravity: Build AI Agents Without Code",
            excerpt: "We're excited to announce the launch of Antigravity, a revolutionary platform that lets anyone build powerful AI agents using a visual drag-and-drop interface.",
            date: "January 15, 2026",
            author: "Jane Doe",
            category: "Product",
            readTime: "5 min read",
        },
        {
            id: 2,
            title: "Understanding MCP: The Future of AI Agent Integration",
            excerpt: "Learn how the Model Context Protocol (MCP) is revolutionizing how AI agents connect to external services and why it matters for your automation workflows.",
            date: "January 10, 2026",
            author: "Alex Smith",
            category: "Technical",
            readTime: "8 min read",
        },
        {
            id: 3,
            title: "10 AI Agent Templates to Automate Your Workflow",
            excerpt: "Discover our most popular agent templates that can help you automate common tasks like email processing, data analysis, and customer support.",
            date: "January 5, 2026",
            author: "Maria Johnson",
            category: "Tutorial",
            readTime: "6 min read",
        },
        {
            id: 4,
            title: "Enterprise Security: SOC 2 and HIPAA Compliance Explained",
            excerpt: "A deep dive into our security practices and how we ensure your data is protected with enterprise-grade compliance standards.",
            date: "December 28, 2025",
            author: "David Wilson",
            category: "Security",
            readTime: "7 min read",
        },
        {
            id: 5,
            title: "Building a Customer Support Agent in 10 Minutes",
            excerpt: "Step-by-step guide to creating an AI-powered customer support agent that can handle inquiries, escalate issues, and learn from interactions.",
            date: "December 20, 2025",
            author: "Jane Doe",
            category: "Tutorial",
            readTime: "10 min read",
        },
        {
            id: 6,
            title: "The Future of AI Automation: Trends to Watch in 2026",
            excerpt: "Our predictions for the AI automation landscape in 2026, from self-learning agents to multi-agent collaboration systems.",
            date: "December 15, 2025",
            author: "Alex Smith",
            category: "Industry",
            readTime: "6 min read",
        },
    ];

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
                {/* Page Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Blog
                    </h1>
                    <p className="text-xl text-gray-400">
                        Insights, tutorials, and updates from the Antigravity team
                    </p>
                </div>

                {/* Featured Post */}
                <div className="mb-16">
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 md:p-12">
                        <div className="flex items-center space-x-4 mb-4">
                            <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                                Featured
                            </span>
                            <span className="text-gray-400 text-sm">{posts[0].date}</span>
                            <span className="text-gray-400 text-sm">•</span>
                            <span className="text-gray-400 text-sm">{posts[0].readTime}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            {posts[0].title}
                        </h2>
                        <p className="text-gray-300 text-lg mb-6 max-w-3xl">
                            {posts[0].excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">{posts[0].author.split(' ').map(n => n[0]).join('')}</span>
                                </div>
                                <div>
                                    <p className="text-white font-medium">{posts[0].author}</p>
                                    <p className="text-gray-400 text-sm">{posts[0].category}</p>
                                </div>
                            </div>
                            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
                                Read More
                            </button>
                        </div>
                    </div>
                </div>

                {/* Blog Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.slice(1).map((post) => (
                        <article key={post.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors cursor-pointer">
                            <div className="flex items-center space-x-2 mb-4">
                                <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs font-medium">
                                    {post.category}
                                </span>
                                <span className="text-gray-400 text-xs">{post.readTime}</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3 line-clamp-2">
                                {post.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                {post.excerpt}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">{post.author.split(' ').map(n => n[0]).join('')}</span>
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{post.author}</p>
                                        <p className="text-gray-400 text-xs">{post.date}</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Newsletter */}
                <div className="mt-20">
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-12 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Stay Updated
                        </h2>
                        <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                            Get the latest updates, tutorials, and insights delivered to your inbox.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium">
                                Subscribe
                            </button>
                        </div>
                        <p className="text-gray-400 text-sm mt-4">
                            No spam, unsubscribe anytime.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
