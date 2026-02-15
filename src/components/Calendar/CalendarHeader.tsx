import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "@/components/ui/icons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CalendarHeader({
  current,
  onPrev,
  onNext,
}: {
  current: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl text-primary hidden sm:block">
          <CalendarIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 capitalize">
            {format(current, "MMMM", { locale: ptBR })}
          </h2>
          <p className="text-slate-500 font-medium">
            {format(current, "yyyy")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
        <button
          aria-label="previous-month"
          className="h-9 w-9 p-0"
          onClick={onPrev}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="w-px h-5 bg-slate-200" />
        <button
          aria-label="next-month"
          className="h-9 w-9 p-0"
          onClick={onNext}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
