/**
 * @page Breadcrumbs
 * @description Componente de breadcrumbs para navegação.
 * @path src/components/Breadcrumbs.tsx
 */

export default function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav className="mb-3 text-sm text-text-muted" aria-label="breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((it, idx) => (
          <li key={it} className="flex items-center">
            <span
              className={
                idx === items.length - 1 ? "font-medium text-text-body" : ""
              }
            >
              {it}
            </span>
            {idx < items.length - 1 && <span className="mx-2">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
