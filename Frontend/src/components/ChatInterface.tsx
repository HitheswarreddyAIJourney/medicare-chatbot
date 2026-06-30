"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Message } from "./Message";
import { Sidebar } from "./Sidebar";
import { chat } from "@/lib/api";
import type { Message as MessageType, Source, ChatResponse } from "@/types";

interface ChatInterfaceProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function ChatInterface({ sidebarOpen, onSidebarToggle }: ChatInterfaceProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !token) return;

    const userMessage: MessageType = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const question = input.trim();
    setInput("");
    setIsLoading(true);
    setError("");
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response: ChatResponse = await chat(question, token);

      const assistantMessage: MessageType = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        retrievalType: response.retrieval_type,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = error.response?.data?.detail || error.message || "Failed to get response. Please try again.";
      setError(errorMessage);

      const errorResponse: MessageType = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  // Welcome message for new users
  if (messages.length === 0) {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Welcome to MediBot, ${user?.fullName || user?.username}! 👋\n\nI'm your intelligent assistant for MediAssist Health Network. I can help you with:\n\n• **Clinical protocols & drug formularies** (doctors)\n• **Nursing procedures & patient care** (nurses)\n• **Insurance billing codes & claims** (billing executives)\n• **Equipment manuals & maintenance** (technicians)\n• **All collections** (admins)\n\nAsk me a question to get started!`,
        timestamp: new Date(),
      },
    ]);
  }

  return (
    <div className="flex h-screen bg-[#07111f] text-slate-100 lg:h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={onSidebarToggle} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_35%),linear-gradient(135deg,_#07111f_0%,_#0f172a_100%)]">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <button
              onClick={onSidebarToggle}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
              aria-label="Open sidebar"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h1 className="font-semibold text-white">MediBot</h1>
              <p className="text-xs text-slate-400">
                {user ? `Logged in as ${user.fullName || user.username} (${user.role})` : "Not logged in"}
              </p>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MediBot</h1>
              <p className="text-sm text-slate-400">MediAssist Health Network Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
              <span className="text-xs text-slate-400">Role:</span>
              <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-medium text-teal-300 capitalize">
                {user?.role.replace("_", " ") || "guest"}
              </span>
            </div>
          </div>
        </header>

        {/* Composer */}
        <form onSubmit={handleSend} className="border-t border-white/10 bg-slate-950/70 p-4 backdrop-blur lg:p-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-3">
            <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-2xl shadow-black/30">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about clinical protocols, nursing procedures, billing codes, equipment manuals..."
                rows={1}
                className="max-h-[180px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 disabled:bg-transparent"
                disabled={isLoading}
                aria-label="Chat input"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !token}
                className="flex-shrink-0 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 p-3 text-white transition hover:from-teal-400 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                {isLoading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-slate-500">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </form>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border border-red-400/30 bg-red-950/90 p-4 shadow-2xl shadow-black/30" role="alert">
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-200">{error}</p>
              <button
                onClick={() => setError("")}
                className="ml-2 text-red-300 hover:text-red-100"
                aria-label="Dismiss error"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}