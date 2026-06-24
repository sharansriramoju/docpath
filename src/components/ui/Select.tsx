import { useEffect, useRef, useState, type SelectHTMLAttributes } from "react";
import "./Input.css";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  className?: string;
  onSearch?: (search: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCreateNew?: (search: string) => void;
  createNewLabel?: string;
}

const Select = ({
  label,
  error,
  options = [],
  placeholder,
  className = "",
  value = "",
  id,
  disabled = false,
  onSearch,
  onCreateNew,
  createNewLabel,
  ...props
}: SelectProps) => {
  const selectId = id || props.name;

  // Derive the text colour from the current value so pre-filled selects (e.g.
  // in edit mode) render as active rather than looking muted/disabled.
  const optionColor =
    value === "" || value === undefined
      ? "var(--text-muted)"
      : "var(--text-primary)";

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [labelCache, setLabelCache] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!onSearch) return;
    setLabelCache((prev) => {
      const next = new Map(prev);
      options.forEach((o) => next.set(o.value, o.label));
      return next;
    });
  }, [options, onSearch]);

  useEffect(() => {
    if (!onSearch) return;
    const handleDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
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
  }, [onSearch]);

  const handleOptionClick = (optValue: string) => {
    props.onChange?.({
      target: { value: optValue },
    } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    setSearch("");
    onSearch?.("");
  };

  if (onSearch) {
    const selectedLabel =
      labelCache.get(value as string) ??
      options.find((o) => o.value === value)?.label;

    return (
      <div className={`form-field ${className}`} ref={rootRef}>
        {label && (
          <label className="form-label" htmlFor={selectId}>
            {label}
          </label>
        )}

        <div className={`select-searchable ${open ? "open" : ""}`}>
          <button
            type="button"
            id={selectId}
            className="select-searchable-trigger"
            onClick={() => !disabled && setOpen((s) => !s)}
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={disabled}
          >
            <span className={selectedLabel ? "" : "placeholder"}>
              {selectedLabel ?? placeholder ?? "Select"}
            </span>
            <span className="select-searchable-arrow">▾</span>
          </button>

          {open && (
            <div className="select-searchable-dropdown" role="listbox">
              <div className="select-searchable-search-wrap">
                <input
                  type="text"
                  className="select-searchable-search"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    onSearch(e.target.value);
                  }}
                  autoFocus
                />
              </div>

              <div className="select-searchable-list">
                {options.length === 0 ? (
                  <div className="select-searchable-empty">
                    No results
                    {onCreateNew && search.trim() && (
                      <button
                        type="button"
                        className="select-searchable-create"
                        onClick={() => {
                          setOpen(false);
                          onCreateNew(search.trim());
                          setSearch("");
                        }}
                      >
                        {createNewLabel ?? `+ Create "${search.trim()}"`}
                      </button>
                    )}
                  </div>
                ) : (
                  options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={value === opt.value}
                      className={`select-searchable-option ${value === opt.value ? "selected" : ""}`}
                      onClick={() => handleOptionClick(opt.value)}
                      disabled={disabled}
                    >
                      {opt.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {error && <span className="form-error-msg">{error}</span>}
      </div>
    );
  }

  // Native select fallback
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
        value={value || undefined}
        disabled={disabled}
        {...props}
        onChange={(e) => {
          props.onChange?.(e);
        }}
        style={{ color: optionColor }}
      >
        {placeholder && (
          <option value="" style={{ color: "var(--text-muted)" }}>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{
              color:
                opt.value === "" ? "var(--text-muted)" : "var(--text-primary)",
            }}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error-msg">{error}</span>}
    </div>
  );
};

export default Select;
