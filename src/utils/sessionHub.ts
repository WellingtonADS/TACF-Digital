const HUB_TABS = ["sessoes", "reagendamentos", "indices", "locais"] as const;

export type SessionHubTab = (typeof HUB_TABS)[number];

const HUB_TAB_SET = new Set<string>(HUB_TABS);

export function parseSessionHubTab(
  value: string | null | undefined,
): SessionHubTab {
  if (!value) return "sessoes";
  return HUB_TAB_SET.has(value) ? (value as SessionHubTab) : "sessoes";
}

export function buildSessionHubPath(
  tab: SessionHubTab,
  params?: {
    sessionId?: string | null;
    locationId?: string | null;
    mode?: string | null;
  },
): string {
  const search = new URLSearchParams();
  search.set("tab", tab);

  if (params?.sessionId) search.set("sessionId", params.sessionId);
  if (params?.locationId) search.set("locationId", params.locationId);
  if (params?.mode) search.set("mode", params.mode);

  return `/app/sessoes?${search.toString()}`;
}
