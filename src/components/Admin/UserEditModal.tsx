import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/admin";
import type { Profile } from "@/types/database.types";
import toastUi from "@/utils/toast";
import { UserCog } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserEditModalProps {
  isOpen: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSaved: (updated: Profile) => void;
}

const RANKS = [
  "Coronel",
  "Tenente-Coronel",
  "Major",
  "Capitão",
  "Primeiro Tenente",
  "Segundo Tenente",
  "Aspirante",
  "Suboficial",
  "Primeiro Sargento",
  "Segundo Sargento",
  "Terceiro Sargento",
  "Cabo",
  "Soldado",
];

export default function UserEditModal({
  isOpen,
  profile,
  onClose,
  onSaved,
}: UserEditModalProps) {
  const { profile: currentProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        rank: profile.rank,
        saram: profile.saram,
        semester: profile.semester,
        email: profile.email ?? "",
        role: profile.role,
      });
    }
  }, [profile, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // Map form data into the shape expected by the API, normalizing nulls
      const updates = {
        full_name: formData.full_name ?? undefined,
        rank: formData.rank ?? undefined,
        saram: formData.saram ?? undefined,
        semester: formData.semester ?? undefined,
        email: formData.email ? formData.email : null,
        role: formData.role ?? undefined,
      };

      const res = await updateProfile(profile.id, updates);

      if (res.error) {
        toastUi.genericError(res.error);
      } else if (res.data) {
        toast.success("Perfil atualizado com sucesso!");

        // CORREÇÃO: Mesclamos o profile original com os dados novos
        // e forçamos o tipo para satisfazer o TypeScript
        const updatedProfile = {
          ...profile,
          ...res.data,
        } as Profile;

        onSaved(updatedProfile);
        onClose(); // Fecha o modal após sucesso
      }
    } catch (err) {
      console.error(err);
      toastUi.genericError("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Dados do Militar"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Header Visual */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
          <div className="p-2 bg-white rounded shadow-sm text-primary">
            <UserCog size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">
              Editando
            </p>
            <p className="font-semibold text-slate-800">{profile?.full_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome Completo */}
          <div className="md:col-span-2">
            <Input
              label="Nome Completo"
              value={formData.full_name ?? ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  full_name: e.target.value.toUpperCase(),
                }))
              }
            />
          </div>

          {/* SARAM */}
          <div>
            <Input
              label="SARAM"
              value={formData.saram ?? ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, saram: e.target.value }))
              }
            />
          </div>

          {/* Email */}
          <div>
            <Input
              label="Email"
              value={formData.email ?? ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  email: e.target.value.trim().toLowerCase(),
                }))
              }
            />
          </div>

          {/* Posto/Graduação */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">
              Posto/Graduação
            </label>
            <Select
              value={formData.rank}
              onValueChange={(val) => setFormData((p) => ({ ...p, rank: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANKS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Papel */}
          <div>
            <label className="text-sm font-semibold text-slate-700 ml-1">
              Papel
            </label>
            <Select
              value={formData.role}
              onValueChange={(val) =>
                setFormData((p) => ({ ...p, role: val as Profile["role"] }))
              }
            >
              <SelectTrigger disabled={profile?.id === currentProfile?.id}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="coordinator">Coordenador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {profile?.id === currentProfile?.id && (
              <p className="text-[10px] text-slate-400 ml-1">
                Não é permitido alterar seu próprio papel aqui.
              </p>
            )}
          </div>

          {/* Semestre */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">
              Semestre de Referência
            </label>
            <Select
              value={formData.semester}
              onValueChange={(val) =>
                // Casting seguro para garantir compatibilidade com o tipo '1' | '2'
                setFormData((p) => ({ ...p, semester: val as "1" | "2" }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  1º Semestre (Fevereiro - Maio)
                </SelectItem>
                <SelectItem value="2">
                  2º Semestre (Setembro - Novembro)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-400 ml-1">
              * Alterar isso afetará as regras de agendamento para este usuário.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-50 mt-4">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="w-1/3"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            className="w-2/3 shadow-lg shadow-primary/20"
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
