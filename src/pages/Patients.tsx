import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  Upload,
  X,
  Download,
  Camera,
} from "lucide-react";
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
import usePatientDiagnostics from "../hooks/usePatientDiagnostics";
import { getPatientId } from "../slices/PatientsSlice";
import type { Diagnostic } from "../slices/PatientDiagnosticsSlice";
import { useAuth } from "../context/AuthContext";
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

const formatDateTime = (iso?: string): string =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const buildDob = (parts: {
  dobYear: string;
  dobMonth: string;
  dobDay: string;
}): string =>
  parts.dobYear && parts.dobMonth && parts.dobDay
    ? `${parts.dobYear}-${parts.dobMonth}-${parts.dobDay}`
    : "";

const Patients = () => {
  const { can } = useAuth();
  const canCreate = can("create", "Patients");
  const canUpdate = can("update", "Patients");
  const canDelete = can("delete", "Patients");
  const canReadDiag = can("read", "PatientDiagnostics");
  const canCreateDiag = can("create", "PatientDiagnostics");
  const canUpdateDiag = can("update", "PatientDiagnostics");
  const canDeleteDiag = can("delete", "PatientDiagnostics");
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

  const {
    diagnostics,
    totalCount: diagTotalCount,
    loading: diagLoading,
    error: diagError,
    saving: diagSaving,
    saveError: diagSaveError,
    deletingId: diagDeletingId,
    fetchDiagnostics,
    createDiagnostic,
    updateDiagnostic,
    deleteDiagnostic,
    setError: setDiagError,
    setSaveError: setDiagSaveError,
    reset: resetDiagnostics,
  } = usePatientDiagnostics();

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

  // Diagnostics state
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [diagPatient, setDiagPatient] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [diagPage, setDiagPage] = useState(1);
  const [diagFormOpen, setDiagFormOpen] = useState(false);
  const [diagFormMode, setDiagFormMode] = useState<"add" | "edit">("add");
  const [diagEditId, setDiagEditId] = useState<string | null>(null);
  const [diagDescription, setDiagDescription] = useState("");
  const [diagFile, setDiagFile] = useState<File | null>(null);
  const [diagDescError, setDiagDescError] = useState("");
  const [diagDeleteTarget, setDiagDeleteTarget] = useState<Diagnostic | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      showToast("Unable to access camera. Please check permissions.", "error");
    }
  }, [showToast]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setDiagFile(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      stopCamera();
    }, "image/jpeg", 0.9);
  }, [stopCamera]);

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
    if (!diagError) return;
    showToast(diagError, "error");
    setDiagError("");
  }, [diagError]);

  useEffect(() => {
    if (!diagSaveError) return;
    showToast(diagSaveError, "error");
    setDiagSaveError("");
  }, [diagSaveError]);

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

  // --- Diagnostics handlers ---

  const openDiagnostics = (patientId: string, patientName: string) => {
    setDiagPatient({ id: patientId, name: patientName });
    setDiagPage(1);
    setDiagModalOpen(true);
    void fetchDiagnostics(patientId, 1, 20);
  };

  const closeDiagnostics = () => {
    stopCamera();
    setDiagModalOpen(false);
    setDiagPatient(null);
    setDiagFormOpen(false);
    setDiagFormMode("add");
    setDiagEditId(null);
    setDiagDescription("");
    setDiagFile(null);
    setDiagDescError("");
    setDiagDeleteTarget(null);
    resetDiagnostics();
  };

  const openDiagForm = (mode: "add" | "edit", diag?: Diagnostic) => {
    setDiagFormMode(mode);
    if (mode === "edit" && diag) {
      setDiagEditId(diag.diagnostic_id);
      setDiagDescription(diag.description);
    } else {
      setDiagEditId(null);
      setDiagDescription("");
    }
    setDiagFile(null);
    setDiagDescError("");
    setDiagFormOpen(true);
  };

  const closeDiagForm = () => {
    if (diagSaving) return;
    stopCamera();
    setDiagFormOpen(false);
    setDiagEditId(null);
    setDiagDescription("");
    setDiagFile(null);
    setDiagDescError("");
  };

  const handleDiagSubmit = async () => {
    if (!diagDescription.trim()) {
      setDiagDescError("Description is required");
      return;
    }
    setDiagDescError("");

    try {
      if (diagFormMode === "add" && diagPatient) {
        await createDiagnostic(
          diagPatient.id,
          diagDescription.trim(),
          diagFile ?? undefined,
        );
        showToast("Diagnostic created successfully", "success");
      } else if (diagFormMode === "edit" && diagEditId) {
        await updateDiagnostic(
          diagEditId,
          diagDescription.trim(),
          diagFile ?? undefined,
        );
        showToast("Diagnostic updated successfully", "success");
      }
      closeDiagForm();
      if (diagPatient) {
        await fetchDiagnostics(diagPatient.id, diagPage, 20);
      }
    } catch {
      // error toast handled via effect
    }
  };

  const handleDiagDelete = async () => {
    if (!diagDeleteTarget) return;
    try {
      await deleteDiagnostic(diagDeleteTarget.diagnostic_id);
      showToast("Diagnostic deleted successfully", "success");
      setDiagDeleteTarget(null);
      if (diagPatient) {
        const nextDiagPage =
          diagnostics.length === 1 && diagPage > 1 ? diagPage - 1 : diagPage;
        setDiagPage(nextDiagPage);
        await fetchDiagnostics(diagPatient.id, nextDiagPage, 20);
      }
    } catch {
      // error toast handled via effect
    }
  };

  const handleDiagPageChange = (newPage: number) => {
    setDiagPage(newPage);
    if (diagPatient) {
      void fetchDiagnostics(diagPatient.id, newPage, 20);
    }
  };

  const diagTotalPages = Math.max(1, Math.ceil(diagTotalCount / 20));

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
          canCreate ? (
            <Button icon={Plus} onClick={openAddModal}>
              Add Patient
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
          renderActions={
            canUpdate || canDelete || canReadDiag
              ? (row) => (
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    {canReadDiag ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={FileText}
                        title="Diagnostics"
                        onClick={() => openDiagnostics(row.patient_id, row.name)}
                      />
                    ) : null}
                    {canUpdate ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        title="Edit"
                        onClick={() => void openEditModal(row.patient_id)}
                        disabled={loadingPatientId === row.patient_id}
                      />
                    ) : null}
                    {canDelete ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        title="Delete"
                        onClick={() => setDeleteTarget(row)}
                        disabled={deletingPatientId === row.patient_id}
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

      {/* Add/Edit Patient Modal */}
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
                ? "Saving..."
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
          <div className="modal-form-grid">
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

      {/* Delete Patient Confirmation */}
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

      {/* Diagnostics List Modal */}
      <Modal
        open={diagModalOpen && !diagFormOpen && !diagDeleteTarget}
        onClose={closeDiagnostics}
        title={`Diagnostics — ${diagPatient?.name ?? ""}`}
        size="lg"
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--text-muted)",
              }}
            >
              {diagLoading
                ? "Loading..."
                : `${diagnostics.length} of ${diagTotalCount} record${diagTotalCount !== 1 ? "s" : ""}`}
            </span>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDiagPageChange(Math.max(1, diagPage - 1))}
                disabled={diagPage <= 1 || diagLoading}
              >
                Previous
              </Button>
              <span
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 var(--space-2)",
                }}
              >
                {diagPage} / {diagTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDiagPageChange(Math.min(diagTotalPages, diagPage + 1))
                }
                disabled={diagPage >= diagTotalPages || diagLoading}
              >
                Next
              </Button>
            </div>
          </div>
        }
      >
        {canCreateDiag ? (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "var(--space-3)",
            }}
          >
            <Button
              icon={Plus}
              size="sm"
              onClick={() => openDiagForm("add")}
            >
              Add Diagnostic
            </Button>
          </div>
        ) : null}

        {diagnostics.length === 0 && !diagLoading ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: "var(--space-6) 0",
            }}
          >
            No diagnostics found for this patient.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
            }}
          >
            {diagnostics.map((diag) => (
              <div
                key={diag.diagnostic_id}
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  display: "flex",
                  gap: "var(--space-4)",
                  alignItems: "flex-start",
                }}
              >
                {diag.media_url && (
                  <div style={{ flexShrink: 0 }}>
                    {diag.media_type?.startsWith("image") ? (
                      <img
                        src={diag.media_url}
                        alt="Diagnostic"
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-color)",
                        }}
                      />
                    ) : (
                      <a
                        href={diag.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 80,
                          height: 80,
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-secondary)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <Download size={24} />
                      </a>
                    )}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, marginBottom: "var(--space-2)" }}>
                    {diag.description}
                  </p>
                  <div
                    style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--text-muted)",
                      display: "flex",
                      gap: "var(--space-3)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>By: {diag.created_by?.name ?? "Unknown"}</span>
                    <span>{formatDateTime(diag.created_at)}</span>
                    {diag.media_type && <span>{diag.media_type}</span>}
                  </div>
                </div>
                {canUpdateDiag || canDeleteDiag ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-1)",
                      flexShrink: 0,
                    }}
                  >
                    {canUpdateDiag ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        title="Edit"
                        onClick={() => openDiagForm("edit", diag)}
                      />
                    ) : null}
                    {canDeleteDiag ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        title="Delete"
                        onClick={() => setDiagDeleteTarget(diag)}
                        disabled={diagDeletingId === diag.diagnostic_id}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Add/Edit Diagnostic Modal */}
      <Modal
        open={diagModalOpen && diagFormOpen}
        onClose={closeDiagForm}
        title={
          diagFormMode === "add" ? "Add Diagnostic" : "Edit Diagnostic"
        }
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeDiagForm}
              disabled={diagSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleDiagSubmit()}
              disabled={diagSaving}
            >
              {diagSaving
                ? "Saving..."
                : diagFormMode === "add"
                  ? "Save Diagnostic"
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
          <div>
            <label
              style={{
                display: "block",
                fontSize: "var(--font-size-sm)",
                fontWeight: 500,
                marginBottom: "var(--space-1)",
                color: "var(--text-primary)",
              }}
            >
              Description
            </label>
            <textarea
              value={diagDescription}
              onChange={(e) => setDiagDescription(e.target.value)}
              placeholder="Enter diagnostic description..."
              disabled={diagSaving}
              rows={4}
              style={{
                width: "100%",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${diagDescError ? "var(--color-error)" : "var(--border-color)"}`,
                fontFamily: "inherit",
                fontSize: "var(--font-size-sm)",
                resize: "vertical",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                boxSizing: "border-box",
              }}
            />
            {diagDescError && (
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-error)",
                  marginTop: "var(--space-1)",
                  display: "block",
                }}
              >
                {diagDescError}
              </span>
            )}
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "var(--font-size-sm)",
                fontWeight: 500,
                marginBottom: "var(--space-1)",
                color: "var(--text-primary)",
              }}
            >
              Attachment (optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setDiagFile(e.target.files?.[0] ?? null)}
              disabled={diagSaving}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <Button
                variant="outline"
                size="sm"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                disabled={diagSaving || cameraOpen}
              >
                Choose File
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Camera}
                onClick={() => void startCamera()}
                disabled={diagSaving || cameraOpen}
              >
                Take Photo
              </Button>
              {diagFile && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-1)",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>{diagFile.name}</span>
                  <button
                    onClick={() => {
                      setDiagFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                      color: "var(--text-muted)",
                      display: "flex",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {cameraOpen && (
              <div
                style={{
                  marginTop: "var(--space-3)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  background: "#000",
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    maxHeight: 300,
                    display: "block",
                    objectFit: "contain",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "var(--space-2)",
                    padding: "var(--space-3)",
                    background: "var(--bg-primary)",
                  }}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Camera}
                    onClick={capturePhoto}
                  >
                    Capture
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={stopCamera}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        </div>
      </Modal>

      {/* Delete Diagnostic Confirmation */}
      <Modal
        open={diagModalOpen && Boolean(diagDeleteTarget)}
        onClose={() => setDiagDeleteTarget(null)}
        title="Delete Diagnostic"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDiagDeleteTarget(null)}
              disabled={diagDeletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDiagDelete()}
              disabled={diagDeletingId !== null}
            >
              {diagDeletingId !== null ? "Deleting..." : "Delete Diagnostic"}
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          Are you sure you want to delete this diagnostic record? This action
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Patients;
