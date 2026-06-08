import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@fluentui/react-components";
import { Dismiss24Regular, ArrowUpload24Regular } from "@fluentui/react-icons";
import { useChatStore } from "../store/chatStore";

interface UploadModalProps {
  onClose: () => void;
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const navigate = useNavigate();
  const { uploadPdf } = useChatStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") return;
    setSelectedFile(file);
    setUploading(true);
    setProgress(20);

    const ticker = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 85));
    }, 400);

    try {
      await uploadPdf(file, (id: string) => {
        clearInterval(ticker);
        setProgress(100);
        setTimeout(() => {
          onClose();
          navigate(`/chat/${id}`);
        }, 300);
      });
    } catch {
      clearInterval(ticker);
      setUploading(false);
      setSelectedFile(null);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="upload-modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <span className="upload-modal-title">Upload a document</span>
          <button className="upload-modal-close" onClick={onClose}>
            <Dismiss24Regular />
          </button>
        </div>

        {!uploading ? (
          <div
            className={`upload-dropzone${dragOver ? " drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-dropzone-icon">
              <ArrowUpload24Regular />
            </div>
            <div className="upload-dropzone-title">Drop your PDF here</div>
            <p className="upload-dropzone-sub">
              or <span>browse files</span> from your computer
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={handleInputChange}
            />
          </div>
        ) : (
          <div className="upload-progress">
            <div className="upload-progress-file">
              <div style={{ color: "var(--color-accent)", flexShrink: 0 }}>
                <Spinner size="tiny" />
              </div>
              <span className="upload-progress-name">
                {selectedFile?.name}
              </span>
              <span style={{ fontSize: 13, color: "var(--color-text-muted)", flexShrink: 0 }}>
                {progress < 100 ? "Uploading..." : "Done"}
              </span>
            </div>
            <div className="upload-progress-bar-wrap">
              <div
                className="upload-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
