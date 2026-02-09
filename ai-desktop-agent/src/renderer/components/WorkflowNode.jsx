import React, { useState } from 'react';
import { Settings, Play, Pause, Trash2, Copy, Edit2, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Workflow Node Component
 * Individual node in workflow with configuration options
 */
const WorkflowNode = ({ node, onUpdate, onDelete, onDuplicate, isSelected }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [config, setConfig] = useState(node.config || {});

    const nodeTypes = {
        trigger: {
            color: 'bg-purple-500',
            borderColor: 'border-purple-400',
            icon: '⚡',
            label: 'Trigger'
        },
        action: {
            color: 'bg-blue-500',
            borderColor: 'border-blue-400',
            icon: '⚙️',
            label: 'Action'
        },
        condition: {
            color: 'bg-yellow-500',
            borderColor: 'border-yellow-400',
            icon: '❓',
            label: 'Condition'
        },
        loop: {
            color: 'bg-green-500',
            borderColor: 'border-green-400',
            icon: '🔄',
            label: 'Loop'
        },
        delay: {
            color: 'bg-orange-500',
            borderColor: 'border-orange-400',
            icon: '⏱️',
            label: 'Delay'
        },
        input: {
            color: 'bg-cyan-500',
            borderColor: 'border-cyan-400',
            icon: '📥',
            label: 'Input'
        },
        output: {
            color: 'bg-pink-500',
            borderColor: 'border-pink-400',
            icon: '📤',
            label: 'Output'
        }
    };

    const nodeType = nodeTypes[node.type] || nodeTypes.action;

    const handleConfigChange = (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        onUpdate(node.id, newConfig);
    };

    const handleSave = () => {
        setIsEditing(false);
        onUpdate(node.id, config);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setConfig(node.config || {});
    };

    const renderConfigForm = () => {
        switch (node.type) {
            case 'trigger':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Trigger Type</label>
                            <select
                                value={config.triggerType || 'time'}
                                onChange={(e) => handleConfigChange('triggerType', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            >
                                <option value="time">Time-based</option>
                                <option value="webhook">Webhook</option>
                                <option value="hotkey">Hotkey</option>
                                <option value="file">File change</option>
                                <option value="clipboard">Clipboard change</option>
                            </select>
                        </div>
                        {config.triggerType === 'time' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Schedule (Cron)</label>
                                <input
                                    type="text"
                                    value={config.schedule || '0 * * * *'}
                                    onChange={(e) => handleConfigChange('schedule', e.target.value)}
                                    placeholder="0 * * * *"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                            </div>
                        )}
                        {config.triggerType === 'webhook' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Webhook URL</label>
                                <input
                                    type="text"
                                    value={config.webhookUrl || ''}
                                    onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                            </div>
                        )}
                    </div>
                );

            case 'action':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Action Type</label>
                            <select
                                value={config.actionType || 'click'}
                                onChange={(e) => handleConfigChange('actionType', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            >
                                <option value="click">Click element</option>
                                <option value="type">Type text</option>
                                <option value="scroll">Scroll page</option>
                                <option value="wait">Wait</option>
                                <option value="screenshot">Take screenshot</option>
                                <option value="api">Call API</option>
                                <option value="script">Run script</option>
                            </select>
                        </div>
                        {config.actionType === 'click' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Selector</label>
                                <input
                                    type="text"
                                    value={config.selector || ''}
                                    onChange={(e) => handleConfigChange('selector', e.target.value)}
                                    placeholder="#id, .class, [attr=value]"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                            </div>
                        )}
                        {config.actionType === 'type' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Text to type</label>
                                <textarea
                                    value={config.text || ''}
                                    onChange={(e) => handleConfigChange('text', e.target.value)}
                                    placeholder="Enter text..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                            </div>
                        )}
                        {config.actionType === 'wait' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Duration (ms)</label>
                                <input
                                    type="number"
                                    value={config.duration || 1000}
                                    onChange={(e) => handleConfigChange('duration', parseInt(e.target.value))}
                                    placeholder="1000"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                            </div>
                        )}
                    </div>
                );

            case 'condition':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Condition Type</label>
                            <select
                                value={config.conditionType || 'equals'}
                                onChange={(e) => handleConfigChange('conditionType', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            >
                                <option value="equals">Equals</option>
                                <option value="not-equals">Not equals</option>
                                <option value="contains">Contains</option>
                                <option value="not-contains">Not contains</option>
                                <option value="greater">Greater than</option>
                                <option value="less">Less than</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Variable</label>
                            <input
                                type="text"
                                value={config.variable || ''}
                                onChange={(e) => handleConfigChange('variable', e.target.value)}
                                placeholder="{{variable}}"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Value</label>
                            <input
                                type="text"
                                value={config.value || ''}
                                onChange={(e) => handleConfigChange('value', e.target.value)}
                                placeholder="Expected value"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                    </div>
                );

            case 'loop':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Loop Type</label>
                            <select
                                value={config.loopType || 'fixed'}
                                onChange={(e) => handleConfigChange('loopType', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            >
                                <option value="fixed">Fixed iterations</option>
                                <option value="while">While condition</option>
                                <option value="foreach">For each item</option>
                            </select>
                        </div>
                        {config.loopType === 'fixed' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Iterations</label>
                                <input
                                    type="number"
                                    value={config.iterations || 1}
                                    onChange={(e) => handleConfigChange('iterations', parseInt(e.target.value))}
                                    placeholder="1"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                            </div>
                        )}
                        {config.loopType === 'while' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Condition</label>
                                <input
                                    type="text"
                                    value={config.condition || ''}
                                    onChange={(e) => handleConfigChange('condition', e.target.value)}
                                    placeholder="{{variable}} == value"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                            </div>
                        )}
                    </div>
                );

            case 'delay':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Duration (ms)</label>
                            <input
                                type="number"
                                value={config.duration || 1000}
                                onChange={(e) => handleConfigChange('duration', parseInt(e.target.value))}
                                placeholder="1000"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                    </div>
                );

            case 'input':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Variable Name</label>
                            <input
                                type="text"
                                value={config.variableName || ''}
                                onChange={(e) => handleConfigChange('variableName', e.target.value)}
                                placeholder="inputVariable"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Default Value</label>
                            <input
                                type="text"
                                value={config.defaultValue || ''}
                                onChange={(e) => handleConfigChange('defaultValue', e.target.value)}
                                placeholder="Default value"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                    </div>
                );

            case 'output':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Output Variable</label>
                            <input
                                type="text"
                                value={config.outputVariable || ''}
                                onChange={(e) => handleConfigChange('outputVariable', e.target.value)}
                                placeholder="outputVariable"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                    </div>
                );

            default:
                return <div className="text-sm text-gray-400">No configuration available</div>;
        }
    };

    return (
        <div
            className={`relative rounded-lg shadow-lg border-2 transition-all ${isSelected ? `${nodeType.borderColor} ring-2 ring-blue-500` : 'border-gray-600'
                }`}
        >
            {/* Node Header */}
            <div
                className={`flex items-center justify-between p-3 cursor-pointer ${nodeType.color}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">{nodeType.icon}</span>
                    <span className="font-medium">{node.label}</span>
                    <span className="text-xs opacity-75">#{node.id.split('_')[1]?.substring(0, 6)}</span>
                </div>
                <div className="flex items-center gap-1">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                </div>
            </div>

            {/* Node Body */}
            {isExpanded && (
                <div className="p-4 bg-gray-800">
                    {isEditing ? (
                        <div className="space-y-4">
                            {renderConfigForm()}
                            <div className="flex gap-2 pt-2 border-t border-gray-700">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Config Summary */}
                            <div className="text-sm text-gray-300">
                                {Object.entries(config).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                        <span className="text-gray-400 capitalize">{key}:</span>
                                        <span className="font-mono">{String(value)}</span>
                                    </div>
                                ))}
                                {Object.keys(config).length === 0 && (
                                    <div className="text-gray-500 italic">No configuration</div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2 border-t border-gray-700">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    <span className="text-sm">Edit</span>
                                </button>
                                <button
                                    onClick={() => onDuplicate(node)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                    <span className="text-sm">Duplicate</span>
                                </button>
                                <button
                                    onClick={() => onDelete(node.id)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-sm">Delete</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Status Indicator */}
            <div className="absolute top-2 right-2">
                <div
                    className={`w-2 h-2 rounded-full ${node.status === 'running' ? 'bg-green-500' :
                            node.status === 'error' ? 'bg-red-500' :
                                node.status === 'completed' ? 'bg-blue-500' :
                                    'bg-gray-500'
                        }`}
                />
            </div>
        </div>
    );
};

export default WorkflowNode;
