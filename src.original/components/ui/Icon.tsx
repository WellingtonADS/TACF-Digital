import React from "react";

interface IconProps {
  as: React.ElementType;
  size?: number;
  className?: string;
  [key: string]: unknown;
}

export const Icon: React.FC<IconProps> = ({
  as: IconComponent,
  size = 20,
  className = "",
  ...rest
}) => {
  const Comp = IconComponent as React.ElementType;
  return <Comp style={{ fontSize: size }} className={className} {...rest} />;
};

export default Icon;
