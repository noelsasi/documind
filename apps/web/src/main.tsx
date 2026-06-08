import process from "process";
import { Buffer } from "buffer";

// Polyfills for Stack Auth
window.process = process;
window.Buffer = Buffer;

import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(<App />);
