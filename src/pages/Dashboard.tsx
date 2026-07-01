import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, CalendarCheck, BarChart3 } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import useDashboard from "../hooks/useDashboard";
import "./Dashboard.css";

const formatMonth = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

const getMonthRange = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return { startDate: toDateStr(start), endDate: toDateStr(end) };
};

const formatHour = (hour: number) => {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
};

const formatPeriodLabel = (period: string) => {
  const d = new Date(period + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const Dashboard = () => {
  const [month, setMonth] = useState(() => formatMonth(new Date()));
  const [granularity, setGranularity] = useState("day");

  const {
    totalPatients,
    todayAppointments,
    appointmentTrends,
    patientVolumeByLocation,
    newPatientRegistrations,
    peakAppointmentHours,
    loading,
    loadTotalPatients,
    loadTodayAppointments,
    loadAppointmentTrends,
    loadPatientVolumeByLocation,
    loadNewPatientRegistrations,
    loadPeakAppointmentHours,
  } = useDashboard();

  const { startDate, endDate } = useMemo(() => getMonthRange(month), [month]);

  useEffect(() => {
    loadTotalPatients();
    loadTodayAppointments();
  }, [loadTotalPatients, loadTodayAppointments]);

  useEffect(() => {
    loadAppointmentTrends(startDate, endDate, granularity);
    loadPatientVolumeByLocation(startDate, endDate);
    loadNewPatientRegistrations(startDate, endDate, granularity);
    loadPeakAppointmentHours(startDate, endDate);
  }, [
    startDate,
    endDate,
    granularity,
    loadAppointmentTrends,
    loadPatientVolumeByLocation,
    loadNewPatientRegistrations,
    loadPeakAppointmentHours,
  ]);

  const trendData = useMemo(
    () =>
      appointmentTrends.map((r) => ({
        ...r,
        label: formatPeriodLabel(r.period),
      })),
    [appointmentTrends],
  );

  const registrationData = useMemo(
    () =>
      newPatientRegistrations.map((r) => ({
        ...r,
        label: formatPeriodLabel(r.period),
      })),
    [newPatientRegistrations],
  );

  const peakData = useMemo(
    () =>
      peakAppointmentHours.map((r) => ({
        ...r,
        label: formatHour(r.hour),
      })),
    [peakAppointmentHours],
  );

  const locationData = useMemo(
    () =>
      patientVolumeByLocation.map((r) => ({
        name: r.location_name,
        count: r.count,
      })),
    [patientVolumeByLocation],
  );

  const chartColors = {
    primary: "#4c6ef5",
    success: "#40c057",
    warning: "#fab005",
    purple: "#7950f2",
  };

  return (
    <div className="dashboard">
      <PageHeader title="Dashboard" subtitle="Clinic analytics overview" />

      <div className="dashboard-controls">
        <label>Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <label>Granularity</label>
        <select
          className="granularity-select"
          value={granularity}
          onChange={(e) => setGranularity(e.target.value)}
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-kpis">
        <div className="kpi-card">
          <div className="kpi-icon patients">
            <Users />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Patients</span>
            {loading.totalPatients ? (
              <div className="kpi-value skeleton" />
            ) : (
              <span className="kpi-value">{totalPatients ?? 0}</span>
            )}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon appointments">
            <CalendarCheck />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Today's Appointments</span>
            {loading.todayAppointments ? (
              <div className="kpi-value skeleton" />
            ) : (
              <span className="kpi-value">{todayAppointments ?? 0}</span>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        {/* Appointment Trends — Line Chart */}
        <div className="chart-card full-width">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Appointment Trends</div>
              <div className="chart-card-subtitle">
                {granularity === "day" ? "Daily" : granularity === "week" ? "Weekly" : "Monthly"} appointment count
              </div>
            </div>
          </div>
          <div className="chart-body">
            {loading.appointmentTrends ? (
              <span className="chart-loading">Loading...</span>
            ) : trendData.length === 0 ? (
              <div className="chart-empty">
                <BarChart3 />
                <span>No appointment data for this period</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Appointments"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Patient Volume by Location — Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Patient Volume by Location</div>
              <div className="chart-card-subtitle">Footfall across clinic locations</div>
            </div>
          </div>
          <div className="chart-body">
            {loading.patientVolumeByLocation ? (
              <span className="chart-loading">Loading...</span>
            ) : locationData.length === 0 ? (
              <div className="chart-empty">
                <BarChart3 />
                <span>No location data</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={locationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Patients" fill={chartColors.success} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* New Patient Registrations — Area Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">New Patient Registrations</div>
              <div className="chart-card-subtitle">
                {granularity === "day" ? "Daily" : granularity === "week" ? "Weekly" : "Monthly"} sign-ups
              </div>
            </div>
          </div>
          <div className="chart-body">
            {loading.newPatientRegistrations ? (
              <span className="chart-loading">Loading...</span>
            ) : registrationData.length === 0 ? (
              <div className="chart-empty">
                <BarChart3 />
                <span>No registration data</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={registrationData}>
                  <defs>
                    <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.purple} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.purple} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Registrations"
                    stroke={chartColors.purple}
                    strokeWidth={2}
                    fill="url(#gradPurple)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Peak Appointment Hours — Bar Chart */}
        <div className="chart-card full-width">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Peak Appointment Hours</div>
              <div className="chart-card-subtitle">Appointment count by hour of day</div>
            </div>
          </div>
          <div className="chart-body">
            {loading.peakAppointmentHours ? (
              <span className="chart-loading">Loading...</span>
            ) : peakData.length === 0 ? (
              <div className="chart-empty">
                <BarChart3 />
                <span>No peak hour data</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={peakData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Appointments" fill={chartColors.warning} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
