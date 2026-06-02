import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "₹0 Cr";
  return `₹${value.toFixed(1).replace(/\.0$/, "")} Cr`;
}
