# Movie Night Picker

A lightweight, offline-first movie library, shortlist builder, and picker for movie nights.

No backend, no accounts. All data lives in the browser's `localStorage` on whichever device you're using, as one JSON blob you can export/import from **Settings**. Treat the exported file as your portable library — hand-edit it if you want, move it between your phone and computer, or keep it as a backup.

## Run it

```bash
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL. The dev server also prints a `Network` URL — open that from your phone (same Wi-Fi) to try it there.

## Build & host it

```bash
npm run build
```

Outputs a static site to `dist/`. Deploy `dist/` anywhere that serves static files (GitHub Pages, Netlify, Cloudflare Pages, or just `npx serve dist` on your own machine). Once hosted, open the URL on your Android phone in Chrome and use **⋮ → Add to Home screen** — it installs as a standalone app (via the PWA manifest) and keeps working offline after the first load.

Each device keeps its own local copy of the data — use Export/Import JSON (in Settings) to move your library between your phone and computer.

## Data model

- **Movie**: title, year, genres, runtime, content rating, personal rating, poster URL, notes, physical copies (format + shelf location), streaming services.
- **Watch session**: date, shortlist considered, movie picked, pick method (random/manual), attendees, notes. Logged permanently and used to derive "times watched," "last watched," and "appears in N lists" for filtering/sorting the library.
