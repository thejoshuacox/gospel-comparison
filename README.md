# Gospel Parallel Reader

A Next.js web app for comparing gospel narrative events side by side across Matthew, Mark, Luke, and John.

## Features

- Event list imported from `https://www.ecatholic2000.com/gospels.shtml`
- Side-by-side compare view for the four gospels
- User-selectable translations (`WEB`, `KJV`, `ASV`)
- API-backed passage retrieval via `https://bible-api.com`
- Search/filter/pagination for events
- Deep-linkable compare route (`/compare/[eventId]?translation=web`)

## API Routes

- `GET /api/events?q=&section=&limit=&offset=`
- `GET /api/events/:id`
- `GET /api/passage?ref=Matthew%203:13-17&translation=web`
- `GET /api/compare/:id?translation=web`

## Quick Start

```bash
npm install
npm run import:data
npm run dev
```

Then open `http://localhost:3000`.

## Data Import

The dataset is generated and stored in:

- `data/gospel-events.json`
- `data/gospel-events.manual.json`
- `data/import-report.json`

Rebuild data at any time with:

```bash
npm run import:data
```

Recommended workflow:

- Treat `data/gospel-events.json` as imported source data. Do not hand-edit it.
- Put all manual renames, reference corrections, hides, and new events in `data/gospel-events.manual.json`.
- The app and blind-spot analyzer merge both files at runtime.

## Quality Checks

```bash
npm run lint
npm test
npm run build
```

## Temporary Gap Triage Mode

Use this internal route to categorize missing passage ranges:

```bash
$env:NEXT_PUBLIC_ENABLE_TRIAGE="true"
npm run dev
```

Then open `http://localhost:3000/triage`.

- Export categorized work with the `Export JSON` button.
- Keep the exported file at [gap-triage-export.json](C:/Users/joshu/Desktop/Projects/GospelComparison/data/gap-triage-export.json) so `/triage` can restore from it on the next run.
- Keep `NEXT_PUBLIC_ENABLE_TRIAGE` unset/false in production so `/triage` returns 404.
- Recompute blind spots with:

```bash
npm run analyze:blindspots
```

## Notes

- This MVP is read-only: no accounts, notes, or saved highlights.
- Some source references use non-standard formatting and may return passage fetch errors from the scripture provider.
