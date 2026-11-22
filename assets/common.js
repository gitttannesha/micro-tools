document.querySelectorAll('[data-year]').forEach(e=>{e.textContent=new Date().getFullYear()});

// Theme toggle: cycles Auto (follow system) -> Light -> Dark -> Auto.
// The initial theme is applied synchronously by an inline script in <head> (before paint)
// to avoid a flash of the wrong theme; this file only wires up the button + persists choice.
(() => {
  const KEY = 'theme';
  const order = ['auto', 'light', 'dark'];
  const icon = { auto: '🌓', light: '☀️', dark: '🌙' };
  const label = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const apply = mode => {
    if (mode === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', mode);
    btn.textContent = `${icon[mode]} ${label[mode]}`;
    btn.setAttribute('aria-label', `Theme: ${label[mode]}. Click to change.`);
  };
  let mode = localStorage.getItem(KEY) || 'auto';
  apply(mode);
  btn.addEventListener('click', () => {
    mode = order[(order.indexOf(mode) + 1) % order.length];
    try { localStorage.setItem(KEY, mode); } catch {}
    apply(mode);
  });
})();

// Interactive background: blobs drift slowly on their own (CSS animation), and also
// nudge slightly toward the pointer for a subtle parallax feel. Skipped entirely for
// users who prefer reduced motion, and on touch-only devices (no fine pointer).
(() => {
  const spans = document.querySelectorAll('.bg-blobs span');
  if (!spans.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches) return;
  const depth = [18, -14, 11];
  window.addEventListener('pointermove', e => {
    const dx = (e.clientX / window.innerWidth - 0.5) * 2;
    const dy = (e.clientY / window.innerHeight - 0.5) * 2;
    spans.forEach((s, i) => {
      s.style.setProperty('--mx', `${dx * depth[i % depth.length]}px`);
      s.style.setProperty('--my', `${dy * depth[i % depth.length]}px`);
    });
  }, { passive: true });
})();
