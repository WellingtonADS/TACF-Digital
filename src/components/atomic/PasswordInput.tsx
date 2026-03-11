/**
 * @page PasswordInput
 * @description Campo de senha com toggle de visibilidade.
 * @path src/components/atomic/PasswordInput.tsx
 */



import { Eye, EyeOff } from "@/icons";
import React, { useState } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const PasswordInput = ({ className = "", ...props }: Props) => {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        {...props}
        type={show ? "text" : "password"}
        onChange={props.onChange}
        className="w-full pl-5 pr-12 py-4 bg-bg-card text-text-body placeholder-text-muted rounded-xl border-none focus-ring transition-all outline-none font-medium"
      />

      <button
        type="button"
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body z-10 flex items-center justify-center h-9 w-9 bg-transparent rounded"
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default PasswordInput;
