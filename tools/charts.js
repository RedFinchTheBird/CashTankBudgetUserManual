// Data charts and concept diagrams for the user manual. buildCharts() returns
// { files: {name: svg}, values: {token: text} }; the values are quoted in the pages.

'use strict';

const D = require('./data');
const {
  COLOR, T, TL, R, L, P, C, polyline, svgDoc, niceTicks, scale, money, moneyK, pct, num,
  gridY, gridX, legend, spreadLabels, box,
} = require('./svg');

const CLASSES = D.PERFORMANCE.classes;
const FIRST_YEAR = D.PERFORMANCE.firstYear;
const PERIOD = CLASSES[0].growth.length;
const byName = name => CLASSES.find(c => c.name === name);
const sum = a => a.reduce((s, v) => s + v, 0);

// Long-run averages the planner uses for a blank investment growth/yield (normal market)
function averages(cls) {
  const product = cls.growth.reduce((v, g) => v * (1 + g / 100), 1);
  return { growth: (Math.pow(product, 1 / PERIOD) - 1) * 100, yield: sum(cls.yield) / PERIOD };
}

// FindDownMarketStartIndex: first year of the deepest decline within the horizon
function downMarketStart(weights, horizon) {
  const net = new Array(PERIOD).fill(0);
  Object.entries(weights).forEach(([name, w]) => {
    const c = byName(name);
    for (let i = 0; i < PERIOD; i++) net[i] += w * (c.growth[i] + c.yield[i]);
  });
  let start = 1, worst = 0;
  for (let s = 0; s < PERIOD; s++) {
    let v = 1, low = 1;
    for (let k = 0; k < horizon; k++) { v *= 1 + net[(s + k) % PERIOD] / 100; low = Math.min(low, v); }
    if (1 - low > worst + 1e-9) { worst = 1 - low; start = s + 1; }
  }
  return { start, worst };
}

// Federal tax on taxable income with ordinary brackets
function bracketTax(income, uppers, rates) {
  let tax = 0, lower = 0;
  uppers.forEach((u, i) => { if (income > lower) tax += (Math.min(income, u) - lower) * rates[i] / 100; lower = u; });
  return tax;
}

// Social Security benefits worksheet line 18 (taxable benefits)
function taxableSS(benefit, otherIncome, status) {
  const l2 = benefit / 2;
  const l7 = l2 + otherIncome;
  const l9 = Math.max(0, l7 - D.SS_WORKSHEET.base[status]);
  const l11 = Math.max(0, l9 - D.SS_WORKSHEET.additional[status]);
  const l14 = Math.min(l2, Math.min(l9, D.SS_WORKSHEET.additional[status]) / 2);
  return Math.min(l14 + l11 * 0.85, benefit * 0.85);
}

function header(title, sub) {
  return T(16, 26, title, { size: 15, weight: 600 }) + (sub ? T(16, 44, sub, { size: 11.5, color: COLOR.muted }) : '');
}

//------------------------------------------------------------------------------
// Asset classes
//------------------------------------------------------------------------------
function growthYield(cls) {
  const W = 760, H = 330, p = { x: 56, y: 70, w: 684, h: 220 };
  const last = FIRST_YEAR + PERIOD - 1;
  const totals = cls.growth.map((g, i) => g + cls.yield[i]);
  const tk = niceTicks(Math.min(0, ...cls.growth), Math.max(0, ...totals, ...cls.yield), 6);
  const sy = scale(tk.lo, tk.hi, p.y + p.h, p.y);
  const band = p.w / PERIOD, bw = band * 0.68;
  let b = header(`${cls.label} - growth and yield by year, ${FIRST_YEAR}-${last}`, cls.fund);
  b += gridY(p, tk, v => `${num(v)}%`, sy);
  cls.growth.forEach((g, i) => {
    const y = cls.yield[i], x = p.x + i * band + (band - bw) / 2;
    b += R(x, sy(Math.max(0, g)), bw, Math.abs(sy(g) - sy(0)), g >= 0 ? COLOR.blue : COLOR.red);
    if (y > 0) { const base = Math.max(0, g); b += R(x, sy(base + y), bw, sy(base) - sy(base + y), COLOR.green); }
    b += C(x + bw / 2, sy(g + y), 2.6, COLOR.text);
    const yr = FIRST_YEAR + i;
    if ((yr % 5 === 0 && yr < last - 2) || yr === last)
      b += T(p.x + i * band + band / 2, p.y + p.h + 17, yr === last ? `${yr} YTD` : String(yr), { anchor: 'middle', size: 11, color: COLOR.muted });
  });
  b += L(p.x, sy(0), p.x + p.w, sy(0), COLOR.slate, 1.2);
  b += legend(W - 16, 26, [
    { label: 'Growth', color: COLOR.blue }, { label: 'Down year', color: COLOR.red },
    { label: 'Yield', color: COLOR.green }, { label: 'Total return', color: COLOR.text, kind: 'dot' }], 'end');
  return svgDoc(W, H, `${cls.label} growth and yield by year`, b);
}

function averagesChart(values) {
  const W = 760, rowH = 46, p = { x: 170, y: 64, w: 420, h: rowH * CLASSES.length };
  const H = p.y + p.h + 44;
  const avg = CLASSES.map(averages);
  const tk = niceTicks(Math.min(-1, ...avg.map(a => a.growth)), Math.max(...avg.map(a => Math.max(a.growth, a.yield))), 6);
  const sx = scale(tk.lo, tk.hi, p.x, p.x + p.w);
  let b = header('Long-run averages used for a normal market', `Compound growth and average yield per year, ${FIRST_YEAR}-${FIRST_YEAR + PERIOD - 1}`);
  b += gridX(p, tk, v => `${num(v)}%`, sx);
  CLASSES.forEach((c, i) => {
    const a = avg[i], y = p.y + i * rowH + 8;
    b += T(p.x - 12, y + 18, c.label, { anchor: 'end', size: 12.5, weight: 600 });
    [[a.growth, COLOR.blue], [a.yield, COLOR.green]].forEach(([v, col], k) => {
      const yy = y + k * 16, x0 = sx(Math.min(0, v)), x1 = sx(Math.max(0, v));
      b += R(x0, yy, x1 - x0, 13, col, { rx: 2 });
      b += T(v >= 0 ? x1 + 5 : x0 - 5, yy + 10.5, pct(v, 2), { anchor: v >= 0 ? 'start' : 'end', size: 11, color: COLOR.text });
    });
    b += T(W - 16, y + 18, `= ${pct(a.growth + a.yield, 2)} a year`, { anchor: 'end', size: 11.5, color: COLOR.muted });
    values[`avg${c.name}Growth`] = pct(a.growth, 2);
    values[`avg${c.name}Yield`] = pct(a.yield, 2);
    values[`avg${c.name}Total`] = pct(a.growth + a.yield, 2);
  });
  b += L(sx(0), p.y, sx(0), p.y + p.h, COLOR.slate, 1.2);
  b += legend(W - 16, 26, [{ label: 'Growth (compound average)', color: COLOR.blue }, { label: 'Yield (average)', color: COLOR.green }], 'end');
  return svgDoc(W, H, 'Long-run asset class averages', b);
}

