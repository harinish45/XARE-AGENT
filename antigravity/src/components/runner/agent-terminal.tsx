
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LogEntry {
    id: string;
    timestamp: string;
    type: "info" | "success" | "warning" | "error" | "thought";
    message: string;
}

interface AgentTerminalProps {
    logs: LogEntry[];
    className?: string;
}

export function AgentTerminal({ logs, className }: AgentTerminalProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div
            className={cn(
                "bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden flex flex-col font-mono text-sm shadow-2xl",
                className
            )}
        >
            <div className="bg-neutral-900/50 px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <span className="text-neutral-500 text-xs">agent-cli — zsh</span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[400px] max-h-[600px] scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent"
            >
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-start gap-3"
                        >
                            <span className="text-neutral-600 shrink-0 select-none">
                                {log.timestamp}
                            </span>
                            <div className="flex-1 break-words">
                                {log.type === "info" && (
                                    <span className="text-blue-400 mr-2">ℹ</span>
                                )}
                                {log.type === "success" && (
                                    <span className="text-green-400 mr-2">✔</span>
                                )}
                                {log.type === "warning" && (
                                    <span className="text-yellow-400 mr-2">⚠</span>
                                )}
                                {log.type === "error" && (
                                    <span className="text-red-400 mr-2">✖</span>
                                )}
                                {log.type === "thought" && (
                                    <span className="text-purple-400 mr-2">🧠</span>
                                )}
                                <span
                                    className={cn(
                                        "text-neutral-300",
                                        log.type === "error" && "text-red-300",
                                        log.type === "success" && "text-green-300",
                                        log.type === "thought" && "text-purple-300 italic"
                                    )}
                                >
                                    {log.message}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {logs.length === 0 && (
                    <div className="text-neutral-600 italic">Waiting for agent output...</div>
                )}
            </div>
        </div>
    );
}
