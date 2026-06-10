import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useDoctorRoutines from "../hooks/useDoctorRoutines";
import { DoctorRoutine } from "../slices/DoctorRoutinesSlice";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  MultiSelectCheckbox,
  Select,
  Table,
} from "../components/ui";
import { PageHeader } from "../components/layout";
import useLocations from "../hooks/useLocations";
import { Edit2, Plus } from "lucide-react";
import { givePostfixForNumber } from "../utils/helpers";

interface DoctorRoutineRow extends Record<string, unknown>, DoctorRoutine {
  id: string;
}

interface DoctorRoutineFormData {
  doctor_id: string;
  index?: number;
  location_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DoctorRoutines = (props: { doctorId?: string }) => {
  const { can, user } = useAuth();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [doctorId, setDoctorId] = useState<string | undefined>(
    props.doctorId ? props.doctorId : user?.id,
  );
  const [index, setIndex] = useState<number | undefined>(undefined);
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined);
  const EMPTY_FORM: DoctorRoutineFormData = {
    doctor_id: doctorId ?? "",
    index: undefined,
    location_id: "",
    day_of_week: 0,
    start_time: "",
    end_time: "",
  };

  const [formData, setFormData] = useState<DoctorRoutineFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<DoctorRoutineFormData>>(
    {},
  );