function growthOf10k(values) {
  const W = 760, H = 380, p = { x: 64, y: 64, w: 520, h: 270 };
  const years = Array.from({ length: PERIOD + 1 }, (_, i) => FIRST_YEAR - 1 + i);
  const series = CLASSES.map(c => {
    const pts = [10000];
    c.growth.forEach((g, i) => pts.push(pts[pts.length - 1] * (1 + (g + c.yield[i]) / 100)));
    return { c, pts };
  });
  const tk = niceTicks(0, Math.max(...series.map(s => Math.max(...s.pts))), 6);
  const sy = scale(tk.lo, tk.hi, p.y + p.h, p.y);
  const sx = scale(years[0], years[years.length - 1], p.x, p.x + p.w);
  let b = header('Growth of $10,000 with yield reinvested', `Start of ${FIRST_YEAR} to ${FIRST_YEAR + PERIOD - 1} (year to date); before taxes and fees`);
  b += gridY(p, tk, moneyK, sy);
  years.forEach(y => { if (y % 5 === 0) b += T(sx(y), p.y + p.h + 17, String(y), { anchor: 'middle', size: 11, color: COLOR.muted }); });
  const labels = series.map(s => ({ s, y: sy(s.pts[s.pts.length - 1]) + 4 }));
  spreadLabels(labels, 15, p.y, p.y + p.h + 4);
  series.forEach(s => { b += P(polyline(s.pts.map((v, i) => [sx(years[i]), sy(v)])), s.c.color, 2.4); });
  labels.forEach(l => {
    const end = l.s.pts[l.s.pts.length - 1];
    b += T(p.x + p.w + 10, l.y, `${l.s.c.label}  ${moneyK(end)}`, { size: 11.5, color: l.s.c.color, weight: 600 });
    values[`grow10k${l.s.c.name}`] = money(end);
  });
  b += L(p.x, p.y + p.h, p.x + p.w, p.y + p.h, COLOR.slate);
  return svgDoc(W, H, 'Growth of $10,000 by asset class', b);
}

function bondsPriceVsTotal(values) {
  const W = 760, H = 320, p = { x: 64, y: 64, w: 560, h: 210 };
  const c = byName('Bonds');
  const years = Array.from({ length: PERIOD + 1 }, (_, i) => FIRST_YEAR - 1 + i);
  const price = [10000], total = [10000];
  c.growth.forEach((g, i) => { price.push(price[i] * (1 + g / 100)); total.push(total[i] * (1 + (g + c.yield[i]) / 100)); });
  const tk = niceTicks(0, Math.max(...total), 5);
  const sy = scale(tk.lo, tk.hi, p.y + p.h, p.y);
  const sx = scale(years[0], years[years.length - 1], p.x, p.x + p.w);
  let b = header('Why yield matters: $10,000 in the total bond market', 'Growth only (price change) versus growth plus yield (interest reinvested)');
  b += gridY(p, tk, moneyK, sy);
  years.forEach(y => { if (y % 5 === 0) b += T(sx(y), p.y + p.h + 17, String(y), { anchor: 'middle', size: 11, color: COLOR.muted }); });
  b += P(polyline(total.map((v, i) => [sx(years[i]), sy(v)])), COLOR.green, 2.6);
  b += P(polyline(price.map((v, i) => [sx(years[i]), sy(v)])), COLOR.blue, 2.6);
  b += T(p.x + p.w + 8, sy(total[PERIOD]) + 4, `Growth + yield ${moneyK(total[PERIOD])}`, { size: 11.5, color: COLOR.greenDark, weight: 600 });
  b += T(p.x + p.w + 8, sy(price[PERIOD]) + 4, `Growth only ${moneyK(price[PERIOD])}`, { size: 11.5, color: COLOR.blueDark, weight: 600 });
  values.bondsPriceOnly = money(price[PERIOD]);
  values.bondsTotal = money(total[PERIOD]);
  return svgDoc(W, H, 'Bond growth only versus growth plus yield', b);
}

function stitching() {
  const W = 760, H = 320, p = { x: 56, y: 82, w: 684, h: 190 };
  const c = byName('DomStocks'), N = D.PERFORMANCE.stitchYears;
  const totals = Array.from({ length: N }, (_, i) => c.growth[i % PERIOD] + c.yield[i % PERIOD]);
  const tk = niceTicks(Math.min(...totals), Math.max(...totals), 5);
  const sy = scale(tk.lo, tk.hi, p.y + p.h, p.y);
  const band = p.w / N, bw = band * 0.72;
  const cycleColors = [COLOR.blue, COLOR.blueMid, COLOR.blueLight];
  let b = header('Stitching: the 27-year history repeats to cover 75 plan years', 'Domestic stocks total return by YEAR_NUMBER; every asset class repeats the same way, in step');
  b += gridY(p, tk, v => `${num(v)}%`, sy);
  totals.forEach((v, i) => {
    const x = p.x + i * band + (band - bw) / 2;
    b += R(x, sy(Math.max(0, v)), bw, Math.abs(sy(v) - sy(0)), cycleColors[Math.floor(i / PERIOD)]);
    if (i === 0 || (i + 1) % 10 === 0 || i === N - 1) b += T(p.x + i * band + band / 2, p.y + p.h + 17, String(i + 1), { anchor: 'middle', size: 11, color: COLOR.muted });
  });
  [PERIOD, 2 * PERIOD].forEach(k => { b += L(p.x + k * band, p.y - 6, p.x + k * band, p.y + p.h, COLOR.slate, 1.2, { dash: '4 3' }); });
  const label = (from, to, text) => T(p.x + ((from + to) / 2) * band, p.y - 12, text, { anchor: 'middle', size: 11.5, weight: 600, color: COLOR.slate });
  b += label(0, PERIOD, `Years 1-27 = ${FIRST_YEAR}-${FIRST_YEAR + PERIOD - 1}`);
  b += label(PERIOD, 2 * PERIOD, 'Years 28-54 = repeat');
  b += label(2 * PERIOD, N, 'Years 55-75 = repeat');
  b += L(p.x, sy(0), p.x + p.w, sy(0), COLOR.slate, 1.2);
  b += T(p.x + p.w / 2, H - 8, 'YEAR_NUMBER (1-based history index)', { anchor: 'middle', size: 11, color: COLOR.muted });
  return svgDoc(W, H, 'Performance history stitching', b);
}

