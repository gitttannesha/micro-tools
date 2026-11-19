(() => {
const $ = id => document.getElementById(id);
const inr = n => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
const num = id => Math.max(0, parseFloat($(id).value) || 0);

// New regime, FY 2026-27: slabs, 87A rebate up to 12 lakh taxable income (with marginal relief), 4% cess.
function tax(t) {
  const S = [[400000, 0], [800000, .05], [1200000, .10], [1600000, .15], [2000000, .20], [2400000, .25], [Infinity, .30]];
  let prev = 0, x = 0;
  for (const [up, r] of S) { if (t > prev) x += (Math.min(t, up) - prev) * r; prev = up; }
  x = t <= 1200000 ? 0 : Math.min(x, t - 1200000);
  return x * 1.04;
}

function calc() {
  const ctc = num('ctc'), variable = Math.min(num('var'), ctc), basicPct = Math.min(100, Math.max(10, num('basic')));
  const fixed = ctc - variable, basic = fixed * basicPct / 100;
  const pfBase = $('pfmode').value === 'cap' ? Math.min(basic / 12, 15000) : basic / 12;
  const pf = 0.12 * pfBase * 12;                       // same amount for employee and employer
  const grat = $('grat').checked ? basic * 0.0481 : 0;
  const gross = Math.max(0, fixed - pf - grat);        // paid gross, includes employee PF
  const pt = num('pt') * 12, oth = num('oth') * 12, SD = 75000;
  const taxFixed = tax(Math.max(0, gross - SD));
  const taxAll = tax(Math.max(0, gross + variable - SD));
  const net = (gross - pf - pt - oth - taxFixed) / 12;
  const varNet = variable - (taxAll - taxFixed);

  $('big').textContent = ctc ? inr(net) : '₹0';
  const row = (a, b, c = '') => `<tr class="${c}"><td>${a}</td><td>${b}</td></tr>`;
  $('rows').innerHTML = ctc ? [
    row('Monthly gross (fixed pay)', inr(gross / 12)),
    row('Employee PF', '− ' + inr(pf / 12)),
    row('Professional tax', '− ' + inr(pt / 12)),
    row('Other deductions', '− ' + inr(oth / 12)),
    row('Income tax (TDS), monthly', '− ' + inr(taxFixed / 12)),
    row('In-hand per month', inr(net), 'tot'),
    row('Employer PF + gratuity (in CTC, not paid monthly)', inr(pf + grat)),
    row('Variable pay after extra tax, per year', inr(varNet)),
    row('Total yearly take-home', inr(net * 12 + varNet), 'tot')
  ].join('') : '';
  $('warn').textContent = ctc > 5000000 ? 'Above ₹50 lakh, surcharge applies and is not included, so this estimate will be too high.' : '';
}
['ctc', 'var', 'basic', 'pfmode', 'pt', 'oth', 'grat'].forEach(id => $(id).addEventListener('input', calc));
calc();
})();
