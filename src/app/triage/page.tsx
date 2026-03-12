import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import reportJson from "../../../data/blind-spots-report.json";
import { GapTriage } from "@/components/gap-triage";
import type { BlindSpotsReport, GapAssignment } from "@/types/blind-spots";

function isTriageEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_TRIAGE === "true";
}

type GapTriageExport = {
  gaps?: Array<{
    id?: string;
    assignment?: GapAssignment;
  }>;
};

async function loadInitialAssignments(): Promise<Record<string, GapAssignment>> {
  const filePath = path.join(process.cwd(), "data", "gap-triage-export.json");

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as GapTriageExport;
    const assignments: Record<string, GapAssignment> = {};

    for (const gap of parsed.gaps ?? []) {
      if (!gap.id || !gap.assignment) {
        continue;
      }
      assignments[gap.id] = gap.assignment;
    }

    return assignments;
  } catch {
    return {};
  }
}

export default async function TriagePage() {
  if (!isTriageEnabled()) {
    notFound();
  }

  const initialAssignments = await loadInitialAssignments();

  return <GapTriage report={reportJson as BlindSpotsReport} initialAssignments={initialAssignments} />;
}