function normalVsDown(values) {
  const W = 760, H = 360, p = { x: 70, y: 70, w: 560, h: 230 };
  const weights = { DomStocks: 0.6, Bonds: 0.4 }, horizon = 30, start = 1000000;
  const { start: idx, worst } = downMarketStart(weights, horizon);
  const normal = [start], down = [start];
  const parts = Object.entries(weights).map(([name, w]) => ({ c: byName(name), a: averages(byName(name)), n: start * w, d: start * w }));
  for (let k = 0; k < horizon; k++) {
    parts.forEach(pt => {
      const h = (idx - 1 + k) % PERIOD;
      pt.n *= 1 + (pt.a.growth + pt.a.yield) / 100;
      pt.d *= 1 + (pt.c.growth[h] + pt.c.yield[h]) / 100;
    });
    normal.push(sum(parts.map(pt => pt.n)));
    down.push(sum(parts.map(pt => pt.d)));
  }
  const tk = niceTicks(0, Math.max(...normal, ...down), 6);
  const sy = scale(tk.lo, tk.hi, p.y + p.h, p.y);
  const sx = scale(0, horizon, p.x, p.x + p.w);
  let b = header('Normal market versus down market', `$1M, 60% domestic stocks / 40% bonds, 30-year plan, no withdrawals`);
  b += gridY(p, tk, moneyK, sy);
  for (let k = 0; k <= horizon; k += 5) b += T(sx(k), p.y + p.h + 17, `Year ${k}`, { anchor: 'middle', size: 11, color: COLOR.muted });
  const lowIdx = down.indexOf(Math.min(...down));
  b += P(polyline(normal.map((v, k) => [sx(k), sy(v)])), COLOR.blue, 2.6);
  b += P(polyline(down.map((v, k) => [sx(k), sy(v)])), COLOR.red, 2.6);
  b += C(sx(lowIdx), sy(down[lowIdx]), 5, '#fff', { stroke: COLOR.red, strokeWidth: 2 });
  b += T(sx(lowIdx) + 10, sy(down[lowIdx]) + 18, `Low point ${moneyK(down[lowIdx])} in year ${lowIdx}`, { size: 11, weight: 600, color: COLOR.red });
  b += T(p.x + p.w + 8, sy(normal[horizon]) + 4, `Normal ${moneyK(normal[horizon])}`, { size: 11.5, weight: 600, color: COLOR.blueDark });
  b += T(p.x + p.w + 8, sy(down[horizon]) + 4, `Down ${moneyK(down[horizon])}`, { size: 11.5, weight: 600, color: COLOR.red });
  const startYear = FIRST_YEAR + idx - 1;
  b += T(p.x, H - 10, `Down market starts at history year ${idx} (${startYear}); normal market uses each class's long-run average every year.`, { size: 11, color: COLOR.muted });
  Object.assign(values, {
    downStartIndex: String(idx), downStartYear: String(startYear), downWorst: pct(worst * 100, 0),
    downLow: money(Math.min(...down)), downEnd: money(down[horizon]), normalEnd: money(normal[horizon]),
  });
  return svgDoc(W, H, 'Normal versus down market', b);
}

//------------------------------------------------------------------------------
// Taxes
//------------------------------------------------------------------------------
function federalBrackets() {
  const W = 760, H = 420, p = { x: 56, y: 64, w: 650, h: 300 }, maxX = 420000;
  const sx = scale(0, maxX, p.x, p.x + p.w), sy = scale(0, 40, p.y + p.h, p.y);
  let b = header('2026 federal marginal tax rate by taxable income', 'The rate that applies to the next dollar of taxable income (after deductions)');
  D.FEDERAL.rates.forEach(r => { b += L(p.x, sy(r), p.x + p.w, sy(r), COLOR.grid) + T(p.x - 8, sy(r) + 4, `${r}%`, { anchor: 'end', size: 11, color: COLOR.muted }); });
  b += gridX(p, niceTicks(0, maxX, 7), moneyK, sx, { noLines: true });
  const step = uppers => {
    const pts = []; let lower = 0;
    uppers.forEach((u, i) => {
      if (lower >= maxX) return;
      const hi = Math.min(u, maxX);
      pts.push([sx(lower), sy(D.FEDERAL.rates[i])], [sx(hi), sy(D.FEDERAL.rates[i])]);
      lower = u;
    });
    return polyline(pts);
  };
  b += P(step(D.FEDERAL.married), COLOR.orange, 3);
  b += P(step(D.FEDERAL.single), COLOR.blue, 3);
  b += L(p.x, p.y + p.h, p.x + p.w, p.y + p.h, COLOR.slate);
  b += legend(W - 16, 26, [{ label: 'Single', color: COLOR.blue, kind: 'line' }, { label: 'Married filing jointly', color: COLOR.orange, kind: 'line' }], 'end');
  b += T(p.x, H - 10, '37% applies above $640,600 (single) and $768,700 (married). Bracket edges rise each year with the tax forms inflation rate.', { size: 11, color: COLOR.muted });
  return svgDoc(W, H, '2026 federal tax brackets', b);
}

function taxExample(values) {
  const W = 760, H = 250, x0 = 30, w = 700, y = 92, h = 44, wages = 100000;
  const ded = D.DEDUCTIONS.standard.single, ti = wages - ded;
  const segs = [{ amt: ded, rate: 0, fill: COLOR.border, label: 'Standard deduction' }];
  let lower = 0;
  D.FEDERAL.single.forEach((u, i) => {
    if (ti > lower) segs.push({ amt: Math.min(ti, u) - lower, rate: D.FEDERAL.rates[i], fill: [COLOR.blueLight, COLOR.blueMid, COLOR.blue, COLOR.blueDark][i] || COLOR.blueDark, label: `${D.FEDERAL.rates[i]}% bracket` });
    lower = u;
  });
  const tax = bracketTax(ti, D.FEDERAL.single, D.FEDERAL.rates);
  let b = header('Example: federal tax on $100,000 of wages (single, 2026)', 'Each slice of income is taxed at its own bracket rate - only the top slice pays the top rate');
  let x = x0;
  segs.forEach(s => {
    const sw = (s.amt / wages) * w;
    b += R(x, y, sw, h, s.fill, { stroke: '#ffffff', strokeWidth: 2 });
    b += TL(x + sw / 2, y - 24, [s.label, money(s.amt)], { anchor: 'middle', size: 11, color: COLOR.text, lineHeight: 13 });
    b += T(x + sw / 2, y + h + 18, s.rate ? `tax ${money(s.amt * s.rate / 100)}` : 'no tax', { anchor: 'middle', size: 11.5, weight: 600, color: s.rate ? COLOR.blueDark : COLOR.muted });
    x += sw;
  });
  b += T(x0, y + h + 52, `Taxable income ${money(ti)}   |   Federal tax ${money(tax)}   |   Marginal rate 22%   |   Effective rate ${pct(tax / wages * 100)} of wages`, { size: 12.5, weight: 600 });
  Object.assign(values, { exTaxable: money(ti), exTax: money(tax), exEffective: pct(tax / wages * 100) });
  return svgDoc(W, H, 'Federal tax example', b);
}

function capitalGains(values) {
  const W = 760, H = 224, x0 = 30, w = 700, y = 96, h = 44, maxX = 70000;
  const ordinary = 40000, gains = 20000, edge = D.CAPITAL_GAINS.single[0];
  const sx = v => x0 + (v / maxX) * w;
  let b = header('Capital gains and qualified dividends stack on top of ordinary income', 'Single, 2026: $40,000 of ordinary taxable income plus $20,000 of long-term gains / qualified dividends');
  const segs = [
    { a: 0, z: ordinary, fill: COLOR.blueMid, label: 'Ordinary income', note: `taxed 10% / 12%: ${money(bracketTax(ordinary, D.FEDERAL.single, D.FEDERAL.rates))}` },
    { a: ordinary, z: edge, fill: COLOR.green, label: 'Gains at 0%', note: `${money(edge - ordinary)}: $0` },
    { a: edge, z: ordinary + gains, fill: COLOR.orange, label: 'Gains at 15%', note: `${money(ordinary + gains - edge)}: ${money((ordinary + gains - edge) * 0.15)}` },
  ];
  segs.forEach(s => {
    b += R(sx(s.a), y, sx(s.z) - sx(s.a), h, s.fill, { stroke: '#fff', strokeWidth: 2 });
    b += T((sx(s.a) + sx(s.z)) / 2, y - 10, s.label, { anchor: 'middle', size: 11.5, weight: 600 });
    b += T((sx(s.a) + sx(s.z)) / 2, y + h + 18, s.note, { anchor: 'middle', size: 11, color: COLOR.text });
  });
  b += L(sx(edge), y - 30, sx(edge), y + h + 30, COLOR.red, 1.5, { dash: '5 3' });
  b += T(sx(edge) + 6, y - 30, `${money(edge)}: top of the 0% capital gain bracket`, { size: 11, color: COLOR.red });
  [0, 10000, 20000, 30000, 40000, 50000, 60000, 70000].forEach(v => { b += T(sx(v), y + h + 48, moneyK(v), { anchor: 'middle', size: 10.5, color: COLOR.muted }); });
  values.cgTax15 = money((ordinary + gains - edge) * 0.15);
  return svgDoc(W, H, 'Capital gain stacking', b);
}

