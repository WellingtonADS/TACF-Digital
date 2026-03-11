/**
 * @page Input
 * @description Campo de entrada reutilizável com tipagem.
 * @path src/components/atomic/Input.tsx
 */



import type { ChangeEvent } from "react";

type Native = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">;

type Props = Native & {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
};

export const Input = ({
  value = "",
  onChange,
  placeholder,
  ...rest
}: Props) => (
  <input
    {...rest}
    value={value}
    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
    placeholder={placeholder}
    className={`px-3 py-2 border rounded w-full bg-bg-card text-text-body placeholder-text-muted border-border-default focus-ring ${rest.className ?? ""}`}
  />
);

export default Input;
