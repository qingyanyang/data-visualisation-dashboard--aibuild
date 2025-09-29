import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import z from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(email: string) {
  return email.split("@")[0].slice(0, 1).toUpperCase();
}

export const currencyToNumber = z.preprocess((val) => {
  if (typeof val === "string") {
    return Number(val.replace(/[^0-9.-]+/g, ""));
  }
  return val;
}, z.number().optional());
