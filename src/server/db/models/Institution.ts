import mongoose, { Schema, Document } from "mongoose";

export interface IInstitutionDocument extends Document {
  id: string;
  name: string;
  type: "Banking" | "NBFC" | "HFC" | "Private";
  status: "Active" | "Inactive" | "Pending Empanelment";
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  turnaroundTimeHours: number;
  reportFormatNote: string;
  customTemplateDocx?: string;
  customTemplateXlsx?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionSchema = new Schema<IInstitutionDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ["Banking", "NBFC", "HFC", "Private"],
      default: "Banking",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending Empanelment"],
      default: "Active",
      index: true,
    },
    contactPerson: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    turnaroundTimeHours: { type: Number, default: 24 },
    reportFormatNote: { type: String, default: "" },
    customTemplateDocx: { type: String },
    customTemplateXlsx: { type: String },
  },
  {
    timestamps: true,
  }
);

export const InstitutionModel =
  mongoose.models.Institution || mongoose.model<IInstitutionDocument>("Institution", InstitutionSchema);
