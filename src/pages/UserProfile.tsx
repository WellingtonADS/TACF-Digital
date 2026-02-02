import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { H1, Body } from "@/components/ui/Typography";
import { useAuth } from "@/contexts/AuthContext";
import { upsertProfile, supabase } from "@/services/supabase"; // Importar supabase aqui
import { User, Save, Building2, Badge, Hash, Mail, Phone } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { getCurrentSemester } from "@/utils/seasonal";

const RANKS = [
  "Coronel", "Tenente-Coronel", "Major", "Capitão",
  "Primeiro Tenente", "Segundo Tenente", "Aspirante", "Suboficial",
  "Primeiro Sargento", "Segundo Sargento", "Terceiro Sargento",
  "Cabo", "Soldado"
];

export default function UserProfile() {
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    saram: "",
    war_name: "",
    sector: "",
    phone_number: "",
    full_name: "",
    rank: "",
    email: "", // Novo estado para controlar o email
    semester: getCurrentSemester(),
  });

  useEffect(() => {
    if (profile && user) {
      setFormData({
        saram: profile.saram || "",
        war_name: profile.war_name || "",
        sector: profile.sector || "",
        phone_number: profile.phone_number || "",
        full_name: profile.full_name || "",
        rank: profile.rank || "",
        email: user.email || "", // Inicializa com o email do Auth
        semester: profile.semester || getCurrentSemester(),
      });
    }
  }, [profile, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // 1. Atualiza dados do Perfil (Tabela Profiles)
      const { error: profileError } = await upsertProfile({
        id: user.id,
        saram: formData.saram,
        war_name: formData.war_name.toUpperCase(),
        sector: formData.sector.toUpperCase(),
        phone_number: formData.phone_number,
        full_name: formData.full_name.toUpperCase(),
        rank: formData.rank,
        semester: formData.semester,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // 2. Verifica se houve troca de e-mail (Tabela Auth)
      if (formData.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (authError) {
          toast.warning("Perfil salvo, mas erro ao atualizar e-mail: " + authError.message);
        } else {
          toast.success("Perfil salvo! Verifique seu novo e-mail para confirmar a troca.");
        }
      } else {
        toast.success("Dados atualizados com sucesso!");
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      <div>
        <H1>Meu Perfil</H1>
        <Body className="text-slate-500">Mantenha seus dados atualizados para a correta identificação.</Body>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <User size={18} className="text-primary"/> Dados Cadastrais
          </h2>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LINHA 1: Nome Completo */}
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  icon={<User size={18}/>}
                  className="uppercase"
                  placeholder="EX: JOÃO TESTE"
                  required
                />
              </div>

              {/* LINHA 2: Nome de Guerra | SARAM */}
              <Input
                label="Nome de Guerra"
                value={formData.war_name}
                onChange={(e) => setFormData({...formData, war_name: e.target.value})}
                icon={<Badge size={18}/>}
                className="uppercase"
                placeholder="EX: SGT SILVA"
                required
              />

              <Input
                label="SARAM"
                value={formData.saram}
                onChange={(e) => setFormData({...formData, saram: e.target.value})}
                icon={<Hash size={18}/>}
                placeholder="0000000"
                required
              />
              
              {/* LINHA 3: Posto | Setor */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Posto / Graduação</label>
                <Select 
                  value={formData.rank} 
                  onValueChange={(v) => setFormData({...formData, rank: v})}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Input
                label="Setor / OM"
                value={formData.sector}
                onChange={(e) => setFormData({...formData, sector: e.target.value})}
                icon={<Building2 size={18}/>}
                className="uppercase"
                placeholder="EX: GAP-MN"
                required
              />

              {/* LINHA 4: Telefone | Email (Agora Editável) */}
              <Input
                label="Telefone Celular"
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value.replace(/\D/g, "")})}
                icon={<Phone size={18}/>}
                placeholder="000000000"
                maxLength={15}
                required
              />

              <div>
                <Input
                  label="Email de Login"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  icon={<Mail size={18}/>}
                  placeholder="exemplo@fab.mil.br"
                  // Removido disabled/readOnly e classes de bloqueio
                />
                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                  * Alterar o e-mail exigirá uma nova confirmação.
                </p>
              </div>

              {/* Semestre */}
              <div className="md:col-span-2 pt-2 mt-2 border-t border-slate-50">
                  <div className="max-w-[200px]">
                    <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Semestre Vigente</label>
                    <Select 
                    value={formData.semester} 
                    onValueChange={(v) => setFormData({...formData, semester: v as "1"|"2"})}
                    >
                    <SelectTrigger className="h-8 text-xs bg-slate-50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1º Semestre</SelectItem>
                        <SelectItem value="2">2º Semestre</SelectItem>
                    </SelectContent>
                    </Select>
                  </div>
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" isLoading={loading} className="shadow-lg shadow-primary/20 bg-[#1B365D] hover:bg-[#1B365D]/90">
                <Save size={18} /> Salvar Alterações
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}