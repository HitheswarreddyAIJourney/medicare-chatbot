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
    <div className="flex h-screen bg-gray-50 lg:h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={onSidebarToggle} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onSidebarToggle}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h1 className="font-semibold text-gray-900">MediBot</h1>
              <p className="text-xs text-gray-500">
                {user ? `Logged in as ${user.fullName || user.username} (${user.role})` : "Not logged in"}
              </p>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MediBot</h1>
              <p className="text-sm text-gray-500">MediAssist Health Network Assistant</p>
            </div>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500">Role:</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                {user?.role.replace("_", " ") || "guest"}
              </span>
            </div>
            <button
              onClick={onSidebarToggle}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 lg:hidden"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pt-20 lg:pt-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 right-4 z-50 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg max-w-md animate-slide-in" role="alert">
            <div className="flex items-start gap-2">
              <svg className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError("")}
                className="ml-2 text-red-500 hover:text-red-700"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 lg:p-6 bg-white border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about clinical protocols, nursing procedures, billing codes, equipment manuals..."
                rows={1}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-gray-50 disabled:bg-gray-100 max-h-[150px]"
                disabled={isLoading}
                aria-label="Chat input"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !token}
                className="flex-shrink-0 p-3 bg-gradient-to-r from-blue-teal text-white rounded-xl hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Send message"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}