import { useMemo } from "react";
import Select from "./Select";
import "./Input.css";

export interface DobValue {
  year: string;
  month: string;
  day: string;
}

interface DateOfBirthPickerProps {
  label?: string;
  value: DobValue;
  onChange: (value: DobValue) => void;
  error?: string;
  disabled?: boolean;
  minYear?: number;
  maxYear?: number;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

const daysInMonth = (year: string, month: string): number => {
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
};

const DateOfBirthPicker = ({
  label,
  value,
  onChange,
  error,
  disabled = false,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
}: DateOfBirthPickerProps) => {
  const yearOptions = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      out.push({ value: String(y), label: String(y) });
    }
    return out;
  }, [minYear, maxYear]);

  const monthOptions = useMemo(
    () => MONTHS.map((name, i) => ({ value: pad(i + 1), label: name })),
    [],
  );

  const dayOptions = useMemo(() => {
    const max = daysInMonth(value.year, value.month);
    const out: { value: string; label: string }[] = [];
    for (let d = 1; d <= max; d++) {
      out.push({ value: pad(d), label: String(d) });
    }
    return out;
  }, [value.year, value.month]);

  const emit = (next: DobValue) => {
    // Clamp the day if the new month/year has fewer days.
    const max = daysInMonth(next.year, next.month);
    if (next.day && Number(next.day) > max) {
      next = { ...next, day: "" };
    }
    onChange(next);
  };

  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr 1fr",
          gap: "var(--space-3)",
        }}
      >
        <Select
          value={value.day}
          onChange={(e) => emit({ ...value, day: e.target.value })}
          placeholder="Day"
          options={dayOptions}
          disabled={disabled}
        />
        <Select
          value={value.month}
          onChange={(e) => emit({ ...value, month: e.target.value })}
          placeholder="Month"
          options={monthOptions}
          disabled={disabled}
        />
        <Select
          value={value.year}
          onChange={(e) => emit({ ...value, year: e.target.value })}
          placeholder="Year"
          options={yearOptions}
          disabled={disabled}
        />
      </div>
      {error && <span className="form-error-msg">{error}</span>}
    </div>
  );
};

export default DateOfBirthPicker;
