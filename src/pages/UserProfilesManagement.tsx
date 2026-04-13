/**
 * @page UserProfilesManagement
 * @description Gestão de perfis de usuário e papéis.
 * @path src/pages/UserProfilesManagement.tsx
 */

import PasswordInput from "@/components/atomic/PasswordInput";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import { getProfileById } from "@/services/personnel";
import { Award, Calendar, CheckCircle, Key, ShieldCheck, User } from "@/icons";
import type { Profile } from "@/types";
import { formatDateShortPtBr, formatDateTimePtBr } from "@/utils/date";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
import { differenceInYears, isAfter, parseISO } from "date-fns";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase, upsertProfile } from "../services/supabase";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

type PerfilUsuarioView = Profile & {
  inspsau_valid_until?: string | null;
  inspsau_last_inspection?: string | null;
  birth_date?: string | null;
  physical_group?: string | null;
};

export default function UserProfilesManagement() {
  const {
    user,
    profile: perfilAutenticado,
    loading: autenticacaoCarregando,
  } = useAuth();
  const [perfil, setPerfil] = useState<PerfilUsuarioView | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  useEffect(() => {
    if (autenticacaoCarregando) return;
    // Prefere o perfil já carregado por `useAuth` para evitar nova busca.
    if (perfilAutenticado) {
      setPerfil(perfilAutenticado);
      return;
    }
    carregarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticacaoCarregando, user?.id, perfilAutenticado]);

  async function carregarPerfil() {
    if (!user?.id) {
      setPerfil(null);
      return;
    }

    setCarregando(true);
    try {
      const data = (await getProfileById(user.id)) as PerfilUsuarioView | null;
      setPerfil(data ?? null);
    } catch (err) {
      console.error(err);
      setPerfil(null);
      toast.error("Não foi possível carregar seu perfil.");
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo<K extends keyof PerfilUsuarioView>(
    campo: K,
    valor: PerfilUsuarioView[K],
  ) {
    setPerfil((estadoAtual) =>
      estadoAtual ? { ...estadoAtual, [campo]: valor } : estadoAtual,
    );
  }

  async function salvarPerfil(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!perfil) return;
    if (!user?.id) {
      toast.error("Usuário não autenticado.");
      return;
    }

    // validações obrigatórias para conclusão do cadastro militar
    const nomeGuerra = perfil.war_name?.trim() ?? "";
    const saram = onlyDigits(perfil.saram ?? "");
    const rank = perfil.rank?.trim() ?? "";
    const setor = perfil.sector?.trim() ?? "";
    const email = perfil.email?.trim().toLowerCase() ?? "";
    const phone = formatPhone(perfil.phone_number ?? "");

    if (!perfil.full_name || !email) {
      toast.error("Preencha nome e e-mail antes de salvar.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    if (saram.length !== 7) {
      toast.error("SARAM deve conter 7 números.");
      return;
    }

    if (!nomeGuerra || !saram || !rank || !setor) {
      toast.error(
        "Para concluir o cadastro, preencha: Nome de Guerra, SARAM, Posto/Graduação e Setor.",
      );
      return;
    }

    setSalvando(true);
    try {
      const { data, error } = await upsertProfile({
        id: user.id,
        full_name: perfil.full_name?.trim(),
        email,
        rank,
        saram,
        war_name: nomeGuerra,
        phone_number: phone,
        sector: setor,
      });

      if (error) {
        toast.error("Erro ao salvar: " + error.message);
      } else {
        toast.success("Alterações salvas com sucesso.");
        const saved = (Array.isArray(data) ? data[0] : data) as
          | PerfilUsuarioView
          | null
          | undefined;
        setPerfil(saved ?? perfil);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Erro ao salvar o perfil.");
    } finally {
      setSalvando(false);
    }
  }

  async function alterarSenha(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    if (!novaSenha) {
      toast.error("Informe a nova senha.");
      return;
    }

    if (novaSenha.length < 8) {
      toast.error("Senha deve ter ao menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmacaoSenha) {
      toast.error("Senhas não conferem.");
      return;
    }

    setAlterandoSenha(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });
      if (error) {
        toast.error(getAuthErrorMessage(error, "Erro ao alterar senha."));
      } else {
        toast.success("Senha alterada com sucesso.");
        setMostrarAlterarSenha(false);
        setNovaSenha("");
        setConfirmacaoSenha("");
      }
    } catch (err) {
      console.error(err);
      toast.error(getAuthErrorMessage(err, "Erro ao alterar senha."));
    } finally {
      setAlterandoSenha(false);
    }
  }

  const ultimoAcesso = user?.last_sign_in_at
    ? formatDateTimePtBr(user.last_sign_in_at)
    : "--";

  // Evita cintilação: se já existe perfil em memória, renderiza direto.
  if ((autenticacaoCarregando || carregando) && !perfil) {
    return <FullPageLoading message="Carregando perfil" />;
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Gerenciamento de Perfil
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
            Atualize suas informações pessoais e militares para o TACF.
          </p>
        </header>

        <div className="w-full text-xs sm:text-sm text-text-muted bg-bg-card px-4 py-2 rounded-lg border border-border-default mb-6">
          Último acesso: {ultimoAcesso}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Coluna esquerda: resumo do perfil */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-bg-card rounded-3xl shadow-sm border border-border-default p-4 md:p-8 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mb-4">
                <span className="text-xl md:text-3xl font-black text-primary tracking-tight">
                  {(perfil?.war_name ?? perfil?.full_name ?? "?")
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">
                {perfil?.war_name ?? perfil?.full_name ?? "--"}
              </h3>
              <p className="text-sm text-text-muted font-medium">
                {perfil?.rank ?? "--"}
              </p>

              {/* Indicador de status */}
              <div className="mt-5 w-full">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                  Status de Aptidão
                </p>
                {perfil?.inspsau_valid_until ? (
                  isAfter(parseISO(perfil.inspsau_valid_until), new Date()) ? (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-success/20 bg-success/10 px-4 py-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wide text-success">
                        Apto para o TACF
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-error/20 bg-error/10 px-4 py-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-error" />
                      <span className="text-xs font-bold uppercase tracking-wide text-error">
                        Inapto
                      </span>
                    </div>
                  )
                ) : (
                  <div className="bg-bg-card border border-border-default py-3 px-4 rounded-2xl flex items-center justify-center gap-2">
                    <span className="font-bold text-text-muted text-xs uppercase tracking-wide">
                      Não informado
                    </span>
                  </div>
                )}
              </div>

              {/* Idade e grupo */}
              <div className="mt-6 grid grid-cols-2 gap-4 w-full pt-6 border-t border-border-default">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-text-muted uppercase">
                    Idade
                  </p>
                  <p className="font-bold text-text-body text-lg">
                    {perfil?.birth_date
                      ? differenceInYears(
                          new Date(),
                          parseISO(perfil.birth_date),
                        )
                      : "--"}
                  </p>
                </div>
                <div className="text-center border-l border-border-default">
                  <p className="text-[10px] font-bold text-text-muted uppercase">
                    Grupo
                  </p>
                  <p className="font-bold text-text-body text-lg">
                    {perfil?.physical_group ?? "--"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita: formulário */}
          <div className="flex-1">
            <div className="bg-bg-card rounded-3xl shadow-2xl border border-border-default/50 p-4 md:p-8 lg:p-10">
              <form className="space-y-10" onSubmit={salvarPerfil}>
                <p className="text-xs text-text-muted">
                  Campos com <span className="font-bold">*</span> são
                  obrigatórios para concluir o cadastro.
                </p>

                <section>
                  <div className="flex items-center gap-3 mb-6 border-b border-border-default pb-4">
                    <User className="w-5 h-5 text-primary" />
                    <h4 className="font-bold text-text-body tracking-wider">
                      DADOS PESSOAIS
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Nome Completo *
                      </label>
                      <input
                        value={perfil?.full_name ?? ""}
                        onChange={(e) =>
                          atualizarCampo("full_name", e.target.value)
                        }
                        className="w-full bg-bg-card border-border-default rounded-lg p-3 text-text-body focus-ring transition-all"
                        type="text"
                        placeholder="Ex.: João da Silva"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        E-mail Institucional *
                      </label>
                      <input
                        value={perfil?.email ?? ""}
                        onChange={(e) =>
                          atualizarCampo("email", e.target.value)
                        }
                        className="w-full bg-bg-card border-border-default rounded-lg p-3 text-text-body focus-ring transition-all"
                        type="email"
                        placeholder="Ex.: joao.silva@fab.mil.br"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Telefone / WhatsApp
                      </label>
                      <input
                        value={perfil?.phone_number ?? ""}
                        onChange={(e) =>
                          atualizarCampo(
                            "phone_number",
                            formatPhone(e.target.value),
                          )
                        }
                        className="w-full bg-bg-card border-border-default rounded-lg p-3 text-text-body focus-ring transition-all"
                        type="tel"
                        inputMode="numeric"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6 border-b border-border-default pb-4">
                    <Award className="w-5 h-5 text-primary" />
                    <h4 className="font-bold text-text-body tracking-wider">
                      DADOS MILITARES
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Nome de Guerra *
                      </label>
                      <input
                        value={perfil?.war_name ?? ""}
                        onChange={(e) =>
                          atualizarCampo("war_name", e.target.value)
                        }
                        className="w-full bg-bg-card border-border-default rounded-lg p-3 text-text-body focus-ring transition-all"
                        type="text"
                        placeholder="Ex.: SILVA"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        SARAM *
                      </label>
                      <input
                        value={perfil?.saram ?? ""}
                        onChange={(e) =>
                          atualizarCampo(
                            "saram",
                            onlyDigits(e.target.value).slice(0, 7),
                          )
                        }
                        className="w-full bg-bg-card border-border-default rounded-lg p-3 text-text-body focus-ring transition-all"
                        type="text"
                        placeholder="Ex.: 1234567"
                        inputMode="numeric"
                        maxLength={7}
                        pattern="[0-9]{7}"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Posto/Graduação *
                      </label>
                      <select
                        value={perfil?.rank ?? ""}
                        onChange={(e) =>
                          atualizarCampo("rank", e.target.value)
                        }
                        className="w-full bg-bg-card border-border-default rounded-lg p-3 text-text-body focus-ring transition-all"
                        required
                        title="Posto/Graduação"
                        aria-label="Posto/Graduação"
                      >
                        <option value="">Selecione...</option>
                        <option value="Soldado">Soldado</option>
                        <option value="Cabo">Cabo</option>
                        <option value="3º Sargento">3º Sargento</option>
                        <option value="2º Sargento">2º Sargento</option>
                        <option value="1º Sargento">1º Sargento</option>
                        <option value="Subtenente">Subtenente</option>
                        <option value="Aspirante">Aspirante</option>
                        <option value="2º Tenente">2º Tenente</option>
                        <option value="1º Tenente">1º Tenente</option>
                        <option value="Capitão">Capitão</option>
                        <option value="Major">Major</option>
                        <option value="Coronel">Coronel</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        OM / Setor *
                      </label>
                      <input
                        value={perfil?.sector ?? ""}
                        onChange={(e) =>
                          atualizarCampo("sector", e.target.value)
                        }
                        className="w-full bg-bg-card border-border-default rounded-lg p-3 text-text-body focus-ring transition-all"
                        type="text"
                        placeholder="Ex.: 2º/10º GAV"
                        required
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3 border-b border-border-default pb-4">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h4 className="font-bold text-text-body tracking-wider">
                      SAÚDE
                    </h4>
                    <span className="sm:ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">
                      Apenas Visualização
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-bg-card p-6 rounded-2xl border border-dashed border-border-default">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-bg-card rounded-xl flex items-center justify-center shadow-sm border border-border-default">
                        <Calendar className="w-6 h-6 text-text-muted" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          Última Inspeção
                        </p>
                        <p className="font-semibold text-text-body">
                          {perfil?.inspsau_last_inspection
                            ? formatDateShortPtBr(
                                perfil.inspsau_last_inspection,
                              )
                            : "--"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-bg-card rounded-xl flex items-center justify-center shadow-sm border border-border-default">
                        <CheckCircle className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          Validade da INSPSAU
                        </p>
                        <p className="font-semibold text-text-body">
                          {perfil?.inspsau_valid_until
                            ? formatDateShortPtBr(perfil.inspsau_valid_until)
                            : "--"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="pt-6 border-t border-border-default">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-bg-card rounded-full flex items-center justify-center">
                        <Key className="w-5 h-5 text-text-muted" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-body">
                          Segurança da Conta
                        </h4>
                        <p className="text-xs text-text-muted">
                          Última alteração de senha há 3 meses.
                        </p>
                      </div>
                    </div>
                    {!mostrarAlterarSenha ? (
                      <button
                        type="button"
                        onClick={() => setMostrarAlterarSenha(true)}
                        className="w-full md:w-auto px-6 py-2 border border-border-default rounded-lg text-sm font-bold text-primary hover:bg-bg-card transition-colors uppercase tracking-widest"
                      >
                        Alterar Senha
                      </button>
                    ) : (
                      <div className="w-full md:w-auto mt-4 bg-bg-card p-4 rounded-2xl border border-border-default">
                        <form
                          onSubmit={alterarSenha}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"
                        >
                          <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-text-muted uppercase mb-2">
                              Nova senha
                            </label>
                            <PasswordInput
                              value={novaSenha}
                              onChange={(e) => setNovaSenha(e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-text-muted uppercase mb-2">
                              Confirme a nova senha
                            </label>
                            <PasswordInput
                              value={confirmacaoSenha}
                              onChange={(e) =>
                                setConfirmacaoSenha(e.target.value)
                              }
                            />
                          </div>

                          <div className="md:col-span-2 flex justify-end gap-3 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setMostrarAlterarSenha(false);
                                setNovaSenha("");
                                setConfirmacaoSenha("");
                              }}
                              className="px-4 py-2 text-sm font-bold text-text-muted rounded-lg border border-border-default"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={alterandoSenha}
                              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-bold"
                            >
                              {alterandoSenha
                                ? "SALVANDO..."
                                : "SALVAR SENHA"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </section>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8">
                  <button
                    type="button"
                    onClick={() => carregarPerfil()}
                    className="w-full sm:w-auto px-8 py-4 text-text-muted font-bold uppercase tracking-widest text-sm hover:text-text-body transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {salvando ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
