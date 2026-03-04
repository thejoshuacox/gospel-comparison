import Link from "next/link";
import { notFound } from "next/navigation";
import { TranslationSelect } from "@/components/translation-select";
import { GOSPEL_LABELS } from "@/lib/constants";
import { coerceTranslation } from "@/lib/bible-api";
import { getComparePayload } from "@/lib/compare";

type ComparePageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ translation?: string }>;
};

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
  const route = await params;
  const search = await searchParams;

  const translation = coerceTranslation(search.translation);
  const payload = await getComparePayload(route.eventId, translation);

  if (!payload) {
    notFound();
  }

  return (
    <main className="container">
      <Link href="/" className="back-link">
        Back to events
      </Link>

      <header className="page-header compare-header">
        <div>
          <h1>{payload.event.title}</h1>
          <p>{payload.event.section}</p>
        </div>
        <TranslationSelect value={payload.translation} />
      </header>

      <section className="compare-grid">
        {payload.columns.map((column) => (
          <article key={column.gospel} className="compare-card">
            <h2>{GOSPEL_LABELS[column.gospel]}</h2>
            <p className="reference">{column.reference ?? "No parallel passage"}</p>

            {column.status === "missing" ? <p className="empty">No parallel passage.</p> : null}
            {column.status === "error" ? <p className="error">Could not load passage: {column.error}</p> : null}
            {column.status === "ok" && column.passage ? (
              <p className="passage-text">{column.passage.text}</p>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}

