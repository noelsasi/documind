import { Router } from "express";
import { authenticate } from "../middlewares";

import todoRoutes from "./todoRoutes";
import chatRoutes from "./chatRoutes";
import healthRoutes from "./healthRoutes";
import { triggerSNS } from "../middlewares/snsMiddleware";

const router = Router();

router.post("/sns", async (req, res) => {
  try {
    await triggerSNS({
      bucket: req.body.bucket,
      key: req.body.key,
      fileId: req.body.fileId || "",
      userId: req.body.userId || "",
    });

    return res.status(200).json({ message: "SNS triggered" });
  } catch (error) {
    console.error("Error triggering SNS:", error);
    return res.status(500).json({ message: "Error triggering SNS" });
  }
});

// Health routes
router.use("/", healthRoutes);

// Todo routes
router.use("/todos", authenticate, todoRoutes);

// Chat routes
router.use("/chat", authenticate, chatRoutes);
export default router;
