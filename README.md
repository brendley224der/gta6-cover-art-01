[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/brendley224der/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/brendley224der/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Studio

An offline browser app that turns a person's photo + a caption into
GTA 6-style cover art, exported as a PNG to share. Built for the make.fun
bounty **gta6-cover-art-01** ("Make GTA 6 Cover Art").

## What it does

- **Multi-panel poster** — one large hero panel plus a grid of smaller
  panels. One photo can fill several panels, or each panel can hold its
  own photo.
- **Neon-sunset grade** — a warm orange / pink / purple wash with high
  contrast and a vignette, applied on canvas at export.
- **Bold caption lettering** — an editable display title + subtitle with
  gradient fill, outline and a neon underline, in the genre's style.
- **Photo tools** — load photos from your own machine (never uploaded),
  crop and position each photo per panel (drag, scroll to zoom, sliders),
  replace or remove a photo, or fill every panel with one photo.
- **Export PNG** — one click exports the cover in 1080 × 1080,
  1080 × 1350 and 1920 × 1080.
- **Live preview editor** — panels, photo controls, caption fields, size
  picker and export buttons; the cover updates live as you edit.

## Run it

Serve `app/` with any static server and open `index.html` in desktop
Chrome, for example:

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

No network requests at runtime: every script, style, font and sample
photo is a file under `app/`.

## Files

- `app/index.html` — the editor page
- `app/style.css` — editor theme
- `app/src/cover.js` — cover rendering engine (layouts, grade, caption)
- `app/src/main.js` — editor UI, live preview, PNG export
- `app/src/shots.js` — screenshot / self-test modes (`?shot=`, `?selftest=1`)
- `app/samples/` — original drawn sample photos (no real people)
- `app/fonts/DejaVuSans-Bold.ttf` — display font, Bitstream Vera license
  (see `app/fonts/LICENSE-DejaVu.txt`)
- `screenshots/` — 4 screenshots taken with the app
- `shots.json` — what each screenshot shows and how it was taken
- `main.ts` — hands the entry in: copies `app/` + `screenshots/` to
  `/output` and writes `/output/dossier.json`

## Originality

No Rockstar Games logo, wordmark, official artwork, character or font is
used anywhere. The sample photos are original drawings made for this
entry, and the display font is DejaVu Sans Bold under its own license.

## License

MIT — see `LICENSE`.
