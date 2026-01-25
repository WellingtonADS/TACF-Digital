import React from "react";

export default function Content({ children }: { children: React.ReactNode }) {
  return (
    <main className="container mx-auto px-4 md:px-6 py-8">{children}</main>
  );
}
