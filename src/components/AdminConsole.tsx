import React, { useState, useEffect } from "react";
import {
  Users,
  FilePlus,
  Grid,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  Building,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Sparkles,
  Shield,
  Layers,
  UserCheck,
  Send,
  Zap,
  Upload,
  Trash2,
  Plus,
  Building2,
  FileCode,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { ValuationCase, OnboardedInstitution } from "../types";
import { BankReportGeneratorStudio } from "./BankReportGeneratorStudio";

interface AdminConsoleProps {
  cases: ValuationCase[];
  onNavigateToCase?: (c: ValuationCase) => void;
  onCreateCase?: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  cases,
  onNavigateToCase,
  onCreateCase,
}) => {
  const [activeTab, setActiveTab] = useState<"pipeline" | "institutions" | "templates" | "users">("pipeline");

  // Institution & Bank Onboarding API State
  const [institutions, setInstitutions] = useState<OnboardedInstitution[]>([]);
  const [isLoadingInst, setIsLoadingInst] = useState<boolean>(false);
  const [instName, setInstName] = useState("");
  const [instCode, setInstCode] = useState("");
  const [instCategory, setInstCategory] = useState("Housing Finance Co");
  const [instEmail, setInstEmail] = useState("");
  const [instPhone, setInstPhone] = useState("");
  const [instLtv, setInstLtv] = useState("80%");
  const [metaDocFile, setMetaDocFile] = useState<{
    base64: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [instSubmitStatus, setInstSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSubmittingInst, setIsSubmittingInst] = useState(false);

  // Edit Institution state
  const [editingInst, setEditingInst] = useState<OnboardedInstitution | null>(null);
  const [editInstName, setEditInstName] = useState("");
  const [editInstCode, setEditInstCode] = useState("");
  const [editInstCategory, setEditInstCategory] = useState("Housing Finance Co");
  const [editInstEmail, setEditInstEmail] = useState("");
  const [editInstPhone, setEditInstPhone] = useState("");
  const [editInstLtv, setEditInstLtv] = useState("80%");
  const [isSavingEditInst, setIsSavingEditInst] = useState(false);
  const [editInstError, setEditInstError] = useState("");

  const handleOpenEditInst = (inst: OnboardedInstitution) => {
    setEditingInst(inst);
    setEditInstName(inst.name);
    setEditInstCode(inst.code);
    setEditInstCategory(inst.category || "Housing Finance Co");
    setEditInstEmail(inst.contactEmail || "");
    setEditInstPhone(inst.contactPhone || "");
    setEditInstLtv(inst.defaultLTV || "80%");
    setEditInstError("");
  };

  const handleSaveEditInst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst) return;
    setIsSavingEditInst(true);
    setEditInstError("");

    try {
      const res = await fetch(`/api/institutions/${editingInst.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editInstName,
          code: editInstCode,
          category: editInstCategory,
          contactEmail: editInstEmail,
          contactPhone: editInstPhone,
          defaultLTV: editInstLtv,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInstitutions((prev) =>
          prev.map((item) =>
            item.id === editingInst.id ? { ...item, ...data.institution } : item
          )
        );
        setEditingInst(null);
      } else {
        setEditInstError(data.message || "Failed to update institution");
      }
    } catch (err) {
      setEditInstError("Failed to connect to server to update institution");
    } finally {
      setIsSavingEditInst(false);
    }
  };

  const fetchInstitutions = async () => {
    setIsLoadingInst(true);
    try {
      const res = await fetch("/api/institutions");
      const data = await res.json();
      if (data.success && Array.isArray(data.institutions)) {
        setInstitutions(data.institutions);
      }
    } catch (err) {
      console.error("Failed to load onboarded institutions from API:", err);
    } finally {
      setIsLoadingInst(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleMetaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const ext = file.name.endsWith(".xlsx") ? "xlsx" : file.name.endsWith(".docx") ? "docx" : "pdf";
      setMetaDocFile({
        base64,
        name: file.name,
        type: ext,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleOnboardInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim()) {
      alert("Bank / Institution name is required.");
      return;
    }

    setIsSubmittingInst(true);
    setInstSubmitStatus(null);

    try {
      const res = await fetch("/api/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: instName,
          code: instCode,
          category: instCategory,
          contactEmail: instEmail,
          contactPhone: instPhone,
          defaultLTV: instLtv,
          metaDocumentBase64: metaDocFile?.base64,
          metaDocumentName: metaDocFile?.name,
          metaDocumentType: metaDocFile?.type,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInstSubmitStatus({ success: true, message: data.message });
        setInstName("");
        setInstCode("");
        setInstEmail("");
        setInstPhone("");
        setMetaDocFile(null);
        await fetchInstitutions();
      } else {
        setInstSubmitStatus({ success: false, message: data.message || "Failed to onboard bank." });
      }
    } catch (err: any) {
      setInstSubmitStatus({ success: false, message: "Server connection error." });
    } finally {
      setIsSubmittingInst(false);
    }
  };

  const handleRemoveInstitution = (id: string, name: string) => {
    setDeleteConfirmTarget({ type: "institution", id, name });
  };

  const executeDeleteInstitution = async (id: string, name: string) => {
    // Optimistically remove card from state so UI updates instantly
    setInstitutions((prev) => prev.filter((item) => item.id !== id));
    try {
      const res = await fetch(`/api/institutions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        await fetchInstitutions();
        setUserErrorMsg(data.message || "Failed to remove institution");
      }
    } catch (err) {
      await fetchInstitutions();
      setUserErrorMsg("Error deleting institution from server");
    }
  };

  const [selectedRole, setSelectedRole] = useState<"admin" | "engineer" | "drafter" | "reviewer">("admin");
  const [selectedBankTemplate, setSelectedBankTemplate] = useState<string>("SBI");
  const [selectedCaseForDraft, setSelectedCaseForDraft] = useState<ValuationCase | null>(
    cases[0] || null
  );

  // Bank Template Matrix Configuration
  const BANK_TEMPLATES = [
    { id: "SBI", name: "State Bank of India (SBI)", docx: true, excel: true, photoGrid: "2x2 Matrix (4 Photos/Page)", tags: ["ELEVATION", "SELFIE", "ROAD_WIDTH", "INNER_HALL"] },
    { id: "HDFC", name: "HDFC Bank Ltd", docx: true, excel: true, photoGrid: "3x2 Matrix (6 Photos/Page)", tags: ["FRONT_FACADE", "BOUNDARIES", "SITE_SELFIE", "NEIGHBORHOOD", "KITCHEN", "BALCONY"] },
    { id: "ICICI", name: "ICICI Bank Home Finance", docx: true, excel: true, photoGrid: "2x3 Matrix (6 Photos/Page)", tags: ["PROPERTY_ENTRANCE", "NAMEPLATE", "ROAD_APPROACH", "ROOF_TERRACE", "NORTH_BOUND", "SOUTH_BOUND"] },
    { id: "PNB", name: "Punjab National Bank (PNB)", docx: true, excel: false, photoGrid: "1x2 Matrix (2 Photos/Page)", tags: ["FRONT_ELEVATION", "INSPECTOR_SELFIE"] },
    { id: "CANARA", name: "Canara Bank Valuation", docx: true, excel: true, photoGrid: "2x2 Matrix (4 Photos/Page)", tags: ["PROPERTY_FRONT", "LANDMARK", "ELECTRIC_METER", "INTERNAL_ROOM"] },
  ];

  const currentTemplate = BANK_TEMPLATES.find((t) => t.id === selectedBankTemplate) || BANK_TEMPLATES[0];

  const [usersList, setUsersList] = useState<any[]>([
    { id: "USR-004", name: "Pooja Gupta", email: "admin@drrconsultants.in", phone: "9811223344", role: "admin", branch: "Delhi NCR" },
    { id: "USR-001", name: "Ratnesh Kumar", email: "ratnesh.delhi@drrconsultants.in", phone: "9812345670", role: "engineer", branch: "Delhi NCR" },
    { id: "USR-002", name: "Suresh Sharma", email: "suresh.lucknow@drrconsultants.in", phone: "9898989898", role: "reviewer", branch: "Lucknow" },
    { id: "USR-003", name: "Anit Verma", email: "anit.drafter@drrconsultants.in", phone: "9876543211", role: "drafter", branch: "Delhi NCR" },
  ]);

  // Branches Management State
  const [branchesList, setBranchesList] = useState<any[]>([
    { id: "BR-01", name: "Delhi NCR", code: "DEL", address: "Connaught Place, Central Delhi, 110001", phone: "+91 11 4567 8900", manager: "Pooja Gupta", status: "Active" },
    { id: "BR-02", name: "Lucknow", code: "LKO", address: "Hazratganj Main Road, Lucknow, UP 226001", phone: "+91 522 220 1122", manager: "Suresh Sharma", status: "Active" },
    { id: "BR-03", name: "Noida", code: "NDA", address: "Sector 62 Tech Park, Noida, UP 201309", phone: "+91 120 456 7890", manager: "Ratnesh Kumar", status: "Active" },
    { id: "BR-04", name: "Ghaziabad", code: "GZB", address: "Raj Nagar District Centre, Ghaziabad, UP 201002", phone: "+91 120 280 4455", manager: "Anit Verma", status: "Active" },
    { id: "BR-05", name: "Jaipur", code: "JPR", address: "M.I. Road Commercial Hub, Jaipur, RJ 302001", phone: "+91 141 236 9900", manager: "Vikram Singh", status: "Active" },
  ]);

  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchCode, setNewBranchCode] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");
  const [newBranchManager, setNewBranchManager] = useState("");
  const [branchSuccessMsg, setBranchSuccessMsg] = useState("");
  const [branchErrorMsg, setBranchErrorMsg] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [editBranchName, setEditBranchName] = useState("");
  const [editBranchCode, setEditBranchCode] = useState("");
  const [editBranchAddress, setEditBranchAddress] = useState("");
  const [editBranchPhone, setEditBranchPhone] = useState("");
  const [editBranchManager, setEditBranchManager] = useState("");
  const [editBranchStatus, setEditBranchStatus] = useState<"Active" | "Inactive">("Active");
  const [isUpdatingBranch, setIsUpdatingBranch] = useState(false);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<"engineer" | "drafter" | "reviewer" | "admin">("engineer");
  const [newUserBranch, setNewUserBranch] = useState<string>("Delhi NCR");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [userSuccessMsg, setUserSuccessMsg] = useState("");
  const [userErrorMsg, setUserErrorMsg] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserRole, setEditUserRole] = useState<"engineer" | "drafter" | "reviewer" | "admin">("engineer");
  const [editUserBranch, setEditUserBranch] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: "branch" | "user" | "institution";
    id: string;
    name: string;
  } | null>(null);

  // Fetch registered users and branches on mount
  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = () => {
    fetch("/api/auth/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.users) {
          setUsersList(data.users);
        }
      })
      .catch((err) => console.log("Failed to fetch users list", err));
  };

  const fetchBranches = () => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.branches && data.branches.length > 0) {
          setBranchesList(data.branches);
        }
      })
      .catch((err) => console.log("Failed to fetch branches list", err));
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBranchErrorMsg("");
    setBranchSuccessMsg("");
    setIsCreatingBranch(true);

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBranchName,
          code: newBranchCode,
          address: newBranchAddress,
          phone: newBranchPhone,
          manager: newBranchManager,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBranchSuccessMsg(data.message || "Branch created successfully!");
        setBranchesList((prev) => [...prev, data.branch]);
        setNewBranchName("");
        setNewBranchCode("");
        setNewBranchAddress("");
        setNewBranchPhone("");
        setNewBranchManager("");
        setTimeout(() => {
          setIsAddBranchOpen(false);
          setBranchSuccessMsg("");
        }, 1800);
      } else {
        setBranchErrorMsg(data.message || "Failed to create branch");
      }
    } catch (err: any) {
      setBranchErrorMsg("Error connecting to server to create branch.");
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleDeleteBranch = (branchId: string, branchName: string) => {
    setDeleteConfirmTarget({ type: "branch", id: branchId, name: branchName });
  };

  const executeDeleteBranch = async (branchId: string, branchName: string) => {
    setBranchErrorMsg("");
    setBranchSuccessMsg("");
    try {
      const res = await fetch(`/api/branches/${branchId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBranchesList((prev) => prev.filter((b) => b.id !== branchId));
        setBranchSuccessMsg(`Branch '${branchName}' deleted successfully.`);
        setTimeout(() => setBranchSuccessMsg(""), 3000);
      } else {
        setBranchErrorMsg(data.message || "Failed to delete branch");
      }
    } catch (err) {
      setBranchErrorMsg("Error connecting to server to delete branch.");
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    setBranchErrorMsg("");
    setBranchSuccessMsg("");
    setIsUpdatingBranch(true);

    try {
      const res = await fetch(`/api/branches/${editingBranch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editBranchName,
          code: editBranchCode,
          address: editBranchAddress,
          phone: editBranchPhone,
          manager: editBranchManager,
          status: editBranchStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBranchSuccessMsg("Branch updated successfully!");
        setBranchesList((prev) =>
          prev.map((b) => (b.id === editingBranch.id ? data.branch : b))
        );
        setTimeout(() => {
          setEditingBranch(null);
          setBranchSuccessMsg("");
        }, 1500);
      } else {
        setBranchErrorMsg(data.message || "Failed to update branch");
      }
    } catch (err: any) {
      setBranchErrorMsg("Error connecting to server to update branch.");
    } finally {
      setIsUpdatingBranch(false);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setDeleteConfirmTarget({ type: "user", id: userId, name: userName });
  };

  const executeDeleteUser = async (userId: string, userName: string) => {
    setUserErrorMsg("");
    setUserSuccessMsg("");
    try {
      const res = await fetch(`/api/auth/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        setUserSuccessMsg(`Employee '${userName}' removed successfully.`);
        setTimeout(() => setUserSuccessMsg(""), 3000);
      } else {
        setUserErrorMsg(data.message || "Failed to delete employee");
      }
    } catch (err) {
      setUserErrorMsg("Error connecting to server to delete employee.");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserErrorMsg("");
    setUserSuccessMsg("");
    setIsUpdatingUser(true);

    try {
      const payload: any = {
        name: editUserName,
        email: editUserEmail,
        phone: editUserPhone,
        role: editUserRole,
        branch: editUserBranch,
      };
      if (editUserPassword) {
        payload.password = editUserPassword;
      }

      const res = await fetch(`/api/auth/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setUserSuccessMsg("Employee updated successfully!");
        setUsersList((prev) =>
          prev.map((u) => (u.id === editingUser.id ? data.user : u))
        );
        setTimeout(() => {
          setEditingUser(null);
          setUserSuccessMsg("");
        }, 1500);
      } else {
        setUserErrorMsg(data.message || "Failed to update employee");
      }
    } catch (err: any) {
      setUserErrorMsg("Error connecting to server to update employee.");
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrorMsg("");
    setUserSuccessMsg("");
    setIsCreatingUser(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          phone: newUserPhone,
          role: newUserRole,
          branch: newUserBranch,
          password: newUserPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUserSuccessMsg(data.message || "User created successfully!");
        setUsersList((prev) => [data.user, ...prev]);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPhone("");
        setNewUserPassword("");
        setTimeout(() => {
          setIsAddUserOpen(false);
          setUserSuccessMsg("");
        }, 1800);
      } else {
        setUserErrorMsg(data.message || "Failed to create user");
      }
    } catch (err: any) {
      setUserErrorMsg("Error connecting to server to create user.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const [assignedEngineerMap, setAssignedEngineerMap] = useState<Record<string, string>>({
    "101": "Ratnesh Kumar",
    "102": "Ratnesh Kumar",
    "103": "Unassigned",
  });

  const handleAssignEngineer = (caseId: string, engineerName: string) => {
    setAssignedEngineerMap((prev) => ({ ...prev, [caseId]: engineerName }));
  };

  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const handleDownloadBankReport = async (format: "docx" | "xlsx") => {
    if (!selectedCaseForDraft) return;
    setDownloadingFormat(format);
    try {
      const res = await fetch("/api/export/bank-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCaseForDraft.id,
          bankName: currentTemplate.name,
          formatType: format,
        }),
      });
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      } else {
        alert("Failed to export bank format: " + (data.message || "Error"));
      }
    } catch (err: any) {
      alert("Error generating bank export: " + err.message);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div id="admin-console-container" className="max-w-4xl mx-auto p-4 space-y-5 font-sans text-slate-900 pb-16">
      {/* Console Top Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Enterprise Management
            </span>
            <span className="text-[10px] font-bold text-slate-500 font-mono">DRR Enterprise Portal</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Valuation Management & Template Drafter
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Admin Web Console, Mobile Field App, Image Tagger & Bank Report Export
          </p>
        </div>

        {/* Role Switcher pills */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1 shadow-2xs">
          <button
            onClick={() => setSelectedRole("admin")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedRole === "admin" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏢 Admin
          </button>
          <button
            onClick={() => setSelectedRole("engineer")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedRole === "engineer" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            👷 Engineer
          </button>
          <button
            onClick={() => setSelectedRole("drafter")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedRole === "drafter" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ✏️ Drafter
          </button>
          <button
            onClick={() => setSelectedRole("reviewer")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedRole === "reviewer" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🔍 Reviewer
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("pipeline")}
          className={`pb-3 transition-colors whitespace-nowrap relative ${
            activeTab === "pipeline" ? "text-blue-700 font-black" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Valuation Workflow Pipeline
          {activeTab === "pipeline" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
        </button>

        <button
          onClick={() => setActiveTab("institutions")}
          className={`pb-3 transition-colors whitespace-nowrap relative flex items-center gap-1.5 ${
            activeTab === "institutions" ? "text-blue-700 font-black" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Bank Onboarding & Format Specs
          {activeTab === "institutions" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-t-full" />}
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 transition-colors whitespace-nowrap relative ${
            activeTab === "templates" ? "text-cyan-400 font-black" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Bank Templates & Image Tagger
          {activeTab === "templates" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-t-full" />}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 transition-colors relative ${
            activeTab === "users" ? "text-cyan-400 font-black" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          User & Engineer Management
          {activeTab === "users" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-t-full" />}
        </button>
      </div>

      {/* TAB 1: VALUATION WORKFLOW PIPELINE */}
      {activeTab === "pipeline" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">
              Active Case Stage Tracker
            </h2>
            {onCreateCase && (
              <button
                onClick={onCreateCase}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
              >
                <FilePlus className="w-3.5 h-3.5" />
                Initiate New Case
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {cases.map((c) => {
              const assignedEng = assignedEngineerMap[c.id] || "Ratnesh Kumar";
              return (
                <div
                  key={c.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                          Case #{c.id}
                        </span>
                        <span className="text-xs font-bold text-slate-100">{c.institution}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-200 mt-1">{c.customerName} - {c.address}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        c.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}>
                        Stage: {c.status === "Completed" ? "Ready for Review / Export" : "Site Survey In-Progress"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] uppercase font-bold text-slate-500">1. Assigned Engineer</p>
                      <select
                        value={assignedEng}
                        onChange={(e) => handleAssignEngineer(c.id, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 mt-1 text-xs font-bold text-cyan-300 focus:outline-none"
                      >
                        <option value="Ratnesh Kumar">Ratnesh Kumar</option>
                        <option value="Anit Verma">Anit Verma</option>
                        <option value="Unassigned">Unassigned</option>
                      </select>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] uppercase font-bold text-slate-500">2. Drafter Status</p>
                      <p className="font-bold text-amber-400 mt-1">
                        {c.status === "Completed" ? "Auto-Tagged (SBI 2x2 Grid)" : "Awaiting Field Survey"}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] uppercase font-bold text-slate-500">3. Reviewer Signoff</p>
                      <p className="font-bold text-slate-300 mt-1">
                        {c.status === "Completed" ? "FMV: ₹" + (c.valuationData?.fairMarketValue || 6960000).toLocaleString("en-IN") : "Pending Survey"}
                      </p>
                    </div>
                  </div>

                  {onNavigateToCase && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onNavigateToCase(c)}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        Open Mobile Survey View →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BANK TEMPLATES & IMAGE TAGGER MATRIX */}
      {activeTab === "templates" && (
        <BankReportGeneratorStudio currentCase={selectedCaseForDraft} cases={cases} />
      )}

      {/* TAB 3: ORGANIZATION & BRANCH HIERARCHY MANAGEMENT */}
      {activeTab === "users" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
          {/* Header & Stat Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Organization & Branch Hierarchy Directory
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Manage regional company branches, assigned employees, and role access credentials synchronized across all applications.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsAddBranchOpen(!isAddBranchOpen);
                  if (isAddUserOpen) setIsAddUserOpen(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddBranchOpen ? "Close Branch Form" : "+ Add New Branch"}</span>
              </button>

              <button
                onClick={() => {
                  setIsAddUserOpen(!isAddUserOpen);
                  if (isAddBranchOpen) setIsAddBranchOpen(false);
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isAddUserOpen ? "Close Staff Form" : "+ Add Employee / Credentials"}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800/40">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Company Branches</p>
                <p className="text-base font-extrabold text-cyan-300">{branchesList.length}</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800/40">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Staff</p>
                <p className="text-base font-extrabold text-emerald-300">{usersList.length}</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-blue-950 text-blue-400 rounded-lg border border-blue-800/40">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Field Engineers</p>
                <p className="text-base font-extrabold text-blue-300">
                  {usersList.filter((u) => u.role === "engineer").length}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-amber-950 text-amber-400 rounded-lg border border-amber-800/40">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Senior Reviewers</p>
                <p className="text-base font-extrabold text-amber-300">
                  {usersList.filter((u) => u.role === "reviewer").length}
                </p>
              </div>
            </div>
          </div>

          {/* ADD BRANCH DRAWER */}
          {isAddBranchOpen && (
            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-4 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Register & Create New Company Branch</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1"><span>⚡</span> Cloud Synchronized</span>
              </div>

              {branchErrorMsg && (
                <div className="bg-red-950/80 border border-red-800 p-2.5 rounded-xl text-xs text-red-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{branchErrorMsg}</span>
                </div>
              )}

              {branchSuccessMsg && (
                <div className="bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{branchSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Branch Name</label>
                    <input
                      type="text"
                      required
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="e.g. Mumbai Hub"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Branch Code</label>
                    <input
                      type="text"
                      required
                      value={newBranchCode}
                      onChange={(e) => setNewBranchCode(e.target.value)}
                      placeholder="e.g. MUM"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-extrabold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Branch Manager Name</label>
                    <input
                      type="text"
                      value={newBranchManager}
                      onChange={(e) => setNewBranchManager(e.target.value)}
                      placeholder="e.g. Vikram Malhotra"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Physical Address</label>
                    <input
                      type="text"
                      value={newBranchAddress}
                      onChange={(e) => setNewBranchAddress(e.target.value)}
                      placeholder="e.g. BKC Commercial Tower, Bandra East, Mumbai, MH 400051"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Contact Phone</label>
                    <input
                      type="text"
                      value={newBranchPhone}
                      onChange={(e) => setNewBranchPhone(e.target.value)}
                      placeholder="e.g. +91 22 6123 4567"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingBranch}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isCreatingBranch ? "Creating Branch..." : "Save & Onboard Branch"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* EDIT BRANCH MODAL POPUP */}
          {editingBranch && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-slate-950 border border-cyan-500/50 rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-cyan-400" />
                  <span>Edit Branch: {editingBranch.name} ({editingBranch.code})</span>
                </h3>
                <button
                  onClick={() => setEditingBranch(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {branchErrorMsg && (
                <div className="bg-red-950/80 border border-red-800 p-2.5 rounded-xl text-xs text-red-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{branchErrorMsg}</span>
                </div>
              )}

              {branchSuccessMsg && (
                <div className="bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{branchSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateBranch} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Branch Name</label>
                    <input
                      type="text"
                      required
                      value={editBranchName}
                      onChange={(e) => setEditBranchName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Branch Code</label>
                    <input
                      type="text"
                      required
                      value={editBranchCode}
                      onChange={(e) => setEditBranchCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-extrabold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Manager Name</label>
                    <input
                      type="text"
                      value={editBranchManager}
                      onChange={(e) => setEditBranchManager(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Branch Status</label>
                    <select
                      value={editBranchStatus}
                      onChange={(e) => setEditBranchStatus(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Physical Address</label>
                    <input
                      type="text"
                      value={editBranchAddress}
                      onChange={(e) => setEditBranchAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Contact Phone</label>
                    <input
                      type="text"
                      value={editBranchPhone}
                      onChange={(e) => setEditBranchPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setEditingBranch(null)}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingBranch}
                    className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isUpdatingBranch ? "Saving Changes..." : "Save Branch Updates"}</span>
                  </button>
                </div>
              </form>
            </div>
            </div>
          )}

          {/* ADD EMPLOYEE DRAWER */}
          {isAddUserOpen && (
            <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-4 space-y-4 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>Provision New Staff Credentials & Assign Role</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Role-Based Access Control</span>
              </div>

              {userErrorMsg && (
                <div className="bg-red-950/80 border border-red-800 p-2.5 rounded-xl text-xs text-red-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{userErrorMsg}</span>
                </div>
              )}

              {userSuccessMsg && (
                <div className="bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{userSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Staff Full Name</label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Ramesh Singh"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Official Email</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. ramesh.noida@drrconsultants.in"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Mobile Phone</label>
                    <input
                      type="text"
                      required
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Assign to Branch</label>
                    <select
                      value={newUserBranch}
                      onChange={(e) => setNewUserBranch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                    >
                      {branchesList.map((b) => (
                        <option key={b.id || b.name} value={b.name}>
                          🏢 {b.name} Branch ({b.code || "REG"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Assigned Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="engineer">Valuation Field Engineer</option>
                      <option value="drafter">Template Drafter</option>
                      <option value="reviewer">Branch Senior Reviewer</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Account Password</label>
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="e.g. Noida@12345"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isCreatingUser ? "Generating Credentials..." : "Authorize Staff Credentials"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* EDIT EMPLOYEE MODAL POPUP */}
          {editingUser && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-slate-950 border border-cyan-500/50 rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-cyan-400" />
                  <span>Edit Employee: {editingUser.name} ({editingUser.id})</span>
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {userErrorMsg && (
                <div className="bg-red-950/80 border border-red-800 p-2.5 rounded-xl text-xs text-red-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{userErrorMsg}</span>
                </div>
              )}

              {userSuccessMsg && (
                <div className="bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{userSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Staff Full Name</label>
                    <input
                      type="text"
                      required
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Official Email</label>
                    <input
                      type="email"
                      required
                      value={editUserEmail}
                      onChange={(e) => setEditUserEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Mobile Phone</label>
                    <input
                      type="text"
                      required
                      value={editUserPhone}
                      onChange={(e) => setEditUserPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Assigned Branch</label>
                    <select
                      value={editUserBranch}
                      onChange={(e) => setEditUserBranch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                    >
                      {branchesList.map((b) => (
                        <option key={b.id || b.name} value={b.name}>
                          🏢 {b.name} Branch
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Assigned Role</label>
                    <select
                      value={editUserRole}
                      onChange={(e) => setEditUserRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="engineer">Valuation Field Engineer</option>
                      <option value="drafter">Template Drafter</option>
                      <option value="reviewer">Branch Senior Reviewer</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">New Password (Optional)</label>
                    <input
                      type="password"
                      value={editUserPassword}
                      onChange={(e) => setEditUserPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingUser}
                    className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isUpdatingUser ? "Saving Changes..." : "Save Employee Updates"}</span>
                  </button>
                </div>
              </form>
            </div>
            </div>
          )}

          {/* DELETE CONFIRMATION MODAL POPUP */}
          {deleteConfirmTarget && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-slate-950 border border-red-500/50 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
                <div className="flex items-center gap-3 text-red-400">
                  <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Confirm Deletion</h3>
                    <p className="text-xs text-slate-400">This action cannot be undone.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900 border border-slate-800 p-3 rounded-xl leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-white">"{deleteConfirmTarget.name}"</span>? All associated server data will be permanently removed.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmTarget(null)}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const target = deleteConfirmTarget;
                      setDeleteConfirmTarget(null);
                      if (target.type === "branch") {
                        await executeDeleteBranch(target.id, target.name);
                      } else if (target.type === "user") {
                        await executeDeleteUser(target.id, target.name);
                      } else if (target.type === "institution") {
                        await executeDeleteInstitution(target.id, target.name);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Confirm Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ORGANIZATIONAL HIERARCHY MATRIX (BRANCH -> EMPLOYEES -> ROLES) */}
          <div className="space-y-6 pt-2">
            {branchesList.map((branch) => {
              const branchStaff = usersList.filter(
                (u) => u.branch && u.branch.toLowerCase().trim() === branch.name.toLowerCase().trim()
              );

              return (
                <div
                  key={branch.id || branch.name}
                  className="bg-slate-950 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl border-l-4 border-l-cyan-500"
                >
                  {/* Branch Banner Header */}
                  <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-cyan-950 text-cyan-300 rounded-xl border border-cyan-800/50 mt-0.5">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-slate-100">{branch.name} Branch</h3>
                          <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded">
                            {branch.code || "REG"}
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                            {branch.status || "Active"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          📍 {branch.address || "Main Regional Office"} • 📞 {branch.phone || "N/A"}
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5 font-semibold">
                          👤 Branch Manager: <span className="text-cyan-300 font-bold">{branch.manager || "Unassigned"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono">
                        {branchStaff.length} Staff Member{branchStaff.length === 1 ? "" : "s"}
                      </span>

                      <button
                        onClick={() => {
                          setNewUserBranch(branch.name);
                          setIsAddUserOpen(true);
                          setIsAddBranchOpen(false);
                        }}
                        className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Staff</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingBranch(branch);
                          setEditBranchName(branch.name);
                          setEditBranchCode(branch.code);
                          setEditBranchAddress(branch.address);
                          setEditBranchPhone(branch.phone);
                          setEditBranchManager(branch.manager);
                          setEditBranchStatus(branch.status || "Active");
                          setIsAddBranchOpen(false);
                          setIsAddUserOpen(false);
                        }}
                        className="bg-slate-950 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                        title="Edit Branch"
                      >
                        <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteBranch(branch.id, branch.name)}
                        className="bg-slate-950 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Branch Staff Roster */}
                  <div className="p-4">
                    {branchStaff.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                        <Users className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-400 font-medium">No employees assigned to {branch.name} Branch yet.</p>
                        <button
                          onClick={() => {
                            setNewUserBranch(branch.name);
                            setIsAddUserOpen(true);
                          }}
                          className="mt-2 text-xs font-bold text-cyan-400 hover:underline"
                        >
                          + Click here to assign staff to {branch.name}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {branchStaff.map((usr) => {
                          const getRoleBadge = (role: string) => {
                            switch (role) {
                              case "admin":
                                return {
                                  title: "System Administrator",
                                  badge: "bg-purple-950 text-purple-300 border-purple-800/80",
                                  icon: "🛡️",
                                };
                              case "reviewer":
                                return {
                                  title: "Branch Senior Reviewer",
                                  badge: "bg-amber-950 text-amber-300 border-amber-800/80",
                                  icon: "🔍",
                                };
                              case "drafter":
                                return {
                                  title: "Template Drafter",
                                  badge: "bg-cyan-950 text-cyan-300 border-cyan-800/80",
                                  icon: "✏️",
                                };
                              default:
                                return {
                                  title: "Valuation Field Engineer",
                                  badge: "bg-emerald-950 text-emerald-300 border-emerald-800/80",
                                  icon: "👷",
                                };
                            }
                          };

                          const roleDetails = getRoleBadge(usr.role);

                          return (
                            <div
                              key={usr.id}
                              className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-cyan-400 text-sm shrink-0">
                                  {usr.name ? usr.name[0] : "U"}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-xs font-bold text-slate-200">{usr.name}</p>
                                    <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800/40">
                                      {usr.id}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${roleDetails.badge}`}
                                    >
                                      {roleDetails.icon} {roleDetails.title}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    ✉️ {usr.email} • 📱 {usr.phone || "N/A"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingUser(usr);
                                    setEditUserName(usr.name);
                                    setEditUserEmail(usr.email);
                                    setEditUserPhone(usr.phone || "");
                                    setEditUserRole(usr.role || "engineer");
                                    setEditUserBranch(usr.branch || branch.name);
                                    setEditUserPassword("");
                                    setIsAddUserOpen(false);
                                    setEditingBranch(null);
                                  }}
                                  className="bg-slate-950 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold shadow-sm"
                                  title="Edit Employee"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(usr.id, usr.name)}
                                  className="bg-slate-950 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-red-400 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold shadow-sm"
                                  title="Remove Employee"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: BANK ONBOARDING & META DOCUMENTS API */}
      {activeTab === "institutions" && (
        <div className="space-y-6">
          {/* Onboarding Form Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    Bank / Financial Institution Onboarding Portal
                  </h2>
                  <p className="text-xs text-slate-400">
                    Central Administrative Portal for bank empanelment & format meta document (.docx / .xlsx) upload
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                System Network Active
              </span>
            </div>

            {instSubmitStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
                  instSubmitStatus.success
                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                    : "bg-red-950/80 text-red-300 border border-red-800"
                }`}
              >
                <span>{instSubmitStatus.message}</span>
                <button
                  onClick={() => setInstSubmitStatus(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleOnboardInstitution} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Bank / Institution Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    placeholder="e.g. Tata Capital Housing Finance"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Institution Code / Acronym
                  </label>
                  <input
                    type="text"
                    value={instCode}
                    onChange={(e) => setInstCode(e.target.value)}
                    placeholder="e.g. TATA"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Institution Category
                  </label>
                  <select
                    value={instCategory}
                    onChange={(e) => setInstCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="Housing Finance Co">Housing Finance Co (HFC)</option>
                    <option value="Public Sector Bank">Public Sector Bank (PSU)</option>
                    <option value="Private Bank">Private Sector Bank</option>
                    <option value="NBFC">NBFC</option>
                    <option value="Cooperative Bank">Cooperative / Regional Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Default LTV % Benchmark
                  </label>
                  <input
                    type="text"
                    value={instLtv}
                    onChange={(e) => setInstLtv(e.target.value)}
                    placeholder="e.g. 80%"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Empanelment Contact Email
                  </label>
                  <input
                    type="email"
                    value={instEmail}
                    onChange={(e) => setInstEmail(e.target.value)}
                    placeholder="e.g. valuation@institution.com"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={instPhone}
                    onChange={(e) => setInstPhone(e.target.value)}
                    placeholder="e.g. +91 1800 123 4567"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Upload Meta Format Document (.docx or .xlsx) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-cyan-300 flex items-center gap-1.5 text-xs">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    Upload Format Meta Document (.docx or .xlsx template)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Stored in /uploads/institutions/
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-2 text-xs">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    Choose .docx / .xlsx File
                    <input
                      type="file"
                      accept=".docx,.xlsx,.doc,.xls,.pdf"
                      onChange={handleMetaFileChange}
                      className="hidden"
                    />
                  </label>

                  {metaDocFile ? (
                    <div className="flex items-center gap-2 bg-cyan-950/60 border border-cyan-800 px-3 py-2 rounded-xl text-cyan-200 text-xs">
                      <span className="font-bold uppercase bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded text-[10px]">
                        {metaDocFile.type}
                      </span>
                      <span className="truncate max-w-[200px] font-mono">{metaDocFile.name}</span>
                      <span className="text-[10px] text-slate-400">
                        ({Math.round(metaDocFile.size / 1024)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => setMetaDocFile(null)}
                        className="text-red-400 hover:text-red-300 font-bold ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-xs italic">
                      No meta template document attached yet (optional)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingInst}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmittingInst ? "Onboarding Institution..." : "Onboard Bank / Financial Institution"}
                </button>
              </div>
            </form>
          </div>

          {/* Onboarded Directory List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  Directory of Onboarded Financial Institutions ({institutions.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Verified Central Directory & Bank Empanelment Records
                </p>
              </div>
              <button
                onClick={fetchInstitutions}
                disabled={isLoadingInst}
                className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                {isLoadingInst ? "Refreshing..." : "🔄 Refresh List"}
              </button>
            </div>

            {institutions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No institutions onboarded yet. Fill in the form above to register a bank.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {institutions.map((inst) => (
                  <div
                    key={inst.id}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                            {inst.code}
                          </span>
                          <span className="text-[10px] bg-cyan-950/60 text-cyan-400 px-2 py-0.5 rounded font-bold border border-cyan-800">
                            {inst.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-1">{inst.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditInst(inst)}
                          className="bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-cyan-800 transition-all flex items-center gap-1 text-[10px] font-bold"
                          title="Edit Institution Details"
                        >
                          <Pencil className="w-3 h-3 text-cyan-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveInstitution(inst.id, inst.name)}
                          className="bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-red-400 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-red-800 transition-all flex items-center gap-1 text-[10px] font-bold"
                          title="Remove Institution"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">LTV Benchmark:</span>
                        <span className="font-bold text-slate-200">{inst.defaultLTV || "80%"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Empanelment Contact:</span>
                        <span className="truncate block font-mono text-[10px]">{inst.contactEmail || inst.contactPhone || "Active"}</span>
                      </div>
                    </div>

                    {/* Meta Document Details */}
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                      {inst.metaDocument ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black uppercase px-1.5 py-0.5 rounded border border-cyan-500/30">
                            {inst.metaDocument.fileType}
                          </span>
                          <div className="truncate">
                            <p className="font-mono text-[11px] text-slate-200 truncate">
                              {inst.metaDocument.originalName}
                            </p>
                            <p className="text-[9px] text-slate-500">
                              {Math.round(inst.metaDocument.sizeBytes / 1024)} KB • Uploaded {new Date(inst.metaDocument.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">No meta doc uploaded</span>
                      )}

                      {inst.metaDocument && (
                        <a
                          href={inst.metaDocument.url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 p-1.5 rounded-lg border border-cyan-500/40 transition-colors text-[10px] font-bold flex items-center gap-1 ml-2 flex-shrink-0"
                          title="Download Format Meta Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Docx/Excel
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* EDIT INSTITUTION MODAL */}
          {editingInst && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-950 text-cyan-400 rounded-xl border border-cyan-800">
                      <Pencil className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">Edit Financial Institution</h3>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {editingInst.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingInst(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {editInstError && (
                  <div className="bg-red-950/80 border border-red-800 p-2.5 rounded-xl text-xs text-red-300 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{editInstError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveEditInst} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Institution Name</label>
                      <input
                        type="text"
                        required
                        value={editInstName}
                        onChange={(e) => setEditInstName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Bank Code</label>
                      <input
                        type="text"
                        required
                        value={editInstCode}
                        onChange={(e) => setEditInstCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Category</label>
                      <select
                        value={editInstCategory}
                        onChange={(e) => setEditInstCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Housing Finance Co">Housing Finance Co (HFC)</option>
                        <option value="Public Sector Bank">Public Sector Bank (PSU)</option>
                        <option value="Private Bank">Private Sector Bank</option>
                        <option value="NBFC / Microfinance">NBFC / Microfinance</option>
                        <option value="Cooperative Bank">Cooperative Bank</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">LTV Benchmark</label>
                      <input
                        type="text"
                        value={editInstLtv}
                        onChange={(e) => setEditInstLtv(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Empanelment Email</label>
                      <input
                        type="email"
                        value={editInstEmail}
                        onChange={(e) => setEditInstEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Empanelment Phone</label>
                      <input
                        type="text"
                        value={editInstPhone}
                        onChange={(e) => setEditInstPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingInst(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEditInst}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs transition-all shadow-lg flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingEditInst ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
