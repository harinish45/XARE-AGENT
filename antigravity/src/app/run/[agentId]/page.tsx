"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface LogEntry {
    id: string;
    timestamp: string;
    type: "info" | "success" | "warning" | "error" | "thought";
    message: string;
}

export default function AgentRunnerPage() {
    const params = useParams();
    const router = useRouter();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [status, setStatus] = useState<"idle" | "running" | "paused" | "error">("idle");
    const [agentName, setAgentName] = useState<string>("Loading Agent...");
    const [inputValue, setInputValue] = useState("");
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            setAgentName(`Agent ${params.agentId}`);
            if (status === "idle") {
                addLog("info", "Agent environment initialized.");
                addLog("info", "Waiting for command...");
            }
        }, 500);
    }, [params.agentId]);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const addLog = (type: LogEntry["type"], message: string) => {
        setLogs((prev) => [
            ...prev,
            {
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toLocaleTimeString(),
                type,
                message,
            },
        ]);
    };

    const handleStart = () => {
        setStatus("running");
        addLog("success", "Agent started.");
        addLog("thought", "Analyzing current context...");

        setTimeout(() => {
            addLog("info", "Connecting to headless browser...");
        }, 1500);
        setTimeout(() => {
            addLog("success", "Browser connected successfully.");
            addLog("thought", "Navigating to target URL...");
        }, 3000);
    };

    const handlePause = () => {
        setStatus("paused");
        addLog("warning", "Agent paused by user.");
    };

    const handleStop = () => {
        setStatus("idle");
        addLog("error", "Agent stopped.");
    };

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        addLog("info", `User: ${inputValue}`);
        if (status === "running") {
            setTimeout(() => {
                addLog("thought", `Processing user input: "${inputValue}"`);
            }, 1000);
        } else {
            addLog("warning", "Agent is not running. Start the agent to process commands.");
        }
        setInputValue("");
    };

    const getLogColor = (type: LogEntry["type"]) => {
        switch (type) {
            case "success":
                return "text-[var(--neon-green)]";
            case "error":
                return "text-[var(--neon-pink)]";
            case "warning":
                return "text-[var(--neon-orange)]";
            case "thought":
                return "text-[var(--neon-purple)]";
            default:
                return "text-[var(--neon-cyan)]";
        }
    };

    const getLogIcon = (type: LogEntry["type"]) => {
        switch (type) {
            case "success":
                return "✓";
            case "error":
                return "✗";
            case "warning":
                return "⚠";
            case "thought":
                return "💭";
            default:
                return "ℹ";
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col bg-[var(--dark-bg)] overflow-hidden">
            {/* Header */}
            <header className="relative z-10 w-full border-b border-[var(--neon-cyan)]/20 glass-heavy">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="text-gray-400 hover:text-[var(--neon-cyan)] transition-colors"
                        >
                            ← Back
                        </button>
                        <div className="h-6 w-px bg-white/20" />
                        <span className="font-bold text-xl neon-text-cyan">{agentName}</span>
                        <span className="text-xs glass px-2 py-0.5 rounded-full text-gray-400 border border-[var(--neon-cyan)]/30">
                            v0.1.0
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="glass px-3 py-1 rounded-full border border-white/10">
                            Session: {params.agentId?.slice(0, 8)}
                        </span>
                    </div>
                </div>
            </header>

            {/* Terminal Area */}
            <main className="relative z-10 flex-1 container mx-auto px-4 py-6 flex flex-col overflow-hidden">
                <div
                    ref={terminalRef}
                    className="flex-1 glass rounded-xl p-6 overflow-y-auto font-mono text-sm border border-[var(--neon-cyan)]/30 neon-glow-cyan"
                >
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-[var(--neon-green)] neon-glow-green"></div>
                        </div>
                        <span className="text-gray-500 text-xs">ANTIGRAVITY RUNTIME v2.0</span>
                    </div>

                    {/* Logs */}
                    <AnimatePresence>
                        {logs.map((log, index) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`mb-2 flex items-start gap-3 ${getLogColor(log.type)}`}
                            >
                                <span className="text-gray-600">[{log.timestamp}]</span>
                                <span className="text-lg leading-none">{getLogIcon(log.type)}</span>
                                <span className="flex-1">{log.message}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Cursor */}
                    {status === "running" && (
                        <motion.div
                            className="inline-block w-2 h-4 bg-[var(--neon-cyan)] ml-2"
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    )}
                </div>
            </main>

            {/* Controls */}
            <div className="relative z-20 border-t border-[var(--neon-purple)]/30 glass-heavy">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        {/* Status Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleStart}
                                disabled={status === "running"}
                                className="px-4 py-2 rounded-lg bg-[var(--neon-green)]/20 text-[var(--neon-green)] border-2 border-[var(--neon-green)] hover:bg-[var(--neon-green)] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed neon-glow-green"
                            >
                                ▶ Start
                            </button>
                            <button
                                onClick={handlePause}
                                disabled={status !== "running"}
                                className="px-4 py-2 rounded-lg bg-[var(--neon-orange)]/20 text-[var(--neon-orange)] border-2 border-[var(--neon-orange)] hover:bg-[var(--neon-orange)] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ⏸ Pause
                            </button>
                            <button
                                onClick={handleStop}
                                disabled={status === "idle"}
                                className="px-4 py-2 rounded-lg bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] border-2 border-[var(--neon-pink)] hover:bg-[var(--neon-pink)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed neon-glow-pink"
                            >
                                ■ Stop
                            </button>
                        </div>

                        {/* Input */}
                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                placeholder="Type a command..."
                                className="flex-1 px-4 py-2 glass rounded-lg border border-[var(--neon-cyan)]/30 bg-transparent text-white placeholder-gray-500 focus:outline-none focus:border-[var(--neon-cyan)] focus:neon-glow-cyan transition-all"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] text-white font-medium hover:opacity-90 transition-opacity neon-glow-purple"
                            >
                                Send
                            </button>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center gap-2 glass px-4 py-2 rounded-lg border border-white/10">
                            <div
                                className={`w-3 h-3 rounded-full ${status === "running"
                                        ? "bg-[var(--neon-green)] neon-glow-green"
                                        : status === "paused"
                                            ? "bg-yellow-500"
                                            : "bg-gray-500"
                                    }`}
                            />
                            <span className="text-sm text-gray-400">{status.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
