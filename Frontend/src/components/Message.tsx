"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Message as MessageType, Source } from "@/types";
import { COLLECTION_LABELS } from "@/types";

interface MessageProps {
  message: MessageType;
}

const RetrievalTypeBadge: React.FC<{ type: "hybrid_rag" | "sql_rag" }> = ({ type }) => {
  const labels = {
    hybrid_rag: "Hybrid RAG",
    sql_rag: "SQL RAG",
  };
  const colors = {
    hybrid_rag: "bg-green-100 text-green-800",
    sql_rag: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[type]}`}>
      {labels[type]}
    </span>
  );
};

const SourceCard: React.FC<{ source: Source }> = ({ source }) => {
  const collectionLabel = COLLECTION_LABELS[source.collection] || source.collection;
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 truncate">{source.source_document}</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {collectionLabel}
          </span>
        </div>
        {source.section_title && (
          <p className="mt-1 text-sm text-gray-600">Section: {source.section_title}</p>
        )}
      </div>
    </div>
  );
};

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      role="article"
      aria-label={`${isUser ? "User" : "Assistant"} message`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-gray-200" : "bg-gradient-to-br from-blue-600 to-teal-600"
        }`}
      >
        {isUser ? (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block px-4 py-2.5 rounded-2xl ${
            isUser
              ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-tr-sm"
              : "bg-white border border-gray-100 rounded-tl-sm shadow-sm"
          }`}
        >
          <ReactMarkdown
            className={isUser ? "text-white" : "text-gray-900"}
            components={{
              p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
              code: ({ children }) => (
                <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                  isUser ? "bg-white/20 text-white" : "bg-gray-100 text-gray-800"
                }`}>
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className={`p-3 rounded-lg overflow-x-auto ${
                  isUser ? "bg-white/10" : "bg-gray-900"
                }`}>
                  {children}
                </pre>
              ),
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
              blockquote: ({ children }) => (
                <blockquote className={`border-l-4 pl-3 italic ${
                  isUser ? "border-white/50 text-white/90" : "border-blue-300 text-gray-600"
                }`}>
                  {children}
                </blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Metadata: Retrieval Type + Timestamp */}
        <div className="flex items-center gap-2 mt-1.5 justify-end">
          {message.retrievalType && <RetrievalTypeBadge type={message.retrievalType} />}
          <span className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-2" role="list" aria-label="Source citations">
            {message.sources.map((source, index) => (
              <SourceCard key={`${message.id}-${index}`} source={source} />
            ))}
          </div>
        )}

        {/* RBAC Refusal Indicator */}
        {message.sources && message.sources.length === 0 && message.role === "assistant" && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg" role="alert">
            <div className="flex items-start gap-2">
              <svg className="flex-shrink-0 w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-800">
                {message.content}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}