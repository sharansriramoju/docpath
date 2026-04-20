import type { ElementType } from "react";
import "./StatCard.css";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ElementType;
  color?: "primary" | "success" | "warning" | "danger";
  change?: number;
  className?: string;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color = "primary",
  change,
  className = "",
}: StatCardProps) => (
  <div className={`stat-card ${className}`}>
    <div className={`stat-icon stat-icon-${color}`}>{Icon && <Icon />}</div>
    <div className="stat-content">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change !== undefined && (
        <div
          className={`stat-change ${change >= 0 ? "stat-change-up" : "stat-change-down"}`}
        >
          {change >= 0 ? "+" : ""}
          {change}% from last month
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
