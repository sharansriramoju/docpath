import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import "./Input.css";

type InputProps = {
  label?: string;
  error?: string;
  textarea?: boolean;
  className?: string;
} & (InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement>);

const Input = ({
  label,
  error,
  type = "text",
  textarea = false,
  className = "",
  id,
  value,
  ...props
}: InputProps) => {
  const Tag = textarea ? "textarea" : "input";
  const inputId = id || props.name;
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <Tag
        id={inputId}
        type={textarea ? undefined : type}
        value={value ? value : undefined}
        className={`form-input ${error ? "form-input-error" : ""}`}
        {...(props as Record<string, unknown>)}
      />
      {error && <span className="form-error-msg">{error}</span>}
    </div>
  );
};

export default Input;
