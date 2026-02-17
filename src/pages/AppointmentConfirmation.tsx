import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "../layout/Layout";

export const AppointmentConfirmation = () => {
  const navigate = useNavigate();

  function handleBack() {
    navigate(-1);
  }

  function handleConfirm() {
    toast.success("Agendamento confirmado. Bilhete gerado.");
    navigate("/app");
  }

  return (
    <Layout>
      <main>
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Revisar Agendamento
            </h2>

            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                  <CheckCircle size={14} />
                </div>
                <span className="text-sm font-semibold text-emerald-600">
                  Seleção
                </span>
              </div>
              <div className="h-px w-12 bg-emerald-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <span className="text-sm font-bold text-primary">
                  Confirmação
                </span>
              </div>
              <div className="h-px w-12 bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <span className="text-sm font-semibold text-slate-400">
                  Finalizado
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
            <div className="p-8 md:p-10">
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
                        1T SILVA
                      </p>
                      <p className="text-sm text-slate-600">
                        SARAM: 7654321 • Posto/Graduação: Primeiro-Tenente
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
                        25 de Outubro de 2023
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Clock className="text-primary/70" size={18} />
                      <span className="text-lg font-bold text-primary">
                        08:30h
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
              </div>
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
