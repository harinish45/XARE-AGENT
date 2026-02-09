import React, { useState, useEffect, useRef } from 'react';
import { Search, Copy, Trash2, Pin, PinOff, Clock, FileText, Image as ImageIcon, Code, Type } from 'lucide-react';

/**
 * Clipboard History Component
 * Displays clipboard history with search, filtering, and management
 */
const ClipboardHistory = () => {
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [showPreview, setShowPreview] = useState(false);
    const [copiedItem, setCopiedItem] = useState(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        loadClipboardHistory();
        setupClipboardListener();

        return () => {
            cleanupClipboardListener();
        };
    }, []);

    useEffect(() => {
        filterHistory();
    }, [searchQuery, filterType, history]);

    const loadClipboardHistory = async () => {
        try {
            const result = await window.api.clipboard.getClipboardHistory();
            if (result.success) {
                setHistory(result.history || []);
            }
        } catch (error) {
            console.error('Failed to load clipboard history:', error);
        }
    };

    const setupClipboardListener = () => {
        // Listen for clipboard changes
        if (window.api.clipboard.onClipboardChange) {
            window.api.clipboard.onClipboardChange((item) => {
                setHistory(prev => [item, ...prev].slice(0, 100));
            });
        }
    };

    const cleanupClipboardListener = () => {
        // Cleanup clipboard listener
        if (window.api.clipboard.offClipboardChange) {
            window.api.clipboard.offClipboardChange();
        }
    };

    const filterHistory = () => {
        let filtered = [...history];

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(item => item.format === filterType);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.content.toLowerCase().includes(query)
            );
        }

        setFilteredHistory(filtered);
    };

    const handleCopy = async (item) => {
        try {
            await window.api.clipboard.setClipboard(item.content);
            setCopiedItem(item.id);
            setTimeout(() => setCopiedItem(null), 2000);
        } catch (error) {
            console.error('Failed to copy item:', error);
        }
    };

    const handleDelete = async (itemId) => {
        try {
            await window.api.clipboard.deleteClipboardItem(itemId);
            setHistory(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    const handlePin = async (itemId) => {
        try {
            await window.api.clipboard.pinItem(itemId);
            setHistory(prev =>
                prev.map(item =>
                    item.id === itemId ? { ...item, pinned: !item.pinned } : item
                )
            );
        } catch (error) {
            console.error('Failed to pin item:', error);
        }
    };

    const handleClearHistory = async () => {
        if (confirm('Are you sure you want to clear all clipboard history?')) {
            try {
                await window.api.clipboard.clearClipboardHistory();
                setHistory([]);
            } catch (error) {
                console.error('Failed to clear history:', error);
            }
        }
    };

    const handleSearchFocus = () => {
        searchInputRef.current?.focus();
    };

    const getFormatIcon = (format) => {
        switch (format) {
            case 'text':
                return <Type className="w-4 h-4" />;
            case 'html':
                return <Code className="w-4 h-4" />;
            case 'image':
                return <ImageIcon className="w-4 h-4" />;
            case 'file':
                return <FileText className="w-4 h-4" />;
            default:
                return <Type className="w-4 h-4" />;
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}m ago`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const truncateContent = (content, maxLength = 100) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Clipboard History</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSearchFocus}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleClearHistory}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
                        title="Clear History"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search clipboard history..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                    {['all', 'text', 'html', 'image', 'file'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1 rounded-lg text-sm capitalize transition-colors ${filterType === type
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clipboard Items List */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FileText className="w-16 h-16 mb-4" />
                        <p className="text-lg">No clipboard history</p>
                        <p className="text-sm">Copy something to get started</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredHistory.map((item) => (
                            <div
                                key={item.id}
                                className={`group relative p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-all cursor-pointer ${selectedItem?.id === item.id ? 'border-blue-500 ring-2 ring-blue-500' : ''
                                    } ${item.pinned ? 'border-yellow-500' : ''}`}
                                onClick={() => setSelectedItem(item)}
                            >
                                {/* Item Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {getFormatIcon(item.format)}
                                        <span className="text-xs text-gray-400 capitalize">{item.format}</span>
                                        {item.pinned && (
                                            <Pin className="w-4 h-4 text-yellow-500" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        {formatTimestamp(item.timestamp)}
                                    </div>
                                </div>

                                {/* Item Content */}
                                <div className="text-sm text-gray-300 mb-2">
                                    {item.format === 'image' ? (
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            <span>Image ({item.size || 'unknown size'})</span>
                                        </div>
                                    ) : (
                                        <code className="block bg-gray-900 p-2 rounded text-xs overflow-hidden">
                                            {truncateContent(item.content)}
                                        </code>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(item);
                                            }}
                                            className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${copiedItem === item.id ? 'text-green-400' : 'text-gray-400'
                                                }`}
                                            title="Copy to clipboard"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePin(item.id);
                                            }}
                                            className="p-1.5 rounded hover:bg-gray-700 transition-colors text-gray-400"
                                            title={item.pinned ? 'Unpin' : 'Pin'}
                                        >
                                            {item.pinned ? (
                                                <PinOff className="w-4 h-4" />
                                            ) : (
                                                <Pin className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.id);
                                        }}
                                        className="p-1.5 rounded hover:bg-red-900/50 transition-colors text-gray-400 hover:text-red-400"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && selectedItem && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowPreview(false)}
                >
                    <div
                        className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Preview Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold">Clipboard Item Preview</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Preview Content */}
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {selectedItem.format === 'image' ? (
                                <img
                                    src={selectedItem.content}
                                    alt="Clipboard image"
                                    className="max-w-full h-auto"
                                />
                            ) : (
                                <pre className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900 p-4 rounded-lg">
                                    {selectedItem.content}
                                </pre>
                            )}
                        </div>

                        {/* Preview Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-gray-700">
                            <div className="text-sm text-gray-400">
                                <span className="capitalize">{selectedItem.format}</span>
                                {' • '}
                                {formatTimestamp(selectedItem.timestamp)}
                            </div>
                            <button
                                onClick={() => {
                                    handleCopy(selectedItem);
                                    setShowPreview(false);
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                Copy to Clipboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClipboardHistory;