function deductionsByAge() {
  const W = 760, H = 360, p = { x: 70, y: 70, w: 640, h: 220 };
  const d = D.DEDUCTIONS;
  const scenarios = [
    { label: ['Single', 'under 65'], parts: [d.standard.single, 0, 0] },
    { label: ['Single', '65 or older'], parts: [d.standard.single, d.add65.single, d.senior.amount] },
    { label: ['Married', 'one 65 or older'], parts: [d.standard.married, d.add65.married, d.senior.amount] },
    { label: ['Married', 'both 65 or older'], parts: [d.standard.married, 2 * d.add65.married, 2 * d.senior.amount] },
  ];
  const tk = niceTicks(0, Math.max(...scenarios.map(s => sum(s.parts))), 5);
  const sy = scale(tk.lo, tk.hi, p.y + p.h, p.y);
  const colors = [COLOR.blueMid, COLOR.teal, COLOR.green];
  const band = p.w / scenarios.length, bw = 92;
  let b = header('2026 deductions by age and filing status', 'Standard deduction + age 65 add-on + senior deduction (2025-2028, before its phase-out)');
  b += gridY(p, tk, moneyK, sy);
  scenarios.forEach((s, i) => {
    const x = p.x + i * band + (band - bw) / 2;
    let base = 0;
    s.parts.forEach((v, k) => {
      if (!v) return;
      b += R(x, sy(base + v), bw, sy(base) - sy(base + v), colors[k], { stroke: '#fff' });
      if (sy(base) - sy(base + v) > 16) b += T(x + bw / 2, (sy(base) + sy(base + v)) / 2 + 4, moneyK(v), { anchor: 'middle', size: 11, color: '#fff', weight: 600 });
      base += v;
    });
    b += T(x + bw / 2, sy(base) - 8, money(base), { anchor: 'middle', size: 12, weight: 700 });
    b += TL(x + bw / 2, p.y + p.h + 18, s.label, { anchor: 'middle', size: 11.5, lineHeight: 14 });
  });
  b += legend(W - 16, 26, [{ label: 'Standard', color: colors[0] }, { label: '65+ add-on', color: colors[1] }, { label: 'Senior deduction', color: colors[2] }], 'end');
  return svgDoc(W, H, 'Deductions by age', b);
}

function seniorPhaseOut() {
  const W = 760, H = 330, p = { x: 70, y: 64, w: 560, h: 210 }, maxX = 300000;
  const s = D.DEDUCTIONS.senior;
  const sx = scale(0, maxX, p.x, p.x + p.w), sy = scale(0, 13000, p.y + p.h, p.y);
  const line = (start, people) => {
    const zero = start + s.amount / (s.phaseOutRate / 100);
    return polyline([[sx(0), sy(s.amount * people)], [sx(start), sy(s.amount * people)], [sx(zero), sy(0)], [sx(maxX), sy(0)]]);
  };
  let b = header('Senior deduction phase-out (2025-2028)', '$6,000 per person 65 or older, reduced by 6% of AGI above $75,000 (single) / $150,000 (married)');
  b += gridY(p, { t: [0, 3000, 6000, 9000, 12000] }, moneyK, sy);
  b += gridX(p, niceTicks(0, maxX, 6), moneyK, sx, { noLines: true });
  b += P(line(s.married, 2), COLOR.green, 3);
  b += P(line(s.married, 1), COLOR.orange, 3, { dash: '7 4' });
  b += P(line(s.single, 1), COLOR.blue, 3);
  b += L(p.x, p.y + p.h, p.x + p.w, p.y + p.h, COLOR.slate);
  b += T(p.x + p.w / 2, H - 10, 'Adjusted gross income (1040 line 11a)', { anchor: 'middle', size: 11, color: COLOR.muted });
  b += legend(W - 16, 26, [{ label: 'Single', color: COLOR.blue, kind: 'line' }, { label: 'Married, one 65+', color: COLOR.orange, kind: 'dash' }, { label: 'Married, both 65+', color: COLOR.green, kind: 'line' }], 'end');
  return svgDoc(W, H, 'Senior deduction phase-out', b);
}

//------------------------------------------------------------------------------
// Social Security
//------------------------------------------------------------------------------
function ssTaxable(values) {
  const W = 760, H = 340, p = { x: 70, y: 64, w: 520, h: 220 }, maxX = 100000;
  const sx = scale(0, maxX, p.x, p.x + p.w), sy = scale(0, 40000, p.y + p.h, p.y);
  const series = [
    { label: 'Single, $30,000 benefit', benefit: 30000, status: 'single', color: COLOR.blue },
    { label: 'Married, $40,000 benefits', benefit: 40000, status: 'married', color: COLOR.orange },
  ];
  let b = header('How much Social Security is taxable', 'Taxable benefits (1040 line 6b) versus other income, from the Social Security benefits worksheet');
  b += gridY(p, niceTicks(0, 40000, 4), moneyK, sy);
  b += gridX(p, niceTicks(0, maxX, 5), moneyK, sx, { noLines: true });
  series.forEach(s => {
    const pts = [];
    for (let x = 0; x <= maxX; x += 500) pts.push([sx(x), sy(taxableSS(s.benefit, x, s.status))]);
    b += L(p.x, sy(s.benefit * 0.85), p.x + p.w, sy(s.benefit * 0.85), s.color, 1, { dash: '4 3' });
    b += T(p.x + p.w + 6, sy(s.benefit * 0.85) + 4, `85% cap ${moneyK(s.benefit * 0.85)}`, { size: 11, color: s.color });
    b += P(polyline(pts), s.color, 3);
  });
  b += L(p.x, p.y + p.h, p.x + p.w, p.y + p.h, COLOR.slate);
  b += T(p.x + p.w / 2, H - 10, 'Other income: pensions, IRA withdrawals, wages, interest, dividends, gains, plus tax-exempt interest', { anchor: 'middle', size: 11, color: COLOR.muted });
  b += legend(W - 16, 26, series.map(s => ({ label: s.label, color: s.color, kind: 'line' })), 'end');
  values.ssTaxableAt40k = money(taxableSS(30000, 40000, 'single'));
  return svgDoc(W, H, 'Taxable Social Security', b);
}

function claimAgeBenefit(values) {
  const W = 760, H = 320, p = { x: 70, y: 64, w: 640, h: 200 };
  const min = 2100, full = 3000, max = 3720;
  const monthly = age => age <= 67 ? min + (full - min) * (age - 62) / 5 : full + (max - full) * (age - 67) / 3;
  const ages = [62, 63, 64, 65, 66, 67, 68, 69, 70];
  const sy = scale(0, 4000, p.y + p.h, p.y), band = p.w / ages.length, bw = band * 0.6;
  let b = header('Monthly benefit by claim age', 'Example: $2,100 at 62 (minimum), $3,000 at 67 (full), $3,720 at 70 (maximum); ages in between are interpolated');
  b += gridY(p, niceTicks(0, 4000, 4), moneyK, sy);
  ages.forEach((a, i) => {
    const v = monthly(a), x = p.x + i * band + (band - bw) / 2;
    const fill = a === 62 ? COLOR.orange : a === 67 ? COLOR.blueDark : a === 70 ? COLOR.green : COLOR.blueMid;
    b += R(x, sy(v), bw, sy(0) - sy(v), fill, { rx: 2 });
    b += T(x + bw / 2, sy(v) - 6, money(v), { anchor: 'middle', size: 11, weight: 600 });
    b += T(x + bw / 2, p.y + p.h + 17, String(a), { anchor: 'middle', size: 11.5 });
  });
  b += T(p.x + p.w / 2, H - 10, 'Claim age', { anchor: 'middle', size: 11, color: COLOR.muted });
  values.claimMonthly65 = money(monthly(65));
  return svgDoc(W, H, 'Monthly benefit by claim age', b);
}

