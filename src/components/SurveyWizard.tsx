import React, { useState, useEffect, useRef } from "react";
import { PropertyLocationSatelliteCapture } from "./PropertyLocationSatelliteCapture";
import {
  FileText,
  User,
  ShieldCheck,
  Building,
  Users,
  Zap,
  Navigation,
  Layers,
  Camera,
  CheckCircle2,
  MapPin,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Database,
  ArrowRight,
  ArrowLeft,
  Home,
  Upload,
  Search,
  Check,
  AlertTriangle,
  FolderCheck,
  HelpCircle,
  Lock,
} from "lucide-react";
import {
  ValuationCase,
  FullSiteVisitFormat,
  GeneralInfo,
  PropertyIdentification,
  LegalStatusLocality,
  BuildingSpecifications,
  OccupancyUsage,
  AmenitiesUtilities,
  NeighborhoodSurroundings,
  FloorAccommodationRow,
  DocumentationMarketData,
  FinalRemarksSubmissions,
  DealerInquiry,
  TenantDetail,
  CategorizedMedia,
} from "../types";
import { saveSurveyDraftToIDB, getSurveyDraftFromIDB } from "../lib/indexedDB";
import { GPSCameraModal } from "./GPSCameraModal";

interface SurveyWizardProps {
  caseItem: ValuationCase;
  onUpdateCase: (updated: ValuationCase) => void;
  onFinishSurvey: () => void;
  onGoHome: () => void;
  onOpenAIAssistant: () => void;
}

const TABS = [
  { id: "sec1", label: "I. General", icon: FileText, title: "I. General Information" },
  { id: "sec2", label: "II. Property ID", icon: User, title: "II. Property Identification & Verification" },
  { id: "sec3", label: "III. Legal & Locality", icon: ShieldCheck, title: "III. Legal Status & Locality" },
  { id: "sec4", label: "IV. Specs", icon: Building, title: "IV. Property & Building Specifications" },
  { id: "sec5", label: "V. Occupancy", icon: Users, title: "V. Occupancy & Tenant Details" },
  { id: "sec6", label: "VI. Utilities", icon: Zap, title: "VI. Amenities & Utilities" },
  { id: "sec7", label: "VII. Surroundings", icon: Navigation, title: "VII. Neighborhood & Surroundings" },
  { id: "sec8", label: "VIII. Floor Matrix", icon: Layers, title: "VIII. Floor-wise Accommodation Details" },
  { id: "sec9", label: "IX. Media & Dealer", icon: Camera, title: "IX. Documentation & Market Data" },
  { id: "sec10", label: "X. Remarks", icon: CheckCircle2, title: "X. Final Remarks & Submissions" },
];

