import Link from 'next/link';

export default function DocsPage() {
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
                            <Link href="/docs" className="text-white font-medium">
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex gap-12">
                    {/* Sidebar */}
                    <aside className="w-64 flex-shrink-0">
                        <div className="sticky top-8">
                            <h2 className="text-white font-semibold mb-4">Documentation</h2>
                            <nav className="space-y-1">
                                <Link href="#getting-started" className="block text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
                                    Getting Started
                                </Link>
                                <Link href="#agent-builder" className="block text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
                                    Agent Builder
                                </Link>
                                <Link href="#mcp-servers" className="block text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
                                    MCP Servers
                                </Link>
                                <Link href="#deployment" className="block text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
                                    Deployment
                                </Link>
                                <Link href="#api" className="block text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
                                    API Reference
                                </Link>
                                <Link href="#troubleshooting" className="block text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
                                    Troubleshooting
                                </Link>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <h1 className="text-4xl font-bold text-white mb-8">Documentation</h1>

                        {/* Getting Started */}
                        <section id="getting-started" className="mb-16">
                            <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>
                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">1. Create Your Account</h3>
                                    <p className="text-gray-400">Sign up for a free account at antigravity.ai. No credit card required.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">2. Build Your First Agent</h3>
                                    <p className="text-gray-400">Use the visual agent builder to create your first AI agent. Drag and drop nodes to create workflows.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">3. Connect MCP Servers</h3>
                                    <p className="text-gray-400">Browse the MCP marketplace and install servers to connect your agent to external services.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">4. Deploy Your Agent</h3>
                                    <p className="text-gray-400">Deploy your agent to the cloud or self-host it on your own infrastructure.</p>
                                </div>
                            </div>
                        </section>

                        {/* Agent Builder */}
                        <section id="agent-builder" className="mb-16">
                            <h2 className="text-2xl font-bold text-white mb-4">Agent Builder</h2>
                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Node Types</h3>
                                    <ul className="text-gray-400 space-y-2">
                                        <li><strong className="text-white">Triggers:</strong> Start your agent workflow (webhook, schedule, email, etc.)</li>
                                        <li><strong className="text-white">Actions:</strong> Perform tasks (AI reasoning, HTTP requests, database queries)</li>
                                        <li><strong className="text-white">Logic:</strong> Control flow (if/else, loops, switches)</li>
                                        <li><strong className="text-white">MCP Servers:</strong> Connect to external services</li>
                                    </ul>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Creating a Workflow</h3>
                                    <ol className="text-gray-400 space-y-2 list-decimal list-inside">
                                        <li>Drag nodes from the library to the canvas</li>
                                        <li>Connect nodes by dragging from one node's output to another's input</li>
                                        <li>Configure each node in the properties panel</li>
                                        <li>Test your agent using the Test button</li>
                                        <li>Save and deploy your agent</li>
                                    </ol>
                                </div>
                            </div>
                        </section>

                        {/* MCP Servers */}
                        <section id="mcp-servers" className="mb-16">
                            <h2 className="text-2xl font-bold text-white mb-4">MCP Servers</h2>
                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">What are MCP Servers?</h3>
                                    <p className="text-gray-400">MCP (Model Context Protocol) servers allow your agents to connect to external services like GitHub, Notion, Stripe, and more.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Installing MCP Servers</h3>
                                    <ol className="text-gray-400 space-y-2 list-decimal list-inside">
                                        <li>Go to the MCP Marketplace</li>
                                        <li>Search for the server you want</li>
                                        <li>Click "Install" on the server card</li>
                                        <li>Configure the server with your API keys</li>
                                        <li>Use the server in your agent workflows</li>
                                    </ol>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Popular MCP Servers</h3>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="text-gray-400">🔷 Google Cloud</div>
                                        <div className="text-gray-400">🐙 GitHub</div>
                                        <div className="text-gray-400">💳 Stripe</div>
                                        <div className="text-gray-400">📝 Notion</div>
                                        <div className="text-gray-400">💬 Slack</div>
                                        <div className="text-gray-400">☁️ AWS</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Deployment */}
                        <section id="deployment" className="mb-16">
                            <h2 className="text-2xl font-bold text-white mb-4">Deployment</h2>
                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Cloud Deployment</h3>
                                    <p className="text-gray-400">Deploy your agent to our managed cloud with one click. Includes automatic scaling, monitoring, and 99.9% uptime SLA.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Self-Hosting</h3>
                                    <p className="text-gray-400">Deploy your agent on your own infrastructure using Docker or Kubernetes. Full control over your data and resources.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">VPC Deployment</h3>
                                    <p className="text-gray-400">Enterprise customers can deploy agents in their own VPC for maximum security and compliance.</p>
                                </div>
                            </div>
                        </section>

                        {/* API Reference */}
                        <section id="api" className="mb-16">
                            <h2 className="text-2xl font-bold text-white mb-4">API Reference</h2>
                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Authentication</h3>
                                    <p className="text-gray-400 mb-4">All API requests require an API key in the Authorization header:</p>
                                    <code className="block bg-black/30 p-3 rounded-lg text-green-400 text-sm">
                                        Authorization: Bearer YOUR_API_KEY
                                    </code>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Create Agent</h3>
                                    <code className="block bg-black/30 p-3 rounded-lg text-green-400 text-sm mb-2">
                                        POST /api/v1/agents
                                    </code>
                                    <p className="text-gray-400">Create a new AI agent with the specified configuration.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Execute Agent</h3>
                                    <code className="block bg-black/30 p-3 rounded-lg text-green-400 text-sm mb-2">
                                        POST /api/v1/agents/:id/execute
                                    </code>
                                    <p className="text-gray-400">Execute an agent with the provided input data.</p>
                                </div>
                            </div>
                        </section>

                        {/* Troubleshooting */}
                        <section id="troubleshooting" className="mb-16">
                            <h2 className="text-2xl font-bold text-white mb-4">Troubleshooting</h2>
                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Agent Not Executing</h3>
                                    <p className="text-gray-400">Check that all MCP servers are properly configured and that your agent has the necessary permissions.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">MCP Server Connection Failed</h3>
                                    <p className="text-gray-400">Verify your API keys are correct and that the MCP server is accessible from your deployment environment.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-2">Performance Issues</h3>
                                    <p className="text-gray-400">Check the analytics dashboard for bottlenecks. Consider upgrading your plan for more resources.</p>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
}
