// Vice Cover Studio — editor UI: panels, photo tools, caption fields,
// size picker, live preview and PNG export. Plain DOM + canvas, offline.

import { SIZES, LAYOUTS, SAMPLE_PHOTOS, createCoverState, findPhoto, renderExport, drawCover, fitTitleScale } from './cover.js';
import { applyShotMode, runSelfTest, loadSamplePhoto } from './shots.js';

const state = createCoverState();
let selectedPanel = 'hero';
let previewScale = 1;

const $ = (id) => document.getElementById(id);
const previewCanvas = $('preview');
const previewCtx = previewCanvas.getContext('2d');

function currentLayout() {
  return LAYOUTS[state.size];
}

function panelLabel(id) {
  const p = currentLayout().panels.find((x) => x.id === id);
  return p ? p.label : id;
}

function selectedSlot() {
  return state.panels[selectedPanel];
}

// ---------- live preview ----------

function renderPreview() {
  const size = SIZES[state.size];
  const box = $('preview-wrap');
  const maxW = Math.min(box.clientWidth || 640, 760);
  const scale = Math.min(maxW / size.w, 520 / size.h);
  previewScale = scale;
  const off = document.createElement('canvas');
  drawCover(off, state, state.size);
  previewCanvas.width = Math.round(size.w * scale);
  previewCanvas.height = Math.round(size.h * scale);
  previewCtx.imageSmoothingEnabled = true;
  previewCtx.imageSmoothingQuality = 'high';
  previewCtx.drawImage(off, 0, 0, previewCanvas.width, previewCanvas.height);
  $('preview-size').textContent = `${size.w} × ${size.h}`;
  updatePanelList();
  updatePanelControls();
}

let previewQueued = false;
function queuePreview() {
  if (previewQueued) return;
  previewQueued = true;
  requestAnimationFrame(() => {
    previewQueued = false;
    renderPreview();
  });
}

// ---------- photo library ----------

function addPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const photo = {
          id: `photo-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
          name: file.name || 'Photo',
          src: reader.result,
          img,
        };
        state.photos.push(photo);
        resolve(photo);
      };
      img.onerror = () => reject(new Error('That file is not a readable image.'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function loadSample(key) {
  const def = SAMPLE_PHOTOS.find((s) => s.key === key);
  if (!def) return null;
  const photo = await loadSamplePhoto(def);
  if (!state.photos.some((p) => p.id === photo.id)) state.photos.push(photo);
  return photo;
}

function assignPhotoToPanel(photo, panelId) {
  const slot = state.panels[panelId];
  if (!slot) return;
  slot.photoId = photo ? photo.id : null;
  if (photo) {
    slot.zoom = 1;
    slot.ox = 0;
    slot.oy = 0;
  }
  queuePreview();
}

function fillAllPanelsWith(photo) {
  for (const p of currentLayout().panels) {
    state.panels[p.id].photoId = photo ? photo.id : null;
    if (photo) {
      state.panels[p.id].zoom = 1;
      state.panels[p.id].ox = 0;
      state.panels[p.id].oy = 0;
    }
  }
  queuePreview();
}

// ---------- panel list + controls ----------

function updatePanelList() {
  const list = $('panel-list');
  list.innerHTML = '';
  for (const p of currentLayout().panels) {
    const slot = state.panels[p.id];
    const photo = slot.photoId ? findPhoto(state, slot.photoId) : null;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panel-chip' + (p.id === selectedPanel ? ' selected' : '');
    btn.textContent = `${p.label} — ${photo ? photo.name : 'empty'}`;
    btn.addEventListener('click', () => {
      selectedPanel = p.id;
      queuePreview();
    });
    list.appendChild(btn);
  }
}

function updatePanelControls() {
  $('panel-name').textContent = panelLabel(selectedPanel);
  const slot = selectedSlot();
  const photo = slot.photoId ? findPhoto(state, slot.photoId) : null;
  $('panel-photo').textContent = photo ? photo.name : 'No photo yet';
  $('zoom').value = slot.zoom;
  $('zoom-val').textContent = `${Math.round(slot.zoom * 100)}%`;
  $('pan-x').value = slot.ox;
  $('pan-y').value = slot.oy;
  $('remove-photo').disabled = !photo;
  $('fill-all').disabled = !photo;
}

// ---------- export ----------

function downloadCanvas(canvas, filename) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Export produced no image.'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(blob.size);
    }, 'image/png');
  });
}

async function exportSize(sizeKey) {
  const canvas = renderExport(state, sizeKey);
  const size = SIZES[sizeKey];
  const slug = (state.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
  const bytes = await downloadCanvas(canvas, `vice-cover-${slug}-${size.w}x${size.h}.png`);
  setStatus(`Exported ${size.w} × ${size.h} PNG (${Math.round(bytes / 1024)} KiB).`);
  return bytes;
}

async function exportAll() {
  for (const key of Object.keys(SIZES)) {
    await exportSize(key);
  }
}

function setStatus(msg) {
  $('status').textContent = msg;
}

// ---------- wiring ----------

function bindControls() {
  $('title').addEventListener('input', (e) => {
    state.title = e.target.value;
    state.titleScale = fitTitleScale(state, state.size);
    queuePreview();
  });
  $('subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    queuePreview();
  });
  $('title-size').addEventListener('input', (e) => {
    state.titleScale = Number(e.target.value);
    $('title-size-val').textContent = `${Math.round(state.titleScale * 100)}%`;
    queuePreview();
  });
  $('grade').addEventListener('input', (e) => {
    state.grade = Number(e.target.value);
    $('grade-val').textContent = `${Math.round(state.grade * 100)}%`;
    queuePreview();
  });

  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.size = btn.dataset.size;
      document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === btn));
      if (!currentLayout().panels.some((p) => p.id === selectedPanel)) selectedPanel = 'hero';
      queuePreview();
    });
  });

  $('file-input').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const photo = await addPhoto(file);
      assignPhotoToPanel(photo, selectedPanel);
      setStatus(`Loaded ${photo.name} into ${panelLabel(selectedPanel)}.`);
    } catch (err) {
      setStatus(err.message);
    }
    e.target.value = '';
  });

  document.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const photo = await loadSample(btn.dataset.sample);
        assignPhotoToPanel(photo, selectedPanel);
        setStatus(`Sample “${photo.name}” loaded into ${panelLabel(selectedPanel)}.`);
      } catch (err) {
        setStatus(`Sample failed to load: ${err.message}`);
      }
    });
  });

  $('zoom').addEventListener('input', (e) => {
    selectedSlot().zoom = Number(e.target.value);
    queuePreview();
  });
  $('pan-x').addEventListener('input', (e) => {
    selectedSlot().ox = Number(e.target.value);
    queuePreview();
  });
  $('pan-y').addEventListener('input', (e) => {
    selectedSlot().oy = Number(e.target.value);
    queuePreview();
  });
  $('remove-photo').addEventListener('click', () => {
    assignPhotoToPanel(null, selectedPanel);
    setStatus(`Photo removed from ${panelLabel(selectedPanel)}.`);
  });
  $('fill-all').addEventListener('click', () => {
    const photo = findPhoto(state, selectedSlot().photoId);
    fillAllPanelsWith(photo);
    setStatus(`“${photo.name}” now fills every panel.`);
  });

  $('export-current').addEventListener('click', async () => {
    try { await exportSize(state.size); } catch (err) { setStatus(err.message); }
  });
  $('export-all').addEventListener('click', async () => {
    try { await exportAll(); } catch (err) { setStatus(err.message); }
  });

  // Drag to pan the selected panel's photo; wheel to zoom it.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  previewCanvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    previewCanvas.setPointerCapture(e.pointerId);
  });
  previewCanvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const slot = selectedSlot();
    const rect = previewCanvas.getBoundingClientRect();
    slot.ox += (e.clientX - lastX) / rect.width;
    slot.oy += (e.clientY - lastY) / rect.height;
    slot.ox = Math.max(-0.5, Math.min(0.5, slot.ox));
    slot.oy = Math.max(-0.5, Math.min(0.5, slot.oy));
    lastX = e.clientX;
    lastY = e.clientY;
    queuePreview();
  });
  previewCanvas.addEventListener('pointerup', () => { dragging = false; });
  previewCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const slot = selectedSlot();
    slot.zoom = Math.max(1, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    queuePreview();
  }, { passive: false });

  // Click a panel in the preview to select it.
  previewCanvas.addEventListener('click', (e) => {
    const rect = previewCanvas.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const hit = currentLayout().panels.find((p) => fx >= p.x && fx < p.x + p.w && fy >= p.y && fy < p.y + p.h);
    if (hit) {
      selectedPanel = hit.id;
      queuePreview();
    }
  });
}

// ---------- boot ----------

async function boot() {
  bindControls();
  // Wait for the display font before the first render, so screenshots and
  // exports always use DejaVu Sans Bold instead of a fallback.
  if (document.fonts) {
    try {
      await document.fonts.load('bold 80px "Vice Display"');
      await document.fonts.ready;
    } catch (e) { /* fall back to system sans-serif */ }
  }
  const params = new URLSearchParams(location.search);
  if (params.has('selftest')) {
    await runSelfTest(state, params);
    return;
  }
  await applyShotMode(state, params);
  renderPreview();
}

document.addEventListener('DOMContentLoaded', boot);
