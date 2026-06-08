import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { SignIn } from "@stackframe/react";

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: "500px",
    width: "100%",
    borderRadius: "16px",
  },
  dialogBody: {
    padding: "0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: "12px 0px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    margin: 0,
  },
  closeButton: {
    minWidth: "auto",
    padding: "8px",
  },
  content: {
    padding: "24px",
    maxHeight: "calc(90vh - 100px)",
    overflowY: "auto",
  },
  authContainer: {
    "& form": {
      width: "100%",
    },
    "& button": {
      width: "100%",
    },
  },
});

interface SignupPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupPopup({ isOpen, onClose }: SignupPopupProps) {
  const styles = useStyles();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(_event, data) => !data.open && onClose()}
    >
      <DialogSurface className={styles.dialogSurface}>
        <div className={styles.header}>
          <DialogTitle className={styles.title}>Create Account</DialogTitle>
          <Button
            appearance="transparent"
            icon={<Dismiss24Regular />}
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
          />
        </div>
        <DialogBody className={styles.dialogBody}>
          <DialogContent className={styles.content}>
            <div className={styles.authContainer}>
              <SignIn />
            </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
