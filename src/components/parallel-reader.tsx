"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_TRANSLATION, GOSPEL_LABELS, GOSPEL_ORDER, SUPPORTED_TRANSLATIONS } from "@/lib/constants";
import { filterEventsByIncludeExclude, sortEvents, type SortMode } from "@/lib/event-selection";
import { parseMultiChapterReference } from "@/lib/reference-range";
import type { ComparePayload, GospelEvent, GospelKey, PassagePayload } from "@/types/gospel";

type Props = {
  events: GospelEvent[];
};

type GospelSelection = Record<GospelKey, boolean>;

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "markan", label: "Markan" },
  { value: "matthean", label: "Matthean" },
  { value: "lukan", label: "Lukan" },
  { value: "johannine", label: "Johannine" },
];

const ALL_SELECTED: GospelSelection = {
  matthew: true,
  mark: true,
  luke: true,
  john: true,
};

type ChapterPassageState = {
  loading: boolean;
  error: string | null;
  passage: PassagePayload | null;
};

function getChapterLabel(reference: string | null): string | null {
  if (!reference) {
    return null;
  }

  const cleaned = reference.replace(/[\[\]]/g, "");
  const match = cleaned.match(/(\d+):/);
  if (!match) {
    return null;
  }

  return match[1];
}

export function ParallelReader({ events }: Props) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [translation, setTranslation] = useState(DEFAULT_TRANSLATION);
  const [sortMode, setSortMode] = useState<SortMode>("markan");
  const [includedGospels, setIncludedGospels] = useState<GospelSelection>(ALL_SELECTED);
  const [excludedGospels, setExcludedGospels] = useState<GospelSelection>({
    matthew: false,
    mark: false,
    luke: false,
    john: false,
  });
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id ?? "");
  const [payload, setPayload] = useState<ComparePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chapterIndexByGospel, setChapterIndexByGospel] = useState<Record<GospelKey, number>>({
    matthew: 1,
    mark: 1,
    luke: 1,
    john: 1,
  });
  const [chapterPassageByGospel, setChapterPassageByGospel] = useState<Record<GospelKey, ChapterPassageState>>({
    matthew: { loading: false, error: null, passage: null },
    mark: { loading: false, error: null, passage: null },
    luke: { loading: false, error: null, passage: null },
    john: { loading: false, error: null, passage: null },
  });
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const includedList = useMemo(
    () => GOSPEL_ORDER.filter((gospel) => includedGospels[gospel]),
    [includedGospels],
  );

  const excludedList = useMemo(
    () => GOSPEL_ORDER.filter((gospel) => excludedGospels[gospel]),
    [excludedGospels],
  );

  const filteredEvents = useMemo(() => {
    const filtered = filterEventsByIncludeExclude(events, includedList, excludedList);
    return sortEvents(filtered, sortMode);
  }, [events, includedList, excludedList, sortMode]);

  const selectedIndex = useMemo(
    () => filteredEvents.findIndex((event) => event.id === selectedEventId),
    [filteredEvents, selectedEventId],
  );

  const previousEventId = selectedIndex > 0 ? filteredEvents[selectedIndex - 1]?.id : null;
  const nextEventId =
    selectedIndex >= 0 && selectedIndex < filteredEvents.length - 1 ? filteredEvents[selectedIndex + 1]?.id : null;

  useEffect(() => {
    if (!filteredEvents.length) {
      setSelectedEventId("");
      setPayload(null);
      return;
    }

    const exists = filteredEvents.some((event) => event.id === selectedEventId);
    if (!exists) {
      setSelectedEventId(filteredEvents[0].id);
    }
  }, [filteredEvents, selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    let active = true;

    async function loadCompare(): Promise<void> {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(
          `/api/compare/${encodeURIComponent(selectedEventId)}?translation=${encodeURIComponent(translation)}`,
        );

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        const data = (await response.json()) as ComparePayload;
        if (active) {
          setPayload(data);
        }
      } catch (error) {
        if (active) {
          setPayload(null);
          setLoadError(error instanceof Error ? error.message : "Could not load event passages.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadCompare();

    return () => {
      active = false;
    };
  }, [selectedEventId, translation]);

  const multiChapterByGospel = useMemo(() => {
    const result: Partial<Record<GospelKey, ReturnType<typeof parseMultiChapterReference>>> = {};
    for (const gospel of GOSPEL_ORDER) {
      const column = payload?.columns.find((item) => item.gospel === gospel);
      result[gospel] = parseMultiChapterReference(column?.reference ?? null);
    }
    return result;
  }, [payload]);

  useEffect(() => {
    setChapterIndexByGospel((current) => {
      const next = { ...current };
      for (const gospel of GOSPEL_ORDER) {
        const range = multiChapterByGospel[gospel];
        if (range) {
          next[gospel] = range.startChapter;
        }
      }
      return next;
    });
  }, [selectedEventId, multiChapterByGospel]);

  useEffect(() => {
    let active = true;

    async function loadChapters(): Promise<void> {
      for (const gospel of GOSPEL_ORDER) {
        const range = multiChapterByGospel[gospel];
        if (!range) {
          continue;
        }

        const currentChapter = chapterIndexByGospel[gospel];
        if (!currentChapter || currentChapter < range.startChapter || currentChapter > range.endChapter) {
          continue;
        }

        setChapterPassageByGospel((current) => ({
          ...current,
          [gospel]: {
            loading: true,
            error: null,
            passage: current[gospel].passage,
          },
        }));

        try {
          const response = await fetch(
            `/api/passage?ref=${encodeURIComponent(`${range.book} ${currentChapter}`)}&translation=${encodeURIComponent(translation)}`,
          );
          if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
          }

          const passage = (await response.json()) as PassagePayload;
          if (!active) {
            return;
          }

          setChapterPassageByGospel((current) => ({
            ...current,
            [gospel]: {
              loading: false,
              error: null,
              passage,
            },
          }));
        } catch (error) {
          if (!active) {
            return;
          }

          setChapterPassageByGospel((current) => ({
            ...current,
            [gospel]: {
              loading: false,
              error: error instanceof Error ? error.message : "Could not load chapter.",
              passage: null,
            },
          }));
        }
      }
    }

    void loadChapters();

    return () => {
      active = false;
    };
  }, [multiChapterByGospel, chapterIndexByGospel, translation]);

  useEffect(() => {
    if (!isPickerOpen || !selectedEventId) {
      return;
    }

    const selectedOption = optionRefs.current[selectedEventId];
    selectedOption?.scrollIntoView({
      block: "center",
      behavior: "auto",
    });
  }, [isPickerOpen, selectedEventId, filteredEvents]);

  const selectedEvent = payload?.event ?? filteredEvents.find((event) => event.id === selectedEventId) ?? null;
  const selectedTitle = selectedEvent?.title ?? null;
  const selectedLocation = selectedEvent?.location ?? null;

  return (
    <main className="container">
      <header className="page-header reader-header">
        <div>
          <h1>Gospel Parallel Reader</h1>
          <p>{selectedTitle ? `Current event: ${selectedTitle}` : "Select an event to begin."}</p>
          {selectedLocation ? <p>{`Location: ${selectedLocation}`}</p> : null}
        </div>

        <div className="reader-controls">
          <div className="sequence-controls">
            <button
              type="button"
              className="ghost-button"
              onClick={() => previousEventId && setSelectedEventId(previousEventId)}
              disabled={!previousEventId}
            >
              Previous
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => nextEventId && setSelectedEventId(nextEventId)}
              disabled={!nextEventId}
            >
              Next
            </button>
          </div>

          <label className="translation-control">
            <span>Translation</span>
            <select value={translation} onChange={(event) => setTranslation(event.target.value)}>
              {SUPPORTED_TRANSLATIONS.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="primary-button" onClick={() => setIsPickerOpen(true)}>
            Select Event
          </button>
        </div>
      </header>

      {loadError ? <p className="error-banner">{loadError}</p> : null}

      <section className="compare-grid">
        {GOSPEL_ORDER.map((gospel) => {
          const column = payload?.columns.find((item) => item.gospel === gospel);
          const range = multiChapterByGospel[gospel];
          const chapterState = chapterPassageByGospel[gospel];
          const currentChapter = chapterIndexByGospel[gospel];
          const isMultiChapter = Boolean(range);

          let displayedText = column?.passage?.text ?? null;
          if (range && chapterState.passage) {
            const verses = chapterState.passage.verses.filter((verse) => {
              if (verse.chapter !== currentChapter) {
                return false;
              }

              if (currentChapter === range.startChapter && verse.verse < range.startVerse) {
                return false;
              }

              if (currentChapter === range.endChapter && verse.verse > range.endVerse) {
                return false;
              }

              return true;
            });

            displayedText = verses.map((verse) => verse.text.trim()).join(" ").trim() || chapterState.passage.text;
          }

          return (
            <article key={gospel} className="compare-card">
              <h2>{GOSPEL_LABELS[gospel]}</h2>
              <p className="reference">{column?.reference ?? "No parallel passage"}</p>
              {range ? (
                <div className="chapter-nav">
                  <button
                    type="button"
                    className="ghost-button chapter-arrow"
                    onClick={() =>
                      setChapterIndexByGospel((current) => ({
                        ...current,
                        [gospel]: Math.max(range.startChapter, current[gospel] - 1),
                      }))
                    }
                    disabled={currentChapter <= range.startChapter}
                    aria-label={`Previous chapter in ${GOSPEL_LABELS[gospel]}`}
                  >
                    &lt;
                  </button>
                  <span>Chapter {currentChapter}</span>
                  <button
                    type="button"
                    className="ghost-button chapter-arrow"
                    onClick={() =>
                      setChapterIndexByGospel((current) => ({
                        ...current,
                        [gospel]: Math.min(range.endChapter, current[gospel] + 1),
                      }))
                    }
                    disabled={currentChapter >= range.endChapter}
                    aria-label={`Next chapter in ${GOSPEL_LABELS[gospel]}`}
                  >
                    &gt;
                  </button>
                </div>
              ) : null}

              {isLoading ? <p className="empty">Loading passage...</p> : null}
              {!isLoading && isMultiChapter && chapterState.loading ? <p className="empty">Loading chapter...</p> : null}
              {!isLoading && isMultiChapter && chapterState.error ? (
                <p className="error">Could not load chapter: {chapterState.error}</p>
              ) : null}
              {!isLoading && column?.status === "missing" ? <p className="empty">No parallel passage.</p> : null}
              {!isLoading && !isMultiChapter && column?.status === "error" ? (
                <p className="error">Could not load passage: {column.error}</p>
              ) : null}
              {!isLoading && (column?.status === "ok" || isMultiChapter) && displayedText ? (
                <p className="passage-text">{displayedText}</p>
              ) : null}
              {!isLoading && !column && !payload ? <p className="empty">Choose an event to load passages.</p> : null}
            </article>
          );
        })}
      </section>

      {isPickerOpen ? (
        <div className="picker-overlay" role="dialog" aria-modal="true" aria-label="Select gospel event">
          <div className="picker-panel">
            <div className="picker-header">
              <h2>Select Event</h2>
              <button type="button" className="ghost-button" onClick={() => setIsPickerOpen(false)}>
                Close
              </button>
            </div>

            <div className="picker-controls">
              <fieldset className="gospel-filter">
                <legend>Gospel Filters</legend>
                {GOSPEL_ORDER.map((gospel) => (
                  <label key={gospel}>
                    <input
                      type="checkbox"
                      checked={includedGospels[gospel]}
                      onChange={(event) => {
                        setIncludedGospels((current) => ({
                          ...current,
                          [gospel]: event.target.checked,
                        }));
                        if (event.target.checked) {
                          setExcludedGospels((current) => ({
                            ...current,
                            [gospel]: false,
                          }));
                        }
                      }}
                    />
                    {GOSPEL_LABELS[gospel]}
                  </label>
                ))}
              </fieldset>

              <fieldset className="gospel-filter">
                <legend>Excluded Gospels</legend>
                {GOSPEL_ORDER.map((gospel) => (
                  <label key={`exclude-${gospel}`}>
                    <input
                      type="checkbox"
                      checked={excludedGospels[gospel]}
                      onChange={(event) => {
                        setExcludedGospels((current) => ({
                          ...current,
                          [gospel]: event.target.checked,
                        }));
                        if (event.target.checked) {
                          setIncludedGospels((current) => ({
                            ...current,
                            [gospel]: false,
                          }));
                        }
                      }}
                    />
                    {GOSPEL_LABELS[gospel]}
                  </label>
                ))}
              </fieldset>

              <label className="sort-control">
                <span>Order</span>
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="result-meta">{filteredEvents.length} matching events</p>

            <ul className="picker-list">
              {filteredEvents.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className={`event-option ${event.id === selectedEventId ? "selected" : ""}`}
                    ref={(element) => {
                      optionRefs.current[event.id] = element;
                    }}
                    onClick={() => {
                      setSelectedEventId(event.id);
                      setIsPickerOpen(false);
                    }}
                  >
                    <span>{event.title}</span>
                    <small>
                      {GOSPEL_ORDER.map((gospel) => {
                        const chapter = getChapterLabel(event.references[gospel]);
                        if (!chapter) {
                          return null;
                        }

                        return `${GOSPEL_LABELS[gospel]} ${chapter}`;
                      })
                        .filter(Boolean)
                        .join(", ")}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </main>
  );
}
