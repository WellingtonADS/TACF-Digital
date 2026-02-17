import { CheckCircle2, Info } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

type Props = {
  selectedTaf: "1" | "2";
  onSelect: (taf: "1" | "2") => void;
};

export default function TafSelector({ selectedTaf, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
        1. Selecione a Referência <Info size={14} className="text-slate-400" />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelect("1")}
          className={cn(
            "relative p-4 rounded-xl border-2 text-left transition-all",
            selectedTaf === "1"
              ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20"
              : "border-slate-100 hover:border-slate-200 bg-white",
          )}
        >
          <span className="block text-lg font-bold text-slate-900">TAF 1</span>
          <span className="text-xs text-slate-500 font-medium">
            1º Semestre
          </span>
          {selectedTaf === "1" && (
            <CheckCircle2 className="absolute top-4 right-4 text-blue-600 w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => onSelect("2")}
          className={cn(
            "relative p-4 rounded-xl border-2 text-left transition-all",
            selectedTaf === "2"
              ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20"
              : "border-slate-100 hover:border-slate-200 bg-white",
          )}
        >
          <span className="block text-lg font-bold text-slate-900">TAF 2</span>
          <span className="text-xs text-slate-500 font-medium">
            2º Semestre
          </span>
          {selectedTaf === "2" && (
            <CheckCircle2 className="absolute top-4 right-4 text-blue-600 w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
