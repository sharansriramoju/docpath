import { useState } from "react";
import { Plus, Eye, Edit2, Trash2, Calendar as CalIcon } from "lucide-react";
import { PageHeader } from "../components/layout";
import {
  Card,
  Table,
  Button,
  Badge,
  StatusDot,
  SearchBar,
  Modal,
  Input,
  Select,
  Tabs,
} from "../components/ui";

const SAMPLE_APPOINTMENTS = [
  {
    id: 1,
    date: "2026-03-18",
    time: "09:00 AM",
    patient: "Anita Verma",
    doctor: "Dr. Sharma",
    type: "Follow-up",
    status: "Confirmed",
    notes: "Diabetes follow-up",
  },
  {
    id: 2,
    date: "2026-03-18",
    time: "09:30 AM",
    patient: "Mohan Lal",
    doctor: "Dr. Sharma",
    type: "Consultation",
    status: "Confirmed",
    notes: "BP check",
  },
  {
    id: 3,
    date: "2026-03-18",
    time: "10:00 AM",
    patient: "Priya Patel",
    doctor: "Dr. Sharma",
    type: "Check-up",
    status: "Pending",
    notes: "Prenatal visit",
  },
  {
    id: 4,
    date: "2026-03-19",
    time: "09:00 AM",
    patient: "Suresh Kumar",
    doctor: "Dr. Sharma",
    type: "Lab Review",
    status: "Pending",
    notes: "Blood work results",
  },
  {
    id: 5,
    date: "2026-03-19",
    time: "10:00 AM",
    patient: "Kavita Joshi",
    doctor: "Dr. Sharma",
    type: "Consultation",
    status: "Cancelled",
    notes: "",
  },
];

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "pending", label: "Pending" },
  { key: "cancelled", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "Consultation", label: "Consultation" },
  { value: "Follow-up", label: "Follow-up" },
  { value: "Check-up", label: "Check-up" },
  { value: "Lab Review", label: "Lab Review" },
  { value: "Emergency", label: "Emergency" },
];

const columns = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  {
    key: "patient",
    label: "Patient",
    render: (v: unknown) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    ),
  },
  {
    key: "type",
    label: "Type",
    render: (v: unknown) => <Badge variant="primary">{v as string}</Badge>,
  },
  {
    key: "status",
    label: "Status",
    render: (v: unknown) => (
      <StatusDot status={(v as string).toLowerCase()} label={v as string} />
    ),
  },
  {
    key: "notes",
    label: "Notes",
    render: (v: unknown) => (
      <span
        style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}
      >
        {(v as string) || "—"}
      </span>
    ),
  },
];

const Appointments = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = SAMPLE_APPOINTMENTS.filter((a) => {
    const matchesSearch = a.patient
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesTab =
      activeTab === "all" || a.status.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const tabsWithCount = STATUS_TABS.map((t) => ({
    ...t,
    count:
      t.key === "all"
        ? SAMPLE_APPOINTMENTS.length
        : SAMPLE_APPOINTMENTS.filter((a) => a.status.toLowerCase() === t.key)
            .length,
  }));

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Manage patient appointments and scheduling"
        actions={
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            New Appointment
          </Button>
        }
      />

      <Card>
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            flexWrap: "wrap",
          }}
        >
          <Tabs
            tabs={tabsWithCount}
            active={activeTab}
            onChange={setActiveTab}
          />
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search patients..."
          />
        </div>
        <Table
          columns={columns}
          data={filtered}
          emptyMessage="No appointments found"
          renderActions={(row) => (
            <>
              <Button variant="ghost" size="sm" icon={Eye} title="View" />
              <Button variant="ghost" size="sm" icon={Edit2} title="Edit" />
              <Button variant="ghost" size="sm" icon={Trash2} title="Cancel" />
            </>
          )}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Appointment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>
              Save Appointment
            </Button>
          </>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <Input
            label="Patient Name"
            placeholder="Search or enter patient name"
            name="patient"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Input label="Date" type="date" name="date" />
            <Input label="Time" type="time" name="time" />
          </div>
          <Select
            label="Appointment Type"
            options={TYPE_OPTIONS}
            placeholder="Select type"
            name="type"
          />
          <Input
            label="Notes"
            textarea
            placeholder="Additional notes..."
            name="notes"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Appointments;
