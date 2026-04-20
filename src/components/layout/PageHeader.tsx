import type { ReactNode } from "react";
import "./PageHeader.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="page-header">
    <div className="page-header-left">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </div>
);

export default PageHeader;
