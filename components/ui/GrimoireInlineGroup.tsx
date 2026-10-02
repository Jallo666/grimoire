import React from "react";

type Props = { children: React.ReactNode; style?: React.CSSProperties; className?: string };

export default function GrimoireInlineGroup({ children, style, className }: Props) {
  return (
    <div className={`d-flex gap-2 align-items-center${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}
