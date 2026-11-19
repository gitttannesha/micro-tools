// test.js — standalone Node test harness for subscription-reminder date/stage logic.
// NOT part of the static site; lives at the project root purely for manual QA.
// It copies the relevant pure functions out of tools/subscription-reminder/app.js
// (today, parse, left, stage) so they can be exercised with controlled "now" values
// without touching the DOM/localStorage that app.js also depends on.

const assert = require('assert');

// ---- copied from app.js ----
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

// today()/left()/stage() depend on "now". Parameterize them so we can inject a fixed
// reference time instead of the real Date.now(), matching app.js's real behaviour exactly.
function makeToday(now) {
  const d = now;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function makeLeft(now) {
  return dateStr => Math.round((parse(dateStr) - makeToday(now)) / 864e5);
}
// stage() exactly as in app.js, but takes `now` explicitly instead of calling `new Date()`.
function makeStage(now) {
  return l => l === 0 || (l === 1 && now.getHours() >= 19) ? 4 : l >= 3 ? 1 : l === 2 ? 2 : 3;
}

const CARD = { 1: '👍', 2: '🤔', 3: '😭', 4: '🤑' };

let pass = 0, fail = 0;
function check(label, actual, expected) {
  try {
    assert.deepStrictEqual(actual, expected);
    console.log(`PASS: ${label}`);
    pass++;
  } catch (e) {
    console.log(`FAIL: ${label} -> expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    fail++;
  }
}

function dateFromToday(now, offsetDays) {
  const t = makeToday(now);
  const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ---- Fixed reference "now" at 10:00 (before the 19:00 cutoff used by stage()) ----
const nowMorning = new Date(2026, 10, 18, 10, 0, 0); // Nov 18 2026, 10:00
const leftMorning = makeLeft(nowMorning);
const stageMorning = makeStage(nowMorning);

// 3 days left -> stage 1 -> 👍
{
  const l = leftMorning(dateFromToday(nowMorning, 3));
  check('3 days left -> l=3', l, 3);
  check('3 days left -> stage 1 (👍)', stageMorning(l), 1);
}
// 2 days left -> stage 2 -> 🤔
{
  const l = leftMorning(dateFromToday(nowMorning, 2));
  check('2 days left -> l=2', l, 2);
  check('2 days left -> stage 2 (🤔)', stageMorning(l), 2);
}
// 1 day left, before 19:00 -> stage 3 -> 😭
{
  const l = leftMorning(dateFromToday(nowMorning, 1));
  check('1 day left -> l=1', l, 1);
  check('1 day left, morning -> stage 3 (😭)', stageMorning(l), 3);
}
// 0 days left -> stage 4 -> 🤑
{
  const l = leftMorning(dateFromToday(nowMorning, 0));
  check('0 days left -> l=0', l, 0);
  check('0 days left -> stage 4 (🤑)', stageMorning(l), 4);
}

// ---- Fixed reference "now" at 20:00 (after the 19:00 cutoff) ----
const nowEvening = new Date(2026, 10, 18, 20, 0, 0);
const leftEvening = makeLeft(nowEvening);
const stageEvening = makeStage(nowEvening);
{
  const l = leftEvening(dateFromToday(nowEvening, 1));
  check('1 day left, evening -> l=1', l, 1);
  check('1 day left, evening (>=19:00) -> stage 4 (🤑), not 3', stageEvening(l), 4);
}

// ---- Ended trial (negative l) must not be treated as a live reminder ----
{
  const l = leftMorning(dateFromToday(nowMorning, -2));
  check('ended 2 days ago -> l=-2', l, -2);
  // app.js render(): `live` filter requires x.l >= 0, so negative l must be excluded.
  check('ended trial excluded from live reminders (l>=0 filter)', l >= 0, false);
}

// ---- DST / month-boundary sanity check for parse() + ymd() (local-date, no UTC shift) ----
{
  const d = parse('2026-01-01');
  check('parse("2026-01-01") keeps local Jan 1 (no UTC-shift-by-one bug)', [d.getFullYear(), d.getMonth(), d.getDate()], [2026, 0, 1]);
  check('ymd() round-trips the same local date', ymd(d), '20260101');
}

// ---- .ics alarm timing sanity: reminder days list + minute offsets (mirrors ics() in app.js) ----
{
  const remind = 3;
  const days = remind === 0 ? [0] : [...new Set([remind, 2, 1])].filter(d => d >= 1 && d <= remind);
  check('ics() alarm days for remind=3', days, [3, 2, 1]);
  const triggerMinutes = days.map(d => d * 1440 - 540); // same formula as app.js
  // d=3 -> 3*1440-540=3780 (before DTSTART, i.e. -PT3780M = 2.625 days before)
  // d=1 -> 1*1440-540=900  (-PT900M = 15h before midnight = 9:00am day before... )
  check('ics() trigger minutes for remind=3', triggerMinutes, [3780, 2340, 900]);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
