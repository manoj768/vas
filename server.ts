import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "drr_valuation_open_source_secret_key_2026";

// Open Source Credential Store with Pre-hashed Passwords (bcrypt)
interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "admin" | "engineer" | "drafter" | "reviewer";
  branch: string;
}

interface BranchRecord {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  manager: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

let mockBranches: BranchRecord[] = [
  {
    id: "BR-01",
    name: "Delhi NCR",
    code: "DEL",
    address: "Connaught Place, Central Delhi, 110001",
    phone: "+91 11 4567 8900",
    manager: "Pooja Gupta",
    status: "Active",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "BR-02",
    name: "Lucknow",
    code: "LKO",
    address: "Hazratganj Main Road, Lucknow, UP 226001",
    phone: "+91 522 220 1122",
    manager: "Suresh Sharma",
    status: "Active",
    createdAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "BR-03",
    name: "Noida",
    code: "NDA",
    address: "Sector 62 Tech Park, Noida, UP 201309",
    phone: "+91 120 456 7890",
    manager: "Ratnesh Kumar",
    status: "Active",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "BR-04",
    name: "Ghaziabad",
    code: "GZB",
    address: "Raj Nagar District Centre, Ghaziabad, UP 201002",
    phone: "+91 120 280 4455",
    manager: "Anit Verma",
    status: "Active",
    createdAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "BR-05",
    name: "Jaipur",
    code: "JPR",
    address: "M.I. Road Commercial Hub, Jaipur, RJ 302001",
    phone: "+91 141 236 9900",
    manager: "Vikram Singh",
    status: "Active",
    createdAt: "2026-02-01T00:00:00Z",
  },
];

const registeredUsers: RegisteredUser[] = [
  {
    id: "USR-004",
    name: "Pooja Gupta (System Administrator)",
    email: "admin@drrconsultants.in",
    phone: "9811223344",
    // Hashed "Admin@12345"
    passwordHash: bcrypt.hashSync("Admin@12345", 10),
    role: "admin",
    branch: "Delhi NCR",
  },
  {
    id: "USR-001",
    name: "Ratnesh Kumar (Valuation Engineer)",
    email: "ratnesh.delhi@drrconsultants.in",
    phone: "9812345670",
    // Hashed "Delhi@12345"
    passwordHash: bcrypt.hashSync("Delhi@12345", 10),
    role: "engineer",
    branch: "Delhi NCR",
  },
  {
    id: "USR-002",
    name: "Suresh Sharma (Branch Manager)",
    email: "suresh.lucknow@drrconsultants.in",
    phone: "9898989898",
    // Hashed "Lucknow@12345"
    passwordHash: bcrypt.hashSync("Lucknow@12345", 10),
    role: "reviewer",
    branch: "Lucknow",
  },
  {
    id: "USR-003",
    name: "Anit Verma (Template Drafter)",
    email: "anit.drafter@drrconsultants.in",
    phone: "9876543211",
    // Hashed "Drafter@12345"
    passwordHash: bcrypt.hashSync("Drafter@12345", 10),
    role: "drafter",
    branch: "Delhi NCR",
  }
];

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure uploads base folder exists
const uploadsBaseDir = path.join(process.cwd(), "uploads", "sites");
if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}

const uploadsInstDir = path.join(process.cwd(), "uploads", "institutions");
if (!fs.existsSync(uploadsInstDir)) {
  fs.mkdirSync(uploadsInstDir, { recursive: true });
}

