import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

interface UploadToS3Params {
  file: Buffer;
  folder: string;
  filename: string;
  mimetype: string;
  isPublic?: boolean;
}

/**
 * Common S3 upload util
 */
export async function uploadToS3({
  file,
  folder,
  filename,
  mimetype,
  isPublic = false,
}: UploadToS3Params): Promise<string> {
  const key = `${folder}/${Date.now()}-${filename}`;
  console.log()
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: mimetype,
      ACL: isPublic ? 'public-read' : 'private',
    }),
  );

  return isPublic
    ? `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    : key;
}
