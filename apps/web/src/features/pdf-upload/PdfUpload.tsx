import React from "react";
import { useNavigate } from "react-router-dom";
import { makeStyles, Button } from "@fluentui/react-components";
import { ArrowUpload24Regular } from "@fluentui/react-icons";
import { useChatStore } from "../../store/chatStore";

const useStyles = makeStyles({
  uploadArea: {
    width: "100%",
    maxWidth: "600px",
    minHeight: "300px",
    border: "2px dashed #ccc",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 40px",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.3s ease",
    position: "relative",
  },
  uploadIcon: {
    width: "60px",
    height: "60px",
    backgroundColor: "#f3f4f6",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  uploadText: {
    fontSize: "18px",
    fontWeight: "500",
    marginBottom: "30px",
    color: "#333",
  },
  uploadButton: {
    padding: "12px 32px",
  },
  dragNote: {
    position: "absolute",
    top: "20px",
    right: "20px",
    fontSize: "12px",
    color: "#999",
    fontStyle: "italic",
  },
});

export default function PdfUpload() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { uploadPdf } = useChatStore();

  const handleFileSelect = async (file: File | null) => {
    if (file && file.type === "application/pdf") {
      try {
        await uploadPdf(file, (id: string) => {
          navigate(`/chat/${id}`);
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  return (
    <div className={styles.uploadArea}>
      <div className={styles.uploadIcon}>
        <ArrowUpload24Regular />
      </div>
      <div className={styles.uploadText}>Click to upload</div>
      <Button
        appearance="primary"
        className={styles.uploadButton}
        icon={<ArrowUpload24Regular />}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        Upload PDF
      </Button>
      <input
        id="file-input"
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleFileInput}
      />
    </div>
  );
}