// Serve uploaded media files static folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// In-memory data store for Onboarded Banks & Institutions (Managed via API & Administrator)
let mockInstitutions = [
  {
    id: "INST-001",
    name: "Hinduja Housing Finance Limited",
    code: "HHFL",
    category: "Housing Finance Co",
    contactEmail: "empanelment@hindujahousing.com",
    contactPhone: "+91 1800 266 7788",
    defaultLTV: "80%",
    status: "Active",
    metaDocument: {
      filename: "HHFL_Valuation_Report_Template_2026.docx",
      originalName: "HHFL_Valuation_Report_Template_2026.docx",
      fileType: "docx",
      sizeBytes: 482000,
      uploadedAt: new Date().toISOString(),
      url: "/uploads/institutions/HHFL_Valuation_Report_Template_2026.docx",
    },
    createdAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "INST-002",
    name: "HDFC Bank Home Loans",
    code: "HDFC",
    category: "Private Bank",
    contactEmail: "valuation.desk@hdfcbank.com",
    contactPhone: "+91 1800 22 1006",
    defaultLTV: "75%",
    status: "Active",
    metaDocument: {
      filename: "HDFC_Master_Appraisal_Sheet_2026.xlsx",
      originalName: "HDFC_Master_Appraisal_Sheet_2026.xlsx",
      fileType: "xlsx",
      sizeBytes: 620000,
      uploadedAt: new Date().toISOString(),
      url: "/uploads/institutions/HDFC_Master_Appraisal_Sheet_2026.xlsx",
    },
    createdAt: "2026-01-20T10:30:00Z",
  },
  {
    id: "INST-003",
    name: "ICICI Home Finance",
    code: "ICICI",
    category: "Housing Finance Co",
    contactEmail: "property.appraisal@icicihf.com",
    contactPhone: "+91 1800 102 1100",
    defaultLTV: "80%",
    status: "Active",
    metaDocument: {
      filename: "ICICI_Valuation_Meta_Format.docx",
      originalName: "ICICI_Valuation_Meta_Format.docx",
      fileType: "docx",
      sizeBytes: 310000,
      uploadedAt: new Date().toISOString(),
      url: "/uploads/institutions/ICICI_Valuation_Meta_Format.docx",
    },
    createdAt: "2026-02-01T11:15:00Z",
  },
  {
    id: "INST-004",
    name: "Hero Housing Finance",
    code: "HERO",
    category: "Housing Finance Co",
    contactEmail: "empanel@herohousing.com",
    contactPhone: "+91 1800 212 8888",
    defaultLTV: "85%",
    status: "Active",
    metaDocument: null,
    createdAt: "2026-02-10T14:00:00Z",
  },
  {
    id: "INST-005",
    name: "State Bank of India (SBI)",
    code: "SBI",
    category: "Public Sector Bank",
    contactEmail: "sbi.home.valuations@sbi.co.in",
    contactPhone: "+91 1800 11 2211",
    defaultLTV: "80%",
    status: "Active",
    metaDocument: {
      filename: "SBI_Property_Inspection_Annexure.xlsx",
      originalName: "SBI_Property_Inspection_Annexure.xlsx",
      fileType: "xlsx",
      sizeBytes: 890000,
      uploadedAt: new Date().toISOString(),
      url: "/uploads/institutions/SBI_Property_Inspection_Annexure.xlsx",
    },
    createdAt: "2026-03-01T08:00:00Z",
  },
];

