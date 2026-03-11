export const STATUS_OPTIONS = [
  "all",
  "active",
  "maintenance",
  "inactive",
] as const;

export const OM_STATUS = {
  active: {
    label: "ATIVO",
    labelLong: "Ativo",
    description: "Em plena operação",
    bar: "bg-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
    accent: "border-l-primary",
    editorAccent: "border-primary bg-primary/10 text-primary",
  },
  maintenance: {
    label: "MANUT",
    labelLong: "Manutenção",
    description: "Temporariamente fora",
    bar: "bg-secondary",
    badge: "bg-secondary/10 text-secondary border-secondary/20",
    accent: "border-l-secondary",
    editorAccent: "border-secondary bg-secondary/10 text-secondary",
  },
  inactive: {
    label: "INATIVO",
    labelLong: "Inativo",
    description: "Desativado",
    bar: "bg-text-muted",
    badge: "bg-bg-default text-text-muted border-border-default",
    accent: "border-l-border-default",
    editorAccent: "border-border-default bg-bg-default text-text-muted",
  },
} as const;

export type OmStatusKey = keyof typeof OM_STATUS;
