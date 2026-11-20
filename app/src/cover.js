// Vice Cover Studio — the cover engine. Draws a multi-panel GTA-style poster cover
// (hero panel + side panels, white gutters, sunset / neon colour grade, bold condensed
// caption lettering) onto any canvas, at any of the three post sizes. No game art,
// no game fonts: the lettering is DejaVu Sans Bold, condensed and slanted in code.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

export const THEMES = {
  sunset: { name: 'Sunset', sky: '#ff2e88', low: '#ff7a18', deep: '#7b2ff7', sun: '#ffd319', ink: '#1c0a2e' },
  neon: { name: 'Neon night', sky: '#00e5ff', low: '#ff2e88', deep: '#120458', sun: '#7dffd4', ink: '#05021a' },
  palm: { name: 'Palm day', sky: '#00c2a8', low: '#ffd319', deep: '#ff5964', sun: '#fff3b0', ink: '#0a2e26' },
  noir: { name: 'Noir', sky: '#e8e8e8', low: '#9a9a9a', deep: '#111111', sun: '#ffffff', ink: '#000000' },
};

export const PANEL_NAMES = ['Hero', 'Panel 2', 'Panel 3'];

/** Panel rectangles for a size + layout, as fractions of the cover. */
export function panelLayout(sizeKey, layoutKey) {
  const tall = sizeKey === 'portrait';
  const wide = sizeKey === 'wide';
  if (layoutKey === 'split') {
    if (wide) return [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ];
    return [
      { x: 0, y: 0, w: 1, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 1, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
    ];
  }
  if (layoutKey === 'strip') {
    if (wide) return [
      { x: 0, y: 0, w: 0.66, h: 1 },
      { x: 0.66, y: 0, w: 0.34, h: 0.5 },
      { x: 0.66, y: 0.5, w: 0.34, h: 0.5 },
    ];
    if (tall) return [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
    ];
    return [
      { x: 0, y: 0, w: 1, h: 0.66 },
      { x: 0, y: 0.66, w: 0.5, h: 0.34 },
      { x: 0.5, y: 0.66, w: 0.5, h: 0.34 },
    ];
  }
  // poster: hero + two stacked side panels (or a bottom row when tall).
  if (tall) return [
    { x: 0, y: 0, w: 1, h: 0.58 },
    { x: 0, y: 0.58, w: 0.5, h: 0.42 },
    { x: 0.5, y: 0.58, w: 0.5, h: 0.42 },
  ];
  if (wide) return [
    { x: 0, y: 0, w: 0.55, h: 1 },
    { x: 0.55, y: 0, w: 0.45, h: 0.5 },
    { x: 0.55, y: 0.5, w: 0.45, h: 0.5 },
  ];
  return [
    { x: 0, y: 0, w: 0.62, h: 1 },
    { x: 0.62, y: 0, w: 0.38, h: 0.5 },
    { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
  ];
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
export function drawPanelPhoto(ctx, rect, photo, zoom, ox, oy, noir) {
  if (!photo) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#3d2360');
    g.addColorStop(1, '#1c0f30');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.round(rect.h * 0.09)}px "Vice Bold", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    return;
  }
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const maxX = Math.max(0, (dw - rect.w) / 2);
  const maxY = Math.max(0, (dh - rect.h) / 2);
  const dx = rect.x + (rect.w - dw) / 2 + Math.max(-maxX, Math.min(maxX, ox * rect.w * 0.45));
  const dy = rect.y + (rect.h - dh) / 2 + Math.max(-maxY, Math.min(maxY, oy * rect.h * 0.45));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (noir) ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.05)';
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

/** Sunset / neon colour grade over one panel: sky tint, warm glow, vignette. */
export function gradePanel(ctx, rect, theme, isHero) {
  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  tint.addColorStop(0, hexA(theme.sky, 0.0));
  tint.addColorStop(0.55, hexA(theme.sky, 0.10));
  tint.addColorStop(0.8, hexA(theme.low, 0.34));
  tint.addColorStop(1, hexA(theme.deep, 0.52));
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (isHero) {
    const glow = ctx.createRadialGradient(
      rect.x + rect.w * 0.72, rect.y + rect.h * 0.2, 0,
      rect.x + rect.w * 0.72, rect.y + rect.h * 0.2, rect.w * 0.75,
    );
    glow.addColorStop(0, hexA(theme.sun, 0.34));
    glow.addColorStop(1, hexA(theme.sun, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,2,20,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Bold condensed poster lettering: white fill, thick dark outline, neon shadow. */
export function drawPosterText(ctx, text, x, y, size, theme, align) {
  const label = text.trim().toUpperCase();
  if (!label) return;
  ctx.save();
  ctx.font = `700 ${size}px "Vice Bold", sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  // Condense + lean, GTA-poster style, without any game font. The transform
  // is applied about the text's own anchor point: skewing about the canvas
  // origin instead would shove the whole caption off the left edge.
  ctx.translate(x, y);
  ctx.transform(0.84, 0, -0.1, 1, 0, 0);
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = Math.max(4, size * 0.14);
  ctx.strokeText(label, 0, 0);
  ctx.shadowColor = hexA(theme.sky, 0.9);
  ctx.shadowBlur = size * 0.14;
  ctx.shadowOffsetY = size * 0.05;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

/** Fits the caption to the cover width, shrinking it until it fits. */
export function fitCaptionSize(ctx, caption, maxWidth, base) {
  let size = base;
  ctx.font = `700 ${size}px "Vice Bold", sans-serif`;
  while (size > 20 && ctx.measureText(caption.trim().toUpperCase()).width * 0.84 > maxWidth) {
    size -= 4;
    ctx.font = `700 ${size}px "Vice Bold", sans-serif`;
  }
  return size;
}

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * Draws the whole cover onto `canvas` (which must already be the target size).
 * state: { sizeKey, layout, theme, caption, tagline, capScale, panels, selected }
 * panels: [{ photo, zoom, ox, oy }] — photo is an <img>/<canvas> or null.
 * When opts.markSelected is true, the selected panel gets a dashed outline + tag.
 */
export function drawCover(canvas, state, opts) {
  const ctx = canvas.getContext('2d');
  const { w, h } = SIZES[state.sizeKey] || SIZES.square;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const theme = THEMES[state.theme] || THEMES.sunset;
  const noir = state.theme === 'noir';
  const gut = Math.max(6, Math.round(w * 0.008));
  const frame = Math.max(8, Math.round(w * 0.011));

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const rects = panelLayout(state.sizeKey, state.layout).map((r) => ({
    x: frame + r.x * (w - frame * 2),
    y: frame + r.y * (h - frame * 2),
    w: r.w * (w - frame * 2) - gut,
    h: r.h * (h - frame * 2) - gut,
  }));
  rects.forEach((rect, i) => {
    const p = state.panels[i] || {};
    drawPanelPhoto(ctx, rect, p.photo || null, p.zoom || 1, p.ox || 0, p.oy || 0, noir);
    gradePanel(ctx, rect, theme, i === 0);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = gut;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Dark scrim along the foot so the caption always reads.
  const bandH = h * 0.3;
  const scrim = ctx.createLinearGradient(0, h - bandH, 0, h);
  scrim.addColorStop(0, 'rgba(12,2,24,0)');
  scrim.addColorStop(0.55, 'rgba(12,2,24,0.55)');
  scrim.addColorStop(1, 'rgba(12,2,24,0.88)');
  ctx.fillStyle = scrim;
  ctx.fillRect(frame, h - bandH - frame, w - frame * 2, bandH + frame);

  const pad = frame + w * 0.035;
  const capBase = h * 0.115 * (state.capScale || 1);
  const capSize = fitCaptionSize(ctx, state.caption || '', w - pad * 2, capBase);
  const baseY = h - frame - h * 0.035;
  if ((state.tagline || '').trim()) {
    const tagSize = Math.max(18, Math.round(capSize * 0.26));
    ctx.save();
    ctx.font = `700 ${tagSize}px "Vice Bold", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(tagSize * 0.32)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = Math.max(3, tagSize * 0.18);
    const tagY = baseY - capSize * 0.92;
    ctx.strokeText(state.tagline.trim().toUpperCase(), pad, tagY);
    ctx.fillStyle = theme.sun;
    ctx.fillText(state.tagline.trim().toUpperCase(), pad, tagY);
    ctx.restore();
  }
  drawPosterText(ctx, state.caption || '', pad, baseY, capSize, theme, 'left');

  if (opts && opts.markSelected && typeof state.selected === 'number') {
    const r = rects[state.selected];
    if (r) {
      ctx.save();
      ctx.strokeStyle = '#ffd319';
      ctx.lineWidth = Math.max(4, w * 0.005);
      ctx.setLineDash([w * 0.02, w * 0.012]);
      ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      ctx.setLineDash([]);
      const tag = PANEL_NAMES[state.selected] || 'Panel';
      const fs = Math.max(16, Math.round(h * 0.024));
      ctx.font = `700 ${fs}px "Vice Bold", sans-serif`;
      const tw = ctx.measureText(tag).width + fs * 1.2;
      ctx.fillStyle = '#ffd319';
      ctx.fillRect(r.x + 2, r.y + 2, tw, fs * 1.7);
      ctx.fillStyle = '#241103';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tag, r.x + 2 + fs * 0.6, r.y + 2 + fs * 0.85);
      ctx.restore();
    }
  }
}

/** Renders the cover at a size into a fresh offscreen canvas (for export). */
export function renderCover(state, sizeKey) {
  const { w, h } = SIZES[sizeKey];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, { ...state, sizeKey });
  return canvas;
}
