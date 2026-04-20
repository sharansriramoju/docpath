import {
  Calendar,
  Users,
  Stethoscope,
  ClipboardList,
  Clock,
  MapPin,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/layout";
import {
  StatCard,
  Card,
  Badge,
  Avatar,
  Button,
  Table,
  StatusDot,
} from "../components/ui";

const TODAY_APPOINTMENTS = [
  {
    id: 1,
    time: "09:00 AM",
    patient: "Anita Verma",
    type: "Follow-up",
    status: "Confirmed",
  },
  {
    id: 2,
    time: "09:30 AM",
    patient: "Mohan Lal",
    type: "Consultation",
    status: "Confirmed",
  },
  {
    id: 3,
    time: "10:00 AM",
    patient: "Priya Patel",
    type: "Check-up",
    status: "Pending",
  },
  {
    id: 4,
    time: "10:30 AM",
    patient: "Suresh Kumar",
    type: "Lab Review",
    status: "Confirmed",
  },
  {
    id: 5,
    time: "11:00 AM",
    patient: "Kavita Joshi",
    type: "Consultation",
    status: "Pending",
  },
];

const UPCOMING_VISITS = [
  { id: 1, location: "Rampur Village", date: "Mar 20, 2026", patients: 12 },
  { id: 2, location: "Sundarnagar", date: "Mar 22, 2026", patients: 8 },
  { id: 3, location: "Bilaspur Camp", date: "Mar 25, 2026", patients: 15 },
];

const RECENT_PATIENTS = [
  {
    id: 1,
    name: "Anita Verma",
    age: 34,
    lastVisit: "Today",
    condition: "Diabetes Type 2",
  },
  {
    id: 2,
    name: "Mohan Lal",
    age: 56,
    lastVisit: "Today",
    condition: "Hypertension",
  },
  {
    id: 3,
    name: "Priya Patel",
    age: 28,
    lastVisit: "Yesterday",
    condition: "Prenatal Care",
  },
];

const appointmentColumns = [
  { key: "time", label: "Time" },
  {
    key: "patient",
    label: "Patient",
    render: (val: unknown) => (
      <span style={{ fontWeight: 500 }}>{val as string}</span>
    ),
  },
  {
    key: "type",
    label: "Type",
    render: (val: unknown) => <Badge variant="primary">{val as string}</Badge>,
  },
  {
    key: "status",
    label: "Status",
    render: (val: unknown) => (
      <StatusDot status={(val as string).toLowerCase()} label={val as string} />
    ),
  },
];

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, Dr. ${user?.name?.split(" ").pop()}. Here's your day at a glance.`}
      />

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "var(--space-5)",
          marginBottom: "var(--space-6)",
        }}
      >
        <StatCard
          label="Today's Appointments"
          value="12"
          icon={Calendar}
          color="primary"
          change={8}
        />
        <StatCard
          label="Total Patients"
          value="1,248"
          icon={Users}
          color="success"
          change={12}
        />
        <StatCard
          label="Pending Reports"
          value="5"
          icon={ClipboardList}
          color="warning"
        />
        <StatCard
          label="Upcoming Visits"
          value="3"
          icon={MapPin}
          color="danger"
        />
      </div>

      {/* Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "var(--space-5)",
          alignItems: "start",
        }}
      >
        {/* Today's Schedule */}
        <Card>
          <Card.Header
            title="Today's Appointments"
            action={
              <Button variant="ghost" size="sm" icon={ArrowUpRight}>
                View All
              </Button>
            }
          />
          <Table columns={appointmentColumns} data={TODAY_APPOINTMENTS} />
        </Card>

        {/* Right Column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-5)",
          }}
        >
          {/* Town Visits */}
          <Card>
            <Card.Header title="Upcoming Town Visits" />
            <Card.Body>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-4)",
                }}
              >
                {UPCOMING_VISITS.map((visit) => (
                  <div
                    key={visit.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-primary-50)",
                        color: "var(--color-primary-600)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MapPin size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: "var(--font-size-sm)",
                        }}
                      >
                        {visit.location}
                      </div>
                      <div
                        style={{
                          fontSize: "var(--font-size-xs)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {visit.date} · {visit.patients} patients
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Recent Patients */}
          <Card>
            <Card.Header title="Recent Patients" />
            <Card.Body>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-4)",
                }}
              >
                {RECENT_PATIENTS.map((pt) => (
                  <div
                    key={pt.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                    }}
                  >
                    <Avatar name={pt.name} size="sm" />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: "var(--font-size-sm)",
                        }}
                      >
                        {pt.name}
                      </div>
                      <div
                        style={{
                          fontSize: "var(--font-size-xs)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {pt.condition} · Age {pt.age}
                      </div>
                    </div>
                    <Badge>{pt.lastVisit}</Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