export const SurveyWizard: React.FC<SurveyWizardProps> = ({
  caseItem,
  onUpdateCase,
  onFinishSurvey,
  onGoHome,
  onOpenAIAssistant,
}) => {
  const [activeTab, setActiveTab] = useState<string>("sec1");

  // Initializing 10-Section Form State
  const initialFormat: FullSiteVisitFormat = caseItem.siteVisitFormat || {
    generalInfo: {
      company: "Valuation & Inspection Firm",
      engineerName: "Er. Field Inspector",
      clientName: caseItem.customerName || "Borrower Name",
      bankName: caseItem.institution || "Bank Name",
      visitDate: new Date().toISOString().split("T")[0],
    },
    propertyIdentification: {
      propertyAddress: caseItem.address || "",
      addressMatch: "YES",
      personMetAndId: "Person Met at Site (ID Verified)",
      relationWithClient: "Owner",
      mobileNumber: caseItem.phone || "",
      identificationMethod: "Contact Person",
    },
    legalStatusLocality: {
      ownership: "FREEHOLD",
      colonyStatus: "REGULARIZED",
      localityType: "RESIDENTIAL",
      location: "CORNER",
    },
    buildingSpecifications: {
      propertyType: caseItem.propertyType || "BUILDER FLAT",
      roofType: "RCC",
      plotAreaSqYd: "150",
      plotFrontFt: "30",
      plotDepthFt: "45",
      plotShape: "REGULAR",
      numberOfFloors: "4",
      entirePropertyShown: "YES",
      stiltFloorHeightFt: "9.5",
      floorHeightFt: "10",
      floorApproachIndependent: "YES",
      unitsOnEachFloor: "2",
      unitsInBuilding: "8",
      propertyAge: "5",
      electricalFitting: "Concealed",
      flooring: "Tile",
      landmark: "Near Main Park / School",
      demarcation: "proper demarcated",
    },
    occupancyUsage: {
      occupationStatus: "OWNER",
      ownerAtSite: "YES",
      buildingOccupancy: "Self-occupied by owner",
      usage: "RESIDENTIAL",
      numberOfTenants: "0",
      tenants: [],
    },
    amenitiesUtilities: {
      lift: "YES",
      meterInstalled: "YES",
      billProvided: "YES",
      meterNumber: "1049285721",
      meterMatchesBill: "YES",
      sewerConnection: "YES",
    },
    neighborhoodSurroundings: {
      roadWidthFt: "25",
      roadType: "BITUMEN",
      occupancyInLocalityPct: "85",
      developmentInLocalityPct: "90",
      dominantCommunityName: "Mixed Residential",
      dominantCommunityPct: "100",
      negativeRemarks: [],
      negativeRemarksNotes: "No major adverse factors noted.",
    },
    floorAccommodationRows: [
      { floorLevel: "Stilt Floor", accommodation: "Park Area & DU / Shop", carpetOpenBUA: "600 SQ FT", occupiedBy: "Common Use", usage: "PARK AREA", structure: "RCC" },
      { floorLevel: "Ground Floor", accommodation: "2 BHK Flat", carpetOpenBUA: "900 SQ FT BUA", occupiedBy: "Owner", usage: "RESIDENTIAL", structure: "RCC" },
      { floorLevel: "1st Floor", accommodation: "2 BHK Flat", carpetOpenBUA: "900 SQ FT BUA", occupiedBy: "Tenant", usage: "RESIDENTIAL", structure: "RCC" },
      { floorLevel: "2nd Floor", accommodation: "2 BHK Flat", carpetOpenBUA: "900 SQ FT BUA", occupiedBy: "Owner", usage: "RESIDENTIAL", structure: "RCC" },
      { floorLevel: "3rd Floor", accommodation: "2 BHK Flat", carpetOpenBUA: "900 SQ FT BUA", occupiedBy: "Tenant", usage: "RESIDENTIAL", structure: "RCC" },
    ],
    documentationMarketData: {
      internalPicsTaken: "YES",
      roadPhotoTaken: true,
      outsideNameplateTaken: true,
      selfieTaken: true,
      dealerInquiries: [
        {
          id: "d1",
          dealerName: "Local Real Estate Dealer",
          mobileNo: "9876543210",
          landOrShopRate: "₹45,000 / SQ.YD",
          oldFlatRate: "₹4,200 / SQ.FT",
          newFlatRate: "₹4,800 / SQ.FT",
          disputeInfo: "No litigation reported",
        },
      ],
      categorizedMedia: {
        roadPhotos: [],
        outsideNameplatePhotos: [],
        selfiePhotos: [],
        internalPhotos: [],
        generalPhotos: [],
      },
    },
    finalRemarksSubmissions: {
      remarksWithDeviation: "No major plan deviation observed.",
      measurementNotes: "Site measurements match plot boundaries.",
      floorFlatLayoutNotes: "Layout has proper ventilation and entry.",
      elevationPlanNotes: "Plastered & painted exterior elevation.",
      routeMapNotes: "Accessible via 25ft wide bitumen road.",
      enggSignatureName: "Er. Field Inspector",
      overallStatus: "Positive",
      rating: "Very Nice",
    },
  };

  const [siteFormat, setSiteFormat] = useState<FullSiteVisitFormat>(initialFormat);

  // Auto-Save and Server Storage States
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveServerStatus, setSaveServerStatus] = useState<string | null>(null);

  // Camera Modal state
  const [isGpsCameraOpen, setIsGpsCameraOpen] = useState(false);
  const [cameraCategory, setCameraCategory] = useState<keyof CategorizedMedia>("generalPhotos");

  // AI Extraction state
  const [isAiScanning, setIsAiScanning] = useState(false);

  // Active Tab Button Ref for smooth horizontal auto-scrolling
  const activeTabBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeTabBtnRef.current) {
      activeTabBtnRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab]);

  // Load from IDB on Mount
  useEffect(() => {
    let isMounted = true;
    const loadDraft = async () => {
      try {
        const draft = await getSurveyDraftFromIDB(caseItem.id);
        if (draft && draft.siteVisitFormat && isMounted) {
          setSiteFormat(draft.siteVisitFormat);
        }
      } catch (e) {
        console.error("Failed to load draft from IndexedDB", e);
      } finally {
        if (isMounted) setIsDraftLoaded(true);
      }
    };
    loadDraft();
    return () => { isMounted = false; };
  }, [caseItem.id]);

  // Auto-Save to IndexedDB whenever siteFormat changes
  useEffect(() => {
    if (!isDraftLoaded) return;
    const timer = setTimeout(async () => {
      setIsSavingDraft(true);
      try {
        await saveSurveyDraftToIDB({
          caseId: caseItem.id,
          currentStep: TABS.findIndex((t) => t.id === activeTab),
          activeTab,
          lastUpdated: Date.now(),
          localityData: caseItem.localityData,
          observationData: caseItem.observationData,
          identityData: caseItem.identityData,
          valuationData: caseItem.valuationData,
          mediaAttachments: caseItem.mediaAttachments,
          geoData: caseItem.geoData,
          finalSubmission: caseItem.finalSubmission,
          syncStatus: "offline_draft",
          siteVisitFormat: siteFormat,
        });
        setLastAutoSaveTime(Date.now());
      } catch (err) {
        console.error("Auto save draft failed", err);
      } finally {
        setIsSavingDraft(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [siteFormat, activeTab, isDraftLoaded, caseItem]);

  // Open GPS Camera for a specific photo category
  const openGpsCameraForCategory = (cat: keyof CategorizedMedia) => {
    setCameraCategory(cat);
    setIsGpsCameraOpen(true);
  };

  // Handle Photo Capture Result
  const handlePhotoCaptured = (photoDataUrl: string) => {
    setSiteFormat((prev) => {
      const existingMedia = prev.documentationMarketData.categorizedMedia || {
        roadPhotos: [],
        outsideNameplatePhotos: [],
        selfiePhotos: [],
        internalPhotos: [],
        generalPhotos: [],
      };
      const updatedCategoryPhotos = [...(existingMedia[cameraCategory] || []), photoDataUrl];

      return {
        ...prev,
        documentationMarketData: {
          ...prev.documentationMarketData,
          categorizedMedia: {
            ...existingMedia,
            [cameraCategory]: updatedCategoryPhotos,
          },
          // Auto-mark checkboxes based on captures
          roadPhotoTaken: cameraCategory === "roadPhotos" ? true : prev.documentationMarketData.roadPhotoTaken,
          outsideNameplateTaken: cameraCategory === "outsideNameplatePhotos" ? true : prev.documentationMarketData.outsideNameplateTaken,
          selfieTaken: cameraCategory === "selfiePhotos" ? true : prev.documentationMarketData.selfieTaken,
        },
      };
    });
  };

  // Remove Photo from category
  const removePhotoFromCategory = (cat: keyof CategorizedMedia, index: number) => {
    setSiteFormat((prev) => {
      const existingMedia = prev.documentationMarketData.categorizedMedia;
      const filtered = (existingMedia[cat] || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        documentationMarketData: {
          ...prev.documentationMarketData,
          categorizedMedia: {
            ...existingMedia,
            [cat]: filtered,
          },
        },
      };
    });
  };

  // AI Auto-Scan Document / Site Photo
  const handleAiScanDocument = async (file: File) => {
    setIsAiScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/gemini/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          const aiData = json.data;
          setSiteFormat((prev) => ({
            ...prev,
            generalInfo: {
              ...prev.generalInfo,
              clientName: aiData.customerName || prev.generalInfo.clientName,
              bankName: caseItem.institution || prev.generalInfo.bankName,
            },
            propertyIdentification: {
              ...prev.propertyIdentification,
              propertyAddress: aiData.address || prev.propertyIdentification.propertyAddress,
            },
            buildingSpecifications: {
              ...prev.buildingSpecifications,
              propertyType: aiData.propertyType || prev.buildingSpecifications.propertyType,
              structureType: aiData.structureType || prev.buildingSpecifications.roofType,
              landmark: aiData.closestLandmark || prev.buildingSpecifications.landmark,
            },
          }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("AI Document scan failed", err);
    } finally {
      setIsAiScanning(false);
    }
  };

  // Save to Flask/Node backend site folder
  const handleSaveToSiteFolder = async () => {
    setSaveServerStatus("Saving site data & media into site folder...");
    try {
      const res = await fetch("/api/sites/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: caseItem.id,
          caseId: caseItem.id,
          siteVisitFormat: siteFormat,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveServerStatus(`Saved to folder ${data.siteFolder}`);
        if (data.siteVisitFormat) {
          setSiteFormat(data.siteVisitFormat);
        }
        // Update caseItem state
        onUpdateCase({
          ...caseItem,
          siteVisitFormat: data.siteVisitFormat || siteFormat,
          completedSiteVisit: true,
          status: "Pending",
        });
      } else {
        setSaveServerStatus(`Failed: ${data.message}`);
      }
    } catch (e: any) {
      setSaveServerStatus(`Error: ${e?.message || "Server error"}`);
    } finally {
      setTimeout(() => setSaveServerStatus(null), 4000);
    }
  };

  // Step Index Navigation
  const currentStepIdx = TABS.findIndex((t) => t.id === activeTab);
  const progressPct = Math.round(((currentStepIdx + 1) / TABS.length) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 pb-28 select-none font-sans">
      {/* Top Sticky Header tab bar for 10 Sections with Integrated Sticky Progress Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/80">
              Ref #{caseItem.id}
            </span>
            <div
              className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800/90 text-[10px] cursor-help"
              title={
                isSavingDraft
                  ? "Auto-saving draft..."
                  : `Saved to offline storage (IDB) ${
                      lastAutoSaveTime
                        ? `at ${new Date(lastAutoSaveTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : ""
                    }`
              }
            >
              <Database className={`w-3.5 h-3.5 ${isSavingDraft ? "animate-spin text-amber-400" : "text-emerald-400"}`} />
              <span className={`text-[10px] font-bold font-mono ${isSavingDraft ? "text-amber-400" : "text-emerald-400"}`}>
                {isSavingDraft ? "Saving..." : "Saved"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveServerStatus && (
              <span className="text-[10px] font-semibold text-emerald-400 animate-pulse truncate max-w-[140px] hidden sm:inline">
                {saveServerStatus}
              </span>
            )}
            <span className="text-cyan-400 text-[11px] font-mono font-bold bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-md">
              Step {currentStepIdx + 1}/10 ({progressPct}%)
            </span>
          </div>
        </div>

        {/* 10 Navigation Tabs - Contrained Horizontal Scrollbar */}
        <div className="w-full max-w-full overflow-x-auto no-scrollbar scrollbar-none border-t border-slate-800/80 bg-slate-900/95">
          <div className="flex items-center gap-1.5 min-w-max px-3 py-1.5">
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeTabBtnRef : null}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1.5 px-3 text-[11px] font-bold flex items-center gap-2 transition-all relative cursor-pointer shrink-0 rounded-lg ${
                    isActive
                      ? "text-cyan-400 font-extrabold bg-slate-800 border border-cyan-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-black ${
                      isActive
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticky Progress Line in Navigation Menu */}
        <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 h-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Main Tab Content Container */}
      <div className="max-w-4xl mx-auto w-full p-4 space-y-6">
        {/* SECTION 1: GENERAL INFORMATION */}
        {activeTab === "sec1" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <FileText className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">I. General Information</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  value={siteFormat.generalInfo.company}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      generalInfo: { ...siteFormat.generalInfo, company: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Engineer Name</label>
                <input
                  type="text"
                  placeholder="Field Engineer Name"
                  value={siteFormat.generalInfo.engineerName}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      generalInfo: { ...siteFormat.generalInfo, engineerName: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Client Name (Borrower)</label>
                <input
                  type="text"
                  placeholder="Client / Borrower Name"
                  value={siteFormat.generalInfo.clientName}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      generalInfo: { ...siteFormat.generalInfo, clientName: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-semibold">Bank / Institution Name</label>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3 text-amber-400" />
                    Central DB Locked
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={caseItem.institution || siteFormat.generalInfo.bankName || "Empanelled Bank"}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-cyan-300 font-bold cursor-not-allowed select-none opacity-90 focus:outline-none pr-9"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Visit Date</label>
                <input
                  type="date"
                  value={siteFormat.generalInfo.visitDate}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      generalInfo: { ...siteFormat.generalInfo, visitDate: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: PROPERTY IDENTIFICATION & VERIFICATION */}
        {activeTab === "sec2" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <User className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  II. Property Identification & Verification
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Property Address (As per Site Visit)
                </label>
                <textarea
                  rows={2}
                  placeholder="Full physical address of inspected property"
                  value={siteFormat.propertyIdentification.propertyAddress}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      propertyIdentification: {
                        ...siteFormat.propertyIdentification,
                        propertyAddress: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Address Matches Title Documents?
                  </label>
                  <select
                    value={siteFormat.propertyIdentification.addressMatch}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        propertyIdentification: {
                          ...siteFormat.propertyIdentification,
                          addressMatch: e.target.value as "YES" | "NO",
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-bold"
                  >
                    <option value="YES">YES (Address Matches Deed)</option>
                    <option value="NO">NO (Address Mismatch / Deviation)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Person Met & ID Card Details</label>
                  <input
                    type="text"
                    placeholder="Name & ID Details (e.g. Aadhaar / Voter ID)"
                    value={siteFormat.propertyIdentification.personMetAndId}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        propertyIdentification: {
                          ...siteFormat.propertyIdentification,
                          personMetAndId: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Relation with Client</label>
                  <input
                    type="text"
                    placeholder="e.g. Owner, Applicant, Tenant, Relative"
                    value={siteFormat.propertyIdentification.relationWithClient}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        propertyIdentification: {
                          ...siteFormat.propertyIdentification,
                          relationWithClient: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mobile Number (M. NO)</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={siteFormat.propertyIdentification.mobileNumber}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        propertyIdentification: {
                          ...siteFormat.propertyIdentification,
                          mobileNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-2">Property Identification Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Contact Person", "Address", "Number Plate", "Neighbour Enquiry"].map((method) => {
                    const isSelected = siteFormat.propertyIdentification.identificationMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() =>
                          setSiteFormat({
                            ...siteFormat,
                            propertyIdentification: {
                              ...siteFormat.propertyIdentification,
                              identificationMethod: method as any,
                            },
                          })
                        }
                        className={`p-2.5 rounded-lg border text-center font-bold text-[11px] transition-all ${
                          isSelected
                            ? "bg-cyan-950 border-cyan-500 text-cyan-300 shadow-sm"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pin & Capture Property Location Satellite Component */}
              <div className="pt-2">
                <PropertyLocationSatelliteCapture
                  latitude={siteFormat.propertyIdentification.latitude || caseItem.geoData?.latitude || "28.6139"}
                  longitude={siteFormat.propertyIdentification.longitude || caseItem.geoData?.longitude || "77.2090"}
                  propertyAddress={siteFormat.propertyIdentification.propertyAddress || caseItem.address || ""}
                  caseId={caseItem.id}
                  capturedMapImage={siteFormat.propertyIdentification.capturedMapImage || ""}
                  onLocationChange={(lat, lon) => {
                    setSiteFormat((prev) => ({
                      ...prev,
                      propertyIdentification: {
                        ...prev.propertyIdentification,
                        latitude: lat,
                        longitude: lon,
                      },
                    }));
                  }}
                  onCaptureMapImage={(imageDataUrl) => {
                    setSiteFormat((prev) => ({
                      ...prev,
                      propertyIdentification: {
                        ...prev.propertyIdentification,
                        capturedMapImage: imageDataUrl,
                      },
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: LEGAL STATUS & LOCALITY */}
        {activeTab === "sec3" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">III. Legal Status & Locality</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ownership Legal Title</label>
                <div className="flex gap-2">
                  {["FREEHOLD", "LEASEHOLD"].map((type) => {
                    const isSel = siteFormat.legalStatusLocality.ownership === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setSiteFormat({
                            ...siteFormat,
                            legalStatusLocality: {
                              ...siteFormat.legalStatusLocality,
                              ownership: type as any,
                            },
                          })
                        }
                        className={`flex-1 p-2.5 rounded-lg border text-center font-bold transition-all ${
                          isSel
                            ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Colony Status</label>
                <select
                  value={siteFormat.legalStatusLocality.colonyStatus}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      legalStatusLocality: {
                        ...siteFormat.legalStatusLocality,
                        colonyStatus: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-bold"
                >
                  <option value="REGULARIZED">REGULARIZED</option>
                  <option value="UNAUTHORIZED">UNAUTHORIZED</option>
                  <option value="AUTHORITY">AUTHORITY</option>
                  <option value="LAL DORA">LAL DORA</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="GRAM PANCHAYAT">GRAM PANCHAYAT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Locality Type</label>
                <select
                  value={siteFormat.legalStatusLocality.localityType}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      legalStatusLocality: {
                        ...siteFormat.legalStatusLocality,
                        localityType: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-bold"
                >
                  <option value="RESIDENTIAL">RESIDENTIAL</option>
                  <option value="COMMERCIAL">COMMERCIAL</option>
                  <option value="INDUSTRIAL">INDUSTRIAL</option>
                  <option value="AGRICULTURE">AGRICULTURE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Location Position</label>
                <select
                  value={siteFormat.legalStatusLocality.location}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      legalStatusLocality: {
                        ...siteFormat.legalStatusLocality,
                        location: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-bold"
                >
                  <option value="INTERMITTENT">INTERMITTENT</option>
                  <option value="CORNER">CORNER</option>
                  <option value="MAIN ROAD">MAIN ROAD</option>
                  <option value="INNER ROAD">INNER ROAD</option>
                  <option value="PARK FACING">PARK FACING</option>
                  <option value="GALI">GALI</option>
                  <option value="DEAD END">DEAD END</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: PROPERTY & BUILDING SPECIFICATIONS */}
        {activeTab === "sec4" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Building className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  IV. Property & Building Specifications
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Property Type</label>
                <select
                  value={siteFormat.buildingSpecifications.propertyType}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      buildingSpecifications: {
                        ...siteFormat.buildingSpecifications,
                        propertyType: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-bold"
                >
                  <option value="BUILDER FLAT">BUILDER FLAT</option>
                  <option value="BUILDER FLOOR">BUILDER FLOOR</option>
                  <option value="ROW HOUSE">ROW HOUSE</option>
                  <option value="VACANT PLOT">VACANT PLOT</option>
                  <option value="AUTHORITY FLAT">AUTHORITY FLAT</option>
                  <option value="DEVELOPER FLAT">DEVELOPER FLAT</option>
                  <option value="SOCIETY FLAT">SOCIETY FLAT</option>
                  <option value="INDUSTRIAL">INDUSTRIAL</option>
                  <option value="SHOP">SHOP</option>
                  <option value="OFFICE">OFFICE</option>
                  <option value="INSTITUTIONAL">INSTITUTIONAL</option>
                  <option value="VILLA">VILLA</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Roof Construction Type</label>
                <select
                  value={siteFormat.buildingSpecifications.roofType}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      buildingSpecifications: {
                        ...siteFormat.buildingSpecifications,
                        roofType: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-bold"
                >
                  <option value="RCC">RCC (Reinforced Concrete)</option>
                  <option value="LOAD BEARING WALLS">LOAD BEARING WALLS</option>
                  <option value="T-IRON RED STONE">T-IRON RED STONE</option>
                  <option value="MIXED">MIXED CONSTRUCTION</option>
                  <option value="TIN SHED">TIN SHED</option>
                  <option value="CEMENTED SHED">CEMENTED SHED</option>
                </select>
              </div>
            </div>

            {/* Plot Details Sub-card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Plot Dimensions & Area</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold mb-1">Area (SQ. YD.)</label>
                  <input
                    type="number"
                    value={siteFormat.buildingSpecifications.plotAreaSqYd}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          plotAreaSqYd: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold mb-1">FRONT (FT)</label>
                  <input
                    type="number"
                    value={siteFormat.buildingSpecifications.plotFrontFt}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          plotFrontFt: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold mb-1">DEPTH (FT)</label>
                  <input
                    type="number"
                    value={siteFormat.buildingSpecifications.plotDepthFt}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          plotDepthFt: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold mb-1">Plot Shape</label>
                  <select
                    value={siteFormat.buildingSpecifications.plotShape}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          plotShape: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="REGULAR">REGULAR</option>
                    <option value="IRREGULAR">IRREGULAR</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Building Structure Sub-card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Building Structure & Units</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Number of Floors</label>
                  <input
                    type="text"
                    value={siteFormat.buildingSpecifications.numberOfFloors}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          numberOfFloors: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Entire Property Shown?</label>
                  <select
                    value={siteFormat.buildingSpecifications.entirePropertyShown}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          entirePropertyShown: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Floor Approach Independent?</label>
                  <select
                    value={siteFormat.buildingSpecifications.floorApproachIndependent}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          floorApproachIndependent: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">STILT FLOOR HT (FT)</label>
                  <input
                    type="text"
                    value={siteFormat.buildingSpecifications.stiltFloorHeightFt}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          stiltFloorHeightFt: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">General FLOOR HEIGHT (FT)</label>
                  <input
                    type="text"
                    value={siteFormat.buildingSpecifications.floorHeightFt}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          floorHeightFt: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Property Age (Years)</label>
                  <input
                    type="text"
                    value={siteFormat.buildingSpecifications.propertyAge}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          propertyAge: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">NO. OF UNIT ON EACH FLOOR</label>
                  <input
                    type="text"
                    value={siteFormat.buildingSpecifications.unitsOnEachFloor}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          unitsOnEachFloor: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">NO. OF UNITS IN BUILDING</label>
                  <input
                    type="text"
                    value={siteFormat.buildingSpecifications.unitsInBuilding}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          unitsInBuilding: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Electrical Fitting</label>
                  <select
                    value={siteFormat.buildingSpecifications.electricalFitting}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          electricalFitting: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Concealed">Concealed Wiring</option>
                    <option value="Open">Open Fitting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Flooring Type</label>
                  <select
                    value={siteFormat.buildingSpecifications.flooring}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          flooring: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Tile">Vitrified / Ceramic Tile</option>
                    <option value="Marble">Marble</option>
                    <option value="PCC">PCC / IPS</option>
                    <option value="Katcha">Katcha / Mud</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nearby Landmark</label>
                  <input
                    type="text"
                    value={siteFormat.buildingSpecifications.landmark}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          landmark: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Plot Demarcation / Boundaries</label>
                  <select
                    value={siteFormat.buildingSpecifications.demarcation}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        buildingSpecifications: {
                          ...siteFormat.buildingSpecifications,
                          demarcation: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="proper demarcated">proper demarcated</option>
                    <option value="temporary demarcated">temporary demarcated</option>
                    <option value="Not demarcated">Not demarcated</option>
                    <option value="demarcated by fencing">demarcated by fencing</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: OCCUPANCY & USAGE */}
        {activeTab === "sec5" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Users className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">V. Occupancy and Usage</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Occupation Status</label>
                <select
                  value={siteFormat.occupancyUsage.occupationStatus}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      occupancyUsage: {
                        ...siteFormat.occupancyUsage,
                        occupationStatus: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="OWNER">OWNER</option>
                  <option value="RENTED">RENTED</option>
                  <option value="APPLICANT">APPLICANT</option>
                  <option value="SELLER">SELLER</option>
                  <option value="VACANT">VACANT</option>
                  <option value="LEASE">LEASE</option>
                  <option value="UNDER CONSTRUCTION">UNDER CONSTRUCTION</option>
                  <option value="Renovation">Renovation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Owner Present At Site?</label>
                <select
                  value={siteFormat.occupancyUsage.ownerAtSite}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      occupancyUsage: {
                        ...siteFormat.occupancyUsage,
                        ownerAtSite: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Property Usage</label>
                <select
                  value={siteFormat.occupancyUsage.usage}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      occupancyUsage: {
                        ...siteFormat.occupancyUsage,
                        usage: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="RESIDENTIAL">RESIDENTIAL</option>
                  <option value="COMMERCIAL">COMMERCIAL</option>
                  <option value="INDUSTRIAL">INDUSTRIAL</option>
                  <option value="INSTITUTIONAL">INSTITUTIONAL</option>
                  <option value="VACANT">VACANT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Building Occupancy Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Self-occupied by owner"
                  value={siteFormat.occupancyUsage.buildingOccupancy}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      occupancyUsage: {
                        ...siteFormat.occupancyUsage,
                        buildingOccupancy: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Tenant Details Table / List */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Tenant Details (If Rented)
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const newTenant: TenantDetail = {
                      id: `t_${Date.now()}`,
                      tenantName: "",
                      occupiedSince: "",
                      purposeOfUse: "RESIDENTIAL",
                      rentedArea: "",
                      rentPayable: "",
                    };
                    setSiteFormat({
                      ...siteFormat,
                      occupancyUsage: {
                        ...siteFormat.occupancyUsage,
                        tenants: [...siteFormat.occupancyUsage.tenants, newTenant],
                        numberOfTenants: String(siteFormat.occupancyUsage.tenants.length + 1),
                      },
                    });
                  }}
                  className="py-1 px-2.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 text-[11px] font-bold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tenant</span>
                </button>
              </div>

              {siteFormat.occupancyUsage.tenants.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic py-2">
                  No tenant records added. Click "Add Tenant" if the property is rented.
                </p>
              ) : (
                <div className="space-y-3">
                  {siteFormat.occupancyUsage.tenants.map((tenant, idx) => (
                    <div
                      key={tenant.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-lg grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs items-center"
                    >
                      <input
                        type="text"
                        placeholder="Tenant Name"
                        value={tenant.tenantName}
                        onChange={(e) => {
                          const updated = [...siteFormat.occupancyUsage.tenants];
                          updated[idx].tenantName = e.target.value;
                          setSiteFormat({
                            ...siteFormat,
                            occupancyUsage: { ...siteFormat.occupancyUsage, tenants: updated },
                          });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="Occupied Since"
                        value={tenant.occupiedSince}
                        onChange={(e) => {
                          const updated = [...siteFormat.occupancyUsage.tenants];
                          updated[idx].occupiedSince = e.target.value;
                          setSiteFormat({
                            ...siteFormat,
                            occupancyUsage: { ...siteFormat.occupancyUsage, tenants: updated },
                          });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="Rented Area"
                        value={tenant.rentedArea}
                        onChange={(e) => {
                          const updated = [...siteFormat.occupancyUsage.tenants];
                          updated[idx].rentedArea = e.target.value;
                          setSiteFormat({
                            ...siteFormat,
                            occupancyUsage: { ...siteFormat.occupancyUsage, tenants: updated },
                          });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="Rent Payable"
                        value={tenant.rentPayable}
                        onChange={(e) => {
                          const updated = [...siteFormat.occupancyUsage.tenants];
                          updated[idx].rentPayable = e.target.value;
                          setSiteFormat({
                            ...siteFormat,
                            occupancyUsage: { ...siteFormat.occupancyUsage, tenants: updated },
                          });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = siteFormat.occupancyUsage.tenants.filter((_, i) => i !== idx);
                          setSiteFormat({
                            ...siteFormat,
                            occupancyUsage: {
                              ...siteFormat.occupancyUsage,
                              tenants: filtered,
                              numberOfTenants: String(filtered.length),
                            },
                          });
                        }}
                        className="p-1.5 bg-rose-950/60 text-rose-300 rounded hover:bg-rose-900 border border-rose-800/50 flex justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 6: AMENITIES & UTILITIES */}
        {activeTab === "sec6" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Zap className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">VI. Amenities and Utilities</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Elevator / Lift Facility</label>
                <select
                  value={siteFormat.amenitiesUtilities.lift}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      amenitiesUtilities: {
                        ...siteFormat.amenitiesUtilities,
                        lift: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                  <option value="WORKING">WORKING</option>
                  <option value="Not Working">Not Working</option>
                  <option value="(Under construction)">(Under construction)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Electricity Meter Installed?</label>
                <select
                  value={siteFormat.amenitiesUtilities.meterInstalled}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      amenitiesUtilities: {
                        ...siteFormat.amenitiesUtilities,
                        meterInstalled: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Electricity Bill Provided?</label>
                <select
                  value={siteFormat.amenitiesUtilities.billProvided}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      amenitiesUtilities: {
                        ...siteFormat.amenitiesUtilities,
                        billProvided: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Meter Installed No.</label>
                <input
                  type="text"
                  placeholder="e.g. 1049285721"
                  value={siteFormat.amenitiesUtilities.meterNumber}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      amenitiesUtilities: {
                        ...siteFormat.amenitiesUtilities,
                        meterNumber: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Meter Details Match Electricity Bill?
                </label>
                <select
                  value={siteFormat.amenitiesUtilities.meterMatchesBill}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      amenitiesUtilities: {
                        ...siteFormat.amenitiesUtilities,
                        meterMatchesBill: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Sewer Line Connection</label>
                <select
                  value={siteFormat.amenitiesUtilities.sewerConnection}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      amenitiesUtilities: {
                        ...siteFormat.amenitiesUtilities,
                        sewerConnection: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: NEIGHBORHOOD & SURROUNDINGS */}
        {activeTab === "sec7" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Navigation className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">VII. Neighborhood and Surroundings</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">ROAD WIDTH (FT)</label>
                <input
                  type="text"
                  placeholder="e.g. 25 FT"
                  value={siteFormat.neighborhoodSurroundings.roadWidthFt}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      neighborhoodSurroundings: {
                        ...siteFormat.neighborhoodSurroundings,
                        roadWidthFt: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">ROAD TYPE</label>
                <select
                  value={siteFormat.neighborhoodSurroundings.roadType}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      neighborhoodSurroundings: {
                        ...siteFormat.neighborhoodSurroundings,
                        roadType: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="BITUMEN">BITUMEN</option>
                  <option value="CONCRETE">CONCRETE</option>
                  <option value="INTERLOCKING TILES">INTERLOCKING TILES</option>
                  <option value="KACHA">KACHA</option>
                  <option value="BRICK">BRICK</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">OCCUPANCY IN LOCALITY IN (%)</label>
                <input
                  type="text"
                  placeholder="e.g. 85%"
                  value={siteFormat.neighborhoodSurroundings.occupancyInLocalityPct}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      neighborhoodSurroundings: {
                        ...siteFormat.neighborhoodSurroundings,
                        occupancyInLocalityPct: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">DEVELOPMENT IN LOCALITY IN (%)</label>
                <input
                  type="text"
                  placeholder="e.g. 90%"
                  value={siteFormat.neighborhoodSurroundings.developmentInLocalityPct}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      neighborhoodSurroundings: {
                        ...siteFormat.neighborhoodSurroundings,
                        developmentInLocalityPct: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Dominant Community Name</label>
                <input
                  type="text"
                  placeholder="Dominant Community"
                  value={siteFormat.neighborhoodSurroundings.dominantCommunityName}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      neighborhoodSurroundings: {
                        ...siteFormat.neighborhoodSurroundings,
                        dominantCommunityName: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Dominant Community Percentage (%)</label>
                <input
                  type="text"
                  placeholder="e.g. 100%"
                  value={siteFormat.neighborhoodSurroundings.dominantCommunityPct}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      neighborhoodSurroundings: {
                        ...siteFormat.neighborhoodSurroundings,
                        dominantCommunityPct: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Negative Factors Checkboxes */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Negative Remarks / Adverse Surroundings</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  "DRAIN",
                  "RAILWAY LINE",
                  "ROAD WIDENING",
                  "HIGH TENSION",
                  "CREMATION",
                  "BELOW FROM ROAD LEVEL",
                ].map((factor) => {
                  const isChecked = siteFormat.neighborhoodSurroundings.negativeRemarks.includes(factor);
                  return (
                    <label
                      key={factor}
                      className={`p-2 rounded.lg border flex items-center gap-2 cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-rose-950/60 border-rose-600 text-rose-200"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = siteFormat.neighborhoodSurroundings.negativeRemarks;
                          const next = e.target.checked
                            ? [...current, factor]
                            : current.filter((f) => f !== factor);
                          setSiteFormat({
                            ...siteFormat,
                            neighborhoodSurroundings: {
                              ...siteFormat.neighborhoodSurroundings,
                              negativeRemarks: next,
                            },
                          });
                        }}
                        className="rounded accent-rose-500"
                      />
                      <span className="font-bold text-[11px]">{factor}</span>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                  Additional Negative Factors Notes
                </label>
                <input
                  type="text"
                  placeholder="Notes on surrounding factors"
                  value={siteFormat.neighborhoodSurroundings.negativeRemarksNotes}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      neighborhoodSurroundings: {
                        ...siteFormat.neighborhoodSurroundings,
                        negativeRemarksNotes: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: FLOOR-WISE ACCOMMODATION MATRIX */}
        {activeTab === "sec8" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Layers className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  VIII. Floor-wise Accommodation Details Table
                </h3>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-mono">
                Basement to 4th Floor
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-cyan-400 border-b border-slate-800 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="p-2.5 border-r border-slate-800">Floor Level</th>
                    <th className="p-2.5 border-r border-slate-800">ACCOMMODATION</th>
                    <th className="p-2.5 border-r border-slate-800">CARPET / Open / BUA</th>
                    <th className="p-2.5 border-r border-slate-800">OCCUPIED BY</th>
                    <th className="p-2.5 border-r border-slate-800">USAGE</th>
                    <th className="p-2.5">STRUCTURE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[11px]">
                  {siteFormat.floorAccommodationRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2 font-bold text-cyan-300 border-r border-slate-800 bg-slate-950/40">
                        {row.floorLevel}
                      </td>
                      <td className="p-2 border-r border-slate-800">
                        <input
                          type="text"
                          placeholder="e.g. 2 BHK / Park Area"
                          value={row.accommodation}
                          onChange={(e) => {
                            const updated = [...siteFormat.floorAccommodationRows];
                            updated[idx].accommodation = e.target.value;
                            setSiteFormat({ ...siteFormat, floorAccommodationRows: updated });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-800">
                        <input
                          type="text"
                          placeholder="e.g. 900 SQ FT"
                          value={row.carpetOpenBUA}
                          onChange={(e) => {
                            const updated = [...siteFormat.floorAccommodationRows];
                            updated[idx].carpetOpenBUA = e.target.value;
                            setSiteFormat({ ...siteFormat, floorAccommodationRows: updated });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-800">
                        <input
                          type="text"
                          placeholder="e.g. Owner / Tenant"
                          value={row.occupiedBy}
                          onChange={(e) => {
                            const updated = [...siteFormat.floorAccommodationRows];
                            updated[idx].occupiedBy = e.target.value;
                            setSiteFormat({ ...siteFormat, floorAccommodationRows: updated });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-800">
                        <input
                          type="text"
                          placeholder="RESIDENTIAL / SHOP"
                          value={row.usage}
                          onChange={(e) => {
                            const updated = [...siteFormat.floorAccommodationRows];
                            updated[idx].usage = e.target.value;
                            setSiteFormat({ ...siteFormat, floorAccommodationRows: updated });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="RCC / Load Bearing"
                          value={row.structure}
                          onChange={(e) => {
                            const updated = [...siteFormat.floorAccommodationRows];
                            updated[idx].structure = e.target.value;
                            setSiteFormat({ ...siteFormat, floorAccommodationRows: updated });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              * Note: Stilt Floor includes specific accommodations for Park Area and Shop / DU.
            </p>
          </div>
        )}

        {/* SECTION 9: DOCUMENTATION & MARKET DATA */}
        {activeTab === "sec9" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Camera className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  IX. Photographic Evidence & Dealer Market Inquiry
                </h3>
              </div>
            </div>

            {/* Photographic Verification Checkboxes */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Photographic Verification Checkboxes
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={siteFormat.documentationMarketData.internalPicsTaken === "YES"}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        documentationMarketData: {
                          ...siteFormat.documentationMarketData,
                          internalPicsTaken: e.target.checked ? "YES" : "NO",
                        },
                      })
                    }
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-bold">INTERNAL PICS TAKEN</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={siteFormat.documentationMarketData.roadPhotoTaken}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        documentationMarketData: {
                          ...siteFormat.documentationMarketData,
                          roadPhotoTaken: e.target.checked,
                        },
                      })
                    }
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-bold">ROAD PHOTO</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={siteFormat.documentationMarketData.outsideNameplateTaken}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        documentationMarketData: {
                          ...siteFormat.documentationMarketData,
                          outsideNameplateTaken: e.target.checked,
                        },
                      })
                    }
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-bold">OUTSIDE / NAME PLATE</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={siteFormat.documentationMarketData.selfieTaken}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        documentationMarketData: {
                          ...siteFormat.documentationMarketData,
                          selfieTaken: e.target.checked,
                        },
                      })
                    }
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-bold">SELFIE WITH PROPERTY</span>
                </div>
              </div>
            </div>

            {/* Categorized Media Photo Upload & GPS Snap Buttons */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Categorized Field Photo Attachments (Saved to Site Folder)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: "roadPhotos", label: "Road Photos", icon: Navigation },
                  { id: "outsideNameplatePhotos", label: "Outside / Name Plate", icon: Building },
                  { id: "selfiePhotos", label: "Selfie with Property", icon: User },
                  { id: "internalPhotos", label: "Internal Photos", icon: Camera },
                  { id: "generalPhotos", label: "General Property Photos", icon: Camera },
                ].map((catItem) => {
                  const key = catItem.id as keyof CategorizedMedia;
                  const photos = siteFormat.documentationMarketData.categorizedMedia?.[key] || [];
                  const Icon = catItem.icon;

                  return (
                    <div
                      key={key}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-cyan-400" />
                            {catItem.label}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-cyan-400 font-mono px-2 py-0.5 rounded-full font-bold">
                            {photos.length} photos
                          </span>
                        </div>

                        {photos.length > 0 && (
                          <div className="grid grid-cols-3 gap-1.5 mb-2">
                            {photos.map((p, pIdx) => (
                              <div key={pIdx} className="relative aspect-square rounded overflow-hidden border border-slate-700 group">
                                <img src={p} alt="Field Capture" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removePhotoFromCategory(key, pIdx)}
                                  className="absolute top-0.5 right-0.5 bg-rose-600 text-white p-0.5 rounded-full opacity-90 hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openGpsCameraForCategory(key)}
                        className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-700/60 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Snap Geotagged Photo</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Local Dealer Inquiry Section */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Dealer Market Inquiry Details
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const newDealer: DealerInquiry = {
                      id: `d_${Date.now()}`,
                      dealerName: "",
                      mobileNo: "",
                      landOrShopRate: "",
                      oldFlatRate: "",
                      newFlatRate: "",
                      disputeInfo: "",
                    };
                    setSiteFormat({
                      ...siteFormat,
                      documentationMarketData: {
                        ...siteFormat.documentationMarketData,
                        dealerInquiries: [
                          ...siteFormat.documentationMarketData.dealerInquiries,
                          newDealer,
                        ],
                      },
                    });
                  }}
                  className="py-1 px-2.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 text-[11px] font-bold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Dealer Record</span>
                </button>
              </div>

              {siteFormat.documentationMarketData.dealerInquiries.map((dealer, idx) => (
                <div key={dealer.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="DEALER NAME"
                      value={dealer.dealerName}
                      onChange={(e) => {
                        const updated = [...siteFormat.documentationMarketData.dealerInquiries];
                        updated[idx].dealerName = e.target.value;
                        setSiteFormat({
                          ...siteFormat,
                          documentationMarketData: { ...siteFormat.documentationMarketData, dealerInquiries: updated },
                        });
                      }}
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                    />
                    <input
                      type="tel"
                      placeholder="MOBILE NO."
                      value={dealer.mobileNo}
                      onChange={(e) => {
                        const updated = [...siteFormat.documentationMarketData.dealerInquiries];
                        updated[idx].mobileNo = e.target.value;
                        setSiteFormat({
                          ...siteFormat,
                          documentationMarketData: { ...siteFormat.documentationMarketData, dealerInquiries: updated },
                        });
                      }}
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="LAND RATE / SHOP RATE"
                      value={dealer.landOrShopRate}
                      onChange={(e) => {
                        const updated = [...siteFormat.documentationMarketData.dealerInquiries];
                        updated[idx].landOrShopRate = e.target.value;
                        setSiteFormat({
                          ...siteFormat,
                          documentationMarketData: { ...siteFormat.documentationMarketData, dealerInquiries: updated },
                        });
                      }}
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="OLD FLAT RATE"
                      value={dealer.oldFlatRate}
                      onChange={(e) => {
                        const updated = [...siteFormat.documentationMarketData.dealerInquiries];
                        updated[idx].oldFlatRate = e.target.value;
                        setSiteFormat({
                          ...siteFormat,
                          documentationMarketData: { ...siteFormat.documentationMarketData, dealerInquiries: updated },
                        });
                      }}
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="NEW FLAT RATE"
                      value={dealer.newFlatRate}
                      onChange={(e) => {
                        const updated = [...siteFormat.documentationMarketData.dealerInquiries];
                        updated[idx].newFlatRate = e.target.value;
                        setSiteFormat({
                          ...siteFormat,
                          documentationMarketData: { ...siteFormat.documentationMarketData, dealerInquiries: updated },
                        });
                      }}
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="DISPUTE INFO (If any)"
                      value={dealer.disputeInfo}
                      onChange={(e) => {
                        const updated = [...siteFormat.documentationMarketData.dealerInquiries];
                        updated[idx].disputeInfo = e.target.value;
                        setSiteFormat({
                          ...siteFormat,
                          documentationMarketData: { ...siteFormat.documentationMarketData, dealerInquiries: updated },
                        });
                      }}
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 10: FINAL REMARKS & SUBMISSIONS */}
        {activeTab === "sec10" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">X. Final Remarks & Submissions</h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Remarks with Deviation</label>
                <textarea
                  rows={2}
                  placeholder="Notes on plan deviations or legal variations"
                  value={siteFormat.finalRemarksSubmissions.remarksWithDeviation}
                  onChange={(e) =>
                    setSiteFormat({
                      ...siteFormat,
                      finalRemarksSubmissions: {
                        ...siteFormat.finalRemarksSubmissions,
                        remarksWithDeviation: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Measurement Details</label>
                  <input
                    type="text"
                    placeholder="Measurement verification notes"
                    value={siteFormat.finalRemarksSubmissions.measurementNotes}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        finalRemarksSubmissions: {
                          ...siteFormat.finalRemarksSubmissions,
                          measurementNotes: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    FLOOR / FLAT LAYOUT (Direction & Boundaries)
                  </label>
                  <input
                    type="text"
                    placeholder="Layout & direction notes"
                    value={siteFormat.finalRemarksSubmissions.floorFlatLayoutNotes}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        finalRemarksSubmissions: {
                          ...siteFormat.finalRemarksSubmissions,
                          floorFlatLayoutNotes: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">ELEVATION PLAN</label>
                  <input
                    type="text"
                    placeholder="Elevation plan observations"
                    value={siteFormat.finalRemarksSubmissions.elevationPlanNotes}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        finalRemarksSubmissions: {
                          ...siteFormat.finalRemarksSubmissions,
                          elevationPlanNotes: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">ROUTE MAP with Landmark</label>
                  <input
                    type="text"
                    placeholder="Approach route and prominent landmarks"
                    value={siteFormat.finalRemarksSubmissions.routeMapNotes}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        finalRemarksSubmissions: {
                          ...siteFormat.finalRemarksSubmissions,
                          routeMapNotes: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">ENGINEER SIGNATURE / NAME (ENGG SIGN)</label>
                  <input
                    type="text"
                    placeholder="Field Valuer Signature / Name"
                    value={siteFormat.finalRemarksSubmissions.enggSignatureName}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        finalRemarksSubmissions: {
                          ...siteFormat.finalRemarksSubmissions,
                          enggSignatureName: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Overall Site Recommendation</label>
                  <select
                    value={siteFormat.finalRemarksSubmissions.overallStatus}
                    onChange={(e) =>
                      setSiteFormat({
                        ...siteFormat,
                        finalRemarksSubmissions: {
                          ...siteFormat.finalRemarksSubmissions,
                          overallStatus: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Positive">Positive (Recommended for Lending)</option>
                    <option value="Negative">Negative (High Risk / Issues)</option>
                    <option value="Cannot decide">Cannot Decide (Further Inquiry Needed)</option>
                  </select>
                </div>
              </div>

              {/* Submit / Finish Action Box */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleSaveToSiteFolder}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <FolderCheck className="w-4 h-4" />
                  <span>Save to Server Site Folder</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSaveToSiteFolder();
                    onFinishSurvey();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Site Visit & Submit Report</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Step Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-3 z-40 flex items-center justify-between max-w-4xl mx-auto shadow-2xl">
        <button
          onClick={onGoHome}
          className="py-2 px-3 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-700"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </button>

        <div className="flex items-center gap-2">
          {currentStepIdx > 0 && (
            <button
              onClick={() => setActiveTab(TABS[currentStepIdx - 1].id)}
              className="py-2 px-4 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {currentStepIdx < TABS.length - 1 ? (
            <button
              onClick={() => setActiveTab(TABS[currentStepIdx + 1].id)}
              className="py-2 px-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-md active:scale-95 transition-transform"
            >
              <span>Next Section</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                handleSaveToSiteFolder();
                onFinishSurvey();
              }}
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-md active:scale-95 transition-transform"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finish Visit</span>
            </button>
          )}
        </div>
      </div>

      {/* GPS Field Camera Modal */}
      {isGpsCameraOpen && (
        <GPSCameraModal
          isOpen={isGpsCameraOpen}
          onClose={() => setIsGpsCameraOpen(false)}
          onCapture={handlePhotoCaptured}
        />
      )}
    </div>
  );
};
