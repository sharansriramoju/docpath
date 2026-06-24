import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import PermissionGuard from "./utils/PermissionGuard";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients";
import UserManagement from "./pages/UserManagement";
import Locations from "./pages/Locations";
import Login from "./pages/Login/Login";
import GuestGuard from "./utils/GuestGuard";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/appointments" replace /> },
      { path: "appointments", element: <Appointments /> },
      { path: "patients", element: <Patients /> },
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
