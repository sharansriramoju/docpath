import type { SelectHTMLAttributes } from "react";
import "./Input.css";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  className?: string;
}

const Select = ({
  label,
  error,
  options = [],
  placeholder,
  className = "",
  value,
  id,
  ...props
}: SelectProps) => {
  const selectId = id || props.name;
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`form-input ${error ? "form-input-error" : ""}`}
        value={value ? value : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error-msg">{error}</span>}
    </div>
  );
};

export default Select;
