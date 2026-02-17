import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

type Props = { children?: ReactNode };

export const Layout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
};

export default Layout;
