// Vice Cover Studio — wires the page: photos, panels, caption, sizes, export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { SIZES, drawCover, renderCover, panelLayout, PANEL_NAMES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const $ = (id) => document.getElementById(id);

const state = {
  sizeKey: 'square',
  layout: 'poster',
  theme: 'sunset',
  caption: 'VICE SUNSET',
  tagline: 'ONE LAST RIDE · VICE CITY',
  capScale: 1,
  selected: 0,
  panels: [
    { photoIdx: 0, zoom: 1, ox: 0, oy: 0 },
    { photoIdx: 1, zoom: 1, ox: 0, oy: 0 },
    { photoIdx: 2, zoom: 1, ox: 0, oy: 0 },
  ],
};
const photos = []; // HTMLImageElement list; panels point at it by index.
let userPhotoCount = 0;
let panelTouched = false;

function drawState() {
  return {
    sizeKey: state.sizeKey,
    layout: state.layout,
    theme: state.theme,
    caption: state.caption,
    tagline: state.tagline,
    capScale: state.capScale,
    selected: state.selected,
    panels: state.panels.map((p) => ({
      photo: p.photoIdx == null ? null : photos[p.photoIdx] || null,
      zoom: p.zoom,
      ox: p.ox,
      oy: p.oy,
    })),
  };
}

function redraw(markSelected) {
  const { w, h } = SIZES[state.sizeKey];
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, drawState(), { markSelected: markSelected !== false });
  syncPanelControls();
  updateSteps();
}

function updateSteps() {
  const steps = document.querySelectorAll('.steps li');
  steps.forEach((li) => li.classList.remove('now'));
  const done = [userPhotoCount > 0, panelTouched, state.caption !== 'VICE SUNSET', false];
  steps.forEach((li, i) => {
    li.classList.toggle('done', done[i]);
    if (!done[i]) { li.classList.add('now'); return; }
  });
}

function syncPanelControls() {
  const p = state.panels[state.selected];
  $('selectedPanel').textContent = PANEL_NAMES[state.selected];
  const sel = $('panelPhoto');
  sel.innerHTML = '<option value="">— empty —</option>' + photos.map((_, i) =>
    `<option value="${i}"${p.photoIdx === i ? ' selected' : ''}>Photo ${i + 1}</option>`).join('');
  $('zoom').value = Math.round(p.zoom * 100);
  $('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
  $('panX').value = Math.round(p.ox * 100);
  $('panY').value = Math.round(p.oy * 100);
  $('capVal').textContent = `${Math.round(state.capScale * 100)}%`;
}

function renderThumbs() {
  const box = $('thumbs');
  if (!photos.length) { box.innerHTML = '<span class="empty">No photos yet — add one, or try a sample.</span>'; return; }
  box.innerHTML = '';
  photos.forEach((img, i) => {
    const t = document.createElement('img');
    t.src = img.src;
    t.alt = `Photo ${i + 1}`;
    t.title = `Use photo ${i + 1} in the selected panel`;
    if (state.panels[state.selected].photoIdx === i) t.classList.add('sel');
    t.addEventListener('click', () => {
      state.panels[state.selected].photoIdx = i;
      panelTouched = true;
      redraw();
    });
    box.appendChild(t);
  });
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function addPhotoFiles(files) {
  for (const file of files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      photos.push(img);
      userPhotoCount += 1;
    } catch { /* skip unreadable files */ }
  }
  if (photos.length && state.panels.every((p) => p.photoIdx == null)) {
    state.panels[0].photoIdx = 0;
  }
  renderThumbs();
  redraw();
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  const idx = photos.length;
  photos.push(img);
  return idx;
}

async function loadDefaultScene() {
  // The app opens with a full three-panel cover from its own drawn samples,
  // so the first thing a visitor sees is finished art, not an empty frame.
  const names = ['sunset', 'pier', 'city'];
  for (let i = 0; i < names.length; i++) {
    try {
      state.panels[i].photoIdx = await loadSample(names[i]);
    } catch { state.panels[i].photoIdx = null; }
  }
  renderThumbs();
  redraw();
}

// --- controls ---------------------------------------------------------------
$('photos').addEventListener('change', (e) => addPhotoFiles([...e.target.files]));
document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const idx = await loadSample(btn.dataset.sample);
    state.panels[state.selected].photoIdx = idx;
    panelTouched = true;
    renderThumbs();
    redraw();
  });
});
$('onePhoto').addEventListener('click', () => {
  if (!photos.length) return;
  state.panels.forEach((p) => { p.photoIdx = 0; });
  panelTouched = true;
  redraw();
});
$('panelPhoto').addEventListener('change', (e) => {
  const v = e.target.value;
  state.panels[state.selected].photoIdx = v === '' ? null : Number(v);
  panelTouched = true;
  redraw();
});
$('zoom').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = Number(e.target.value) / 100;
  panelTouched = true;
  redraw();
});
$('panX').addEventListener('input', (e) => {
  state.panels[state.selected].ox = Number(e.target.value) / 100;
  panelTouched = true;
  redraw();
});
$('panY').addEventListener('input', (e) => {
  state.panels[state.selected].oy = Number(e.target.value) / 100;
  panelTouched = true;
  redraw();
});
$('layout').addEventListener('change', (e) => { state.layout = e.target.value; redraw(); });
$('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
$('capSize').addEventListener('input', (e) => { state.capScale = Number(e.target.value) / 100; redraw(); });
$('theme').addEventListener('change', (e) => { state.theme = e.target.value; redraw(); });

document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.sizeKey = btn.dataset.size;
    redraw();
  });
});

