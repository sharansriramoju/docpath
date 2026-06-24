import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Ban,
  FileText,
  Clock,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import { PageHeader } from "../components/layout";
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  DateOfBirthPicker,
} from "../components/ui";
import useAppointments from "../hooks/useAppointments";
import usePatients from "../hooks/usePatients";
import type {
  Appointment,
  AppointmentStatus,
  OverviewTotal,
} from "../slices/AppointmentsSlice";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Appointments.css";

type BadgeVariant = "default" | "primary" | "danger" | "success" | "warning";

const STATUS_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
  scheduled: "warning",
  completed: "success",
  cancelled: "danger",
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const HOUR_HEIGHT = 56;
const MAX_CHIPS = 3;

const toISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const formatTime = (t?: string | null): string => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${ampm}`;
};

const toTimeInput = (t?: string | null): string => (t ? t.slice(0, 5) : "");

// Drag-to-create snap granularity (minutes).
const SNAP_MIN = 15;
const minToHHMM = (m: number): string =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(
    2,
    "0",
  )}`;

const timeToMin = (t?: string | null): number => {
  if (!t) return 0;
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
};

const formatLongDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const dayTotalStatus = (t: OverviewTotal): AppointmentStatus =>
  t.pending > 0 ? "scheduled" : t.completed > 0 ? "completed" : "cancelled";

const TODAY = toISO(new Date());

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

interface QuickPatientForm {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dobYear: string;
  dobMonth: string;
  dobDay: string;
}

const EMPTY_PATIENT_FORM: QuickPatientForm = {
  name: "",
  email: "",
  phone: "",
  gender: "",
  dobYear: "",
  dobMonth: "",
  dobDay: "",
};

interface CreateForm {
  patient_id: string;
  doctor_id: string;
  location_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

const EMPTY_CREATE: CreateForm = {
  patient_id: "",
  doctor_id: "",
  location_id: "",
  date: TODAY,
  start_time: "",
  end_time: "",
  reason: "",
};

interface BlockLayout {
  appt: Appointment;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
}

const layoutDay = (
  appts: Appointment[],
  rangeStartHour: number,
): BlockLayout[] => {
  const sorted = [...appts].sort((a, b) =>
    a.start_time.localeCompare(b.start_time),
  );
  const clusters: Appointment[][] = [];
  let current: Appointment[] = [];
  let curMaxEnd = -1;
  for (const a of sorted) {
    const s = timeToMin(a.start_time);
    if (current.length && s >= curMaxEnd) {
      clusters.push(current);
      current = [];
      curMaxEnd = -1;
    }
    current.push(a);
    curMaxEnd = Math.max(curMaxEnd, timeToMin(a.end_time));
  }
  if (current.length) clusters.push(current);

  const blocks: BlockLayout[] = [];
  for (const cluster of clusters) {
    const colEnds: number[] = [];
    const colOf = new Map<string, number>();
    for (const a of cluster) {
      const s = timeToMin(a.start_time);
      let placed = -1;
      for (let c = 0; c < colEnds.length; c++) {
        if (s >= colEnds[c]) {
          placed = c;
          break;
        }
      }
      if (placed === -1) {
        placed = colEnds.length;
        colEnds.push(0);
      }
      colEnds[placed] = timeToMin(a.end_time);
      colOf.set(a.appointment_id, placed);
    }
    const cols = colEnds.length;
    for (const a of cluster) {
      const s = timeToMin(a.start_time);
      const e = timeToMin(a.end_time);
      const col = colOf.get(a.appointment_id) ?? 0;
      blocks.push({
        appt: a,
        top: ((s - rangeStartHour * 60) / 60) * HOUR_HEIGHT,
        height: Math.max(26, ((e - s) / 60) * HOUR_HEIGHT),
        leftPct: (col / cols) * 100,
        widthPct: 100 / cols,
      });
    }
  }
  return blocks;
};

const Appointments = () => {
  const { user, can } = useAuth();
  const canCreateAppt = can("create", "Appointments");
  const canUpdateAppt = can("update", "Appointments");
  const canDeleteAppt = can("delete", "Appointments");
  const { showToast } = useToast();
  const isDoctor = (user?.role || "").toLowerCase().includes("doctor");
  const {
    saving: patientSaving,
    savePatient,
  } = usePatients();

  const {
    appointments,
    loading,
    error,
    monthOverview,
    monthOverviewLoading,
    reportingDoctors,
    saving,
    saveError,
    actioningId,
    doctorOptions,
    patientOptions,
    locationOptions,
    fetchMonthOverview,
    fetchReportingDoctors,
    fetchDay,
    createAppointment,
    rescheduleAppointment,
    cancelAppointment,
    fetchNotes,
    updateNotes,
    fetchDoctorOptions,
    fetchPatientOptions,
    fetchLocationOptions,
    setError,
    setSaveError,
    clearErrors,
  } = useAppointments();

  const [doctorId, setDoctorId] = useState("");

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-11

  const [mode, setMode] = useState<"month" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);

