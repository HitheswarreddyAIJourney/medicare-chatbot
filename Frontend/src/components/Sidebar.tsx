"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, ROLE_COLLECTIONS, COLLECTION_LABELS, Role } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const role = user.role as Role;
  const collections = ROLE_COLLECTIONS[role] || [];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 border-r border-white/10 bg-slate-950/95 text-slate-100 shadow-2xl shadow-black/30 transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        role="complementary"
        aria-label="User info and accessible collections"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">MediBot</h2>
                  <p className="text-xs text-gray-500">MediAssist Health Network</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user.fullName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-white">{user.fullName || user.username}</p>
                <p className="truncate text-sm text-slate-400">@{user.username}</p>
              </div>
            </div>

            {/* Role Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-teal-500/20 px-3 py-1 text-sm font-medium text-teal-300">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {ROLE_LABELS[role] || role}
              </span>
            </div>
          </div>

          {/* Accessible Collections */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Accessible Collections
            </h3>
            <p className="mb-4 text-sm text-slate-400">
              Your role determines which document collections you can query. RBAC is enforced at the retrieval layer.
            </p>

            <ul className="space-y-2" role="list" aria-label="Accessible document collections">
              {collections.map((collection) => (
                <li key={collection}>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-white">{COLLECTION_LABELS[collection] || collection}</p>
                      <p className="truncate text-xs text-slate-400">{collection}</p>
                    </div>
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </li>
              ))}
            </ul>

            {/* All collections reference */}
            <details className="mt-4 group">
              <summary className="flex cursor-pointer items-center gap-2 text-sm text-slate-400 hover:text-white">
                <svg className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                All Collections Reference
              </summary>
              <ul className="mt-2 space-y-1.5 border-l border-white/10 pl-6" role="list">
                {Object.entries(COLLECTION_LABELS).map(([key, label]) => (
                  <li key={key} className="text-sm text-slate-400">
                    <span className="font-medium text-slate-200">{label}</span> <span className="text-slate-500">({key})</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          {/* Logout Button */}
          <div className="border-t border-white/10 p-4">
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}