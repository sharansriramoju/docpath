import { Badge, Calendar, Edit, MapPin, Plus } from "lucide-react";
import { PageHeader } from "../components/layout";
import {
  Button,
  Card,
  Input,
  Modal,
  SearchBar,
  Select,
  Table,
} from "../components/ui";
import { useState } from "react";

interface VisitConfigItem {
  id: number;
  location: string;
  index: number;
  week_day: string;
}

interface VisitConfigRow extends VisitConfigItem {
  visit_day: string;
  [key: string]: unknown;
}

interface FormData {
  location: string | undefined;
  index: string | undefined;
  week_day: string | undefined;
}

const sampleVisitConfig: VisitConfigItem[] = [
  {
    id: 1,
    location: "Karimnagar",
    index: 1,
    week_day: "Friday",
  },
  {
    id: 2,
    location: "Karimnagar",
    index: 3,
    week_day: "Friday",
  },
  {
    id: 3,
    location: "Hyderabad",
    index: 2,
    week_day: "Sunday",
  },
];

const VisitConfig = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<FormData>({
    location: undefined,
    index: undefined,
    week_day: undefined,
  });

  const handleEdit = (row: VisitConfigRow) => {
    setFormData({
      location: row.location,
      index: String(row.index),
      week_day: row.week_day,
    });
    setEditModalOpen(true);
  };

  const columns = [
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
    {
      key: "visit_day",
      label: "Visit Day",
      render: (v: unknown) => (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontWeight: 200,
          }}
        >
          <Calendar size={14} /> {v as string}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_v: unknown, row: VisitConfigRow) => (
        <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
          <Edit size={14} />
        </Button>
      ),
    },
  ];

  const filtered = sampleVisitConfig
    .filter((v) => v.location.toLowerCase().includes(search.toLowerCase()))
    .map((v) => {
      return {
        ...v,
        visit_day: `${v.index}nd ${v.week_day}`,
      };
    });
  console.log(filtered);
  return (
    <div>
      <PageHeader
        title="Town Visits"
        subtitle="Manage outreach visits to nearby villages and towns"
        actions={
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            Configure New Visit
          </Button>
        }
      />
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
        title="Configure Visit"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <Input
            label="Location"
            placeholder="Enter location name"
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          ></Input>
          <Input
            label="Index"
            placeholder="enter the number (Eg : if it is 2nd friday enter 2)"
            id="index"
            value={formData.index}
            onChange={(e) =>
              setFormData({ ...formData, index: e.target.value })
            }
          ></Input>
          <Select
            label="Week Day"
            placeholder="Select a week day"
            id="week_day"
            value={formData.week_day ? formData.week_day : "Monday"}
            onChange={(e) =>
              setFormData({ ...formData, week_day: e.target.value })
            }
            options={[
              { value: "Monday", label: "Monday" },
              { value: "Tuesday", label: "Tuesday" },
              { value: "Wednesday", label: "Wednesday" },
              { value: "Thursday", label: "Thursday" },
              { value: "Friday", label: "Friday" },
              { value: "Saturday", label: "Saturday" },
              { value: "Sunday", label: "Sunday" },
            ]}
          />
          <Button onClick={() => setModalOpen(false)}>Configure Visit</Button>
        </div>
      </Modal>
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Visit"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <Input
            label="Location"
            placeholder="Enter location name"
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          ></Input>
          <Input
            label="Index"
            placeholder="enter the number (Eg : if it is 2nd friday enter 2)"
            id="index"
            value={formData.index}
            onChange={(e) =>
              setFormData({ ...formData, index: e.target.value })
            }
          ></Input>
          <Select
            label="Week Day"
            placeholder="Select a week day"
            id="week_day"
            value={formData.week_day ? formData.week_day : "Monday"}
            onChange={(e) =>
              setFormData({ ...formData, week_day: e.target.value })
            }
            options={[
              { value: "Monday", label: "Monday" },
              { value: "Tuesday", label: "Tuesday" },
              { value: "Wednesday", label: "Wednesday" },
              { value: "Thursday", label: "Thursday" },
              { value: "Friday", label: "Friday" },
              { value: "Saturday", label: "Saturday" },
              { value: "Sunday", label: "Sunday" },
            ]}
          />
          <Button onClick={() => setEditModalOpen(false)}>Save Changes</Button>
        </div>
      </Modal>
    </div>
  );
};

export default VisitConfig;
