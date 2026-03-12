import * as cheerio from "cheerio";
import { REFERENCE_PATTERN } from "@/lib/constants";
import { cleanCellValue, cleanReference, isReferenceValue, slugify } from "@/lib/references";
import { type GospelEvent, type GospelRefs } from "@/types/gospel";

export type ParseReport = {
  rowsParsed: number;
  warnings: string[];
  unresolvedRows: string[];
};

function extractRefs(cells: string[]): GospelRefs {
  return {
    matthew: cleanReference(cells[2]),
    mark: cleanReference(cells[3]),
    luke: cleanReference(cells[4]),
    john: cleanReference(cells[5]),
  };
}

function hasAnyReference(refs: GospelRefs): boolean {
  return Object.values(refs).some(Boolean);
}

function parseLocation(raw: string): string | null {
  const value = cleanCellValue(raw);
  if (!value || value.toLowerCase() === "n/a") {
    return null;
  }

  return value;
}

export function parseEcatholicTable(html: string): { events: GospelEvent[]; report: ParseReport } {
  const $ = cheerio.load(html);
  const table = $("#gospelComparisonTable");

  if (!table.length) {
    throw new Error("Could not find #gospelComparisonTable in source HTML.");
  }

  const events: GospelEvent[] = [];
  const warnings: string[] = [];
  const unresolvedRows: string[] = [];
  const ids = new Set<string>();

  table
    .find("tr")
    .slice(1)
    .each((index, row) => {
      const cells = $(row)
        .find("td")
        .map((_, cell) => cleanCellValue($(cell).text()))
        .get();

      if (cells.length < 6) {
        unresolvedRows.push(`Row ${index + 1}: expected 6 columns, found ${cells.length}`);
        return;
      }

      const title = cleanCellValue(cells[0]);
      const location = parseLocation(cells[1]);
      if (!title) {
        unresolvedRows.push(`Row ${index + 1}: missing title`);
        return;
      }

      const refs = extractRefs(cells);
      if (!hasAnyReference(refs)) {
        warnings.push(`Row ${index + 1} (${title}): no gospel references`);
      }

      for (const [key, value] of Object.entries(refs)) {
        if (!value) {
          continue;
        }

        if (!isReferenceValue(value)) {
          warnings.push(`Row ${index + 1} (${title}): non-standard ${key} reference '${value}'`);
        }

        if (!REFERENCE_PATTERN.test(value)) {
          warnings.push(`Row ${index + 1} (${title}): failed strict validation for ${key} '${value}'`);
        }
      }

      let id = slugify(title);
      if (!id) {
        id = `event-${index + 1}`;
      }

      if (ids.has(id)) {
        let suffix = 2;
        while (ids.has(`${id}-${suffix}`)) {
          suffix += 1;
        }
        id = `${id}-${suffix}`;
      }

      ids.add(id);

      events.push({
        id,
        title,
        location,
        order: events.length + 1,
        references: refs,
      });
    });

  return {
    events,
    report: {
      rowsParsed: events.length,
      warnings,
      unresolvedRows,
    },
  };
}

