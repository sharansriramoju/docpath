import { NavLink } from "react-router-dom";
import type { ElementType } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  ClipboardList,
  UserCog,
  MapPin,
  Settings,
  CalendarCog,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Permission } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import "./Sidebar.css";

interface NavItem {
  to: string;
  icon: ElementType;
  label: string;
  permission?: Permission;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/appointments", icon: Calendar, label: "Appointments" },
      { to: "/patients", icon: Users, label: "Patients" },
      { to: "/records", icon: ClipboardList, label: "Medical Records" },
    ],
  },
  {
    label: "Schedule",
    items: [
      { to: "/schedule", icon: Stethoscope, label: "Doctor Schedule" },
      { to: "/visits", icon: MapPin, label: "Town Visits" },
      { to: "/visit-config", icon: CalendarCog, label: "Visit Config" },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        to: "/users",
        icon: UserCog,
        label: "User Management",
      },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const Sidebar = () => {
  const { user, hasPermission } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">CC</div>
        <div className="sidebar-brand-text">
          <h1>ClinicCare</h1>
          <span>CRM Dashboard</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items
              .filter(
                (item) => !item.permission || hasPermission(item.permission),
              )
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                >
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <Avatar name={user?.name || "Doctor"} size="sm" />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
