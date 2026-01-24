import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { updateProfile } from "@/services/admin";
import type { Profile } from "@/types/database.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function UserEditModal({
  isOpen,
  profile,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSaved?: (updated: Profile) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [rank, setRank] = useState("");
  const [saram, setSaram] = useState("");
  const [semester, setSemester] = useState<"1" | "2">("1");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setRank(profile.rank ?? "");
    setSaram(profile.saram ?? "");
    setSemester(profile.semester ?? "1");
  }, [profile]);

  async function handleSave() {
    if (!profile) return;
    if (!saram.trim()) {
      toast.error("SARAM não pode ficar vazio");
      return;
    }
    setLoading(true);
    try {
      const res = await updateProfile(profile.id, {
        full_name: fullName,
        rank,
        saram,
        semester,
      });

      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        toast.success("Perfil atualizado");
        onSaved?.(res.data as Profile);
        onClose();
      }
    } catch {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  }

  function handleCopySaram() {
    if (!saram) return;
    navigator.clipboard.writeText(saram).then(() => {
      toast.success("SARAM copiado");
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={profile ? "Editar Perfil" : "Editar"}
    >
      <div className="grid gap-3">
        <Input
          label="SARAM"
          value={saram}
          onChange={(e) => setSaram(e.target.value)}
        />
        <div className="flex gap-2">
          <Input
            label="Posto / Grad"
            value={rank}
            onChange={(e) => setRank(e.target.value)}
          />
          <Input
            label="Semestre"
            value={semester}
            onChange={(e) => setSemester(e.target.value as "1" | "2")}
          />
        </div>
        <Input
          label="Nome Completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCopySaram} disabled={!saram}>
            📋 Copiar SARAM
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={loading}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
