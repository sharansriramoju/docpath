import { useState } from "react";
import { Plus, Edit2, Trash2, Shield } from "lucide-react";
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
import { useAuth } from "../context/AuthContext";

const SAMPLE_USERS = [
  {
    id: "1",
    name: "Dr. Rajesh Sharma",
    email: "dr.sharma@clinicare.com",
    role: "doctor",
    status: "Active",
    lastLogin: "2026-03-18",
  },
  {
    id: "2",
    name: "Meena Kumari",
    email: "meena@clinicare.com",
    role: "receptionist",
    status: "Active",
    lastLogin: "2026-03-18",
  },
  {
    id: "3",
    name: "Sunita Devi",
    email: "sunita@clinicare.com",
    role: "nurse",
    status: "Active",
    lastLogin: "2026-03-17",
  },
  {
    id: "4",
    name: "Admin User",
    email: "admin@clinicare.com",
    role: "admin",
    status: "Active",
    lastLogin: "2026-03-16",
  },
  {
    id: "5",
    name: "Ravi Verma",
    email: "ravi@clinicare.com",
    role: "receptionist",
    status: "Inactive",
    lastLogin: "2026-02-20",
  },
];

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "receptionist", label: "Receptionist" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "danger",
  doctor: "primary",
  nurse: "success",
  receptionist: "warning",
};

const columns = [
  {
    key: "name",
    label: "User",
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
            {row.email as string}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    render: (v: unknown) => (
      <Badge
        variant={
          (ROLE_COLORS[v as string] || "default") as
            | "default"
            | "primary"
            | "danger"
            | "success"
            | "warning"
        }
      >
        {(v as string).charAt(0).toUpperCase() + (v as string).slice(1)}
      </Badge>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (v: unknown) => (
      <Badge variant={(v as string) === "Active" ? "success" : "default"}>
        {v as string}
      </Badge>
    ),
  },
  { key: "lastLogin", label: "Last Login" },
];

const UserManagement = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { ROLE_PERMISSIONS } = useAuth();

  const filtered = SAMPLE_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage clinic staff accounts, roles, and permissions"
        actions={
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            Add User
          </Button>
        }
      />

      {/* Roles Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        {ROLE_OPTIONS.map((role) => (
          <Card key={role.value}>
            <Card.Body>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-3)",
                }}
              >
                <Shield
                  size={20}
                  style={{
                    color: `var(--color-${ROLE_COLORS[role.value]}-600)`,
                  }}
                />
                <span style={{ fontWeight: 600 }}>{role.label}</span>
                <Badge
                  variant={
                    ROLE_COLORS[role.value] as
                      | "default"
                      | "primary"
                      | "danger"
                      | "success"
                      | "warning"
                  }
                >
                  {SAMPLE_USERS.filter((u) => u.role === role.value).length}
                </Badge>
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--text-muted)",
                }}
              >
                {
                  (
                    ROLE_PERMISSIONS[
                      role.value as keyof typeof ROLE_PERMISSIONS
                    ] || []
                  ).length
                }{" "}
                permissions
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

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
            placeholder="Search users..."
          />
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-muted)",
            }}
          >
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Table
          columns={columns}
          data={filtered}
          emptyMessage="No users found"
          renderActions={(row) => (
            <>
              <Button variant="ghost" size="sm" icon={Edit2} title="Edit" />
              <Button variant="ghost" size="sm" icon={Trash2} title="Delete" />
            </>
          )}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Create User</Button>
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
          <Input label="Full Name" placeholder="Enter full name" name="name" />
          <Input
            label="Email"
            type="email"
            placeholder="user@clinicare.com"
            name="email"
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            placeholder="Select role"
            name="role"
          />
          <Input label="Phone" placeholder="Phone number" name="phone" />
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
