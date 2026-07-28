import React, { useState } from "react";
import {
  Sparkles,
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Brain,
  ShieldAlert,
  Building,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { ValuationCase, AIRiskReport } from "../types";

interface AIInspectorAssistantProps {
  currentCase?: ValuationCase;
  onApplyExtractedData: (data: Partial<ValuationCase>) => void;
  onClose: () => void;
}

export const AIInspectorAssistant: React.FC<AIInspectorAssistantProps> = ({
  currentCase,
  onApplyExtractedData,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any | null>(null);
  const [riskReport, setRiskReport] = useState<AIRiskReport | null>(null);
  const [activeTab, setActiveTab] = useState<"doc" | "risk">("doc");

  // Handle file drop or sample photo
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleDocument = () => {
    // Generate sample deed svg base64
    const sampleImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="%23f8fafc"/><rect x="40" y="40" width="520" height="720" fill="white" stroke="%23cbd5e1" stroke-width="2"/><text x="300" y="100" text-anchor="middle" font-size="22" font-weight="bold" fill="%230f172a">HINDUJA HOUSING FINANCE - DEED</text><text x="60" y="180" font-size="14" fill="%23334155">Borrower: Mr. ANKITA NIGAM</text><text x="60" y="220" font-size="14" fill="%23334155">Address: Raj Nagar Extension, Vill Noor Nagar, GZB</text><text x="60" y="260" font-size="14" fill="%23334155">Property Type: Flat (3 BHK Residential Unit)</text><text x="60" y="300" font-size="14" fill="%23334155">Structure: RCC Framed Structure (8 Floors)</text><text x="60" y="340" font-size="14" fill="%23334155">Year of Construction: 2019 (Age: 7 years)</text><text x="60" y="380" font-size="14" fill="%23334155">Estimated Rate: Rs. 4,800 / Sq. ft</text></svg>`;
    setSelectedImage(sampleImage);
  };

  const handleRunAIDocumentAnalysis = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setExtractedResult(null);

    try {
      const res = await fetch("/api/gemini/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: selectedImage }),
      });
      const data = await res.json();
      if (data.success) {
        setExtractedResult(data.data);
      } else {
        alert(data.message || "Document analysis failed");
      }
    } catch (err: any) {
      alert("Error calling server AI document scanner: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunAIRiskAssessment = async () => {
    if (!currentCase) return;
    setIsAnalyzing(true);
    setRiskReport(null);

    try {
      const res = await fetch("/api/gemini/valuation-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseDetails: currentCase }),
      });
      const data = await res.json();
      if (data.success) {
        setRiskReport(data.report);
      } else {
        alert(data.message || "Risk assessment failed");
      }
    } catch (err: any) {
      alert("Error generating risk report: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyExtractedToCase = () => {
    if (!extractedResult) return;
    onApplyExtractedData({
      customerName: extractedResult.customerName || currentCase?.customerName,
      institution: extractedResult.institutionName || currentCase?.institution,
      address: extractedResult.address || currentCase?.address,
      propertyType: extractedResult.propertyType || currentCase?.propertyType || "Flat",
      observationData: {
        ...(currentCase?.observationData || ({} as any)),
        structureType: extractedResult.structureType || "RCC Framed Structure",
        buildingOccupancy: extractedResult.buildingOccupancy || "Self-occupied by owner",
        ageOfBuilding: extractedResult.ageOfBuilding || "7",
        totalFloors: extractedResult.totalFloors || "8",
      },
    });
    alert("AI extracted property details applied to survey form successfully!");
    onClose();
  };

  return (
    <div id="ai-assistant-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-amber-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            <div>
              <h3 className="text-base font-bold">DRR AI Inspector Assistant</h3>
              <p className="text-[11px] text-amber-100">Powered by Gemini AI Intelligence</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-full hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Action Tabs */}
        <div className="flex border-b border-gray-200 bg-amber-50/50">
          <button
            onClick={() => setActiveTab("doc")}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "doc"
                ? "border-amber-600 text-amber-900 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileCheck className="w-4 h-4 text-amber-600" />
            Document Scanner & Auto-Fill
          </button>

          <button
            onClick={() => setActiveTab("risk")}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "risk"
                ? "border-amber-600 text-amber-900 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            AI Valuation Risk Officer
          </button>
        </div>

        {/* Tab 1 Body: Document Scanner */}
        {activeTab === "doc" && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                Upload Property Title Deed / Site Photograph
              </label>

              {selectedImage ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-300 bg-gray-900 max-h-52 flex items-center justify-center">
                  <img src={selectedImage} alt="Document" className="object-contain max-h-52 w-full" />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-amber-300 bg-amber-50/30 rounded-xl p-6 text-center space-y-2">
                  <Upload className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-xs font-semibold text-gray-700">Drop document or site photo here</p>
                  <div className="flex justify-center gap-2 pt-1">
                    <label className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
                      Browse File
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>

                    <button
                      onClick={handleUseSampleDocument}
                      className="bg-white border border-amber-400 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-50"
                    >
                      Use Sample Deed
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleRunAIDocumentAnalysis}
              disabled={!selectedImage || isAnalyzing}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini AI is analyzing document...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Scan Document & Extract Data</span>
                </>
              )}
            </button>

            {extractedResult && (
              <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    AI Extracted Property Fields
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
                    Confidence: High
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Customer Name:</span>
                    <span className="font-bold text-gray-900">{extractedResult.customerName || "N/A"}</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[10px]">Property Type:</span>
                    <span className="font-bold text-gray-900">{extractedResult.propertyType || "N/A"}</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[10px]">Structure Type:</span>
                    <span className="font-bold text-gray-900">{extractedResult.structureType || "N/A"}</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[10px]">Building Age:</span>
                    <span className="font-bold text-gray-900">{extractedResult.ageOfBuilding || "N/A"}</span>
                  </div>
                </div>

                {extractedResult.keyObservations && (
                  <p className="text-xs text-gray-700 italic bg-white p-2 rounded border border-amber-200">
                    "{extractedResult.keyObservations}"
                  </p>
                )}

                <button
                  onClick={handleApplyExtractedToCase}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Apply Extracted Data to Form</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2 Body: Risk Assessment */}
        {activeTab === "risk" && (
          <div className="p-4 space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Building className="w-4 h-4 text-blue-600" />
                Evaluating Case #{currentCase?.id || "210"} ({currentCase?.customerName})
              </p>
              <p className="text-[11px] text-blue-700">
                Gemini AI evaluates survey locality parameters, negative remarks, ownership match, and structural details to issue a bank-grade risk score.
              </p>
            </div>

            <button
              onClick={handleRunAIRiskAssessment}
              disabled={isAnalyzing}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Risk Matrix...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Generate Risk & Valuation Report</span>
                </>
              )}
            </button>

            {riskReport && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-800">Risk Assessment Score</span>
                    <p className="text-2xl font-black text-amber-600">{riskReport.riskScore} / 100</p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      riskReport.riskCategory === "Low Risk"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {riskReport.riskCategory}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-800">Executive Officer Summary:</span>
                  <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-2.5 rounded-lg border border-gray-200 leading-relaxed">
                    {riskReport.executiveSummary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="font-bold text-emerald-900 block mb-1">Positive Factors</span>
                    <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                      {riskReport.positiveFactors?.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="font-bold text-amber-900 block mb-1">Risk Observations</span>
                    <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                      {riskReport.keyRiskFactors?.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-center text-xs">
                  <span className="text-gray-600">Recommended Loan-To-Value (LTV): </span>
                  <span className="font-extrabold text-blue-900 text-sm">{riskReport.recommendedLTV}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
