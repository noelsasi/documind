import { Request, Response, NextFunction } from "express";
import { uploadFile } from "../config/s3";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { prisma } from "../config/database";
import { triggerSNS } from "../middlewares/snsMiddleware";
import { embedQuery, openai, PineconeIndex } from "../util/helper";

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

  async getChatSessions(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({ message: "documentId required" });
    }

    const sessions = await prisma.chatSession.findMany({
      where: {
        documentId,
        userId: user.sub,
      },
    });

    return res.status(200).json({
      message: "Sessions fetched successfully",
      sessions: sessions,
    });
  }

  async createChatSession(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ message: "documentId required" });
    }

    const session = await prisma.chatSession.create({
      data: {
        id: crypto.randomUUID(),
        title: "New Chat",
        documentId,
        userId: user.sub,
      },
    });

    return res.status(200).json({
      message: "Session created",
      sessionId: session.id,
    });
  }

  async queryChat(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    const { sessionId, query } = req.body;

    if (!query || !sessionId) {
      return res.status(400).json({ message: "sessionId and query required" });
    }

    try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { document: true },
    });

    if (!session || session.userId !== user.sub) {
      return res.status(404).json({ message: "Session not found" });
    }

    const vector = await embedQuery(query);

    const results = await PineconeIndex.namespace(`user_${user.sub}`).query({
      vector,
      topK: 5,
      includeMetadata: true,
    });

    const context = results.matches
      .map((m: any) => m.metadata?.text || "")
      .join("\n\n");

    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "user",
        content: query,
      },
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let aiResponseText = "";

    const systemPrompt = `You are an AI assistant. Use the context below to answer.

    // CONTEXT:
    // ${context}
    // `;

    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
    });

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || "";

      aiResponseText += token;

      res.write(`data: ${token}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();

    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "assistant",
        content: aiResponseText,
      },
    });
    } catch (error) {
      console.error("queryChat error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Query failed", error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  async getChatSessionMessages(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "id required" });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId: id,
      },
    });

    return res.status(200).json({
      message: "Messages fetched successfully",
      messages: messages,
    });
  }
}

export const chatController = new ChatController();
