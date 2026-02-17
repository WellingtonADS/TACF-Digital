import { CheckCircle2, Moon, Sun } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

type Props = {
  selectedPeriod: "morning" | "afternoon" | null;
  onSelect: (period: "morning" | "afternoon") => void;
  hasMorning: boolean;
  hasAfternoon: boolean;
};

export default function PeriodSelector({
  selectedPeriod,
  onSelect,
  hasMorning,
  hasAfternoon,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
        2. Escolha o Turno
      </label>
      <div className="space-y-3">
        <button
          onClick={() => hasMorning && onSelect("morning")}
          disabled={!hasMorning}
          className={cn(
            "w-full flex items-center p-4 rounded-xl border-2 transition-all group",
            !hasMorning
              ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-100"
              : selectedPeriod === "morning"
                ? "border-blue-600 bg-blue-50/50"
                : "border-slate-100 hover:border-blue-200 bg-white",
          )}
        >
          <div
            className={cn(
              "p-3 rounded-lg mr-4",
              selectedPeriod === "morning"
                ? "bg-blue-100 text-blue-600"
                : "bg-slate-100 text-slate-500",
            )}
          >
            <Sun size={24} />
          </div>
          <div className="text-left flex-1">
            <span className="block font-bold text-slate-900">
              Turno da Manhã
            </span>
            <span className="text-sm text-slate-500">Início às 08:00hs</span>
          </div>
          {!hasMorning && (
            <span className="text-xs font-bold text-red-400 px-2 py-1 bg-red-50 rounded">
              Indisponível
            </span>
          )}
          {selectedPeriod === "morning" && (
            <CheckCircle2 className="text-blue-600 w-6 h-6" />
          )}
        </button>

        <button
          onClick={() => hasAfternoon && onSelect("afternoon")}
          disabled={!hasAfternoon}
          className={cn(
            "w-full flex items-center p-4 rounded-xl border-2 transition-all group",
            !hasAfternoon
              ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-100"
              : selectedPeriod === "afternoon"
                ? "border-blue-600 bg-blue-50/50"
                : "border-slate-100 hover:border-blue-200 bg-white",
          )}
        >
          <div
            className={cn(
              "p-3 rounded-lg mr-4",
              selectedPeriod === "afternoon"
                ? "bg-blue-100 text-blue-600"
                : "bg-slate-100 text-slate-500",
            )}
          >
            <Moon size={24} />
          </div>
          <div className="text-left flex-1">
            <span className="block font-bold text-slate-900">
              Turno da Tarde
            </span>
            <span className="text-sm text-slate-500">Início às 13:30hs</span>
          </div>
          {!hasAfternoon && (
            <span className="text-xs font-bold text-red-400 px-2 py-1 bg-red-50 rounded">
              Indisponível
            </span>
          )}
          {selectedPeriod === "afternoon" && (
            <CheckCircle2 className="text-blue-600 w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
