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
- `data/import-report.json`

Rebuild data at any time with:

```bash
npm run import:data
```

## Quality Checks

```bash
npm run lint
npm test
npm run build
```

## Notes

- This MVP is read-only: no accounts, notes, or saved highlights.
- Some source references use non-standard formatting and may return passage fetch errors from the scripture provider.
