import { Router } from "express";
import { chatController } from "../controllers/chatController";
import multer from "multer";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() }).single("file");

router.post("/upload", upload, chatController.uploadPdf);

router.get("/documents", chatController.getUserDocuments);

router.post("/session", chatController.createChatSession);

router.get("/sessions/:documentId", chatController.getChatSessions);

router.post("/query", chatController.queryChat);

router.get("/session/:id/messages", chatController.getChatSessionMessages);

export default router;
