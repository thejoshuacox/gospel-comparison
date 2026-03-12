import { writeFile } from "node:fs/promises";
import path from "node:path";
import { parseEcatholicTable } from "@/lib/import/parseEcatholic";
import { SOURCE_URL } from "@/lib/constants";

async function run(): Promise<void> {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "GospelComparisonImporter/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch source (${response.status})`);
  }

  const html = await response.text();
  const { events, report } = parseEcatholicTable(html);

  const dataPath = path.join(process.cwd(), "data", "gospel-events.json");
  const reportPath = path.join(process.cwd(), "data", "import-report.json");

  await writeFile(dataPath, `${JSON.stringify(events, null, 2)}\n`, "utf8");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  process.stdout.write(`Imported ${events.length} events. Warnings: ${report.warnings.length}.\n`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

