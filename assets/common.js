document.querySelectorAll('[data-year]').forEach(e=>{e.textContent=new Date().getFullYear()});

// Cookie consent banner: shown once until the visitor accepts or declines.
// The choice is only used to hide the banner; this site does not change what
// it loads based on the choice (AdSense cookies are disclosed in the privacy policy).
(() => {
  const KEY = 'cookie-consent';
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  if (localStorage.getItem(KEY)) return;
  banner.hidden = false;
  const setChoice = v => { try { localStorage.setItem(KEY, v); } catch {} banner.hidden = true; };
  document.getElementById('cookieAccept')?.addEventListener('click', () => setChoice('accepted'));
  document.getElementById('cookieDecline')?.addEventListener('click', () => setChoice('declined'));
})();

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
// react strongly to the mouse (parallax, mouse-with-pointer devices) and to page scroll
// (works on touch devices too, via the --sy variable each blob's transform already uses).
// Fully skipped for users who prefer reduced motion.
(() => {
  const spans = document.querySelectorAll('.bg-blobs span');
  if (!spans.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  if (window.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches) {
    const depth = [70, -55, 42];
    window.addEventListener('pointermove', e => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      spans.forEach((s, i) => {
        s.style.setProperty('--mx', `${dx * depth[i % depth.length]}px`);
        s.style.setProperty('--my', `${dy * depth[i % depth.length]}px`);
      });
    }, { passive: true });
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const sy = Math.min(window.scrollY, 1200);
      spans.forEach(s => s.style.setProperty('--sy', `${sy * 0.08}px`));
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
})();
