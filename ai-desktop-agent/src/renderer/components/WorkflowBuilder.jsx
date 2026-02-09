import React, { useState, useCallback, useRef } from 'react';
import { Plus, Trash2, Play, Save, Download, Upload, Settings, X, Copy, Check, AlertTriangle, Clock, File, Globe, Zap, Mouse, Type, Eye, Layers, GitBranch } from 'lucide-react';

/**
 * WorkflowBuilder Component
 * n8n-like visual workflow builder with drag-and-drop interface
 */
const WorkflowBuilder = ({ onClose, onSave }) => {
    const [nodes, setNodes] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNode, setDraggedNode] = useState(null);
    const [workflowName, setWorkflowName] = useState('Untitled Workflow');
    const [showNodeMenu, setShowNodeMenu] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState(null);
    const canvasRef = useRef(null);
    const [scale, setScale] = useState(1);

    // Node types with their configurations
    const nodeTypes = {
        trigger: {
            type: 'trigger',
            label: 'Trigger',
            icon: <Zap className="w-5 h-5" />,
            color: 'from-purple-500 to-purple-600',
            inputs: 0,
            outputs: 1
        },
        action: {
            type: 'action',
            label: 'Action',
            icon: <Mouse className="w-5 h-5" />,
            color: 'from-blue-500 to-blue-600',
            inputs: 1,
            outputs: 1
        },
        condition: {
            type: 'condition',
            label: 'Condition',
            icon: <GitBranch className="w-5 h-5" />,
            color: 'from-yellow-500 to-yellow-600',
            inputs: 1,
            outputs: 2
        },
        delay: {
            type: 'delay',
            label: 'Delay',
            icon: <Clock className="w-5 h-5" />,
            color: 'from-gray-500 to-gray-600',
            inputs: 1,
            outputs: 1
        },
        loop: {
            type: 'loop',
            label: 'Loop',
            icon: <Layers className="w-5 h-5" />,
            color: 'from-green-500 to-green-600',
            inputs: 1,
            outputs: 1
        },
        http: {
            type: 'http',
            label: 'HTTP Request',
            icon: <Globe className="w-5 h-5" />,
            color: 'from-cyan-500 to-cyan-600',
            inputs: 1,
            outputs: 1
        },
        file: {
            type: 'file',
            label: 'File',
            icon: <File className="w-5 h-5" />,
            color: 'from-orange-500 to-orange-600',
            inputs: 1,
            outputs: 1
        },
        email: {
            type: 'email',
            label: 'Email',
            icon: <Copy className="w-5 h-5" />,
            color: 'from-pink-500 to-pink-600',
            inputs: 1,
            outputs: 1
        }
    };

    // Action types for each node
    const actionTypes = {
        trigger: [
            { id: 'time', label: 'Time Trigger', icon: <Clock className="w-4 h-4" /> },
            { id: 'file', label: 'File Trigger', icon: <File className="w-4 h-4" /> },
            { id: 'hotkey', label: 'Hotkey Trigger', icon: <Type className="w-4 h-4" /> },
            { id: 'webhook', label: 'Webhook Trigger', icon: <Globe className="w-4 h-4" /> }
        ],
        action: [
            { id: 'click', label: 'Click', icon: <Mouse className="w-4 h-4" /> },
            { id: 'type', label: 'Type', icon: <Type className="w-4 h-4" /> },
            { id: 'screenshot', label: 'Screenshot', icon: <Eye className="w-4 h-4" /> },
            { id: 'navigate', label: 'Navigate', icon: <Globe className="w-4 h-4" /> },
            { id: 'wait', label: 'Wait', icon: <Clock className="w-4 h-4" /> },
            { id: 'extract', label: 'Extract Data', icon: <Copy className="w-4 h-4" /> }
        ],
        condition: [
            { id: 'equals', label: 'Equals' },
            { id: 'not-equals', label: 'Not Equals' },
            { id: 'contains', label: 'Contains' },
            { id: 'greater-than', label: 'Greater Than' },
            { id: 'less-than', label: 'Less Than' }
        ],
        http: [
            { id: 'get', label: 'GET' },
            { id: 'post', label: 'POST' },
            { id: 'put', label: 'PUT' },
            { id: 'delete', label: 'DELETE' }
        ],
        file: [
            { id: 'read', label: 'Read File' },
            { id: 'write', label: 'Write File' },
            { id: 'delete', label: 'Delete File' },
            { id: 'copy', label: 'Copy File' },
            { id: 'move', label: 'Move File' }
        ],
        email: [
            { id: 'send', label: 'Send Email' },
            { id: 'read', label: 'Read Email' },
            { id: 'reply', label: 'Reply Email' }
        ]
    };

    // Add new node
    const addNode = useCallback((type, x, y) => {
        const newNode = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            x,
            y,
            data: getDefaultDataForType(type),
            connections: []
        };
        setNodes([...nodes, newNode]);
        return newNode;
    }, []);

    const getDefaultDataForType = (type) => {
        switch (type) {
            case 'trigger':
                return { triggerType: 'time', schedule: '0 0 * * * *' };
            case 'action':
                return { actionType: 'click', selector: '' };
            case 'condition':
                return { conditionType: 'equals', value: '' };
            case 'delay':
                return { duration: 1000 };
            case 'loop':
                return { iterations: 1, mode: 'sequential' };
            case 'http':
                return { method: 'get', url: '', headers: {} };
            case 'file':
                return { operation: 'read', path: '' };
            case 'email':
                return { operation: 'send', to: '', subject: '', body: '' };
            default:
                return {};
        }
    };

    // Delete node
    const deleteNode = useCallback((nodeId) => {
        setNodes(nodes.filter(n => n.id !== nodeId));
        setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    }, [nodes, connections]);

    // Update node data
    const updateNodeData = useCallback((nodeId, data) => {
        setNodes(nodes.map(n => n.id === nodeId ? { ...n, data } : n));
    }, [nodes]);

    // Add connection
    const addConnection = useCallback((fromNodeId, toNodeId, fromOutput = 0, toInput = 0) => {
        const newConnection = {
            id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            from: fromNodeId,
            to: toNodeId,
            fromOutput,
            toInput
        };
        setConnections([...connections, newConnection]);
    }, [connections]);

    // Delete connection
    const deleteConnection = useCallback((connectionId) => {
        setConnections(connections.filter(c => c.id !== connectionId));
    }, [connections]);

    // Handle node drag start
    const handleDragStart = useCallback((e, node) => {
        setIsDragging(true);
        setDraggedNode(node);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    // Handle node drag
    const handleDrag = useCallback((e) => {
        if (!isDragging) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setDraggedNode(prev => prev ? { ...prev, x, y } : null);
    }, [isDragging, scale]);

    // Handle node drop
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setDraggedNode(null);
    }, []);

    // Handle canvas click (add node)
    const handleCanvasClick = useCallback((e) => {
        if (e.target === canvasRef.current) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / scale;
            const y = (e.clientY - rect.top) / scale;

            // Show node menu at click position
            setShowNodeMenu({ x, y });
        }
    }, [scale]);

    // Select node from menu
    const selectNodeType = useCallback((type) => {
        const newNode = addNode(type, showNodeMenu.x, showNodeMenu.y);
        setShowNodeMenu(null);
    }, [addNode, showNodeMenu]);

    // Execute workflow
    const executeWorkflow = useCallback(async () => {
        setIsExecuting(true);
        setExecutionResult(null);

        try {
            // Validate workflow
            if (nodes.length === 0) {
                throw new Error('Workflow is empty');
            }

            // Check for trigger node
            const triggerNode = nodes.find(n => n.type === 'trigger');
            if (!triggerNode) {
                throw new Error('Workflow must have a trigger node');
            }

            // Execute workflow (simplified - would use workflow engine)
            const result = await window.api.executeWorkflow({
                nodes,
                connections,
                name: workflowName
            });

            setExecutionResult({
                success: true,
                message: 'Workflow executed successfully',
                result
            });
        } catch (error) {
            setExecutionResult({
                success: false,
                message: error.message
            });
        } finally {
            setIsExecuting(false);
        }
    }, [nodes, connections, workflowName]);

    // Save workflow
    const saveWorkflow = useCallback(() => {
        const workflow = {
            id: `workflow_${Date.now()}`,
            name: workflowName,
            nodes,
            connections,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to storage
        window.api.saveWorkflow(workflow);

        if (onSave) {
            onSave(workflow);
        }
    }, [nodes, connections, workflowName, onSave]);

    // Load workflow
    const loadWorkflow = useCallback((workflow) => {
        setWorkflowName(workflow.name);
        setNodes(workflow.nodes || []);
        setConnections(workflow.connections || []);
    }, []);

    // Clear workflow
    const clearWorkflow = useCallback(() => {
        setWorkflowName('Untitled Workflow');
        setNodes([]);
        setConnections([]);
        setExecutionResult(null);
    }, []);

    // Zoom controls
    const zoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + 0.1, 2));
    }, []);

    const zoomOut = useCallback(() => {
        setScale(prev => Math.max(prev - 0.1, 0.5));
    }, []);

    const resetZoom = useCallback(() => {
        setScale(1);
    }, []);

    // Render node
    const renderNode = (node) => {
        const nodeConfig = nodeTypes[node.type];
        const isSelected = selectedNode?.id === node.id;

        return (
            <div
                key={node.id}
                className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                style={{
                    left: node.x,
                    top: node.y,
                    transform: `scale(${scale})`
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, node)}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                }}
            >
                <div className={`relative bg-gradient-to-br ${nodeConfig.color} rounded-lg shadow-lg p-3 min-w-[180px]`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="text-white">
                                {nodeConfig.icon}
                            </div>
                            <span className="text-white font-medium text-sm">
                                {nodeConfig.label}
                            </span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteNode(node.id);
                            }}
                            className="text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Node type specific content */}
                    {renderNodeContent(node)}
                </div>

                {/* Connection points */}
                {renderConnectionPoints(node, nodeConfig)}
            </div>
        );
    };

    // Render node-specific content
    const renderNodeContent = (node) => {
        switch (node.type) {
            case 'trigger':
                return (
                    <div className="space-y-2">
                        <select
                            value={node.data.triggerType}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, triggerType: e.target.value })}
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm"
                        >
                            {actionTypes.trigger.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={node.data.schedule}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, schedule: e.target.value })}
                            placeholder="Cron schedule"
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm placeholder-white/50"
                        />
                    </div>
                );
            case 'action':
                return (
                    <div className="space-y-2">
                        <select
                            value={node.data.actionType}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, actionType: e.target.value })}
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm"
                        >
                            {actionTypes.action.map(a => (
                                <option key={a.id} value={a.id}>{a.label}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={node.data.selector}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, selector: e.target.value })}
                            placeholder="CSS selector"
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm placeholder-white/50"
                        />
                    </div>
                );
            case 'condition':
                return (
                    <div className="space-y-2">
                        <select
                            value={node.data.conditionType}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, conditionType: e.target.value })}
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm"
                        >
                            {actionTypes.condition.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={node.data.value}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, value: e.target.value })}
                            placeholder="Value"
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm placeholder-white/50"
                        />
                    </div>
                );
            case 'delay':
                return (
                    <div className="space-y-2">
                        <label className="text-white/70 text-xs">Duration (ms)</label>
                        <input
                            type="number"
                            value={node.data.duration}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, duration: parseInt(e.target.value) })}
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm"
                        />
                    </div>
                );
            case 'http':
                return (
                    <div className="space-y-2">
                        <select
                            value={node.data.method}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, method: e.target.value })}
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm"
                        >
                            {actionTypes.http.map(h => (
                                <option key={h.id} value={h.id}>{h.label}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={node.data.url}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, url: e.target.value })}
                            placeholder="URL"
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm placeholder-white/50"
                        />
                    </div>
                );
            case 'file':
                return (
                    <div className="space-y-2">
                        <select
                            value={node.data.operation}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, operation: e.target.value })}
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm"
                        >
                            {actionTypes.file.map(f => (
                                <option key={f.id} value={f.id}>{f.label}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={node.data.path}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, path: e.target.value })}
                            placeholder="File path"
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm placeholder-white/50"
                        />
                    </div>
                );
            case 'email':
                return (
                    <div className="space-y-2">
                        <select
                            value={node.data.operation}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, operation: e.target.value })}
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm"
                        >
                            {actionTypes.email.map(e => (
                                <option key={e.id} value={e.id}>{e.label}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={node.data.to}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, to: e.target.value })}
                            placeholder="To"
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm placeholder-white/50"
                        />
                        <input
                            type="text"
                            value={node.data.subject}
                            onChange={(e) => updateNodeData(node.id, { ...node.data, subject: e.target.value })}
                            placeholder="Subject"
                            className="w-full bg-white/20 text-white rounded px-2 py-1 text-sm placeholder-white/50"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    // Render connection points
    const renderConnectionPoints = (node, config) => {
        const points = [];

        // Input points
        for (let i = 0; i < config.inputs; i++) {
            points.push(
                <div
                    key={`input-${i}`}
                    className="absolute w-3 h-3 bg-white rounded-full border-2 border-white/30 cursor-crosshair hover:scale-110 transition-transform"
                    style={{
                        left: -12,
                        top: (i + 1) * 20 - 10
                    }}
                    title="Input"
                />
            );
        }

        // Output points
        for (let i = 0; i < config.outputs; i++) {
            points.push(
                <div
                    key={`output-${i}`}
                    className="absolute w-3 h-3 bg-white rounded-full border-2 border-white/30 cursor-crosshair hover:scale-110 transition-transform"
                    style={{
                        right: -12,
                        top: (i + 1) * 20 - 10
                    }}
                    title="Output"
                />
            );
        }

        return points;
    };

    return (
        <div className="fixed inset-0 bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <input
                            type="text"
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            className="text-xl font-bold text-white bg-transparent border-none focus:outline-none w-64"
                            placeholder="Untitled Workflow"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                        onClick={clearWorkflow}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Clear"
                    >
                        <Trash2 className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                        onClick={saveWorkflow}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Save"
                    >
                        <Save className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                        onClick={() => {
                            // Trigger file input for loading workflow
                            document.getElementById('workflow-file-input').click();
                        }}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Load"
                    >
                        <Upload className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                        onClick={() => {
                            // Trigger file input for exporting workflow
                            document.getElementById('workflow-export-input').click();
                        }}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Export"
                    >
                        <Download className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-700 bg-gray-800">
                <button
                    onClick={zoomOut}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Zoom Out"
                >
                    <span className="text-gray-400">-</span>
                </button>
                <button
                    onClick={resetZoom}
                    className="px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-400"
                    title="Reset Zoom"
                >
                    {Math.round(scale * 100)}%
                </button>
                <button
                    onClick={zoomIn}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Zoom In"
                >
                    <span className="text-gray-400">+</span>
                </button>
                <div className="flex-1"></div>
                <button
                    onClick={executeWorkflow}
                    disabled={isExecuting || nodes.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isExecuting
                            ? 'bg-green-600 cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {isExecuting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-transparent animate-spin rounded-full"></div>
                            <span className="text-white">Executing...</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 text-white" />
                            <span className="text-white">Execute Workflow</span>
                        </>
                    )}
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative overflow-hidden bg-gray-950">
                <div
                    ref={canvasRef}
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 1px),
                            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `
                    }}
                    onClick={handleCanvasClick}
                >
                    {/* Render nodes */}
                    {nodes.map(node => renderNode(node))}

                    {/* Render connections */}
                    <svg className="absolute inset-0 pointer-events-none">
                        {connections.map(conn => {
                            const fromNode = nodes.find(n => n.id === conn.from);
                            const toNode = nodes.find(n => n.id === conn.to);
                            if (!fromNode || !toNode) return null;

                            const fromConfig = nodeTypes[fromNode.type];
                            const toConfig = nodeTypes[toNode.type];

                            const fromX = fromNode.x + 180; // Right side
                            const fromY = fromNode.y + (conn.fromOutput + 1) * 20 - 10;
                            const toX = toNode.x; // Left side
                            const toY = toNode.y + (conn.toInput + 1) * 20 - 10;

                            return (
                                <path
                                    key={conn.id}
                                    d={`M ${fromX} ${fromY} C ${toX} ${toY}`}
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Node type menu */}
            {showNodeMenu && (
                <div
                    className="fixed bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-2 z-50"
                    style={{
                        left: showNodeMenu.x + 200,
                        top: showNodeMenu.y
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(nodeTypes).map(([type, config]) => (
                            <button
                                key={type}
                                onClick={() => selectNodeType(type)}
                                className="flex flex-col items-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                <div className="text-white">{config.icon}</div>
                                <span className="text-white text-sm">{config.label}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowNodeMenu(null)}
                        className="absolute top-2 right-2 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            )}

            {/* Execution result */}
            {executionResult && (
                <div className="fixed bottom-4 right-4 max-w-md">
                    <div
                        className={`rounded-xl shadow-2xl p-4 border ${executionResult.success
                                ? 'bg-green-900 border-green-700'
                                : 'bg-red-900 border-red-700'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            {executionResult.success ? (
                                <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
                            ) : (
                                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                            )}
                            <div>
                                <p className="text-white font-medium mb-1">
                                    {executionResult.success ? 'Success' : 'Error'}
                                </p>
                                <p className="text-gray-300 text-sm">
                                    {executionResult.message}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setExecutionResult(null)}
                            className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>
            )}

            {/* Settings panel */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700">
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold text-white">Workflow Settings</h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-gray-300 text-sm mb-2 block">Default Execution Mode</label>
                                <select className="w-full bg-gray-700 text-white rounded-lg px-4 py-2">
                                    <option value="sequential">Sequential</option>
                                    <option value="parallel">Parallel</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm mb-2 block">Error Handling</label>
                                <select className="w-full bg-gray-700 text-white rounded-lg px-4 py-2">
                                    <option value="stop">Stop on Error</option>
                                    <option value="continue">Continue on Error</option>
                                    <option value="retry">Retry on Error</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm mb-2 block">Max Execution Time (seconds)</label>
                                <input
                                    type="number"
                                    defaultValue={300}
                                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden file inputs */}
            <input
                id="workflow-file-input"
                type="file"
                accept=".json"
                onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            try {
                                const workflow = JSON.parse(event.target.result);
                                loadWorkflow(workflow);
                            } catch (error) {
                                console.error('Failed to load workflow:', error);
                            }
                        };
                        reader.readAsText(file);
                    }
                }}
                className="hidden"
            />
            <input
                id="workflow-export-input"
                type="file"
                onChange={(e) => {
                    const workflow = {
                        id: `workflow_${Date.now()}`,
                        name: workflowName,
                        nodes,
                        connections,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${workflowName}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                }}
                className="hidden"
            />
        </div>
    );
};

export default WorkflowBuilder;
