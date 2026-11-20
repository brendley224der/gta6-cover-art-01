// Vice Cover Studio — the entry program (Node 22, standard library only).
//
// It hands the app in: copies this repository's app/ and screenshots/ into the
// output directory and writes /output/dossier.json with the vendored make.fun
// library, exactly as the kit's starter does. The app itself is plain static
// files (app/index.html plus its ES modules, one local font, drawn sample
// photos) that run offline in desktop Chrome with no network request.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally while building it with `node serve.ts`.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Refuse to hand in a half-built entry: the app shell and at least one
// screenshot must be there before anything is copied.
const index = join(here, 'app', 'index.html');
if (!existsSync(index) || statSync(index).size === 0) {
  throw new Error('app/index.html is missing — the app is not built yet');
}
const shots = join(here, 'screenshots');
if (!existsSync(shots) || readdirSync(shots).filter((f) => !f.startsWith('.')).length === 0) {
  throw new Error('screenshots/ is empty — take the screenshots first');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shots, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the dossier's bytes; the
// rest refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in app/ or 48 MiB of app files in all).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
console.log(`Vice Cover Studio handed in to ${out}`);
