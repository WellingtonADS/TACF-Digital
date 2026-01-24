import SessionEditModal from "@/components/Admin/SessionEditModal";
import CalendarGrid from "@/components/Calendar/CalendarGrid";
import MainLayout from "@/components/Layout/MainLayout";
import { useState } from "react";

export default function AdminSessions() {
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <MainLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Gerenciar Sessões</h1>
        <p className="text-sm text-slate-500">
          Clique em um dia para adicionar/editar sessões.
        </p>
      </div>

      <CalendarGrid
        isAdmin
        onDayClick={(date) => setEditingDate(date)}
        refreshKey={refreshKey}
      />

      <SessionEditModal
        isOpen={!!editingDate}
        date={editingDate ?? new Date()}
        onClose={() => setEditingDate(null)}
        onSaved={() => {
          // bump refresh to force CalendarGrid to refetch
          setRefreshKey((k) => k + 1);
          setEditingDate(null);
        }}
      />
    </MainLayout>
  );
}
