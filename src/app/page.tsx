import Link from "next/link";
import { listEvents, listSections } from "@/lib/events";
import { GOSPEL_ORDER, GOSPEL_LABELS } from "@/lib/constants";

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    section?: string;
    offset?: string;
    limit?: string;
  }>;
};

function getNumber(raw: string | undefined, fallback: number): number {
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallback;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const section = params.section?.trim() ?? "";
  const offset = Math.max(0, getNumber(params.offset, 0));
  const limit = Math.max(1, Math.min(100, getNumber(params.limit, 50)));

  const result = listEvents({
    q: q || undefined,
    section: section || undefined,
    offset,
    limit,
  });

  const sections = listSections();
  const hasPrev = offset > 0;
  const hasNext = offset + limit < result.total;

  return (
    <main className="container">
      <header className="page-header">
        <h1>Gospel Parallel Reader</h1>
        <p>Compare narrative events in Matthew, Mark, Luke, and John side by side.</p>
      </header>

      <form className="filters" method="get">
        <label>
          <span>Search</span>
          <input type="search" name="q" defaultValue={q} placeholder="Try: baptism, resurrection, 20:1-10" />
        </label>

        <label>
          <span>Section</span>
          <select name="section" defaultValue={section}>
            <option value="">All</option>
            {sections.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Page Size</span>
          <select name="limit" defaultValue={String(limit)}>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>

        <input type="hidden" name="offset" value="0" />
        <button type="submit">Apply</button>
      </form>

      <p className="result-meta">
        Showing {result.items.length} of {result.total} events
      </p>

      <ul className="event-list">
        {result.items.map((event) => (
          <li key={event.id} className="event-card">
            <div>
              <h2>
                <Link href={`/compare/${event.id}`}>{event.title}</Link>
              </h2>
              <p>{event.section}</p>
            </div>

            <div className="chips">
              {GOSPEL_ORDER.map((gospel) => (
                <span key={gospel} className={`chip ${event.references[gospel] ? "active" : "inactive"}`}>
                  <strong>{GOSPEL_LABELS[gospel]}:</strong> {event.references[gospel] ?? "-"}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="pager">
        {hasPrev ? (
          <Link
            href={`/?q=${encodeURIComponent(q)}&section=${encodeURIComponent(section)}&limit=${limit}&offset=${Math.max(0, offset - limit)}`}
          >
            Previous
          </Link>
        ) : (
          <span className="disabled">Previous</span>
        )}

        {hasNext ? (
          <Link
            href={`/?q=${encodeURIComponent(q)}&section=${encodeURIComponent(section)}&limit=${limit}&offset=${offset + limit}`}
          >
            Next
          </Link>
        ) : (
          <span className="disabled">Next</span>
        )}
      </div>
    </main>
  );
}

