import SessionEditModal from "@/components/Admin/SessionEditModal";
import CalendarGrid from "@/components/Calendar/CalendarGrid";
import { Body, H1 } from "@/components/ui/Typography";
import { CalendarCheck } from "@/components/ui/icons";
import { useState } from "react";

export default function AdminSessions() {
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-primary rounded-xl hidden sm:block">
          <CalendarCheck size={28} />
        </div>
        <div>
          <H1>Gerenciar Sessões do TAF</H1>
          <Body className="text-slate-500 text-sm mt-1">
            Selecione um dia no calendário para abrir vagas, definir turnos ou
            cancelar sessões.
          </Body>
        </div>
      </div>

      {/* Área do Calendário */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
        <CalendarGrid
          isAdmin
          onDayClick={(date) => setEditingDate(date)}
          refreshKey={refreshKey}
        />
      </div>

      <SessionEditModal
        isOpen={!!editingDate}
        date={editingDate ?? new Date()}
        onClose={() => setEditingDate(null)}
        onSaved={() => {
          // Força o calendário a recarregar os dados para mostrar as novas vagas
          setRefreshKey((k) => k + 1);
          setEditingDate(null);
        }}
      />
    </div>
  );
}
