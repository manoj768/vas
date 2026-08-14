import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: "admin" | "reviewer" | "drafter" | "engineer";
  branch: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    phone: { type: String, required: true, index: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "reviewer", "drafter", "engineer"],
      default: "engineer",
      index: true,
    },
    branch: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
