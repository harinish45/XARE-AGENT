
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Send } from "lucide-react";
import { motion } from "framer-motion";

interface AgentControlsProps {
    status: "idle" | "running" | "paused" | "error";
    onStart: () => void;
    onPause: () => void;
    onStop: () => void;
    onSendMessage: (message: string) => void;
}

export function AgentControls({
    status,
    onStart,
    onPause,
    onStop,
    onSendMessage,
}: AgentControlsProps) {
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <div className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4">
            <div className="container mx-auto max-w-4xl flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                            {status === "idle" || status === "paused" || status === "error" ? (
                                <Button
                                    size="sm"
                                    onClick={onStart}
                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    Run
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={onPause}
                                    className="gap-2"
                                >
                                    <Pause className="w-4 h-4 fill-current" />
                                    Pause
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onStop}
                                disabled={status === "idle"}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                                <Square className="w-4 h-4 fill-current" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize">
                            <span
                                className={`w-2 h-2 rounded-full ${status === "running"
                                        ? "bg-green-500 animate-pulse"
                                        : status === "paused"
                                            ? "bg-yellow-500"
                                            : status === "error"
                                                ? "bg-red-500"
                                                : "bg-neutral-400"
                                    }`}
                            />
                            {status}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Send a command or feedback to the agent..."
                        className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 pl-4 pr-12 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary text-primary-foreground opacity-0 group-focus-within:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
