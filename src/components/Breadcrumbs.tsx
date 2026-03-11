/**
 * @page Breadcrumbs
 * @description Componente de breadcrumbs para navegação.
 * @path src/components/Breadcrumbs.tsx
 */



export default function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav className="text-sm text-slate-500 mb-3" aria-label="breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((it, idx) => (
          <li key={it} className="flex items-center">
            <span
              className={
                idx === items.length - 1 ? "text-slate-700 font-medium" : ""
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
