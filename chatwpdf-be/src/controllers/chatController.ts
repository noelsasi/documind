import { Request, Response, NextFunction } from "express";
import { uploadFile } from "../config/s3";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { prisma } from "../config/database";
import { triggerSNS } from "../middlewares/snsMiddleware";

export class ChatController {
  async uploadPdf(req: Request, res: Response) {
    const file = req.file;
    const user = (req as AuthenticatedRequest).user;

    if (!file) {
      return res.status(400).json({ message: "Bad Request" });
    }

    try {
      // Upload file to S3
      const s3Result = await uploadFile(file);
      console.log("S3 upload result: ", s3Result);

      const document = await prisma.document.create({
        data: {
          id: crypto.randomUUID(),
          filename: file.originalname,
          fileSize: file.size,
          fileUrl: s3Result.Location,
          s3Key: s3Result.Key,
          mimeType: file.mimetype,
          status: "not_started",
          userId: user.sub,
        },
      });

      await triggerSNS({
        bucket: s3Result.Bucket || "",
        key: s3Result.Key,
        fileId: document.id,
        userId: user.sub,
      });

      console.log("Document record created: ", document);

      res.status(200).send({
        message: "File uploaded successfully",
        document: {
          id: document.id,
          filename: document.filename,
          fileUrl: document.fileUrl,
          status: document.status,
          createdAt: document.createdAt,
        },
        user: {
          id: user.sub,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Error uploading file: ", error);
      res.status(500).send({ message: "Error uploading file", error });
      return;
    }
  }

  async getUserDocuments(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;

    if (!user || !user.sub) {
      res.status(401).send({ message: "User not authenticated" });
      return;
    }

    try {
      const documents = await prisma.document.findMany({
        where: {
          userId: user.sub,
        },
      });

      res.status(200).send({
        message: "Documents fetched successfully",
        documents: documents,
      });
    } catch (error) {
      res.status(500).send({ message: "Error listing user documents", error });
      return;
    }
  }
}

export const chatController = new ChatController();
