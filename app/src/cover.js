// Vice Cover Studio — cover rendering engine (plain canvas, no libraries).
// Turns a set of photos + a caption into a multi-panel GTA-style poster
// with a neon-sunset grade, in one of the three common post sizes.

export const SIZES = {
  square: { key: 'square', w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  portrait: { key: 'portrait', w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  landscape: { key: 'landscape', w: 1920, h: 1080, label: 'Landscape · 1920 × 1080' },
};

// Panel rects are fractions of the cover. The hero panel is the big one;
// the rest form a grid beside / below it. The caption is drawn over the
// bottom of the hero panel, GTA-poster style.
export const LAYOUTS = {
  square: {
    panels: [
      { id: 'hero', x: 0.0, y: 0.0, w: 1.0, h: 0.6, label: 'Hero' },
      { id: 'p1', x: 0.0, y: 0.6, w: 1 / 3, h: 0.4, label: 'Panel 1' },
      { id: 'p2', x: 1 / 3, y: 0.6, w: 1 / 3, h: 0.4, label: 'Panel 2' },
      { id: 'p3', x: 2 / 3, y: 0.6, w: 1 / 3, h: 0.4, label: 'Panel 3' },
    ],
  },
  portrait: {
    panels: [
      { id: 'hero', x: 0.0, y: 0.0, w: 1.0, h: 0.52, label: 'Hero' },
      { id: 'p1', x: 0.0, y: 0.52, w: 0.5, h: 0.24, label: 'Panel 1' },
      { id: 'p2', x: 0.5, y: 0.52, w: 0.5, h: 0.24, label: 'Panel 2' },
      { id: 'p3', x: 0.0, y: 0.76, w: 1 / 3, h: 0.24, label: 'Panel 3' },
      { id: 'p4', x: 1 / 3, y: 0.76, w: 1 / 3, h: 0.24, label: 'Panel 4' },
      { id: 'p5', x: 2 / 3, y: 0.76, w: 1 / 3, h: 0.24, label: 'Panel 5' },
    ],
  },
  landscape: {
    panels: [
      { id: 'hero', x: 0.0, y: 0.0, w: 0.58, h: 1.0, label: 'Hero' },
      { id: 'p1', x: 0.58, y: 0.0, w: 0.21, h: 0.5, label: 'Panel 1' },
      { id: 'p2', x: 0.79, y: 0.0, w: 0.21, h: 0.5, label: 'Panel 2' },
      { id: 'p3', x: 0.58, y: 0.5, w: 0.21, h: 0.5, label: 'Panel 3' },
      { id: 'p4', x: 0.79, y: 0.5, w: 0.21, h: 0.5, label: 'Panel 4' },
    ],
  },
};

export const SAMPLE_PHOTOS = [
  { key: 'beach', label: 'Sunset beach', path: 'samples/sample-beach.png' },
  { key: 'boulevard', label: 'Neon boulevard', path: 'samples/sample-boulevard.png' },
  { key: 'skyline', label: 'Dusk skyline', path: 'samples/sample-skyline.png' },
];

export function createCoverState() {
  return {
    size: 'landscape',
    title: 'VICE NIGHTS',
    subtitle: 'A SUNSET STORY IN THREE ACTS',
    titleScale: 1.0,
    grade: 0.7,
    photos: [], // { id, name, src, img }
    panels: {
      hero: { photoId: null, zoom: 1, ox: 0, oy: 0 },
      p1: { photoId: null, zoom: 1, ox: 0, oy: 0 },
      p2: { photoId: null, zoom: 1, ox: 0, oy: 0 },
      p3: { photoId: null, zoom: 1, ox: 0, oy: 0 },
      p4: { photoId: null, zoom: 1, ox: 0, oy: 0 },
      p5: { photoId: null, zoom: 1, ox: 0, oy: 0 },
    },
  };
}

export function findPhoto(state, id) {
  return state.photos.find((p) => p.id === id) || null;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Draw one photo into a panel rect with cover-fit, zoom and pan offsets.
// ox / oy are fractions of the panel size, -0.5 .. 0.5.
function drawPhotoInto(ctx, img, rect, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = 'contrast(1.12) saturate(1.28) brightness(1.03)';
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Neon-sunset grade: warm orange / pink / purple wash + vignette.
function applySunsetGrade(ctx, rect, strength) {
  if (strength <= 0) return;
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0.0, `rgba(255, 64, 128, ${0.34 * strength})`);
  g.addColorStop(0.45, `rgba(255, 140, 60, ${0.22 * strength})`);
  g.addColorStop(1.0, `rgba(122, 44, 196, ${0.38 * strength})`);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  // Vignette: darken the corners so the panels feel photographic.
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const r = Math.max(rect.w, rect.h) * 0.72;
  const v = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
  v.addColorStop(0, 'rgba(16, 4, 40, 0)');
  v.addColorStop(1, `rgba(16, 4, 40, ${0.5 * strength})`);
  ctx.fillStyle = v;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// Fallback art for an empty panel: a sunset gradient with a sun disc,
// so the poster still looks finished before any photo is loaded.
function drawEmptyPanel(ctx, rect, label) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, '#2b1055');
  g.addColorStop(0.5, '#7597de');
  g.addColorStop(0.55, '#ff7e5f');
  g.addColorStop(1, '#feb47b');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const sunR = Math.min(rect.w, rect.h) * 0.22;
  const sunX = rect.x + rect.w / 2;
  const sunY = rect.y + rect.h * 0.42;
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20, 8, 44, 0.55)';
  ctx.fillRect(rect.x, rect.y + rect.h * 0.62, rect.w, rect.h * 0.38);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.max(12, Math.round(rect.h * 0.09))}px "Vice Display", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, sunX, rect.y + rect.h * 0.8, rect.w * 0.9);
}

