import { useState } from "react";
import { Plus, Eye, Edit2, Phone, FileText } from "lucide-react";
import { PageHeader } from "../components/layout";
import {
  Card,
  Table,
  Button,
  Badge,
  Avatar,
  SearchBar,
  Modal,
  Input,
  Select,
} from "../components/ui";

const SAMPLE_PATIENTS = [
  {
    id: 1,
    name: "Anita Verma",
    age: 34,
    gender: "Female",
    phone: "98765-43210",
    bloodGroup: "B+",
    lastVisit: "2026-03-18",
    condition: "Diabetes Type 2",
    status: "Active",
  },
  {
    id: 2,
    name: "Mohan Lal",
    age: 56,
    gender: "Male",
    phone: "98765-43211",
    bloodGroup: "O+",
    lastVisit: "2026-03-18",
    condition: "Hypertension",
    status: "Active",
  },
  {
    id: 3,
    name: "Priya Patel",
    age: 28,
    gender: "Female",
    phone: "98765-43212",
    bloodGroup: "A+",
    lastVisit: "2026-03-17",
    condition: "Prenatal Care",
    status: "Active",
  },
  {
    id: 4,
    name: "Suresh Kumar",
    age: 45,
    gender: "Male",
    phone: "98765-43213",
    bloodGroup: "AB+",
    lastVisit: "2026-03-15",
    condition: "Arthritis",
    status: "Active",
  },
  {
    id: 5,
    name: "Kavita Joshi",
    age: 62,
    gender: "Female",
    phone: "98765-43214",
    bloodGroup: "O-",
    lastVisit: "2026-03-10",
    condition: "COPD",
    status: "Inactive",
  },
];

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const BLOOD_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
  (v) => ({ value: v, label: v }),
);

const columns = [
  {
    key: "name",
    label: "Patient",
    render: (val: unknown, row: Record<string, unknown>) => (
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}
      >
        <Avatar name={val as string} size="sm" />
        <div>
          <div style={{ fontWeight: 500 }}>{val as string}</div>
          <div
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-muted)",
            }}
          >
            {row.phone as string}
          </div>
        </div>
      </div>
    ),
  },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  {
    key: "bloodGroup",
    label: "Blood Group",
    render: (v: unknown) => <Badge variant="danger">{v as string}</Badge>,
  },
  { key: "condition", label: "Condition" },
  { key: "lastVisit", label: "Last Visit" },
  {
    key: "status",
    label: "Status",
    render: (v: unknown) => (
      <Badge variant={(v as string) === "Active" ? "success" : "default"}>
        {v as string}
      </Badge>
    ),
  },
];

const Patients = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = SAMPLE_PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.condition.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Manage patient directory and details"
        actions={
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            Add Patient
          </Button>
        }
      />

      <Card>
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search patients..."
          />
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-muted)",
            }}
          >
            {filtered.length} patient{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
        <Table
          columns={columns}
          data={filtered}
          emptyMessage="No patients found"
          renderActions={(row) => (
            <>
              <Button variant="ghost" size="sm" icon={Eye} title="View" />
              <Button
                variant="ghost"
                size="sm"
                icon={FileText}
                title="Records"
              />
              <Button variant="ghost" size="sm" icon={Edit2} title="Edit" />
            </>
          )}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Patient"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Save Patient</Button>
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
              label="Full Name"
              placeholder="Patient full name"
              name="name"
            />
            <Input
              label="Phone Number"
              placeholder="98765-43210"
              name="phone"
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Input label="Age" type="number" name="age" />
            <Select
              label="Gender"
              options={GENDER_OPTIONS}
              placeholder="Select"
              name="gender"
            />
            <Select
              label="Blood Group"
              options={BLOOD_OPTIONS}
              placeholder="Select"
              name="bloodGroup"
            />
          </div>
          <Input
            label="Address"
            textarea
            placeholder="Patient address..."
            name="address"
          />
          <Input
            label="Medical History"
            textarea
            placeholder="Known conditions, allergies..."
            name="history"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Patients;
