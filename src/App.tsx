import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Drawer } from "./components/Drawer";
import { CaseDashboard } from "./components/CaseDashboard";
import { CaseDetailCard } from "./components/CaseDetailCard";
import { SurveyWizard } from "./components/SurveyWizard";
import { CreateCaseModal } from "./components/CreateCaseModal";
import { AIInspectorAssistant } from "./components/AIInspectorAssistant";
import { SaleComparablePage } from "./components/SaleComparablePage";
import { TroubleshootPage } from "./components/TroubleshootPage";
import { AdminConsole } from "./components/AdminConsole";
import { CustomBrandingModal } from "./components/CustomBrandingModal";
import { SyncStatusBadge } from "./components/SyncStatusBadge";
import { SyncManagerModal } from "./components/SyncManagerModal";
import { LoginModal } from "./components/LoginModal";
import { ValuationCase, SyncStatus, UserProfile } from "./types";
import {
  saveCaseToIDB,
  saveCasesToIDBBulk,
  getAllCasesFromIDB,
  enqueuePendingAction,
  getPendingActionsFromIDB,
  removePendingActionFromIDB,
} from "./lib/indexedDB";

export default function App() {
  const [cases, setCases] = useState<ValuationCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ValuationCase | null>(null);
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isSyncManagerOpen, setIsSyncManagerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Current Logged In User State (Persisted in localStorage)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("drr_logged_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      id: "USR-001",
      name: "Ratnesh Kumar (Engineer)",
      email: "ratnesh.delhi@drrconsultants.in",
      phone: "9812345670",
      role: "engineer",
      branch: "Delhi NCR",
    };
  });

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem("drr_logged_user", JSON.stringify(user));
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("drr_logged_user");
  };

  // Network & Sync States
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [lastSavedNotice, setLastSavedNotice] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<{
    completedItems: number;
    totalItems: number;
    percent: number;
    activeLabel?: string;
  }>({
    completedItems: 0,
    totalItems: 0,
    percent: 100,
  });

  // Custom Branding & Copyright State
  const [brandName, setBrandName] = useState<string>("drr");
  const [copyrightText, setCopyrightText] = useState<string>(
    "Copyright © 2026 DRR Technologies Inc. All Rights Reserved."
  );

  const effectiveOnline = isOnline && !isSimulatedOffline;

  // Refresh pending queue counter
  const refreshQueueCount = useCallback(async () => {
    const actions = await getPendingActionsFromIDB();
    setPendingQueueCount(actions.length);
    if (actions.length > 0 && syncStatus !== "syncing") {
      setSyncStatus("pending_sync");
    } else if (actions.length === 0 && syncStatus !== "syncing") {
      setSyncStatus("synced");
    }
  }, [syncStatus]);

  // Flush pending sync queue to backend server
  const triggerSyncWithServer = useCallback(async () => {
    if (!effectiveOnline) return;

    setSyncStatus("syncing");
    try {
      const actions = await getPendingActionsFromIDB();
      const total = actions.length || 1;
      setSyncProgress({
        completedItems: 0,
        totalItems: total,
        percent: 0,
        activeLabel: "Preparing queue...",
      });

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const actionTitle =
          action.actionType === "FINISH_SURVEY"
            ? "Site Survey Data & Photos"
            : action.actionType === "CREATE_CASE"
            ? "New Valuation Case File"
            : "Property Updates & Geo-Tag";

        setSyncProgress({
          completedItems: i,
          totalItems: total,
          percent: Math.round((i / total) * 100),
          activeLabel: `Uploading ${actionTitle} (Case #${action.caseId})`,
        });

        if (action.actionType === "UPDATE_CASE" || action.actionType === "FINISH_SURVEY") {
          await fetch(`/api/cases/${action.caseId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action.payload),
          });
          await removePendingActionFromIDB(action.id);
        } else if (action.actionType === "CREATE_CASE") {
          await fetch("/api/cases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action.payload),
          });
          await removePendingActionFromIDB(action.id);
        }

        setSyncProgress({
          completedItems: i + 1,
          totalItems: total,
          percent: Math.round(((i + 1) / total) * 100),
          activeLabel: `Uploaded ${i + 1} of ${total} items`,
        });
      }

      // Re-fetch latest from server
      const res = await fetch("/api/cases");
      const data = await res.json();
      if (data.success && Array.isArray(data.cases)) {
        setCases(data.cases);
        await saveCasesToIDBBulk(data.cases);
      }

      setSyncStatus("synced");
      setLastSyncedAt(new Date());
      setSyncProgress({
        completedItems: total,
        totalItems: total,
        percent: 100,
        activeLabel: "All data & media files uploaded successfully",
      });
      await refreshQueueCount();
    } catch (err) {
      console.error("[Sync] Error syncing queued offline actions:", err);
      setSyncStatus("error");
      setSyncProgress((prev) => ({
        ...prev,
        activeLabel: "Upload interrupted - click retry",
      }));
    }
  }, [effectiveOnline, refreshQueueCount]);

  // Network event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSyncWithServer();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline_draft");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSyncWithServer]);

  // Initial load: Try server first, fallback to IndexedDB if offline
  useEffect(() => {
    const loadCases = async () => {
      try {
        if (effectiveOnline) {
          const res = await fetch("/api/cases");
          const data = await res.json();
          if (data.success && Array.isArray(data.cases)) {
            setCases(data.cases);
            await saveCasesToIDBBulk(data.cases);
          } else {
            throw new Error("Invalid API response");
          }
        } else {
          throw new Error("Offline mode");
        }
      } catch (err) {
        console.warn("[App] Loading cases from local IndexedDB fallback...", err);
        const localCases = await getAllCasesFromIDB();
        if (localCases && localCases.length > 0) {
          setCases(localCases);
        }
      } finally {
        await refreshQueueCount();
      }
    };

    loadCases();
  }, []);

  const handleSelectCase = (caseItem: ValuationCase) => {
    setSelectedCase(caseItem);
    setCurrentView("case-detail");
  };

  // Case update handler with IndexedDB persistence
  const handleUpdateCase = async (updatedCase: ValuationCase) => {
    setSelectedCase(updatedCase);
    setCases((prev) =>
      prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
    );

    // Save immediately to IndexedDB
    await saveCaseToIDB(updatedCase, effectiveOnline ? "synced" : "pending_sync");

    if (effectiveOnline) {
      try {
        await fetch(`/api/cases/${updatedCase.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCase),
        });
        setLastSavedNotice("Synced to Cloud");
      } catch (err) {
        console.warn("[App] Failed to sync to server, queueing in IDB:", err);
        await enqueuePendingAction({
          actionType: "UPDATE_CASE",
          caseId: updatedCase.id,
          payload: updatedCase,
        });
        setLastSavedNotice("Saved to Offline Queue");
      }
    } else {
      await enqueuePendingAction({
        actionType: "UPDATE_CASE",
        caseId: updatedCase.id,
        payload: updatedCase,
      });
      setLastSavedNotice("Saved to Local Storage (Offline Mode)");
    }

    await refreshQueueCount();
    setTimeout(() => setLastSavedNotice(null), 3000);
  };

  // Create case handler with IndexedDB offline support
  const handleCreateNewCase = async (newCaseData: Partial<ValuationCase>) => {
    if (effectiveOnline) {
      try {
        const res = await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCaseData),
        });
        const data = await res.json();
        if (data.success && data.case) {
          setCases((prev) => [data.case, ...prev]);
          await saveCaseToIDB(data.case, "synced");
          setSelectedCase(data.case);
          setCurrentView("case-detail");
          return;
        }
      } catch (err) {
        console.warn("[App] Creating case offline in IndexedDB queue...", err);
      }
    }

    // Offline case creation fallback
    const offlineId = `${Math.floor(200 + Math.random() * 800)}_OFF`;
    const newOfflineCase: ValuationCase = {
      id: offlineId,
      institution: newCaseData.institution || "Hinduja Housing Finance",
      customerName: newCaseData.customerName || "Offline Customer",
      loanType: newCaseData.loanType || "Home Loan",
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      phone: newCaseData.phone || "9876543210",
      address: newCaseData.address || "Field Location",
      remarks: "Created offline in field",
      status: "Open",
      completedSiteVisit: false,
      propertyType: newCaseData.propertyType || "Flat",
      localityData: {
        roadApproachCondition: "Good",
        connections: "Available",
        propertyElectricity: "Yes",
        ownershipType: "Freehold",
        roadWidthFt: "30",
        lift: "Available",
        developmentType: "Developing",
        fallingWithin: "MCD Limits",
        closestLandmark: "Main Market",
        propertyNumbering: "Properly Demarcated",
        surroundingOccupancy: "High",
        localityStatus: "Residential Zone",
      },
      observationData: {
        communityDominated: "Mixed",
        communityPercentage: "50%",
        unitsOnFloor: "4",
        totalUnitsInBuilding: "16",
        sellerNameAtSite: "On-site Owner",
        buildingOccupancy: "Self Occupied",
        structureType: "RCC Framed Structure",
        contactMetName: newCaseData.customerName || "Borrower",
        contactMetPhone: newCaseData.phone || "9876543210",
        contactMetRelation: "Self",
        electricityMeterNo: "ELM-9831",
        electricityBillMeterNo: "ELM-9831",
        addressMatchesTitleDocs: "Yes",
        presentlyOccupiedBy: "Owner",
        negativeRemarks: "None",
        plotDemarcated: "Yes",
        disputeObserved: "No",
        internalVisitDone: "Yes",
        previouslyValuatedForOtherBanks: "No",
        sewerageDrainage: "Connected",
        yearOfConstruction: "2019",
        ageOfBuilding: "7",
        totalFloors: "4",
        landShape: "Regular",
      },
      identityData: {
        boundaries: {
          front: { direction: "North", measurement: "30 ft", details: "Road 30 Wide" },
          left: { direction: "East", measurement: "50 ft", details: "Plot 102" },
          right: { direction: "West", measurement: "50 ft", details: "Plot 104" },
          rear: { direction: "South", measurement: "30 ft", details: "Service Lane" },
        },
        photos: { front: null, left: null, right: null, rear: null },
      },
      valuationData: {
        valuationType: "Flat valuation",
        buildingDepth: "50",
        buildingFrontWidth: "30",
        landAreaSqFt: "1500",
        landRatePerSqFt: "4000",
        buaSqFt: "1200",
        constructionRatePerSqFt: "2000",
        sbuaSqFt: "1400",
        flatRatePerSqFt: "4500",
        fairMarketValue: 6300000,
        realizableValue: 5670000,
        distressValue: 5040000,
      },
      mediaAttachments: {
        selfie: null,
        elevation: null,
        road: null,
        dataSheet: null,
        photosVideos: [],
        voiceNotes: [],
        docs: [],
      },
      geoData: {
        addressAsPerSiteVisit: newCaseData.address || "Field Location",
        latitude: "28.7236983",
        longitude: "77.1475839",
      },
      finalSubmission: null,
    };

    setCases((prev) => [newOfflineCase, ...prev]);
    await saveCaseToIDB(newOfflineCase, "pending_sync");
    await enqueuePendingAction({
      actionType: "CREATE_CASE",
      caseId: newOfflineCase.id,
      payload: newOfflineCase,
    });
    setSelectedCase(newOfflineCase);
    setCurrentView("case-detail");
    await refreshQueueCount();
  };

  const handleFinishSurvey = async () => {
    if (selectedCase) {
      const completed = { ...selectedCase, status: "Completed" as const, completedSiteVisit: true };
      await handleUpdateCase(completed);
    }

    alert(
      `Property Inspection Survey for Case #${selectedCase?.id} completed & saved locally!\nValuation Status: COMPLETED.\nGenerating bank-ready appraisal report PDF...\n${copyrightText}`
    );
    setCurrentView("dashboard");
  };

  const handleApplyAIExtractedData = (extracted: Partial<ValuationCase>) => {
    if (!selectedCase) return;
    const updated = {
      ...selectedCase,
      ...extracted,
    };
    handleUpdateCase(updated);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col antialiased">
      {/* App Header with Sync Status Indicator */}
      <Header
        brandName={brandName}
        showBack={currentView !== "dashboard"}
        onBack={() => {
          if (currentView === "survey-wizard") {
            setCurrentView("case-detail");
          } else {
            setCurrentView("dashboard");
          }
        }}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onGoHome={() => setCurrentView("dashboard")}
        activeViewTitle={
          currentView === "survey-wizard"
            ? "Site Survey"
            : currentView === "case-detail"
            ? "Site Visit"
            : undefined
        }
        syncStatusElement={
          <SyncStatusBadge
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            pendingQueueCount={pendingQueueCount}
            syncStatus={syncStatus}
            lastSyncedAt={lastSyncedAt}
            onOpenSyncManager={() => setIsSyncManagerOpen(true)}
            onTriggerSyncNow={triggerSyncWithServer}
          />
        }
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Save Notification Toast */}
      {lastSavedNotice && (
        <div className="bg-emerald-600 text-white text-center py-1.5 px-3 text-xs font-bold shadow-xs animate-fade-in flex items-center justify-center gap-2">
          <span>💾 {lastSavedNotice}</span>
        </div>
      )}

      {/* Offline Mode Alert Bar if offline */}
      {!effectiveOnline && (
        <div className="bg-amber-500 text-slate-900 px-3 py-1.5 text-xs font-bold flex items-center justify-between border-b border-amber-600">
          <span className="flex items-center gap-1.5">
            ⚠️ Field Offline Mode Active - Observations saved in local offline storage
          </span>
          <button
            onClick={() => setIsSyncManagerOpen(true)}
            className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-extrabold hover:bg-slate-800 cursor-pointer"
          >
            Manage Storage ({pendingQueueCount})
          </button>
        </div>
      )}

      {/* Slide-out Navigation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={(view) => {
          if (view === "create-case") {
            setIsCreateModalOpen(true);
          } else if (view === "ai-assistant") {
            setIsAIAssistantOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        currentStatus={isOnDuty}
        onToggleStatus={() => setIsOnDuty(!isOnDuty)}
        inspectorName={currentUser?.name || "Ratnesh"}
        brandName={brandName}
        copyrightText={copyrightText}
        onOpenBranding={() => setIsBrandingModalOpen(true)}
        onOpenSyncManager={() => setIsSyncManagerOpen(true)}
        pendingQueueCount={pendingQueueCount}
        syncStatus={syncStatus}
        syncProgress={syncProgress}
        onTriggerSyncNow={triggerSyncWithServer}
        isOnline={effectiveOnline}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === "dashboard" && (
          <CaseDashboard
            cases={cases}
            onSelectCase={handleSelectCase}
            onCreateNewCase={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentView === "case-detail" && selectedCase && (
          <CaseDetailCard
            caseItem={selectedCase}
            onUpdateCase={handleUpdateCase}
            onStartSurvey={() => setCurrentView("survey-wizard")}
            onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
          />
        )}

        {currentView === "survey-wizard" && selectedCase && (
          <SurveyWizard
            caseItem={selectedCase}
            onUpdateCase={handleUpdateCase}
            onFinishSurvey={handleFinishSurvey}
            onGoHome={() => setCurrentView("dashboard")}
            onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
          />
        )}

        {currentView === "sale-comparable" && <SaleComparablePage />}

        {currentView === "admin-console" && (
          <AdminConsole
            cases={cases}
            onNavigateToCase={(c) => {
              setSelectedCase(c);
              setCurrentView("case-detail");
            }}
            onCreateCase={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentView === "troubleshoot" && <TroubleshootPage />}
      </main>

      {/* Create Case Modal */}
      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCase={handleCreateNewCase}
      />

      {/* AI Assistant Modal */}
      {isAIAssistantOpen && (
        <AIInspectorAssistant
          currentCase={selectedCase || cases[0]}
          onApplyExtractedData={handleApplyAIExtractedData}
          onClose={() => setIsAIAssistantOpen(false)}
        />
      )}

      {/* Custom Branding & Copyright Modal */}
      <CustomBrandingModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        brandName={brandName}
        copyrightText={copyrightText}
        onSaveBranding={(newBrand, newCopyright) => {
          setBrandName(newBrand);
          setCopyrightText(newCopyright);
        }}
      />

      {/* IndexedDB Offline Sync Manager Modal */}
      <SyncManagerModal
        isOpen={isSyncManagerOpen}
        onClose={() => setIsSyncManagerOpen(false)}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={setIsSimulatedOffline}
        pendingQueueCount={pendingQueueCount}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        onTriggerSyncNow={triggerSyncWithServer}
      />

      {/* Login & Branch Switcher Modal */}
      {isLoginModalOpen && (
        <LoginModal
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
}

