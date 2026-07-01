import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
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
  MultiSelectCheckbox,
  DateOfBirthPicker,
} from "../components/ui";
import type { TableColumn } from "../components/ui/Table";
import useUsers from "../hooks/useUsers";
import type {
  DoctorRef,
  LocationRef,
} from "../slices/UsersSlice";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

type BadgeVariant = "default" | "primary" | "danger" | "success" | "warning";

const ROLE_COLORS: Record<string, BadgeVariant> = {
  admin: "danger",
  doctor: "primary",
  nurse: "success",
  receptionist: "warning",
};

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const getRoleColor = (roleName?: string): BadgeVariant =>
  ROLE_COLORS[(roleName || "").toLowerCase()] ?? "primary";

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dobYear: string;
  dobMonth: string;
  dobDay: string;
  role_id: string;
}

const EMPTY_FORM: UserFormData = {
  name: "",
  email: "",
  phone: "",
  gender: "",
  dobYear: "",
  dobMonth: "",
  dobDay: "",
  role_id: "",
};

interface UserRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  roleName: string;
  created_at: string;
}

const dedupeById = <T,>(items: T[], key: (item: T) => string): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const id = key(item);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
};

const formatDate = (iso: string): string =>
  iso ? new Date(iso).toLocaleDateString() : "—";

// Realistic birth-year window for the DOB dropdowns.
const MIN_DOB_YEAR = 1900;
const MAX_DOB_YEAR = new Date().getFullYear();

const buildDob = (parts: {
  dobYear: string;
  dobMonth: string;
  dobDay: string;
}): string =>
  parts.dobYear && parts.dobMonth && parts.dobDay
    ? `${parts.dobYear}-${parts.dobMonth}-${parts.dobDay}`
    : "";

