import { makeStyles } from "@fluentui/react-components";
import { PDFViewer } from "../features/pdf-viewer/PdfViewer";
import { ChatPanel } from "../features/chat-panel/ChatPanel";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    height: "100%",
  },
});

export default function PDFViewerPage() {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <PDFViewer />
      <ChatPanel />
    </div>
  );
}
