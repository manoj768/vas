import mongoose, { Schema, Document } from "mongoose";

export interface IBranchDocument extends Document {
  id: string;
  name: string;
  code: string;
  address: string;
  manager: string;
  phone: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranchDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    manager: { type: String, default: "" },
    phone: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  {
    timestamps: true,
  }
);

export const BranchModel =
  mongoose.models.Branch || mongoose.model<IBranchDocument>("Branch", BranchSchema);
