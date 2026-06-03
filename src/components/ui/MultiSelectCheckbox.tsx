import { useEffect, useRef, useState } from "react";
import "./MultiSelectCheckbox.css";

interface CheckboxOption {
  value: string;
  label: string;
}

interface MultiSelectCheckboxProps {
  label?: string;
  error?: string;
  options: CheckboxOption[];
  value?: string[];
  onChange?: (selectedValues: string[]) => void;
  onSearch?: (search: string) => void;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  placeholder?: string;
}

const MultiSelectCheckbox = ({
  label,
  error,
  options = [],
  value = [],
  onChange,
  onSearch,
  className = "",
  id,
  disabled = false,
  placeholder = "Select Items",
}: MultiSelectCheckboxProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [labelCache, setLabelCache] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    setLabelCache((prev) => {
      const next = new Map(prev);
      options.forEach((o) => next.set(o.value, o.label));
      return next;
    });
  }, [options]);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const toggleOption = (optionValue: string) => {
    const checked = value.includes(optionValue);
    const newValues = checked
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValues);
  };

  const selectedLabels = value
    .map((v) => labelCache.get(v))
    .filter((l): l is string => l !== undefined);

  return (
    <div className={`form-field ${className}`} ref={rootRef}>
      {label && <label className="form-label">{label}</label>}

      <div
        className={`multiselect-root ${disabled ? "disabled" : ""}`}
        aria-expanded={open}
      >
        <button
          type="button"
          className="multiselect-control"
          onClick={() => !disabled && setOpen((s) => !s)}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
        >
          <div className="chip-list">
            {selectedLabels.length === 0 ? (
              <span className="placeholder">{placeholder}</span>
            ) : (
              selectedLabels.map((lab) => (
                <span key={lab} className="chip">
                  {lab}
                </span>
              ))
            )}
          </div>
          <span className={`caret ${open ? "open" : ""}`}>▾</span>
        </button>

        {open && (
          <div className="multiselect-dropdown" role="listbox">
            <div className="multiselect-search-wrap">
              <input
                type="text"
                className="multiselect-search"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  onSearch?.(e.target.value);
                }}
                autoFocus
              />
            </div>

            <div className="multiselect-list">
              {options.length === 0 ? (
                <div className="multiselect-empty">No results</div>
              ) : (
                options.map((option) => (
                  <label
                    key={option.value}
                    className="multiselect-row"
                    htmlFor={`${id || name}-${option.value}`}
                  >
                    <input
                      id={`${id || name}-${option.value}`}
                      type="checkbox"
                      checked={value.includes(option.value)}
                      onChange={() => toggleOption(option.value)}
                      disabled={disabled}
                      className="checkbox-input"
                    />
                    <span className="checkbox-label">{option.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && <span className="form-error-msg">{error}</span>}
    </div>
  );
};

export default MultiSelectCheckbox;
