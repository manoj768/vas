import mongoose, { Schema, Document } from "mongoose";

export interface ICaseDocument extends Document {
  id: string;
  institution: string;
  customerName: string;
  loanType: string;
  propertyType: string;
  address: string;
  locationCoordinates?: {
    lat: number;
    lng: number;
  };
  contactNumber: string;
  date: string;
  status: "Pending" | "In-Progress" | "Completed" | "Approved" | "Rejected";
  assignedEngineer: string;
  branch?: string;
  valuationData?: {
    landArea?: number;
    ratePerSqFt?: number;
    builtUpArea?: number;
    constructionRate?: number;
    fairMarketValue?: number;
    realizableValue?: number;
    distressValue?: number;
  };
  siteVisitFormat?: any;
  remarks?: string;
  syncStatus?: "Synced" | "Pending Sync" | "Conflict";
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<ICaseDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    institution: { type: String, required: true, index: true },
    customerName: { type: String, required: true, index: true },
    loanType: { type: String, required: true },
    propertyType: { type: String, required: true },
    address: { type: String, required: true },
    locationCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    contactNumber: { type: String, required: true },
    date: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "In-Progress", "Completed", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    assignedEngineer: { type: String, default: "", index: true },
    branch: { type: String, default: "Delhi NCR", index: true },
    valuationData: {
      landArea: Number,
      ratePerSqFt: Number,
      builtUpArea: Number,
      constructionRate: Number,
      fairMarketValue: Number,
      realizableValue: Number,
      distressValue: Number,
    },
    siteVisitFormat: { type: Schema.Types.Mixed },
    remarks: { type: String, default: "" },
    syncStatus: {
      type: String,
      enum: ["Synced", "Pending Sync", "Conflict"],
      default: "Synced",
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound indexes for 1 Lakh+ cases/month
CaseSchema.index({ branch: 1, status: 1, createdAt: -1 });
CaseSchema.index({ assignedEngineer: 1, status: 1 });
CaseSchema.index({ institution: 1, status: 1 });

// Full-text search index for real-time customer, address, and bank search
CaseSchema.index({
  customerName: "text",
  institution: "text",
  address: "text",
  contactNumber: "text",
});

export const CaseModel = mongoose.models.Case || mongoose.model<ICaseDocument>("Case", CaseSchema);
