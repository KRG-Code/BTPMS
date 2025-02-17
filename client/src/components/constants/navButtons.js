import { RiDashboardLine, RiRoadMapLine, RiCalendarScheduleLine, RiAlertLine, RiUserStarLine, RiToolsLine } from "react-icons/ri";
import { FaPeopleGroup } from "react-icons/fa6";
import { GrResources } from "react-icons/gr";

export const buttonData = [
  { label: "DashBoard", icon: <RiDashboardLine /> },
  { label: "Patrol Map", icon: <RiRoadMapLine /> },
  { label: "Patrol", icon: <RiAlertLine /> },
  { label: "Schedule", icon: <RiCalendarScheduleLine /> },
  { label: "Performance", icon: <RiUserStarLine /> },
  { label: "Equipments", icon: <RiToolsLine /> },
  ];

export const buttonData2 = [
    { label: "Home", icon: <RiDashboardLine /> },
    { label: "Report Incidents", icon: <RiAlertLine /> },
    { label: "Rate Tanod", icon: <RiUserStarLine /> },
    ];

    export const buttonData3 = [
      { label: "Admin Dashboard", icon: <RiDashboardLine /> },
      { label: "Manage Tanod", icon: <FaPeopleGroup /> },
      { label: "Manage Patrol Schedules", icon: <RiRoadMapLine /> },
      { label: "Resources", icon: <GrResources /> },
      ];