function breakeven(values) {
  const W = 760, H = 350, p = { x: 80, y: 64, w: 540, h: 230 };
  const claims = [{ age: 62, m: 2100, color: COLOR.orange }, { age: 67, m: 3000, color: COLOR.blueDark }, { age: 70, m: 3720, color: COLOR.green }];
  const cum = (c, age) => (age < c.age ? 0 : (age - c.age + 1) * c.m * 12);
  const sx = scale(62, 95, p.x, p.x + p.w);
  const tk = niceTicks(0, cum(claims[2], 95), 6);
  const sy = scale(tk.lo, tk.hi, p.y + p.h, p.y);
  let b = header('Total benefits received by age (break-even)', "Same example, today's dollars before COLA and taxes; the later claim catches up at the crossing points");
  b += gridY(p, tk, moneyK, sy);
  for (let a = 62; a <= 95; a++) if (a % 5 === 0 || a === 62) b += T(sx(a), p.y + p.h + 17, String(a), { anchor: 'middle', size: 11, color: COLOR.muted });
  claims.forEach(c => {
    const pts = []; for (let a = 62; a <= 95; a++) pts.push([sx(a), sy(cum(c, a))]);
    b += P(polyline(pts), c.color, 3);
    b += T(p.x + p.w + 8, sy(cum(c, 95)) + 4, `Claim at ${c.age}`, { size: 11.5, weight: 600, color: c.color });
  });
  const cross = (a, z) => (z.m * 12 * (z.age - 1) - a.m * 12 * (a.age - 1)) / (z.m * 12 - a.m * 12);
  const marks = [[claims[0], claims[1]], [claims[0], claims[2]], [claims[1], claims[2]]];
  const notes = [];
  marks.forEach(([a, z]) => {
    const age = cross(a, z);
    b += C(sx(age), sy(cum(a, age)), 4.5, '#fff', { stroke: COLOR.slate });
    notes.push(`${a.age} vs ${z.age}: age ${age.toFixed(1)}`);
    values[`breakeven${a.age}vs${z.age}`] = age.toFixed(1);
  });
  b += R(p.x + p.w - 190, p.y + p.h - 80, 182, 70, '#ffffff', { stroke: COLOR.border, rx: 6 });
  b += T(p.x + p.w - 180, p.y + p.h - 60, 'Break-even ages', { size: 11.5, weight: 700 });
  b += TL(p.x + p.w - 180, p.y + p.h - 43, notes, { size: 11, color: COLOR.slate, lineHeight: 15 });
  b += T(p.x + p.w / 2, H - 10, 'Age', { anchor: 'middle', size: 11, color: COLOR.muted });
  return svgDoc(W, H, 'Social Security break-even', b);
}

//------------------------------------------------------------------------------
// RMDs
//------------------------------------------------------------------------------
function rmdPercent(values) {
  const W = 760, H = 320, p = { x: 56, y: 64, w: 680, h: 200 };
  const ages = []; for (let a = 72; a <= 100; a++) ages.push(a);
  const pctOf = a => 100 / D.RMD.divisors[a - D.RMD.firstAge];
  const tk = niceTicks(0, pctOf(100), 5), sy = scale(tk.lo, tk.hi, p.y + p.h, p.y);
  const band = p.w / ages.length, bw = band * 0.7;
  let b = header('Required minimum distribution as a share of the balance', 'RMD = prior year-end balance / IRS Uniform Lifetime Table divisor for your age');
  b += gridY(p, tk, v => `${num(v)}%`, sy);
  ages.forEach((a, i) => {
    const v = pctOf(a), x = p.x + i * band + (band - bw) / 2;
    b += R(x, sy(v), bw, sy(0) - sy(v), [73, 75].includes(a) ? COLOR.orange : COLOR.teal, { rx: 1.5 });
    if ([73, 75, 80, 85, 90, 95, 100].includes(a)) b += T(x + bw / 2, sy(v) - 6, pct(v), { anchor: 'middle', size: 10.5, weight: 600 });
    if (a % 5 === 0 || a === 73) b += T(x + bw / 2, p.y + p.h + 17, String(a), { anchor: 'middle', size: 11, color: COLOR.muted });
  });
  b += T(p.x + p.w / 2, H - 10, 'Age (orange: common RMD start ages 73 and 75)', { anchor: 'middle', size: 11, color: COLOR.muted });
  [75, 80, 90].forEach(a => { values[`rmdPct${a}`] = pct(pctOf(a), 2); values[`rmdDiv${a}`] = String(D.RMD.divisors[a - D.RMD.firstAge]); });
  return svgDoc(W, H, 'RMD percentage by age', b);
}

function rmdStartAge() {
  const W = 760, H = 170;
  let b = header('When RMDs start (SECURE 2.0)', 'The planner picks the start age from each tax payer\'s year of birth');
  const items = [['Born 1950 or earlier', 'RMDs start at 72'], ['Born 1951 - 1959', 'RMDs start at 73'], ['Born 1960 or later', 'RMDs start at 75']];
  items.forEach(([t, s], i) => {
    const x = 20 + i * 245;
    b += box(x, 66, 225, 76, t, [s], { fill: i === 2 ? COLOR.blueFaint : COLOR.panel, titleTop: 30, size: 14, color: COLOR.blueDark, lineHeight: 18 });
    if (i < 2) b += L(x + 228, 104, x + 242, 104, COLOR.slate, 1.5, { arrow: true });
  });
  return svgDoc(W, H, 'RMD start age by birth year', b);
}

function rmdExample(values) {
  const W = 760, H = 350, p = { x: 76, y: 64, w: 580, h: 230 };
  const ages = [], bal = [], rmd = []; let B = 500000;
  for (let a = 75; a <= 95; a++) {
    const r = B / D.RMD.divisors[a - D.RMD.firstAge];
    ages.push(a); bal.push(B); rmd.push(r);
    B = B * 1.05 - r;
  }
  const tkB = niceTicks(0, Math.max(...bal), 5), syB = scale(tkB.lo, tkB.hi, p.y + p.h, p.y);
  const tkR = niceTicks(0, Math.max(...rmd), 5), syR = scale(tkR.lo, tkR.hi, p.y + p.h, p.y);
  const band = p.w / ages.length, bw = band * 0.6;
  let b = header('Example: $500,000 IRA, RMDs from age 75, 5% growth a year', 'Bars = yearly RMD (right axis); line = balance at the start of each year (left axis)');
  b += gridY(p, tkB, moneyK, syB);
  tkR.t.forEach(v => { b += T(p.x + p.w + 8, syR(v) + 4, moneyK(v), { size: 11, color: COLOR.greenDark }); });
  ages.forEach((a, i) => {
    const x = p.x + i * band + (band - bw) / 2;
    b += R(x, syR(rmd[i]), bw, syR(0) - syR(rmd[i]), COLOR.green, { opacity: 0.85 });
    if (a % 5 === 0) b += T(x + bw / 2, p.y + p.h + 17, String(a), { anchor: 'middle', size: 11, color: COLOR.muted });
  });
  b += P(polyline(bal.map((v, i) => [p.x + i * band + band / 2, syB(v)])), COLOR.blue, 3);
  b += T(p.x + p.w / 2, H - 10, 'Age', { anchor: 'middle', size: 11, color: COLOR.muted });
  b += legend(W - 16, 26, [{ label: 'Balance', color: COLOR.blue, kind: 'line' }, { label: 'RMD', color: COLOR.green }], 'end');
  Object.assign(values, { rmdEx75: money(rmd[0]), rmdEx85: money(rmd[10]), rmdEx95: money(rmd[20]) });
  return svgDoc(W, H, 'RMD example', b);
}

