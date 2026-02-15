import { Body, H1, H2 } from "@/components/ui/Typography";
import { useSessions } from "@/hooks/useSessions";
import { updateSessionScores } from "@/services/api";
import { supabase } from "@/services/supabase";
import { Booking, Profile, SessionWithBookings } from "@/types/database.types";
import { ArrowBack, Check, Groups, Search } from "@mui/icons-material";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

interface BookingWithProfile extends Booking {
  profile: Profile;
  attendance_confirmed?: boolean;
}

export default function ScoreEntryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");

  const [session, setSession] = useState<SessionWithBookings | null>(null);
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { sessions } = useSessions();

  // Carrega a sessão e seus agendamentos
  useEffect(() => {
    if (!sessionIdParam) {
      toast.error("ID da sessão não fornecido");
      navigate("/admin/sessions");
      return;
    }

    const fetchSessionDetails = async () => {
      setLoading(true);
      try {
        // Buscar sessão
        const foundSession = sessions.find((s) => s.id === sessionIdParam);
        if (!foundSession) {
          toast.error("Sessão não encontrada");
          navigate("/admin/sessions");
          return;
        }
        setSession(foundSession);

        // Buscar agendamentos com perfis
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*, profiles!inner(*)")
          .eq("session_id", sessionIdParam)
          .eq("status", "confirmed");

        if (bookingsError) throw bookingsError;

        const bookingsWithProfiles: BookingWithProfile[] = (
          bookingsData || []
        ).map((b) => ({
          ...(b as Booking & { profiles: Profile }),
          profile: (b as { profiles: Profile }).profiles,
          attendance_confirmed: (b as Booking).attendance_confirmed ?? false,
        }));

        setBookings(bookingsWithProfiles);
        if (bookingsWithProfiles.length > 0) {
          setSelectedUserId(bookingsWithProfiles[0].user_id);
        }
      } catch (err) {
        const error = err as { message?: string };
        if (import.meta.env.DEV) {
          console.error("Erro ao carregar detalhes da sessão:", err);
        }
        toast.error(error.message || "Erro ao carregar dados da sessão");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionIdParam, sessions, navigate]);

  const filteredBookings = bookings.filter(
    (b) =>
      b.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.profile.saram?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const confirmedCount = bookings.filter((b) => b.attendance_confirmed).length;

  const handleConfirmAttendance = async (userId: string) => {
    if (!session) return;
    setConfirmingId(userId);
    try {
      const res = await updateSessionScores(session.id, userId, true);
      if (!res.success) {
        throw new Error(res.error || "Falha ao confirmar presenca");
      }
      setBookings((prev) =>
        prev.map((b) =>
          b.user_id === userId ? { ...b, attendance_confirmed: true } : b,
        ),
      );
      toast.success("Presenca confirmada");
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao confirmar presenca");
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Body>Carregando...</Body>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Body>Sessão não encontrada</Body>
      </div>
    );
  }

  const selectedBooking = bookings.find((b) => b.user_id === selectedUserId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/sessions")}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              type="button"
            >
              <ArrowBack />
            </button>
            <div>
              <H1 className="text-xl font-bold tracking-tight text-white">
                Confirmação de Presença
              </H1>
              <Body className="text-xs text-white/70 font-medium">
                {session.date
                  ? format(new Date(session.date), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })
                  : "Data não definida"}{" "}
                - {session.period === "morning" ? "Manhã" : "Tarde"}
              </Body>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <Body className="text-sm font-semibold leading-tight text-white">
                Administrador FAB
              </Body>
              <Body className="text-[10px] text-white/60 uppercase tracking-widest">
                Gestão de Presença
              </Body>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Military List */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-xl border border-primary/5 overflow-hidden">
              <div className="p-5 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                <H2 className="font-bold text-primary flex items-center gap-2">
                  <Groups />
                  Militares Agendados
                </H2>
                <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full">
                  {confirmedCount} / {bookings.length}
                </span>
              </div>

              {/* Search Bar */}
              <div className="p-4 bg-slate-50 border-b border-primary/10">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400 text-sm" />
                  <input
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                    placeholder="Buscar por nome ou SARAM..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* List of Attendees */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredBookings.length === 0 ? (
                  <Body className="p-4 text-center text-slate-500">
                    Nenhum militar encontrado
                  </Body>
                ) : (
                  filteredBookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedUserId(booking.user_id)}
                      className={`flex items-center gap-4 p-4 border-l-4 w-full text-left transition-all ${
                        selectedUserId === booking.user_id
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                      type="button"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          booking.attendance_confirmed
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {booking.attendance_confirmed ? (
                          <Check />
                        ) : (
                          <span className="text-xs font-bold">
                            {booking.profile.rank?.substring(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Body className="text-sm font-bold truncate">
                          {booking.profile.rank}{" "}
                          {booking.profile.war_name ||
                            booking.profile.full_name}
                        </Body>
                        <Body className="text-[10px] text-slate-500 font-mono">
                          SARAM: {booking.profile.saram || "N/A"}
                        </Body>
                      </div>
                      {booking.attendance_confirmed && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-bold rounded uppercase">
                          Confirmado
                        </span>
                      )}
                      {!booking.attendance_confirmed && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-bold rounded uppercase">
                          Pendente
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* Right Column: Details */}
          <section className="lg:col-span-8 xl:col-span-9 space-y-6">
            <div className="bg-white rounded-xl shadow-xl border border-primary/5 p-8">
              {selectedBooking ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <H1 className="text-2xl font-bold text-slate-900">
                        {selectedBooking.profile.rank}{" "}
                        {selectedBooking.profile.war_name ||
                          selectedBooking.profile.full_name}
                      </H1>
                      <Body className="text-slate-500 mt-1">
                        SARAM:{" "}
                        {selectedBooking.profile.saram || "Não informado"}
                      </Body>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg font-bold text-sm ${
                        selectedBooking.attendance_confirmed
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {selectedBooking.attendance_confirmed
                        ? "Presença Confirmada"
                        : "Aguardando Confirmação"}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <H2 className="text-lg font-semibold mb-4">
                      Informações do Militar
                    </H2>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase">
                          Nome Completo
                        </dt>
                        <dd className="text-sm font-medium mt-1">
                          {selectedBooking.profile.full_name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase">
                          Posto/Graduação
                        </dt>
                        <dd className="text-sm font-medium mt-1">
                          {selectedBooking.profile.rank}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase">
                          Setor
                        </dt>
                        <dd className="text-sm font-medium mt-1">
                          {selectedBooking.profile.sector || "Não informado"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase">
                          Semestre
                        </dt>
                        <dd className="text-sm font-medium mt-1">
                          {selectedBooking.profile.semester}º Semestre
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border-t border-slate-200 pt-6 flex justify-end gap-4">
                    {!selectedBooking.attendance_confirmed && (
                      <button
                        onClick={() =>
                          handleConfirmAttendance(selectedBooking.user_id)
                        }
                        disabled={confirmingId === selectedBooking.user_id}
                        className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                        type="button"
                      >
                        {confirmingId === selectedBooking.user_id
                          ? "Confirmando..."
                          : "Confirmar Presença"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <Body className="text-center text-slate-500 py-12">
                  Selecione um militar na lista para ver os detalhes
                </Body>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
