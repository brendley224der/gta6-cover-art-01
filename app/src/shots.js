// Fixed scenes for screenshots: ?shot=cover shows the cover alone at a chosen size,
// ?shot=editor shows the whole page with the sample photos loaded and a panel
// selected. window.__shotReady is set once the cover is painted with its font.
export async function runShot(params, api) {
  const shot = params.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const size = params.get('size') || (shot === 'cover' ? 'wide' : 'square');
  api.setSize(size);
  if (params.get('theme')) api.setTheme(params.get('theme'));
  if (params.get('layout')) api.setLayout(params.get('layout'));
  api.setCaption(
    params.get('caption') || 'VICE SUNSET',
    params.get('tagline') || 'ONE LAST RIDE · VICE CITY',
  );
  await api.loadSamples();
  api.redraw();
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch { /* fall back to system font */ }
    api.redraw();
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
