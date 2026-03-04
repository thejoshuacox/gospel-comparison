import { type PassagePayload } from "@/types/gospel";
import { DEFAULT_TRANSLATION, SUPPORTED_TRANSLATIONS, translationSchema } from "@/lib/constants";
import { TtlCache } from "@/lib/cache";

const passageCache = new TtlCache<PassagePayload>(1000 * 60 * 10);
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        return response;
      }

      if (!RETRYABLE.has(response.status) || attempt >= retries) {
        return response;
      }
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }

    attempt += 1;
    await sleep(200 * attempt + Math.floor(Math.random() * 80));
  }
}

export function coerceTranslation(value: string | null | undefined): string {
  const parsed = translationSchema.safeParse((value ?? "").toLowerCase());
  return parsed.success ? parsed.data : DEFAULT_TRANSLATION;
}

export function listTranslations(): readonly string[] {
  return SUPPORTED_TRANSLATIONS;
}

export async function getPassage(reference: string, translation: string): Promise<PassagePayload> {
  const normalizedTranslation = coerceTranslation(translation);
  const cacheKey = `${reference}::${normalizedTranslation}`;
  const cached = passageCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const encodedRef = encodeURIComponent(reference);
  const url = `https://bible-api.com/${encodedRef}?translation=${normalizedTranslation}`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`Passage lookup failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    reference: string;
    text: string;
    verses?: Array<{
      book_id: string;
      book_name: string;
      chapter: number;
      verse: number;
      text: string;
    }>;
  };

  const payload: PassagePayload = {
    reference: data.reference,
    translation: normalizedTranslation,
    text: normalizeText(data.text ?? ""),
    verses: (data.verses ?? []).map((verse) => ({
      bookId: verse.book_id,
      bookName: verse.book_name,
      chapter: verse.chapter,
      verse: verse.verse,
      text: normalizeText(verse.text),
    })),
  };

  passageCache.set(cacheKey, payload);
  return payload;
}

