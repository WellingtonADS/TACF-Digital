/**
 * @page Documents
 * @description Gerenciamento e listagem de documentos.
 * @path src/pages/Documents.tsx
 */



import { CARD_INTERACTIVE_CLASS } from "@/components/atomic/Card";
import Layout from "@/components/layout/Layout";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Shield,
  type LucideIcon,
} from "@/icons";
import AppIcon from "../components/atomic/AppIcon";

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
    subtitle: "Instrução do Comando da Aeronáutica - Atividades Físicas",
    href: "https://www.fab.mil.br/organizacoes/mostra/102",
    icon: BookOpen,
    tag: "Normativo",
  },
  {
    title: "NSCA 54-1",
    subtitle: "Norma de Sistema do Comando da Aeronáutica - Atividades Físicas",
    href: "https://www.fab.mil.br/organizacoes/mostra/102",
    icon: FileText,
    tag: "Normativo",
  },
  {
    title: "Port. n. 1.000/SCI",
    subtitle: "Portaria sobre índices de aptidão física - Atualização",
    icon: FileText,
    tag: "Portaria",
  },
  {
    title: "MCA 54-3",
    subtitle: "Manual do Comando da Aeronáutica - Avaliação Física Individual",
    icon: BookOpen,
    tag: "Manual",
  },
];

export default function Documents() {
  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Documentos e Normas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
            Acesse os principais documentos normativos do TACF.
          </p>
        </header>

        <section className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <AppIcon icon={Shield} size="md" tone="primary" />
            <p className="text-sm font-bold uppercase tracking-widest text-text-muted">
              Normativos
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {manuals.map((doc) => {
              const cardContent = (
                <>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <AppIcon icon={doc.icon} size="lg" tone="primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black uppercase tracking-tighter text-text-body">
                          {doc.title}
                        </h3>

                        {doc.tag && (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            {doc.tag}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">
                        {doc.subtitle}
                      </p>

                      {doc.href ? (
                        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary group-hover:underline">
                          Acessar
                          <AppIcon
                            icon={ExternalLink}
                            size="xs"
                            tone="primary"
                          />
                        </span>
                      ) : (
                        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                          Em breve
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );

              if (doc.href) {
                return (
                  <a
                    key={doc.title}
                    href={doc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${CARD_INTERACTIVE_CLASS} group rounded-2xl p-6`}
                  >
                    {cardContent}
                  </a>
                );
              }

              return (
                <article
                  key={doc.title}
                  className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-sm"
                >
                  {cardContent}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
}
