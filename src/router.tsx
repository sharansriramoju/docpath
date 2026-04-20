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
import Login from "./pages/Login/Login";

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
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "auth/login",
    element: <Login />,
  },
]);

export default router;
