import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn("h-10 w-full rounded-md border border-border bg-black px-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary", className)}
    {...props}
  />
));
Select.displayName = "Select";
