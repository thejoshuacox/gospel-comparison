import { GOSPEL_KEYS, type GospelEvent, type GospelKey } from "@/types/gospel";

export type SortMode = "chronological" | "matthean" | "markan" | "lukan" | "johannine";

function parseReferenceStart(reference: string | null): { chapter: number; verse: number } | null {
  if (!reference) {
    return null;
  }

  const cleaned = reference.replace(/[\[\]]/g, "");
  const match = cleaned.match(/(\d+):(\d+)/);
  if (!match) {
    return null;
  }

  return {
    chapter: Number(match[1]),
    verse: Number(match[2]),
  };
}

function getSortGospel(mode: SortMode): GospelKey | null {
  switch (mode) {
    case "matthean":
      return "matthew";
    case "markan":
      return "mark";
    case "lukan":
      return "luke";
    case "johannine":
      return "john";
    default:
      return null;
  }
}

export function filterEventsByIncludeExclude(
  events: GospelEvent[],
  included: GospelKey[],
  excluded: GospelKey[],
): GospelEvent[] {
  const includedSet = new Set(included);
  const excludedSet = new Set(excluded);

  return events.filter((event) => {
    const matchesIncluded =
      includedSet.size === 0 || GOSPEL_KEYS.some((gospel) => includedSet.has(gospel) && Boolean(event.references[gospel]));

    if (!matchesIncluded) {
      return false;
    }

    const matchesExcluded = GOSPEL_KEYS.some((gospel) => excludedSet.has(gospel) && Boolean(event.references[gospel]));

    return !matchesExcluded;
  });
}

export function sortEvents(events: GospelEvent[], mode: SortMode): GospelEvent[] {
  const gospel = getSortGospel(mode);

  if (!gospel) {
    return [...events].sort((a, b) => a.order - b.order);
  }

  const primary = events
    .filter((event) => Boolean(parseReferenceStart(event.references[gospel])))
    .sort((a, b) => {
      const aRef = parseReferenceStart(a.references[gospel]);
      const bRef = parseReferenceStart(b.references[gospel]);

      if (!aRef || !bRef) {
        return a.order - b.order;
      }

      if (aRef.chapter !== bRef.chapter) {
        return aRef.chapter - bRef.chapter;
      }
      if (aRef.verse !== bRef.verse) {
        return aRef.verse - bRef.verse;
      }
      return a.order - b.order;
    });

  const secondary = events
    .filter((event) => !parseReferenceStart(event.references[gospel]))
    .sort((a, b) => a.order - b.order);

  if (primary.length === 0 || secondary.length === 0) {
    return [...primary, ...secondary];
  }

  const primaryByChronological = [...primary].sort((a, b) => a.order - b.order);
  const primaryByChronologicalDesc = [...primaryByChronological].reverse();
  const selectedIndexById = new Map(primary.map((event, index) => [event.id, index]));
  const buckets: GospelEvent[][] = Array.from({ length: primary.length + 1 }, () => []);

  for (const event of secondary) {
    const previousChronologicalPrimary = primaryByChronologicalDesc.find(
      (primaryEvent) => primaryEvent.order <= event.order,
    );

    if (!previousChronologicalPrimary) {
      buckets[0].push(event);
      continue;
    }

    const selectedIndex = selectedIndexById.get(previousChronologicalPrimary.id) ?? -1;
    buckets[Math.max(0, selectedIndex + 1)].push(event);
  }

  const merged: GospelEvent[] = [];
  for (let i = 0; i < primary.length; i += 1) {
    merged.push(...buckets[i]);
    merged.push(primary[i]);
  }
  merged.push(...buckets[primary.length]);

  return merged;
}
