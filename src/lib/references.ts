import { GOSPEL_KEYS, type GospelKey } from "@/types/gospel";
import { GOSPEL_LABELS, REFERENCE_PATTERN } from "@/lib/constants";

const NON_VALUES = new Set(["", "n/a", "na", "none", "-"]);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function cleanCellValue(raw: string | null | undefined): string {
  if (!raw) {
    return "";
  }

  return raw.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function isReferenceValue(raw: string): boolean {
  const cleaned = cleanReference(raw);
  if (!cleaned) {
    return false;
  }

  return REFERENCE_PATTERN.test(cleaned);
}

export function cleanReference(raw: string | null | undefined): string {
  const value = cleanCellValue(raw).replace(/[\[\]]/g, "");

  if (!value || NON_VALUES.has(value.toLowerCase())) {
    return "";
  }

  return value;
}

export function toCanonicalReference(gospel: GospelKey, raw: string | null | undefined): string | null {
  const cleaned = cleanReference(raw);
  if (!cleaned) {
    return null;
  }

  return `${GOSPEL_LABELS[gospel]} ${cleaned}`;
}

export function parseGospelKey(value: string): GospelKey | null {
  const lower = value.toLowerCase();
  return GOSPEL_KEYS.find((item) => item === lower) ?? null;
}

