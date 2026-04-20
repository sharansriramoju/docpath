import type { ReactNode, HTMLAttributes } from "react";
import "./Card.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children?: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
}

interface CardSectionProps {
  children: ReactNode;
  className?: string;
}

interface CardComponent extends React.FC<CardProps> {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardSectionProps>;
  Footer: React.FC<CardSectionProps>;
}

const Card: CardComponent = Object.assign(
  ({ children, className = "", ...props }: CardProps) => (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  ),
  {
    Header: ({ children, title, action, className = "" }: CardHeaderProps) => (
      <div className={`card-header ${className}`}>
        {title ? <h3>{title}</h3> : children}
        {action && <div>{action}</div>}
      </div>
    ),
    Body: ({ children, className = "" }: CardSectionProps) => (
      <div className={`card-body ${className}`}>{children}</div>
    ),
    Footer: ({ children, className = "" }: CardSectionProps) => (
      <div className={`card-footer ${className}`}>{children}</div>
    ),
  },
);

export default Card;
