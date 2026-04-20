import type { ReactNode, ButtonHTMLAttributes, ElementType } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "ghost"
    | "success"
    | "outline";
  size?: "sm" | "md" | "lg";
  icon?: ElementType;
  iconRight?: ElementType;
  className?: string;
}

const Button = ({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  className = "",
  ...props
}: ButtonProps) => {
  const sizeClass = size !== "md" ? `btn-${size}` : "";
  return (
    <button
      className={`btn btn-${variant} ${sizeClass} ${className}`}
      {...props}
    >
      {Icon && <Icon />}
      {children}
      {IconRight && <IconRight />}
    </button>
  );
};

export default Button;
