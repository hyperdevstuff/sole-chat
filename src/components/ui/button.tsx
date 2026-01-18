import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-95 transition-transform duration-75";
    
    const variants = {
      primary: "bg-accent text-accent-foreground hover:opacity-90 shadow-sm",
      secondary: "bg-surface-elevated text-foreground border border-border hover:bg-surface-sunken shadow-sm",
      danger: "bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm",
      ghost: "bg-transparent text-foreground hover:bg-surface-elevated",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    const variantStyles = variants[variant];
    const sizeStyles = sizes[size];

    const combinedClassName = `${baseStyles} ${variantStyles} ${sizeStyles} ${className}`.trim();

    return (
      <button
        ref={ref}
        className={combinedClassName}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
