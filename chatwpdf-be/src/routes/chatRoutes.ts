import { Router } from "express";
import { chatController } from "../controllers/chatController";
import multer from "multer";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() }).single("file");

router.post("/upload-pdf", upload, chatController.uploadPdf);

router.get("/user-documents", chatController.getUserDocuments);

export default router;
