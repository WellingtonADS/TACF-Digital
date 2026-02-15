import Button from "@/components/ui/Button";
import { UserCog } from "@/components/ui/icons";
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
import { createProfile, deleteProfile, updateProfile } from "@/services/admin";
import type { Profile } from "@/types/database.types";
import toastUi from "@/utils/toast";
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

const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSaved,
}) => {
  const { profile: currentProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        rank: profile.rank,
        semester: profile.semester,
        email: profile.email ?? "",
        role: profile.role,
        active: profile.active ?? true,
      });
    } else {
      setFormData({
        full_name: "",
        rank: "",
        semester: "1", // Valor padrão corrigido
        email: "",
        role: "user",
        active: true,
      });
    }
  }, [profile, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    try {
      // Map form data into the shape expected by the API, normalizando nulls
      const payload = {
        full_name: formData.full_name || "",
        rank: formData.rank || "",
        semester: formData.semester || "1", // Valor padrão
        email: formData.email || null,
        role: formData.role || "user",
        active: formData.active ?? true,
      };

      let res;
      if (profile) {
        res = await updateProfile(profile.id, payload);
      } else {
        res = await createProfile(payload as unknown as Profile);
      }

      if (res.error) {
        toastUi.genericError(res.error);
      } else if (res.data) {
        if (profile) {
          toast.success("Perfil atualizado com sucesso!");

          const updatedProfile = {
            ...profile,
            ...res.data,
          } as Profile;

          onSaved(updatedProfile);
        } else {
          toast.success("Usuário criado com sucesso!");
          onSaved(res.data as Profile);
        }

        onClose(); // Fecha o modal após sucesso
      }
    } catch (err) {
      console.error(err);
      toastUi.genericError(
        profile ? "Erro ao atualizar perfil" : "Erro ao criar usuário",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={profile ? "Editar Dados do Militar" : "Criar Novo Usuário"}
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
              {profile ? "Editando" : "Criando"} Usuário
            </p>
            <p className="font-semibold text-slate-800">
              {profile?.full_name || "Novo Usuário"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome Completo */}
          <div className="md:col-span-2">
            <Input
              label="Nome Completo"
              value={formData.full_name || ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  full_name: e.target.value.toUpperCase(),
                }))
              }
            />
          </div>

          {/* Email */}
          <div>
            <Input
              label="Email"
              value={formData.email || ""}
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

          {/* Active Toggle (only admin may change and not self) */}
          {currentProfile?.role === "admin" &&
            profile?.id !== currentProfile?.id && (
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Status do Perfil
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...(p ?? {}), active: true }))
                    }
                    className={`px-3 py-1 rounded ${formData.active ? "bg-green-100 text-green-800" : "bg-white border"}`}
                  >
                    Ativar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...(p ?? {}), active: false }))
                    }
                    className={`px-3 py-1 rounded ${formData.active === false ? "bg-yellow-50 text-yellow-800" : "bg-white border"}`}
                  >
                    Inativar
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-50 mt-4">
          <div className="flex items-center gap-2 w-full">
            {currentProfile?.role === "admin" &&
              profile?.id !== currentProfile?.id && (
                <div className="flex-1">
                  <Button
                    variant="error"
                    type="button"
                    onClick={async () => {
                      if (!profile) return;
                      if (
                        !confirm("Tem certeza que deseja excluir este perfil?")
                      )
                        return;
                      setDeleting(true);
                      const res = await deleteProfile(profile.id);
                      setDeleting(false);
                      if (res?.error) {
                        toastUi.genericError(res.error);
                        return;
                      }
                      toast.success("Perfil excluído");
                      onClose();
                      onSaved({
                        ...(profile as Profile),
                        active: false,
                      } as Profile);
                    }}
                  >
                    {deleting ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>
              )}

            <div className="flex-1">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>

            <div className="flex-1">
              <Button
                type="submit"
                isLoading={loading}
                className="w-full shadow-lg shadow-primary/20"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default UserEditModal;
