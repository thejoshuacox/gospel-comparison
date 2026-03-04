import { z } from "zod";
import { GOSPEL_KEYS, type GospelKey } from "@/types/gospel";

export const SOURCE_URL = "https://www.ecatholic2000.com/gospels.shtml";
export const PARSER_VERSION = "1.0.0";

export const SUPPORTED_TRANSLATIONS = ["web", "kjv", "asv"] as const;
export const DEFAULT_TRANSLATION = "web";

export const translationSchema = z.enum(SUPPORTED_TRANSLATIONS);

export const REFERENCE_PATTERN = /^\[?\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?(?:,(?:\d{1,3}:)?\d{1,3}(?:[-–]\d{1,3})?)*\]?$/;

export const GOSPEL_LABELS: Record<GospelKey, string> = {
  matthew: "Matthew",
  mark: "Mark",
  luke: "Luke",
  john: "John",
};

export const GOSPEL_ORDER = GOSPEL_KEYS;

