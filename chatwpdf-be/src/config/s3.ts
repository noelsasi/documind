import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export async function uploadFile(file: any) {
  const key = `uploads/${file.originalname}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET || "",
    Body: file.buffer,
    Key: key,
    ACL: "public-read",
  });

  const result = await s3Client.send(command);

  return {
    ...result,
    Location: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    Key: key,
    Bucket: process.env.AWS_S3_BUCKET,
  };
}

export async function getFileStream(fileKey: string) {
  const command = new GetObjectCommand({
    Key: fileKey,
    Bucket: process.env.AWS_S3_BUCKET,
  });

  const response = await s3Client.send(command);
  return response.Body as Readable;
}

export async function deleteFileStream(fileKey: string) {
  try {
    // Check if file exists
    const headCommand = new HeadObjectCommand({
      Key: fileKey,
      Bucket: process.env.AWS_S3_BUCKET,
    });
    await s3Client.send(headCommand);

    // Delete the file
    const deleteCommand = new DeleteObjectCommand({
      Key: fileKey,
      Bucket: process.env.AWS_S3_BUCKET,
    });
    await s3Client.send(deleteCommand);

    return "File deleted successfully";
  } catch (err: any) {
    return `File is already deleted or ${err.code}`;
  }
}
