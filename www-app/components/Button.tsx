import Link from "next/link";
import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outlined" | "outlined-white";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-foam-accent hover:bg-foam-accent-hover text-white shadow-level-1 hover:shadow-level-2 hover:-translate-y-0.5",
  secondary:
    "bg-foam-bg-secondary hover:bg-foam-border text-foam-text hover:shadow-level-1 hover:-translate-y-0.5",
  ghost:
    "bg-transparent hover:bg-foam-accent-subtle text-foam-accent hover:-translate-y-0.5",
  outlined:
    "bg-transparent border border-foam-accent text-foam-accent hover:bg-foam-accent-subtle hover:-translate-y-0.5",
  "outlined-white":
    "bg-transparent border border-white text-white hover:bg-white/10 hover:-translate-y-0.5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm px-4 py-2",
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-7 py-3.5",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-body font-semibold rounded-pill transition-all duration-200 cursor-pointer select-none";
  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${
    disabled ? "opacity-50 cursor-not-allowed" : ""
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
