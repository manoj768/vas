import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// MinIO / S3 Open-Source Object Storage Client Configuration
// Perfect for handling 15+ Lakh monthly inspection photos at scale.

const s3Endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const s3Region = process.env.S3_REGION || "us-east-1";
const s3Bucket = process.env.S3_BUCKET_NAME || "valuation-photos";
const accessKeyId = process.env.S3_ACCESS_KEY || "minioadmin";
const secretAccessKey = process.env.S3_SECRET_KEY || "minioadmin";

export const s3Client = new S3Client({
  region: s3Region,
  endpoint: s3Endpoint,
  forcePathStyle: true, // Required for MinIO local container routing
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadFileToMinio(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `inspections/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  
  // Return file URL or key
  return `${s3Endpoint}/${s3Bucket}/${key}`;
}
