import mongoose, { Schema, Document } from "mongoose";

export interface IPhotoAttachmentDocument extends Document {
  id: string;
  caseId: string;
  category:
    | "frontElevation"
    | "leftBoundary"
    | "rightBoundary"
    | "rearBoundary"
    | "approachRoad"
    | "hallRoom"
    | "kitchen"
    | "masterBedroom"
    | "satelliteView"
    | "other";
  storageUrl: string; // Object Storage (S3 / MinIO) or Local Upload URL
  storageType: "s3" | "minio" | "local";
  fileSizeBytes: number;
  mimeType: string;
  gpsTelemetry?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    altitude?: number;
    compassHeadingDegrees?: number;
    timestamp: Date;
    addressResolved?: string;
  };
  capturedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PhotoAttachmentSchema = new Schema<IPhotoAttachmentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, required: true, index: true },
    category: {
      type: String,
      required: true,
      index: true,
    },
    storageUrl: { type: String, required: true },
    storageType: {
      type: String,
      enum: ["s3", "minio", "local"],
      default: "local",
    },
    fileSizeBytes: { type: Number, default: 0 },
    mimeType: { type: String, default: "image/jpeg" },
    gpsTelemetry: {
      latitude: Number,
      longitude: Number,
      accuracyMeters: Number,
      altitude: Number,
      compassHeadingDegrees: Number,
      timestamp: Date,
      addressResolved: String,
    },
    capturedByUserId: { type: String, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound index for instant photo grid retrieval per case
PhotoAttachmentSchema.index({ caseId: 1, category: 1, createdAt: -1 });

export const PhotoAttachmentModel =
  mongoose.models.PhotoAttachment ||
  mongoose.model<IPhotoAttachmentDocument>("PhotoAttachment", PhotoAttachmentSchema);