const UserManagement = () => {
  const { can } = useAuth();
  const canCreateUsers = can("create", "Users");
  const canUpdateUsers = can("update", "Users");
  const canDeleteUsers = can("delete", "Users");
  const { showToast } = useToast();
  const {
    users,
    totalCount,
    loading,
    error: loadError,
    loadingUserId,
    saving,
    saveError,
    deletingUserId,
    roleOptions,
    locationOptions,
    doctorOptions,
    fetchUsers,
    fetchUserById,
    saveUser,
    deleteUser,
    fetchRoleOptions,
    fetchLocationOptions,
    fetchDoctorOptions,
    setError,
    setSaveError,
    clearErrors,
  } = useUsers();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof UserFormData | "dob", string>>
  >({});

  // Selected location / doctor refs (id + name) so chips render their labels.
  const [selectedLocations, setSelectedLocations] = useState<LocationRef[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<DoctorRef[]>([]);
  const [originalLocationIds, setOriginalLocationIds] = useState<string[]>([]);
  const [originalDoctorIds, setOriginalDoctorIds] = useState<string[]>([]);
  const [doctorSearch, setDoctorSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  useEffect(() => {
    if (!loadError) return;
    showToast(loadError, "error");
    setError("");
  }, [loadError]);

  useEffect(() => {
    if (!saveError) return;
    showToast(saveError, "error");
    setSaveError("");
  }, [saveError]);

  useEffect(() => {
    void fetchRoleOptions();
  }, [fetchRoleOptions]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchUsers({
        page,
        limit,
        name: search,
        role_id: roleFilter ? Number(roleFilter) : "",
      });
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchUsers, page, limit, search, roleFilter]);

  const roleSelectOptions = useMemo(
    () =>
      roleOptions.map((role) => ({
        value: String(role.role_id),
        label: role.name,
      })),
    [roleOptions],
  );

  const tableRows = useMemo<UserRow[]>(
    () =>
      users.map((user) => ({
        id: user.user_id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        roleName: user.role?.name ?? "—",
        created_at: user.created_at,
      })),
    [users],
  );

  const locationPickerOptions = useMemo(
    () =>
      dedupeById(
        [...selectedLocations, ...locationOptions],
        (l) => l.location_id,
      ).map((l) => ({ value: l.location_id, label: l.name })),
    [selectedLocations, locationOptions],
  );

  const doctorPickerOptions = useMemo(() => {
    const merged = dedupeById(
      [...selectedDoctors, ...doctorOptions],
      (d) => d.user_id,
    );
    const term = doctorSearch.trim().toLowerCase();
    const filtered = term
      ? merged.filter((d) => d.name.toLowerCase().includes(term))
      : merged;
    return filtered.map((d) => ({ value: d.user_id, label: d.name }));
  }, [selectedDoctors, doctorOptions, doctorSearch]);

  const loadFormOptions = useCallback(async () => {
    await Promise.all([
      fetchRoleOptions(),
      fetchLocationOptions(""),
      fetchDoctorOptions(),
    ]);
  }, [fetchRoleOptions, fetchLocationOptions, fetchDoctorOptions]);

  const validateForm = (): boolean => {
    const nextErrors: Partial<Record<keyof UserFormData | "dob", string>> = {};
    if (!formData.name.trim()) nextErrors.name = "Name is required";
    if (!formData.email.trim()) nextErrors.email = "Email is required";
    if (!formData.phone.trim()) nextErrors.phone = "Phone is required";
    if (!formData.gender) nextErrors.gender = "Gender is required";
    if (!formData.dobYear || !formData.dobMonth || !formData.dobDay)
      nextErrors.dob = "Date of birth is required";
    if (!formData.role_id) nextErrors.role_id = "Role is required";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setSelectedLocations([]);
    setSelectedDoctors([]);
    setOriginalLocationIds([]);
    setOriginalDoctorIds([]);
    setDoctorSearch("");
  };

  const openAddModal = async () => {
    setModalMode("add");
    setSelectedUserId(null);
    resetForm();
    clearErrors();
    setModalOpen(true);
    await loadFormOptions();
  };

  const openEditModal = async (userId: string) => {
    clearErrors();
    setFormErrors({});

    try {
      const [user] = await Promise.all([
        fetchUserById(userId),
        loadFormOptions(),
      ]);
      if (!user) {
        setError("Unable to open user details. Please try again.");
        return;
      }

      const locations = user.locations ?? [];
      const doctors = user.reporting_doctors ?? [];
      const [dobYear = "", dobMonth = "", dobDay = ""] = (
        user.date_of_birth || ""
      ).split("-");

      setModalMode("edit");
      setSelectedUserId(user.user_id);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dobYear,
        dobMonth,
        dobDay,
        role_id: String(user.role_id),
      });
      setSelectedLocations(locations);
      setSelectedDoctors(doctors);
      setOriginalLocationIds(locations.map((l) => l.location_id));
      setOriginalDoctorIds(doctors.map((d) => d.user_id));
      setDoctorSearch("");
      setModalOpen(true);
    } catch (error) {
      setError("Unable to open user details. Please try again.");
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedUserId(null);
    resetForm();
    clearErrors();
  };

  const handleLocationChange = (ids: string[]) => {
    setSelectedLocations((prev) => {
      const known = new Map(prev.map((l) => [l.location_id, l]));
      locationOptions.forEach((l) => known.set(l.location_id, l));
      return ids.map(
        (id) => known.get(id) ?? { location_id: id, name: id },
      );
    });
  };

  const handleDoctorChange = (ids: string[]) => {
    setSelectedDoctors((prev) => {
      const known = new Map(prev.map((d) => [d.user_id, d]));
      doctorOptions.forEach((d) => known.set(d.user_id, d));
      return ids.map((id) => known.get(id) ?? { user_id: id, name: id });
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    clearErrors();

    const locationIds = selectedLocations.map((l) => l.location_id);
    const doctorIds = selectedDoctors.map((d) => d.user_id);
    const dateOfBirth = buildDob(formData);

    try {
      if (modalMode === "add") {
        await saveUser({
          mode: "add",
          data: {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            gender: formData.gender,
            date_of_birth: dateOfBirth,
            role_id: Number(formData.role_id),
            location_ids: locationIds,
            reporting_doctor_ids: doctorIds,
          },
        });
      } else {
        if (!selectedUserId) {
          setSaveError("Missing user id for update.");
          return;
        }

        const add_location_ids = locationIds.filter(
          (id) => !originalLocationIds.includes(id),
        );
        const remove_location_ids = originalLocationIds.filter(
          (id) => !locationIds.includes(id),
        );
        const add_reporting_doctor_ids = doctorIds.filter(
          (id) => !originalDoctorIds.includes(id),
        );
        const remove_reporting_doctor_ids = originalDoctorIds.filter(
          (id) => !doctorIds.includes(id),
        );

        await saveUser({
          mode: "edit",
          userId: selectedUserId,
          data: {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            gender: formData.gender,
            date_of_birth: dateOfBirth,
            role_id: Number(formData.role_id),
            add_location_ids,
            remove_location_ids,
            add_reporting_doctor_ids,
            remove_reporting_doctor_ids,
          },
        });
      }

      showToast(
        modalMode === "add"
          ? "User created successfully"
          : "User updated successfully",
        "success",
      );
      closeModal();
      await refreshUsers();
    } catch (error) {
      // saveError toast handled via effect
    }
  };

  const refreshUsers = useCallback(
    async (targetPage = page) => {
      await fetchUsers({
        page: targetPage,
        limit,
        name: search,
        role_id: roleFilter ? Number(roleFilter) : "",
      });
    },
    [fetchUsers, page, limit, search, roleFilter],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.user_id);
      showToast("User deleted successfully", "success");
      setDeleteTarget(null);
      const nextPage = tableRows.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await refreshUsers(nextPage);
    } catch (error) {
      // error toast handled via effect
    }
  };

  const selectedLocationIds = selectedLocations.map((l) => l.location_id);
  const selectedDoctorIds = selectedDoctors.map((d) => d.user_id);

  const columns: TableColumn<UserRow>[] = [
    {
      key: "name",
      label: "User",
      render: (val: unknown, row) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
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
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "roleName",
      label: "Role",
      render: (v: unknown) => (
        <Badge variant={getRoleColor(v as string)}>{v as string}</Badge>
      ),
    },
    { key: "phone", label: "Phone" },
    {
      key: "gender",
      label: "Gender",
      render: (v: unknown) => {
        const g = (v as string) || "";
        return g ? g.charAt(0).toUpperCase() + g.slice(1) : "—";
      },
    },
    {
      key: "created_at",
      label: "Created",
      render: (v: unknown) => formatDate(v as string),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const subtitle = loading
    ? "Loading users..."
    : `${tableRows.length} of ${totalCount} user${totalCount !== 1 ? "s" : ""}`;

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage clinic staff accounts, roles, and permissions"
        actions={
          canCreateUsers ? (
            <Button icon={Plus} onClick={() => void openAddModal()}>
              Add User
            </Button>
          ) : null
        }
      />

      <Card>
        <div className="card-toolbar">
          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <SearchBar
              label="Search"
              value={search}
              onChange={(value) => {
                setPage(1);
                setSearch(value);
              }}
              placeholder="Search by name..."
            />
            <Select
              label="Role"
              value={roleFilter}
              onChange={(e) => {
                setPage(1);
                setRoleFilter(e.target.value);
              }}
              placeholder="All roles"
              options={roleSelectOptions}
            />
            <Select
              label="Page size"
              value={String(limit)}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
              options={[
                { value: "10", label: "10 per page" },
                { value: "25", label: "25 per page" },
                { value: "50", label: "50 per page" },
              ]}
            />
          </div>
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-muted)",
            }}
          >
            {subtitle}
          </span>
        </div>

        <Table<UserRow>
          columns={columns}
          data={tableRows}
          emptyMessage={loading ? "Loading users..." : "No users found"}
          renderActions={
            canUpdateUsers || canDeleteUsers
              ? (row) => (
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    {canUpdateUsers ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        title="Edit"
                        onClick={() => void openEditModal(row.user_id)}
                        disabled={loadingUserId === row.user_id}
                      />
                    ) : null}
                    {canDeleteUsers ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        title="Delete"
                        onClick={() => setDeleteTarget(row)}
                        disabled={deletingUserId === row.user_id}
                      />
                    ) : null}
                  </div>
                )
              : undefined
          }
        />

        <div className="card-toolbar">
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-muted)",
            }}
          >
            Page {page} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={modalMode === "add" ? "Add New User" : "Edit User"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving
                ? modalMode === "add"
                  ? "Creating..."
                  : "Saving..."
                : modalMode === "add"
                  ? "Create User"
                  : "Save Changes"}
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
            label="Full Name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            error={formErrors.name}
            disabled={saving}
          />
          <div className="modal-form-grid">
            <Input
              label="Email"
              type="email"
              placeholder="user@clinicare.com"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              error={formErrors.email}
              disabled={saving}
            />
            <Input
              label="Phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              error={formErrors.phone}
              disabled={saving}
            />
          </div>
          <DateOfBirthPicker
            label="Date of Birth"
            value={{
              year: formData.dobYear,
              month: formData.dobMonth,
              day: formData.dobDay,
            }}
            onChange={(dob) =>
              setFormData((prev) => ({
                ...prev,
                dobYear: dob.year,
                dobMonth: dob.month,
                dobDay: dob.day,
              }))
            }
            minYear={MIN_DOB_YEAR}
            maxYear={MAX_DOB_YEAR}
            error={formErrors.dob}
            disabled={saving}
          />
          <div className="modal-form-grid">
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, gender: e.target.value }))
              }
              placeholder="Select gender"
              options={GENDER_OPTIONS}
              error={formErrors.gender}
              disabled={saving}
            />
            <Select
              label="Role"
              value={formData.role_id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, role_id: e.target.value }))
              }
              placeholder="Select role"
              options={roleSelectOptions}
              error={formErrors.role_id}
              disabled={saving}
            />
          </div>
          <MultiSelectCheckbox
            label="Locations"
            placeholder="Select locations"
            options={locationPickerOptions}
            value={selectedLocationIds}
            onChange={handleLocationChange}
            onSearch={(s) => void fetchLocationOptions(s)}
            disabled={saving}
          />
          <MultiSelectCheckbox
            label="Reporting Doctors"
            placeholder="Select reporting doctors"
            options={doctorPickerOptions}
            value={selectedDoctorIds}
            onChange={handleDoctorChange}
            onSearch={setDoctorSearch}
            disabled={saving}
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete User"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deletingUserId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDelete()}
              disabled={deletingUserId !== null}
            >
              {deletingUserId !== null ? "Deleting..." : "Delete User"}
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default UserManagement;
