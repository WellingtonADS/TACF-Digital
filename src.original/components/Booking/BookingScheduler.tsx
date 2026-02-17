import { ArrowRight } from "@/components/ui/icons";
import { useState } from "react";
import Button from "../ui/Button";
import { Card } from "../ui/Card";

interface BookingSchedulerProps {
  onComplete?: (data: { date: string; time: string }) => void;
  isLoading?: boolean;
}

type Step = "date" | "time" | "confirmation";

export function BookingScheduler({
  onComplete,
  isLoading = false,
}: BookingSchedulerProps) {
  const [currentStep, setCurrentStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const handleNext = () => {
    if (currentStep === "date" && selectedDate) {
      setCurrentStep("time");
    } else if (currentStep === "time" && selectedTime) {
      setCurrentStep("confirmation");
    }
  };

  const handleConfirm = () => {
    if (onComplete) {
      onComplete({ date: selectedDate, time: selectedTime });
    }
  };

  const steps = ["Data e Hora", "Confirmação", "Ticket"];

  return (
    <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm p-8 max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  idx < steps.length - 1
                    ? currentStep === steps[idx].toLowerCase()
                      ? "bg-primary text-white"
                      : "bg-slate-200 text-slate-600"
                    : currentStep === steps[idx].toLowerCase()
                      ? "bg-primary text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {idx + 1}
              </div>
              <p className="ml-3 text-sm font-medium text-slate-700">{step}</p>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-slate-200 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {currentStep === "date" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Selecione a Data
            </h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {currentStep === "time" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Selecione o Horário
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {["08:00", "10:00", "14:00", "16:00"].map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedTime === time
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-primary/50"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "confirmation" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Confirme seu Agendamento
            </h3>
            <div className="bg-slate-50 p-6 rounded-lg space-y-2">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Data:</span> {selectedDate}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Horário:</span> {selectedTime}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        {currentStep !== "date" && (
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === "time") setCurrentStep("date");
              if (currentStep === "confirmation") setCurrentStep("time");
            }}
          >
            Voltar
          </Button>
        )}
        {currentStep !== "confirmation" && (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === "date" && !selectedDate) ||
              (currentStep === "time" && !selectedTime) ||
              isLoading
            }
          >
            Próximo <ArrowRight size={18} className="ml-2" />
          </Button>
        )}
        {currentStep === "confirmation" && (
          <Button onClick={handleConfirm} isLoading={isLoading}>
            Confirmar Agendamento
          </Button>
        )}
      </div>
    </Card>
  );
}

export default BookingScheduler;