//------------------------------------------------------------------------------
// Medicare / IRMAA
//------------------------------------------------------------------------------
function irmaaSteps(values) {
  const W = 760, H = 340, p = { x: 64, y: 64, w: 440, h: 220 }, maxX = 800000;
  const totals = D.IRMAA.partB.map((b, i) => b + D.IRMAA.partD[i]);
  const tk = niceTicks(0, 800, 4);
  const sx = scale(0, maxX, p.x, p.x + p.w), sy = scale(tk.lo, tk.hi, p.y + p.h, p.y);
  const step = uppers => {
    const pts = []; let lower = 0;
    uppers.forEach((u, i) => { const hi = Math.min(u, maxX); pts.push([sx(lower), sy(totals[i])], [sx(hi), sy(totals[i])]); lower = u; });
    return polyline(pts);
  };
  let b = header('2026 Medicare Part B + Part D IRMAA, per person per month', 'Set by modified AGI (AGI + tax-exempt interest) from two years earlier');
  b += gridY(p, tk, v => `$${v}`, sy);
  b += gridX(p, niceTicks(0, maxX, 4), moneyK, sx, { noLines: true });
  b += P(step(D.IRMAA.married), COLOR.orange, 3);
  b += P(step(D.IRMAA.single), COLOR.blue, 3);
  b += L(p.x, p.y + p.h, p.x + p.w, p.y + p.h, COLOR.slate);
  b += T(p.x + p.w / 2, H - 10, 'Modified AGI (1040 line 11a + line 2a)', { anchor: 'middle', size: 11, color: COLOR.muted });
  // Tier table
  const tx = p.x + p.w + 28, cols = [tx, tx + 70, tx + 148];
  b += T(cols[0], p.y + 4, 'Single', { size: 11, weight: 700, color: COLOR.blueDark });
  b += T(cols[1], p.y + 4, 'Married', { size: 11, weight: 700, color: COLOR.orange });
  b += T(cols[2], p.y + 4, 'Per month', { size: 11, weight: 700 });
  let lowS = 0, lowM = 0;
  totals.forEach((t, i) => {
    const y = p.y + 26 + i * 22, s = D.IRMAA.single[i], m = D.IRMAA.married[i];
    const range = (lo, hi) => (hi === Infinity ? `over ${moneyK(lo)}` : `to ${moneyK(hi)}`);
    if (i % 2 === 0) b += R(tx - 6, y - 14, 214, 22, COLOR.panel);
    b += T(cols[0], y, range(lowS, s), { size: 11 }) + T(cols[1], y, range(lowM, m), { size: 11 }) + T(cols[2], y, `$${t.toFixed(2)}`, { size: 11, weight: 600 });
    lowS = s; lowM = m;
  });
  b += legend(W - 16, 26, [{ label: 'Single', color: COLOR.blue, kind: 'line' }, { label: 'Married filing jointly', color: COLOR.orange, kind: 'line' }], 'end');
  values.irmaaBase = `$${totals[0].toFixed(2)}`;
  values.irmaaBaseYear = money(totals[0] * 12);
  values.irmaaTop = `$${totals[totals.length - 1].toFixed(2)}`;
  return svgDoc(W, H, 'IRMAA tiers', b);
}

function irmaaLookback() {
  const W = 760, H = 200;
  let b = header('The two-year lookback', 'Each year\'s income sets the Medicare premiums two years later');
  const years = [2026, 2027, 2028, 2029, 2030];
  years.forEach((y, i) => {
    const x = 26 + i * 146;
    b += box(x, 70, 120, 46, String(y), ['income (MAGI)'], { fill: COLOR.blueFaint, titleTop: 19 });
    b += box(x, 140, 120, 40, `${y} premiums`, [], { fill: COLOR.greenLight, titleTop: 25, titleSize: 12 });
    if (i >= 2) b += P(`M${x - 292 + 60},116 C${x - 292 + 60},130 ${x + 60},126 ${x + 60},139`, COLOR.slate, 1.5, { arrow: true });
  });
  b += T(26, 196 - 2, 'In the planner, plan years 1 and 2 have no earlier history, so they use plan year 1\'s MAGI.', { size: 11, color: COLOR.muted });
  return svgDoc(W, H + 4, 'IRMAA two-year lookback', b);
}

//------------------------------------------------------------------------------
// Roth conversions
//------------------------------------------------------------------------------
function rothBuckets(values) {
  const W = 760, H = 240, x0 = 110, w = 470, maxX = 230000;
  const sx = v => x0 + (v / maxX) * w;
  const ded = D.DEDUCTIONS.standard.single;
  let b = header('Roth buckets: convert until taxable income reaches the top of a bracket', 'Single, no other income, 2026 (federal tax shown; state tax is extra)');
  const fills = [COLOR.border, COLOR.blueLight, COLOR.blueMid, COLOR.blue, COLOR.blueDark];
  [[22, 2], [24, 3]].forEach(([rate, bi], row) => {
    const y = 70 + row * 70, top = D.FEDERAL.single[bi];
    b += T(x0 - 12, y + 22, `${rate}% bucket`, { anchor: 'end', size: 12.5, weight: 600 });
    let lower = 0;
    b += R(sx(0), y, sx(ded) - sx(0), 32, fills[0], { stroke: '#fff', strokeWidth: 2 });
    for (let i = 0; i <= bi; i++) {
      const u = D.FEDERAL.single[i];
      b += R(sx(ded + lower), y, sx(ded + u) - sx(ded + lower), 32, fills[i + 1], { stroke: '#fff', strokeWidth: 2 });
      lower = u;
    }
    const conv = ded + top, tax = bracketTax(top, D.FEDERAL.single, D.FEDERAL.rates);
    b += T(sx(conv) + 8, y + 14, `Convert ${money(conv)}`, { size: 12, weight: 700, color: COLOR.blueDark });
    b += T(sx(conv) + 8, y + 29, `federal tax ${money(tax)} (${pct(tax / conv * 100)})`, { size: 11, color: COLOR.muted });
    values[`roth${rate}Convert`] = money(conv);
    values[`roth${rate}Tax`] = money(tax);
  });
  b += legend(16, H - 14, [{ label: 'Standard deduction (no tax)', color: fills[0] }, { label: '10%', color: fills[1] }, { label: '12%', color: fills[2] }, { label: '22%', color: fills[3] }, { label: '24%', color: fills[4] }]);
  rothExamples(values);
  return svgDoc(W, H, 'Roth bucket conversion amounts', b);
}

