import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import PermissionGuard from "./utils/PermissionGuard";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients";
import MedicalRecords from "./pages/MedicalRecords";
import DoctorSchedule from "./pages/DoctorSchedule";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import Locations from "./pages/Locations";
import Login from "./pages/Login/Login";
import GuestGuard from "./utils/GuestGuard";
import DoctorRoutines from "./pages/DoctorRoutines";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "appointments", element: <Appointments /> },
      { path: "patients", element: <Patients /> },
      { path: "records", element: <MedicalRecords /> },
      { path: "schedule", element: <DoctorSchedule /> },
      {
        path: "users",
        element: <UserManagement />,
      },
      {
        path: "locations",
        element: (
          <PermissionGuard action="read" resource="Locations">
            <Locations />
          </PermissionGuard>
        ),
      },
      {
        path: "doctor-routines",
        element: (
          <PermissionGuard action="read" resource="DoctorRoutines">
            <DoctorRoutines />
          </PermissionGuard>
        ),
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