  const [locationSearch, setLocationSearch] = useState("");
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    null,
  );

  const {
    doctorRoutines,
    totalCount,
    loading,
    error: loadError,
    saving,
    saveError,
    loadingRoutineId,
    saveDoctorRoutine,
    fetchDoctorRoutines,
    fetchDoctorRoutineById,

    clearErrors,
    setSaveError,
    setError,
  } = useDoctorRoutines();

  const {
    locations,
    fetchLocations,
    loading: loadingLocations,
    error: loadLocationsError,
    clearErrors: clearLocationErrors,
    setError: setLocationError,
  } = useLocations();

  const { showToast } = useToast();

  const canReadDoctorRoutines = can("read", "DoctorRoutines");
  const canCreateDoctorRoutines = can("create", "DoctorRoutines");
  const canUpdateDoctorRoutines = can("update", "DoctorRoutines");
  const canReadLocations = can("read", "Locations");

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
    if (!canReadDoctorRoutines) return;
    console.log("Locations Ids : ", locationIds);
    fetchDoctorRoutines(page, limit, doctorId, index, dayOfWeek, locationIds);
  }, [
    canReadDoctorRoutines,
    page,
    limit,
    doctorId,
    index,
    dayOfWeek,
    locationIds,
  ]);

  useEffect(() => {
    if (!canReadLocations) return;
    const timeoutId = window.setTimeout(() => {
      void fetchLocations(locationSearch, 1, 10);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [canReadLocations, locationSearch]);

  const tableRows = useMemo<DoctorRoutineRow[]>(
    () =>
      doctorRoutines.map((routine: DoctorRoutine) => ({
        ...routine,
        id: routine.routine_id,
      })),
    [doctorRoutines],
  );

  const validateForm = (): boolean => {
    const nextErrors: Partial<DoctorRoutineFormData> = {};

    if (!formData.doctor_id.trim())
      nextErrors.doctor_id = "Doctor ID is required";
    if (!formData.location_id.trim())
      nextErrors.location_id = "Location ID is required";
    if (!formData.start_time.trim())
      nextErrors.start_time = "Start time is required";
    if (!formData.end_time.trim()) nextErrors.end_time = "End time is required";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openAddModal = () => {
    if (!canCreateDoctorRoutines) return;

    setModalMode("add");
    setSelectedRoutineId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    clearErrors();
    setModalOpen(true);
  };

  const openEditModal = async (doctorId: string, routineId: string) => {
    if (!canUpdateDoctorRoutines) return;

    clearErrors();
    setFormErrors({});

    try {
      const routine = await fetchDoctorRoutineById(routineId, doctorId);
      if (!routine.data) {
        setError("Unable to open routine details. Please try again.");
        return;
      }

      setModalMode("edit");
      setSelectedRoutineId(routine.data.routine_id);
      setFormData({
        doctor_id: routine.data.doctor_id,
        location_id: routine.data.location_id,
        index: routine.data.index === null ? undefined : routine.data.index,
        day_of_week: routine.data.day_of_week,
        start_time: routine.data.start_time,
        end_time: routine.data.end_time,
      });
      setModalOpen(true);
    } catch (error) {
      setError("Unable to open routine details. Please try again.");
    }
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    clearErrors();
    setSelectedRoutineId(null);
  };

  const handleSubmit = async () => {
    console.log("Submitting form with data: ", formData);
    console.log("Selected Routine ID: ", selectedRoutineId);
    if (modalMode === "add" && !canCreateDoctorRoutines) return;
    if (modalMode === "edit" && !canUpdateDoctorRoutines) return;
    if (!validateForm()) return;

    clearErrors();

    try {
      if (modalMode === "add") {
        const start_time = formData.start_time.trim();
        const end_time = formData.end_time.trim();
        if (start_time >= end_time) {
          setFormErrors({
            start_time: "Start time must be before end time",
            end_time: "End time must be after start time",
          });
          return;
        }
        await saveDoctorRoutine({
          mode: "add",
          data: {
            doctor_id: formData.doctor_id.trim(),
            index: formData.index,
            location_id: formData.location_id.trim(),
            day_of_week: formData.day_of_week,
            start_time: formData.start_time.trim() + ":00",
            end_time: formData.end_time.trim() + ":00",
          },
        });
      } else {
        if (!selectedRoutineId) {
          setSaveError("Missing routine id for update.");
          return;
        }
        let start_time = formData.start_time.trim();
        let end_time = formData.end_time.trim();
        start_time =
          start_time.split(":").length === 2 ? start_time + ":00" : start_time;
        end_time =
          end_time.split(":").length === 2 ? end_time + ":00" : end_time;
        if (start_time >= end_time) {
          setFormErrors({
            start_time: "Start time must be before end time",
            end_time: "End time must be after start time",
          });
          return;
        }

        await saveDoctorRoutine({
          mode: "edit",
          data: {
            routine_id: selectedRoutineId,
            doctor_id: formData.doctor_id.trim(),
            index: formData.index,
            location_id: formData.location_id.trim(),
            day_of_week: formData.day_of_week,
            start_time: start_time,
            end_time: end_time,
          },
        });
      }

      closeModal();
      await fetchDoctorRoutines(
        page,
        limit,
        doctorId,
        index,
        dayOfWeek,
        locationIds,
      );
    } catch (error) {
      setSaveError(
        "Unable to save doctor routine. Please check values and try again.",
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "location",
        label: "Location Name",
        render: (value: unknown) => (value as any)?.name ?? "N/A",
      },
      {
        key: "day",
        label: "Day",
        render: (value: unknown, row: DoctorRoutineRow) =>
          `${row.index ? row.index + givePostfixForNumber(row.index) : ""} ${value}`,
      },
      { key: "start_time", label: "Start Time" },
      { key: "end_time", label: "End Time" },
      {
        key: "is_active",
        label: "Status",
        render: (value: unknown) => (
          <Badge variant={value ? "success" : "default"}>
            {value ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      { key: "created_at", label: "Created At" },
    ],
    [],
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const subtitle = loading
    ? "Loading Doctor Routines..."
    : `${tableRows.length} of ${totalCount} routine${totalCount !== 1 ? "s" : ""}`;
  return (
    <div>
      <PageHeader
        title="Doctor Routines"
        subtitle="Manage doctor routines for scheduling and visits"
        actions={
          canCreateDoctorRoutines ? (
            <Button icon={Plus} onClick={openAddModal}>
              Add Doctor Routine
            </Button>
          ) : null
        }
      />
      <Card>
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
          }}
        >
          {/* Filter bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--space-4)",
              flexWrap: "wrap",
              background: "var(--color-gray-50)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-3) var(--space-4)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "var(--space-3)",
                flexWrap: "wrap",
              }}
            >
              {/* Page size */}
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

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 32,
                  background: "var(--border-color-strong)",
                  flexShrink: 0,
                }}
              />

              {/* Nth day of month */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "var(--space-1)",
                }}
              >
                <Select
                  label="Nth day of month"
                  value={String(index ?? "")}
                  onChange={(e) => {
                    setPage(1);
                    setIndex(Number(e.target.value));
                  }}
                  style={
                    index !== undefined
                      ? {
                          borderColor: "var(--color-primary-400)",
                          boxShadow: "0 0 0 3px var(--color-primary-50)",
                        }
                      : {}
                  }
                  options={[
                    { value: "1", label: "1st" },
                    { value: "2", label: "2nd" },
                    { value: "3", label: "3rd" },
                    { value: "4", label: "4th" },
                    { value: "5", label: "5th" },
                    { value: "6", label: "6th" },
                  ]}
                />
                {index !== undefined ? (
                  <button
                    onClick={() => {
                      setPage(1);
                      setIndex(undefined);
                    }}
                    title="Clear filter"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "none",
                      background: "var(--color-gray-200)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: 13,
                      flexShrink: 0,
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    ✕
                  </button>
                ) : (
                  <div style={{ width: 22, flexShrink: 0 }} />
                )}
              </div>

              {/* Day of week */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "var(--space-1)",
                }}
              >
                <Select
                  label="Day of week"
                  value={String(dayOfWeek ?? "")}
                  onChange={(e) => {
                    setPage(1);
                    setDayOfWeek(Number(e.target.value));
                  }}
                  style={
                    dayOfWeek !== undefined
                      ? {
                          borderColor: "var(--color-primary-400)",
                          boxShadow: "0 0 0 3px var(--color-primary-50)",
                        }
                      : {}
                  }
                  options={[
                    { value: "0", label: "Sunday" },
                    { value: "1", label: "Monday" },
                    { value: "2", label: "Tuesday" },
                    { value: "3", label: "Wednesday" },
                    { value: "4", label: "Thursday" },
                    { value: "5", label: "Friday" },
                    { value: "6", label: "Saturday" },
                  ]}
                />
                {dayOfWeek !== undefined ? (
                  <button
                    onClick={() => {
                      setPage(1);
                      setDayOfWeek(undefined);
                    }}
                    title="Clear filter"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "none",
                      background: "var(--color-gray-200)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: 13,
                      flexShrink: 0,
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    ✕
                  </button>
                ) : (
                  <div style={{ width: 22, flexShrink: 0 }} />
                )}
              </div>

              {/* Location search multiselect */}
              <MultiSelectCheckbox
                label="Location Search"
                value={locationIds}
                onChange={(selectedValues) => {
                  setPage(1);
                  setLocationIds(selectedValues);
                }}
                onSearch={setLocationSearch}
                options={locations.map((loc) => ({
                  value: loc.location_id,
                  label: loc.name,
                }))}
              />

              {/* Clear all */}
              {(index !== undefined ||
                dayOfWeek !== undefined ||
                locationIds.length > 0) && (
                <button
                  onClick={() => {
                    setPage(1);
                    setIndex(undefined);
                    setDayOfWeek(undefined);
                    setLocationIds([]);
                  }}
                  style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-primary-600)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 var(--space-1)",
                    marginBottom: "var(--space-2)",
                    fontWeight: "var(--font-weight-medium)",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            <span
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </span>
          </div>
        </div>

        <Table<DoctorRoutineRow>
          columns={columns}
          data={tableRows}
          emptyMessage={
            loading ? "Loading doctor routines..." : "No doctor routines found"
          }
          renderActions={
            canUpdateDoctorRoutines
              ? (row) => (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() =>
                      void openEditModal(row.doctor_id, row.routine_id)
                    }
                    disabled={loadingRoutineId === row.routine_id}
                    title="Edit"
                  />
                )
              : undefined
          }
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
        title={
          modalMode === "add" ? "Add Doctor Routine" : "Edit Doctor Routine"
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving
                ? modalMode === "add"
                  ? "Adding..."
                  : "Saving..."
                : modalMode === "add"
                  ? "Add Location"
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Select
              label="Index (Nth day of month)"
              placeholder="Enter index example: 1 for 1st sunday"
              value={formData.index?.toString()}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  index: parseInt(e.target.value),
                }));
                console.log("Selected index: ", e.target.value);
              }}
              error={formErrors.index?.toString()}
              disabled={saving}
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "5", label: "5" },
                { value: "6", label: "6" },
                { value: "7", label: "7" },
              ]}
            />
            <Select
              label="Day of Week"
              value={formData.day_of_week?.toString()}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  day_of_week: parseInt(e.target.value),
                }));
              }}
              error={formErrors.day_of_week?.toString()}
              disabled={saving}
              options={[
                { value: "0", label: "Sunday" },
                { value: "1", label: "Monday" },
                { value: "2", label: "Tuesday" },
                { value: "3", label: "Wednesday" },
                { value: "4", label: "Thursday" },
                { value: "5", label: "Friday" },
                { value: "6", label: "Saturday" },
              ]}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Input
              label="Start Time"
              value={formData.start_time}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, start_time: e.target.value }))
              }
              type="time"
              error={formErrors.start_time}
              disabled={saving}
            />
            <Input
              label="End Time"
              placeholder="e.g. 18:00"
              value={formData.end_time}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, end_time: e.target.value }))
              }
              type="time"
              error={formErrors.end_time}
              disabled={saving}
            />
          </div>
          <Select
            label="Location"
            value={formData.location_id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                location_id: e.target.value,
              }))
            }
            onSearch={(search) => {
              setLocationSearch(search);
            }}
            options={locations.map((loc) => ({
              value: loc.location_id,
              label: loc.name,
            }))}
            error={formErrors.location_id}
            disabled={saving}
          />

          {/* {modalMode === "edit" ? (
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as LocationStatus,
                }))
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              disabled={saving}
            />
          ) : null} */}
        </div>
      </Modal>
    </div>
  );
};

export default DoctorRoutines;
