import "./Avatar.css";

const COLORS = [
  "#4c6ef5",
  "#7950f2",
  "#e64980",
  "#f76707",
  "#12b886",
  "#15aabf",
  "#fab005",
  "#82c91e",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface AvatarProps {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Avatar = ({
  name = "",
  src,
  size = "md",
  className = "",
}: AvatarProps) => (
  <div
    className={`avatar avatar-${size} ${className}`}
    style={!src ? { background: getColor(name) } : undefined}
    title={name}
  >
    {src ? <img src={src} alt={name} /> : getInitials(name || "?")}
  </div>
);

export default Avatar;
