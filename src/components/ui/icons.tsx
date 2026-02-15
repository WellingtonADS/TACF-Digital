import AccessTime from "@mui/icons-material/AccessTime";
import Add from "@mui/icons-material/Add";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import Check from "@mui/icons-material/Check";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Close from "@mui/icons-material/Close";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Edit from "@mui/icons-material/Edit";
import EventAvailable from "@mui/icons-material/EventAvailable";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Flight from "@mui/icons-material/Flight";
import Group from "@mui/icons-material/Group";
import HistoryIcon from "@mui/icons-material/History";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import LocationOn from "@mui/icons-material/LocationOn";
import Logout from "@mui/icons-material/Logout";
import MailOutline from "@mui/icons-material/MailOutline";
import ManageAccounts from "@mui/icons-material/ManageAccounts";
import Menu from "@mui/icons-material/Menu";
import NightsStay from "@mui/icons-material/NightsStay";
import Person from "@mui/icons-material/Person";
import Search from "@mui/icons-material/Search";
import Security from "@mui/icons-material/Security";
import WarningAmber from "@mui/icons-material/WarningAmber";
import WbSunny from "@mui/icons-material/WbSunny";
import CircularProgress from "@mui/material/CircularProgress";
import React from "react";

type IconProps = {
  size?: number;
  className?: string;
} & React.ComponentProps<"span">;

export const AlertTriangle: React.FC<IconProps> = ({
  size = 20,
  className = "",
}) => <WarningAmber style={{ fontSize: size }} className={className} />;
export const ArrowRight: React.FC<IconProps> = ({
  size = 20,
  className = "",
}) => <ArrowForward style={{ fontSize: size }} className={className} />;
export const History: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <HistoryIcon style={{ fontSize: size }} className={className} />
);
export const Loader2: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <CircularProgress size={size} thickness={5} className={className} />
);
export const Calendar = ({ size = 20, className = "" }: IconProps) => (
  <CalendarMonth style={{ fontSize: size }} className={className} />
);
export {
  EventAvailable as CalendarCheck,
  Check,
  CheckCircle as CheckCircle2,
  ExpandMore as ChevronDown,
  ChevronLeft,
  ChevronRight,
  AccessTime as Clock,
  Edit as Edit2,
  InfoOutlined as Info,
  Logout as LogOut,
  MailOutline as Mail,
  LocationOn as MapPin,
  Menu,
  NightsStay as Moon,
  Flight as Plane,
  Add as Plus,
  Search,
  Security as Shield,
  WbSunny as Sun,
  DeleteOutline as Trash2,
  Person as User,
  ManageAccounts as UserCog,
  Group as Users,
  Close as X,
};

export default {};
