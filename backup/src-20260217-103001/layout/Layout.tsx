import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type Props = { children?: ReactNode };

export const Layout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
