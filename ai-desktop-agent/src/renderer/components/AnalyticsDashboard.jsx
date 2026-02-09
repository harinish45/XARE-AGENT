/**
 * Analytics Dashboard Component
 * Enhanced UI with charts and metrics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AnalyticsDashboard = () => {
    const [timeRange, setTimeRange] = useState('7d');
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const loadAnalytics = async () => {
            setIsLoading(true);
            try {
                // TODO: Load from backend
                const mockData = {
                    overview: {
                        totalWorkflows: 12,
                        activeAutomations: 47,
                        timeSaved: '3.5h',
                        efficiency: 94
                    },
                    workflowUsage: [
                        { name: 'Email Processing', count: 234, trend: '+15%' },
                        { name: 'File Organization', count: 189, trend: '+8%' },
                        { name: 'Data Backup', count: 156, trend: '+22%' },
                        { name: 'Web Scraping', count: 98, trend: '+5%' },
                        { name: 'Content Generation', count: 76, trend: '+18%' }
                    ],
                    timeDistribution: [
                        { day: 'Mon', hours: 4.2 },
                        { day: 'Tue', hours: 3.8 },
                        { day: 'Wed', hours: 5.1 },
                        { day: 'Thu', hours: 4.5 },
                        { day: 'Fri', hours: 3.9 },
                        { day: 'Sat', hours: 2.1 },
                        { day: 'Sun', hours: 1.5 }
                    ],
                    automationSuccess: [
                        { date: 'Jan 1', success: 92, total: 100 },
                        { date: 'Jan 2', success: 88, total: 95 },
                        { date: 'Jan 3', success: 95, total: 98 },
                        { date: 'Jan 4', success: 90, total: 92 },
                        { date: 'Jan 5', success: 93, total: 96 },
                        { date: 'Jan 6', success: 91, total: 94 },
                        { date: 'Jan 7', success: 94, total: 97 }
                    ],
                    topActions: [
                        { action: 'Send Email', count: 456, time: '2.3h' },
                        { action: 'Organize Files', count: 234, time: '1.8h' },
                        { action: 'Capture Screen', count: 189, time: '0.5h' },
                        { action: 'Navigate Browser', count: 156, time: '1.2h' },
                        { action: 'Generate Content', count: 98, time: '3.1h' }
                    ]
                };
                setData(mockData);
            } catch (error) {
                console.error('Failed to load analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAnalytics();
    }, [timeRange]);

    const timeRanges = [
        { id: '1d', label: '1 Day' },
        { id: '7d', label: '7 Days' },
        { id: '30d', label: '30 Days' },
        { id: '90d', label: '90 Days' }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
                    <p className="text-gray-400">Track your automation performance and insights</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex bg-gray-800 rounded-lg p-1">
                        {timeRanges.map((range) => (
                            <button
                                key={range.id}
                                onClick={() => setTimeRange(range.id)}
                                className={`px-4 py-2 rounded-md transition-colors ${timeRange === range.id
                                        ? 'bg-blue-500 text-white'
                                        : 'hover:bg-gray-700'
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                        📤 Export
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {data?.overview && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-gray-800 rounded-xl border border-gray-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl">⚡</span>
                                <span className="text-green-400 text-sm font-semibold">+12%</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">{data.overview.totalWorkflows}</div>
                            <div className="text-gray-400">Active Workflows</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-6 bg-gray-800 rounded-xl border border-gray-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl">🤖</span>
                                <span className="text-green-400 text-sm font-semibold">+15%</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">{data.overview.activeAutomations}</div>
                            <div className="text-gray-400">Automations Today</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-6 bg-gray-800 rounded-xl border border-gray-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl">⏱️</span>
                                <span className="text-green-400 text-sm font-semibold">+1.2h</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">{data.overview.timeSaved}</div>
                            <div className="text-gray-400">Time Saved</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-6 bg-gray-800 rounded-xl border border-gray-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl">📈</span>
                                <span className="text-green-400 text-sm font-semibold">+5%</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">{data.overview.efficiency}%</div>
                            <div className="text-gray-400">Efficiency</div>
                        </motion.div>
                    </>
                )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Workflow Usage */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-gray-800 rounded-xl border border-gray-700"
                >
                    <h2 className="text-xl font-bold mb-6">Workflow Usage</h2>
                    <div className="space-y-4">
                        {data?.workflowUsage.map((workflow, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{workflow.name}</span>
                                    <span className="text-sm text-gray-400">{workflow.count} runs</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(workflow.count / 250) * 100}%` }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Usage</span>
                                    <span className={workflow.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                                        {workflow.trend}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Time Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-gray-800 rounded-xl border border-gray-700"
                >
                    <h2 className="text-xl font-bold mb-6">Time Distribution</h2>
                    <div className="flex items-end justify-between h-48 space-x-2">
                        {data?.timeDistribution.map((day, index) => (
                            <motion.div
                                key={index}
                                initial={{ height: 0 }}
                                animate={{ height: `${(day.hours / 6) * 100}%` }}
                                transition={{ delay: index * 0.1 }}
                                className="flex-1 flex flex-col items-center"
                            >
                                <div className="w-full bg-gradient-to-t from-blue-500 to-purple-600 rounded-t-lg relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 px-2 py-1 rounded text-xs">
                                        {day.hours}h
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-400">{day.day}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Success Rate Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-gray-800 rounded-xl border border-gray-700 mb-8"
            >
                <h2 className="text-xl font-bold mb-6">Automation Success Rate</h2>
                <div className="h-64 flex items-end space-x-4">
                    {data?.automationSuccess.map((day, index) => (
                        <motion.div
                            key={index}
                            initial={{ height: 0 }}
                            animate={{ height: `${(day.success / day.total) * 100}%` }}
                            transition={{ delay: index * 0.1 }}
                            className="flex-1 flex flex-col items-center"
                        >
                            <div className="w-full bg-gradient-to-t from-green-500 to-teal-500 rounded-t-lg relative">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 px-2 py-1 rounded text-xs">
                                    {Math.round((day.success / day.total) * 100)}%
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-400">{day.date}</div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Top Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-gray-800 rounded-xl border border-gray-700"
            >
                <h2 className="text-xl font-bold mb-6">Top Actions</h2>
                <div className="space-y-4">
                    {data?.topActions.map((action, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            <div className="flex items-center space-x-4">
                                <span className="text-2xl">⚙️</span>
                                <div>
                                    <div className="font-medium">{action.action}</div>
                                    <div className="text-sm text-gray-400">{action.count} executions</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">{action.time}</div>
                                <div className="text-sm text-gray-400">Total time</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl border border-blue-500/30"
            >
                <h2 className="text-xl font-bold mb-4">💡 Insights</h2>
                <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <p className="text-gray-300">Your most productive day is Wednesday with 5.1 hours of automation</p>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <p className="text-gray-300">Email Processing workflow has the highest success rate at 95%</p>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="text-yellow-400">⚠</span>
                        <p className="text-gray-300">Consider optimizing File Organization workflow for better performance</p>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="text-blue-400">💡</span>
                        <p className="text-gray-300">You've saved 3.5 hours this week, 15% more than last week</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AnalyticsDashboard;
