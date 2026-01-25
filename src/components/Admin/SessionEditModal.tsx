import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { getSessionWithBookings, upsertSession } from "@/services/admin";
import type {
  Booking,
  BookingWithDetails,
  Profile,
} from "@/types/database.types";
import { generateSessionPDF } from "@/utils/pdfGenerator";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Period = "morning" | "afternoon";

export default function SessionEditModal({
  isOpen,
  date,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  date: Date;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [period, setPeriod] = useState<Period>("morning");
  const [maxCapacity, setMaxCapacity] = useState<number>(8);
  const [applicatorsText, setApplicatorsText] = useState<string>("");
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [loading, setLoading] = useState(false);

  const [bookings, setBookings] = useState<(Booking & { user?: Profile })[]>(
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    // reset
    setPeriod("morning");
    setMaxCapacity(8);
    setApplicatorsText("");
    setStatus("open");
    setBookings([]);
    (async () => {
      try {
        const dateStr = format(date, "yyyy-LL-dd");
        const res = await getSessionWithBookings(dateStr, "morning");
        if (res) {
          setMaxCapacity(res.max_capacity);
          setApplicatorsText((res.applicators ?? []).join(", "));
          setStatus(res.status);
          setBookings(res.bookings ?? []);
        }
      } catch {
        // ignore
      }
    })();
  }, [isOpen, date]);

  useEffect(() => {
    // when switching period, load that session if exists
    if (!isOpen) return;
    (async () => {
      try {
        const dateStr = format(date, "yyyy-LL-dd");
        const res = await getSessionWithBookings(dateStr, period);
        if (res) {
          setMaxCapacity(res.max_capacity);
          setApplicatorsText((res.applicators ?? []).join(", "));
          setStatus(res.status);
          setBookings(res.bookings ?? []);
        } else {
          // defaults
          setMaxCapacity(8);
          setApplicatorsText("");
          setStatus("open");
          setBookings([]);
        }
      } catch {
        // ignore
      }
    })();
  }, [period, isOpen, date]);

  async function handleSave() {
    if (maxCapacity < 8 || maxCapacity > 21) {
      toast.error("Capacidade deve ser entre 8 e 21");
      return;
    }
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-LL-dd");
      const applicators = applicatorsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await upsertSession({
        date: dateStr,
        period,
        max_capacity: maxCapacity,
        applicators,
        status,
      });
      const r = res as { error?: string | null };
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Sessão salva");
        onSaved?.();
      }
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sessão ${format(date, "dd/LL/yyyy")}`}
    >
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded ${period === "morning" ? "bg-slate-800 text-white" : "bg-slate-100"}`}
          onClick={() => setPeriod("morning")}
        >
          Manhã
        </button>
        <button
          className={`px-3 py-1 rounded ${period === "afternoon" ? "bg-slate-800 text-white" : "bg-slate-100"}`}
          onClick={() => setPeriod("afternoon")}
        >
          Tarde
        </button>
      </div>

      <div className="grid gap-3">
        <label className="text-sm">Capacidade</label>
        <input
          type="number"
          min={8}
          max={21}
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(Number(e.target.value))}
          className="border rounded p-2"
        />

        <label className="text-sm">Aplicadores (separados por vírgula)</label>
        <input
          value={applicatorsText}
          onChange={(e) => setApplicatorsText(e.target.value)}
          className="border rounded p-2"
          placeholder="Sgt Silva, Ten Souza"
        />

        <label className="text-sm">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "open" | "closed")}
          className="border rounded p-2"
        >
          <option value="open">Aberto</option>
          <option value="closed">Fechado</option>
        </select>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              // map bookings to BookingWithDetails-like shape for PDF generator
              const safeBookings = bookings.map((b) => ({
                ...b,
                user:
                  b.user ??
                  ({
                    id: "",
                    saram: "—",
                    full_name: "—",
                    rank: "—",
                    role: "user",
                    semester: "1",
                    created_at: "",
                    updated_at: "",
                  } as Profile),
              }));
              generateSessionPDF({
                date: format(date, "yyyy-LL-dd"),
                period,
                applicators: applicatorsText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                bookings: safeBookings as BookingWithDetails[],
              });
            }}
            disabled={bookings.length === 0}
            title={bookings.length === 0 ? "Nenhum inscrito" : "Imprimir lista"}
          >
            🖨️ Imprimir Lista
          </Button>

          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" isLoading={loading} onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
