import "./Tabs.css";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

const Tabs = ({ tabs, active, onChange }: TabsProps) => (
  <div className="tabs">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        className={`tab-btn ${active === tab.key ? "active" : ""}`}
        onClick={() => onChange(tab.key)}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span
            style={{
              marginLeft: 6,
              fontSize: "var(--font-size-xs)",
              opacity: 0.7,
            }}
          >
            ({tab.count})
          </span>
        )}
      </button>
    ))}
  </div>
);

export default Tabs;
