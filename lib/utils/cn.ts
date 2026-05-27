import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Conditional class-name composer. Standard utility, used everywhere. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
