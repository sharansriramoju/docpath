import type { ReactNode } from "react";
import "./Badge.css";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const Badge = ({
  children,
  variant = "default",
  className = "",
}: BadgeProps) => (
  <span className={`badge badge-${variant} ${className}`}>{children}</span>
);

export default Badge;
