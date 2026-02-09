import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Minimize2, Loader2, MessageSquare, Plus, History, Settings } from "lucide-react";

export default function App() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const toggleExpanded = () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);

        if (window.api && window.api.resizeWindow) {
            if (newExpandedState) {
                window.api.resizeWindow(450, 700);
            } else {
                window.api.resizeWindow(200, 200);
            }
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage("");
        setIsLoading(true);

        try {
            // Call AI chat API
            const response = await window.api.chat(inputMessage);

            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: response.text || response.error || "I'm here to help!",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: "Sorry, I encountered an error. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-transparent">
            {!isExpanded && (
                <div className="no-drag absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={toggleExpanded}
                        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl"
                        title="Open Agent"
                    >
                        <Sparkles className="w-8 h-8 text-white" />
                    </button>
                </div>
            )}

            {/* Expanded State - Chat-first (Cline-like) Interface */}
            {isExpanded && (
                <div className="no-drag w-full h-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl border-b border-white/10 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        Cline-style Agent
                                    </h1>
                                    <p className="text-xs text-slate-400">Chat-first interface</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors duration-200"
                                    title="New chat"
                                    onClick={() => setMessages([])}
                                >
                                    <Plus className="w-4 h-4 text-slate-300" />
                                </button>
                                <button
                                    className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors duration-200"
                                    title="History"
                                >
                                    <History className="w-4 h-4 text-slate-300" />
                                </button>
                                <button
                                    className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors duration-200"
                                    title="Settings"
                                >
                                    <Settings className="w-4 h-4 text-slate-300" />
                                </button>
                                <button
                                    onClick={toggleExpanded}
                                    className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors duration-200 group"
                                    title="Minimize"
                                >
                                    <Minimize2 className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 rounded-2xl border border-white/5 mb-4">
                                    <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold mb-2 text-slate-200">Welcome!</h3>
                                    <p className="text-sm text-slate-400 max-w-xs">
                                        Ask anything. This is now focused on chat like Cline.
                                    </p>
                                </div>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl p-3 ${message.type === 'user'
                                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                                        : 'bg-slate-800/50 text-slate-200 border border-white/5'
                                        }`}
                                >
                                    <p className="text-sm">{message.content}</p>
                                    <p className="text-xs opacity-60 mt-1">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start animate-in slide-in-from-bottom duration-300">
                                <div className="bg-slate-800/50 rounded-2xl p-3 border border-white/5">
                                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-900/50 border-t border-white/10">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask me anything..."
                                className="flex-1 bg-slate-800/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/5 transition-all"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 text-white p-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed group"
                            >
                                <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
