import { Eye, EyeOff } from "lucide-react";
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
        className="w-full pl-5 pr-12 py-4 bg-gray-100 !text-gray-900 !placeholder-gray-500 rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
      />

      <button
        type="button"
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10 flex items-center justify-center h-9 w-9 bg-transparent rounded"
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default PasswordInput;
