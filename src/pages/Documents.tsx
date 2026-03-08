import Layout from "@/components/layout/Layout";
import {
  Award,
  BookOpen,
  ExternalLink,
  FileText,
  Shield,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";

type DocItem = {
  title: string;
  subtitle: string;
  href?: string;
  icon: LucideIcon;
  tag?: string;
};

const manuals: DocItem[] = [
  {
    title: "ICA 54-2",
    subtitle: "Instrução do Comando da Aeronáutica — Atividades Físicas",
    href: "https://www.fab.mil.br/organizacoes/mostra/102",
    icon: BookOpen,
    tag: "Normativo",
  },
  {
    title: "NSCA 54-1",
    subtitle: "Norma de Sistema do Comando da Aeronáutica — Atividades Físicas",
    href: "https://www.fab.mil.br/organizacoes/mostra/102",
    icon: FileText,
    tag: "Normativo",
  },
  {
    title: "Port. n.º 1.000/SCI",
    subtitle: "Portaria sobre índices de aptidão física — Atualização",
    icon: FileText,
    tag: "Portaria",
  },
  {
    title: "MCA 54-3",
    subtitle: "Manual do Comando da Aeronáutica — Avaliação Física Individual",
    icon: BookOpen,
    tag: "Manual",
  },
];

export default function Documents() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={["Documentos"]} />

        <header className="mb-10">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-body dark:text-text-inverted tracking-tight">
            Documentos e Normas
          </h1>
          <p className="text-text-muted mt-1">
            Acesse os principais documentos normativos do TACF e seus
            certificados.
          </p>
        </header>

        {/* Manuais */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-primary" size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">
              Manuais e Normativos
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {manuals.map((doc) => (
              <div
                key={doc.title}
                className="group bg-bg-card dark:bg-bg-card rounded-2xl border border-border-default p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <doc.icon size={22} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-text-body dark:text-text-inverted uppercase tracking-tighter">
                        {doc.title}
                      </h3>
                      {doc.tag && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
                          {doc.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted dark:text-text-muted mt-1 leading-relaxed line-clamp-2">
                      {doc.subtitle}
                    </p>
                    {doc.href ? (
                      <a
                        href={doc.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
                      >
                        Acessar <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-text-muted uppercase tracking-wider cursor-not-allowed">
                        Em breve
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Certificados */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Award className="text-primary" size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">
              Meus Certificados
            </h2>
          </div>

          <div
            onClick={() => navigate("/app/ticket")}
            className="group cursor-pointer bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 md:p-8 text-text-inverted flex items-center justify-between hover:opacity-95 transition-opacity shadow-xl shadow-primary/20"
          >
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <Ticket size={28} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                  Comprovante de Agendamento
                </p>
                <h3 className="text-xl font-black mt-1 tracking-tight">
                  Bilhete Digital
                </h3>
                <p className="text-text-inverted/60 text-xs mt-1">
                  Acesse seu comprovante com QR Code validável
                </p>
              </div>
            </div>
            <ExternalLink
              size={20}
              className="opacity-60 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </section>
      </div>
    </Layout>
  );
}
