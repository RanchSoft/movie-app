# Movie Night Picker

A lightweight, offline-first movie library, shortlist builder, and picker for movie nights.

No backend, no accounts. All data lives in the browser's `localStorage` on whichever device you're using, as one JSON blob you can export/import from **Settings**. Treat the exported file as your portable library — hand-edit it if you want, move it between your phone and computer, or keep it as a backup.

## Run it locally

```bash
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL. The dev server also prints a `Network` URL — open that from your phone (same Wi-Fi) to try it there. Note: the offline service worker only runs against a production build, not `npm run dev` — use the deployed site (below) to test true offline/installed behavior.

## Deploy to GitHub Pages (how you actually use this day-to-day)

This repo has a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and publishes to Pages automatically on every push to `main`. One-time setup:

1. Publish this repo to GitHub (e.g. via GitHub Desktop's "Publish repository").
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` (or re-run the workflow from the Actions tab) — the site deploys to `https://<your-username>.github.io/movie-app/`.

After that, updating is just: make changes, commit, push. No server to run, nothing to keep on — GitHub Pages is static file hosting, not a process that can go down.

On your phone: open that URL once in Chrome, then **⋮ → Add to Home screen**. It installs as a standalone app and works fully offline from then on. Each device (phone, computer) keeps its own local copy of the data — use Export/Import JSON (in Settings) to move your library between them.

## Data model

- **Movie** (also covers TV shows, via `kind`): title, year, genres, tags, runtime, poster URL, notes, physical copies (format + shelf location), streaming services (with an optional price — see below), and rating sources.
- **Rating**: not entered directly — computed from whichever rating sources you provide (currently Letterboxd 0-5, Rotten Tomatoes critic score 0-100), each normalized to a 0-5 scale and averaged equally. See `src/ratingSources.ts` to add more sources.
- **Watch session**: date, shortlist considered, movie picked, pick method (random/manual), attendees, notes. Logged permanently and used to derive "times watched," "last watched," and "appears in N lists" for filtering/sorting the library.

## TMDb integration (optional, Settings)

Adding a free API key from [themoviedb.org](https://www.themoviedb.org/settings/api) enables, in the Add/Edit movie form:

- **Search & autofill** — title, year, genres, runtime, and poster from a selected TMDb result.
- **Streaming availability autofill** — once you've also listed which services you have in Settings ("Your streaming services" + a region code), selecting a TMDb search result also checks that title's watch-provider data and fills in matching services automatically: subscription/ad-supported access goes in free, rent/buy access goes in marked `paid` (TMDb's data tells you *which* provider carries a rent/buy option, not the actual price — fill that in yourself if you want an exact number).

The API key and your service/region preferences all live only in this browser's `localStorage` — never committed to the repo or included in the built site.

For hand-written entries, only `title` is required — `id`, `addedAt`, and array fields are filled in automatically on import.
