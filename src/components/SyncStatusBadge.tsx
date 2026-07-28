import React from "react";
import {
  Wifi,
  WifiOff,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
} from "lucide-react";
import { SyncStatus } from "../types";

interface SyncStatusBadgeProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  pendingQueueCount: number;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  onOpenSyncManager: () => void;
  onTriggerSyncNow: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  isOnline,
  isSimulatedOffline,
  pendingQueueCount,
  syncStatus,
  lastSyncedAt,
  onOpenSyncManager,
  onTriggerSyncNow,
}) => {
  const effectiveOnline = isOnline && !isSimulatedOffline;

  return (
    <div className="flex items-center gap-1.5">
      {/* Interactive Sync Pill */}
      <button
        onClick={onOpenSyncManager}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer border ${
          syncStatus === "syncing"
            ? "bg-blue-600 text-white border-blue-400 animate-pulse"
            : !effectiveOnline
            ? "bg-amber-500 text-white border-amber-300"
            : pendingQueueCount > 0
            ? "bg-yellow-500 text-slate-900 border-yellow-300"
            : "bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-700"
        }`}
        title="Click to view offline queue & sync manager"
      >
        {syncStatus === "syncing" ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            <span className="hidden sm:inline">Syncing to Cloud...</span>
            <span className="sm:hidden">Syncing...</span>
          </>
        ) : !effectiveOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-100" />
            <span>
              Offline ({pendingQueueCount} queued)
            </span>
          </>
        ) : pendingQueueCount > 0 ? (
          <>
            <CloudUpload className="w-3.5 h-3.5 text-slate-900" />
            <span>
              {pendingQueueCount} Pending Sync
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">Online & Synced</span>
            <span className="sm:hidden">Synced</span>
          </>
        )}

        <Database className="w-3 h-3 opacity-80 ml-0.5" />
      </button>

      {/* Immediate Sync Trigger Button if Queue > 0 */}
      {effectiveOnline && pendingQueueCount > 0 && syncStatus !== "syncing" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTriggerSyncNow();
          }}
          className="bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 p-1 rounded-full text-xs font-bold shadow-xs flex items-center justify-center"
          title="Push offline changes to server now"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
