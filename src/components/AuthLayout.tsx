import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-bg-default font-inter">
      <div className="hidden lg:block lg:col-span-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/baseareacanoas.jpg')] bg-cover bg-center transition-transform duration-1000 hover:scale-105" />
        <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
      </div>

      <div className="col-span-1 lg:col-span-4 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-sm space-y-8">{children}</div>
      </div>
    </div>
  );
}
