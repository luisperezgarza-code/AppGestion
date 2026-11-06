import { useEffect } from "react";

export type ToastType = "success" | "error";
export type ToastNotification = {
  id: number;
  message: string;
  type: ToastType;
};

export function Toast({
  notification,
  onDismiss,
}: {
  notification: ToastNotification;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 3500);
    return () => window.clearTimeout(timeout);
  }, [notification.id, onDismiss]);

  return (
    <div
      className={`app-toast toast-${notification.type}`}
      role={notification.type === "error" ? "alert" : "status"}
    >
      <span className="toast-indicator" />
      <span>{notification.message}</span>
      <button
        aria-label="Cerrar notificación"
        className="toast-dismiss"
        onClick={onDismiss}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
