import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Download,
  HardDrive,
  ShieldAlert,
  Clock,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { PendingSyncAction, SyncStatus } from "../types";
import {
  getIDBMetrics,
  getPendingActionsFromIDB,
  clearAllPendingActionsFromIDB,
  getAllCasesFromIDB,
} from "../lib/indexedDB";

interface SyncManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: (val: boolean) => void;
  pendingQueueCount: number;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  onTriggerSyncNow: () => Promise<void>;
}

export const SyncManagerModal: React.FC<SyncManagerModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  pendingQueueCount,
  syncStatus,
  lastSyncedAt,
  onTriggerSyncNow,
}) => {
  const [metrics, setMetrics] = useState<{
    totalCases: number;
    totalDrafts: number;
    pendingQueueCount: number;
    totalPhotosAndDocs: number;
    estimatedBytes: number;
  }>({
    totalCases: 0,
    totalDrafts: 0,
    pendingQueueCount: 0,
    totalPhotosAndDocs: 0,
    estimatedBytes: 0,
  });

  const [queueItems, setQueueItems] = useState<PendingSyncAction[]>([]);
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "queue" | "storage">("status");

  const effectiveOnline = isOnline && !isSimulatedOffline;

  const loadData = async () => {
    const m = await getIDBMetrics();
    setMetrics(m);
    const q = await getPendingActionsFromIDB();
    setQueueItems(q);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, pendingQueueCount, syncStatus]);

  if (!isOpen) return null;

  const handleSyncClick = async () => {
    setIsSyncingLocal(true);
    await onTriggerSyncNow();
    await loadData();
    setIsSyncingLocal(false);
  };

  const handleExportBackup = async () => {
    const cases = await getAllCasesFromIDB();
    const actions = await getPendingActionsFromIDB();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ cases, pendingActions: actions }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `valpro_indexeddb_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearQueue = async () => {
    if (window.confirm("Are you sure you want to clear the pending sync queue? Unsaved offline field updates will be discarded.")) {
      await clearAllPendingActionsFromIDB();
      await loadData();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div id="sync-manager-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-blue-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Database className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Offline Storage & Sync Manager</h3>
              <p className="text-[11px] text-blue-200">Zero-data-loss local persistence for field surveys</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-full hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab("status")}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "status"
                ? "border-blue-600 text-blue-900 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Wifi className="w-4 h-4 text-blue-600" />
            Sync Status
          </button>

          <button
            onClick={() => setActiveTab("queue")}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "queue"
                ? "border-blue-600 text-blue-900 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            Sync Queue ({queueItems.length})
          </button>

          <button
            onClick={() => setActiveTab("storage")}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "storage"
                ? "border-blue-600 text-blue-900 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <HardDrive className="w-4 h-4 text-blue-600" />
            Local Storage
          </button>
        </div>

        {/* Tab 1: Status & Connectivity */}
        {activeTab === "status" && (
          <div className="p-4 space-y-4 text-xs">
            {/* Connection Banner */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                effectiveOnline
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-3">
                {effectiveOnline ? (
                  <div className="p-2 bg-emerald-600 text-white rounded-lg">
                    <Wifi className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 bg-amber-600 text-white rounded-lg animate-pulse">
                    <WifiOff className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {effectiveOnline
                      ? "Network Active (Connected)"
                      : "No Network Connection (Field Mode Active)"}
                  </h4>
                  <p className="text-[11px] opacity-80">
                    {effectiveOnline
                      ? "Direct cloud synchronization enabled."
                      : "All field observations, photos & geo tags saved locally on device."}
                  </p>
                </div>
              </div>
            </div>

            {/* Simulated Offline Mode Toggle for Testing */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Simulate Low Network / Field Mode</span>
                  <span className="text-[11px] text-slate-500">
                    Force app into offline mode to test survey caching
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSimulatedOffline}
                    onChange={(e) => onToggleSimulatedOffline(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>

            {/* Sync Overview Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <span className="text-gray-500 text-[10px] uppercase font-bold block">
                  Pending Server Sync
                </span>
                <span className="text-xl font-black text-blue-900">
                  {pendingQueueCount} items
                </span>
                <p className="text-[10px] text-blue-700">In offline memory queue</p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-gray-500 text-[10px] uppercase font-bold block">
                  Last Successful Sync
                </span>
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : "Just now"}
                </span>
                <p className="text-[10px] text-emerald-700">All cases backed up</p>
              </div>
            </div>

            {/* Sync Action */}
            <button
              onClick={handleSyncClick}
              disabled={!effectiveOnline || pendingQueueCount === 0 || isSyncingLocal}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingLocal ? "animate-spin" : ""}`} />
              <span>
                {isSyncingLocal
                  ? "Flushing Offline Queue to Cloud..."
                  : pendingQueueCount > 0
                  ? `Sync ${pendingQueueCount} Pending Field Changes Now`
                  : "All Local Data Fully Synced"}
              </span>
            </button>
          </div>
        )}

        {/* Tab 2: Queue Details */}
        {activeTab === "queue" && (
          <div className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="font-bold text-gray-800">
                Queued Offline Actions ({queueItems.length})
              </span>
              {queueItems.length > 0 && (
                <button
                  onClick={handleClearQueue}
                  className="text-red-600 hover:text-red-700 text-[11px] font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Queue
                </button>
              )}
            </div>

            {queueItems.length === 0 ? (
              <div className="py-8 text-center space-y-2 bg-gray-50 rounded-xl border border-gray-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-gray-700">No pending offline queue items</p>
                <p className="text-[11px] text-gray-500">
                  All field modifications have been safely persisted to the backend database.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {queueItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded text-[10px]">
                        {item.actionType}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="font-bold text-gray-800 text-xs">Case ID: #{item.caseId}</p>

                    <p className="text-[10px] text-gray-600 truncate font-mono">
                      Payload: {JSON.stringify(item.payload).substring(0, 80)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Storage Metrics & Backup */}
        {activeTab === "storage" && (
          <div className="p-4 space-y-4 text-xs">
            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <HardDrive className="w-4 h-4 text-blue-600" />
                Local Storage & Offline Data Details
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-white p-2 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-gray-500 block">Total Cases</span>
                  <span className="font-bold text-sm text-gray-900">{metrics.totalCases}</span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-gray-500 block">Survey Drafts</span>
                  <span className="font-bold text-sm text-gray-900">{metrics.totalDrafts}</span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-gray-500 block">Photos & Docs</span>
                  <span className="font-bold text-sm text-emerald-700">{metrics.totalPhotosAndDocs}</span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-gray-500 block">Storage Used</span>
                  <span className="font-bold text-sm text-blue-700">
                    {formatBytes(metrics.estimatedBytes)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-gray-800 block">Offline Backup & Export</span>
              <p className="text-[11px] text-gray-600">
                Download a complete JSON snapshot of all locally cached cases and survey drafts stored on your device.
              </p>

              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Local Data Backup (.json)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
