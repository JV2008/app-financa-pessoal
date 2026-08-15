import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "income" | "expense";
  className?: string;
}

export function Badge({ children, variant = "expense", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
        className
      )}
    >
      {children}
    </span>
  );
}
