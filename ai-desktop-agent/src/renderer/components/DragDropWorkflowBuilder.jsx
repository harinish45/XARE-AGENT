/**
 * Drag and Drop Workflow Builder
 * Enhanced UI with drag-and-drop functionality
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

const WorkflowBuilder = () => {
    const [nodes, setNodes] = useState([
        { id: 1, type: 'trigger', name: 'Time Trigger', x: 100, y: 100 },
        { id: 2, type: 'action', name: 'Send Email', x: 300, y: 100 },
        { id: 3, type: 'condition', name: 'Check Condition', x: 500, y: 100 },
        { id: 4, type: 'action', name: 'Save File', x: 700, y: 100 }
    ]);
    const [connections, setConnections] = useState([
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 }
    ]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNode, setDraggedNode] = useState(null);

    const nodeTypes = [
        { type: 'trigger', label: 'Trigger', icon: '⚡', color: 'from-yellow-500 to-orange-500' },
        { type: 'action', label: 'Action', icon: '⚙️', color: 'from-blue-500 to-purple-500' },
        { type: 'condition', label: 'Condition', icon: '❓', color: 'from-green-500 to-teal-500' },
        { type: 'loop', label: 'Loop', icon: '🔄', color: 'from-pink-500 to-red-500' },
        { type: 'delay', label: 'Delay', icon: '⏱️', color: 'from-gray-500 to-gray-600' }
    ];

    const handleDragStart = useCallback((node, e) => {
        setIsDragging(true);
        setDraggedNode(node);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (draggedNode) {
            const canvas = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - canvas.left - draggedNode.width / 2;
            const y = e.clientY - canvas.top - draggedNode.height / 2;
            
            setNodes(prev => prev.map(node => 
                node.id === draggedNode.id ? { ...node, x, y } : node
            ));
            setDraggedNode(null);
        }
    }, [draggedNode]);

    const handleNodeClick = useCallback((node) => {
        setSelectedNode(node);
    }, []);

    const handleAddNode = useCallback((type) => {
        const newNode = {
            id: Date.now(),
            type,
            name: `New ${type}`,
            x: 100 + Math.random() * 400,
            y: 100 + Math.random() * 300
        };
        setNodes(prev => [...prev, newNode]);
    }, []);

    const handleDeleteNode = useCallback((nodeId) => {
        setNodes(prev => prev.filter(node => node.id !== nodeId));
        setConnections(prev => prev.filter(conn => 
            conn.from !== nodeId && conn.to !== nodeId
        ));
        if (selectedNode?.id === nodeId) {
            setSelectedNode(null);
        }
    }, [selectedNode]);

    const handleAddConnection = useCallback((fromId, toId) => {
        if (fromId === toId) return;
        
        const exists = connections.some(conn => 
            conn.from === fromId && conn.to === toId
        );
        
        if (!exists) {
            setConnections(prev => [...prev, { from: fromId, to: toId }]);
        }
    }, [connections]);

    const handleDeleteConnection = useCallback((index) => {
        setConnections(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleSaveWorkflow = useCallback(() => {
        const workflow = {
            id: Date.now(),
            name: 'New Workflow',
            nodes,
            connections,
            createdAt: new Date().toISOString()
        };
        
        console.log('Saving workflow:', workflow);
        // TODO: Save to backend
    }, [nodes, connections]);

    const handleExportWorkflow = useCallback(() => {
        const workflow = {
            nodes,
            connections
        };
        
        const dataStr = JSON.stringify(workflow, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'workflow.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }, [nodes, connections]);

    const handleImportWorkflow = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const workflow = JSON.parse(event.target.result);
                setNodes(workflow.nodes || []);
                setConnections(workflow.connections || []);
            } catch (error) {
                console.error('Failed to import workflow:', error);
            }
        };
        reader.readAsText(file);
    }, []);

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            {/* Header */}
            <header className="border-b border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold">Workflow Builder</h1>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400">
                            Drag & Drop Mode
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleSaveWorkflow}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
                        >
                            💾 Save
                        </button>
                        <button
                            onClick={handleExportWorkflow}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                        >
                            📤 Export
                        </button>
                        <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors cursor-pointer">
                            📥 Import
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportWorkflow}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Node Types */}
                <aside className="w-64 border-r border-gray-700 p-4 overflow-y-auto">
                    <h2 className="text-lg font-bold mb-4">Node Types</h2>
                    <div className="space-y-2">
                        {nodeTypes.map((nodeType) => (
                            <motion.div
                                key={nodeType.type}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                draggable
                                onDragStart={(e) => handleDragStart({ ...nodeType, width: 150, height: 80 }, e)}
                                className={`p-4 rounded-lg border-2 border-dashed border-gray-600 hover:border-blue-500 cursor-grab transition-all bg-gradient-to-r ${nodeType.color}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{nodeType.icon}</span>
                                    <span className="font-medium">{nodeType.label}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <h3 className="text-sm font-semibold mb-3 text-gray-400">Quick Actions</h3>
                        <div className="space-y-2">
                            <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors">
                                🔄 Auto Layout
                            </button>
                            <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors">
                                🧹 Clear Canvas
                            </button>
                            <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors">
                                📐 Zoom In
                            </button>
                            <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors">
                                📐 Zoom Out
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Canvas */}
                <main
                    className="flex-1 relative overflow-hidden"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: `
                            linear-gradient(to right, #374151 1px, transparent 1px),
                            linear-gradient(to bottom, #374151 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                    }}></div>

                    {/* Connections */}
                    <svg className="absolute inset-0 pointer-events-none">
                        {connections.map((conn, index) => {
                            const fromNode = nodes.find(n => n.id === conn.from);
                            const toNode = nodes.find(n => n.id === conn.to);
                            
                            if (!fromNode || !toNode) return null;
                            
                            return (
                                <g key={index}>
                                    <line
                                        x1={fromNode.x + 75}
                                        y1={fromNode.y + 40}
                                        x2={toNode.x + 75}
                                        y2={toNode.y + 40}
                                        stroke="#3b82f6"
                                        strokeWidth="2"
                                        markerEnd="url(#arrowhead)"
                                    />
                                    <circle
                                        cx={(fromNode.x + toNode.x) / 2 + 75}
                                        cy={(fromNode.y + toNode.y) / 2 + 40}
                                        r="12"
                                        fill="#1e40af"
                                        onClick={() => handleDeleteConnection(index)}
                                        className="cursor-pointer hover:fill-red-500 transition-colors"
                                    />
                                </g>
                            );
                        })}
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                            </marker>
                        </defs>
                    </svg>

                    {/* Nodes */}
                    <AnimatePresence>
                        {nodes.map((node) => (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                drag
                                dragMomentum={false}
                                dragElastic={0.1}
                                onDragStart={() => setIsDragging(true)}
                                onDragEnd={(e, info) => {
                                    setIsDragging(false);
                                    setNodes(prev => prev.map(n => 
                                        n.id === node.id 
                                            ? { ...n, x: info.point.x, y: info.point.y }
                                            : n
                                    ));
                                }}
                                onClick={() => handleNodeClick(node)}
                                style={{
                                    position: 'absolute',
                                    left: node.x,
                                    top: node.y,
                                    cursor: 'move'
                                }}
                                className={`w-[150px] p-4 rounded-lg border-2 shadow-lg cursor-move ${
                                    selectedNode?.id === node.id
                                        ? 'border-blue-500 ring-2 ring-blue-500/50'
                                        : 'border-gray-600 hover:border-blue-400'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl">
                                        {nodeTypes.find(t => t.type === node.type)?.icon || '⚙️'}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteNode(node.id);
                                        }}
                                        className="text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="font-medium text-sm mb-1">{node.name}</div>
                                <div className="text-xs text-gray-400">{node.type}</div>
                                
                                {/* Connection Points */}
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-crosshair hover:bg-blue-400 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (selectedNode && selectedNode.id !== node.id) {
                                            handleAddConnection(selectedNode.id, node.id);
                                        }
                                    }}
                                ></div>
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full cursor-crosshair hover:bg-green-400 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (selectedNode && selectedNode.id !== node.id) {
                                            handleAddConnection(node.id, selectedNode.id);
                                        }
                                    }}
                                ></div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty State */}
                    {nodes.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📋</div>
                                <h2 className="text-2xl font-bold mb-2">Empty Canvas</h2>
                                <p className="text-gray-400 mb-4">
                                    Drag nodes from the sidebar to get started
                                </p>
                                <button
                                    onClick={() => handleAddNode('trigger')}
                                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
                                >
                                    Add First Node
                                </button>
                            </div>
                        </div>
                    )}
                </main>

                {/* Properties Panel */}
                <aside className="w-80 border-l border-gray-700 p-4 overflow-y-auto">
                    <h2 className="text-lg font-bold mb-4">Properties</h2>
                    
                    {selectedNode ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-400">Node Name</label>
                                <input
                                    type="text"
                                    value={selectedNode.name}
                                    onChange={(e) => {
                                        setNodes(prev => prev.map(n => 
                                            n.id === selectedNode.id 
                                                ? { ...n, name: e.target.value }
                                                : n
                                        ));
                                    }}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-400">Node Type</label>
                                <div className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg">
                                    {selectedNode.type}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-400">Position</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">X</label>
                                        <input
                                            type="number"
                                            value={selectedNode.x}
                                            onChange={(e) => {
                                                setNodes(prev => prev.map(n => 
                                                    n.id === selectedNode.id 
                                                        ? { ...n, x: parseInt(e.target.value) }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Y</label>
                                        <input
                                            type="number"
                                            value={selectedNode.y}
                                            onChange={(e) => {
                                                setNodes(prev => prev.map(n => 
                                                    n.id === selectedNode.id 
                                                        ? { ...n, y: parseInt(e.target.value) }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-400">Connections</label>
                                <div className="space-y-2">
                                    {connections
                                        .filter(conn => conn.from === selectedNode.id || conn.to === selectedNode.id)
                                        .map((conn, index) => (
                                            <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg">
                                                <span className="text-sm">
                                                    Node {conn.from} → Node {conn.to}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteConnection(
                                                        connections.findIndex(c => c.from === conn.from && c.to === conn.to)
                                                    )}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    {connections.filter(conn => conn.from === selectedNode.id || conn.to === selectedNode.id).length === 0 && (
                                        <div className="text-sm text-gray-500">No connections</div>
                                    )}
                                </div>
                            </div>
                            
                            <button
                                onClick={() => handleDeleteNode(selectedNode.id)}
                                className="w-full px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg font-medium transition-colors"
                            >
                                🗑️ Delete Node
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <div className="text-4xl mb-4">👆</div>
                            <p>Select a node to view properties</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default WorkflowBuilder;
