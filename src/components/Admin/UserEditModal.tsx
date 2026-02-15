import useUserForm from "@/hooks/useUserForm";
import type { Profile } from "@/types/database.types";
import { Dialog } from "@headlessui/react";
import React from "react";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";
import UserForm from "./UserForm";

export type Props = {
  open: boolean;
  onClose: () => void;
  profile?: Profile | null;
  onSaved?: (p: Profile) => void;
};

export default function UserEditModal({
  open,
  onClose,
  profile,
  onSaved,
}: Props) {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const {
    formData,
    setFormData,
    loading,
    deleting,
    handleSubmit,
    handleDelete,
  } = useUserForm({ profile });

  const submit = async () => {
    await handleSubmit((p) => onSaved?.(p), onClose);
  };

  const doDelete = async () => {
    await handleDelete(onClose);
  };

  const isNew = !profile;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium">
            {isNew ? "Criar usuário" : "Editar usuário"}
          </Dialog.Title>
          <div className="mt-4">
            <UserForm
              formData={formData}
              setFormData={setFormData}
              loading={loading}
              deleting={deleting}
              onSubmit={submit}
              onDelete={doDelete}
              isNew={isNew}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
          <ConfirmModal
            open={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={doDelete}
            title="Confirmação"
            description="Confirma exclusão do usuário?"
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
