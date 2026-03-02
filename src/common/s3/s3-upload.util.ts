import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

const config = new ConfigService();

const s3 = new S3Client({
  region: config.get<string>('AWS_REGION'),
  credentials: {
    accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY')!,
  },
});

const BUCKET = config.get<string>('AWS_S3_BUCKET')!;

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
  console.log(file,
  folder,
  filename,
  mimetype)
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
    ? `https://${BUCKET}.s3.${config.get<string>('AWS_REGION')}.amazonaws.com/${key}`
    : key;
}
