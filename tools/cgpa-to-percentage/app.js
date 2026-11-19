(() => {
const $ = id => document.getElementById(id);
// percentage = m × CGPA + o
const M = {
  cbse: { n: 'Standard (×9.5)', m: 9.5, o: 0 },
  ten: { n: 'Simple (×10)', m: 10, o: 0 },
  vtu: { n: 'VTU', m: 10, o: -7.5 },
  mum: { n: 'Mumbai University', m: 7.1, o: 11 }
};
const r2 = x => Math.round(x * 100) / 100;
const term = (m, o) => `${m} × CGPA${o ? (o > 0 ? ' + ' : ' − ') + Math.abs(o) : ''}`;

function pick() {
  const k = $('method').value;
  return k === 'custom' ? { n: 'Your formula', m: parseFloat($('cm').value) || 0, o: parseFloat($('co').value) || 0 } : M[k];
}

function calc() {
  const fwd = $('mode').value === 'fwd', raw = $('val').value, v = parseFloat(raw), f = pick();
  $('vlabel').textContent = fwd ? 'Your CGPA (out of 10)' : 'Your percentage';
  $('val').max = fwd ? 10 : 100;
  $('cmw').hidden = $('cow').hidden = $('method').value !== 'custom';
  $('rl').textContent = fwd ? 'Your percentage' : 'Your CGPA';
  const big = $('big'), how = $('how'), cmp = $('cmp'); cmp.innerHTML = '';
  if (raw === '' || isNaN(v)) { big.textContent = '–'; how.textContent = ''; return; }
  if (fwd ? (v < 0 || v > 10) : (v < 0 || v > 100)) { big.textContent = '–'; how.textContent = fwd ? 'Enter a CGPA between 0 and 10.' : 'Enter a percentage between 0 and 100.'; return; }
  if (!f.m) { big.textContent = '–'; how.textContent = 'The multiplier cannot be 0.'; return; }

  const conv = (x, g) => fwd ? g.m * x + g.o : (x - g.o) / g.m;
  const out = conv(v, f);
  big.textContent = fwd ? r2(out) + '%' : r2(out);
  how.textContent = fwd
    ? `${term(f.m, f.o).replace('CGPA', v)} = ${r2(out)}%`
    : `(${v} ${f.o ? (f.o > 0 ? '− ' : '+ ') + Math.abs(f.o) : ''}) ÷ ${f.m} = ${r2(out)}`.replace('  ', ' ');
  if (!fwd && (out < 0 || out > 10)) how.textContent += '. This is outside a 0 to 10 CGPA, so this formula does not fit that percentage.';

  cmp.innerHTML = Object.values(M).map(g => {
    const x = conv(v, g);
    return `<tr><td>${g.n}</td><td>${fwd ? r2(x) + '%' : (x < 0 || x > 10 ? 'n/a' : r2(x))}</td></tr>`;
  }).join('');
}
['mode', 'val', 'method', 'cm', 'co'].forEach(id => $(id).addEventListener('input', calc));
calc();
})();
