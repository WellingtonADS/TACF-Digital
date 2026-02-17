import type { ChangeEvent } from "react";

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
};

export const Input = ({ value = "", onChange, placeholder }: Props) => (
  <input
    value={value}
    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
    placeholder={placeholder}
    className="px-3 py-2 border rounded w-full"
  />
);

export default Input;
