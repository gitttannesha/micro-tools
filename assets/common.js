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
