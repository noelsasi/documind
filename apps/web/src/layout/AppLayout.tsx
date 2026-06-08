import React, { useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@stackframe/react";
import { Spinner } from "@fluentui/react-components";
import { useChatStore, type Chat } from "../store/chatStore";
import UploadModal from "../components/UploadModal";

function StatusDot({ status }: { status: string }) {
  const done = status === "completed";
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: done ? "#22c55e" : "#f59e0b",
        flexShrink: 0,
      }}
    />
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const params = useParams();
  const user = useUser();
  const [showUpload, setShowUpload] = useState(false);

  const { chatHistory, setPdfInfo, getChatDocuments, setSelectedChat } = useChatStore();

  const handleChatClick = (chat: Chat) => {
    navigate(`/chat/${chat.id}`);
    setPdfInfo({ fileName: chat.fileName, fileUrl: chat.fileUrl });
    setSelectedChat(chat);
  };

  React.useEffect(() => {
    if (params.chatId) {
      const fileInfo = chatHistory.find((chat) => chat.id === params.chatId);
      if (fileInfo) {
        setSelectedChat(fileInfo);
        setPdfInfo({ fileName: fileInfo.fileName, fileUrl: fileInfo.fileUrl });
      }
    }
  }, [params.chatId, chatHistory, setPdfInfo, setSelectedChat]);

  React.useEffect(() => {
    getChatDocuments();
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "var(--sidebar-width)",
          flexShrink: 0,
          background: "var(--color-sidebar-bg)",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--color-sidebar-border)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: "var(--header-height)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            gap: 10,
            cursor: "pointer",
          }}
          onClick={() => navigate("/home")}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "var(--color-accent)",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 13,
              color: "white",
              flexShrink: 0,
            }}
          >
            D
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "white" }}>DocuMind</span>
        </div>

        {/* New PDF button */}
        <div style={{ padding: "12px 12px 8px" }}>
          <button
            onClick={() => setShowUpload(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 12px",
              background: "var(--color-accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-accent-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-accent)")}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            New document
          </button>
        </div>

        {/* Document list */}
        <div
          className="sidebar-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-sidebar-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              padding: "8px 8px 6px",
            }}
          >
            Documents
          </div>

          {chatHistory.length === 0 ? (
            <div
              style={{
                padding: "20px 8px",
                fontSize: 13,
                color: "var(--color-sidebar-text-muted)",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              No documents yet.
              <br />
              Upload one to get started.
            </div>
          ) : (
            chatHistory.map((chat) => {
              const isActive = params.chatId === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    background: isActive ? "var(--color-sidebar-active)" : "transparent",
                    border: isActive ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.12s",
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "var(--color-sidebar-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <StatusDot status={chat.status} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: isActive ? "white" : "var(--color-sidebar-text)",
                      fontWeight: isActive ? 500 : 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {chat.fileName}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* User profile */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "12px",
          }}
        >
          {user ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-sidebar-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => user.signOut()}
              title="Click to sign out"
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {(user.displayName || user.primaryEmail || "U")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "white",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.displayName || user.primaryEmail}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-sidebar-text-muted)" }}>
                  Sign out
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--color-sidebar-text-muted)", padding: "8px 10px" }}>
              <Spinner size="tiny" />
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div
          style={{
            height: "var(--header-height)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            background: "white",
            flexShrink: 0,
            gap: 10,
          }}
        >
          {params.chatId ? (() => {
            const doc = chatHistory.find((c) => c.id === params.chatId);
            const ready = doc?.status === "completed";
            return (
              <>
                <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>DocuMind</span>
                <span style={{ fontSize: 13, color: "#d1d5db" }}>›</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                  {doc?.fileName || "Document"}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 9px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: ready ? "#dcfce7" : "#fef3c7",
                    color: ready ? "#15803d" : "#b45309",
                    letterSpacing: "0.2px",
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: ready ? "#22c55e" : "#f59e0b",
                      display: "inline-block",
                    }}
                  />
                  {ready ? "Ready" : "Processing"}
                </span>
              </>
            );
          })() : (
            <span style={{ fontSize: 13, color: "#9ca3af" }}>DocuMind</span>
          )}
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>
          <Outlet />
        </div>
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
