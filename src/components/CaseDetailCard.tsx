import React, { useState } from "react";
import {
  PhoneCall,
  Navigation,
  Building,
  ThumbsUp,
  ThumbsDown,
  User,
  Pencil,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ValuationCase } from "../types";

interface CaseDetailCardProps {
  caseItem: ValuationCase;
  onUpdateCase: (updated: ValuationCase) => void;
  onStartSurvey: () => void;
  onOpenAIAssistant: () => void;
}

const PROPERTY_TYPE_OPTIONS = [
  "Educational Institution",
  "Flat",
  "Hospital",
  "Independent Office/Commercial Property",
  "Individual house",
  "Office in Commercial Property",
  "Row House",
  "Shop in Commercial Complex",
  "Vacant land",
  "Villa",
];

export const CaseDetailCard: React.FC<CaseDetailCardProps> = ({
  caseItem,
  onUpdateCase,
  onStartSurvey,
  onOpenAIAssistant,
}) => {
  const [completedSiteVisit, setCompletedSiteVisit] = useState<boolean | null>(
    caseItem.completedSiteVisit
  );
  const [propertyType, setPropertyType] = useState<string>(
    caseItem.propertyType || "Flat"
  );

  const handleSelectSiteVisit = (completed: boolean) => {
    setCompletedSiteVisit(completed);
    onUpdateCase({
      ...caseItem,
      completedSiteVisit: completed,
      propertyType,
    });
  };

  const handlePropertyTypeChange = (newType: string) => {
    setPropertyType(newType);
    onUpdateCase({
      ...caseItem,
      propertyType: newType,
    });
  };

  const handleSaveAndNext = () => {
    onUpdateCase({
      ...caseItem,
      completedSiteVisit: completedSiteVisit ?? true,
      propertyType,
    });
    onStartSurvey();
  };

  return (
    <div id="case-detail-container" className="max-w-2xl mx-auto p-4 space-y-4 font-sans text-slate-100">
      {/* Top Main Case Details Card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-extrabold text-cyan-400 font-mono bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/50">
              ID #{caseItem.id}
            </span>
            <h2 className="text-lg font-black text-slate-100 mt-2 leading-snug">
              {caseItem.institution}
            </h2>
          </div>
          <span
            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
              caseItem.status === "Open"
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                : caseItem.status === "Pending"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {caseItem.status}
          </span>
        </div>

        <div className="space-y-2.5 text-xs text-slate-300 font-medium pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-bold text-slate-100 text-sm">{caseItem.customerName}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <Navigation className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-slate-300 leading-relaxed">{caseItem.address}</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-400 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <Pencil className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{caseItem.remarks || "No special inspection notes"}</span>
          </div>
        </div>

        {/* Quick Contact Action Buttons */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-center">
          {/* Call customer */}
          <a
            href={`tel:${caseItem.phone}`}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl border border-emerald-500/40 flex items-center justify-center text-emerald-400 bg-emerald-950/40 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-md active:scale-95">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-300 mt-2 group-hover:text-emerald-400 transition-colors">
              Call Applicant
            </span>
          </a>

          {/* Route map */}
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(caseItem.address)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl border border-cyan-500/40 flex items-center justify-center text-cyan-400 bg-cyan-950/40 group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-md active:scale-95">
              <Navigation className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-300 mt-2 group-hover:text-cyan-400 transition-colors">
              GPS Route
            </span>
          </a>

          {/* Call office */}
          <a
            href="tel:1800123456"
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl border border-amber-500/40 flex items-center justify-center text-amber-400 bg-amber-950/40 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-md active:scale-95">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-300 mt-2 group-hover:text-amber-400 transition-colors">
              Call Office
            </span>
          </a>
        </div>
      </div>

      {/* AI Assistant Banner */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100">AI Intelligent Scanner & Form Auto-Fill</h4>
            <p className="text-[11px] text-slate-400">Scan site registry photos or floor plans to auto-populate fields</p>
          </div>
        </div>
        <button
          onClick={onOpenAIAssistant}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95 shrink-0"
        >
          Use AI
        </button>
      </div>

      {/* Completion Site Visit Card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 text-center">
          Have you completed the site visit?
        </h3>

        {/* Thumbs Up / Thumbs Down Toggle Box */}
        <div className="flex items-center justify-center gap-6 py-2">
          <button
            id="btn-site-visit-yes"
            onClick={() => handleSelectSiteVisit(true)}
            className={`flex-1 py-4 rounded-2xl border-2 transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 ${
              completedSiteVisit === true
                ? "border-emerald-400 bg-emerald-950/40 text-emerald-400 ring-2 ring-emerald-500/20"
                : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
            title="Yes, completed site visit"
          >
            <ThumbsUp className="w-7 h-7" />
            <span className="text-xs font-bold">YES, COMPLETED</span>
          </button>

          <button
            id="btn-site-visit-no"
            onClick={() => handleSelectSiteVisit(false)}
            className={`flex-1 py-4 rounded-2xl border-2 transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 ${
              completedSiteVisit === false
                ? "border-rose-500 bg-rose-950/40 text-rose-400 ring-2 ring-rose-500/20"
                : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
            title="No, not completed"
          >
            <ThumbsDown className="w-7 h-7" />
            <span className="text-xs font-bold">NOT YET</span>
          </button>
        </div>

        {/* Property Type Dropdown */}
        {(completedSiteVisit === true || completedSiteVisit === null) && (
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-300">
              Confirm Property Type Classification
            </label>
            <div className="relative">
              <select
                id="select-property-type"
                value={propertyType}
                onChange={(e) => handlePropertyTypeChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer shadow-inner"
              >
                {PROPERTY_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* SAVE & NEXT Button */}
            <div className="pt-3 text-center">
              <button
                id="btn-save-and-next-main"
                onClick={handleSaveAndNext}
                className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white py-3 rounded-xl font-extrabold text-xs tracking-wider shadow-lg active:scale-95 transition-all inline-flex items-center justify-center gap-2"
              >
                <span>SAVE & START SITE SURVEY</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {completedSiteVisit === false && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 text-center font-bold">
            Please complete the site visit to proceed with the property valuation survey.
          </div>
        )}
      </div>
    </div>
  );
};
