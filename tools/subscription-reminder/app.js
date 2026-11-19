(() => {
const KEY = 'reminders.v2', OLD_KEYS = ['reminders.v1', 'reminders'], $ = id => document.getElementById(id);
let items = load(), editId = null;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; }
    // Nothing under the current key yet: look for data left behind by an older schema
    // version so an upgrade doesn't silently strand (and appear to delete) a user's reminders.
    for (const k of OLD_KEYS) {
      const old = localStorage.getItem(k);
      if (!old) continue;
      const a = JSON.parse(old);
      if (Array.isArray(a) && a.length) { localStorage.setItem(KEY, JSON.stringify(a)); return a; }
    }
    return [];
  } catch { return []; }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { alert('Could not save. Your browser is blocking storage.'); } }
const h = (t, a = {}, ...k) => { const e = document.createElement(t); for (const [x, v] of Object.entries(a)) { if (x === 'class') e.className = v; else if (x.startsWith('on')) e.addEventListener(x.slice(2), v); else e.setAttribute(x, v); } e.append(...k); return e; };
const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const fmt = d => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const left = s => Math.round((parse(s.date) - today()) / 864e5);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const at = (d, h) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0);
const daysBefore = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
const lt = d => `${ymd(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

const ST = {
  1: l => ['👍', `Heads up! ${plural(l, 'day')} left.`, 'No stress, you have time to decide.'],
  2: () => ['🤔', '2 days left.', 'Okk, make sure to look into it.'],
  3: () => ['😭', 'Broooooooo, it ends tomorrow!', 'It needs attention.'],
  4: () => ['🤑', 'Bro u r rich... mmmmmm... wanna pay extra?', 'The charge is only hours away. Cancel now or enjoy the bill.']
};
// Charge is treated as starting at midnight of the end date, so "5 hours before" is 7 pm the night before.
const stage = l => l === 0 || (l === 1 && new Date().getHours() >= 19) ? 4 : l >= 3 ? 1 : l === 2 ? 2 : 3;

function render() {
  const all = items.map(s => ({ s, l: left(s) }));
  const live = all.filter(x => !x.s.cancelled && x.l >= 0).sort((a, b) => a.l - b.l);
  const rest = all.filter(x => x.s.cancelled || x.l < 0);

  const box = $('alerts'); box.replaceChildren(); const now = Date.now();
  live.forEach(({ s, l }) => {
    const st = stage(l);
    if (s.mute || now < (s.snooze || 0) || !(l <= s.remind || st === 4)) return;
    const [em, title, sub] = ST[st](l);
    const act = (t, f) => h('button', { type: 'button', class: 'rm-btn', onclick: () => { f(); save(); render(); } }, t);
    const extra = [];
    if (st === 4) {
      const img = h('img', { src: '../../assets/rich.gif', alt: '' }); img.addEventListener('error', () => img.remove());
      extra.push(img, h('div', { class: 'rm-rain', 'aria-hidden': 'true' }, '💸🤑💸🤑💸🤑💸🤑💸🤑'));
    }
    box.append(h('div', { class: 'rm-alert s' + st },
      h('div', { class: 'em', 'aria-hidden': 'true' }, em),
      h('div', {}, h('h4', {}, `${s.name}: ${title}`), h('p', {}, sub), ...extra,
        h('div', { class: 'rm-row' },
          act('⏰ Remind me later', () => { s.snooze = Date.now() + 3 * 36e5; }),
          act('🔕 Reminder not needed', () => { s.mute = true; }),
          act('✅ Already cancelled', () => { s.cancelled = true; })))));
  });

  const list = $('list'); list.replaceChildren();
  if (!all.length) list.append(h('div', { class: 'rm-empty' }, 'Nothing yet. Add the trial you are worried about forgetting.'));
  [...live, ...rest].forEach(({ s, l }) => {
    const b = (t, f, c = '') => h('button', { type: 'button', class: 'rm-btn ' + c, onclick: f }, t);
    const em = s.cancelled ? '✅' : l < 0 ? '⌛' : l >= 3 ? '👍' : l === 2 ? '🤔' : '😭';
    const status = s.cancelled ? 'Cancelled' : l < 0 ? `Ended ${plural(-l, 'day')} ago` : l === 0 ? 'Ends today' : l === 1 ? 'Ends tomorrow' : `${l} days left`;
    const off = s.cancelled || l < 0;
    list.append(h('div', { class: 'rm-item' + (off ? ' off' : l < 3 ? ' hot' : '') },
      h('div', {}, h('b', {}, `${em} ${s.name}`), h('div', { class: 'rm-meta' }, `${fmt(parse(s.date))} · ${status} · remind ${plural(s.remind, 'day')} before`)),
      h('div', { class: 'rm-row' },
        off ? '' : b('Add to calendar', () => ics(s)),
        off ? '' : b('Google Calendar', () => gcal(s)),
        b('Edit', () => edit(s.id)),
        s.mute && !off ? b('🔔 Reminders on', () => { s.mute = false; save(); render(); }) : '',
        b(s.cancelled ? 'Restore' : 'Mark cancelled', () => { s.cancelled = !s.cancelled; save(); render(); }),
        b('Delete', () => { if (confirm(`Delete ${s.name}?`)) { items = items.filter(x => x.id !== s.id); save(); render(); } }, 'del'))));
  });
}

function reset() { editId = null; $('f').reset(); $('remind').value = 3; $('formTitle').textContent = 'What should I remind you about?'; $('saveBtn').textContent = 'Remind me'; $('cancelEdit').hidden = true; }
function edit(id) {
  const s = items.find(x => x.id === id); if (!s) return; editId = id;
  $('name').value = s.name; $('date').value = s.date; $('remind').value = s.remind;
  $('formTitle').textContent = 'Edit reminder'; $('saveBtn').textContent = 'Save changes'; $('cancelEdit').hidden = false;
  $('name').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('name').focus();
}
$('cancelEdit').onclick = reset;
$('f').addEventListener('submit', e => {
  e.preventDefault();
  const d = { name: $('name').value.trim(), date: $('date').value, remind: Math.min(30, Math.max(0, parseInt($('remind').value, 10) || 0)) };
  if (!d.name || !d.date) return;
  if (editId) Object.assign(items.find(x => x.id === editId), d, { snooze: 0, mute: false });
  else items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), cancelled: false, ...d });
  const was = editId; save(); reset(); render();
  const m = $('saved'); m.hidden = false;
  m.textContent = was ? 'Changes saved.' : 'Saved. Reminders only show while this page is open, so add them to your calendar.';
});

function download(name, type, text) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function icsText(s, now = new Date()) {
  const day = parse(s.date), end = daysBefore(day, -1);
  const esc = x => x.replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  // remind = 0 has no useful same-day 9am slot: the charge is treated as happening at midnight,
  // so a 9am alert on the end date itself would fire after the charge already went through.
  // The always-added 7pm-night-before alarm below covers that case instead.
  const days = s.remind === 0 ? [] : [...new Set([s.remind, 2, 1])].filter(d => d >= 1 && d <= s.remind);
  const msg = d => d >= 3 ? `👍 Heads up: ${s.name} trial ends in ${d} days` : d === 2 ? `🤔 ${s.name}: 2 days left. Okk, make sure to look into it` : `😭 Broooooooo, ${s.name} ends tomorrow. It needs attention`;
  const list = days.map(d => [at(daysBefore(day, d), 9), msg(d)]);
  list.push([at(daysBefore(day, 1), 19), `🤑 Bro u r rich, mmmmmm... wanna pay extra? ${s.name} charges in 5 hours`]);
  const timed = list.filter(([st]) => st > now).map(([st, t], i) => [
    'BEGIN:VEVENT', `UID:${s.id}-r${i}-${ymd(day)}@microtools`, `DTSTAMP:${stamp}`,
    `DTSTART:${lt(st)}`, `DTEND:${lt(new Date(st.getTime() + 30 * 6e4))}`, `SUMMARY:${esc(t)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(t)}`, 'TRIGGER:-PT0M', 'END:VALARM', 'END:VEVENT']).flat();
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Micro Tools//Trial Reminder//EN',
    'BEGIN:VEVENT', `UID:${s.id}-end-${ymd(day)}@microtools`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(day)}`, `DTEND;VALUE=DATE:${ymd(end)}`,
    `SUMMARY:${esc(`Cancel or pay: ${s.name} trial ends`)}`,
    `DESCRIPTION:${esc(`${s.name} trial ends on ${fmt(day)}. Cancel before then if you do not want to be charged.`)}`, 'END:VEVENT',
    ...timed, 'END:VCALENDAR'].join('\r\n');
}
function ics(s) { download(s.name.replace(/\W+/g, '-').toLowerCase() + '-reminders.ics', 'text/calendar', icsText(s)); }
function gcal(s) {
  const day = parse(s.date), st = at(daysBefore(day, s.remind), 9);
  const dates = st > new Date() ? `${lt(st)}/${lt(new Date(st.getTime() + 30 * 6e4))}` : `${ymd(day)}/${ymd(daysBefore(day, -1))}`;
  const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(`Cancel or pay: ${s.name} trial ends ${fmt(day)}`) +
    '&dates=' + dates + '&details=' + encodeURIComponent(`${s.name} trial ends on ${fmt(day)}. Cancel before then if you do not want to be charged.`);
  window.open(url, '_blank', 'noopener');
}

$('export').onclick = () => download('reminders-backup.json', 'application/json', JSON.stringify(items, null, 2));
$('import').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const arr = JSON.parse(await f.text()); if (!Array.isArray(arr)) throw 0;
    const existing = new Set(items.map(x => x.name.trim().toLowerCase() + '|' + x.date));
    const ok = arr.filter(x => x && typeof x.name === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date))
      .map(x => ({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: x.name.slice(0, 60), date: x.date, remind: Math.min(30, Math.max(0, parseInt(x.remind, 10) || 0)), cancelled: !!x.cancelled }))
      .filter(x => !existing.has(x.name.trim().toLowerCase() + '|' + x.date) && existing.add(x.name.trim().toLowerCase() + '|' + x.date));
    if (!ok.length) { alert(arr.length ? 'Nothing new to import (already in your list).' : 'That file is not a valid backup from this tool.'); return; }
    const skipped = arr.length - ok.length;
    items = items.concat(ok); save(); render();
    alert(`Imported ${ok.length} reminder(s).${skipped > 0 ? ` Skipped ${skipped} duplicate or invalid entr${skipped === 1 ? 'y' : 'ies'}.` : ''}`);
  } catch { alert('That file is not a valid backup from this tool.'); }
};

render();
})();
