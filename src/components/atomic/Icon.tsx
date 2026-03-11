/**
 * @page Icon
 * @description Componente SVG genérico para ícones.
 * @path src/components/atomic/Icon.tsx
 */



import type { SVGProps } from "react";

export const Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width="20"
    height="20"
    {...props}
  />
);

export default Icon;
