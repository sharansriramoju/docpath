import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import PermissionGuard from "./utils/PermissionGuard";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients";
import MedicalRecords from "./pages/MedicalRecords";
import DoctorSchedule from "./pages/DoctorSchedule";
import TownVisits from "./pages/TownVisits";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import VisitConfig from "./pages/VisitConfig";
import Locations from "./pages/Locations";
import Login from "./pages/Login/Login";
import GuestGuard from "./utils/GuestGuard";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "appointments", element: <Appointments /> },
      { path: "patients", element: <Patients /> },
      { path: "records", element: <MedicalRecords /> },
      { path: "schedule", element: <DoctorSchedule /> },
      { path: "visits", element: <TownVisits /> },
      {
        path: "visit-config",
        element: <VisitConfig />,
      },
      {
        path: "users",
        element: <UserManagement />,
      },
      {
        path: "locations",
        element: <Locations />,
      },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "auth/login",
    element: (
      <GuestGuard>
        <Login />
      </GuestGuard>
    ),
  },
]);

export default router;
