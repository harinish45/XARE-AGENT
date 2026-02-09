/**
 * Modern Dashboard Component
 * Enhanced UI with modern design patterns
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ModernDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load user preferences
        const loadPreferences = async () => {
            try {
                const prefs = await window.api.settings.getPreferences();
                setIsDarkMode(prefs.darkMode ?? true);
            } catch (error) {
                console.error('Failed to load preferences:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPreferences();
    }, []);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'workflows', label: 'Workflows', icon: '⚡' },
        { id: 'automation', label: 'Automation', icon: '🤖' },
        { id: 'integrations', label: 'Integrations', icon: '🔌' },
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];

    const quickActions = [
        { id: 'new-workflow', label: 'New Workflow', icon: '➕', action: () => console.log('New workflow') },
        { id: 'capture-screen', label: 'Capture Screen', icon: '📸', action: () => console.log('Capture screen') },
        { id: 'start-automation', label: 'Start Automation', icon: '▶️', action: () => console.log('Start automation') },
        { id: 'open-browser', label: 'Open Browser', icon: '🌐', action: () => console.log('Open browser') }
    ];

    const stats = [
        { id: 'workflows', label: 'Active Workflows', value: 12, change: '+2', icon: '⚡' },
        { id: 'automations', label: 'Automations Today', value: 47, change: '+15', icon: '🤖' },
        { id: 'time-saved', label: 'Time Saved', value: '3.5h', change: '+1.2h', icon: '⏱️' },
        { id: 'efficiency', label: 'Efficiency', value: '94%', change: '+5%', icon: '📈' }
    ];

    const recentActivities = [
        { id: 1, type: 'workflow', message: 'Email processing completed', time: '2 min ago', icon: '⚡' },
        { id: 2, type: 'automation', message: 'File organization finished', time: '15 min ago', icon: '🤖' },
        { id: 3, type: 'integration', message: 'Google Drive synced', time: '1 hour ago', icon: '🔌' },
        { id: 4, type: 'system', message: 'Backup completed', time: '2 hours ago', icon: '💾' }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <header className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} px-6 py-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                            AI Desktop Agent
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">
                            v1.0.0
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                                }`}
                        >
                            {isDarkMode ? '☀️' : '🌙️'}
                        </button>
                        <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
                            🔔
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                            )}
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                            👤
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className={`w-64 border-r ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} p-4`}>
                    <nav className="space-y-2">
                        {tabs.map((tab) => (
                            <motion.button
                                key={tab.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                        : isDarkMode
                                            ? 'hover:bg-gray-800'
                                            : 'hover:bg-gray-200'
                                    }`}
                            >
                                <span className="text-xl">{tab.icon}</span>
                                <span className="font-medium">{tab.label}</span>
                            </motion.button>
                        ))}
                    </nav>

                    {/* Quick Actions */}
                    <div className="mt-8">
                        <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Quick Actions
                        </h3>
                        <div className="space-y-2">
                            {quickActions.map((action) => (
                                <motion.button
                                    key={action.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={action.action}
                                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                                        }`}
                                >
                                    <span>{action.icon}</span>
                                    <span className="text-sm">{action.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {stats.map((stat) => (
                                            <motion.div
                                                key={stat.id}
                                                whileHover={{ scale: 1.02 }}
                                                className={`p-6 rounded-xl border ${isDarkMode
                                                        ? 'bg-gray-800 border-gray-700'
                                                        : 'bg-white border-gray-200 shadow-lg'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-2xl">{stat.icon}</span>
                                                    <span className={`text-sm font-semibold ${stat.change.startsWith('+')
                                                            ? 'text-green-400'
                                                            : 'text-red-400'
                                                        }`}>
                                                        {stat.change}
                                                    </span>
                                                </div>
                                                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {stat.label}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Recent Activities */}
                                    <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'
                                        }`}>
                                        <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
                                        <div className="space-y-3">
                                            {recentActivities.map((activity) => (
                                                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-700/50 transition-colors">
                                                    <span className="text-2xl">{activity.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{activity.message}</div>
                                                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {activity.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'workflows' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h1 className="text-2xl font-bold">Workflows</h1>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            ➕ New Workflow
                                        </motion.button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ scale: 1.02 }}
                                                className={`p-6 rounded-xl border cursor-pointer ${isDarkMode
                                                        ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                                                        : 'bg-white border-gray-200 hover:border-blue-500 shadow-lg'
                                                    }`}
                                            >
                                                <div className="text-4xl mb-4">⚡</div>
                                                <h3 className="text-lg font-bold mb-2">Workflow {i}</h3>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Automated workflow description
                                                </p>
                                                <div className="mt-4 flex items-center space-x-2">
                                                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                                                        Active
                                                    </span>
                                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Last run: 2h ago
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'automation' && (
                                <div className="space-y-6">
                                    <h1 className="text-2xl font-bold">Automation</h1>
                                    <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'
                                        }`}>
                                        <p className="text-center text-gray-400">
                                            Automation features coming soon...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'integrations' && (
                                <div className="space-y-6">
                                    <h1 className="text-2xl font-bold">Integrations</h1>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[
                                            { name: 'Google Drive', icon: '🔵', status: 'connected' },
                                            { name: 'GitHub', icon: '🐙', status: 'connected' },
                                            { name: 'Notion', icon: '📝', status: 'disconnected' },
                                            { name: 'Slack', icon: '💬', status: 'connected' },
                                            { name: 'Dropbox', icon: '📦', status: 'disconnected' },
                                            { name: 'Email', icon: '📧', status: 'connected' }
                                        ].map((integration) => (
                                            <motion.div
                                                key={integration.name}
                                                whileHover={{ scale: 1.02 }}
                                                className={`p-6 rounded-xl border ${isDarkMode
                                                        ? 'bg-gray-800 border-gray-700'
                                                        : 'bg-white border-gray-200 shadow-lg'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-4xl">{integration.icon}</span>
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${integration.status === 'connected'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-gray-500/20 text-gray-400'
                                                        }`}>
                                                        {integration.status}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold mb-2">{integration.name}</h3>
                                                <button className="w-full px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors font-medium">
                                                    {integration.status === 'connected' ? 'Manage' : 'Connect'}
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <div className="space-y-6">
                                    <h1 className="text-2xl font-bold">Analytics</h1>
                                    <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'
                                        }`}>
                                        <p className="text-center text-gray-400">
                                            Analytics dashboard coming soon...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-6">
                                    <h1 className="text-2xl font-bold">Settings</h1>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'appearance', label: 'Appearance', icon: '🎨' },
                                            { id: 'api', label: 'API Settings', icon: '🔑' },
                                            { id: 'notifications', label: 'Notifications', icon: '🔔' },
                                            { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
                                            { id: 'about', label: 'About', icon: 'ℹ️' }
                                        ].map((setting) => (
                                            <motion.div
                                                key={setting.id}
                                                whileHover={{ scale: 1.01 }}
                                                className={`p-4 rounded-lg border cursor-pointer flex items-center space-x-4 ${isDarkMode
                                                        ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                                                        : 'bg-white border-gray-200 hover:border-blue-500'
                                                    }`}
                                            >
                                                <span className="text-2xl">{setting.icon}</span>
                                                <span className="font-medium flex-1">{setting.label}</span>
                                                <span>→</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default ModernDashboard;
