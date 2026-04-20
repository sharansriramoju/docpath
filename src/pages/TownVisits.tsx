import { useState } from "react";
import { Plus, MapPin, Users, Calendar } from "lucide-react";
import { PageHeader } from "../components/layout";
import {
  Card,
  Table,
  Button,
  Badge,
  Modal,
  Input,
  SearchBar,
} from "../components/ui";

const SAMPLE_VISITS = [
  {
    id: 1,
    location: "Rampur Village",
    date: "2026-03-20",
    time: "09:00 AM - 01:00 PM",
    expectedPatients: 12,
    status: "Scheduled",
    contact: "Sarpanch Ramesh — 98765-00001",
  },
  {
    id: 2,
    location: "Sundarnagar",
    date: "2026-03-22",
    time: "09:00 AM - 01:00 PM",
    expectedPatients: 8,
    status: "Scheduled",
    contact: "PHC Nurse Kamla — 98765-00002",
  },
  {
    id: 3,
    location: "Bilaspur Camp",
    date: "2026-03-25",
    time: "10:00 AM - 02:00 PM",
    expectedPatients: 15,
    status: "Scheduled",
    contact: "NGO Coord. Vikram — 98765-00003",
  },
  {
    id: 4,
    location: "Rampur Village",
    date: "2026-03-13",
    time: "09:00 AM - 01:00 PM",
    expectedPatients: 10,
    status: "Completed",
    contact: "Sarpanch Ramesh — 98765-00001",
  },
  {
    id: 5,
    location: "Khampur",
    date: "2026-03-06",
    time: "10:00 AM - 02:00 PM",
    expectedPatients: 7,
    status: "Completed",
    contact: "ANM Sunita — 98765-00004",
  },
];

const columns = [
  { key: "date", label: "Date" },
  {
    key: "location",
    label: "Location",
    render: (v: unknown) => (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          fontWeight: 500,
        }}
      >
        <MapPin size={14} /> {v as string}
      </span>
    ),
  },
  { key: "time", label: "Timing" },
  {
    key: "expectedPatients",
    label: "Expected",
    render: (v: unknown) => <span>{v as number} patients</span>,
  },
  {
    key: "contact",
    label: "Local Contact",
    render: (v: unknown) => (
      <span style={{ fontSize: "var(--font-size-sm)" }}>{v as string}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (v: unknown) => (
      <Badge variant={(v as string) === "Completed" ? "success" : "primary"}>
        {v as string}
      </Badge>
    ),
  },
];

const TownVisits = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = SAMPLE_VISITS.filter((v) =>
    v.location.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Town Visits"
        subtitle="Manage outreach visits to nearby villages and towns"
        actions={
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            Schedule Visit
          </Button>
        }
      />

      {/* Summary Cards */}
      {/* <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <Card>
          <Card.Body>
            <div
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
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <div
                  style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700 }}
                >
                  3
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--text-muted)",
                  }}
                >
                  Upcoming Visits
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div
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
                  background: "var(--color-success-50)",
                  color: "var(--color-success-600)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={20} />
              </div>
              <div>
                <div
                  style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700 }}
                >
                  35
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--text-muted)",
                  }}
                >
                  Expected Patients
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div
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
                  background: "var(--color-warning-50)",
                  color: "var(--color-warning-600)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={20} />
              </div>
              <div>
                <div
                  style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700 }}
                >
                  4
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--text-muted)",
                  }}
                >
                  Locations Covered
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div> */}

      <Card>
        <div style={{ padding: "var(--space-4) var(--space-5)" }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search locations..."
          />
        </div>
        <Table
          columns={columns}
          data={filtered}
          emptyMessage="No visits found"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Town Visit"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Schedule Visit</Button>
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
            label="Location / Village"
            placeholder="Enter location name"
            name="location"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Input label="Date" type="date" name="date" />
            <Input label="Expected Patients" type="number" name="patients" />
          </div>
          <Input
            label="Local Contact"
            placeholder="Name and phone number"
            name="contact"
          />
          <Input
            label="Notes"
            textarea
            placeholder="Special requirements, medicines to carry..."
            name="notes"
          />
        </div>
      </Modal>
    </div>
  );
};

export default TownVisits;