// In-memory data store for Evalo cases (seeded with realistic sample cases from PDF)
let mockCases = [
  {
    id: "210",
    institution: "Hinduja Housing Finance Limited",
    customerName: "Mr. ANKITA NIGAM",
    loanType: "Home Loan",
    date: "01-07-2026",
    phone: "8448679869",
    address: "Raj Nagar Extension, Vill Noor Nagar, GZB",
    remarks: "NA",
    status: "Open", // "Open" | "Pending" | "Completed"
    completedSiteVisit: null, // true | false | null
    propertyType: "Flat",
    localityData: {
      roadApproachCondition: "Bituminous Road (20 ft)",
      connections: "Electricity, Sewerage & Water Available",
      propertyElectricity: "Yes",
      ownershipType: "Freehold",
      roadWidthFt: "25",
      lift: "Yes",
      developmentType: "Residential Area",
      fallingWithin: "Development Authority",
      closestLandmark: "Near DPS Public School",
      propertyNumbering: "Yes",
      surroundingOccupancy: "85%",
      localityStatus: "Developed",
    },
    observationData: {
      communityDominated: "No",
      communityPercentage: "10%",
      unitsOnFloor: "4",
      totalUnitsInBuilding: "32",
      sellerNameAtSite: "Mr. Rakesh Sharma",
      buildingOccupancy: "Self-occupied by owner",
      structureType: "RCC Framed Structure",
      contactMetName: "Mr. Ankita Nigam",
      contactMetPhone: "8448679869",
      contactMetRelation: "Owner / Borrower",
      electricityMeterNo: "1049285721",
      electricityBillMeterNo: "1049285721",
      addressMatchesTitleDocs: "Yes, Address is Matching",
      presentlyOccupiedBy: "Self-occupied by owner",
      negativeRemarks: "None",
      plotDemarcated: "Proper demarcated",
      disputeObserved: "No dispute observed",
      internalVisitDone: "Yes",
      previouslyValuatedForOtherBanks: "NO",
      sewerageDrainage: "Under Ground Drain",
      yearOfConstruction: "2019",
      ageOfBuilding: "7",
      totalFloors: "8",
      landShape: "Regular (4 Sided)",
    },
    identityData: {
      boundaries: {
        front: { direction: "North", measurement: "35 ft", details: "30 Ft Wide Society Road" },
        left: { direction: "West", measurement: "50 ft", details: "Plot No. 209 (Residential Flat)" },
        right: { direction: "East", measurement: "50 ft", details: "Plot No. 211 (Residential Flat)" },
        rear: { direction: "South", measurement: "35 ft", details: "Open Service Lane" },
      },
      photos: {
        front: null,
        left: null,
        right: null,
        rear: null,
      },
    },
    valuationData: {
      valuationType: "Composite (Land and building)",
      buildingDepth: "50",
      buildingFrontWidth: "35",
      landAreaSqFt: "1225",
      landRatePerSqFt: "4500",
      buaSqFt: "1150",
      constructionRatePerSqFt: "1800",
      sbuaSqFt: "1450",
      flatRatePerSqFt: "4800",
      fairMarketValue: 6960000,
      realizableValue: 6264000,
      distressValue: 5568000,
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
      addressAsPerSiteVisit: "Raj Nagar Extension, Vill Noor Nagar, Ghaziabad, UP",
      latitude: "28.723698319387573",
      longitude: "77.14758396148682",
    },
    finalSubmission: {
      statusAsPerSiteVisit: "Positive",
      remarks: "Clear title, well-connected residential society with standard amenities.",
      rating: "Very Nice",
      submittedAt: "2026-07-28T10:00:00Z",
    },
    siteVisitFormat: null as any,
  },
  {
    id: "211",
    institution: "HDFC Bank Home Loans",
    customerName: "Mrs. PRIYA VERMA",
    loanType: "Home Loan",
    date: "02-07-2026",
    phone: "9871234567",
    address: "Sector 15, Vasundhara, Ghaziabad",
    remarks: "Pending documents check",
    status: "Pending",
    completedSiteVisit: null,
    propertyType: "Independent house",
    localityData: {
      roadApproachCondition: "Bituminous Road (30 ft)",
      connections: "Electricity, Sewerage & Water Available",
      propertyElectricity: "Yes",
      ownershipType: "Freehold",
      roadWidthFt: "30",
      lift: "No",
      developmentType: "Residential Area",
      fallingWithin: "Municipal Corporation",
      closestLandmark: "Vasundhara Sector 15 Park",
      propertyNumbering: "Yes",
      surroundingOccupancy: "90%",
      localityStatus: "Prime",
    },
    observationData: {
      communityDominated: "No",
      communityPercentage: "5%",
      unitsOnFloor: "1",
      totalUnitsInBuilding: "2",
      sellerNameAtSite: "Mrs. Priya Verma",
      buildingOccupancy: "Self-occupied by owner",
      structureType: "RCC Framed Structure",
      contactMetName: "Mrs. Priya Verma",
      contactMetPhone: "9871234567",
      contactMetRelation: "Owner",
      electricityMeterNo: "8839201948",
      electricityBillMeterNo: "8839201948",
      addressMatchesTitleDocs: "Yes, Address is Matching",
      presentlyOccupiedBy: "Self-occupied by owner",
      negativeRemarks: "None",
      plotDemarcated: "Proper demarcated",
      disputeObserved: "No dispute observed",
      internalVisitDone: "Yes",
      previouslyValuatedForOtherBanks: "NO",
      sewerageDrainage: "Under Ground Drain",
      yearOfConstruction: "2021",
      ageOfBuilding: "5",
      totalFloors: "2",
      landShape: "Rectangular",
    },
    identityData: {
      boundaries: {
        front: { direction: "North", measurement: "30 ft", details: "30 Ft Main Road" },
        left: { direction: "West", measurement: "60 ft", details: "House No. 15/4" },
        right: { direction: "East", measurement: "60 ft", details: "House No. 15/6" },
        rear: { direction: "South", measurement: "30 ft", details: "Park Boundary Wall" },
      },
      photos: { front: null, left: null, right: null, rear: null },
    },
    valuationData: {
      valuationType: "Composite (Land and building)",
      buildingDepth: "60",
      buildingFrontWidth: "30",
      landAreaSqFt: "1800",
      landRatePerSqFt: "6500",
      buaSqFt: "2400",
      constructionRatePerSqFt: "2200",
      sbuaSqFt: "2400",
      flatRatePerSqFt: "0",
      fairMarketValue: 16980000,
      realizableValue: 15282000,
      distressValue: 13584000,
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
      addressAsPerSiteVisit: "Sector 15, Vasundhara, Ghaziabad, UP",
      latitude: "28.6621",
      longitude: "77.3789",
    },
    finalSubmission: {
      statusAsPerSiteVisit: "Positive",
      remarks: "Excellent location and good quality construction.",
      rating: "Very Nice",
      submittedAt: "2026-07-28T09:30:00Z",
    },
    siteVisitFormat: null as any,
  },
];

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing in server environment");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AUTHENTICATION API ROUTES (Open Source Credential Auth)
app.post("/api/auth/login", (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: "Email/Phone and password are required" });
    }

    const user = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === emailOrPhone.trim().toLowerCase() ||
        u.phone.trim() === emailOrPhone.trim()
    );

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials. User not found." });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password. Access denied." });
    }

    // Sign JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        branch: user.branch,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      branch: user.branch,
    };

    return res.json({
      success: true,
      message: "Authentication successful",
      token,
      user: userProfile,
    });
  } catch (error: any) {
    console.error("Auth login error:", error);
    return res.status(500).json({ success: false, message: "Authentication server error" });
  }
});

