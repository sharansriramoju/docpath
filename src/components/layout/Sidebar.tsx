import { NavLink } from "react-router-dom";
import type { ElementType } from "react";
import { LayoutDashboard, Calendar, Users, UserCog, MapPin, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type {
  AccessAction,
  AccessResource,
  Permission,
} from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import "./Sidebar.css";

interface NavItem {
  to: string;
  icon: ElementType;
  label: string;
  permission?: Permission;
  access?: {
    action: AccessAction;
    resource: AccessResource;
  };
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      {
        to: "/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
      },
      {
        to: "/appointments",
        icon: Calendar,
        label: "Appointments",
        access: { action: "read" as AccessAction, resource: "Appointments" as AccessResource },
      },
      {
        to: "/patients",
        icon: Users,
        label: "Patients",
        access: { action: "read" as AccessAction, resource: "Patients" as AccessResource },
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        to: "/users",
        icon: UserCog,
        label: "User Management",
        access: { action: "read" as AccessAction, resource: "Users" as AccessResource },
      },
      {
        to: "/roles",
        icon: Shield,
        label: "Roles & Access",
        access: { action: "read" as AccessAction, resource: "Roles" as AccessResource },
      },
    ],
  },
  {
    label: "Locations",
    items: [
      {
        to: "/locations",
        icon: MapPin,
        label: "Manage Locations",
        access: { action: "read", resource: "Locations" },
      },
    ],
  },
];

const Sidebar = () => {
  const { user, hasPermission, can } = useAuth();

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
                (item) =>
                  (!item.permission || hasPermission(item.permission)) &&
                  (!item.access ||
                    can(item.access.action, item.access.resource)),
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
