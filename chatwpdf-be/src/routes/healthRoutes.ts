import { Router } from "express";
import { prisma } from "../config/database";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Database health check
router.get("/db-health", async (req, res) => {
  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`
            SELECT version()
          `;
    res.status(200).json({
      status: "ok",
      message: "Database is healthy",
      version: result[0]?.version || "unknown",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Database is not healthy" });
  }
});

export default router;
