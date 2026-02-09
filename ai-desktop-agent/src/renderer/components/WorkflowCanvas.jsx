import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, Play, Save, Download, Upload, Settings, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

/**
 * Workflow Canvas Component
 * Visual canvas for building workflows with drag-and-drop nodes
 */
const WorkflowCanvas = ({ workflow, onWorkflowChange, onSave, onRun }) => {
    const [nodes, setNodes] = useState(workflow?.nodes || []);
    const [connections, setConnections] = useState(workflow?.connections || []);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNode, setDraggedNode] = useState(null);
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStart, setConnectionStart] = useState(null);
    const canvasRef = useRef(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Node types
    const nodeTypes = [
        { type: 'trigger', label: 'Trigger', color: 'bg-purple-500', icon: '⚡' },
        { type: 'action', label: 'Action', color: 'bg-blue-500', icon: '⚙️' },
        { type: 'condition', label: 'Condition', color: 'bg-yellow-500', icon: '❓' },
        { type: 'loop', label: 'Loop', color: 'bg-green-500', icon: '🔄' },
        { type: 'delay', label: 'Delay', color: 'bg-orange-500', icon: '⏱️' },
        { type: 'input', label: 'Input', color: 'bg-cyan-500', icon: '📥' },
        { type: 'output', label: 'Output', color: 'bg-pink-500', icon: '📤' }
    ];

    // Handle canvas click
    const handleCanvasClick = useCallback((e) => {
        if (e.target === canvasRef.current) {
            setSelectedNode(null);
            setIsConnecting(false);
            setConnectionStart(null);
        }
    }, []);

    // Handle node drag start
    const handleNodeDragStart = useCallback((e, node) => {
        e.stopPropagation();
        setIsDragging(true);
        setDraggedNode(node);
        const rect = e.target.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }, []);

    // Handle node drag
    const handleNodeDrag = useCallback((e) => {
        if (!isDragging || !draggedNode) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - canvasRect.left - dragOffset.current.x - pan.x) / scale;
        const y = (e.clientY - canvasRect.top - dragOffset.current.y - pan.y) / scale;

        setNodes(prev =>
            prev.map(node =>
                node.id === draggedNode.id
                    ? { ...node, x, y }
                    : node
            )
        );
    }, [isDragging, draggedNode, pan, scale]);

    // Handle node drag end
    const handleNodeDragEnd = useCallback(() => {
        setIsDragging(false);
        setDraggedNode(null);
        onWorkflowChange({ nodes, connections });
    }, [nodes, connections, onWorkflowChange]);

    // Handle connection start
    const handleConnectionStart = useCallback((e, nodeId, portId) => {
        e.stopPropagation();
        setIsConnecting(true);
        setConnectionStart({ nodeId, portId });
    }, []);

    // Handle connection move
    const handleConnectionMove = useCallback((e) => {
        if (!isConnecting) return;
        // Connection line will be drawn in render
    }, [isConnecting]);

    // Handle connection end
    const handleConnectionEnd = useCallback((e, targetNodeId, targetPortId) => {
        e.stopPropagation();
        if (!isConnecting || !connectionStart) return;

        // Check if connection already exists
        const exists = connections.some(
            conn =>
                (conn.from.nodeId === connectionStart.nodeId && conn.to.nodeId === targetNodeId) ||
                (conn.from.nodeId === targetNodeId && conn.to.nodeId === connectionStart.nodeId)
        );

        if (!exists && connectionStart.nodeId !== targetNodeId) {
            const newConnection = {
                id: `conn_${Date.now()}`,
                from: { nodeId: connectionStart.nodeId, portId: connectionStart.portId },
                to: { nodeId: targetNodeId, portId: targetPortId }
            };
            setConnections(prev => [...prev, newConnection]);
        }

        setIsConnecting(false);
        setConnectionStart(null);
        onWorkflowChange({ nodes, connections: [...connections, newConnection] });
    }, [isConnecting, connectionStart, connections, nodes, onWorkflowChange]);

    // Add new node
    const addNode = useCallback((type) => {
        const newNode = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            x: 100 + Math.random() * 200,
            y: 100 + Math.random() * 200,
            label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
            config: {}
        };
        setNodes(prev => [...prev, newNode]);
        onWorkflowChange({ nodes: [...nodes, newNode], connections });
    }, [nodes, connections, onWorkflowChange]);

    // Delete node
    const deleteNode = useCallback((nodeId) => {
        setNodes(prev => prev.filter(node => node.id !== nodeId));
        setConnections(prev => prev.filter(
            conn => conn.from.nodeId !== nodeId && conn.to.nodeId !== nodeId
        ));
        onWorkflowChange({
            nodes: nodes.filter(n => n.id !== nodeId),
            connections: connections.filter(c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId)
        });
    }, [nodes, connections, onWorkflowChange]);

    // Delete connection
    const deleteConnection = useCallback((connectionId) => {
        setConnections(prev => prev.filter(conn => conn.id !== connectionId));
        onWorkflowChange({
            nodes,
            connections: connections.filter(c => c.id !== connectionId)
        });
    }, [nodes, connections, onWorkflowChange]);

    // Handle zoom
    const handleZoom = useCallback((delta) => {
        setScale(prev => Math.max(0.25, Math.min(2, prev + delta)));
    }, []);

    // Handle pan
    const handlePan = useCallback((e) => {
        if (e.buttons === 1) { // Left mouse button
            setPan(prev => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
            }));
        }
    }, []);

    // Reset view
    const resetView = useCallback(() => {
        setScale(1);
        setPan({ x: 0, y: 0 });
    }, []);

    // Calculate connection path
    const getConnectionPath = (from, to) => {
        const fromNode = nodes.find(n => n.id === from.nodeId);
        const toNode = nodes.find(n => n.id === to.nodeId);

        if (!fromNode || !toNode) return '';

        const x1 = fromNode.x + 150; // Node width
        const y1 = fromNode.y + 40; // Port position
        const x2 = toNode.x;
        const y2 = toNode.y + 40;

        // Bezier curve
        const cp1x = x1 + (x2 - x1) / 2;
        const cp1y = y1;
        const cp2x = x1 + (x2 - x1) / 2;
        const cp2y = y2;

        return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Workflow Builder</h2>
                    <div className="flex gap-1">
                        <button
                            onClick={() => handleZoom(-0.1)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="px-2 text-sm text-gray-400">{Math.round(scale * 100)}%</span>
                        <button
                            onClick={() => handleZoom(0.1)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={resetView}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Reset View"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onSave}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        <span className="text-sm">Save</span>
                    </button>
                    <button
                        onClick={onRun}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        <span className="text-sm">Run</span>
                    </button>
                </div>
            </div>

            {/* Node Palette */}
            <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800 overflow-x-auto">
                {nodeTypes.map((nodeType) => (
                    <button
                        key={nodeType.type}
                        onClick={() => addNode(nodeType.type)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:opacity-80 ${nodeType.color}`}
                    >
                        <span className="text-lg">{nodeType.icon}</span>
                        <span className="text-sm font-medium">{nodeType.label}</span>
                    </button>
                ))}
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="flex-1 relative overflow-hidden cursor-move"
                onClick={handleCanvasClick}
                onMouseMove={handleNodeDrag}
                onMouseUp={handleNodeDragEnd}
                onMouseLeave={handleNodeDragEnd}
            >
                <div
                    className="absolute"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                        width: '3000px',
                        height: '3000px'
                    }}
                >
                    {/* Connections */}
                    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                        {connections.map((conn) => {
                            const path = getConnectionPath(conn.from, conn.to);
                            return (
                                <g key={conn.id}>
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="2"
                                        className="hover:stroke-blue-400 cursor-pointer"
                                        onClick={() => deleteConnection(conn.id)}
                                    />
                                    <circle
                                        cx={nodes.find(n => n.id === conn.from.nodeId)?.x + 150}
                                        cy={nodes.find(n => n.id === conn.from.nodeId)?.y + 40}
                                        r="4"
                                        fill="#3b82f6"
                                    />
                                    <circle
                                        cx={nodes.find(n => n.id === conn.to.nodeId)?.x}
                                        cy={nodes.find(n => n.id === conn.to.nodeId)?.y + 40}
                                        r="4"
                                        fill="#3b82f6"
                                    />
                                </g>
                            );
                        })}

                        {/* Active connection line */}
                        {isConnecting && connectionStart && (
                            <path
                                d={`M ${connectionStart.x + 150} ${connectionStart.y + 40} L 0 0`}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                        )}
                    </svg>

                    {/* Nodes */}
                    {nodes.map((node) => {
                        const nodeType = nodeTypes.find(nt => nt.type === node.type);
                        return (
                            <div
                                key={node.id}
                                className={`absolute cursor-move ${nodeType?.color || 'bg-gray-600'} rounded-lg shadow-lg ${selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                style={{
                                    left: node.x,
                                    top: node.y,
                                    width: '150px',
                                    minHeight: '80px'
                                }}
                                onMouseDown={(e) => handleNodeDragStart(e, node)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedNode(node);
                                }}
                            >
                                {/* Node Header */}
                                <div className="flex items-center justify-between p-2 border-b border-black/20">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{nodeType?.icon || '⚙️'}</span>
                                        <span className="text-sm font-medium truncate">{node.label}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNode(node.id);
                                        }}
                                        className="p-1 hover:bg-black/20 rounded transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Node Body */}
                                <div className="p-2 text-xs text-black/70">
                                    {node.type === 'trigger' && 'Trigger event'}
                                    {node.type === 'action' && 'Execute action'}
                                    {node.type === 'condition' && 'If condition'}
                                    {node.type === 'loop' && 'Repeat items'}
                                    {node.type === 'delay' && 'Wait time'}
                                    {node.type === 'input' && 'Receive input'}
                                    {node.type === 'output' && 'Send output'}
                                </div>

                                {/* Output Port */}
                                <div
                                    className="absolute right-0 top-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-crosshair transform translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform"
                                    onMouseDown={(e) => handleConnectionStart(e, node.id, 'out')}
                                />

                                {/* Input Port */}
                                <div
                                    className="absolute left-0 top-1/2 w-3 h-3 bg-green-500 rounded-full cursor-crosshair transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform"
                                    onMouseUp={(e) => handleConnectionEnd(e, node.id, 'in')}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WorkflowCanvas;
