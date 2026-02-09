const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
    // Window controls
    minimizeWindow: () => ipcRenderer.send('window:minimize'),
    closeWindow: () => ipcRenderer.send('window:close'),
    resizeWindow: (width, height) => ipcRenderer.send('window:resize', { width, height }),

    // AI chat
    chat: (message) => ipcRenderer.invoke('ai:chat', message),
    clearHistory: () => ipcRenderer.invoke('ai:clear-history'),
    getProviders: () => ipcRenderer.invoke('ai:get-providers'),

    // Actions
    executeAction: (action) => ipcRenderer.invoke('action:execute', action),
    executeSequence: (actions) => ipcRenderer.invoke('action:execute-sequence', actions),
    getAvailableActions: () => ipcRenderer.invoke('actions:get-available'),

    // Screen
    captureScreen: () => ipcRenderer.invoke('screen:capture'),
    analyzeScreen: (question) => ipcRenderer.invoke('screen:analyze', question),
    getDisplays: () => ipcRenderer.invoke('screen:get-displays'),
    getPrimaryDisplay: () => ipcRenderer.invoke('screen:get-primary-display'),

    // Window info
    getActiveWindow: () => ipcRenderer.invoke('window:get-active'),
    listWindows: () => ipcRenderer.invoke('window:list'),

    // Task planning
    planTask: (taskDescription) => ipcRenderer.invoke('task:plan', taskDescription),

    // Memory
    getMemoryStats: () => ipcRenderer.invoke('memory:get-stats'),

    // Clipboard
    getClipboardHistory: () => ipcRenderer.invoke('clipboard:get-history'),
    setClipboard: (content) => ipcRenderer.invoke('clipboard:set', content),
    deleteClipboardItem: (itemId) => ipcRenderer.invoke('clipboard:delete-item', itemId),
    clearClipboardHistory: () => ipcRenderer.invoke('clipboard:clear-history'),

    // Safety
    setDryRunMode: (enabled) => ipcRenderer.invoke('safety:set-dry-run', enabled),
    getDryRunMode: () => ipcRenderer.invoke('safety:get-dry-run'),
    undoLastAction: () => ipcRenderer.invoke('safety:undo'),
    rollbackActions: (count) => ipcRenderer.invoke('safety:rollback', count),
    getSafetyStats: () => ipcRenderer.invoke('safety:get-stats'),
    getActionHistory: (limit) => ipcRenderer.invoke('safety:get-history', limit),
    clearActionHistory: () => ipcRenderer.invoke('safety:clear-history'),
    addRestrictedZone: (type, value) => ipcRenderer.invoke('safety:add-restricted-zone', type, value),
    removeRestrictedZone: (type, value) => ipcRenderer.invoke('safety:remove-restricted-zone', type, value),
    setActionLimits: (limits) => ipcRenderer.invoke('safety:set-limits', limits),

    // ==================== SCREEN RECORDING ====================
    screenRecording: {
        startRecording: (options) => ipcRenderer.invoke('screen-recording:start', options),
        stopRecording: () => ipcRenderer.invoke('screen-recording:stop'),
        pauseRecording: () => ipcRenderer.invoke('screen-recording:pause'),
        resumeRecording: () => ipcRenderer.invoke('screen-recording:resume'),
        getRecording: (recordingId) => ipcRenderer.invoke('screen-recording:get-recording', recordingId),
        getRecordings: (filters) => ipcRenderer.invoke('screen-recording:get-recordings', filters),
        getRecordingFrames: (recordingId) => ipcRenderer.invoke('screen-recording:get-frames', recordingId),
        getRecordingStatistics: (recordingId) => ipcRenderer.invoke('screen-recording:get-statistics', recordingId),
        exportRecording: (recordingId, format) => ipcRenderer.invoke('screen-recording:export', recordingId, format),
        exportAllRecordings: (format) => ipcRenderer.invoke('screen-recording:export-all', format),
        deleteRecording: (recordingId) => ipcRenderer.invoke('screen-recording:delete', recordingId),
        updateRecording: (recordingId, updates) => ipcRenderer.invoke('screen-recording:update', recordingId, updates)
    },

    // ==================== PRODUCTIVITY ANALYTICS ====================
    productivity: {
        startTracking: (options) => ipcRenderer.invoke('productivity:start-tracking', options),
        stopTracking: () => ipcRenderer.invoke('productivity:stop-tracking'),
        logApplicationUsage: (application, duration) => ipcRenderer.invoke('productivity:log-app-usage', application, duration),
        logWebsiteVisit: (url, duration) => ipcRenderer.invoke('productivity:log-website-visit', url, duration),
        addBreak: (breakInfo) => ipcRenderer.invoke('productivity:add-break', breakInfo),
        getTimeEntry: (entryId) => ipcRenderer.invoke('productivity:get-time-entry', entryId),
        getTimeEntries: (filters) => ipcRenderer.invoke('productivity:get-time-entries', filters),
        updateTimeEntry: (entryId, updates) => ipcRenderer.invoke('productivity:update-time-entry', entryId, updates),
        deleteTimeEntry: (entryId) => ipcRenderer.invoke('productivity:delete-time-entry', entryId),
        getStatistics: (filters) => ipcRenderer.invoke('productivity:get-statistics', filters),
        getInsights: (filters) => ipcRenderer.invoke('productivity:get-insights', filters),
        generateReport: (options) => ipcRenderer.invoke('productivity:generate-report', options)
    },

    // ==================== HEALTH MONITORING ====================
    health: {
        startMonitoring: (options) => ipcRenderer.invoke('health:start-monitoring', options),
        stopMonitoring: () => ipcRenderer.invoke('health:stop-monitoring'),
        acknowledgeBreak: (breakId) => ipcRenderer.invoke('health:acknowledge-break', breakId),
        skipBreak: (breakId, reason) => ipcRenderer.invoke('health:skip-break', breakId, reason),
        getWellnessMetric: (metricId) => ipcRenderer.invoke('health:get-wellness-metric', metricId),
        getWellnessMetrics: (filters) => ipcRenderer.invoke('health:get-wellness-metrics', filters),
        getWellnessStatistics: (filters) => ipcRenderer.invoke('health:get-wellness-statistics', filters),
        updateWellnessMetric: (metricId, updates) => ipcRenderer.invoke('health:update-wellness-metric', metricId, updates),
        deleteWellnessMetric: (metricId) => ipcRenderer.invoke('health:delete-wellness-metric', metricId)
    },

    // ==================== FOCUS MODE ====================
    focus: {
        startFocusMode: (options) => ipcRenderer.invoke('focus:start-focus-mode', options),
        stopFocusMode: () => ipcRenderer.invoke('focus:stop-focus-mode'),
        pauseFocusMode: () => ipcRenderer.invoke('focus:pause-focus-mode'),
        resumeFocusMode: () => ipcRenderer.invoke('focus:resume-focus-mode'),
        logInterruption: (interruption) => ipcRenderer.invoke('focus:log-interruption', interruption),
        blockWebsite: (url, options) => ipcRenderer.invoke('focus:block-website', url, options),
        unblockWebsite: (blockId) => ipcRenderer.invoke('focus:unblock-website', blockId),
        blockApp: (appName, options) => ipcRenderer.invoke('focus:block-app', appName, options),
        unblockApp: (blockId) => ipcRenderer.invoke('focus:unblock-app', blockId),
        isWebsiteBlocked: (url) => ipcRenderer.invoke('focus:is-website-blocked', url),
        isAppBlocked: (appName) => ipcRenderer.invoke('focus:is-app-blocked', appName),
        addWhitelistedSite: (url) => ipcRenderer.invoke('focus:add-whitelisted-site', url),
        removeWhitelistedSite: (whitelistId) => ipcRenderer.invoke('focus:remove-whitelisted-site', whitelistId),
        addWhitelistedApp: (appName) => ipcRenderer.invoke('focus:add-whitelisted-app', appName),
        removeWhitelistedApp: (whitelistId) => ipcRenderer.invoke('focus:remove-whitelisted-app', whitelistId),
        getFocusSession: (sessionId) => ipcRenderer.invoke('focus:get-focus-session', sessionId),
        getFocusSessions: (filters) => ipcRenderer.invoke('focus:get-focus-sessions', filters),
        getFocusStatistics: (filters) => ipcRenderer.invoke('focus:get-focus-statistics', filters)
    },

    // ==================== OCR SERVICE ====================
    ocr: {
        extractFromFile: (imagePath, options) => ipcRenderer.invoke('ocr:extract-from-file', imagePath, options),
        extractFromBase64: (base64Image, options) => ipcRenderer.invoke('ocr:extract-from-base64', base64Image, options),
        extractFromBuffer: (imageBuffer, options) => ipcRenderer.invoke('ocr:extract-from-buffer', imageBuffer, options),
        extractFromRegion: (imagePath, region, options) => ipcRenderer.invoke('ocr:extract-from-region', imagePath, region, options),
        extractStructured: (imagePath, options) => ipcRenderer.invoke('ocr:extract-structured', imagePath, options),
        changeLanguage: (language) => ipcRenderer.invoke('ocr:change-language', language),
        getLanguages: () => ipcRenderer.invoke('ocr:get-languages'),
        clearCache: () => ipcRenderer.invoke('ocr:clear-cache')
    },

    // ==================== DOCUMENT PARSER ====================
    document: {
        parse: (filePath, options) => ipcRenderer.invoke('document:parse', filePath, options),
        summarize: (parsedDocument, options) => ipcRenderer.invoke('document:summarize', parsedDocument, options),
        search: (parsedDocument, query, options) => ipcRenderer.invoke('document:search', parsedDocument, query, options),
        getFormats: () => ipcRenderer.invoke('document:get-formats'),
        clearCache: () => ipcRenderer.invoke('document:clear-cache')
    },

    // ==================== VOICE SERVICE ====================
    voice: {
        startRecognition: (options) => ipcRenderer.invoke('voice:start-recognition', options),
        stopRecognition: () => ipcRenderer.invoke('voice:stop-recognition'),
        startRecording: (options) => ipcRenderer.invoke('voice:start-recording', options),
        stopRecording: () => ipcRenderer.invoke('voice:stop-recording'),
        textToSpeech: (text, options) => ipcRenderer.invoke('voice:text-to-speech', text, options),
        stopSpeech: () => ipcRenderer.invoke('voice:stop-speech'),
        getVoices: () => ipcRenderer.invoke('voice:get-voices'),
        addCommand: (phrase, callback, options) => ipcRenderer.invoke('voice:add-command', phrase, callback, options),
        removeCommand: (commandId) => ipcRenderer.invoke('voice:remove-command', commandId),
        getCommands: () => ipcRenderer.invoke('voice:get-commands'),
        getRecording: (recordingId) => ipcRenderer.invoke('voice:get-recording', recordingId),
        getRecordings: (filters) => ipcRenderer.invoke('voice:get-recordings', filters),
        deleteRecording: (recordingId) => ipcRenderer.invoke('voice:delete-recording', recordingId),
        setLanguage: (language) => ipcRenderer.invoke('voice:set-language', language),
        getLanguage: () => ipcRenderer.invoke('voice:get-language')
    }
});
