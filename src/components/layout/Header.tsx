import { Bell, LogOut, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Header.css";

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header = ({ onMenuToggle }: HeaderProps) => {
  const { user, logout } = useAuth();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuToggle} title="Menu">
          <Menu />
        </button>
        <span className="header-greeting">
          {greeting}, <strong>Dr. {user?.name?.split(" ").pop()}</strong>
        </span>
      </div>
      <div className="header-right">
        <button className="header-icon-btn" title="Notifications">
          <Bell />
          <span className="header-notif-dot" />
        </button>
        <button className="header-icon-btn" title="Logout" onClick={logout}>
          <LogOut />
        </button>
      </div>
    </header>
  );
};

export default Header;
