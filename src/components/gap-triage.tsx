"use client";

import { useEffect, useMemo, useState } from "react";
import type { BlindSpotsReport, GapAssignment, GapItem } from "@/types/blind-spots";
import { GOSPEL_ORDER, GOSPEL_LABELS } from "@/lib/constants";
import type { GospelKey } from "@/types/gospel";

const STORAGE_KEY = "gospel-gap-triage-v1";

const CATEGORY_OPTIONS = [
  "Uncategorized",
  "Teaching",
  "Parable",
  "Miracle",
  "Travel/Setting",
  "Dialogue",
  "Passion/Resurrection",
  "Need New Event",
  "Merge Into Existing Event",
] as const;

type Props = {
  report: BlindSpotsReport;
  initialAssignments?: Record<string, GapAssignment>;
};

function buildGapItems(report: BlindSpotsReport): GapItem[] {
  const items: GapItem[] = [];

  for (const gospel of GOSPEL_ORDER) {
    const chapters = report.detail[gospel];
    for (const chapterInfo of chapters) {
      for (const range of chapterInfo.missingRanges) {
        items.push({
          id: `${gospel}:${chapterInfo.chapter}:${range.startVerse}-${range.endVerse}`,
          gospel,
          chapter: chapterInfo.chapter,
          startVerse: range.startVerse,
          endVerse: range.endVerse,
          count: range.count,
        });
      }
    }
  }

  return items;
}

function defaultAssignment(): GapAssignment {
  return {
    category: "Uncategorized",
    status: "todo",
    notes: "",
  };
}

export function GapTriage({ report, initialAssignments = {} }: Props) {
  const [assignments, setAssignments] = useState<Record<string, GapAssignment>>(initialAssignments);
  const [gospelFilter, setGospelFilter] = useState<GospelKey | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "todo" | "done">("all");

  const allItems = useMemo(() => buildGapItems(report), [report]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw) as Record<string, GapAssignment>;
        if (Object.keys(parsed).length > 0) {
          setAssignments(parsed);
        }
      } catch {
        // Ignore malformed local storage payload.
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (gospelFilter !== "all" && item.gospel !== gospelFilter) {
        return false;
      }
      const assignment = assignments[item.id] ?? defaultAssignment();
      if (statusFilter !== "all" && assignment.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [allItems, gospelFilter, statusFilter, assignments]);

  const doneCount = useMemo(
    () => allItems.filter((item) => (assignments[item.id] ?? defaultAssignment()).status === "done").length,
    [allItems, assignments],
  );

  const uncategorizedCount = useMemo(
    () =>
      allItems.filter(
        (item) => (assignments[item.id] ?? defaultAssignment()).category === "Uncategorized",
      ).length,
    [allItems, assignments],
  );

  function setAssignment(id: string, next: Partial<GapAssignment>): void {
    setAssignments((current) => {
      const existing = current[id] ?? defaultAssignment();
      return {
        ...current,
        [id]: {
          ...existing,
          ...next,
        },
      };
    });
  }

  function resetLocalData(): void {
    setAssignments(initialAssignments);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function exportAssignments(): void {
    const payload = {
      exportedAt: new Date().toISOString(),
      source: report.source,
      generatedAt: report.generatedAt,
      totals: {
        totalGaps: allItems.length,
        done: doneCount,
        uncategorized: uncategorizedCount,
      },
      gaps: allItems.map((item) => ({
        ...item,
        assignment: assignments[item.id] ?? defaultAssignment(),
      })),
    };

    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gap-triage-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="container triage-page">
      <header className="page-header">
        <div>
          <h1>Gap Triage Mode</h1>
          <p>Temporary internal tool for categorizing blind spots before production cleanup.</p>
        </div>
      </header>

      <section className="triage-meta">
        <p>
          <strong>Total gaps:</strong> {allItems.length}
        </p>
        <p>
          <strong>Done:</strong> {doneCount}
        </p>
        <p>
          <strong>Uncategorized:</strong> {uncategorizedCount}
        </p>
      </section>

      <section className="triage-toolbar">
        <label>
          <span>Gospel</span>
          <select value={gospelFilter} onChange={(event) => setGospelFilter(event.target.value as GospelKey | "all")}>
            <option value="all">All</option>
            {GOSPEL_ORDER.map((gospel) => (
              <option key={gospel} value={gospel}>
                {GOSPEL_LABELS[gospel]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "todo" | "done")}>
            <option value="all">All</option>
            <option value="todo">Todo</option>
            <option value="done">Done</option>
          </select>
        </label>

        <button type="button" className="primary-button" onClick={exportAssignments}>
          Export JSON
        </button>
        <button type="button" className="ghost-button" onClick={resetLocalData}>
          Reset Local
        </button>
      </section>

      <ul className="triage-list">
        {filteredItems.map((item) => {
          const assignment = assignments[item.id] ?? defaultAssignment();
          return (
            <li key={item.id} className="triage-item">
              <div className="triage-item-head">
                <h2>
                  {GOSPEL_LABELS[item.gospel]} {item.chapter}:{item.startVerse}-{item.endVerse}
                </h2>
                <p>{item.count} missing verses</p>
              </div>

              <div className="triage-controls">
                <label>
                  <span>Category</span>
                  <select
                    value={assignment.category}
                    onChange={(event) => setAssignment(item.id, { category: event.target.value })}
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Status</span>
                  <select
                    value={assignment.status}
                    onChange={(event) => setAssignment(item.id, { status: event.target.value as "todo" | "done" })}
                  >
                    <option value="todo">Todo</option>
                    <option value="done">Done</option>
                  </select>
                </label>
              </div>

              <label className="triage-notes">
                <span>Notes</span>
                <textarea
                  value={assignment.notes}
                  onChange={(event) => setAssignment(item.id, { notes: event.target.value })}
                  placeholder="Add rationale, candidate event title, or merge target..."
                />
              </label>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