  // Drag-to-create selection on the day timeline (pixel offsets within layer)
  const [drag, setDrag] = useState<{ startY: number; curY: number } | null>(
    null,
  );
  const eventsLayerRef = useRef<HTMLDivElement | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState<
    Partial<Record<keyof CreateForm, string>>
  >({});
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(
    null,
  );
  const [rescheduleForm, setRescheduleForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
  });
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [notesTarget, setNotesTarget] = useState<Appointment | null>(null);
  const [notesForm, setNotesForm] = useState({
    reason: "",
    doctor_notes: "",
    prescription: "",
  });

  // Quick-create patient (from within the appointment create modal)
  const [quickPatientOpen, setQuickPatientOpen] = useState(false);
  const [quickPatientForm, setQuickPatientForm] =
    useState<QuickPatientForm>(EMPTY_PATIENT_FORM);
  const [quickPatientErrors, setQuickPatientErrors] = useState<
    Partial<Record<keyof QuickPatientForm | "dob", string>>
  >({});

  // toasts
  useEffect(() => {
    if (!error) return;
    showToast(error, "error");
    setError("");
  }, [error]);

  useEffect(() => {
    if (!saveError) return;
    showToast(saveError, "error");
    setSaveError("");
  }, [saveError]);

  // Initial loads
  useEffect(() => {
    if (user?.id) void fetchReportingDoctors(user.id);
    void fetchDoctorOptions();
    void fetchLocationOptions();
  }, [user?.id, fetchReportingDoctors, fetchDoctorOptions, fetchLocationOptions]);

  // Doctors the viewer is allowed to see
  const allowedDoctors = useMemo(() => {
    const list: { user_id: string; name: string }[] = [];
    if (isDoctor && user?.id) {
      list.push({ user_id: user.id, name: `${user.name ?? "Me"} (You)` });
    }
    reportingDoctors.forEach((d) => list.push(d));
    // dedupe by id
    const seen = new Set<string>();
    return list.filter((d) =>
      seen.has(d.user_id) ? false : (seen.add(d.user_id), true),
    );
  }, [isDoctor, user, reportingDoctors]);

  // Default selected doctor per role
  useEffect(() => {
    if (doctorId) return;
    if (isDoctor && user?.id) {
      setDoctorId(user.id);
    } else if (!isDoctor && reportingDoctors.length > 0) {
      setDoctorId(reportingDoctors[0].user_id);
    }
  }, [doctorId, isDoctor, user?.id, reportingDoctors]);

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  // Load the month overview whenever the doctor or month changes
  useEffect(() => {
    if (!doctorId) return;
    void fetchMonthOverview({ month: monthKey, doctor_id: doctorId });
  }, [doctorId, monthKey, fetchMonthOverview]);

  const refreshMonth = useCallback(() => {
    if (!doctorId) return;
    void fetchMonthOverview({ month: monthKey, doctor_id: doctorId });
  }, [fetchMonthOverview, doctorId, monthKey]);

  const loadDay = useCallback(
    (date: string) => {
      const totals = monthOverview?.[date] ?? [];
      void fetchDay({
        date,
        doctor_id: doctorId,
        location_ids: totals.map((t) => t.location_id),
      });
    },
    [fetchDay, doctorId, monthOverview],
  );

  const doctorFilterOptions = useMemo(
    () => allowedDoctors.map((d) => ({ value: d.user_id, label: d.name })),
    [allowedDoctors],
  );
  const locationSelectOptions = useMemo(
    () => locationOptions.map((l) => ({ value: l.location_id, label: l.name })),
    [locationOptions],
  );
  const doctorSelectOptions = useMemo(
    () => doctorOptions.map((d) => ({ value: d.user_id, label: d.name })),
    [doctorOptions],
  );
  const patientSelectOptions = useMemo(
    () =>
      patientOptions.map((p) => ({
        value: p.user_id,
        label: p.phone ? `${p.name} — ${p.phone}` : p.name,
      })),
    [patientOptions],
  );
  const doctorNameById = useMemo(() => {
    const map = new Map<string, string>();
    doctorOptions.forEach((d) => map.set(d.user_id, d.name));
    allowedDoctors.forEach((d) => map.set(d.user_id, d.name));
    return map;
  }, [doctorOptions, allowedDoctors]);

  // ---- Month grid cells ----
  const monthCells = useMemo(() => {
    const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
    const cells: { date: string | null; day: number | null }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startWeekday + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cells.push({ date: null, day: null });
      } else {
        const mm = String(viewMonth + 1).padStart(2, "0");
        const dd = String(dayNum).padStart(2, "0");
        cells.push({ date: `${viewYear}-${mm}-${dd}`, day: dayNum });
      }
    }
    return cells;
  }, [viewYear, viewMonth]);

  const monthHasData = useMemo(
    () =>
      monthCells.some(
        (c) => c.date && (monthOverview?.[c.date]?.length ?? 0) > 0,
      ),
    [monthCells, monthOverview],
  );

  const goPrevMonth = () => {
    const m = viewMonth - 1;
    if (m < 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth(m);
  };
  const goNextMonth = () => {
    const m = viewMonth + 1;
    if (m > 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth(m);
  };
  const goToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelectedDate(TODAY);
    setMode("month");
  };

  // ---- Day timeline ---- full 24h so any slot is viewable/creatable
  const rangeStartHour = 0;
  const rangeEndHour = 23;

  const dayBlocks = useMemo(
    () => layoutDay(appointments, rangeStartHour),
    [appointments, rangeStartHour],
  );

  const hours = useMemo(() => {
    const out: number[] = [];
    for (let h = rangeStartHour; h <= rangeEndHour; h++) out.push(h);
    return out;
  }, [rangeStartHour, rangeEndHour]);

  const hourLabel = (h: number) => {
    if (h === 12) return "Noon";
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12} ${ampm}`;
  };

  // Auto-scroll to 8 AM when the day timeline opens.
  // Double-RAF ensures the newly-mounted scroll container has finished layout.
  useEffect(() => {
    if (mode !== "day") return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = timelineScrollRef.current;
        if (el) el.scrollTop = 8 * HOUR_HEIGHT;
      });
    });
  }, [mode, selectedDate]);

  const openDay = (date: string) => {
    setSelectedDate(date);
    setMode("day");
    loadDay(date);
  };

  // ---- Create ----
  const openCreate = () => {
    setCreateForm({
      ...EMPTY_CREATE,
      date: mode === "day" ? selectedDate : TODAY,
      doctor_id: isDoctor && user?.id ? user.id : doctorId,
    });
    setCreateErrors({});
    clearErrors();
    setCreateOpen(true);
    void fetchPatientOptions("");
  };

  // Open the create dialog pre-filled with a date + time range (drag-to-create).
  const openCreateAt = (date: string, start_time: string, end_time: string) => {
    const totals = monthOverview?.[date] ?? [];
    const onlyLocation = totals.length === 1 ? totals[0].location_id : "";
    setCreateForm({
      ...EMPTY_CREATE,
      date,
      start_time,
      end_time,
      doctor_id: doctorId,
      location_id: onlyLocation,
    });
    setCreateErrors({});
    clearErrors();
    setCreateOpen(true);
    void fetchPatientOptions("");
  };

  // Snap a pixel offset within the timeline to a clock minute.
  const ySnapMin = useCallback(
    (y: number): number => {
      const raw = rangeStartHour * 60 + (y / HOUR_HEIGHT) * 60;
      return Math.round(raw / SNAP_MIN) * SNAP_MIN;
    },
    [rangeStartHour],
  );

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const layer = eventsLayerRef.current;
    if (!layer || e.target !== layer) return; // only start on empty area
    const rect = layer.getBoundingClientRect();
    const clamp = (v: number) => Math.max(0, Math.min(v, rect.height));
    const startY = clamp(e.clientY - rect.top);
    setDrag({ startY, curY: startY });

    const onMove = (ev: MouseEvent) => {
      setDrag((d) => (d ? { ...d, curY: clamp(ev.clientY - rect.top) } : d));
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const endY = clamp(ev.clientY - rect.top);
      let s = ySnapMin(Math.min(startY, endY));
      let en = ySnapMin(Math.max(startY, endY));
      if (en - s < SNAP_MIN) en = s + 30; // plain click → 30-min default
      s = Math.max(0, Math.min(s, 24 * 60 - SNAP_MIN));
      en = Math.min(24 * 60, Math.max(en, s + SNAP_MIN));
      setDrag(null);
      openCreateAt(selectedDate, minToHHMM(s), minToHHMM(en));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const validateCreate = (): boolean => {
    const e: Partial<Record<keyof CreateForm, string>> = {};
    if (!createForm.patient_id) e.patient_id = "Patient is required";
    if (!createForm.doctor_id) e.doctor_id = "Doctor is required";
    if (!createForm.location_id) e.location_id = "Location is required";
    if (!createForm.date) e.date = "Date is required";
    if (!createForm.start_time) e.start_time = "Start time is required";
    if (!createForm.end_time) e.end_time = "End time is required";
    if (
      createForm.start_time &&
      createForm.end_time &&
      createForm.end_time <= createForm.start_time
    )
      e.end_time = "End time must be after start time";
    setCreateErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitCreate = async () => {
    if (!validateCreate()) return;
    try {
      await createAppointment({
        patient_id: createForm.patient_id,
        doctor_id: createForm.doctor_id,
        location_id: createForm.location_id,
        date: createForm.date,
        start_time: createForm.start_time,
        end_time: createForm.end_time,
        reason: createForm.reason.trim() || undefined,
      });
      showToast("Appointment scheduled successfully", "success");
      setCreateOpen(false);
      setDoctorId(createForm.doctor_id);
      const [y, m] = createForm.date.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setSelectedDate(createForm.date);
      setMode("month");
    } catch {
      // handled via effect
    }
  };

  // ---- Quick-create patient ----
  const openQuickPatient = (prefillName: string) => {
    setQuickPatientForm({ ...EMPTY_PATIENT_FORM, name: prefillName });
    setQuickPatientErrors({});
    setQuickPatientOpen(true);
  };

  const validateQuickPatient = (): boolean => {
    const e: Partial<Record<keyof QuickPatientForm | "dob", string>> = {};
    if (!quickPatientForm.name.trim()) e.name = "Name is required";
    if (!quickPatientForm.phone.trim()) e.phone = "Phone is required";
    if (!quickPatientForm.gender) e.gender = "Gender is required";
    if (
      !quickPatientForm.dobYear ||
      !quickPatientForm.dobMonth ||
      !quickPatientForm.dobDay
    )
      e.dob = "Date of birth is required";
    setQuickPatientErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitQuickPatient = async () => {
    if (!validateQuickPatient()) return;
    const dob = `${quickPatientForm.dobYear}-${quickPatientForm.dobMonth}-${quickPatientForm.dobDay}`;
    try {
      const created: any = await savePatient({
        mode: "add",
        data: {
          name: quickPatientForm.name.trim(),
          email: quickPatientForm.email.trim(),
          phone: quickPatientForm.phone.trim(),
          gender: quickPatientForm.gender,
          date_of_birth: dob,
        },
      });
      const newId =
        created?.user_id ?? created?.patient_id ?? created?.id ?? "";
      if (newId) {
        setCreateForm((p) => ({ ...p, patient_id: newId }));
        void fetchPatientOptions("");
      }
      showToast("Patient created successfully", "success");
      setQuickPatientOpen(false);
    } catch {
      showToast("Failed to create patient", "error");
    }
  };

  // ---- Reschedule ----
  const openReschedule = (a: Appointment) => {
    setDetailTarget(null);
    setRescheduleTarget(a);
    setRescheduleForm({
      date: a.date,
      start_time: toTimeInput(a.start_time),
      end_time: toTimeInput(a.end_time),
    });
    clearErrors();
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget) return;
    const { date: d, start_time, end_time } = rescheduleForm;
    if (!d || !start_time || !end_time) {
      setSaveError("Date, start time and end time are all required.");
      return;
    }
    if (end_time <= start_time) {
      setSaveError("End time must be after start time.");
      return;
    }
    try {
      await rescheduleAppointment(rescheduleTarget.appointment_id, {
        date: d,
        start_time,
        end_time,
      });
      showToast("Appointment rescheduled", "success");
      setRescheduleTarget(null);
      refreshMonth();
      if (mode === "day") loadDay(selectedDate);
    } catch {
      // handled
    }
  };

  // ---- Cancel ----
  const submitCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelAppointment(cancelTarget.appointment_id);
      showToast("Appointment cancelled", "success");
      setCancelTarget(null);
      refreshMonth();
      if (mode === "day") loadDay(selectedDate);
    } catch {
      setCancelTarget(null);
    }
  };

  // ---- Notes (doctor only) ----
  const openNotes = async (a: Appointment) => {
    setDetailTarget(null);
    setNotesTarget(a);
    setNotesForm({
      reason: a.reason ?? "",
      doctor_notes: a.doctor_notes ?? "",
      prescription: a.prescription ?? "",
    });
    try {
      const data = await fetchNotes(a.appointment_id);
      if (data) {
        setNotesForm({
          reason: data.reason ?? "",
          doctor_notes: data.doctor_notes ?? "",
          prescription: data.prescription ?? "",
        });
      }
    } catch {
      // handled
    }
  };

  const submitNotes = async () => {
    if (!notesTarget) return;
    try {
      await updateNotes(notesTarget.appointment_id, {
        reason: notesForm.reason,
        doctor_notes: notesForm.doctor_notes,
        prescription: notesForm.prescription,
      });
      showToast("Notes saved", "success");
      setNotesTarget(null);
      if (mode === "day") loadDay(selectedDate);
    } catch {
      // handled
    }
  };

  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
  const noViewableDoctors = allowedDoctors.length === 0;

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Calendar overview of scheduled appointments"
        actions={
          canCreateAppt ? (
            <Button icon={Plus} onClick={openCreate}>
              New Appointment
            </Button>
          ) : null
        }
      />

      <Card>
        {/* Toolbar */}
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            display: "flex",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <Select
            label="Viewing doctor"
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setMode("month");
            }}
            placeholder="Select doctor"
            options={doctorFilterOptions}
          />

          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              alignItems: "center",
            }}
          >
            {mode === "day" ? (
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                onClick={() => setMode("month")}
              >
                Month
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ChevronLeft}
                  onClick={goPrevMonth}
                  title="Previous month"
                />
                <input
                  type="month"
                  className="form-input"
                  value={monthKey}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split("-").map(Number);
                    if (y && m) {
                      setViewYear(y);
                      setViewMonth(m - 1);
                    }
                  }}
                  title={monthLabel}
                  style={{
                    fontWeight: 600,
                    width: 160,
                    textAlign: "center",
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ChevronRight}
                  onClick={goNextMonth}
                  title="Next month"
                />
              </>
            )}
            <Button variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
          </div>
        </div>

        {noViewableDoctors ? (
          <div
            style={{
              padding: "var(--space-8) var(--space-5)",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            No reporting doctors are assigned to you, so there are no
            appointments to view.
          </div>
        ) : mode === "month" ? (
          <>
            <div className="cal-weekdays">
              {WEEKDAYS.map((d, i) => (
                <div className="cal-weekday" key={i}>
                  {d}
                </div>
              ))}
            </div>
            <div className="cal-grid">
              {monthCells.map((cell, i) => {
                if (!cell.date) {
                  return <div className="cal-cell cal-cell--empty" key={i} />;
                }
                const totals = monthOverview?.[cell.date] ?? [];
                const isToday = cell.date === TODAY;
                return (
                  <div
                    className="cal-cell"
                    key={cell.date}
                    onClick={() => openDay(cell.date as string)}
                  >
                    <span
                      className={`cal-daynum ${
                        isToday ? "cal-daynum--today" : ""
                      }`}
                    >
                      {cell.day}
                    </span>
                    {totals.slice(0, MAX_CHIPS).map((t) => (
                      <div key={t.location_id} className="cal-chip">
                        <span
                          className={`cal-chip-dot cal-dot--${dayTotalStatus(t)}`}
                        />
                        <span className="cal-chip-text">{t.location_name}</span>
                        <span className="cal-chip-count">
                          {t.total_scheduled}
                        </span>
                        <div
                          className="cal-chip-tooltip"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="cal-tip-title">{t.location_name}</div>
                          <div className="cal-tip-sub">{t.doctor_name}</div>
                          <div className="cal-tip-row">
                            <span className="cal-tip-dot cal-dot--scheduled" />
                            <span className="cal-tip-label">Pending</span>
                            <span className="cal-tip-val">{t.pending}</span>
                          </div>
                          <div className="cal-tip-row">
                            <span className="cal-tip-dot cal-dot--completed" />
                            <span className="cal-tip-label">Completed</span>
                            <span className="cal-tip-val">{t.completed}</span>
                          </div>
                          <div className="cal-tip-row">
                            <span className="cal-tip-dot cal-dot--cancelled" />
                            <span className="cal-tip-label">Cancelled</span>
                            <span className="cal-tip-val">{t.cancelled}</span>
                          </div>
                          <div className="cal-tip-divider" />
                          <div className="cal-tip-total">
                            <span>Total</span>
                            <span>{t.total_scheduled}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {totals.length > MAX_CHIPS ? (
                      <span className="cal-more">
                        +{totals.length - MAX_CHIPS} more
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {monthOverviewLoading ? (
              <div
                style={{
                  padding: "var(--space-3)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                Loading calendar...
              </div>
            ) : !monthHasData ? (
              <div
                style={{
                  padding: "var(--space-4) var(--space-5)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                No appointments scheduled in {monthLabel}.
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div
              style={{
                padding: "var(--space-3) var(--space-5)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "var(--space-3)",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 600 }}>
                {formatLongDate(selectedDate)}
              </span>
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--text-muted)",
                }}
              >
                {loading
                  ? "Loading..."
                  : "Drag on the timeline to create an appointment"}
              </span>
            </div>
            <div
              ref={timelineScrollRef}
              style={{
                height: 520,
                overflowY: "auto",
                userSelect: drag ? "none" : undefined,
              }}
            >
            <div className="cal-timeline">
              <div
                className="cal-timeline-inner"
                style={{ height: hours.length * HOUR_HEIGHT }}
              >
                {hours.map((h, idx) => (
                  <div
                    className="cal-hour-row"
                    key={h}
                    style={{
                      position: "absolute",
                      top: idx * HOUR_HEIGHT,
                      left: 0,
                      right: 0,
                    }}
                  >
                    <div className="cal-hour-label">{hourLabel(h)}</div>
                    <div className="cal-hour-line" />
                  </div>
                ))}
                <div
                  className="cal-events-layer cal-events-layer--drag"
                  ref={eventsLayerRef}
                  onMouseDown={canCreateAppt ? startDrag : undefined}
                >
                  {dayBlocks.map(({ appt, top, height, leftPct, widthPct }) => (
                    <div
                      key={appt.appointment_id}
                      className={`cal-event-block cal-event-block--${appt.status}`}
                      style={{
                        top,
                        height,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 6px)`,
                      }}
                      onClick={() => setDetailTarget(appt)}
                    >
                      <div className="cal-event-title">
                        {appt.patient?.name ?? "Appointment"}
                        {appt.location?.name ? ` · ${appt.location.name}` : ""}
                      </div>
                      {height > 38 ? (
                        <div className="cal-event-sub">
                          {appt.reason || formatTime(appt.start_time)}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {drag ? (
                    <div
                      className="cal-drag-sel"
                      style={{
                        top: Math.min(drag.startY, drag.curY),
                        height: Math.abs(drag.curY - drag.startY),
                      }}
                    >
                      <span className="cal-drag-sel-label">
                        {formatTime(
                          minToHHMM(ySnapMin(Math.min(drag.startY, drag.curY))),
                        )}{" "}
                        –{" "}
                        {formatTime(
                          minToHHMM(ySnapMin(Math.max(drag.startY, drag.curY))),
                        )}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail modal */}
      <Modal
        open={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
        title="Appointment Details"
        size="lg"
        footer={
          detailTarget ? (
            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              {isDoctor ? (
                <Button
                  variant="outline"
                  icon={FileText}
                  onClick={() => void openNotes(detailTarget)}
                >
                  Notes
                </Button>
              ) : null}
              {detailTarget.status === "scheduled" && canUpdateAppt ? (
                <Button
                  variant="outline"
                  icon={Edit2}
                  onClick={() => openReschedule(detailTarget)}
                >
                  Reschedule
                </Button>
              ) : null}
              {detailTarget.status === "scheduled" && canDeleteAppt ? (
                <Button
                  variant="danger"
                  icon={Ban}
                  onClick={() => {
                    setCancelTarget(detailTarget);
                    setDetailTarget(null);
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          ) : null
        }
      >
        {detailTarget ? (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                marginBottom: "var(--space-3)",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {detailTarget.patient?.name ?? "Appointment"}
              </h3>
              <Badge variant={STATUS_VARIANT[detailTarget.status]}>
                {detailTarget.status.charAt(0).toUpperCase() +
                  detailTarget.status.slice(1)}
              </Badge>
            </div>

            <div className="cal-detail-row">
              <span className="cal-detail-label">
                <Clock size={13} /> When
              </span>
              <span className="cal-detail-value">
                {formatLongDate(detailTarget.date)}
                <br />
                {formatTime(detailTarget.start_time)} –{" "}
                {formatTime(detailTarget.end_time)}
              </span>
            </div>
            <div className="cal-detail-row">
              <span className="cal-detail-label">
                <UserIcon size={13} /> Doctor
              </span>
              <span className="cal-detail-value">
                {doctorNameById.get(detailTarget.doctor_id) ??
                  detailTarget.doctor_id}
              </span>
            </div>
            <div className="cal-detail-row">
              <span className="cal-detail-label">
                <MapPin size={13} /> Location
              </span>
              <span className="cal-detail-value">
                {detailTarget.location?.name ?? "—"}
              </span>
            </div>
            <div className="cal-detail-row">
              <span className="cal-detail-label">Patient phone</span>
              <span className="cal-detail-value">
                {detailTarget.patient?.phone ?? "—"}
              </span>
            </div>
            <div className="cal-detail-row">
              <span className="cal-detail-label">Reason</span>
              <span className="cal-detail-value">
                {detailTarget.reason || "—"}
              </span>
            </div>
            {isDoctor ? (
              <>
                <div className="cal-detail-row">
                  <span className="cal-detail-label">Doctor notes</span>
                  <span className="cal-detail-value">
                    {detailTarget.doctor_notes || "—"}
                  </span>
                </div>
                <div className="cal-detail-row">
                  <span className="cal-detail-label">Prescription</span>
                  <span className="cal-detail-value">
                    {detailTarget.prescription || "—"}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => (saving ? null : setCreateOpen(false))}
        title="New Appointment"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={() => void submitCreate()} disabled={saving}>
              {saving ? "Scheduling..." : "Schedule"}
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
          <Select
            label="Patient"
            value={createForm.patient_id}
            onChange={(e) =>
              setCreateForm((p) => ({ ...p, patient_id: e.target.value }))
            }
            onSearch={(s) => void fetchPatientOptions(s)}
            onCreateNew={openQuickPatient}
            createNewLabel="+ Create new patient"
            placeholder="Search patient by name"
            options={patientSelectOptions}
            error={createErrors.patient_id}
            disabled={saving}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Select
              label="Doctor"
              value={createForm.doctor_id}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, doctor_id: e.target.value }))
              }
              placeholder="Select doctor"
              options={doctorSelectOptions}
              error={createErrors.doctor_id}
              disabled={saving}
            />
            <Select
              label="Location"
              value={createForm.location_id}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, location_id: e.target.value }))
              }
              placeholder="Select location"
              options={locationSelectOptions}
              error={createErrors.location_id}
              disabled={saving}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Input
              label="Date"
              type="date"
              value={createForm.date}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, date: e.target.value }))
              }
              error={createErrors.date}
              disabled={saving}
            />
            <Input
              label="Start time"
              type="time"
              value={createForm.start_time}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, start_time: e.target.value }))
              }
              error={createErrors.start_time}
              disabled={saving}
            />
            <Input
              label="End time"
              type="time"
              value={createForm.end_time}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, end_time: e.target.value }))
              }
              error={createErrors.end_time}
              disabled={saving}
            />
          </div>
          <Input
            label="Reason (optional)"
            placeholder="e.g. Follow-up"
            value={createForm.reason}
            onChange={(e) =>
              setCreateForm((p) => ({ ...p, reason: e.target.value }))
            }
            disabled={saving}
          />
        </div>
      </Modal>

      {/* Reschedule modal */}
      <Modal
        open={Boolean(rescheduleTarget)}
        onClose={() => (saving ? null : setRescheduleTarget(null))}
        title="Reschedule Appointment"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRescheduleTarget(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={() => void submitReschedule()} disabled={saving}>
              {saving ? "Saving..." : "Reschedule"}
            </Button>
          </>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "var(--space-4)",
          }}
        >
          <Input
            label="Date"
            type="date"
            value={rescheduleForm.date}
            onChange={(e) =>
              setRescheduleForm((p) => ({ ...p, date: e.target.value }))
            }
            disabled={saving}
          />
          <Input
            label="Start time"
            type="time"
            value={rescheduleForm.start_time}
            onChange={(e) =>
              setRescheduleForm((p) => ({ ...p, start_time: e.target.value }))
            }
            disabled={saving}
          />
          <Input
            label="End time"
            type="time"
            value={rescheduleForm.end_time}
            onChange={(e) =>
              setRescheduleForm((p) => ({ ...p, end_time: e.target.value }))
            }
            disabled={saving}
          />
        </div>
      </Modal>

      {/* Cancel confirm */}
      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel Appointment"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCancelTarget(null)}
              disabled={actioningId !== null}
            >
              Keep
            </Button>
            <Button
              variant="danger"
              onClick={() => void submitCancel()}
              disabled={actioningId !== null}
            >
              {actioningId !== null ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          Cancel the appointment for{" "}
          <strong>{cancelTarget?.patient?.name ?? "this patient"}</strong> at{" "}
          {formatTime(cancelTarget?.start_time)}? This cannot be undone.
        </p>
      </Modal>

      {/* Notes modal */}
      <Modal
        open={Boolean(notesTarget)}
        onClose={() => (saving ? null : setNotesTarget(null))}
        title="Clinical Notes & Prescription"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setNotesTarget(null)}
              disabled={saving}
            >
              Close
            </Button>
            <Button onClick={() => void submitNotes()} disabled={saving}>
              {saving ? "Saving..." : "Save Notes"}
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
            label="Reason"
            value={notesForm.reason}
            onChange={(e) =>
              setNotesForm((p) => ({ ...p, reason: e.target.value }))
            }
            disabled={saving}
          />
          <Input
            label="Doctor notes"
            textarea
            placeholder="Observations, diagnosis..."
            value={notesForm.doctor_notes}
            onChange={(e) =>
              setNotesForm((p) => ({ ...p, doctor_notes: e.target.value }))
            }
            disabled={saving}
          />
          <Input
            label="Prescription"
            textarea
            placeholder="Medication, dosage..."
            value={notesForm.prescription}
            onChange={(e) =>
              setNotesForm((p) => ({ ...p, prescription: e.target.value }))
            }
            disabled={saving}
          />
        </div>
      </Modal>

      {/* Quick-create patient modal */}
      <Modal
        open={quickPatientOpen}
        onClose={() => (patientSaving ? null : setQuickPatientOpen(false))}
        title="Quick Add Patient"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setQuickPatientOpen(false)}
              disabled={patientSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitQuickPatient()}
              disabled={patientSaving}
            >
              {patientSaving ? "Saving..." : "Create Patient"}
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
            value={quickPatientForm.name}
            onChange={(e) =>
              setQuickPatientForm((p) => ({ ...p, name: e.target.value }))
            }
            error={quickPatientErrors.name}
            disabled={patientSaving}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
            }}
          >
            <Input
              label="Email (optional)"
              type="email"
              placeholder="patient@example.com"
              value={quickPatientForm.email}
              onChange={(e) =>
                setQuickPatientForm((p) => ({ ...p, email: e.target.value }))
              }
              disabled={patientSaving}
            />
            <Input
              label="Phone"
              placeholder="Phone number"
              value={quickPatientForm.phone}
              onChange={(e) =>
                setQuickPatientForm((p) => ({ ...p, phone: e.target.value }))
              }
              error={quickPatientErrors.phone}
              disabled={patientSaving}
            />
          </div>
          <DateOfBirthPicker
            label="Date of Birth"
            value={{
              year: quickPatientForm.dobYear,
              month: quickPatientForm.dobMonth,
              day: quickPatientForm.dobDay,
            }}
            onChange={(dob) =>
              setQuickPatientForm((p) => ({
                ...p,
                dobYear: dob.year,
                dobMonth: dob.month,
                dobDay: dob.day,
              }))
            }
            error={quickPatientErrors.dob}
            disabled={patientSaving}
          />
          <Select
            label="Gender"
            value={quickPatientForm.gender}
            onChange={(e) =>
              setQuickPatientForm((p) => ({ ...p, gender: e.target.value }))
            }
            placeholder="Select gender"
            options={GENDER_OPTIONS}
            error={quickPatientErrors.gender}
            disabled={patientSaving}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Appointments;
