import React from "react";
import Content from "./Content";
import TopNav from "./TopNav";

interface Profile {
  role?: string;
  rank?: string;
  full_name?: string;
}

export default function Shell({
  children,
  profile,
  adminEnabled,
}: {
  children: React.ReactNode;
  profile: Profile;
  adminEnabled: boolean;
}) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <TopNav profile={profile} adminEnabled={adminEnabled} />
      <Content>{children}</Content>
    </div>
  );
}
