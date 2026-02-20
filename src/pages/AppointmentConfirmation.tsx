import supabase from "@/services/supabase";
import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageSkeleton from "../components/PageSkeleton";
import Layout from "../layout/Layout";

export const AppointmentConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  type LocationState = { bookingId?: string };
  const bookingIdFromState = (location.state as LocationState)?.bookingId;
  const urlParams = new URLSearchParams(location.search);
  const bookingIdFromQuery = urlParams.get("bookingId");
  const bookingId = bookingIdFromState ?? bookingIdFromQuery ?? null;

  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<import("@/types/database.types").Database['public']['Tables']['bookings']['Row'] | null>(null);
  const [session, setSession] = useState<import("@/types/database.types").Database['public']['Tables']['sessions']['Row'] | null>(null);
  const [profile, setProfile] = useState<import("@/types/database.types").Database['public']['Tables']['profiles']['Row'] | null>(null);

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) return;
      setLoading(true);
      try {
        const { data: bData, error: bErr } = await supabase
          .from("bookings")
          .select(
            "id, user_id, session_id, test_date, order_number, score, result_details",
          )
          .eq("id", bookingId)
          .maybeSingle();

        if (bErr || !bData) {
          setBooking(null);
          setSession(null);
          setProfile(null);
          return;
        }

        setBooking(bData);

        const { data: sData } = await supabase
          .from("sessions")
          .select("id, date, period, max_capacity")
          .eq("id", bData.session_id)
          .maybeSingle();

        setSession(sData ?? null);

        const { data: pData } = await supabase
          .from("profiles")
          .select("id, full_name, war_name, saram, rank, sector")
          .eq("id", bData.user_id)
          .maybeSingle();

        setProfile(pData ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [bookingId]);

  function handleBack() {
    navigate(-1);
  }

  function handleConfirm() {
    toast.success("Agendamento confirmado. Bilhete gerado.");
    navigate("/app");
  }

  if (!bookingId) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">Agendamento não encontrado.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main>
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Revisar Agendamento
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
            <div className="p-8 md:p-10">
              {loading ? (
                <PageSkeleton rows={6} />
              ) : (
                <div className="space-y-8">
                  <section>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                      Militar
                    </label>
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="text-primary/80 text-3xl">
                        <CheckCircle size={28} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {profile?.war_name ?? profile?.full_name ?? "--"}
                        </p>
                        <p className="text-sm text-slate-600">
                          SARAM: {profile?.saram ?? "--"} • Posto/Graduação:{" "}
                          {profile?.rank ?? "--"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                      Local da Avaliação
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="text-primary" size={18} />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          Grupamento de Apoio de Canoas (GPAC)
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Canoas, RS - Vila Militar
                        </p>
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                        Data e Hora
                      </label>
                      <div className="flex items-center gap-3">
                        <Calendar className="text-primary/70" size={18} />
                        <span className="text-lg font-bold text-slate-900">
                          {session?.date
                            ? new Date(session.date).toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                },
                              )
                            : "--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Clock className="text-primary/70" size={18} />
                        <span className="text-lg font-bold text-primary">
                          {session?.period ?? "--"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                        Requisitos
                      </label>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="text-emerald-500" size={16} />{" "}
                          Uniforme de TAF completo
                        </li>
                        <li className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="text-emerald-500" size={16} />{" "}
                          Documento de Identidade Original
                        </li>
                        <li className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="text-emerald-500" size={16} />{" "}
                          Atestado Médico (se aplicável)
                        </li>
                      </ul>
                    </div>
                  </div>

                  {booking?.order_number && (
                    <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-700">
                      Bilhete gerado: <strong>{booking.order_number}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              <button
                onClick={handleBack}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Voltar e Editar
              </button>
              <button
                onClick={handleConfirm}
                onMouseEnter={() => import("./DigitalTicket")}
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <span className="text-sm font-bold uppercase tracking-widest">
                  Confirmar Agendamento
                </span>
                <CheckCircle size={18} />
              </button>
            </div>
          </div>

          <p className="text-center mt-8 text-sm text-slate-500">
            Problemas com o agendamento?{" "}
            <a className="text-primary font-semibold underline" href="#">
              Contatar a Seção de Preparo
            </a>
            .
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default AppointmentConfirmation;
