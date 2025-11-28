import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { errorMiddleware } from "./middlewares";

const app = express();

// Enable CORS
app.use(cors());

// Parse cookies
app.use(cookieParser());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

// strict routing
app.enable("strict routing");

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Error handling (must be last)
app.use(errorMiddleware);

export default app;
