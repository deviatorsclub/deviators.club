import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes Indian mobile number to a clean 10-digit string.
 * Strips non-digits, leading zeroes (e.g. 09876543210 -> 9876543210),
 * and country code 91 if 12 digits (e.g. +91 9876543210 -> 9876543210).
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  let digits = raw.trim().replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  // Strip all leading zeros
  digits = digits.replace(/^0+/, "");
  // If user entered 11+ digits, take the trailing 10 digits
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
}

/**
 * Validates if the normalized phone is a legitimate 10-digit mobile number.
 */
export function isValidPhone(raw: string): boolean {
  const norm = normalizePhone(raw);
  return norm.length === 10 && /^[6-9]\d{9}$/.test(norm);
}

/**
 * Normalizes College ID / Roll Number.
 * Trims whitespace, removes internal dashes/spaces, and uppercases.
 */
export function normalizeRollNo(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s\-_]/g, "");
}
