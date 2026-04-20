const COLORS: Record<string, string> = {
  confirmed: "var(--color-success-500)",
  completed: "var(--color-success-500)",
  active: "var(--color-success-500)",
  pending: "var(--color-warning-500)",
  cancelled: "var(--color-danger-500)",
  inactive: "var(--color-gray-400)",
};

interface StatusDotProps {
  status?: string;
  label?: string;
}

const StatusDot = ({ status, label }: StatusDotProps) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      fontSize: "var(--font-size-sm)",
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background:
          COLORS[status?.toLowerCase() ?? ""] || "var(--color-gray-400)",
        flexShrink: 0,
      }}
    />
    {label || status}
  </span>
);

export default StatusDot;
