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

export function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hex = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + ("000000".substring(0, 6 - hex.length) + hex);
}
