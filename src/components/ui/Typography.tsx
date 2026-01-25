import React from "react";

export const H1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...rest
}) => (
  <h1 className={`text-2xl font-bold text-primary ${className}`} {...rest}>
    {children}
  </h1>
);

export const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...rest
}) => (
  <h2 className={`text-lg font-semibold text-slate-800 ${className}`} {...rest}>
    {children}
  </h2>
);

export const Body: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = "",
  ...rest
}) => (
  <p className={`text-base text-slate-700 ${className}`} {...rest}>
    {children}
  </p>
);

export const Caption: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  children,
  className = "",
  ...rest
}) => (
  <span className={`text-xs text-slate-500 ${className}`} {...rest}>
    {children}
  </span>
);

export default {
  H1,
  H2,
  Body,
  Caption,
};
