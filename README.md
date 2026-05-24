# Learn Flags

An interactive game for learning the national flags of all 197 sovereign nations of the world.

**Live:** https://jefrix.github.io/learnflags/

## Game modes

1. **Flashcards** — flip a card to reveal the country name (with its native-language name), plus a short paragraph on the flag's design and symbolism.
2. **Quick Quiz** — a flag is shown, pick the country from four choices. Tracks score, current streak, and best streak.
3. **World Map** — drop a flag on the country it belongs to. Real country borders. Scroll to zoom, drag to pan, or use the continent buttons to jump directly to a region.

A region filter (Africa, Americas, Asia, Europe, Oceania) works in every mode.

## Repo structure

```
index.html          Single-file React app (CDN-loaded, no build step required)
flags/              SVG flag images (197 files, ~1.9MB total)
download-flags.sh   Script to populate the flags/ folder
README.md           This file
```

## Setup

The first time you clone the repo, populate the flags folder:

```bash
bash download-flags.sh
```

This downloads SVG flag images from the [lipis/flag-icons](https://github.com/lipis/flag-icons) project (MIT-licensed). Re-running is safe — existing files are skipped. Want PNGs instead? Pass `--png`.

Commit the `flags/` folder to your repo so the deployed site works offline-style without external image hosts.

## Deploy

This is a static site — any host that serves HTML will work. For GitHub Pages:

1. Push to `main`
2. Settings → Pages → Source: "Deploy from a branch" → `main` / `(root)`
3. Wait a minute; the site is live at `https://jefrix.github.io/learnflags/`

## Data sources

- **Country borders** — [Natural Earth 110m administrative boundaries](https://www.naturalearthdata.com/) (public domain), simplified with Ramer-Douglas-Peucker and embedded as SVG paths.
- **Flag images** — [lipis/flag-icons](https://github.com/lipis/flag-icons) (MIT), an open-source maintained collection of SVG flags.
- **Country list, endonyms, flag descriptions** — compiled by hand from general reference sources; brief, factual paragraphs covering the design and symbolism of each flag.

## Technical notes

- The whole UI is React + Babel loaded via CDN — no build step required. Open `index.html` in a browser locally and it just works.
- Map borders are embedded SVG path data (~82KB). Hit-testing uses the browser's native `isPointInFill` so clicks resolve to the actual country regardless of zoom level.
- Map zoom uses SVG viewBox manipulation, so borders stay crisp at any zoom level.
- The 29 smallest island nations (Maldives, Tuvalu, San Marino, Vatican City, etc.) appear as clickable dots since they're too small to render as polygons at this scale.

## License

Code: do whatever you want with it.
Flag images: MIT (see lipis/flag-icons).
Borders data: public domain (Natural Earth).
