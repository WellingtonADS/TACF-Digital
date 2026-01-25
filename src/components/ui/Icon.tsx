import React from "react";

interface IconProps extends React.HTMLAttributes<HTMLElement> {
  as: React.ElementType;
  size?: number | string;
}

export const Icon: React.FC<IconProps> = ({
  as: IconComponent,
  size = 20,
  className = "",
  ...rest
}) => {
  const C = IconComponent as React.ElementType;
  return (
    <C
      size={size}
      className={className}
      {...(rest as Record<string, unknown>)}
    />
  );
};

export default Icon;
