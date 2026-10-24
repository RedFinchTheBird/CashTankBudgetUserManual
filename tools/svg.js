// SVG drawing helpers shared by the chart and wireframe generators.

'use strict';

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const COLOR = {
  text: '#1f2937', muted: '#6b7280', light: '#9ca3af', grid: '#e5e7eb', axis: '#94a3b8',
  blue: '#3b82f6', blueDark: '#1d4ed8', blueMid: '#60a5fa', blueLight: '#bfdbfe', blueFaint: '#dbeafe',
  green: '#22c55e', greenDark: '#15803d', greenLight: '#bbf7d0',
  red: '#ef4444', redLight: '#fecaca', orange: '#f59e0b', orangeLight: '#fde68a',
  purple: '#8b5cf6', teal: '#14b8a6', tealLight: '#99f6e4', gray: '#94a3b8', slate: '#475569',
  panel: '#f8fafc', border: '#cbd5e1', cream: '#fffdf2', navBlue: '#2563eb',
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = v => (Number.isFinite(v) ? +v.toFixed(1) : 0);

// Text; o: anchor, size, weight, color, rotate, italic, baseline
function T(x, y, s, o = {}) {
  const a = [`x="${n(x)}"`, `y="${n(y)}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.size) a.push(`font-size="${o.size}"`);
  if (o.weight) a.push(`font-weight="${o.weight}"`);
  a.push(`fill="${o.color || COLOR.text}"`);
  if (o.baseline) a.push(`dominant-baseline="${o.baseline}"`);
  if (o.italic) a.push('font-style="italic"');
  if (o.rotate) a.push(`transform="rotate(${o.rotate} ${n(x)} ${n(y)})"`);
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}

// Several lines of text, lineHeight apart
function TL(x, y, lines, o = {}) {
  const lh = o.lineHeight || (o.size || 12) * 1.3;
  return lines.map((s, i) => T(x, y + i * lh, s, o)).join('');
}

function R(x, y, w, h, fill, o = {}) {
  const a = [`x="${n(x)}"`, `y="${n(y)}"`, `width="${n(Math.max(0, w))}"`, `height="${n(Math.max(0, h))}"`, `fill="${fill}"`];
  if (o.stroke) a.push(`stroke="${o.stroke}"`, `stroke-width="${o.strokeWidth || 1}"`);
  if (o.rx) a.push(`rx="${o.rx}"`);
  if (o.dash) a.push(`stroke-dasharray="${o.dash}"`);
  if (o.opacity) a.push(`opacity="${o.opacity}"`);
  return `<rect ${a.join(' ')}/>`;
}

function L(x1, y1, x2, y2, stroke, w = 1, o = {}) {
  const a = [`x1="${n(x1)}"`, `y1="${n(y1)}"`, `x2="${n(x2)}"`, `y2="${n(y2)}"`, `stroke="${stroke}"`, `stroke-width="${w}"`];
  if (o.dash) a.push(`stroke-dasharray="${o.dash}"`);
  if (o.arrow) a.push('marker-end="url(#arrow)"');
  return `<line ${a.join(' ')}/>`;
}

function P(d, stroke, w = 2, o = {}) {
  const a = [`d="${d}"`, `fill="${o.fill || 'none'}"`, `stroke="${stroke}"`, `stroke-width="${w}"`, 'stroke-linejoin="round"'];
  if (o.dash) a.push(`stroke-dasharray="${o.dash}"`);
  if (o.arrow) a.push('marker-end="url(#arrow)"');
  if (o.opacity) a.push(`opacity="${o.opacity}"`);
  return `<path ${a.join(' ')}/>`;
}

const C = (x, y, r, fill, o = {}) =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.strokeWidth || 1.5}"` : ''}/>`;

const polyline = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${n(p[0])},${n(p[1])}`).join(' ');

function svgDoc(w, h, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ` +
    `font-family="${FONT}" font-size="12" role="img">\n<title>${esc(title)}</title>\n` +
    `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" ` +
    `orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${COLOR.slate}"/></marker></defs>\n` +
    `<rect width="${w}" height="${h}" fill="#ffffff"/>\n${body}\n</svg>\n`;
}

// Round, evenly spaced axis ticks covering [min, max]
function niceTicks(min, max, count = 5) {
  if (max - min < 1e-9) max = min + 1;
  const raw = (max - min) / count;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const t = [];
  for (let v = lo; v <= hi + step * 1e-6; v += step) t.push(+v.toFixed(10));
  return { lo, hi, step, t };
}

const scale = (d0, d1, r0, r1) => v => r0 + ((v - d0) * (r1 - r0)) / (d1 - d0);

const money = v => (v < 0 ? '-$' : '$') + Math.round(Math.abs(v)).toLocaleString('en-US');
const moneyK = v => {
  const a = Math.abs(v);
  const s = a >= 1e6 ? `${+(a / 1e6).toFixed(a % 1e6 ? 1 : 0)}M` : a >= 1000 ? `${+(a / 1000).toFixed(a % 1000 ? 1 : 0)}k` : `${Math.round(a)}`;
  return (v < 0 ? '-$' : '$') + s;
};
const pct = (v, d = 1) => `${v.toFixed(d)}%`;
const num = v => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : String(+v.toFixed(2)));