// Worked examples on the Roth conversions page, with the engine's rules: the conversion
// comes last in the year and is the most that keeps taxable income at the bucket top.
function rothExamples(values) {
  const F = D.FEDERAL, ded = D.DEDUCTIONS, top22 = F.single[2];
  const tax = ti => bracketTax(ti, F.single, F.rates);

  // 1. The room left after the year's other income, IRA withdrawals included
  const pension = 30000, iraExpenses = 25000, iraLastTax = 5000;
  const income = pension + iraExpenses + iraLastTax, before = income - ded.standard.single;
  const convert = top22 - before;
  Object.assign(values, {
    rothExPension: money(pension), rothExIraExpenses: money(iraExpenses), rothExIraLastTax: money(iraLastTax),
    rothExIncome: money(income), rothExDeduction: money(ded.standard.single), rothExBefore: money(before),
    rothExTop: money(top22), rothExConvert: money(convert), rothExAfterIncome: money(income + convert),
    rothExTaxBefore: money(tax(before)), rothExTaxAfter: money(tax(top22)),
    rothExFedTax: money(tax(top22) - tax(before)), rothExStateTax: money(convert * D.STATE_RATE / 100),
  });

  // 2. Age 70, Social Security only: converting also makes benefits taxable and phases
  // out the senior deduction, so the planner converts less than the room
  const ss = 30000, std65 = ded.standard.single + ded.add65.single;
  const seniorAt = agi => Math.max(0, ded.senior.amount - Math.max(0, agi - ded.senior.single) * ded.senior.phaseOutRate / 100);
  const agiAt = x => x + taxableSS(ss, x, 'single');
  const taxableAt = x => Math.max(0, agiAt(x) - std65 - seniorAt(agiAt(x)));
  const room = top22 + std65 + seniorAt(0);
  let lo = 0, hi = room;
  while (hi - lo > 0.001) { const mid = (lo + hi) / 2; if (taxableAt(mid) <= top22) lo = mid; else hi = mid; }
  Object.assign(values, {
    rothSsBenefit: money(ss), rothSsDeductions: money(std65 + seniorAt(0)), rothSsStd65: money(std65),
    rothSsRoom: money(room), rothSsRoomTaxableSS: money(taxableSS(ss, room, 'single')), rothSsRoomAgi: money(agiAt(room)),
    rothSsRoomSenior: money(seniorAt(agiAt(room))), rothSsOverfill: money(taxableAt(room)),
    rothSsOverBy: money(taxableAt(room) - top22),
    rothSsConvert: money(lo), rothSsTaxableSS: money(taxableSS(ss, lo, 'single')), rothSsAgi: money(agiAt(lo)),
    rothSsSenior: money(seniorAt(agiAt(lo))),
  });
}

//------------------------------------------------------------------------------
// Diagrams
//------------------------------------------------------------------------------
function autoOrder() {
  const W = 760, H = 250;
  let b = header('Auto withdrawal order', 'When an expense, tax or Medicare bill is paid by Auto, accounts are used in this order');
  const items = [
    ['1. Savings', ['interest taxed', 'as it is earned']], ['2. Brokerage', ['gains on sales', '(1040 line 7a)']],
    ['3. IRA', ['ordinary income', '(1040 line 4a)']], ['4. 401(k)', ['ordinary income', '(1040 line 5a)']], ['5. Roth', ['tax free']],
  ];
  items.forEach(([t, s], i) => {
    const x = 16 + i * 150;
    b += box(x, 70, 126, 74, t, s, { fill: i === 4 ? COLOR.greenLight : COLOR.blueFaint, titleTop: 24 });
    if (i < items.length - 1) b += L(x + 128, 107, x + 147, 107, COLOR.slate, 1.6, { arrow: true });
  });
  b += TL(16, 178, [
    'Within a type, every account and investment pays in proportion to its balance; investments that lost value this year are used last.',
    'Checking, HSA and 529 accounts are not used by Auto. If Auto cannot cover the bill, the plan ends that year.',
  ], { size: 11.5, color: COLOR.text, lineHeight: 18 });
  return svgDoc(W, H, 'Auto withdrawal order', b);
}

function yearlySteps() {
  const W = 760, H = 300;
  let b = header('What the planner does each year', 'Plan year 1 is the current year; the steps repeat until the last life expectancy year');
  const steps = [
    ['1 Market', ['growth + yield on', 'each investment']], ['2 Income', ['wages and pensions', 'into their accounts']],
    ['3 Social Security', ['benefits into the', 'cash account']], ['4 RMDs', ['IRA / 401(k) minimum', 'into the cash account']],
    ['5 Expenses', ['from an account', 'or Auto']], ['6 Taxes + Medicare', ["last year's taxes,", "this year's IRMAA"]],
    ['7 Roth conversions', ['fill the chosen', 'bracket, last']], ['Close the year', ["this year's tax (paid", 'next year), NAV, forms']],
  ];
  steps.forEach(([t, s], i) => {
    const row = Math.floor(i / 4), col = i % 4;
    const x = row === 0 ? 16 + col * 186 : 16 + (3 - col) * 186, y = 66 + row * 110;
    b += box(x, y, 164, 76, t, s, { fill: i === 7 ? COLOR.greenLight : COLOR.blueFaint, titleTop: 24 });
    if (i < 3) b += L(x + 166, y + 38, x + 184, y + 38, COLOR.slate, 1.6, { arrow: true });
    if (i === 3) b += L(x + 82, y + 78, x + 82, y + 108, COLOR.slate, 1.6, { arrow: true });
    if (i > 3 && i < 7) b += L(x - 2, y + 38, x - 20, y + 38, COLOR.slate, 1.6, { arrow: true });
  });
  b += P('M16,214 C0,214 0,104 14,104', COLOR.slate, 1.4, { dash: '4 3', arrow: true });
  b += T(16, 290, 'Next year: amounts inflate, ages advance. The plan stops early if Auto cannot pay a bill.', { size: 11.5, color: COLOR.muted });
  return svgDoc(W, H, 'Yearly steps', b);
}

function yearCodes() {
  const W = 760, H = 286, x0 = 70, w = 640, first = 2026, last = 2062;
  const sx = y => x0 + ((y - first) / (last - first)) * w;
  let b = header('Plan milestones on a timeline', 'Example: Alex born 1964 retires and claims at 62; Jordan born 1967 retires and claims at 62');
  const rows = [
    { name: 'Alex', y: 150, end: 2056, color: COLOR.blue, marks: [[2026, ['YORTP1', 'SSCTP1']], [2039, ['RMDs start (75)']], [2056, ['YODTP1']]] },
    { name: 'Jordan', y: 220, end: 2062, color: COLOR.orange, marks: [[2029, ['YORTP2', 'SSCTP2']], [2042, ['RMDs start (75)']], [2062, ['YODTP2']]] },
  ];
  const axisY = 256;
  b += L(x0, axisY, x0 + w, axisY, COLOR.slate, 1.2);
  for (let y = first; y <= last; y++) if ((y - first) % 4 === 0 || y === last) b += L(sx(y), axisY - 4, sx(y), axisY + 4, COLOR.slate) + T(sx(y), axisY + 18, String(y), { anchor: 'middle', size: 10.5, color: COLOR.muted });
  [[first, 'SOP', 'start', 80], [2029, 'YORALL / SSCALL', 'start', 96], [last, 'YODALL', 'end', 80]].forEach(([yr, label, anchor, ty]) => {
    b += L(sx(yr), ty + 6, sx(yr), axisY, COLOR.greenDark, 1, { dash: '3 3' });
    b += T(sx(yr) + (anchor === 'start' ? 4 : -4), ty, label, { anchor, size: 11, weight: 700, color: COLOR.greenDark });
  });
  rows.forEach(r => {
    b += T(16, r.y + 4, r.name, { size: 12.5, weight: 700, color: r.color });
    b += L(sx(first), r.y, sx(r.end), r.y, r.color, 3);
    r.marks.forEach(([yr, labels]) => {
      const right = sx(yr) > x0 + w - 60;
      b += C(sx(yr), r.y, 6, '#fff', { stroke: r.color, strokeWidth: 2.5 });
      b += TL(sx(yr) + (right ? -8 : 8), r.y - 12 - (labels.length - 1) * 13, labels,
        { anchor: right ? 'end' : 'start', size: 10.5, weight: 600, color: COLOR.text, lineHeight: 13 });
    });
  });
  return svgDoc(W, H, 'Plan milestone timeline', b);
}

