import { Search } from "lucide-react";
import "./Input.css";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  label,
  className = "",
}: SearchBarProps) => {
  const input = (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
      className={label ? "" : className}
    >
      <Search
        size={16}
        style={{
          position: "absolute",
          left: 12,
          color: "var(--text-muted)",
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: "2.25rem" }}
      />
    </div>
  );

  if (!label) return input;

  return (
    <div className={`form-field ${className}`}>
      <label className="form-label">{label}</label>
      {input}
    </div>
  );
};

export default SearchBar;