app.get("/api/auth/verify", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No authentication token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = registeredUsers.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User session expired or invalid" });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branch: user.branch,
      },
    });
  } catch (error: any) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
});

app.get("/api/auth/users", (req, res) => {
  const safeUsers = registeredUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    branch: u.branch,
  }));
  return res.json({ success: true, users: safeUsers });
});

app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, phone, password, role, branch } = req.body;

    if (!name || !email || !password || !role || !branch) {
      return res.status(400).json({ success: false, message: "Name, email, password, role, and branch are required" });
    }

    const existingUser = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    const newUser: RegisteredUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name,
      email: email.trim(),
      phone: phone || "9800000000",
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      branch,
    };

    registeredUsers.push(newUser);

    return res.json({
      success: true,
      message: `User ${name} successfully registered for ${branch} branch as ${role}`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        branch: newUser.branch,
      },
    });
  } catch (error: any) {
    console.error("Register user error:", error);
    return res.status(500).json({ success: false, message: "Failed to register user" });
  }
});

app.delete("/api/auth/users/:id", (req, res) => {
  try {
    const { id } = req.params;
    const index = registeredUsers.findIndex((u) => u.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const removedUser = registeredUsers.splice(index, 1)[0];
    return res.json({ success: true, message: `Employee ${removedUser.name} removed successfully` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

app.put("/api/auth/users/:id", (req, res) => {
  try {
    const { id } = req.params;
    const user = registeredUsers.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const { name, email, phone, role, branch, password } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (branch) user.branch = branch;
    if (password) user.passwordHash = bcrypt.hashSync(password, 10);

    return res.json({
      success: true,
      message: "Employee updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branch: user.branch,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to update user" });
  }
});

// BRANCH MANAGEMENT API ROUTES
app.get("/api/branches", (req, res) => {
  return res.json({
    success: true,
    total: mockBranches.length,
    branches: mockBranches,
  });
});

app.post("/api/branches", (req, res) => {
  try {
    const { name, code, address, phone, manager } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: "Branch name and branch code are required" });
    }

    const existing = mockBranches.find(
      (b) => b.name.toLowerCase() === name.trim().toLowerCase() || b.code.toLowerCase() === code.trim().toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ success: false, message: "Branch with this name or code already exists" });
    }

    const newBranch: BranchRecord = {
      id: `BR-${(mockBranches.length + 1).toString().padStart(2, "0")}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address || `${name} Main Commercial Hub`,
      phone: phone || "+91 1800 000 1122",
      manager: manager || "Branch Manager Assigned",
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    mockBranches.push(newBranch);
    return res.json({ success: true, message: `Branch '${newBranch.name}' added successfully`, branch: newBranch });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to create branch" });
  }
});

app.put("/api/branches/:id", (req, res) => {
  try {
    const { id } = req.params;
    const branch = mockBranches.find((b) => b.id === id);
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }
    const { name, code, address, phone, manager, status } = req.body;
    if (name) branch.name = name;
    if (code) branch.code = code.toUpperCase();
    if (address) branch.address = address;
    if (phone) branch.phone = phone;
    if (manager) branch.manager = manager;
    if (status) branch.status = status;

    return res.json({ success: true, message: "Branch updated successfully", branch });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to update branch" });
  }
});

app.delete("/api/branches/:id", (req, res) => {
  try {
    const { id } = req.params;
    const index = mockBranches.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }
    const removed = mockBranches.splice(index, 1)[0];
    return res.json({ success: true, message: `Branch '${removed.name}' removed successfully` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to delete branch" });
  }
});

// INSTITUTION & BANK ONBOARDING API ROUTES
app.get("/api/institutions", (req, res) => {
  return res.json({
    success: true,
    total: mockInstitutions.length,
    institutions: mockInstitutions,
  });
});

app.post("/api/institutions", (req, res) => {
  try {
    const {
      name,
      code,
      category,
      contactEmail,
      contactPhone,
      defaultLTV,
      metaDocumentBase64,
      metaDocumentName,
      metaDocumentType,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Bank / Institution name is required" });
    }

    const existing = mockInstitutions.find(
      (inst) => inst.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Institution "${name}" is already onboarded.`,
      });
    }

    let metaDocObj = null;

    if (metaDocumentBase64 && metaDocumentName) {
      try {
        const cleanBase64 = metaDocumentBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, "base64");

        const ext =
          metaDocumentType ||
          (metaDocumentName.endsWith(".xlsx")
            ? "xlsx"
            : metaDocumentName.endsWith(".docx")
            ? "docx"
            : "docx");

        const safeFilename = `${name.replace(/[^a-zA-Z0-9]/g, "_")}_Meta_Template_${Date.now()}.${ext}`;
        const filePath = path.join(process.cwd(), "uploads", "institutions", safeFilename);

        fs.writeFileSync(filePath, buffer);

        metaDocObj = {
          filename: safeFilename,
          originalName: metaDocumentName,
          fileType: ext,
          sizeBytes: buffer.length,
          uploadedAt: new Date().toISOString(),
          url: `/uploads/institutions/${safeFilename}`,
        };
      } catch (fileErr) {
        console.error("Failed to save uploaded meta document:", fileErr);
      }
    }

    const newInst = {
      id: `INST-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      code: (code || name.slice(0, 4)).toUpperCase().trim(),
      category: category || "Housing Finance Co",
      contactEmail: contactEmail || "",
      contactPhone: contactPhone || "",
      defaultLTV: defaultLTV || "80%",
      status: "Active" as const,
      metaDocument: metaDocObj,
      createdAt: new Date().toISOString(),
    };

    mockInstitutions.unshift(newInst);

    return res.json({
      success: true,
      message: `Bank / Institution "${newInst.name}" onboarded successfully with meta document template.`,
      institution: newInst,
    });
  } catch (err: any) {
    console.error("Onboard institution error:", err);
    return res.status(500).json({ success: false, message: "Failed to onboard institution" });
  }
});

app.delete("/api/institutions/:id", (req, res) => {
  const { id } = req.params;
  const idx = mockInstitutions.findIndex((inst) => inst.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Institution not found" });
  }
  const removed = mockInstitutions.splice(idx, 1)[0];
  return res.json({
    success: true,
    message: `Institution "${removed.name}" removed from onboarded directory`,
  });
});

// API Routes
app.get("/api/cases", (req, res) => {
  res.json({ success: true, cases: mockCases });
});

app.get("/api/cases/:id", (req, res) => {
  const caseItem = mockCases.find((c) => c.id === req.params.id);
  if (!caseItem) {
    return res.status(404).json({ success: false, message: "Case not found" });
  }
  res.json({ success: true, case: caseItem });
});

app.post("/api/cases", (req, res) => {
  const newCase = {
    id: String(Date.now()).slice(-5),
    institution: req.body.institution || "Generic Housing Finance",
    customerName: req.body.customerName || "New Borrower",
    loanType: req.body.loanType || "Home Loan",
    date: new Date().toLocaleDateString("en-GB"),
    phone: req.body.phone || "9999999999",
    address: req.body.address || "Property Address",
    remarks: req.body.remarks || "NA",
    status: "Open",
    completedSiteVisit: null,
    propertyType: req.body.propertyType || "Flat",
    localityData: req.body.localityData || {},
    observationData: req.body.observationData || {},
    identityData: req.body.identityData || {},
    valuationData: req.body.valuationData || {},
    mediaAttachments: req.body.mediaAttachments || {},
    geoData: req.body.geoData || {
      addressAsPerSiteVisit: req.body.address || "",
      latitude: "28.7237",
      longitude: "77.1476",
    },
    finalSubmission: null,
    siteVisitFormat: req.body.siteVisitFormat || null,
  };

  mockCases.unshift(newCase);
  res.json({ success: true, case: newCase });
});

app.put("/api/cases/:id", (req, res) => {
  const caseIndex = mockCases.findIndex((c) => c.id === req.params.id);
  if (caseIndex === -1) {
    return res.status(404).json({ success: false, message: "Case not found" });
  }

  mockCases[caseIndex] = {
    ...mockCases[caseIndex],
    ...req.body,
  };

  res.json({ success: true, case: mockCases[caseIndex] });
});

// Endpoint to store DRR Associates Site Format data & categorized media into dedicated site folders
app.post("/api/sites/save", async (req, res) => {
  try {
    const { siteId, siteVisitFormat, caseId } = req.body;
    if (!siteId || !siteVisitFormat) {
      return res.status(400).json({ success: false, message: "siteId and siteVisitFormat are required" });
    }

    // Sanitize site directory name
    const safeSiteId = String(siteId).replace(/[^a-zA-Z0-9_-]/g, "_");
    const siteFolder = path.join(process.cwd(), "uploads", "sites", `site_${safeSiteId}`);

    // Create subfolders for categorized media
    const mediaCategories = ["road", "outside_nameplate", "selfie", "internal", "general"];
    for (const cat of mediaCategories) {
      const catDir = path.join(siteFolder, "media", cat);
      if (!fs.existsSync(catDir)) {
        fs.mkdirSync(catDir, { recursive: true });
      }
    }

    // Helper function to save base64 photo into categorical folder
    const saveBase64Image = (base64Str: string, category: string, index: number): string => {
      if (!base64Str || typeof base64Str !== "string") return base64Str;
      if (!base64Str.startsWith("data:image")) return base64Str; // Already a URL or empty

      try {
        const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return base64Str;

        const ext = matches[1].split("/")[1] || "jpg";
        const buffer = Buffer.from(matches[2], "base64");
        const filename = `${category}_photo_${Date.now()}_${index}.${ext}`;
        const filePath = path.join(siteFolder, "media", category, filename);

        fs.writeFileSync(filePath, buffer);
        return `/uploads/sites/site_${safeSiteId}/media/${category}/${filename}`;
      } catch (err) {
        console.error(`Failed to save ${category} image:`, err);
        return base64Str;
      }
    };

    // Process media files into categorical folders
    const catMedia = siteVisitFormat.documentationMarketData?.categorizedMedia || {
      roadPhotos: [],
      outsideNameplatePhotos: [],
      selfiePhotos: [],
      internalPhotos: [],
      generalPhotos: [],
    };

    const savedCategorizedMedia = {
      roadPhotos: (catMedia.roadPhotos || []).map((p: string, idx: number) => saveBase64Image(p, "road", idx)),
      outsideNameplatePhotos: (catMedia.outsideNameplatePhotos || []).map((p: string, idx: number) => saveBase64Image(p, "outside_nameplate", idx)),
      selfiePhotos: (catMedia.selfiePhotos || []).map((p: string, idx: number) => saveBase64Image(p, "selfie", idx)),
      internalPhotos: (catMedia.internalPhotos || []).map((p: string, idx: number) => saveBase64Image(p, "internal", idx)),
      generalPhotos: (catMedia.generalPhotos || []).map((p: string, idx: number) => saveBase64Image(p, "general", idx)),
    };

    // Construct updated site Visit Format object
    const updatedFormat = {
      ...siteVisitFormat,
      documentationMarketData: {
        ...siteVisitFormat.documentationMarketData,
        categorizedMedia: savedCategorizedMedia,
      },
      savedAt: new Date().toISOString(),
      siteFolderRelativePath: `/uploads/sites/site_${safeSiteId}`,
    };

    // Save site_visit_format.json inside site folder
    fs.writeFileSync(
      path.join(siteFolder, "site_visit_format.json"),
      JSON.stringify(updatedFormat, null, 2),
      "utf-8"
    );

    // If caseId provided, also update mockCases in memory
    if (caseId) {
      const caseIdx = mockCases.findIndex((c) => c.id === String(caseId));
      if (caseIdx !== -1) {
        mockCases[caseIdx].siteVisitFormat = updatedFormat;
        mockCases[caseIdx].completedSiteVisit = true;
        mockCases[caseIdx].status = "Pending";
      }
    }

    return res.json({
      success: true,
      message: `Site data saved successfully in folder /uploads/sites/site_${safeSiteId}`,
      siteFolder: `/uploads/sites/site_${safeSiteId}`,
      siteVisitFormat: updatedFormat,
    });
  } catch (error: any) {
    console.error("Save site format error:", error);
    return res.status(500).json({ success: false, message: error?.message || "Failed to save site format" });
  }
});

// Gemini AI Route 1: Scan & Extract document/photo for survey auto-fill
app.post("/api/gemini/analyze-document", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: "imageBase64 is required" });
    }

    const ai = getGenAIClient();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `
You are an expert Evalo Real Estate Valuation Inspector AI assistant.
Analyze this property document or field photograph and extract or estimate structured property valuation details in JSON format.
Extract the following exact properties if visible or reasonably inferred from the image:
- customerName: string
- institutionName: string
- address: string
- propertyType: string (e.g. "Flat", "Independent house", "Villa", "Commercial Property", "Vacant land")
- roadApproachCondition: string (e.g. "Bituminous Road (25 ft)", "Wide RCC Road")
- structureType: string (e.g. "RCC Framed Structure", "Load Bearing Structure", "AC Shed")
- buildingOccupancy: string (e.g. "Self-occupied by owner", "Entirely by Tenants", "Fully Vacant")
- ageOfBuilding: string
- totalFloors: string
- closestLandmark: string
- estimatedMarketValuePerSqFt: number
- keyObservations: string (a short 2-line summary for field inspection report)
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Gemini document analysis error:", error);
    return res.status(500).json({ success: false, message: error?.message || "Failed to analyze document with AI" });
  }
});