function optimizerCombos() {
  const W = 760, H = 250;
  let b = header('How many scenarios Run Plan tries', 'Every combination of the distinct choices you entered (example with three of each)');
  const items = [['3', 'TP1 retirement', 'ages'], ['3', 'TP1 claim', 'ages'], ['3', 'TP2 retirement', 'ages'], ['3', 'TP2 claim', 'ages'], ['3', 'Roth: none,', '22%, 24%'], ['2', 'markets:', 'normal, down']];
  items.forEach(([v, a, c], i) => {
    const x = 14 + i * 116;
    b += R(x, 66, 92, 84, COLOR.blueFaint, { stroke: COLOR.border, rx: 8 });
    b += T(x + 46, 98, v, { anchor: 'middle', size: 24, weight: 700, color: COLOR.blueDark });
    b += TL(x + 46, 118, [a, c], { anchor: 'middle', size: 10.5, color: COLOR.text, lineHeight: 13 });
    if (i < items.length - 1) b += T(x + 104, 112, 'x', { anchor: 'middle', size: 16, weight: 700, color: COLOR.slate });
  });
  b += T(W / 2, 186, '= 486 scenarios with two tax payers', { anchor: 'middle', size: 16, weight: 700, color: COLOR.blueDark });
  b += T(W / 2, 212, 'One tax payer: 3 x 3 x 3 x 2 = 54 scenarios. Repeated ages count once.', { anchor: 'middle', size: 12, color: COLOR.muted });
  return svgDoc(W, H, 'Run Plan scenario count', b);
}

function moneyFlow() {
  const W = 760, H = 370;
  let b = header('How money moves through the plan', 'Inflows land in accounts; bills are paid from a chosen account or by Auto');
  const left = [['Wages', 'until retirement'], ['Pensions', 'from retirement'], ['Social Security', 'from the claim age'], ['RMDs', 'from the RMD age']];
  left.forEach(([t, s], i) => { b += box(16, 66 + i * 70, 160, 54, t, [s], { fill: COLOR.greenLight, titleTop: 22 }); });
  b += R(286, 66, 190, 264, COLOR.blueFaint, { stroke: COLOR.border, rx: 10 });
  b += T(381, 90, 'Accounts', { anchor: 'middle', size: 14, weight: 700 });
  b += TL(381, 112, ['Savings, Checking, Brokerage', 'IRA, 401(k), Roth, HSA, 529', '', 'each holds investments that', 'grow and pay yield every year', '', 'Roth conversions move money', 'IRA / 401(k) -> Roth'], { anchor: 'middle', size: 11.5, color: COLOR.text, lineHeight: 16 });
  b += TL(381, 278, ['SS and RMDs go to the cash account:', 'first Savings, then Checking,', 'then Brokerage'], { anchor: 'middle', size: 10.5, color: COLOR.muted, lineHeight: 13 });
  const right = [['Living expenses', 'from an account or Auto'], ['Federal income tax', 'paid by Auto next year'], ['State income tax', 'paid by Auto next year'], ['Medicare premiums', 'from 65, paid by Auto']];
  right.forEach(([t, s], i) => { b += box(584, 66 + i * 70, 160, 54, t, [s], { fill: COLOR.orangeLight, titleTop: 22 }); });
  left.forEach((_, i) => { b += L(178, 93 + i * 70, 282, 120 + i * 50, COLOR.slate, 1.4, { arrow: true }); });
  right.forEach((_, i) => { b += L(478, 120 + i * 50, 580, 93 + i * 70, COLOR.slate, 1.4, { arrow: true }); });
  return svgDoc(W, H, 'Money flow', b);
}

function inflationExample(values) {
  const W = 760, H = 300, p = { x: 70, y: 64, w: 560, h: 190 };
  const base = 60000, rate = 3, years = 30;
  const pts = Array.from({ length: years }, (_, k) => base * Math.pow(1 + rate / 100, k));
  const tk = niceTicks(0, Math.max(...pts), 5), sy = scale(tk.lo, tk.hi, p.y + p.h, p.y), sx = scale(1, years, p.x, p.x + p.w);
  let b = header("Amounts are entered in today's dollars and inflated each year", '$60,000 of living expenses with a 3% inflation rate');
  b += gridY(p, tk, moneyK, sy);
  [1, 5, 10, 15, 20, 25, 30].forEach(k => { b += T(sx(k), p.y + p.h + 17, `Year ${k}`, { anchor: 'middle', size: 11, color: COLOR.muted }); });
  b += P(polyline(pts.map((v, k) => [sx(k + 1), sy(v)])), COLOR.orange, 3);
  b += T(sx(years) + 8, sy(pts[years - 1]) + 4, money(pts[years - 1]), { size: 12, weight: 700, color: COLOR.orange });
  b += T(sx(1) + 6, sy(base) + 18, `${money(base)} in plan year 1`, { size: 11.5, color: COLOR.text });
  values.inflation30 = money(pts[years - 1]);
  return svgDoc(W, H, 'Inflation example', b);
}

function buildCharts() {
  const values = {};
  const files = {};
  CLASSES.filter(c => c.name !== 'Cash').forEach(c => { files[`asset-${c.name.toLowerCase()}.svg`] = growthYield(c); });
  files['asset-averages.svg'] = averagesChart(values);
  files['asset-growth-of-10k.svg'] = growthOf10k(values);
  files['asset-bonds-yield.svg'] = bondsPriceVsTotal(values);
  files['asset-stitching.svg'] = stitching();
  files['market-normal-vs-down.svg'] = normalVsDown(values);
  files['tax-federal-brackets.svg'] = federalBrackets();
  files['tax-example.svg'] = taxExample(values);
  files['tax-capital-gains.svg'] = capitalGains(values);
  files['tax-deductions-by-age.svg'] = deductionsByAge();
  files['tax-senior-phaseout.svg'] = seniorPhaseOut();
  files['ss-taxable.svg'] = ssTaxable(values);
  files['ss-claim-age.svg'] = claimAgeBenefit(values);
  files['ss-breakeven.svg'] = breakeven(values);
  files['rmd-percent.svg'] = rmdPercent(values);
  files['rmd-start-age.svg'] = rmdStartAge();
  files['rmd-example.svg'] = rmdExample(values);
  files['irmaa-tiers.svg'] = irmaaSteps(values);
  files['irmaa-lookback.svg'] = irmaaLookback();
  files['roth-buckets.svg'] = rothBuckets(values);
  files['auto-withdrawal-order.svg'] = autoOrder();
  files['yearly-steps.svg'] = yearlySteps();
  files['year-codes-timeline.svg'] = yearCodes();
  files['optimizer-combinations.svg'] = optimizerCombos();
  files['money-flow.svg'] = moneyFlow();
  files['inflation-example.svg'] = inflationExample(values);
  return { files, values };
}

module.exports = { buildCharts };