// Bold display caption over the bottom of the hero panel.
function drawCaption(ctx, state, heroRect, W) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (!title && !subtitle) return;
  const bandH = heroRect.h * 0.34;
  const bandY = heroRect.y + heroRect.h - bandH;
  // Legibility scrim.
  const scrim = ctx.createLinearGradient(0, bandY, 0, heroRect.y + heroRect.h);
  scrim.addColorStop(0, 'rgba(10, 2, 28, 0)');
  scrim.addColorStop(1, 'rgba(10, 2, 28, 0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(heroRect.x, bandY, heroRect.w, bandH);

  const cx = heroRect.x + heroRect.w / 2;
  const baseY = heroRect.y + heroRect.h - heroRect.h * 0.06;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (subtitle) {
    const subSize = Math.max(14, Math.round(W * 0.016 * state.titleScale));
    ctx.font = `bold ${subSize}px "Vice Display", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.42)}px`; } catch (e) { /* older canvas */ }
    ctx.fillStyle = '#ffd166';
    ctx.fillText(subtitle, cx, baseY - Math.round(W * 0.062 * state.titleScale), heroRect.w * 0.92);
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  }
  if (title) {
    const size = Math.round(W * 0.075 * state.titleScale);
    ctx.font = `bold ${size}px "Vice Display", sans-serif`;
    const grad = ctx.createLinearGradient(0, baseY - size, 0, baseY + size * 0.12);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#ffe9a8');
    grad.addColorStop(1, '#ff7e5f');
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1c0633';
    ctx.lineWidth = Math.max(4, size * 0.14);
    ctx.strokeText(title, cx, baseY, heroRect.w * 0.96);
    ctx.fillStyle = grad;
    ctx.fillText(title, cx, baseY, heroRect.w * 0.96);
    // Neon underline.
    const tw = Math.min(heroRect.w * 0.6, ctx.measureText(title).width * 0.9);
    const uy = baseY + size * 0.16;
    const ug = ctx.createLinearGradient(cx - tw / 2, uy, cx + tw / 2, uy);
    ug.addColorStop(0, '#ff2e88');
    ug.addColorStop(0.5, '#ffb347');
    ug.addColorStop(1, '#7b2ff7');
    ctx.fillStyle = ug;
    ctx.fillRect(cx - tw / 2, uy, tw, Math.max(3, size * 0.06));
  }
}

export function drawCover(canvas, state, sizeKey) {
  const size = SIZES[sizeKey] || SIZES.landscape;
  const W = size.w;
  const H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const gap = Math.max(4, Math.round(W * 0.007));
  // Deep purple-black gutters, GTA poster style.
  ctx.fillStyle = '#0d0718';
  ctx.fillRect(0, 0, W, H);

  const layout = LAYOUTS[sizeKey] || LAYOUTS.landscape;
  let heroRect = null;
  for (const p of layout.panels) {
    const rect = {
      x: Math.round(p.x * W) + gap,
      y: Math.round(p.y * H) + gap,
      w: Math.round(p.w * W) - gap * 2,
      h: Math.round(p.h * H) - gap * 2,
    };
    if (p.id === 'hero') heroRect = rect;
    const slot = state.panels[p.id] || { photoId: null, zoom: 1, ox: 0, oy: 0 };
    const photo = slot.photoId ? findPhoto(state, slot.photoId) : null;
    if (photo && photo.img) {
      drawPhotoInto(ctx, photo.img, rect, slot.zoom || 1, slot.ox || 0, slot.oy || 0);
      applySunsetGrade(ctx, rect, state.grade);
    } else {
      drawEmptyPanel(ctx, rect, p.label.toUpperCase());
    }
    // Thin bright frame around each panel.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, Math.round(W * 0.0016));
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  if (heroRect) drawCaption(ctx, state, heroRect, W);

  // Tiny original credit line, bottom-right corner, on a dark pill so it
  // stays legible over any panel photo.
  const credit = 'MADE WITH VICE COVER STUDIO';
  ctx.font = `bold ${Math.max(11, Math.round(W * 0.009))}px "Vice Display", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  const cw = ctx.measureText(credit).width;
  const ch = Math.max(11, Math.round(W * 0.009));
  const pillH = ch + gap * 1.6;
  const pillY = H - gap * 2.2 - pillH;
  const px = W - gap * 3 - cw - gap;
  ctx.fillStyle = 'rgba(13, 7, 24, 0.72)';
  ctx.beginPath();
  ctx.roundRect(px, pillY, cw + gap * 2, pillH, gap);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(credit, W - gap * 3 - gap, pillY + ch + gap * 0.5);
  return canvas;
}

// Render a full-resolution export canvas for one size.
export function renderExport(state, sizeKey) {
  const canvas = document.createElement('canvas');
  drawCover(canvas, state, sizeKey);
  return canvas;
}

// Fit a title into the hero width by shrinking the title scale.
export function fitTitleScale(state, sizeKey) {
  const size = SIZES[sizeKey] || SIZES.landscape;
  const layout = LAYOUTS[sizeKey] || LAYOUTS.landscape;
  const hero = layout.panels[0];
  const probe = document.createElement('canvas').getContext('2d');
  let scale = state.titleScale || 1;
  for (let i = 0; i < 8; i++) {
    probe.font = `bold ${Math.round(size.w * 0.075 * scale)}px "Vice Display", sans-serif`;
    const w = probe.measureText((state.title || '').toUpperCase()).width;
    if (w <= hero.w * size.w * 0.94) break;
    scale *= 0.88;
  }
  return scale;
}