// Gemini AI Route 2: Generate Valuation Risk Assessment & Valuation Executive Report
app.post("/api/gemini/valuation-risk", async (req, res) => {
  try {
    const { caseDetails } = req.body;
    if (!caseDetails) {
      return res.status(400).json({ success: false, message: "caseDetails required" });
    }

    const ai = getGenAIClient();
    const promptText = `
You are a Senior Risk Officer for Property Appraisal at Evalo.
Analyze the following property survey inspection data:
${JSON.stringify(caseDetails, null, 2)}

Provide a structured AI Valuation Risk Assessment in JSON format containing:
- riskScore: number (0 to 100, where 0 is lowest risk and 100 is critical risk)
- riskCategory: string ("Low Risk", "Moderate Risk", "High Risk")
- valuationConfidence: string ("High", "Medium", "Low")
- keyRiskFactors: array of strings
- positiveFactors: array of strings
- executiveSummary: string (3-4 sentences professional appraisal summary for bank lending officers)
- recommendedLTV: string (e.g. "75% - 80%")
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, report: parsedData });
  } catch (error: any) {
    console.error("Gemini valuation risk error:", error);
    return res.status(500).json({ success: false, message: error?.message || "Failed to generate risk report" });
  }
});

// Backend Route 3: Inject case data into Bank-Specific Excel / Formats with Photo Attachments
app.post("/api/export/bank-format", async (req, res) => {
  try {
    const { caseId, bankName = "Standard Bank Format", formatType = "excel" } = req.body;
    
    // Fetch case or site visit format
    let targetCase = mockCases.find((c) => c.id === String(caseId));
    if (!targetCase && mockCases.length > 0) {
      targetCase = mockCases[0];
    }

    if (!targetCase) {
      return res.status(404).json({ success: false, message: "Valuation case not found" });
    }

    // Structure bank export payload with image attachments
    const bankExportPayload = {
      bankTemplate: bankName,
      generatedAt: new Date().toISOString(),
      formatType,
      header: {
        valuationRefNo: `VAL-${targetCase.id}-${Date.now()}`,
        financialInstitution: targetCase.institution,
        borrowerName: targetCase.customerName,
        propertyAddress: targetCase.address,
        loanType: targetCase.loanType,
        inspectionDate: targetCase.date,
      },
      propertyDetails: {
        propertyType: targetCase.propertyType,
        roadWidthFt: targetCase.localityData?.roadWidthFt || "25",
        structureType: targetCase.observationData?.structureType || "RCC Framed",
        buildingOccupancy: targetCase.observationData?.buildingOccupancy || "Self-Occupied",
        ageOfBuildingYears: targetCase.observationData?.ageOfBuilding || "5",
        totalFloors: targetCase.observationData?.totalFloors || "3",
      },
      boundaries: targetCase.identityData?.boundaries || {
        front: { direction: "North", measurement: "35 ft", details: "30 Ft Road" },
        left: { direction: "West", measurement: "50 ft", details: "Plot 209" },
        right: { direction: "East", measurement: "50 ft", details: "Plot 211" },
        rear: { direction: "South", measurement: "35 ft", details: "Service Lane" },
      },
      valuationFinancials: {
        landAreaSqFt: targetCase.valuationData?.landAreaSqFt || "1200",
        landRatePerSqFt: targetCase.valuationData?.landRatePerSqFt || "4500",
        builtUpAreaSqFt: targetCase.valuationData?.buaSqFt || "1500",
        constructionRatePerSqFt: targetCase.valuationData?.constructionRatePerSqFt || "2000",
        fairMarketValueINR: targetCase.valuationData?.fairMarketValue || 6960000,
        realizableValueINR: targetCase.valuationData?.realizableValue || 6264000,
        distressValueINR: targetCase.valuationData?.distressValue || 5568000,
      },
      imageAttachments: [
        {
          tag: "ELEVATION_PHOTO",
          title: "Building Elevation & Front View",
          url: targetCase.mediaAttachments?.elevation || "/uploads/sites/sample_elevation.jpg",
          status: "ATTACHED",
        },
        {
          tag: "SELFIE_SITE_VISIT",
          title: "Inspector Site Visit Selfie",
          url: targetCase.mediaAttachments?.selfie || "/uploads/sites/sample_selfie.jpg",
          status: "ATTACHED",
        },
        {
          tag: "ROAD_APPROACH",
          title: "Road & Surrounding Locality",
          url: targetCase.mediaAttachments?.road || "/uploads/sites/sample_road.jpg",
          status: "ATTACHED",
        },
      ],
      exportInstructions: {
        excelMapping: {
          borrowerCell: "B4",
          addressCell: "B5",
          marketValueCell: "E25",
          realizableValueCell: "E26",
          imagesWorksheet: "Site Photos & Boundaries",
        },
        wordTemplateTags: {
          CUSTOMER_NAME: targetCase.customerName,
          INSTITUTION: targetCase.institution,
          FAIR_MARKET_VALUE: `₹${(targetCase.valuationData?.fairMarketValue || 6960000).toLocaleString("en-IN")}`,
        },
      },
    };

    return res.json({
      success: true,
      message: `Data successfully formatted for ${bankName} (${formatType.toUpperCase()})`,
      exportPayload: bankExportPayload,
      downloadUrl: `/api/export/download/${targetCase.id}?bank=${encodeURIComponent(bankName)}&type=${formatType}`,
    });
  } catch (error: any) {
    console.error("Bank format export error:", error);
    return res.status(500).json({ success: false, message: error?.message || "Failed to prepare bank format" });
  }
});

// Backend Route 4: CSV / Excel Data Dump Endpoint
app.get("/api/export/download/:caseId", (req, res) => {
  const { caseId } = req.params;
  const bank = (req.query.bank as string) || "Standard Bank";
  
  const targetCase = mockCases.find((c) => c.id === String(caseId)) || mockCases[0];

  // CSV formatted row content suitable for Excel import
  const csvHeaders = "Case ID,Institution,Customer Name,Loan Type,Property Type,Address,Fair Market Value (INR),Realizable Value (INR),Status,Date\n";
  const csvRow = `"${targetCase.id}","${targetCase.institution}","${targetCase.customerName}","${targetCase.loanType}","${targetCase.propertyType}","${targetCase.address.replace(/"/g, '""')}","${targetCase.valuationData?.fairMarketValue || 0}","${targetCase.valuationData?.realizableValue || 0}","${targetCase.status}","${targetCase.date}"\n`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${bank.replace(/[^a-zA-Z0-9]/g, "_")}_Valuation_Case_${caseId}.csv"`);
  return res.send(csvHeaders + csvRow);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Evalo Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
