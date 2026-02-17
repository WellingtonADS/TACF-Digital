import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import Button from "./Button";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onClose={onCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </DialogTitle>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {message}
          </p>
          <div className="mt-6 flex gap-3 justify-end">
            <Button variant="outline" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button
              variant={isDangerous ? "destructive" : "default"}
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
