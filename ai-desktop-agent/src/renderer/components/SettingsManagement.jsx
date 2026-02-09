/**
 * Settings Management Component
 * Enhanced UI for managing application settings
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsManagement = () => {
    const [activeSection, setActiveSection] = useState('general');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState({
        general: {
            language: 'en',
            theme: 'dark',
            autoStart: true,
            minimizeToTray: true
        },
        api: {
            provider: 'openai',
            apiKey: '',
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000
        },
        notifications: {
            enabled: true,
            sound: true,
            desktop: true,
            email: false
        },
        privacy: {
            dataCollection: false,
            crashReports: false,
            analytics: false
        },
        advanced: {
            debugMode: false,
            logLevel: 'info',
            maxLogSize: 100,
            autoCleanup: true
        }
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const loadedSettings = await window.api.settings.getSettings();
                setSettings(loadedSettings);
                setIsDarkMode(loadedSettings.general?.theme === 'dark');
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    const sections = [
        { id: 'general', label: 'General', icon: '⚙️' },
        { id: 'api', label: 'API Settings', icon: '🔑' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
        { id: 'advanced', label: 'Advanced', icon: '⚙️' }
    ];

    const handleSaveSettings = async () => {
        try {
            await window.api.settings.saveSettings(settings);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        }
    };

    const handleResetSettings = async () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            try {
                await window.api.settings.resetSettings();
                window.location.reload();
            } catch (error) {
                console.error('Failed to reset settings:', error);
                alert('Failed to reset settings');
            }
        }
    };

    const handleExportSettings = () => {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'settings.json';
        link.click();

        URL.revokeObjectURL(url);
    };

    const handleImportSettings = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedSettings = JSON.parse(event.target.result);
                setSettings(importedSettings);
                alert('Settings imported successfully!');
            } catch (error) {
                console.error('Failed to import settings:', error);
                alert('Failed to import settings');
            }
        };
        reader.readAsText(file);
    };

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
                        <h1 className="text-2xl font-bold">Settings</h1>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400">
                            v1.0.0
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleExportSettings}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            📤 Export
                        </button>
                        <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer">
                            📥 Import
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportSettings}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={handleResetSettings}
                            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                        >
                            🔄 Reset
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className={`w-64 border-r ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} p-4`}>
                    <nav className="space-y-2">
                        {sections.map((section) => (
                            <motion.button
                                key={section.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeSection === section.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                        : isDarkMode
                                            ? 'hover:bg-gray-800'
                                            : 'hover:bg-gray-200'
                                    }`}
                            >
                                <span className="text-xl">{section.icon}</span>
                                <span className="font-medium">{section.label}</span>
                            </motion.button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeSection === 'general' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold mb-6">General Settings</h2>

                                    <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'}`}>
                                        <h3 className="text-lg font-bold mb-4">Appearance</h3>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Dark Mode</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Enable dark theme
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setIsDarkMode(!isDarkMode);
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            general: { ...prev.general, theme: isDarkMode ? 'light' : 'dark' }
                                                        }));
                                                    }}
                                                    className={`w-14 h-8 rounded-full transition-colors ${isDarkMode ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block font-medium mb-2">Language</label>
                                                <select
                                                    value={settings.general.language}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        general: { ...prev.general, language: e.target.value }
                                                    }))}
                                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="en">English</option>
                                                    <option value="es">Español</option>
                                                    <option value="fr">Français</option>
                                                    <option value="de">Deutsch</option>
                                                    <option value="ja">日本語</option>
                                                    <option value="zh">中文</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'}`}>
                                        <h3 className="text-lg font-bold mb-4">Startup</h3>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Auto Start</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Start application on system boot
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        general: { ...prev.general, autoStart: !prev.general.autoStart }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.general.autoStart ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.general.autoStart ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Minimize to Tray</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Minimize to system tray on close
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        general: { ...prev.general, minimizeToTray: !prev.general.minimizeToTray }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.general.minimizeToTray ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.general.minimizeToTray ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'api' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold mb-6">API Settings</h2>

                                    <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'}`}>
                                        <h3 className="text-lg font-bold mb-4">AI Provider</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block font-medium mb-2">Provider</label>
                                                <select
                                                    value={settings.api.provider}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        api: { ...prev.api, provider: e.target.value }
                                                    }))}
                                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="openai">OpenAI</option>
                                                    <option value="anthropic">Anthropic</option>
                                                    <option value="cohere">Cohere</option>
                                                    <option value="ollama">Ollama</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block font-medium mb-2">API Key</label>
                                                <input
                                                    type="password"
                                                    value={settings.api.apiKey}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        api: { ...prev.api, apiKey: e.target.value }
                                                    }))}
                                                    placeholder="Enter your API key"
                                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-medium mb-2">Model</label>
                                                <select
                                                    value={settings.api.model}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        api: { ...prev.api, model: e.target.value }
                                                    }))}
                                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="gpt-4">GPT-4</option>
                                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                    <option value="claude-3-opus">Claude 3 Opus</option>
                                                    <option value="claude-2">Claude 2</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block font-medium mb-2">Temperature: {settings.api.temperature}</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="2"
                                                    step="0.1"
                                                    value={settings.api.temperature}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        api: { ...prev.api, temperature: parseFloat(e.target.value) }
                                                    }))}
                                                    className="w-full"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-medium mb-2">Max Tokens: {settings.api.maxTokens}</label>
                                                <input
                                                    type="number"
                                                    min="100"
                                                    max="8000"
                                                    value={settings.api.maxTokens}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        api: { ...prev.api, maxTokens: parseInt(e.target.value) }
                                                    }))}
                                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'notifications' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold mb-6">Notifications</h2>

                                    <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'}`}>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Enable Notifications</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Receive notifications for important events
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, enabled: !prev.notifications.enabled }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.notifications.enabled ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.notifications.enabled ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Sound Notifications</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Play sound for notifications
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, sound: !prev.notifications.sound }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.notifications.sound ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.notifications.sound ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Desktop Notifications</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Show desktop notifications
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, desktop: !prev.notifications.desktop }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.notifications.desktop ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.notifications.desktop ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Email Notifications</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Send notifications via email
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: { ...prev.notifications, email: !prev.notifications.email }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.notifications.email ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.notifications.email ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'privacy' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold mb-6">Privacy & Security</h2>

                                    <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'}`}>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Data Collection</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Allow anonymous usage data collection
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        privacy: { ...prev.privacy, dataCollection: !prev.privacy.dataCollection }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.privacy.dataCollection ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.privacy.dataCollection ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Crash Reports</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Send anonymous crash reports
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        privacy: { ...prev.privacy, crashReports: !prev.privacy.crashReports }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.privacy.crashReports ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.privacy.crashReports ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Analytics</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Enable usage analytics
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        privacy: { ...prev.privacy, analytics: !prev.privacy.analytics }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.privacy.analytics ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.privacy.analytics ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'advanced' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold mb-6">Advanced Settings</h2>

                                    <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'}`}>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Debug Mode</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Enable verbose logging
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        advanced: { ...prev.advanced, debugMode: !prev.advanced.debugMode }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.advanced.debugMode ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.advanced.debugMode ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block font-medium mb-2">Log Level</label>
                                                <select
                                                    value={settings.advanced.logLevel}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        advanced: { ...prev.advanced, logLevel: e.target.value }
                                                    }))}
                                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="debug">Debug</option>
                                                    <option value="info">Info</option>
                                                    <option value="warn">Warning</option>
                                                    <option value="error">Error</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block font-medium mb-2">Max Log Size (MB): {settings.advanced.maxLogSize}</label>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    max="1000"
                                                    value={settings.advanced.maxLogSize}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        advanced: { ...prev.advanced, maxLogSize: parseInt(e.target.value) }
                                                    }))}
                                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-medium">Auto Cleanup</label>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Automatically clean up old logs
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        advanced: { ...prev.advanced, autoCleanup: !prev.advanced.autoCleanup }
                                                    }))}
                                                    className={`w-14 h-8 rounded-full transition-colors ${settings.advanced.autoCleanup ? 'bg-blue-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.advanced.autoCleanup ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Save Button */}
                    <div className="mt-8 flex justify-end">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveSettings}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            💾 Save Settings
                        </motion.button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsManagement;
