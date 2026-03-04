import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  onClick?: () => void;
  variant?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
};

export const Button = ({
  children,
  onClick,
  disabled,
  type = "button",
  className,
}: Props) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className ?? "px-3 py-2 rounded bg-sky-600 text-white"}
    >
      {children}
    </button>
  );
};

export default Button;
