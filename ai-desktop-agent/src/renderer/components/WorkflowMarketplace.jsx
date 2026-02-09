import React, { useState, useEffect } from 'react';
import { Search, Download, Star, Filter, TrendingUp, Clock, User, Tag, ExternalLink, Heart, Share2 } from 'lucide-react';

/**
 * Workflow Marketplace Component
 * Browse, search, and import community workflows
 */
const WorkflowMarketplace = ({ onImport, onRate }) => {
    const [workflows, setWorkflows] = useState([]);
    const [filteredWorkflows, setFilteredWorkflows] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSort, setSelectedSort] = useState('popular');
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [userRatings, setUserRatings] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const categories = [
        { id: 'all', label: 'All Workflows', icon: '📦' },
        { id: 'productivity', label: 'Productivity', icon: '⚡' },
        { id: 'automation', label: 'Automation', icon: '🤖' },
        { id: 'communication', label: 'Communication', icon: '💬' },
        { id: 'data', label: 'Data Processing', icon: '📊' },
        { id: 'development', label: 'Development', icon: '💻' },
        { id: 'media', label: 'Media', icon: '🎬' },
        { id: 'security', label: 'Security', icon: '🔒' }
    ];

    const sortOptions = [
        { id: 'popular', label: 'Most Popular', icon: '🔥' },
        { id: 'newest', label: 'Newest', icon: '🆕' },
        { id: 'rating', label: 'Highest Rated', icon: '⭐' },
        { id: 'downloads', label: 'Most Downloaded', icon: '📥' }
    ];

    useEffect(() => {
        loadWorkflows();
        loadUserRatings();
    }, []);

    useEffect(() => {
        filterAndSortWorkflows();
    }, [searchQuery, selectedCategory, selectedSort, workflows]);

    const loadWorkflows = async () => {
        setIsLoading(true);
        try {
            // Simulate loading workflows from marketplace
            const mockWorkflows = [
                {
                    id: 'wf_daily_standup',
                    name: 'Daily Standup Report',
                    description: 'Automatically generate daily standup reports from your tasks and calendar',
                    category: 'productivity',
                    author: 'AI Agent Team',
                    version: '1.2.0',
                    downloads: 12543,
                    rating: 4.8,
                    reviews: 234,
                    tags: ['standup', 'report', 'productivity', 'daily'],
                    createdAt: '2024-01-15T10:00:00Z',
                    updatedAt: '2024-01-20T15:30:00Z',
                    featured: true,
                    thumbnail: '📊'
                },
                {
                    id: 'wf_meeting_notes',
                    name: 'Meeting Notes Organizer',
                    description: 'Automatically organize and summarize meeting notes with AI',
                    category: 'productivity',
                    author: 'Community',
                    version: '2.0.1',
                    downloads: 8932,
                    rating: 4.5,
                    reviews: 156,
                    tags: ['meeting', 'notes', 'summarization', 'ai'],
                    createdAt: '2024-01-10T08:00:00Z',
                    updatedAt: '2024-01-18T12:00:00Z',
                    featured: false,
                    thumbnail: '📝'
                },
                {
                    id: 'wf_invoice_processing',
                    name: 'Invoice Processing Automation',
                    description: 'Extract data from invoices and automatically process payments',
                    category: 'automation',
                    author: 'FinanceBot',
                    version: '1.5.0',
                    downloads: 5678,
                    rating: 4.2,
                    reviews: 89,
                    tags: ['invoice', 'finance', 'automation', 'extraction'],
                    createdAt: '2024-01-05T14:00:00Z',
                    updatedAt: '2024-01-12T09:00:00Z',
                    featured: true,
                    thumbnail: '💰'
                },
                {
                    id: 'wf_social_media',
                    name: 'Social Media Scheduler',
                    description: 'Schedule and post content across multiple social media platforms',
                    category: 'communication',
                    author: 'SocialMaster',
                    version: '3.1.0',
                    downloads: 23456,
                    rating: 4.9,
                    reviews: 567,
                    tags: ['social', 'scheduler', 'marketing', 'multi-platform'],
                    createdAt: '2024-01-20T16:00:00Z',
                    updatedAt: '2024-01-25T11:00:00Z',
                    featured: true,
                    thumbnail: '📱'
                },
                {
                    id: 'wf_data_backup',
                    name: 'Automated Data Backup',
                    description: 'Backup important files and folders to cloud storage automatically',
                    category: 'data',
                    author: 'BackupPro',
                    version: '2.2.0',
                    downloads: 7823,
                    rating: 4.6,
                    reviews: 198,
                    tags: ['backup', 'cloud', 'automation', 'storage'],
                    createdAt: '2024-01-08T11:00:00Z',
                    updatedAt: '2024-01-15T14:00:00Z',
                    featured: false,
                    thumbnail: '☁️'
                },
                {
                    id: 'wf_code_review',
                    name: 'Automated Code Review',
                    description: 'Review code changes and generate pull request summaries',
                    category: 'development',
                    author: 'DevHelper',
                    version: '1.8.0',
                    downloads: 4567,
                    rating: 4.3,
                    reviews: 123,
                    tags: ['code', 'review', 'git', 'pull-request'],
                    createdAt: '2024-01-12T09:00:00Z',
                    updatedAt: '2024-01-16T10:00:00Z',
                    featured: false,
                    thumbnail: '💻'
                },
                {
                    id: 'wf_video_editing',
                    name: 'Video Editing Assistant',
                    description: 'Automate video editing tasks with AI-powered tools',
                    category: 'media',
                    author: 'VideoAI',
                    version: '2.5.0',
                    downloads: 6789,
                    rating: 4.7,
                    reviews: 145,
                    tags: ['video', 'editing', 'ai', 'automation'],
                    createdAt: '2024-01-18T13:00:00Z',
                    updatedAt: '2024-01-22T08:00:00Z',
                    featured: false,
                    thumbnail: '🎬'
                },
                {
                    id: 'wf_security_scan',
                    name: 'Security Scanner',
                    description: 'Automatically scan files and folders for security threats',
                    category: 'security',
                    author: 'SecureGuard',
                    version: '1.3.0',
                    downloads: 3456,
                    rating: 4.4,
                    reviews: 87,
                    tags: ['security', 'scan', 'antivirus', 'protection'],
                    createdAt: '2024-01-14T10:00:00Z',
                    updatedAt: '2024-01-19T12:00:00Z',
                    featured: false,
                    thumbnail: '🔒'
                }
            ];

            setWorkflows(mockWorkflows);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load workflows:', error);
            setIsLoading(false);
        }
    };

    const loadUserRatings = () => {
        // Load user's previous ratings
        const savedRatings = localStorage.getItem('workflowRatings');
        if (savedRatings) {
            setUserRatings(JSON.parse(savedRatings));
        }
    };

    const filterAndSortWorkflows = () => {
        let filtered = [...workflows];

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(wf => wf.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(wf =>
                wf.name.toLowerCase().includes(query) ||
                wf.description.toLowerCase().includes(query) ||
                wf.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Sort workflows
        switch (selectedSort) {
            case 'popular':
                filtered.sort((a, b) => b.downloads - a.downloads);
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'downloads':
                filtered.sort((a, b) => b.downloads - a.downloads);
                break;
        }

        setFilteredWorkflows(filtered);
    };

    const handleImport = async (workflow) => {
        try {
            await onImport(workflow);
            // Increment download count
            const updatedWorkflows = workflows.map(wf =>
                wf.id === workflow.id ? { ...wf, downloads: wf.downloads + 1 } : wf
            );
            setWorkflows(updatedWorkflows);
        } catch (error) {
            console.error('Failed to import workflow:', error);
        }
    };

    const handleRate = (workflowId, rating) => {
        const newRatings = { ...userRatings, [workflowId]: rating };
        setUserRatings(newRatings);
        localStorage.setItem('workflowRatings', JSON.stringify(newRatings));
        onRate(workflowId, rating);
    };

    const handleFavorite = (workflowId) => {
        const favorites = JSON.parse(localStorage.getItem('workflowFavorites') || '[]');
        if (!favorites.includes(workflowId)) {
            favorites.push(workflowId);
            localStorage.setItem('workflowFavorites', JSON.stringify(favorites));
        }
    };

    const isFavorite = (workflowId) => {
        const favorites = JSON.parse(localStorage.getItem('workflowFavorites') || '[]');
        return favorites.includes(workflowId);
    };

    const getUserRating = (workflowId) => {
        return userRatings[workflowId] || 0;
    };

    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return `${Math.floor(days / 30)} months ago`;
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <div className="flex items-center">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                {hasHalfStar && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gray-600" />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                <h2 className="text-lg font-semibold">Workflow Marketplace</h2>
                <button
                    onClick={() => {/* TODO: Publish workflow */ }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Publish Workflow</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex gap-4 mb-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search workflows..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="pl-10 pr-8 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white appearance-none cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={selectedSort}
                            onChange={(e) => setSelectedSort(e.target.value)}
                            className="pl-10 pr-8 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white appearance-none cursor-pointer"
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.icon} {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === cat.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Workflow Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading workflows...</p>
                        </div>
                    </div>
                ) : filteredWorkflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Search className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg">No workflows found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredWorkflows.map((workflow) => (
                            <div
                                key={workflow.id}
                                className={`bg-gray-800 rounded-lg border-2 transition-all hover:border-blue-500 cursor-pointer ${workflow.featured ? 'border-yellow-500' : 'border-gray-700'
                                    }`}
                                onClick={() => setSelectedWorkflow(workflow)}
                            >
                                {/* Featured Badge */}
                                {workflow.featured && (
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-xs font-bold rounded">
                                        ⭐ Featured
                                    </div>
                                )}

                                {/* Thumbnail */}
                                <div className="flex items-center justify-center h-32 bg-gray-900 rounded-t-lg mb-3">
                                    <span className="text-5xl">{workflow.thumbnail}</span>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-lg">{workflow.name}</h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFavorite(workflow.id);
                                            }}
                                            className={`p-1.5 rounded transition-colors ${isFavorite(workflow.id)
                                                    ? 'text-yellow-400 hover:text-yellow-300'
                                                    : 'text-gray-400 hover:text-gray-300'
                                                }`}
                                        >
                                            <Heart className={`w-5 h-5 ${isFavorite(workflow.id) ? 'fill-current' : ''}`} />
                                        </button>
                                    </div>

                                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                        {workflow.description}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {workflow.tags.slice(0, 4).map(tag => (
                                            <span
                                                key={tag}
                                                className="px-2 py-1 bg-gray-700 text-xs rounded-full text-gray-300"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                        {workflow.tags.length > 4 && (
                                            <span className="text-xs text-gray-500">
                                                +{workflow.tags.length - 4} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                <span>{workflow.author}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatDate(workflow.updatedAt)}</span>
                                            </div>
                                        </div>
                                        <span className="bg-gray-700 px-2 py-1 rounded">
                                            v{workflow.version}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <Download className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm">{formatNumber(workflow.downloads)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {renderStars(workflow.rating)}
                                                <span className="text-sm ml-1">{workflow.rating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{workflow.reviews} reviews</span>
                                            <ExternalLink className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>

                                    {/* User Rating */}
                                    {getUserRating(workflow.id) > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Your rating:</span>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRate(workflow.id, star);
                                                            }}
                                                            className={`transition-colors ${star <= getUserRating(workflow.id)
                                                                    ? 'text-yellow-400 hover:text-yellow-300'
                                                                    : 'text-gray-600 hover:text-gray-500'
                                                                }`}
                                                        >
                                                            <Star className={`w-4 h-4 ${star <= getUserRating(workflow.id) ? 'fill-current' : ''}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Import Button */}
                                <div className="p-4 border-t border-gray-700">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleImport(workflow);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="font-medium">Import Workflow</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Workflow Detail Modal */}
            {selectedWorkflow && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setSelectedWorkflow(null)}
                >
                    <div
                        className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">{selectedWorkflow.thumbnail}</span>
                                <div>
                                    <h3 className="text-xl font-semibold">{selectedWorkflow.name}</h3>
                                    <p className="text-sm text-gray-400">by {selectedWorkflow.author}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedWorkflow(null)}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <p className="text-gray-300 mb-6">{selectedWorkflow.description}</p>

                            {/* Tags */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold mb-3 text-gray-400">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedWorkflow.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1.5 bg-gray-700 rounded-full text-sm"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-900 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Download className="w-5 h-5 text-blue-400" />
                                        <span className="text-2xl font-bold">{formatNumber(selectedWorkflow.downloads)}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">Downloads</p>
                                </div>
                                <div className="bg-gray-900 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        {renderStars(selectedWorkflow.rating)}
                                        <span className="text-2xl font-bold">{selectedWorkflow.rating.toFixed(1)}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">Rating</p>
                                </div>
                                <div className="bg-gray-900 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-5 h-5 text-green-400" />
                                        <span className="text-2xl font-bold">{selectedWorkflow.reviews}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">Reviews</p>
                                </div>
                                <div className="bg-gray-900 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag className="w-5 h-5 text-purple-400" />
                                        <span className="text-2xl font-bold">{selectedWorkflow.tags.length}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">Tags</p>
                                </div>
                            </div>

                            {/* Version Info */}
                            <div className="bg-gray-900 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-400">Version</span>
                                    <span className="font-mono text-lg">{selectedWorkflow.version}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Updated</span>
                                    <span className="text-sm">{formatDate(selectedWorkflow.updatedAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-gray-700">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        handleFavorite(selectedWorkflow.id);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isFavorite(selectedWorkflow.id)
                                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                >
                                    <Heart className={`w-4 h-4 ${isFavorite(selectedWorkflow.id) ? 'fill-current' : ''}`} />
                                    <span>Favorite</span>
                                </button>
                                <button
                                    onClick={() => {/* TODO: Share workflow */ }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span>Share</span>
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    handleImport(selectedWorkflow);
                                    setSelectedWorkflow(null);
                                }}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span className="font-medium">Import Workflow</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowMarketplace;
