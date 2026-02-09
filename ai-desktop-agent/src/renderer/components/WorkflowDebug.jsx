import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, StepForward, SkipForward, Bug, CheckCircle, XCircle, Clock, Zap, FileText, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Workflow Debug Component
 * Debug and test workflows with step-by-step execution
 */
const WorkflowDebug = ({ workflow, onExecute, onStep, onPause, onResume }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [executionLog, setExecutionLog] = useState([]);
    const [variables, setVariables] = useState({});
    const [selectedLog, setSelectedLog] = useState(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [speed, setSpeed] = useState(1);
    const logContainerRef = useRef(null);

    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [executionLog, autoScroll]);

    const handleStart = async () => {
        setIsRunning(true);
        setIsPaused(false);
        setCurrentStep(0);
        setExecutionLog([]);
        setVariables({});

        try {
            await onExecute(workflow);
            addLog('info', 'Workflow execution started');
        } catch (error) {
            addLog('error', `Execution failed: ${error.message}`);
            setIsRunning(false);
        }
    };

    const handlePause = () => {
        setIsPaused(true);
        onPause();
        addLog('warning', 'Workflow paused');
    };

    const handleResume = () => {
        setIsPaused(false);
        onResume();
        addLog('info', 'Workflow resumed');
    };

    const handleStop = () => {
        setIsRunning(false);
        setIsPaused(false);
        addLog('info', 'Workflow stopped');
    };

    const handleStepForward = () => {
        if (currentStep < workflow.nodes.length - 1) {
            setCurrentStep(prev => prev + 1);
            onStep(currentStep + 1);
            addLog('info', `Stepped to node ${currentStep + 1}`);
        }
    };

    const handleStepBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            onStep(currentStep - 1);
            addLog('info', `Stepped back to node ${currentStep - 1}`);
        }
    };

    const handleJumpToStep = (stepIndex) => {
        setCurrentStep(stepIndex);
        onStep(stepIndex);
        addLog('info', `Jumped to node ${stepIndex}`);
    };

    const addLog = (type, message) => {
        const logEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            message,
            timestamp: new Date().toISOString(),
            step: currentStep,
            variables: { ...variables }
        };
        setExecutionLog(prev => [...prev, logEntry]);
    };

    const updateVariable = (name, value) => {
        setVariables(prev => ({ ...prev, [name]: value }));
        addLog('info', `Variable ${name} updated to: ${JSON.stringify(value)}`);
    };

    const getLogIcon = (type) => {
        switch (type) {
            case 'info':
                return <CheckCircle className="w-4 h-4 text-blue-400" />;
            case 'warning':
                return <Clock className="w-4 h-4 text-yellow-400" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-red-400" />;
            case 'success':
                return <Zap className="w-4 h-4 text-green-400" />;
            default:
                return <FileText className="w-4 h-4 text-gray-400" />;
        }
    };

    const getLogColor = (type) => {
        switch (type) {
            case 'info':
                return 'bg-blue-900/30 border-blue-700';
            case 'warning':
                return 'bg-yellow-900/30 border-yellow-700';
            case 'error':
                return 'bg-red-900/30 border-red-700';
            case 'success':
                return 'bg-green-900/30 border-green-700';
            default:
                return 'bg-gray-800 border-gray-700';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    const getCurrentNode = () => {
        return workflow.nodes[currentStep];
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">Workflow Debugger</h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-lg">
                        <Bug className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm">Step {currentStep + 1} / {workflow.nodes.length}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Speed Control */}
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Speed:</span>
                        <select
                            value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                        >
                            <option value={0.25}>0.25x</option>
                            <option value={0.5}>0.5x</option>
                            <option value={1}>1x</option>
                            <option value={2}>2x</option>
                            <option value={4}>4x</option>
                        </select>
                    </div>

                    {/* Auto Scroll Toggle */}
                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`p-2 rounded-lg transition-colors ${autoScroll ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        title="Auto Scroll"
                    >
                        <span className="text-xs">Auto</span>
                    </button>
                </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-3 p-4 border-b border-gray-700 bg-gray-800">
                {!isRunning ? (
                    <button
                        onClick={handleStart}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                        <Play className="w-5 h-5" />
                        <span className="font-medium">Start</span>
                    </button>
                ) : (
                    <>
                        {isPaused ? (
                            <button
                                onClick={handleResume}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                <Play className="w-5 h-5" />
                                <span className="font-medium">Resume</span>
                            </button>
                        ) : (
                            <button
                                onClick={handlePause}
                                className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                            >
                                <Pause className="w-5 h-5" />
                                <span className="font-medium">Pause</span>
                            </button>
                        )}
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                            <span className="font-medium">Stop</span>
                        </button>
                    </>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleStepBack}
                        disabled={currentStep === 0}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Step Back"
                    >
                        <SkipForward className="w-5 h-5 rotate-180" />
                    </button>
                    <button
                        onClick={handleStepForward}
                        disabled={currentStep >= workflow.nodes.length - 1}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Step Forward"
                    >
                        <StepForward className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Current Node */}
                <div className="w-1/3 border-r border-gray-700 p-4 overflow-y-auto">
                    <h3 className="text-sm font-semibold mb-3 text-gray-400">Current Node</h3>
                    {getCurrentNode() ? (
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{getCurrentNode().type === 'trigger' ? '⚡' : getCurrentNode().type === 'action' ? '⚙️' : getCurrentNode().type === 'condition' ? '❓' : '⚙️'}</span>
                                <span className="font-medium">{getCurrentNode().label}</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Type:</span>
                                    <span className="font-mono">{getCurrentNode().type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">ID:</span>
                                    <span className="font-mono text-xs">{getCurrentNode().id}</span>
                                </div>
                                {getCurrentNode().config && Object.keys(getCurrentNode().config).length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-700">
                                        <span className="text-gray-400 text-xs">Configuration:</span>
                                        <div className="mt-2 space-y-1">
                                            {Object.entries(getCurrentNode().config).map(([key, value]) => (
                                                <div key={key} className="flex justify-between text-xs">
                                                    <span className="text-gray-500 capitalize">{key}:</span>
                                                    <span className="font-mono">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No node selected</p>
                        </div>
                    )}
                </div>

                {/* Execution Log */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-semibold p-4 pb-2 text-gray-400 border-b border-gray-700">Execution Log</h3>
                    <div
                        ref={logContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-2"
                    >
                        {executionLog.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No execution logs</p>
                                <p className="text-sm">Start the workflow to see logs</p>
                            </div>
                        ) : (
                            executionLog.map((log) => (
                                <div
                                    key={log.id}
                                    className={`p-3 rounded-lg border ${getLogColor(log.type)} ${selectedLog?.id === log.id ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <div className="flex items-start gap-2">
                                        {getLogIcon(log.type)}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</span>
                                                {log.step !== undefined && (
                                                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">Step {log.step + 1}</span>
                                                )}
                                            </div>
                                            <p className="text-sm">{log.message}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Variables */}
                <div className="w-1/3 border-l border-gray-700 p-4 overflow-y-auto">
                    <h3 className="text-sm font-semibold mb-3 text-gray-400">Variables</h3>
                    {Object.keys(variables).length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No variables</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(variables).map(([name, value]) => (
                                <div key={name} className="bg-gray-800 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-sm">{name}</span>
                                        <button
                                            onClick={() => {
                                                const newValue = prompt(`Update ${name}:`, JSON.stringify(value));
                                                if (newValue !== null) {
                                                    try {
                                                        updateVariable(name, JSON.parse(newValue));
                                                    } catch {
                                                        updateVariable(name, newValue);
                                                    }
                                                }
                                            }}
                                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                                            title="Edit variable"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-400 break-all">
                                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t border-gray-700 bg-gray-800">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Status:</span>
                        <span className={`text-sm font-medium ${isRunning ? (isPaused ? 'text-yellow-400' : 'text-green-400') : 'text-gray-400'
                            }`}>
                            {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Logs:</span>
                        <span className="text-sm">{executionLog.length}</span>
                    </div>
                </div>
                <button
                    onClick={() => setExecutionLog([])}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                    Clear Logs
                </button>
            </div>
        </div>
    );
};

export default WorkflowDebug;