// --- picking + dragging a panel on the canvas --------------------------------
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const fx = (clientX - r.left) / r.width;
  const fy = (clientY - r.top) / r.height;
  const rects = panelLayout(state.sizeKey, state.layout);
  for (let i = 0; i < rects.length; i++) {
    const p = rects[i];
    if (fx >= p.x && fx < p.x + p.w && fy >= p.y && fy < p.y + p.h) return i;
  }
  return 0;
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  state.selected = panelAt(e.clientX, e.clientY);
  drag = { x: e.clientX, y: e.clientY, ox: state.panels[state.selected].ox, oy: state.panels[state.selected].oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const p = state.panels[state.selected];
  p.ox = Math.max(-1, Math.min(1, drag.ox + ((e.clientX - drag.x) / r.width) * 2));
  p.oy = Math.max(-1, Math.min(1, drag.oy + ((e.clientY - drag.y) / r.height) * 2));
  panelTouched = true;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

// --- export ------------------------------------------------------------------
function download(canvasEl, name) {
  canvasEl.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}
function exportSize(sizeKey) {
  const out = renderCover(drawState(), sizeKey);
  const { w, h } = SIZES[sizeKey];
  download(out, `vice-cover-${w}x${h}.png`);
  return `${w} × ${h}`;
}
$('export').addEventListener('click', () => {
  $('status').textContent = `Saved vice-cover-${SIZES[state.sizeKey].label.replace(' × ', 'x')}.png`;
  exportSize(state.sizeKey);
});
$('exportAll').addEventListener('click', () => {
  const names = Object.keys(SIZES).map(exportSize);
  $('status').textContent = `Saved ${names.join(', ')} — three PNGs.`;
});

// Headless hooks: the screenshot/export tooling calls these, not the UI.
window.__exportCover = (sizeKey) => Promise.resolve(renderCover(drawState(), sizeKey).toDataURL('image/png'));
window.__viceState = state;
window.__vicePhotos = photos;

const params = new URLSearchParams(location.search);
if (params.get('shot')) {
  runShot(params, {
    loadSamples: async () => loadDefaultScene(),
    setCaption: (caption, tagline) => {
      state.caption = caption;
      state.tagline = tagline;
      $('caption').value = caption;
      $('tagline').value = tagline;
    },
    setTheme: (theme) => { state.theme = theme; $('theme').value = theme; },
    setLayout: (layout) => { state.layout = layout; $('layout').value = layout; },
    setSize: (sizeKey) => {
      state.sizeKey = sizeKey;
      document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('active', b.dataset.size === sizeKey));
    },
    redraw: () => redraw(),
  });
} else {
  loadDefaultScene();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => redraw());
  }
}
