import React from "react";
import {
  Home,
  FilePlus,
  Compass,
  Wrench,
  LogOut,
  User,
  X,
  Sparkles,
  ShieldCheck,
  Copyright,
  Database,
  Building,
  MapPin,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { UserProfile, SyncStatus } from "../types";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  currentStatus: boolean;
  onToggleStatus: () => void;
  inspectorName?: string;
  brandName?: string;
  copyrightText?: string;
  onOpenBranding?: () => void;
  onOpenSyncManager?: () => void;
  pendingQueueCount?: number;
  syncStatus?: SyncStatus;
  syncProgress?: {
    completedItems: number;
    totalItems: number;
    percent: number;
    activeLabel?: string;
  };
  onTriggerSyncNow?: () => Promise<void>;
  isOnline?: boolean;
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentStatus,
  onToggleStatus,
  inspectorName = "Ratnesh",
  brandName = "DRR",
  copyrightText = "Copyright © 2026 DRR Technologies Inc. All Rights Reserved.",
  onOpenBranding,
  onOpenSyncManager,
  pendingQueueCount = 0,
  syncStatus = "synced",
  syncProgress,
  onTriggerSyncNow,
  isOnline = true,
  currentUser,
  onOpenLogin,
}) => {
  if (!isOpen) return null;

  return (
    <div id="drr-drawer-backdrop" className="fixed inset-0 z-50 flex font-sans">
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content panel */}
      <div
        id="drr-drawer-content"
        className="relative w-80 max-w-[85%] bg-white border-r border-slate-200 text-slate-900 h-full shadow-2xl flex flex-col z-10 transform transition-transform duration-300 ease-in-out"
      >
        {/* Top User Profile Header */}
        <div className="bg-slate-50 text-slate-900 p-5 relative border-b border-slate-200">
          <button
            id="btn-close-drawer"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Avatar */}
          <div
            className="flex items-center gap-3 mb-4 mt-1 cursor-pointer group"
            onClick={() => {
              if (onOpenLogin) onOpenLogin();
              onClose();
            }}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs border border-blue-200 group-hover:scale-105 transition-transform">
              <User className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-wide">
                {currentUser ? currentUser.name : inspectorName}
              </h3>
              <p className="text-[11px] text-blue-700 flex items-center gap-1 mt-0.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="capitalize">{currentUser?.role || "Field Inspector"}</span>
              </p>
              <p className="text-[10px] text-slate-600 font-extrabold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span>{currentUser?.branch || "Delhi NCR"} Branch</span>
              </p>
            </div>
          </div>

          {/* On Duty Toggle Switch */}
          <div className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5 border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-700">
              Status: <span className={currentStatus ? "text-emerald-600 font-extrabold" : "text-slate-400"}>{currentStatus ? "ON DUTY" : "OFF DUTY"}</span>
            </span>
            <button
              id="btn-toggle-duty"
              onClick={onToggleStatus}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                currentStatus ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  currentStatus ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Detailed Site Survey Data & Media Sync Progress Bar */}
          <div className="mt-3.5 bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {syncStatus === "syncing" ? (
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                ) : pendingQueueCount > 0 ? (
                  <CloudUpload className="w-4 h-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                  Data & Media Upload
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  syncStatus === "syncing"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : pendingQueueCount > 0
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {syncStatus === "syncing"
                  ? `${syncProgress?.percent || 0}%`
                  : pendingQueueCount > 0
                  ? `${pendingQueueCount} Queued`
                  : "All Synced"}
              </span>
            </div>

            {/* Visual Animated Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    syncStatus === "syncing"
                      ? "bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 animate-pulse"
                      : pendingQueueCount > 0
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${
                      syncStatus === "syncing"
                        ? syncProgress?.percent || 5
                        : pendingQueueCount > 0
                        ? Math.max(10, 100 - pendingQueueCount * 15)
                        : 100
                    }%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-700 font-semibold">
                <span>
                  {syncStatus === "syncing"
                    ? `${syncProgress?.completedItems || 0} / ${syncProgress?.totalItems || pendingQueueCount} site files`
                    : pendingQueueCount > 0
                    ? `${pendingQueueCount} items pending upload`
                    : "All site data fully synchronized"}
                </span>
                <span className="text-blue-700 font-bold">
                  {syncStatus === "syncing"
                    ? `${syncProgress?.percent || 0}%`
                    : pendingQueueCount > 0
                    ? "Pending"
                    : "Synced"}
                </span>
              </div>
            </div>

            {/* Sub-label & Direct Upload Button */}
            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <div className="text-slate-700 truncate max-w-[170px] font-medium" title={syncProgress?.activeLabel}>
                {syncProgress?.activeLabel || (
                  pendingQueueCount > 0
                    ? "Survey forms, satellite maps & photos"
                    : "All site observations backed up"
                )}
              </div>
              {onTriggerSyncNow && isOnline && pendingQueueCount > 0 && syncStatus !== "syncing" && (
                <button
                  onClick={onTriggerSyncNow}
                  className="text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-sm active:scale-95"
                >
                  Sync Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <button
            id="nav-home"
            onClick={() => {
              onNavigate("dashboard");
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors font-bold text-xs text-left group"
          >
            <Home className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Home Dashboard</span>
          </button>

          <button
            id="nav-create-case"
            onClick={() => {
              onNavigate("create-case");
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors font-bold text-xs text-left group"
          >
            <FilePlus className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Create New Case</span>
          </button>

          <button
            id="nav-ai-assistant"
            onClick={() => {
              onNavigate("ai-assistant");
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors font-extrabold text-xs text-left group border border-amber-500/30"
          >
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
            <span className="flex items-center justify-between w-full">
              <span>AI Inspector Assistant</span>
              <span className="text-[9px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                Gemini
              </span>
            </span>
          </button>

          <button
            id="nav-sale-comparable"
            onClick={() => {
              onNavigate("sale-comparable");
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors font-bold text-xs text-left group"
          >
            <Compass className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Sale Comparable Market Data</span>
          </button>

          <button
            id="nav-admin-console"
            onClick={() => {
              onNavigate("admin-console");
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 transition-colors font-extrabold text-xs text-left group border border-cyan-800/50"
          >
            <Building className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="flex items-center justify-between w-full">
              <span>Admin & Template Console</span>
              <span className="text-[9px] bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                DOCX/XLSX
              </span>
            </span>
          </button>

          <button
            id="nav-troubleshoot"
            onClick={() => {
              onNavigate("troubleshoot");
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors font-bold text-xs text-left group"
          >
            <Wrench className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Troubleshoot & Offline Storage</span>
          </button>

          {onOpenSyncManager && (
            <button
              onClick={() => {
                onOpenSyncManager();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors font-bold text-xs text-left group"
            >
              <Database className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="flex items-center justify-between w-full">
                <span>Sync Queue Manager</span>
                {pendingQueueCount > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    {pendingQueueCount}
                  </span>
                )}
              </span>
            </button>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
          {onOpenBranding && (
            <button
              onClick={() => {
                onOpenBranding();
                onClose();
              }}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-[11px] font-bold flex items-center justify-between transition-colors"
            >
              <span>Branding & Header Label</span>
              <Copyright className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}

          <p className="text-[10px] text-slate-500 leading-tight">
            {copyrightText}
          </p>
        </div>
      </div>
    </div>
  );
};
