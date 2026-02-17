import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  onClick?: () => void;
};

export const Button = ({ children, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded bg-sky-600 text-white"
    >
      {children}
    </button>
  );
};

export default Button;
