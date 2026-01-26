import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabase";
import React from "react";

const DevAuthDebug: React.FC = () => {
  const { user, profile, loading, profileResolved, signOut } = useAuth();

  const forceSignOut = async () => {
    // Debug logs to confirm clicks
    // eslint-disable-next-line no-console
    console.debug("Dev debug: forceSignOut clicked");
    try {
      await supabase.auth.signOut();
      await signOut();
      // eslint-disable-next-line no-console
      console.debug("Dev debug: forceSignOut completed");
      // Reload to ensure UI fully resets
      window.location.reload();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Force signOut error:", e);
      window.location.reload();
    }
  };

  const clearStorage = () => {
    // eslint-disable-next-line no-console
    console.debug("Dev debug: clearStorage clicked");
    try {
      localStorage.clear();
      sessionStorage.clear();
      // eslint-disable-next-line no-console
      console.debug("Cleared local/session storage");
      // Reload to ensure any in-memory state is reset
      window.location.reload();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 p-3 bg-white rounded-lg border shadow text-xs w-64">
      <div className="font-bold mb-2">DEV Auth Debug</div>
      <div className="mb-2">
        <div>User: {user?.id ?? "null"}</div>
        <div>Profile: {profile?.id ?? "null"}</div>
        <div>Loading: {String(loading)}</div>
        <div>ProfileResolved: {String(profileResolved)}</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={forceSignOut}
          className="px-2 py-1 bg-red-500 text-white rounded"
        >
          Force SignOut
        </button>
        <button
          onClick={clearStorage}
          className="px-2 py-1 bg-gray-200 rounded"
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
};

export default DevAuthDebug;
