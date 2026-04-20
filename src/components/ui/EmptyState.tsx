import type { ReactNode, ElementType } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ElementType;
  title?: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState = ({
  icon: Icon = Inbox,
  title = "No data",
  description,
  action,
}: EmptyStateProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 1.5rem",
      color: "var(--text-muted)",
      textAlign: "center",
    }}
  >
    <Icon
      size={48}
      strokeWidth={1.5}
      style={{ marginBottom: "1rem", opacity: 0.5 }}
    />
    <div
      style={{
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--font-weight-medium)",
        color: "var(--text-secondary)",
        marginBottom: "0.25rem",
      }}
    >
      {title}
    </div>
    {description && (
      <div style={{ fontSize: "var(--font-size-sm)", maxWidth: 320 }}>
        {description}
      </div>
    )}
    {action && <div style={{ marginTop: "1rem" }}>{action}</div>}
  </div>
);

export default EmptyState;
