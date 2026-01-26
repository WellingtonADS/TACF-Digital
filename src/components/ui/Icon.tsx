import type { LucideIcon, LucideProps } from "lucide-react";
import React from "react";

interface IconProps extends Omit<LucideProps, "ref"> {
  as: LucideIcon | React.ElementType;
}

export const Icon: React.FC<IconProps> = ({
  as: IconComponent,
  size = 20,
  className = "",
  ...rest
}) => {
  const Comp = IconComponent as React.ElementType;

  return <Comp size={size} className={className} {...rest} />;
};

export default Icon;
