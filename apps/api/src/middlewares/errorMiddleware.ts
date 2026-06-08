import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err.message);

  // Handle "not found" errors
  if (err.message === "Todo not found") {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }

  // Handle validation errors
  if (err.message === "Title is required") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
};
