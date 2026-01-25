import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  shadow = true,
  ...rest
}) => {
  return (
    <div
      className={`bg-white rounded-md p-4 ${shadow ? "shadow-sm" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
