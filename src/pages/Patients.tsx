import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { PageHeader } from "../components/layout";
import {
  Card,
  Table,
  Button,
  Avatar,
  SearchBar,
  Modal,
  Input,
  Select,
  DateOfBirthPicker,
} from "../components/ui";
import type { TableColumn } from "../components/ui/Table";
import usePatients from "../hooks/usePatients";
import { getPatientId } from "../slices/PatientsSlice";
import { useToast } from "../context/ToastContext";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const MIN_DOB_YEAR = 1900;
const MAX_DOB_YEAR = new Date().getFullYear();

interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dobYear: string;
  dobMonth: string;
  dobDay: string;
}

const EMPTY_FORM: PatientFormData = {
  name: "",
  email: "",
  phone: "",
  gender: "",
  dobYear: "",
  dobMonth: "",
  dobDay: "",
};

interface PatientRow extends Record<string, unknown> {
  id: string;
  patient_id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  created_at: string;
}

const formatDate = (iso?: string): string =>
  iso ? new Date(iso).toLocaleDateString() : "—";

const buildDob = (parts: {
  dobYear: string;
  dobMonth: string;
  dobDay: string;
}): string =>
  parts.dobYear && parts.dobMonth && parts.dobDay
    ? `${parts.dobYear}-${parts.dobMonth}-${parts.dobDay}`
    : "";

const Patients = () => {
  const { showToast } = useToast();
  const {
    patients,
    totalCount,
    loading,
    error: loadError,
    loadingPatientId,
    saving,
    saveError,
    deletingPatientId,
    fetchPatients,
    fetchPatientById,
    savePatient,
    deletePatient,
    setError,
    setSaveError,
    clearErrors,
  } = usePatients();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState<PatientFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof PatientFormData | "dob", string>>
  >({});

  const [deleteTarget, setDeleteTarget] = useState<PatientRow | null>(null);

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
    const timeoutId = window.setTimeout(() => {
      void fetchPatients({ page, limit, name: search });
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchPatients, page, limit, search]);

  const refreshPatients = useCallback(
    async (targetPage = page) => {
      await fetchPatients({ page: targetPage, limit, name: search });
    },
    [fetchPatients, page, limit, search],
  );

  const tableRows = useMemo<PatientRow[]>(
    () =>
      patients.map((patient) => {
        const id = getPatientId(patient);
        return {
          id,
          patient_id: id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          gender: patient.gender,
          date_of_birth: patient.date_of_birth,
          created_at: patient.created_at ?? "",
        };
      }),
    [patients],
  );

  const validateForm = (): boolean => {
    const nextErrors: Partial<Record<keyof PatientFormData | "dob", string>> =
      {};
    if (!formData.name.trim()) nextErrors.name = "Name is required";
    if (!formData.email.trim()) nextErrors.email = "Email is required";
    if (!formData.phone.trim()) nextErrors.phone = "Phone is required";
    if (!formData.gender) nextErrors.gender = "Gender is required";
    if (!formData.dobYear || !formData.dobMonth || !formData.dobDay)
      nextErrors.dob = "Date of birth is required";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedPatientId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    clearErrors();
    setModalOpen(true);
  };

  const openEditModal = async (patientId: string) => {
    clearErrors();
    setFormErrors({});

    try {
      const patient = await fetchPatientById(patientId);
      if (!patient) {
        setError("Unable to open patient details. Please try again.");
        return;
      }

      const [dobYear = "", dobMonth = "", dobDay = ""] = (
        patient.date_of_birth || ""
      ).split("-");

      setModalMode("edit");
      setSelectedPatientId(getPatientId(patient));
      setFormData({
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        gender: patient.gender,
        dobYear,
        dobMonth,
        dobDay,
      });
      setModalOpen(true);
    } catch (error) {
      setError("Unable to open patient details. Please try again.");
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedPatientId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    clearErrors();
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    clearErrors();

    const data = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      gender: formData.gender,
      date_of_birth: buildDob(formData),
    };

    try {
      if (modalMode === "add") {
        await savePatient({ mode: "add", data });
      } else {
        if (!selectedPatientId) {
          setSaveError("Missing patient id for update.");
          return;
        }
        await savePatient({ mode: "edit", patientId: selectedPatientId, data });
      }

      showToast(
        modalMode === "add"
          ? "Patient created successfully"
          : "Patient updated successfully",
        "success",
      );
      closeModal();
      await refreshPatients();
    } catch (error) {
      // saveError toast handled via effect
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePatient(deleteTarget.patient_id);
      showToast("Patient deleted successfully", "success");
      setDeleteTarget(null);
      const nextPage = tableRows.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await refreshPatients(nextPage);
    } catch (error) {
      // error toast handled via effect
    }
  };

  const columns: TableColumn<PatientRow>[] = [
    {
      key: "name",
      label: "Patient",
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
      key: "date_of_birth",
      label: "Date of Birth",
      render: (v: unknown) => formatDate(v as string),
    },
    {
      key: "created_at",
      label: "Created",
      render: (v: unknown) => formatDate(v as string),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const subtitle = loading
    ? "Loading patients..."
    : `${tableRows.length} of ${totalCount} patient${totalCount !== 1 ? "s" : ""}`;

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Manage patient directory and details"
        actions={
          <Button icon={Plus} onClick={openAddModal}>
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
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
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

        <Table<PatientRow>
          columns={columns}
          data={tableRows}
          emptyMessage={loading ? "Loading patients..." : "No patients found"}
          renderActions={(row) => (
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                variant="ghost"
                size="sm"
                icon={Edit2}
                title="Edit"
                onClick={() => void openEditModal(row.patient_id)}
                disabled={loadingPatientId === row.patient_id}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                title="Delete"
                onClick={() => setDeleteTarget(row)}
                disabled={deletingPatientId === row.patient_id}
              />
            </div>
          )}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "var(--space-4) var(--space-5)",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
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
        title={modalMode === "add" ? "Add New Patient" : "Edit Patient"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving
                ? modalMode === "add"
                  ? "Saving..."
                  : "Saving..."
                : modalMode === "add"
                  ? "Save Patient"
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
            placeholder="Patient full name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            error={formErrors.name}
            disabled={saving}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Input
              label="Email"
              type="email"
              placeholder="patient@example.com"
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
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Patient"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deletingPatientId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDelete()}
              disabled={deletingPatientId !== null}
            >
              {deletingPatientId !== null ? "Deleting..." : "Delete Patient"}
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          Are you sure you want to delete{" "}
          <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Patients;
