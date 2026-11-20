// Vice Cover Studio — screenshot + self-test modes, driven by URL params.
//   ?shot=cover&photo=beach&caption=VICE%20NIGHTS&size=landscape
//       Full-window cover render (the app's own drawing of an exported cover).
//   ?shot=editor&photo=boulevard&caption=BOULEVARD%20QUEEN
//       The editor with sample photos loaded into the panels.
//   ?selftest=1
//       Renders all three export sizes headlessly and writes the results
//       (dimensions + PNG byte lengths) into #selftest as JSON.
// No network: sample photos are files under app/samples/.

import { SAMPLE_PHOTOS, SIZES, renderExport } from './cover.js';

const loadedSamples = new Map();

export function loadSamplePhoto(def) {
  if (loadedSamples.has(def.key)) return Promise.resolve(loadedSamples.get(def.key));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const photo = { id: `sample-${def.key}`, name: def.label, src: def.path, img };
      loadedSamples.set(def.key, photo);
      resolve(photo);
    };
    img.onerror = () => reject(new Error(`Sample photo missing: ${def.path}`));
    img.src = def.path;
  });
}

async function loadSamplesIntoPanels(state, keys) {
  const layoutKeys = keys.length ? keys : ['beach', 'boulevard', 'skyline'];
  const photos = [];
  for (const key of layoutKeys) {
    const def = SAMPLE_PHOTOS.find((s) => s.key === key);
    if (!def) continue;
    const photo = await loadSamplePhoto(def);
    if (!state.photos.some((p) => p.id === photo.id)) state.photos.push(photo);
    photos.push(photo);
  }
  return photos;
}

function spreadPhotosAcrossPanels(state, photos) {
  const panelIds = Object.keys(state.panels);
  // Hero gets the first photo; the rest cycle through the samples so every
  // panel shows a different shot.
  panelIds.forEach((id, i) => {
    const photo = photos[i % photos.length];
    state.panels[id].photoId = photo ? photo.id : null;
    state.panels[id].zoom = 1;
    state.panels[id].ox = 0;
    state.panels[id].oy = 0;
  });
}

export async function applyShotMode(state, params) {
  const shot = params.get('shot');
  if (!shot) return;
  if (params.get('caption')) state.title = params.get('caption');
  if (params.get('subtitle')) state.subtitle = params.get('subtitle');
  if (params.get('size') && SIZES[params.get('size')]) state.size = params.get('size');

  const photoKeys = (params.get('photo') || 'beach,boulevard,skyline').split(',').map((s) => s.trim()).filter(Boolean);
  const photos = await loadSamplesIntoPanels(state, photoKeys);
  spreadPhotosAcrossPanels(state, photos);

  // Keep the editor fields in sync with the shot params, so the editor
  // screenshot shows the caption it is actually rendering.
  const titleInput = document.getElementById('title');
  if (titleInput) titleInput.value = state.title;
  const subtitleInput = document.getElementById('subtitle');
  if (subtitleInput) subtitleInput.value = state.subtitle;
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  const status = document.getElementById('status');
  if (status) status.textContent = 'Sample photos loaded — pick a panel, then drag, zoom or export.';

  if (shot === 'cover') {
    // Hide the editor chrome; the page becomes the cover itself.
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('preview');
    const size = SIZES[state.size];
    const scale = Math.min(window.innerWidth / size.w, window.innerHeight / size.h);
    canvas.style.width = `${Math.round(size.w * scale)}px`;
    canvas.style.height = `${Math.round(size.h * scale)}px`;
    document.getElementById('preview-wrap').style.maxWidth = 'none';
  }
  // shot=editor keeps the normal editor visible, photos already loaded.
}

export async function runSelfTest(state, params) {
  const out = { errors: [], sizes: {}, consoleErrors: 0 };
  const box = document.getElementById('selftest');
  const finish = () => {
    box.textContent = JSON.stringify(out);
    document.title = `SELFTEST ${out.errors.length ? 'FAIL' : 'PASS'}`;
  };
  window.addEventListener('error', (e) => out.errors.push(`window error: ${e.message}`));
  try {
    if (document.fonts) await document.fonts.ready;
    const photos = await loadSamplesIntoPanels(state, ['beach', 'boulevard', 'skyline']);
    spreadPhotosAcrossPanels(state, photos);
    state.title = params.get('caption') || 'VICE NIGHTS';
    for (const key of Object.keys(SIZES)) {
      const canvas = renderExport(state, key);
      const size = SIZES[key];
      if (canvas.width !== size.w || canvas.height !== size.h) {
        out.errors.push(`${key}: canvas is ${canvas.width}x${canvas.height}, expected ${size.w}x${size.h}`);
      }
      const dataUrl = canvas.toDataURL('image/png');
      const bytes = Math.round((dataUrl.length - 'data:image/png;base64,'.length) * 3 / 4);
      out.sizes[key] = { w: canvas.width, h: canvas.height, pngBytes: bytes };
      if (bytes < 10000) out.errors.push(`${key}: PNG suspiciously small (${bytes} bytes)`);
    }
    // The live preview path must render too.
    const preview = document.getElementById('preview');
    preview.width = 480;
    preview.height = 270;
    preview.getContext('2d').drawImage(renderExport(state, 'landscape'), 0, 0, 480, 270);
    out.previewOk = true;
  } catch (err) {
    out.errors.push(`exception: ${err.message}`);
  }
  finish();
}
