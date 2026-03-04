import { type CompareColumn, type ComparePayload, GOSPEL_KEYS } from "@/types/gospel";
import { getEventById } from "@/lib/events";
import { getPassage } from "@/lib/bible-api";
import { toCanonicalReference } from "@/lib/references";

export async function getComparePayload(eventId: string, translation: string): Promise<ComparePayload | null> {
  const event = getEventById(eventId);
  if (!event) {
    return null;
  }

  const columns = await Promise.all(
    GOSPEL_KEYS.map(async (gospel): Promise<CompareColumn> => {
      const rawRef = event.references[gospel];
      const reference = toCanonicalReference(gospel, rawRef);

      if (!reference) {
        return {
          gospel,
          reference: null,
          status: "missing",
          passage: null,
          error: null,
        };
      }

      try {
        const passage = await getPassage(reference, translation);
        return {
          gospel,
          reference,
          status: "ok",
          passage,
          error: null,
        };
      } catch (error) {
        return {
          gospel,
          reference,
          status: "error",
          passage: null,
          error: error instanceof Error ? error.message : "Unable to load passage.",
        };
      }
    }),
  );

  return {
    event,
    translation,
    columns,
  };
}

