import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white shadow-sm border border-slate-200 rounded-lg p-6 ${className}`}
    >
      {children}
    </div>
  );
}
