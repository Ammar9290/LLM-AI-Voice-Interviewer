import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" };
export default function Button({ variant = "primary", ...props }: Props) {
  return <button {...props} className={`button ${variant === "primary" ? "primary" : "ghost"} ${props.className||""}`} />;
}