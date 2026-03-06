export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  variant?: string;
}

export const Button = ({
  icon,
  children,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      {...props}
      className={`flex items-center justify-center gap-2 ${
        className ?? "px-3 py-2 rounded bg-sky-600 text-white"
      }`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
