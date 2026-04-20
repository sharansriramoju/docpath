import { Search } from "lucide-react";
import "./Input.css";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchBarProps) => (
  <div
    style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
    }}
    className={className}
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
      style={{ paddingLeft: "2.25rem", minWidth: 220 }}
    />
  </div>
);

export default SearchBar;
