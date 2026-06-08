import { StackClientApp } from "@stackframe/react";
import { useNavigate } from "react-router-dom";

export const stackApp = new StackClientApp({
  tokenStore: "cookie",
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  redirectMethod: {
    useNavigate,
  },
});
