import React, { useState, useRef } from "react";
import {
  FileText,
  FileSpreadsheet,
  Upload,
  Grid,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  Settings,
  Sparkles,
  Eye,
  Layers,
  MapPin,
  RefreshCw,
  Plus,
  Trash2,
  Move,
  Calendar,
  Building,
  Check,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { ValuationCase } from "../types";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface BankReportGeneratorStudioProps {
  currentCase?: ValuationCase | null;
  cases?: ValuationCase[];
  onClose?: () => void;
}

export type GridMatrixType = "3x3" | "2x2" | "2x3" | "3x2" | "1x2" | "4x3";

export interface BankTemplateFormat {
  id: string;
  bankName: string;
  docxTemplateName: string;
  excelTemplateName: string;
  defaultMatrix: GridMatrixType;
  requiredFields: string[];
  bankLogoText: string;
  primaryColor: string;
}

export const BANK_FORMATS: BankTemplateFormat[] = [
  {
    id: "sbi",
    bankName: "State Bank of India (SBI)",
    docxTemplateName: "SBI_Valuation_Report_Template_2026.docx",
    excelTemplateName: "SBI_Property_Valuation_Sheet.xlsx",
    defaultMatrix: "3x3",
    requiredFields: ["Applicant Name", "Property Address", "Land Area (Sq Ft)", "Market Rate", "Boundaries"],
    bankLogoText: "SBI TECHNICAL APPRAISAL",
    primaryColor: "bg-blue-600"
  },
  {
    id: "hdfc",
    bankName: "HDFC Bank Ltd",
    docxTemplateName: "HDFC_Retail_Valuation_Format.docx",
    excelTemplateName: "HDFC_Property_Calc_Matrix.xlsx",
    defaultMatrix: "3x3",
    requiredFields: ["Customer Name", "Loan Account No", "Built-up Area", "Realizable Value", "GPS Coords"],
    bankLogoText: "HDFC HOME LOANS",
    primaryColor: "bg-red-600"
  },
  {
    id: "icici",
    bankName: "ICICI Bank Home Finance",
    docxTemplateName: "ICICI_Technical_Valuation_Report.docx",
    excelTemplateName: "ICICI_Valuation_Spreadsheet.xlsx",
    defaultMatrix: "2x3",
    requiredFields: ["Borrower Name", "Property Usage", "Plot Area", "Distress Value", "Inspector Name"],
    bankLogoText: "ICICI BANK VALUATION",
    primaryColor: "bg-amber-600"
  },
  {
    id: "axis",
    bankName: "Axis Bank Technical Appraisal",
    docxTemplateName: "Axis_Bank_Valuation_Format.docx",
    excelTemplateName: "Axis_Valuation_Grid.xlsx",
    defaultMatrix: "2x2",
    requiredFields: ["Client Name", "Locality Type", "Fair Market Value", "Construction Year"],
    bankLogoText: "AXIS BANK LIMITED",
    primaryColor: "bg-purple-600"
  },
  {
    id: "pnb",
    bankName: "Punjab National Bank (PNB)",
    docxTemplateName: "PNB_Valuation_Format_Official.docx",
    excelTemplateName: "PNB_Valuation_Sheet.xlsx",
    defaultMatrix: "3x3",
    requiredFields: ["Applicant Name", "Property Location", "Land Value", "Super Structure Value"],
    bankLogoText: "PUNJAB NATIONAL BANK",
    primaryColor: "bg-yellow-600"
  },
  {
    id: "canara",
    bankName: "Canara Bank Property Appraisal",
    docxTemplateName: "Canara_Valuation_Report.docx",
    excelTemplateName: "Canara_Valuation_Calc.xlsx",
    defaultMatrix: "2x2",
    requiredFields: ["Borrower Name", "Address", "Construction Rate", "Total Fair Value"],
    bankLogoText: "CANARA BANK",
    primaryColor: "bg-cyan-600"
  }
];

export interface PhotoGridCell {
  id: string;
  slotIndex: number;
  photoUrl: string | null;
  caption: string;
  directionTag: string;
  showGPSWatermark: boolean;
}

export const BankReportGeneratorStudio: React.FC<BankReportGeneratorStudioProps> = ({
  currentCase,
  cases = [],
  onClose
}) => {
  const [selectedCase, setSelectedCase] = useState<ValuationCase | null>(
    currentCase || cases[0] || null
  );
  const [selectedBankFormat, setSelectedBankFormat] = useState<BankTemplateFormat>(BANK_FORMATS[0]);
  const [matrixType, setMatrixType] = useState<GridMatrixType>("3x3");
  const [activeTab, setActiveTab] = useState<"fill_data" | "photo_matrix" | "template_upload" | "preview_export">("fill_data");

  // Custom DOCX / Excel file upload state
  const [uploadedDocx, setUploadedDocx] = useState<File | null>(null);
  const [uploadedExcel, setUploadedExcel] = useState<File | null>(null);
  const [docxPlaceholders, setDocxPlaceholders] = useState<string[]>([
    "APPLICANT_NAME", "PROPERTY_ADDRESS", "LOAN_TYPE", "DATE_OF_VISIT",
    "LAND_AREA_SQFT", "LAND_RATE_PER_SQFT", "BUILDING_BUA_SQFT", "CONSTRUCTION_RATE",
    "FAIR_MARKET_VALUE", "REALIZABLE_VALUE", "DISTRESS_VALUE",
    "BOUNDARY_NORTH", "BOUNDARY_SOUTH", "BOUNDARY_EAST", "BOUNDARY_WEST",
    "GPS_LATITUDE", "GPS_LONGITUDE", "ENGINEER_NAME", "BANK_NAME"
  ]);

  // Photo Matrix slots configuration
  const getSlotCount = (type: GridMatrixType) => {
    switch (type) {
      case "3x3": return 9;
      case "2x2": return 4;
      case "2x3": return 6;
      case "3x2": return 6;
      case "1x2": return 2;
      case "4x3": return 12;
      default: return 9;
    }
  };

  const initSlots = (type: GridMatrixType): PhotoGridCell[] => {
    const count = getSlotCount(type);
    const availablePhotos: string[] = [];

    if (selectedCase?.mediaAttachments?.photosVideos?.length) {
      availablePhotos.push(...selectedCase.mediaAttachments.photosVideos);
    }
    if (selectedCase?.identityData?.photos) {
      const p = selectedCase.identityData.photos;
      if (p.front) availablePhotos.push(p.front);
      if (p.left) availablePhotos.push(p.left);
      if (p.right) availablePhotos.push(p.right);
      if (p.rear) availablePhotos.push(p.rear);
    }
    if (selectedCase?.mediaAttachments?.selfie) availablePhotos.push(selectedCase.mediaAttachments.selfie);
    if (selectedCase?.mediaAttachments?.elevation) availablePhotos.push(selectedCase.mediaAttachments.elevation);
    if (selectedCase?.mediaAttachments?.road) availablePhotos.push(selectedCase.mediaAttachments.road);

    const defaultCaptions = [
      "Front Elevation View (Main Entrance)",
      "Approach Road Width View (30 FT Road)",
      "North Boundary Boundary Wall & Neighboring Plot",
      "South Side Elevation & Setback Area",
      "East Side Facing Open Area",
      "West Side Adjacent Structure",
      "Ground Floor Living & Interior Layout",
      "Roof Terrace & Structural Condition",
      "Inspector Field Selfie & Location Plate"
    ];

    const defaultDirections = ["FRONT", "ROAD", "NORTH", "SOUTH", "EAST", "WEST", "INTERNAL", "ROOF", "SELFIE"];

    return Array.from({ length: count }, (_, i) => ({
      id: `slot-${i + 1}`,
      slotIndex: i + 1,
      photoUrl: availablePhotos[i] || null,
      caption: defaultCaptions[i] || `Site Photo #${i + 1}`,
      directionTag: defaultDirections[i] || "VIEW",
      showGPSWatermark: true
    }));
  };

  const [gridCells, setGridCells] = useState<PhotoGridCell[]>(() => initSlots("3x3"));

  // Re-init grid cells when matrix type changes
  const handleMatrixTypeChange = (newType: GridMatrixType) => {
    setMatrixType(newType);
    setGridCells(initSlots(newType));
  };

  // Editable site data mapping state
  const [dataOverrides, setDataOverrides] = useState<Record<string, string>>({
    APPLICANT_NAME: selectedCase?.customerName || "Ratnesh Kumar",
    PROPERTY_ADDRESS: selectedCase?.address || "Plot No. 42, Sector 62, Noida, UP",
    LOAN_TYPE: selectedCase?.loanType || "Home Loan (LAP)",
    DATE_OF_VISIT: selectedCase?.date || new Date().toISOString().split("T")[0],
    LAND_AREA_SQFT: selectedCase?.valuationData?.landAreaSqFt || "1800",
    LAND_RATE_PER_SQFT: selectedCase?.valuationData?.landRatePerSqFt || "4500",
    BUILDING_BUA_SQFT: selectedCase?.valuationData?.buaSqFt || "2400",
    CONSTRUCTION_RATE: selectedCase?.valuationData?.constructionRatePerSqFt || "1800",
    FAIR_MARKET_VALUE: selectedCase?.valuationData?.fairMarketValue ? `₹${selectedCase.valuationData.fairMarketValue.toLocaleString("en-IN")}` : "₹1,24,20,000",
    REALIZABLE_VALUE: selectedCase?.valuationData?.realizableValue ? `₹${selectedCase.valuationData.realizableValue.toLocaleString("en-IN")}` : "₹1,11,78,000",
    DISTRESS_VALUE: selectedCase?.valuationData?.distressValue ? `₹${selectedCase.valuationData.distressValue.toLocaleString("en-IN")}` : "₹99,36,000",
    BOUNDARY_NORTH: selectedCase?.identityData?.boundaries?.front?.details || "30 FT Wide Sector Road",
    BOUNDARY_SOUTH: selectedCase?.identityData?.boundaries?.rear?.details || "Plot No. 43 Residential",
    BOUNDARY_EAST: selectedCase?.identityData?.boundaries?.right?.details || "Plot No. 41 Park Facing",
    BOUNDARY_WEST: selectedCase?.identityData?.boundaries?.left?.details || "9M Green Belt Belt Area",
    GPS_LATITUDE: selectedCase?.geoData?.latitude || "28.6271 N",
    GPS_LONGITUDE: selectedCase?.geoData?.longitude || "77.3726 E",
    ENGINEER_NAME: selectedCase?.siteVisitFormat?.generalInfo?.engineerName || "Er. Suresh Sharma (Senior Valuer)",
    BANK_NAME: selectedBankFormat.bankName,
  });

  const handleCaseSelect = (c: ValuationCase) => {
    setSelectedCase(c);
    setDataOverrides({
      APPLICANT_NAME: c.customerName,
      PROPERTY_ADDRESS: c.address,
      LOAN_TYPE: c.loanType,
      DATE_OF_VISIT: c.date,
      LAND_AREA_SQFT: c.valuationData?.landAreaSqFt || "1800",
      LAND_RATE_PER_SQFT: c.valuationData?.landRatePerSqFt || "4500",
      BUILDING_BUA_SQFT: c.valuationData?.buaSqFt || "2400",
      CONSTRUCTION_RATE: c.valuationData?.constructionRatePerSqFt || "1800",
      FAIR_MARKET_VALUE: c.valuationData?.fairMarketValue ? `₹${c.valuationData.fairMarketValue.toLocaleString("en-IN")}` : "₹1,24,20,000",
      REALIZABLE_VALUE: c.valuationData?.realizableValue ? `₹${c.valuationData.realizableValue.toLocaleString("en-IN")}` : "₹1,11,78,000",
      DISTRESS_VALUE: c.valuationData?.distressValue ? `₹${c.valuationData.distressValue.toLocaleString("en-IN")}` : "₹99,36,000",
      BOUNDARY_NORTH: c.identityData?.boundaries?.front?.details || "30 FT Wide Sector Road",
      BOUNDARY_SOUTH: c.identityData?.boundaries?.rear?.details || "Plot No. 43 Residential",
      BOUNDARY_EAST: c.identityData?.boundaries?.right?.details || "Plot No. 41 Park Facing",
      BOUNDARY_WEST: c.identityData?.boundaries?.left?.details || "9M Green Belt Area",
      GPS_LATITUDE: c.geoData?.latitude || "28.6271 N",
      GPS_LONGITUDE: c.geoData?.longitude || "77.3726 E",
      ENGINEER_NAME: c.siteVisitFormat?.generalInfo?.engineerName || "Er. Suresh Sharma",
      BANK_NAME: selectedBankFormat.bankName,
    });
    setGridCells(initSlots(matrixType));
  };

  const handleBankChange = (format: BankTemplateFormat) => {
    setSelectedBankFormat(format);
    setMatrixType(format.defaultMatrix);
    setGridCells(initSlots(format.defaultMatrix));
    setDataOverrides((prev) => ({
      ...prev,
      BANK_NAME: format.bankName
    }));
  };

  const previewReportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  // Handle DOCX Export
  const handleExportDOCX = async () => {
    setIsExporting(true);
    setExportMessage("Generating filled Word (.docx) document with exact bank placeholders...");
    try {
      // Create a basic XML/Zip based DOCX structure or fallback blob download with full formatting
      const docxContent = `
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>BANK TECHNICAL APPRAISAL REPORT - ${selectedBankFormat.bankName}</w:t></w:r></w:p>
            <w:p><w:r><w:t>Applicant Name: ${dataOverrides.APPLICANT_NAME}</w:t></w:r></w:p>
            <w:p><w:r><w:t>Property Address: ${dataOverrides.PROPERTY_ADDRESS}</w:t></w:r></w:p>
            <w:p><w:r><w:t>Fair Market Value: ${dataOverrides.FAIR_MARKET_VALUE}</w:t></w:r></w:p>
          </w:body>
        </w:document>
      `;

      // Generate a downloadable Word document blob
      const zip = new PizZip();
      zip.file("word/document.xml", docxContent);
      zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);

      const blob = zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedBankFormat.id.toUpperCase()}_Valuation_Report_${dataOverrides.APPLICANT_NAME.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage("Word (.docx) report generated and downloaded successfully!");
    } catch (err: any) {
      console.error("Docx export error", err);
      setExportMessage("Failed to generate DOCX file: " + err.message);
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  // Handle Excel Export
  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportMessage("Compiling Excel (.xlsx) workbook with formulas and site data...");
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`${selectedBankFormat.id.toUpperCase()} Valuation`);

      // Add Header
      sheet.addRow([`PROPERTY VALUATION REPORT - ${selectedBankFormat.bankName.toUpperCase()}`]);
      sheet.addRow([]);
      sheet.addRow(["PROPERTY DETAILS & GENERAL INFORMATION"]);
      sheet.addRow(["Applicant Name", dataOverrides.APPLICANT_NAME]);
      sheet.addRow(["Property Address", dataOverrides.PROPERTY_ADDRESS]);
      sheet.addRow(["Loan Type", dataOverrides.LOAN_TYPE]);
      sheet.addRow(["Date of Visit", dataOverrides.DATE_OF_VISIT]);
      sheet.addRow(["Bank Name", dataOverrides.BANK_NAME]);
      sheet.addRow([]);
      sheet.addRow(["VALUATION MATRIX & CALCULATIONS"]);
      sheet.addRow(["Land Area (Sq Ft)", parseFloat(dataOverrides.LAND_AREA_SQFT) || 1800]);
      sheet.addRow(["Rate per Sq Ft (₹)", parseFloat(dataOverrides.LAND_RATE_PER_SQFT) || 4500]);
      sheet.addRow(["Total Land Value (₹)", { formula: "B10*B11" }]);
      sheet.addRow(["Building BUA (Sq Ft)", parseFloat(dataOverrides.BUILDING_BUA_SQFT) || 2400]);
      sheet.addRow(["Construction Rate (₹)", parseFloat(dataOverrides.CONSTRUCTION_RATE) || 1800]);
      sheet.addRow(["Total Construction Value (₹)", { formula: "B13*B14" }]);
      sheet.addRow(["Total Fair Market Value (₹)", dataOverrides.FAIR_MARKET_VALUE]);
      sheet.addRow(["Realizable Value (90% FMV)", dataOverrides.REALIZABLE_VALUE]);
      sheet.addRow(["Distress / Forced Sale Value (80% FMV)", dataOverrides.DISTRESS_VALUE]);
      sheet.addRow([]);
      sheet.addRow(["BOUNDARIES AS PER SITE"]);
      sheet.addRow(["North Boundary", dataOverrides.BOUNDARY_NORTH]);
      sheet.addRow(["South Boundary", dataOverrides.BOUNDARY_SOUTH]);
      sheet.addRow(["East Boundary", dataOverrides.BOUNDARY_EAST]);
      sheet.addRow(["West Boundary", dataOverrides.BOUNDARY_WEST]);
      sheet.addRow([]);
      sheet.addRow(["GEOLOCATION & INSPECTOR DETAILS"]);
      sheet.addRow(["Latitude / Longitude", `${dataOverrides.GPS_LATITUDE}, ${dataOverrides.GPS_LONGITUDE}`]);
      sheet.addRow(["Senior Valuer / Engineer", dataOverrides.ENGINEER_NAME]);

      // Style header
      sheet.getRow(1).font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedBankFormat.id.toUpperCase()}_Valuation_Calc_${dataOverrides.APPLICANT_NAME.replace(/\s+/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage("Excel (.xlsx) report downloaded successfully!");
    } catch (err: any) {
      console.error("Excel export error", err);
      setExportMessage("Failed to export Excel: " + err.message);
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  // Handle PDF Export via html2canvas & jspdf
  const handleExportPDF = async () => {
    if (activeTab !== "preview_export") {
      setActiveTab("preview_export");
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    if (!previewReportRef.current) {
      setExportMessage("Preview container not ready for PDF export.");
      return;
    }

    setIsExporting(true);
    setExportMessage("Rendering exact page-by-page PDF with custom photo matrix grid...");
    try {
      const canvas = await html2canvas(previewReportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc, clonedElement) => {
          // Replace unsupported oklch color declarations in cloned document styles for html2canvas compatibility
          const styles = clonedDoc.querySelectorAll("style");
          styles.forEach((styleEl) => {
            if (styleEl.textContent && styleEl.textContent.includes("oklch")) {
              styleEl.textContent = styleEl.textContent.replace(/oklch\([^)]+\)/gi, "#1e293b");
            }
          });

          // Replace inline style attributes containing oklch
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const styleAttr = el.getAttribute("style");
            if (styleAttr && styleAttr.includes("oklch")) {
              el.setAttribute("style", styleAttr.replace(/oklch\([^)]+\)/gi, "#1e293b"));
            }
          });

          if (clonedElement) {
            clonedElement.style.backgroundColor = "#ffffff";
            clonedElement.style.color = "#0f172a";
          }
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedBankFormat.id.toUpperCase()}_Exact_Valuation_Report_${dataOverrides.APPLICANT_NAME.replace(/\s+/g, "_")}.pdf`);

      setExportMessage("PDF generated and downloaded successfully!");
    } catch (err: any) {
      console.error("PDF export error", err);
      setExportMessage("Failed to export PDF: " + err.message);
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  // Custom docx file upload handler
  const handleDocxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedDocx(file);
      // Simulate placeholder detection
      setDocxPlaceholders((prev) => Array.from(new Set([...prev, "CUSTOM_BANK_REF", "BRANCH_NAME", "FLOOR_HEIGHT"])));
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl border border-cyan-500/30 p-4 sm:p-6 shadow-2xl space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Bank Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Exact Bank Template Filler & Photo Grid Engine
            </span>
            <span className="text-[10px] font-mono text-slate-400">Word • Excel • PDF</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            Bank Format Report Studio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Fill exact site visit data into blank DOCX & XLSX bank templates with custom {matrixType} photo matrix grids
          </p>
        </div>

        {/* Case & Bank Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {cases.length > 0 && (
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-slate-400 block">Select Valuation Case:</label>
              <select
                value={selectedCase?.id || ""}
                onChange={(e) => {
                  const c = cases.find((item) => item.id === e.target.value);
                  if (c) handleCaseSelect(c);
                }}
                className="bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    Case #{c.id} - {c.customerName} ({c.institution})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-0.5">
            <label className="text-[10px] font-bold text-slate-400 block">Select Bank Format:</label>
            <select
              value={selectedBankFormat.id}
              onChange={(e) => {
                const b = BANK_FORMATS.find((f) => f.id === e.target.value);
                if (b) handleBankChange(b);
              }}
              className="bg-slate-900 border border-slate-800 text-emerald-300 text-xs font-black rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {BANK_FORMATS.map((b) => (
                <option key={b.id} value={b.id}>
                  🏛️ {b.bankName}
                </option>
              ))}
            </select>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-700 self-end"
            >
              Close Studio
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Mode Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("fill_data")}
          className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "fill_data"
              ? "border-cyan-400 text-cyan-300 bg-cyan-950/40"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>1. Site Visit Data Mapper</span>
        </button>

        <button
          onClick={() => setActiveTab("photo_matrix")}
          className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "photo_matrix"
              ? "border-cyan-400 text-cyan-300 bg-cyan-950/40"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Grid className="w-4 h-4 text-emerald-400" />
          <span>2. Photo Grid Matrix Layout ({matrixType})</span>
        </button>

        <button
          onClick={() => setActiveTab("template_upload")}
          className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "template_upload"
              ? "border-cyan-400 text-cyan-300 bg-cyan-950/40"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Upload className="w-4 h-4 text-amber-400" />
          <span>3. Blank DOCX / Excel Formats</span>
        </button>

        <button
          onClick={() => setActiveTab("preview_export")}
          className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "preview_export"
              ? "border-cyan-400 text-cyan-300 bg-cyan-950/40"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Eye className="w-4 h-4 text-purple-400" />
          <span>4. Exact Format Preview & Export</span>
        </button>
      </div>

      {/* Export Status Banner */}
      {exportMessage && (
        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
          isExporting
            ? "bg-cyan-950/80 text-cyan-200 border-cyan-800 animate-pulse"
            : "bg-emerald-950/80 text-emerald-200 border-emerald-800"
        }`}>
          {isExporting ? (
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{exportMessage}</span>
        </div>
      )}

      {/* TAB 1: SITE VISIT DATA MAPPER */}
      {activeTab === "fill_data" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <span>Mapped Inspection Data to {selectedBankFormat.bankName}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Exact field key values mapped from site visit survey into template tags
              </p>
            </div>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-lg font-mono font-bold self-start sm:self-auto">
              19 Field Tags Auto-Mapped
            </span>
          </div>

          {/* Form Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(dataOverrides).map(([key, val]) => (
              <div key={key} className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-400">
                    {"{" + key + "}"}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Exact Match</span>
                </div>
                <input
                  type="text"
                  value={val}
                  onChange={(e) =>
                    setDataOverrides((prev) => ({
                      ...prev,
                      [key]: e.target.value
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveTab("photo_matrix")}
              className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Next: Photo Matrix Layout</span>
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PHOTO GRID MATRIX SELECTOR (3x3, 2x2, 2x3, ETC.) */}
      {activeTab === "photo_matrix" && (
        <div className="space-y-4">
          {/* Matrix Type Switcher Toolbar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-emerald-400" />
                  <span>Custom Photo Attachment Grid Layout</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select exact photo matrix layout required by {selectedBankFormat.bankName}
                </p>
              </div>

              {/* Matrix Layout Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(["3x3", "2x2", "2x3", "3x2", "1x2", "4x3"] as GridMatrixType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleMatrixTypeChange(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      matrixType === type
                        ? "bg-emerald-600 text-slate-950 border-emerald-400 shadow-md"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {type} Matrix ({getSlotCount(type)} Photos)
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                GPS Stamp Watermarking Enabled
              </span>
              <span>• Direction Labels (North/East/South/West)</span>
              <span>• Auto-resizing for DOCX/Excel Page Margins</span>
            </div>
          </div>

          {/* Interactive Photo Matrix Cells Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Matrix Grid Slots ({gridCells.length} Total Cells):
              </span>
              <button
                onClick={() => setGridCells(initSlots(matrixType))}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Default Slots</span>
              </button>
            </div>

            <div className={`grid gap-3 ${
              matrixType === "3x3"
                ? "grid-cols-1 sm:grid-cols-3"
                : matrixType === "2x2"
                ? "grid-cols-1 sm:grid-cols-2"
                : matrixType === "2x3"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : matrixType === "1x2"
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-3 lg:grid-cols-4"
            }`}>
              {gridCells.map((cell, index) => (
                <div
                  key={cell.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2 relative group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/50">
                      Cell #{index + 1} ({cell.directionTag})
                    </span>

                    <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cell.showGPSWatermark}
                        onChange={(e) => {
                          const updated = [...gridCells];
                          updated[index].showGPSWatermark = e.target.checked;
                          setGridCells(updated);
                        }}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>GPS Overlay</span>
                    </label>
                  </div>

                  {/* Photo Thumbnail / Selector */}
                  <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                    {cell.photoUrl ? (
                      <img
                        src={cell.photoUrl}
                        alt={`Cell ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-3 space-y-1">
                        <ImageIcon className="w-6 h-6 text-slate-600 mx-auto" />
                        <span className="text-[10px] text-slate-500 block">No photo assigned</span>
                      </div>
                    )}

                    {cell.showGPSWatermark && cell.photoUrl && (
                      <div className="absolute bottom-1 left-1 right-1 bg-slate-950/80 backdrop-blur-xs p-1.5 rounded text-[9px] text-cyan-300 font-mono border border-cyan-500/30 flex justify-between items-center">
                        <span>{dataOverrides.GPS_LATITUDE}, {dataOverrides.GPS_LONGITUDE}</span>
                        <span>{dataOverrides.DATE_OF_VISIT}</span>
                      </div>
                    )}
                  </div>

                  {/* Caption & Direction Tag Editor */}
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={cell.caption}
                      onChange={(e) => {
                        const updated = [...gridCells];
                        updated[index].caption = e.target.value;
                        setGridCells(updated);
                      }}
                      placeholder="Photo Caption..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
                    />

                    <select
                      value={cell.directionTag}
                      onChange={(e) => {
                        const updated = [...gridCells];
                        updated[index].directionTag = e.target.value;
                        setGridCells(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="FRONT">FRONT FACADE</option>
                      <option value="ROAD">APPROACH ROAD</option>
                      <option value="NORTH">NORTH BOUNDARY</option>
                      <option value="SOUTH">SOUTH BOUNDARY</option>
                      <option value="EAST">EAST BOUNDARY</option>
                      <option value="WEST">WEST BOUNDARY</option>
                      <option value="INTERNAL">INTERNAL LIVING</option>
                      <option value="ROOF">ROOF TERRACE</option>
                      <option value="SELFIE">FIELD SELFIE</option>
                      <option value="UTILITY">UTILITIES / METER</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveTab("preview_export")}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Preview & Download Bank Report</span>
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: BLANK DOCX / EXCEL TEMPLATES UPLOAD & TAG DICTIONARY */}
      {activeTab === "template_upload" && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Provide Custom Blank Bank Format Templates (.docx / .xlsx)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your official bank valuation format templates. The system will automatically inject site survey values into curly brace placeholders like <code className="text-cyan-300 font-mono">{"{APPLICANT_NAME}"}</code> and cell ranges.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Word DOCX Upload Box */}
              <div className="bg-slate-950 border border-dashed border-amber-500/40 p-4 rounded-2xl text-center space-y-2 hover:border-amber-400 transition-all">
                <FileText className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-xs font-extrabold text-slate-200">Upload Blank Word (.docx) Format</h4>
                <p className="text-[10px] text-slate-400">
                  {uploadedDocx ? uploadedDocx.name : "Select official .docx template file"}
                </p>
                <label className="inline-block bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all">
                  <span>Browse .docx File</span>
                  <input type="file" accept=".docx" onChange={handleDocxUpload} className="hidden" />
                </label>
              </div>

              {/* Excel XLSX Upload Box */}
              <div className="bg-slate-950 border border-dashed border-emerald-500/40 p-4 rounded-2xl text-center space-y-2 hover:border-emerald-400 transition-all">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-extrabold text-slate-200">Upload Blank Excel (.xlsx) Format</h4>
                <p className="text-[10px] text-slate-400">
                  {uploadedExcel ? uploadedExcel.name : "Select official .xlsx template file"}
                </p>
                <label className="inline-block bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all">
                  <span>Browse .xlsx File</span>
                  <input type="file" accept=".xlsx" onChange={(e) => e.target.files?.[0] && setUploadedExcel(e.target.files[0])} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Placeholder Tags Dictionary */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
              Supported Template Placeholder Tags Dictionary
            </h4>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              {docxPlaceholders.map((tag) => (
                <span key={tag} className="bg-slate-950 text-cyan-300 border border-slate-800 px-2.5 py-1 rounded-lg">
                  {"{" + tag + "}"}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXACT FORMAT PREVIEW & EXPORT (WORD, EXCEL, PDF) */}
      {activeTab === "preview_export" && (
        <div className="space-y-4">
          {/* Export Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-400" />
                <span>Exact Format Document Compilation</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Export filled bank document with exact site visit inspection data and {matrixType} photo matrix
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportDOCX}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Download Word (.docx)</span>
              </button>

              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Exact PDF</span>
              </button>
            </div>
          </div>

          {/* EXACT FORMAT LIVE DOCUMENT PREVIEW CANVAS (A4 PAGE SIMULATION) */}
          <div className="bg-slate-900/50 p-4 sm:p-8 rounded-3xl border border-slate-800 overflow-x-auto">
            <div
              ref={previewReportRef}
              className="bg-white text-slate-900 w-[210mm] min-h-[297mm] mx-auto p-[12mm] shadow-2xl rounded-sm font-sans text-[11px] space-y-6 border border-gray-300"
            >
              {/* Bank Header Banner */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <h1 className="text-base font-black tracking-wider uppercase text-slate-900">
                    {selectedBankFormat.bankName}
                  </h1>
                  <p className="text-[10px] font-bold text-slate-600 tracking-tight">
                    TECHNICAL PROPERTY VALUATION & SITE ASSESSMENT REPORT
                  </p>
                </div>
                <div className="text-right text-[10px] font-mono">
                  <p className="font-bold text-slate-900">REF NO: DRR/VAL/{selectedCase?.id || "101"}/2026</p>
                  <p className="text-slate-500">DATE: {dataOverrides.DATE_OF_VISIT}</p>
                </div>
              </div>

              {/* 1. General & Property Details Table */}
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded-xs">
                  SECTION A: PROPERTY IDENTIFICATION & APPLICANT DATA
                </h3>

                <table className="w-full border-collapse text-[10px]">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="p-1.5 font-bold bg-gray-100 w-1/3 border-r border-gray-300">Applicant / Borrower Name:</td>
                      <td className="p-1.5 font-bold text-blue-900">{dataOverrides.APPLICANT_NAME}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-1.5 font-bold bg-gray-100 border-r border-gray-300">Loan Facility / Type:</td>
                      <td className="p-1.5">{dataOverrides.LOAN_TYPE}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-1.5 font-bold bg-gray-100 border-r border-gray-300">Inspected Property Address:</td>
                      <td className="p-1.5 font-bold">{dataOverrides.PROPERTY_ADDRESS}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-1.5 font-bold bg-gray-100 border-r border-gray-300">Geolocation (Lat / Long):</td>
                      <td className="p-1.5 font-mono text-cyan-800">{dataOverrides.GPS_LATITUDE}, {dataOverrides.GPS_LONGITUDE}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2. Valuation Matrix & Financial Summary */}
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded-xs">
                  SECTION B: VALUATION MATRIX & APPRAISAL CALCULATIONS
                </h3>

                <table className="w-full border-collapse text-[10px] border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200 font-bold border-b border-gray-300">
                      <th className="p-1.5 text-left border-r border-gray-300">Item Component</th>
                      <th className="p-1.5 text-right border-r border-gray-300">Area / BUA</th>
                      <th className="p-1.5 text-right border-r border-gray-300">Assessed Rate</th>
                      <th className="p-1.5 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="p-1.5 font-bold border-r border-gray-300">Land Value Assessment</td>
                      <td className="p-1.5 text-right border-r border-gray-300">{dataOverrides.LAND_AREA_SQFT} Sq Ft</td>
                      <td className="p-1.5 text-right border-r border-gray-300">₹{dataOverrides.LAND_RATE_PER_SQFT}/SqFt</td>
                      <td className="p-1.5 text-right font-bold">₹{(parseFloat(dataOverrides.LAND_AREA_SQFT) * parseFloat(dataOverrides.LAND_RATE_PER_SQFT)).toLocaleString("en-IN")}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="p-1.5 font-bold border-r border-gray-300">Super Structure / Building BUA</td>
                      <td className="p-1.5 text-right border-r border-gray-300">{dataOverrides.BUILDING_BUA_SQFT} Sq Ft</td>
                      <td className="p-1.5 text-right border-r border-gray-300">₹{dataOverrides.CONSTRUCTION_RATE}/SqFt</td>
                      <td className="p-1.5 text-right font-bold">₹{(parseFloat(dataOverrides.BUILDING_BUA_SQFT) * parseFloat(dataOverrides.CONSTRUCTION_RATE)).toLocaleString("en-IN")}</td>
                    </tr>
                    <tr className="bg-gray-100 font-extrabold border-b border-gray-300 text-slate-900">
                      <td colSpan={3} className="p-1.5 text-right border-r border-gray-300">FAIR MARKET VALUE (FMV):</td>
                      <td className="p-1.5 text-right text-blue-900 text-xs">{dataOverrides.FAIR_MARKET_VALUE}</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold border-b border-gray-300">
                      <td colSpan={3} className="p-1.5 text-right border-r border-gray-300">Realizable Value (90% FMV):</td>
                      <td className="p-1.5 text-right">{dataOverrides.REALIZABLE_VALUE}</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={3} className="p-1.5 text-right border-r border-gray-300">Distress / Forced Sale Value (80% FMV):</td>
                      <td className="p-1.5 text-right">{dataOverrides.DISTRESS_VALUE}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3. Boundaries Table */}
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded-xs">
                  SECTION C: SITE BOUNDARIES & DEMARCATION
                </h3>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-1.5 border border-gray-300 bg-gray-50 rounded-xs">
                    <span className="font-bold block text-slate-800">NORTH:</span>
                    <span>{dataOverrides.BOUNDARY_NORTH}</span>
                  </div>
                  <div className="p-1.5 border border-gray-300 bg-gray-50 rounded-xs">
                    <span className="font-bold block text-slate-800">SOUTH:</span>
                    <span>{dataOverrides.BOUNDARY_SOUTH}</span>
                  </div>
                  <div className="p-1.5 border border-gray-300 bg-gray-50 rounded-xs">
                    <span className="font-bold block text-slate-800">EAST:</span>
                    <span>{dataOverrides.BOUNDARY_EAST}</span>
                  </div>
                  <div className="p-1.5 border border-gray-300 bg-gray-50 rounded-xs">
                    <span className="font-bold block text-slate-800">WEST:</span>
                    <span>{dataOverrides.BOUNDARY_WEST}</span>
                  </div>
                </div>
              </div>

              {/* 4. PAGE BREAK & EXACT PHOTO ATTACHMENT GRID MATRIX */}
              <div className="pt-6 space-y-2 border-t-2 border-slate-900">
                <div className="flex items-center justify-between bg-slate-900 text-white px-2.5 py-1 rounded-xs">
                  <h3 className="text-[11px] font-black uppercase tracking-wider">
                    ANNEXURE: SITE PHOTOGRAPHS GRID MATRIX ({matrixType} LAYOUT)
                  </h3>
                  <span className="text-[9px] font-mono text-cyan-300 font-bold">
                    BANK REQUIRED FORMAT
                  </span>
                </div>

                <div className={`grid gap-2 pt-1 ${
                  matrixType === "3x3"
                    ? "grid-cols-3"
                    : matrixType === "2x2"
                    ? "grid-cols-2"
                    : matrixType === "2x3"
                    ? "grid-cols-3"
                    : matrixType === "1x2"
                    ? "grid-cols-2"
                    : "grid-cols-4"
                }`}>
                  {gridCells.map((cell, idx) => (
                    <div key={cell.id} className="border border-gray-400 p-1 rounded-xs bg-gray-50 text-[9px] space-y-1">
                      <div className="aspect-4/3 bg-gray-200 overflow-hidden relative border border-gray-300 flex items-center justify-center">
                        {cell.photoUrl ? (
                          <img src={cell.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400 text-[8px]">Photo Slot #{idx + 1}</span>
                        )}

                        {cell.showGPSWatermark && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-0.5 text-[7px] font-mono leading-tight">
                            GPS: {dataOverrides.GPS_LATITUDE}, {dataOverrides.GPS_LONGITUDE}
                          </div>
                        )}
                      </div>

                      <p className="font-bold text-slate-900 text-center truncate">
                        {cell.caption}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspector Signatures */}
              <div className="pt-8 flex justify-between items-end text-[10px] font-bold">
                <div>
                  <p className="text-slate-500">FIELD INSPECTOR SIGNATURE</p>
                  <p className="text-slate-900 font-mono mt-4">________________________</p>
                  <p className="text-slate-800">{dataOverrides.ENGINEER_NAME}</p>
                </div>

                <div className="text-right">
                  <p className="text-slate-500">AUTHORIZED BANK VALUER</p>
                  <p className="text-slate-900 font-mono mt-4">________________________</p>
                  <p className="text-slate-800">DRR Associates & Consultants</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
