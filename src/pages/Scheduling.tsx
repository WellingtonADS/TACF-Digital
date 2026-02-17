import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Hash,
  HelpCircle,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../layout/Layout";

export const Scheduling = () => {
  const navigate = useNavigate();

  function handleContinue() {
    navigate("/app/agendamentos/confirmacao");
  }

  return (
    <Layout>
      <main>
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
            Novo Agendamento
          </h2>
          <p className="text-slate-500 text-sm">
            Selecione uma data disponível para a realização do seu Teste de
            Avaliação de Condicionamento Físico.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-4xl mx-auto relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white ring-8 ring-white/90">
                <Calendar size={16} />
              </div>
              <span className="mt-2 text-xs font-bold text-primary uppercase tracking-tighter">
                Data e Hora
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 ring-8 ring-white/90">
                <Check size={16} />
              </div>
              <span className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-tighter">
                Confirmação
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 ring-8 ring-white/90">
                <Hash size={16} />
              </div>
              <span className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-tighter">
                Ticket
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Calendar */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Calendário de Testes
                </h3>
                <p className="text-sm text-slate-400">Outubro 2023</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div
                    key={d}
                    className="py-2 text-xs font-bold text-slate-400 uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3">
                {/* Simplified days layout - placeholders */}
                {Array.from({ length: 28 }).map((_, i) => {
                  const day = i + 1;
                  const isDisabled = [1, 2, 3, 4, 5, 11, 12].includes(day);
                  const isSelected = day === 6;
                  const hasDot = [8, 14, 17].includes(day);
                  if (isDisabled)
                    return (
                      <div
                        key={i}
                        className="aspect-square flex items-center justify-center text-slate-300"
                      >
                        {day}
                      </div>
                    );
                  return (
                    <button
                      key={i}
                      className={`aspect-square rounded-xl flex items-center justify-center font-medium ${isSelected ? "bg-primary text-white shadow-lg ring-4 ring-primary/20" : "text-slate-700 hover:bg-slate-50 transition-all"}`}
                    >
                      {day}
                      {hasDot && (
                        <span className="absolute bottom-2 w-1 h-1 rounded-full bg-primary"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex gap-6 items-center justify-center border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-3 h-3 rounded-full bg-primary" /> Selecionado
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-3 h-3 rounded-full bg-slate-200" /> Disponível
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-3 h-3 rounded-full bg-slate-100 opacity-50" />{" "}
                Indisponível
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-6 bg-primary text-white">
                <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 mb-1 uppercase">
                  Detalhes da Sessão
                </p>
                <h3 className="text-xl font-bold">06 de Outubro, 2023</h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Localização
                    </p>
                    <p className="text-slate-900 font-semibold">
                      Pista de Atletismo - HACO
                    </p>
                    <p className="text-xs text-slate-500">
                      Hospital de Aeronáutica de Canoas
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Horários Disponíveis
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <button className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-primary bg-primary/5">
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-primary" />
                        <span className="font-bold text-slate-900">07:30</span>
                      </div>
                      <div className="px-3 py-1 bg-military-green text-[10px] font-bold text-white rounded-full uppercase">
                        Vagas: 12/40
                      </div>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-slate-400" />
                        <span className="font-semibold text-slate-600">
                          08:30
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-military-green text-[10px] font-bold text-white rounded-full uppercase">
                        Vagas: 28/40
                      </div>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 cursor-not-allowed opacity-70">
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-slate-300" />
                        <span className="font-semibold text-slate-400">
                          09:30
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-military-red text-[10px] font-bold text-white rounded-full uppercase">
                        Vagas Esgotadas
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              onMouseEnter={() => import("./AppointmentConfirmation")}
              className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
            >
              CONTINUAR PARA CONFIRMAÇÃO
              <ChevronRight size={18} />
            </button>

            <p className="text-center text-xs text-slate-400 px-4">
              Ao continuar, você reserva provisoriamente este horário. A
              confirmação final será gerada na próxima etapa.
            </p>
          </div>
        </div>

        <footer className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 pb-12">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-slate-400" />
              <span className="text-sm text-slate-500 font-medium">
                Suporte Técnico
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              <span className="text-sm text-slate-500 font-medium">
                ICA 54-2
              </span>
            </div>
          </div>
          <div className="text-sm text-slate-400 italic">
            SISTEMA DE AVALIAÇÃO DO CONDICIONAMENTO FÍSICO DIGITAL © 2023
          </div>
        </footer>
      </main>
    </Layout>
  );
};

export default Scheduling;
