import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

type Props = { children?: ReactNode };

export const Layout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      <Sidebar />
      <main className="flex-1 ml-72 p-10 bg-[#F4F7F9] dark:bg-background-dark min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;
