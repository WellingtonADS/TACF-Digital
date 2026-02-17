import AccessTime from "@mui/icons-material/AccessTime";
import Add from "@mui/icons-material/Add";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import CommentIcon from "@mui/icons-material/Comment";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import Edit from "@mui/icons-material/Edit";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import AlertCircleIcon from "@mui/icons-material/ErrorOutline";
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
import MenuIcon from "@mui/icons-material/Menu";
import NightsStay from "@mui/icons-material/NightsStay";
import Person from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import Security from "@mui/icons-material/Security";
import HashIcon from "@mui/icons-material/Tag";
import WarningAmber from "@mui/icons-material/WarningAmber";
import WbSunny from "@mui/icons-material/WbSunny";
import CircularProgress from "@mui/material/CircularProgress";
import React from "react";

type IconProps = {
  size?: number;
  className?: string;
} & React.SVGProps<SVGSVGElement>;

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
export const Download = ({ size = 20, className = "" }: IconProps) => (
  <DownloadIcon style={{ fontSize: size }} className={className} />
);
export const Hash = ({ size = 20, className = "" }: IconProps) => (
  <HashIcon style={{ fontSize: size }} className={className} />
);
export const RefreshCw = ({ size = 20, className = "" }: IconProps) => (
  <RefreshIcon style={{ fontSize: size }} className={className} />
);
export const AlertCircle = ({ size = 20, className = "" }: IconProps) => (
  <AlertCircleIcon style={{ fontSize: size }} className={className} />
);
export const Clock = ({ size = 20, className = "" }: IconProps) => (
  <AccessTime style={{ fontSize: size }} className={className} />
);
export const Info = ({ size = 20, className = "" }: IconProps) => (
  <InfoOutlined style={{ fontSize: size }} className={className} />
);
export const User = ({ size = 20, className = "" }: IconProps) => (
  <Person style={{ fontSize: size }} className={className} />
);
export const Users = ({ size = 20, className = "" }: IconProps) => (
  <Group style={{ fontSize: size }} className={className} />
);
export const Menu = ({ size = 20, className = "" }: IconProps) => (
  <MenuIcon style={{ fontSize: size }} className={className} />
);
export const ChevronDown = ({ size = 20, className = "" }: IconProps) => (
  <ExpandMore style={{ fontSize: size }} className={className} />
);
export const ChevronLeft = ({ size = 20, className = "" }: IconProps) => (
  <ChevronLeftIcon style={{ fontSize: size }} className={className} />
);
export const ChevronRight = ({ size = 20, className = "" }: IconProps) => (
  <ChevronRightIcon style={{ fontSize: size }} className={className} />
);
export const Edit2 = ({ size = 20, className = "" }: IconProps) => (
  <Edit style={{ fontSize: size }} className={className} />
);
export const LogOut = ({ size = 20, className = "" }: IconProps) => (
  <Logout style={{ fontSize: size }} className={className} />
);
export const Mail = ({ size = 20, className = "" }: IconProps) => (
  <MailOutline style={{ fontSize: size }} className={className} />
);
export const MapPin = ({ size = 20, className = "" }: IconProps) => (
  <LocationOn style={{ fontSize: size }} className={className} />
);
export const Moon = ({ size = 20, className = "" }: IconProps) => (
  <NightsStay style={{ fontSize: size }} className={className} />
);
export const Plane = ({ size = 20, className = "" }: IconProps) => (
  <Flight style={{ fontSize: size }} className={className} />
);
export const Plus = ({ size = 20, className = "" }: IconProps) => (
  <Add style={{ fontSize: size }} className={className} />
);
export const MessageSquare = ({ size = 20, className = "" }: IconProps) => (
  <CommentIcon style={{ fontSize: size }} className={className} />
);
export const Search_Icon = ({ size = 20, className = "" }: IconProps) => (
  <SearchIcon style={{ fontSize: size }} className={className} />
);
export const Search = Search_Icon;
export const Shield = ({ size = 20, className = "" }: IconProps) => (
  <Security style={{ fontSize: size }} className={className} />
);
export const Sun = ({ size = 20, className = "" }: IconProps) => (
  <WbSunny style={{ fontSize: size }} className={className} />
);
export const Trash2 = ({ size = 20, className = "" }: IconProps) => (
  <DeleteOutline style={{ fontSize: size }} className={className} />
);
export const UserCog = ({ size = 20, className = "" }: IconProps) => (
  <ManageAccounts style={{ fontSize: size }} className={className} />
);
export const AlertTriangle: React.FC<IconProps> = ({
  size = 20,
  className = "",
  ...rest
}) => (
  <WarningAmber style={{ fontSize: size }} className={className} {...rest} />
);
export const ArrowRight: React.FC<IconProps> = ({
  size = 20,
  className = "",
  ...rest
}) => (
  <ArrowForward style={{ fontSize: size }} className={className} {...rest} />
);
export const History: React.FC<IconProps> = ({
  size = 20,
  className = "",
  ...rest
}) => (
  <HistoryIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const Loader2: React.FC<IconProps> = ({
  size = 20,
  className = "",
  ...rest
}) => (
  <CircularProgress
    size={size}
    thickness={5}
    className={className}
    {...(rest as any)}
  />
);
export const Calendar = ({ size = 20, className = "", ...rest }: IconProps) => (
  <CalendarMonth style={{ fontSize: size }} className={className} {...rest} />
);
export const Download = ({ size = 20, className = "", ...rest }: IconProps) => (
  <DownloadIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const Hash = ({ size = 20, className = "", ...rest }: IconProps) => (
  <HashIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const RefreshCw = ({
  size = 20,
  className = "",
  ...rest
}: IconProps) => (
  <RefreshIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const AlertCircle = ({
  size = 20,
  className = "",
  ...rest
}: IconProps) => (
  <AlertCircleIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const Clock = ({ size = 20, className = "", ...rest }: IconProps) => (
  <AccessTime style={{ fontSize: size }} className={className} {...rest} />
);
export const Info = ({ size = 20, className = "", ...rest }: IconProps) => (
  <InfoOutlined style={{ fontSize: size }} className={className} {...rest} />
);
export const User = ({ size = 20, className = "", ...rest }: IconProps) => (
  <Person style={{ fontSize: size }} className={className} {...rest} />
);
export const Users = ({ size = 20, className = "", ...rest }: IconProps) => (
  <Group style={{ fontSize: size }} className={className} {...rest} />
);
export const Menu = ({ size = 20, className = "", ...rest }: IconProps) => (
  <MenuIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const ChevronDown = ({
  size = 20,
  className = "",
  ...rest
}: IconProps) => (
  <ExpandMore style={{ fontSize: size }} className={className} {...rest} />
);
export const ChevronLeft = ({
  size = 20,
  className = "",
  ...rest
}: IconProps) => (
  <ChevronLeftIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const ChevronRight = ({
  size = 20,
  className = "",
  ...rest
}: IconProps) => (
  <ChevronRightIcon
    style={{ fontSize: size }}
    className={className}
    {...rest}
  />
);
export const Edit2 = ({ size = 20, className = "", ...rest }: IconProps) => (
  <Edit style={{ fontSize: size }} className={className} {...rest} />
);
export const LogOut = ({ size = 20, className = "", ...rest }: IconProps) => (
  <Logout style={{ fontSize: size }} className={className} {...rest} />
);
export const Mail = ({ size = 20, className = "", ...rest }: IconProps) => (
  <MailOutline style={{ fontSize: size }} className={className} {...rest} />
);
export const MapPin = ({ size = 20, className = "", ...rest }: IconProps) => (
  <LocationOn style={{ fontSize: size }} className={className} {...rest} />
);
export const Moon = ({ size = 20, className = "", ...rest }: IconProps) => (
  <NightsStay style={{ fontSize: size }} className={className} {...rest} />
);
export const Plane = ({ size = 20, className = "", ...rest }: IconProps) => (
  <Flight style={{ fontSize: size }} className={className} {...rest} />
);
export const Plus = ({ size = 20, className = "", ...rest }: IconProps) => (
  <Add style={{ fontSize: size }} className={className} {...rest} />
);
export const MessageSquare = ({
  size = 20,
  className = "",
  ...rest
}: IconProps) => (
  <CommentIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const Search_Icon = ({
  size = 20,
  className = "",
  ...rest
}: IconProps) => (
  <SearchIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const Search = Search_Icon;
export const Shield = ({ size = 20, className = "", ...rest }: IconProps) => (
  <Security style={{ fontSize: size }} className={className} {...rest} />
);
export const Sun = ({ size = 20, className = "", ...rest }: IconProps) => (
  <WbSunny style={{ fontSize: size }} className={className} {...rest} />
);
export const Trash2 = ({ size = 20, className = "", ...rest }: IconProps) => (
  <DeleteOutline style={{ fontSize: size }} className={className} {...rest} />
);
export const UserCog = ({ size = 20, className = "", ...rest }: IconProps) => (
  <ManageAccounts style={{ fontSize: size }} className={className} {...rest} />
);
export const X = ({ size = 20, className = "", ...rest }: IconProps) => (
  <CloseIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const Close = ({ size = 20, className = "", ...rest }: IconProps) => (
  <CloseIcon style={{ fontSize: size }} className={className} {...rest} />
);
export const CalendarCheck = ({
  size = 20,
  className = "",
  ...rest
}: IconProps) => (
  <EventAvailable style={{ fontSize: size }} className={className} {...rest} />
);
export const CheckCircle2 = ({
  size = 20,
  className = "",
  ...rest
}: IconProps) => (
  <CheckCircle style={{ fontSize: size }} className={className} {...rest} />
);
export const Check = ({ size = 20, className = "", ...rest }: IconProps) => (
  <CheckIcon style={{ fontSize: size }} className={className} {...rest} />
);

export const Medal = ({ size = 20, className = "", ...rest }: IconProps) => (
  <EmojiEvents style={{ fontSize: size }} className={className} {...rest} />
);

export const Save = ({ size = 20, className = "", ...rest }: IconProps) => (
  <SaveIcon style={{ fontSize: size }} className={className} {...rest} />
);

export const ShieldAlert = ({
  size = 20,
  className = "",
  ...rest
}: IconProps) => (
  <AlertCircleIcon style={{ fontSize: size }} className={className} {...rest} />
);