// Horizontal grid lines with labels on the left of plot area p
function gridY(p, tk, fmt, sy) {
  return tk.t.map(v => L(p.x, sy(v), p.x + p.w, sy(v), COLOR.grid) +
    T(p.x - 8, sy(v) + 4, fmt(v), { anchor: 'end', size: 11, color: COLOR.muted })).join('');
}

// Vertical grid lines with labels under plot area p
function gridX(p, tk, fmt, sx, o = {}) {
  return tk.t.map(v => (o.noLines ? '' : L(sx(v), p.y, sx(v), p.y + p.h, COLOR.grid)) +
    T(sx(v), p.y + p.h + 16, fmt(v), { anchor: 'middle', size: 11, color: COLOR.muted })).join('');
}

// Legend: items [{label, color, kind: 'box'|'line'|'dot'|'dash'}]; align 'start' or 'end' at x
function legend(x, y, items, align = 'start') {
  const widths = items.map(it => 26 + it.label.length * 6.3);
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = align === 'end' ? x - total : x;
  let out = '';
  items.forEach((it, i) => {
    if (it.kind === 'line') out += L(cx, y - 4, cx + 16, y - 4, it.color, 3);
    else if (it.kind === 'dash') out += L(cx, y - 4, cx + 16, y - 4, it.color, 2, { dash: '4 3' });
    else if (it.kind === 'dot') out += C(cx + 8, y - 4, 3.5, it.color);
    else out += R(cx, y - 10, 14, 12, it.color, { rx: 2 });
    out += T(cx + 20, y, it.label, { size: 11.5, color: COLOR.text });
    cx += widths[i];
  });
  return out;
}

// Spreads label y positions so they are at least gap apart (for line end labels)
function spreadLabels(items, gap, minY, maxY) {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i].y - sorted[i - 1].y < gap) sorted[i].y = sorted[i - 1].y + gap;
  const over = sorted.length ? sorted[sorted.length - 1].y - maxY : 0;
  if (over > 0) sorted.forEach(s => { s.y -= over; });
  for (let i = sorted.length - 2; i >= 0; i--)
    if (sorted[i + 1].y - sorted[i].y < gap) sorted[i].y = sorted[i + 1].y - gap;
  sorted.forEach(s => { s.y = Math.max(minY, s.y); });
  return items;
}

// Rounded box with a bold title and optional lines of smaller text
function box(x, y, w, h, title, lines = [], o = {}) {
  let out = R(x, y, w, h, o.fill || COLOR.panel, { stroke: o.stroke || COLOR.border, rx: o.rx || 8, strokeWidth: o.strokeWidth || 1.2 });
  const cx = x + w / 2;
  const top = y + (o.titleTop || 20);
  out += T(cx, top, title, { anchor: 'middle', weight: 600, size: o.titleSize || 13, color: o.titleColor || COLOR.text });
  out += TL(cx, top + 17, lines, { anchor: 'middle', size: o.size || 11, color: o.color || COLOR.muted, lineHeight: o.lineHeight || 14 });
  return out;
}

module.exports = {
  FONT, COLOR, esc, n, T, TL, R, L, P, C, polyline, svgDoc, niceTicks, scale, money, moneyK, pct, num,
  gridY, gridX, legend, spreadLabels, box,
};
