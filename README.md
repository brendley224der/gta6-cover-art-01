# Vice Cover Studio — gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/brendley224der/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/brendley224der/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline browser app that turns your photo + a caption into GTA-style
cover art: the multi-panel poster look, bold caption lettering, and a Vice
City sunset / neon colour grade — all drawn in the browser, nothing uploaded.

## What it does

1. **Add photos** — from your machine (or try the three drawn samples).
   Photos never leave the machine.
2. **Arrange panels** — click a panel to select it, drag the photo inside
   it to move it, zoom with the slider; fill several panels with one photo
   or use a different photo per panel. Three layouts: Poster, Split, Strip.
3. **Write the caption** — big condensed poster lettering plus a tagline,
   with four colour grades (Sunset, Neon night, Palm day, Noir).
4. **Export PNG** — 1080 × 1080, 1080 × 1350 and 1920 × 1080, one click
   each or all three at once.

Everything is original: no Rockstar Games logo, wordmark, artwork,
character or font. The lettering is DejaVu Sans Bold (redistributed under
its Bitstream Vera licence, see `app/fonts/`), condensed and slanted in
code; the sample photos are drawn scenes made for this entry.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network requests at runtime: `app/` is plain static
files, the font and samples vendored inside it.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=9gnm68br&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
