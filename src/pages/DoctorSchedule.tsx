import { useState } from "react";
import { Plus, Clock, MapPin } from "lucide-react";
import { PageHeader } from "../components/layout";
import { Card, Button, Badge, Tabs } from "../components/ui";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface ScheduleSlot {
  time: string;
  type: string;
  location: string;
}

const SCHEDULE: Record<string, ScheduleSlot[]> = {
  Monday: [
    { time: "09:00 - 12:00", type: "OPD", location: "Clinic" },
    { time: "14:00 - 17:00", type: "OPD", location: "Clinic" },
  ],
  Tuesday: [
    { time: "09:00 - 12:00", type: "OPD", location: "Clinic" },
    { time: "14:00 - 16:00", type: "Surgeries", location: "Clinic" },
  ],
  Wednesday: [
    { time: "09:00 - 13:00", type: "Town Visit", location: "Rampur Village" },
  ],
  Thursday: [
    { time: "09:00 - 12:00", type: "OPD", location: "Clinic" },
    { time: "14:00 - 17:00", type: "OPD", location: "Clinic" },
  ],
  Friday: [
    { time: "09:00 - 13:00", type: "Town Visit", location: "Sundarnagar" },
  ],
  Saturday: [{ time: "09:00 - 13:00", type: "OPD", location: "Clinic" }],
};

const TYPE_COLORS: Record<string, string> = {
  OPD: "primary",
  Surgeries: "danger",
  "Town Visit": "success",
};

const DoctorSchedule = () => {
  const [view, setView] = useState("week");

  return (
    <div>
      <PageHeader
        title="Doctor Schedule"
        subtitle="Weekly schedule and availability management"
        actions={<Button icon={Plus}>Add Slot</Button>}
      />

      <Tabs
        tabs={[
          { key: "week", label: "Week View" },
          { key: "day", label: "Day View" },
        ]}
        active={view}
        onChange={setView}
      />

      <div
        style={{
          marginTop: "var(--space-5)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        {DAYS.map((day) => (
          <Card key={day}>
            <Card.Header title={day} />
            <Card.Body>
              {SCHEDULE[day]?.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                  }}
                >
                  {SCHEDULE[day].map((slot, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "var(--space-3)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-color)",
                        background: "var(--color-gray-50)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "var(--space-2)",
                        }}
                      >
                        <Badge
                          variant={
                            (TYPE_COLORS[slot.type] || "default") as
                              | "default"
                              | "primary"
                              | "danger"
                              | "success"
                              | "warning"
                          }
                        >
                          {slot.type}
                        </Badge>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-2)",
                          fontSize: "var(--font-size-sm)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <Clock size={14} /> {slot.time}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-2)",
                          fontSize: "var(--font-size-sm)",
                          color: "var(--text-secondary)",
                          marginTop: "var(--space-1)",
                        }}
                      >
                        <MapPin size={14} /> {slot.location}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: "var(--space-4)",
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  No slots scheduled
                </div>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DoctorSchedule;
