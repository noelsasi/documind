import serverless from "serverless-http";
import app from "./app";

// Wrap Express app for Lambda
export const handler = serverless(app);
