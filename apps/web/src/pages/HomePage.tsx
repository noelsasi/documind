import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import UploadModal from "../components/UploadModal";

export default function HomePage() {
  const navigate = useNavigate();
  const { chatHistory } = useChatStore();
  const [showUpload, setShowUpload] = useState(false);

  React.useEffect(() => {
    if (chatHistory.length > 0) {
      navigate(`/chat/${chatHistory[0].id}`, { replace: true });
    }
  }, [chatHistory, navigate]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: "var(--color-bg-secondary)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          background: "var(--color-accent-light)",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
        }}
      >
        📄
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
          No documents yet
        </h2>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", maxWidth: 320, lineHeight: 1.6 }}>
          Upload your first PDF to start extracting insights and chatting with
          your documents.
        </p>
      </div>
      <button className="btn-primary" style={{ padding: "12px 28px", fontSize: 15 }} onClick={() => setShowUpload(true)}>
        Upload your first PDF
      </button>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
