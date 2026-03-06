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
    className={`px-3 py-2 border rounded w-full text-gray-900 placeholder-gray-500 ${rest.className ?? ""}`}
  />
);

export default Input;
