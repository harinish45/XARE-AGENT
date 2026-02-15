import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { executeWorkflow, ExecutionState } from '@/lib/workflow/executor';
import { Workflow, NodeType } from '@/lib/workflow/types';

interface Node {
    id: string;
    type: 'trigger' | 'action' | 'logic' | 'mcp';
    name: string;
    icon: string;
    x: number;
    y: number;
    description?: string;
    data?: any; // Added to store node configuration
}

// Animated background
const AnimatedBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div
            className="absolute inset-0 opacity-30"
            style={{
                backgroundImage: `
                    radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.3) 1px, transparent 0)
                `,
                backgroundSize: '32px 32px'
            }}
        />
        {/* Floating orbs */}
        <motion.div
            className="absolute top-1/4 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl"
            animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
    </div>
);

// Glowing node component
const GlowingNode = ({ node, isSelected, onClick }: { node: Node; isSelected: boolean; onClick: () => void }) => {
    const colors = {
        trigger: { from: '#3b82f6', to: '#06b6d4', shadow: 'rgba(59, 130, 246, 0.4)' },
        action: { from: '#a855f7', to: '#ec4899', shadow: 'rgba(168, 85, 247, 0.4)' },
        logic: { from: '#f59e0b', to: '#f97316', shadow: 'rgba(245, 158, 11, 0.4)' },
        mcp: { from: '#10b981', to: '#14b8a6', shadow: 'rgba(16, 185, 129, 0.4)' },
    };
    const color = colors[node.type];

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="absolute cursor-pointer"
            style={{ left: node.x, top: node.y }}
        >
            {/* Glow effect */}
            <motion.div
                className="absolute -inset-2 rounded-2xl blur-xl"
                style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                animate={{ opacity: isSelected ? [0.4, 0.6, 0.4] : 0.2 }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Node card */}
            <div
                className={`relative bg-[#0a0a0f]/90 backdrop-blur-xl rounded-2xl p-4 min-w-[160px] border transition-all duration-300 ${isSelected ? 'border-white/30 ring-2 ring-white/20' : 'border-white/5 hover:border-white/10'
                    }`}
                style={{ boxShadow: `0 0 30px ${color.shadow}` }}
            >
                {/* Gradient top border */}
                <div
                    className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color.from}, ${color.to})` }}
                />

                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${color.from}20, ${color.to}20)` }}
                        animate={{ rotate: isSelected ? [0, 5, -5, 0] : 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-xl">{node.icon}</span>
                    </motion.div>
                    <div>
                        <p className="text-white font-semibold text-sm">{node.name}</p>
                        <p className="text-gray-500 text-xs capitalize">{node.type}</p>
                    </div>
                </div>

                {/* Connection points */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/20 border border-white/30" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-white/20 border border-white/30" />
            </div>
        </motion.div>
    );
};

// Sidebar item with hover effect
const SidebarItem = ({ icon, name, description, onClick, color }: { icon: string; name: string; description: string; onClick: () => void; color: string }) => (
    <motion.button
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all text-left group"
    >
        <motion.span
            className="text-xl"
            whileHover={{ scale: 1.2, rotate: 10 }}
            transition={{ type: "spring", stiffness: 400 }}
        >
            {icon}
        </motion.span>
        <div className="flex-1 min-w-0">
            <p className="text-gray-200 text-sm font-medium truncate">{name}</p>
            <p className="text-gray-500 text-xs truncate">{description}</p>
        </div>
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        </motion.div>
    </motion.button>
);

export default function AgentBuilderPage() {
    // AI Generation Logic
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateWorkflow = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const response = await fetch('/api/ai/generate-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt }),
            });
            const data = await response.json();

            if (data.workflow) {
                // Map AI workflow to builder state
                // This assumes the AI returns nodes compatible with our builder
                setNodes(data.workflow.nodes);
                // setConnections(data.workflow.edges...); // Connections not fully implemented in this MVP builder yet
                setIsAIModalOpen(false);
                setAiPrompt('');
            }
        } catch (error) {
            console.error('Failed to generate workflow:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const [nodes, setNodes] = useState<Node[]>([
        { id: '1', type: 'trigger', name: 'Webhook', icon: '🌐', x: 100, y: 200, description: 'HTTP endpoint trigger' },
        { id: '2', type: 'action', name: 'AI Reasoning', icon: '🤖', x: 320, y: 200, description: 'LLM processing node' },
        { id: '3', type: 'mcp', name: 'GitHub', icon: '🐙', x: 540, y: 140, description: 'GitHub MCP integration' },
        { id: '4', type: 'mcp', name: 'Notion', icon: '📝', x: 540, y: 260, description: 'Notion MCP integration' },
    ]);

    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [agentName, setAgentName] = useState('My First Agent');
    const [editedNodeName, setEditedNodeName] = useState('');
    const [editedNodeDescription, setEditedNodeDescription] = useState('');
    const [activeTab, setActiveTab] = useState<'nodes' | 'mcp' | 'templates'>('nodes');
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const handleRunWorkflow = async () => {
        setIsRunning(true);
        setLogs(['Starting workflow execution...']);
        try {
            // Convert Builder Nodes to Workflow Schema
            // TODO: Edges/Connections are currently implicit or missing in this mockup state. 
            // We need to infer linear attributes or use a real graph.
            // For now, we assume a linear flow based on Y position or ID order for the demo.

            const sortedNodes = [...nodes].sort((a, b) => a.y - b.y);
            // Create implicit edges for linear flow
            const edges = sortedNodes.slice(0, -1).map((n, i) => ({
                id: `e-${i}`,
                source: n.id,
                target: sortedNodes[i + 1].id
            }));

            // Map to valid Workflow structure
            // We need to map builder types to system types if they differ
            const systemNodes = sortedNodes.map(n => ({
                id: n.id,
                type: n.data?.type || (n.type === 'trigger' ? NodeType.TRIGGER : NodeType.ACTION_LLM), // Fallback
                position: { x: n.x, y: n.y },
                data: n.data || {}
            }));

            const workflow: Workflow = {
                id: 'demo-run',
                name: agentName,
                nodes: systemNodes,
                edges: edges,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const result = await executeWorkflow(workflow);

            setLogs(prev => [
                ...prev,
                ...result.logs.map(l => `[${l.status.toUpperCase()}] ${l.nodeType}: ${JSON.stringify(l.output || l.error)}`)
            ]);
            setLogs(prev => [...prev, 'Execution completed successfully.']);

        } catch (error: any) {
            console.error('Execution failed:', error);
            setLogs(prev => [...prev, `Error: ${error.message}`]);
        } finally {
            setIsRunning(false);
        }
    };

    useEffect(() => {
        if (selectedNode) {
            setEditedNodeName(selectedNode.name);
            setEditedNodeDescription(selectedNode.description || '');
        }
    }, [selectedNode]);

    const nodeTypes = [
        { type: 'trigger', label: 'Triggers', icon: '🎯', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
        { type: 'action', label: 'Actions', icon: '⚡', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
        { type: 'logic', label: 'Logic', icon: '🔀', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
        { type: 'mcp', label: 'MCP Servers', icon: '🔌', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    ];

    const availableNodes = [
        { type: 'trigger', name: 'Schedule', icon: '⏰', description: 'Run on schedule' },
        { type: 'trigger', name: 'Email', icon: '📧', description: 'Email received trigger' },
        { type: 'trigger', name: 'Webhook', icon: '🌐', description: 'HTTP endpoint' },
        { type: 'trigger', name: 'Chat', icon: '💬', description: 'Chat message trigger' },
        { type: 'action', name: 'AI Reasoning', icon: '🤖', description: 'LLM processing' },
        { type: 'action', name: 'HTTP Request', icon: '🌐', description: 'Make API calls' },
        { type: 'action', name: 'Database Query', icon: '🗄️', description: 'Query databases' },
        { type: 'action', name: 'Send Email', icon: '✉️', description: 'Send emails' },
        { type: 'logic', name: 'If/Else', icon: '❓', description: 'Conditional branching' },
        { type: 'logic', name: 'Loop', icon: '🔄', description: 'Iterate over items' },
        { type: 'logic', name: 'Switch', icon: '🔀', description: 'Multiple branches' },
        { type: 'logic', name: 'Wait', icon: '⏱️', description: 'Delay execution' },
        { type: 'mcp', name: 'GitHub', icon: '🐙', description: 'GitHub integration' },
        { type: 'mcp', name: 'Notion', icon: '📝', description: 'Notion workspace' },
        { type: 'mcp', name: 'Slack', icon: '💬', description: 'Slack messaging' },
        { type: 'mcp', name: 'Stripe', icon: '💳', description: 'Payment processing' },
    ];

    const mcpServers = [
        { name: 'Google Cloud', icon: '☁️', count: 22, color: 'from-blue-500 to-blue-600' },
        { name: 'Databases', icon: '💾', count: 15, color: 'from-emerald-500 to-emerald-600' },
        { name: 'Development', icon: '🛠️', count: 20, color: 'from-purple-500 to-purple-600' },
        { name: 'AI/ML', icon: '🧠', count: 8, color: 'from-pink-500 to-pink-600' },
    ];

    const templates = [
        { name: 'Email Triage', icon: '📧', description: 'Automatically categorize and respond to emails', nodes: 5 },
        { name: 'Daily Report', icon: '📊', description: 'Generate daily summary reports', nodes: 4 },
        { name: 'Lead Qualification', icon: '🎯', description: 'Score and qualify leads automatically', nodes: 6 },
    ];

    const addNode = (node: typeof availableNodes[0]) => {
        const newNode: Node = {
            id: Date.now().toString(),
            type: node.type as Node['type'],
            name: node.name,
            icon: node.icon,
            x: 200 + Math.random() * 200,
            y: 150 + Math.random() * 150,
            description: node.description,
        };
        setNodes([...nodes, newNode]);
    };

    const updateSelectedNode = useCallback(() => {
        if (selectedNode) {
            setNodes(nodes.map(n =>
                n.id === selectedNode.id
                    ? { ...n, name: editedNodeName, description: editedNodeDescription }
                    : n
            ));
            setSelectedNode({ ...selectedNode, name: editedNodeName, description: editedNodeDescription });
        }
    }, [selectedNode, nodes, editedNodeName, editedNodeDescription]);

    const deleteNode = useCallback(() => {
        if (selectedNode) {
            setNodes(nodes.filter(n => n.id !== selectedNode.id));
            setSelectedNode(null);
        }
    }, [selectedNode, nodes]);

    return (
        <div className="min-h-screen bg-[#030008] font-sans antialiased overflow-hidden relative">
            {/* AI Prompt Modal */}
            <AnimatePresence>
                {isAIModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#1a1f3c] border border-purple-500/50 p-6 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(168,85,247,0.2)]"
                        >
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="text-2xl">✨</span> AI Workflow Generator
                            </h3>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Describe your automation... e.g., 'Monitor my Twitter for mentions and auto-reply with a thank you message using GPT-4'"
                                className="w-full h-32 bg-[#0a0e1a] border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setIsAIModalOpen(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerateWorkflow}
                                    disabled={isGenerating || !aiPrompt.trim()}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>Generate Workflow 🚀</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>



            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0 z-50"
            >
                <div className="max-w-full mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-6">
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
                            <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3"
                            >
                                <input
                                    type="text"
                                    value={agentName}
                                    onChange={(e) => setAgentName(e.target.value)}
                                    className="bg-white/5 text-white font-semibold text-base border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm min-w-[200px]"
                                    placeholder="Agent name..."
                                />
                                <motion.span
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20"
                                >
                                    Draft
                                </motion.span>
                            </motion.div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {[
                                { icon: '❓', tooltip: 'Help' },
                                { icon: '⚙️', tooltip: 'Settings' },
                            ].map((item) => (
                                <motion.button
                                    key={item.tooltip}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-gray-400 hover:text-white transition-colors p-2.5 hover:bg-white/5 rounded-xl"
                                    title={item.tooltip}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                </motion.button>
                            ))}

                            <motion.button
                                onClick={() => setIsAIModalOpen(true)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-3 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-all flex items-center gap-2 mr-2"
                            >
                                <span className="text-lg">✨</span>
                                <span className="font-medium text-sm hidden sm:inline">AI Magic</span>
                            </motion.button>

                            <div className="h-6 w-px bg-white/10" />
                            <motion.button
                                onClick={handleRunWorkflow}
                                disabled={isRunning}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-4 py-2 hover:bg-white/5 rounded-xl border border-white/10 ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="text-lg">{isRunning ? '⏳' : '▶️'}</span>
                                <span className="font-medium text-sm">{isRunning ? 'Running...' : 'Test'}</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2"
                            >
                                <span className="text-lg">💾</span>
                                <span>Save Agent</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            <div className="flex h-[calc(100vh-64px)]">
                {/* Left Sidebar */}
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="w-72 border-r border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden flex flex-col"
                >
                    {/* Tabs */}
                    <div className="flex border-b border-white/5">
                        {(['nodes', 'mcp', 'templates'] as const).map((tab) => (
                            <motion.button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab
                                    ? 'text-white bg-white/5 border-b-2 border-purple-500'
                                    : 'text-gray-400'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </motion.button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-white/5">
                        <div className="relative">
                            <motion.svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </motion.svg>
                            <input
                                type="text"
                                placeholder="Search nodes..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'nodes' && (
                                <motion.div
                                    key="nodes"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {nodeTypes.map((category, i) => (
                                        <motion.div
                                            key={category.type}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className={`w-6 h-6 rounded-lg ${category.bg} border ${category.border} flex items-center justify-center`}>
                                                    <span className="text-xs">{category.icon}</span>
                                                </div>
                                                <span className="text-white font-semibold text-sm">{category.label}</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {availableNodes
                                                    .filter((node) => node.type === category.type)
                                                    .map((node) => (
                                                        <SidebarItem
                                                            key={node.name}
                                                            {...node}
                                                            onClick={() => addNode(node)}
                                                            color={category.color}
                                                        />
                                                    ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {activeTab === 'mcp' && (
                                <motion.div
                                    key="mcp"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-3"
                                >
                                    <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-4">MCP Server Categories</p>
                                    {mcpServers.map((server, i) => (
                                        <motion.button
                                            key={server.name}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            whileHover={{ x: 4 }}
                                            className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all text-left group"
                                        >
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${server.color} flex items-center justify-center shadow-lg`}>
                                                <span className="text-lg">{server.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-200 text-sm font-medium">{server.name}</p>
                                                <p className="text-gray-500 text-xs">{server.count} servers</p>
                                            </div>
                                            <motion.svg
                                                className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                animate={{ x: [0, 4, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </motion.svg>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}

                            {activeTab === 'templates' && (
                                <motion.div
                                    key="templates"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-3"
                                >
                                    <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-4">Quick Start Templates</p>
                                    {templates.map((template, i) => (
                                        <motion.button
                                            key={template.name}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            whileHover={{ scale: 1.02 }}
                                            className="w-full text-left px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <motion.span
                                                    className="text-2xl"
                                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                                >
                                                    {template.icon}
                                                </motion.span>
                                                <p className="text-gray-200 font-medium">{template.name}</p>
                                            </div>
                                            <p className="text-gray-500 text-xs mb-2">{template.description}</p>
                                            <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                                {template.nodes} nodes
                                            </span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Main Canvas */}
                <div className="flex-1 relative overflow-hidden bg-[#050508]">
                    <AnimatedBackground />

                    {/* Log Viewer Overlay */}
                    <AnimatePresence>
                        {logs.length > 0 && (
                            <motion.div
                                initial={{ y: 200, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 200, opacity: 0 }}
                                className="absolute bottom-0 left-0 right-0 bg-[#0a0a0f]/95 border-t border-white/10 p-4 h-48 overflow-y-auto z-40 font-mono text-sm shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                            >
                                <div className="flex justify-between items-center mb-2 sticky top-0 bg-[#0a0a0f] py-1">
                                    <h3 className="text-cyan-400 font-bold flex items-center gap-2">
                                        <span className="text-lg">📟</span> Execution Logs
                                    </h3>
                                    <button onClick={() => setLogs([])} className="text-gray-500 hover:text-white text-xs px-2 py-1 hover:bg-white/10 rounded">Clear</button>
                                </div>
                                <div className="space-y-1 font-mono text-xs">
                                    {logs.map((log, i) => (
                                        <div key={i} className="text-gray-300 border-l-2 border-white/10 pl-2 py-0.5">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>


                    {/* Canvas Content */}
                    <div className="absolute inset-0">
                        {/* Connection Lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(139, 92, 246, 0.2)" />
                                    <stop offset="50%" stopColor="rgba(236, 72, 153, 0.4)" />
                                    <stop offset="100%" stopColor="rgba(139, 92, 246, 0.2)" />
                                </linearGradient>
                            </defs>
                            {nodes.slice(1).map((node, index) => (
                                <motion.path
                                    key={`line-${node.id}`}
                                    d={`M ${nodes[index].x + 80} ${nodes[index].y + 35} Q ${(nodes[index].x + node.x) / 2 + 40} ${nodes[index].y + 35} ${node.x} ${node.y + 35}`}
                                    stroke="url(#lineGradient)"
                                    strokeWidth="2"
                                    fill="none"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, delay: index * 0.2 }}
                                />
                            ))}
                        </svg>

                        {/* Nodes */}
                        {nodes.map((node, index) => (
                            <GlowingNode
                                key={node.id}
                                node={node}
                                isSelected={selectedNode?.id === node.id}
                                onClick={() => setSelectedNode(node)}
                            />
                        ))}
                    </div>

                    {/* Canvas Controls */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2"
                    >
                        {[
                            { icon: '➕', action: 'Zoom In' },
                            { icon: '➖', action: 'Zoom Out' },
                            { icon: '🔲', action: 'Fit' },
                        ].map((item, i) => (
                            <motion.button
                                key={item.action}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                title={item.action}
                            >
                                <span className="text-sm">{item.icon}</span>
                            </motion.button>
                        ))}
                        <div className="px-3 text-gray-400 text-sm font-medium">100%</div>
                    </motion.div>

                    {/* Test Button */}
                    <motion.button
                        onClick={handleRunWorkflow}
                        disabled={isRunning}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`absolute bottom-6 right-6 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl shadow-xl shadow-purple-500/25 flex items-center gap-2 font-semibold ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {isRunning ? '⏳' : '▶️'}
                        </motion.span>
                        <span>{isRunning ? 'Running...' : 'Test Agent'}</span>
                    </motion.button>

                </div>

                {/* Right Sidebar - Properties */}
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-80 border-l border-white/5 bg-black/20 backdrop-blur-xl overflow-y-auto"
                >
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white font-bold text-lg tracking-tight">Properties</h2>
                            {selectedNode && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`text-xs px-2.5 py-1 rounded-lg capitalize font-medium ${selectedNode.type === 'trigger' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        selectedNode.type === 'action' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                            selectedNode.type === 'logic' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        }`}
                                >
                                    {selectedNode.type}
                                </motion.span>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {selectedNode ? (
                                <motion.div
                                    key="selected"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-5"
                                >
                                    {/* Node Preview */}
                                    <motion.div
                                        className="relative rounded-2xl overflow-hidden"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-xl" />
                                        <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                                            <motion.span
                                                className="text-3xl"
                                                animate={{ rotate: [0, 10, -10, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                {selectedNode.icon}
                                            </motion.span>
                                            <div>
                                                <p className="text-white font-semibold">{selectedNode.name}</p>
                                                <p className="text-gray-500 text-sm capitalize">{selectedNode.type} Node</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Node Name */}
                                    <div>
                                        <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Node Name</label>
                                        <input
                                            type="text"
                                            value={editedNodeName}
                                            onChange={(e) => setEditedNodeName(e.target.value)}
                                            onBlur={updateSelectedNode}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Description</label>
                                        <textarea
                                            value={editedNodeDescription}
                                            onChange={(e) => setEditedNodeDescription(e.target.value)}
                                            onBlur={updateSelectedNode}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent h-24 resize-none text-sm"
                                            placeholder="Add a description..."
                                        />
                                    </div>

                                    {/* Position */}
                                    <div>
                                        <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">Position</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['X', 'Y'].map((axis, i) => (
                                                <div key={axis} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                                    <p className="text-gray-500 text-xs mb-1">{axis}</p>
                                                    <p className="text-white font-mono text-sm">{Math.round(selectedNode[i === 0 ? 'x' : 'y'])}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4 border-t border-white/5 space-y-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={updateSelectedNode}
                                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl font-medium text-sm"
                                        >
                                            Save Changes
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={deleteNode}
                                            className="w-full bg-red-500/10 text-red-400 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20 font-medium text-sm"
                                        >
                                            Delete Node
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-center py-16"
                                >
                                    <motion.div
                                        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center"
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <span className="text-4xl">🎯</span>
                                    </motion.div>
                                    <p className="text-gray-400 font-medium mb-2">No Node Selected</p>
                                    <p className="text-gray-500 text-sm">Click on a node in the canvas to view and edit its properties</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
