import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Spinner } from "@fluentui/react-components";
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ZoomIn20Regular,
  ZoomOut20Regular,
} from "@fluentui/react-icons";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useChatStore } from "../../store/chatStore";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function ToolbarBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8,
        color: disabled ? "rgba(255,255,255,0.3)" : "white",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s",
        padding: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
      }}
    >
      {children}
    </button>
  );
}

export const PDFViewer: React.FC = () => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);
  const { pdfInfo } = useChatStore();
  const { fileUrl } = pdfInfo;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const changePage = (offset: number) => {
    setPageNumber((p) => Math.min(Math.max(1, p + offset), numPages));
  };

  const changeScale = (delta: number) => {
    setScale((s) => Math.min(Math.max(0.5, s + delta), 2.0));
  };

  return (
    <div
      style={{
        flex: "0 0 58%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "#e8e8e8",
        overflow: "hidden",
      }}
    >
      {/* Scrollable PDF content — extra bottom padding keeps page clear of toolbar */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "28px 24px 88px",
        }}
      >
        {error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
            {error}
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setError("Failed to load PDF. Please try again.")}
            loading={
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 60, color: "#666" }}>
                <Spinner size="small" />
                <span style={{ fontSize: 14 }}>Loading document...</span>
              </div>
            }
            error={
              <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
                Failed to load PDF document.
              </div>
            }
>
            <Page
              pageNumber={pageNumber}
              scale={scale}
              loading={<Spinner size="small" />}
            />
          </Document>
        )}
      </div>

      {/* Floating toolbar — z-index above PDF canvas, padding-bottom keeps page clear */}
      {numPages > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            pointerEvents: "all",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(17,24,39,0.88)",
            backdropFilter: "blur(10px)",
            borderRadius: 12,
            padding: "6px 10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <ToolbarBtn onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
            <ChevronLeft24Regular style={{ fontSize: 16 }} />
          </ToolbarBtn>

          <span
            style={{
              fontSize: 13,
              color: "white",
              fontWeight: 500,
              minWidth: 64,
              textAlign: "center",
              letterSpacing: "0.2px",
            }}
          >
            {pageNumber} / {numPages}
          </span>

          <ToolbarBtn onClick={() => changePage(1)} disabled={pageNumber >= numPages}>
            <ChevronRight24Regular style={{ fontSize: 16 }} />
          </ToolbarBtn>

          <div
            style={{
              width: 1,
              height: 20,
              background: "rgba(255,255,255,0.15)",
              margin: "0 4px",
            }}
          />

          <ToolbarBtn onClick={() => changeScale(-0.1)} disabled={scale <= 0.5}>
            <ZoomOut20Regular style={{ fontSize: 16 }} />
          </ToolbarBtn>

          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.7)",
              minWidth: 36,
              textAlign: "center",
            }}
          >
            {Math.round(scale * 100)}%
          </span>

          <ToolbarBtn onClick={() => changeScale(0.1)} disabled={scale >= 2.0}>
            <ZoomIn20Regular style={{ fontSize: 16 }} />
          </ToolbarBtn>
        </div>
      )}
    </div>
  );
};
