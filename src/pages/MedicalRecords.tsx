import { useState } from "react";
import { Plus, Eye, Download, FileText } from "lucide-react";
import { PageHeader } from "../components/layout";
import {
  Card,
  Table,
  Button,
  Badge,
  Avatar,
  SearchBar,
  Tabs,
  Modal,
  Input,
  Select,
} from "../components/ui";

const SAMPLE_RECORDS = [
  {
    id: 1,
    patient: "Anita Verma",
    date: "2026-03-18",
    diagnosis: "Diabetes Type 2 - Stable",
    doctor: "Dr. Sharma",
    type: "Follow-up",
    prescriptions: "Metformin 500mg",
    notes: "HbA1c improved to 6.8%",
  },
  {
    id: 2,
    patient: "Mohan Lal",
    date: "2026-03-18",
    diagnosis: "Hypertension Stage 1",
    doctor: "Dr. Sharma",
    type: "Consultation",
    prescriptions: "Amlodipine 5mg",
    notes: "BP 148/92 — started medication",
  },
  {
    id: 3,
    patient: "Priya Patel",
    date: "2026-03-17",
    diagnosis: "Prenatal — Week 24",
    doctor: "Dr. Sharma",
    type: "Check-up",
    prescriptions: "Iron + Folic Acid",
    notes: "Normal progress",
  },
  {
    id: 4,
    patient: "Suresh Kumar",
    date: "2026-03-15",
    diagnosis: "Osteoarthritis — Knee",
    doctor: "Dr. Sharma",
    type: "Follow-up",
    prescriptions: "Diclofenac gel",
    notes: "Physiotherapy recommended",
  },
];

const TYPE_TABS = [
  { key: "all", label: "All Records" },
  { key: "Consultation", label: "Consultations" },
  { key: "Follow-up", label: "Follow-ups" },
  { key: "Check-up", label: "Check-ups" },
];

const columns = [
  { key: "date", label: "Date" },
  {
    key: "patient",
    label: "Patient",
    render: (val: unknown) => (
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
      >
        <Avatar name={val as string} size="sm" />
        <span style={{ fontWeight: 500 }}>{val as string}</span>
      </div>
    ),
  },
  { key: "diagnosis", label: "Diagnosis" },
  {
    key: "type",
    label: "Type",
    render: (v: unknown) => <Badge variant="primary">{v as string}</Badge>,
  },
  {
    key: "prescriptions",
    label: "Prescriptions",
    render: (v: unknown) => (
      <span style={{ fontSize: "var(--font-size-sm)" }}>{v as string}</span>
    ),
  },
];

const MedicalRecords = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = SAMPLE_RECORDS.filter((r) => {
    const matchSearch =
      r.patient.toLowerCase().includes(search.toLowerCase()) ||
      r.diagnosis.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === "all" || r.type === activeTab;
    return matchSearch && matchTab;
  });

  return (
    <div>
      <PageHeader
        title="Medical Records"
        subtitle="View and manage patient medical records"
        actions={
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            New Record
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
          <Tabs tabs={TYPE_TABS} active={activeTab} onChange={setActiveTab} />
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search records..."
          />
        </div>
        <Table
          columns={columns}
          data={filtered}
          emptyMessage="No records found"
          renderActions={(row) => (
            <>
              <Button variant="ghost" size="sm" icon={Eye} title="View" />
              <Button
                variant="ghost"
                size="sm"
                icon={Download}
                title="Download"
              />
            </>
          )}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Medical Record"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Save Record</Button>
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Input
              label="Patient"
              placeholder="Search patient..."
              name="patient"
            />
            <Input label="Date" type="date" name="date" />
          </div>
          <Select
            label="Record Type"
            options={TYPE_TABS.filter((t) => t.key !== "all").map((t) => ({
              value: t.key,
              label: t.label,
            }))}
            placeholder="Select type"
            name="type"
          />
          <Input
            label="Diagnosis"
            placeholder="Primary diagnosis"
            name="diagnosis"
          />
          <Input
            label="Prescriptions"
            textarea
            placeholder="Medications prescribed..."
            name="prescriptions"
          />
          <Input
            label="Clinical Notes"
            textarea
            placeholder="Observations, vitals, recommendations..."
            name="notes"
          />
        </div>
      </Modal>
    </div>
  );
};

export default MedicalRecords;
