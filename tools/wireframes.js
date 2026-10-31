// SVG wireframe mockups of the financial planner screens that are still in progress.
// They follow the layout of uframeFinancialPlanNew: left navigation, content header and
// one page per navigation item. Data shown is sample data.

'use strict';

const { COLOR, T, TL, R, L, C, svgDoc } = require('./svg');

const W = 960;
const NAV_W = 228;
const NAV_BG = '#fefbea';
const ACTIVE = '#2563eb';
const HEADER_GRAY = '#808080';

const PLAN_ITEMS = ['Tax Payers', 'Income, Expenses', 'Investments', 'Plan Results'];
const OTHER_ITEMS = ['Income Brackets', 'Medicare Brackets', 'RMD Table', 'Asset Classes', 'General Settings'];

function fit(s, width, size = 11) {
  const max = Math.max(1, Math.floor((width - 10) / (size * 0.56)));
  s = String(s);
  return s.length > max ? `${s.slice(0, max - 1)}...` : s;
}

// Left navigation: the frame's Plan Settings / Other Settings lists and the Run Plan button
function nav(active, H) {
  let b = R(0, 0, NAV_W, H, NAV_BG);
  let y = 26;
  const section = title => { b += T(12, y, title, { size: 12, color: COLOR.text }); y += 14; };
  const item = label => {
    const on = label === active;
    if (on) b += R(12, y, NAV_W - 24, 30, ACTIVE, { rx: 6 });
    b += R(26, y + 9, 13, 13, on ? '#ffffff' : '#94a3b8', { rx: 6.5, opacity: on ? 0.85 : 0.7 });
    b += T(52, y + 20, label, { size: 12, color: on ? '#ffffff' : COLOR.text });
    y += 32;
  };
  section('Plan Settings'); PLAN_ITEMS.forEach(item); y += 8;
  section('Other Settings'); OTHER_ITEMS.forEach(item); y += 8;
  section('Actions');
  b += R(12, y, NAV_W - 24, 30, '#ffffff', { stroke: COLOR.slate, rx: 3 });
  b += C(NAV_W / 2 - 34, y + 15, 7, 'none', { stroke: COLOR.text, strokeWidth: 1.3 });
  b += T(NAV_W / 2 - 18, y + 20, 'Run Plan', { size: 12 });
  return b;
}

// Whole frame: navigation, content title, content panel and the "preview" badge
function frame(active, title, H, content) {
  let b = nav(active, H);
  b += R(NAV_W, 0, W - NAV_W, H, NAV_BG);
  b += T(NAV_W + 16, 28, title, { size: 15, weight: 700 });
  b += R(NAV_W + 12, 42, W - NAV_W - 24, H - 54, '#f3f4f6', { stroke: '#e5e7eb' });
  b += R(W - 214, 12, 200, 22, '#fff7ed', { stroke: COLOR.orange, rx: 11 });
  b += T(W - 114, 27, 'Preview - screen in progress', { anchor: 'middle', size: 11, weight: 600, color: '#b45309' });
  b += content({ x: NAV_W + 20, y: 50, w: W - NAV_W - 40, h: H - 70 });
  return svgDoc(W, H, `${title} screen (preview)`, b);
}

// Simple list (like the frame's nav lists) with an optional selected item
function list(x, y, w, items, selected, o = {}) {
  let b = R(x, y, w, o.h || items.length * 34 + 10, '#ffffff', { stroke: '#e5e7eb' });
  items.forEach((it, i) => {
    const iy = y + 6 + i * 34;
    if (i === selected) b += R(x + 6, iy, w - 12, 28, ACTIVE, { rx: 5 });
    b += T(x + 16, iy + 18, it, { size: 12, color: i === selected ? '#fff' : COLOR.text });
  });
  return b;
}

function button(x, y, w, label, o = {}) {
  return R(x, y, w, 26, o.primary ? ACTIVE : '#ffffff', { stroke: o.primary ? ACTIVE : COLOR.border, rx: 4 }) +
    T(x + w / 2, y + 17, label, { anchor: 'middle', size: 11.5, weight: o.primary ? 600 : 400, color: o.primary ? '#fff' : COLOR.text });
}

function panelHeader(x, y, w, title) {
  return R(x, y, w, 26, HEADER_GRAY) + T(x + 10, y + 17, title, { size: 12, color: '#ffffff' });
}

// Grid: cols [[title, width, align]], rows of cell text; o.selected = highlighted row,
// o.rowStyles = { rowIndex: { fill, color, weight } } for marked rows
function grid(x, y, cols, rows, o = {}) {
  const rowH = o.rowH || 24, w = cols.reduce((s, c) => s + c[1], 0);
  let b = R(x, y, w, rowH * (rows.length + 1) + (o.extraRows || 0) * rowH, '#ffffff', { stroke: COLOR.border });
  b += R(x, y, w, rowH, '#eef2f7', { stroke: COLOR.border });
  let cx = x;
  cols.forEach(([title, cw, align]) => {
    b += T(align === 'right' ? cx + cw - 6 : cx + 6, y + 16, fit(title, cw, 11), { anchor: align === 'right' ? 'end' : 'start', size: 11, weight: 600 });
    cx += cw;
    b += L(cx, y, cx, y + rowH * (rows.length + 1 + (o.extraRows || 0)), '#e5e7eb');
  });
  rows.forEach((r, ri) => {
    const ry = y + rowH * (ri + 1);
    const style = (o.rowStyles || {})[ri] || {};
    if (ri === o.selected) b += R(x + 1, ry, w - 2, rowH, '#dbeafe');
    else if (style.fill) b += R(x + 1, ry, w - 2, rowH, style.fill);
    b += L(x, ry + rowH, x + w, ry + rowH, '#eef2f7');
    let rx = x;
    r.forEach((cell, ci) => {
      const [, cw, align] = cols[ci];
      const picker = typeof cell === 'object' && cell !== null;
      const text = picker ? cell.text : cell;
      b += T(align === 'right' ? rx + cw - 6 : rx + 6, ry + 16, fit(text, picker ? cw - 18 : cw, 11), { anchor: align === 'right' ? 'end' : 'start', size: 11, color: style.color || COLOR.text, weight: style.weight });
      if (picker) b += R(rx + cw - 18, ry + 5, 13, 14, '#ffffff', { stroke: COLOR.slate, rx: 2 }) + T(rx + cw - 11.5, ry + 15, '...', { anchor: 'middle', size: 9 });
      rx += cw;
    });
  });
  return b;
}

function field(x, y, w, label, value, o = {}) {
  let b = T(x, y, label, { size: 11, color: COLOR.text });
  b += R(x, y + 6, w, 28, '#ffffff', { stroke: COLOR.border, rx: 2 });
  b += T(o.left ? x + 8 : x + w - (o.picker ? 34 : 8), y + 25, value, { anchor: o.left ? 'start' : 'end', size: 12 });
  if (o.picker) b += R(x + w - 28, y + 9, 22, 22, '#ffffff', { stroke: COLOR.slate, rx: 3 });
  if (o.note) b += T(x + w, y + 46, o.note, { anchor: 'end', size: 10, color: COLOR.muted });
  return b;
}

function callout(x, y, w, lines) {
  return R(x, y, w, lines.length * 15 + 12, '#fffbeb', { stroke: COLOR.orange, rx: 6 }) +
    TL(x + 10, y + 18, lines, { size: 11, color: '#92400e', lineHeight: 15 });
}

//------------------------------------------------------------------------------
// Screens
//------------------------------------------------------------------------------
function incomeExpenses() {
  return frame('Income, Expenses', 'Income, Expenses', 520, c => {
    let b = R(c.x, c.y, 66, 26, '#ffffff', { stroke: COLOR.border }) + T(c.x + 33, c.y + 17, 'Income', { anchor: 'middle', size: 12, weight: 700 });
    b += R(c.x + 66, c.y, 80, 26, '#eef2f7', { stroke: COLOR.border }) + T(c.x + 106, c.y + 17, 'Expenses', { anchor: 'middle', size: 12 });
    b += T(c.x, c.y + 50, 'Categories', { size: 11.5, weight: 600, color: COLOR.muted });
    b += list(c.x, c.y + 58, 130, ['Wages', 'Pensions'], 0, { h: 300 });
    b += button(c.x, c.y + 366, 130, '+ Add category') + button(c.x, c.y + 398, 130, '- Delete category');
    const cols = [['Description', 96], ['Start', 86], ['End', 96], ['From', 60], ['To', 86], ['Amount', 62, 'right'], ['Inflation', 52, 'right']];
    b += grid(c.x + 146, c.y + 58, cols, [
      ['Jordan salary', { text: 'SOP (2026)' }, { text: 'YORTP2 (2029)' }, 'Jordan', 'Joint Savings', '$85,000', '3.00%'],
      ['Alex consulting', { text: '2027' }, { text: '2030' }, 'Alex', 'Brokerage', '$20,000', '0.00%'],
    ], { selected: 0, extraRows: 7 });
    b += button(c.x + 146, c.y + 366, 120, '+ Add income') + button(c.x + 276, c.y + 366, 120, '- Delete income');
    b += callout(c.x + 146, c.y + 404, 538, [
      'Start / End: click ... to pick a plan milestone (SOP, YORTP1, SSCALL, YODALL ...) or a calendar year.',
      'From: a tax payer (wages) or a tax payer\'s pension. To: the account that receives the money.',
    ]);
    return b;
  });
}

function investments() {
  return frame('Investments', 'Investments', 560, c => {
    let b = T(c.x, c.y + 14, 'Financial institutions', { size: 11.5, weight: 600, color: COLOR.muted });
    b += list(c.x, c.y + 22, 150, ['Vanguard', 'Fidelity', 'Local Bank'], 0, { h: 360 });
    b += button(c.x, c.y + 392, 150, '+ Add institution') + button(c.x, c.y + 424, 150, '- Delete institution');
    const gx = c.x + 166;
    b += T(gx, c.y + 14, 'Accounts at Vanguard', { size: 11.5, weight: 600, color: COLOR.muted });
    b += grid(gx, c.y + 22, [['Account', 200], ['Type', 120], ['Trustee', 120]], [
      ['Alex IRA', 'IRA', 'Alex'], ['Jordan Roth', 'Roth', 'Jordan'], ['Joint Brokerage', 'Brokerage', 'Joint']], { selected: 0 });
    b += T(gx, c.y + 150, 'Investments in Alex IRA', { size: 11.5, weight: 600, color: COLOR.muted });
    b += grid(gx, c.y + 158, [['Investment', 112], ['Ticker', 54], ['Asset class', 76], ['Growth', 54, 'right'], ['Yield', 48, 'right'], ['Mix', 42, 'right'], ['Basis', 66, 'right'], ['Balance', 72, 'right']], [
      ['Total Stock Mkt', 'VTSAX', 'DomStocks', '', '', '60%', '$300,000', '$450,000'],
      ['Total Bond Mkt', 'VBTLX', 'Bonds', '2.00%', '3.50%', '40%', '$280,000', '$300,000']], { extraRows: 2 });
    b += T(gx + 524, c.y + 290, 'Mix total 100%', { anchor: 'end', size: 11, weight: 600, color: COLOR.greenDark });
    b += callout(gx, c.y + 310, 524, [
      'Every investment needs an asset class. Leave Growth / Yield blank to use the class\'s long-run',
      'average in a normal market. Mix = how new deposits are split; it must total 100% per account.',
      'Starting basis is what you paid (for capital gains on taxable accounts).',
    ]);
    return b;
  });
}

// Scenario banner shown at the top of Plan Results, with the Change Scenario button
const SCENARIO_LINES = [
  'Scenario #486  -  Down and Flat market  -  lasts through 2062 with $7,651,288',
  'Alex retires 67, claims 70  -  Jordan retires 65, claims 70  -  Roth 24% bucket',
];

// Choose a Plan Scenario dialog (opened from Plan Results), filtered to the down market
function scenarioDialog() {
  const DW = 960, DH = 520;
  let b = R(0, 0, DW, DH, '#ffffff', { stroke: COLOR.border });
  b += R(0, 0, DW, 34, '#f3f4f6', { stroke: COLOR.border });
  b += T(16, 22, 'Choose a Plan Scenario', { size: 13, weight: 600 });
  b += T(DW - 22, 22, 'X', { anchor: 'middle', size: 12, color: COLOR.muted });
  b += R(DW - 254, 44, 200, 22, '#fff7ed', { stroke: COLOR.orange, rx: 11 });
  b += T(DW - 154, 59, 'Preview - screen in progress', { anchor: 'middle', size: 11, weight: 600, color: '#b45309' });
  b += T(20, 60, 'Run Plan tried 486 scenarios. Choose the one whose year-by-year results you want to see.', { size: 12.5 });

  // Best scenario summary, with a link that selects it
  b += R(20, 76, DW - 40, 32, '#f0fdf4', { stroke: COLOR.greenDark, rx: 6 });
  b += T(34, 97, '\u2605 Best: #482  -  Alex retires 67, claims 70; Jordan retires 65, claims 70; no Roth; lasts through 2062 with $7,878,852', { size: 11.5, color: COLOR.greenDark, weight: 600 });
  b += T(DW - 34, 97, 'Select it', { anchor: 'end', size: 11.5, weight: 600, color: ACTIVE });
  b += L(DW - 82, 100, DW - 34, 100, ACTIVE);

  // Market filter and legend
  b += T(20, 136, 'Market:', { size: 12, weight: 600 });
  [['All', false, 76], ['Normal', false, 132], ['Down and Flat', true, 210]].forEach(([label, on, x]) => {
    b += C(x, 132, 6, '#ffffff', { stroke: COLOR.slate, strokeWidth: 1.2 });
    if (on) b += C(x, 132, 3, ACTIVE);
    b += T(x + 11, 136, label, { size: 12 });
  });
  b += R(450, 125, 14, 14, '#dcfce7', { stroke: COLOR.greenDark });
  b += T(470, 136, '\u2605 Best scenario', { size: 11.5 });
  b += T(580, 136, 'Red = money runs out before the end', { size: 11.5, color: '#b91c1c' });
  b += T(DW - 20, 136, '243 of 486 scenarios', { anchor: 'end', size: 11.5, color: COLOR.muted });

  // Scenario grid: sorted by Alex retires, Plan ends, NAV at end (all descending); nothing selected
  const cols = [['', 24], ['Scenario', 66, 'right'], ['Alex retires \u25BC', 100, 'right'], ['Alex claims', 92, 'right'],
    ['Jordan retires', 104, 'right'], ['Jordan claims', 104, 'right'], ['Roth', 74], ['Market', 124],
    ['Plan ends \u25BC', 90, 'right'], ['NAV at end \u25BC', 142, 'right']];
  const rows = [
    ['\u2605', '482', '67', '70', '65', '70', 'None', 'Down and Flat', '2062', '$7,878,852'],
    ['', '484', '67', '70', '65', '70', '22%', 'Down and Flat', '2062', '$7,764,310'],
    ['', '476', '67', '70', '65', '67', 'None', 'Down and Flat', '2062', '$7,702,945'],
    ['', '486', '67', '70', '65', '70', '24%', 'Down and Flat', '2062', '$7,651,288'],
    ['', '478', '67', '70', '65', '67', '22%', 'Down and Flat', '2062', '$7,590,137'],
    ['', '464', '67', '70', '63', '70', 'None', 'Down and Flat', '2062', '$7,433,906'],
    ['', '428', '67', '67', '65', '70', 'None', 'Down and Flat', '2062', '$7,302,571'],
    ['', '...', '', '', '', '', '', '', '', ''],
    ['', '4', '62', '62', '60', '62', '22%', 'Down and Flat', '2050', '$0'],
    ['', '6', '62', '62', '60', '62', '24%', 'Down and Flat', '2049', '$0'],
  ];
  b += grid(20, 152, cols, rows, { rowStyles: { 0: { fill: '#dcfce7', weight: 600 }, 8: { color: '#b91c1c' }, 9: { color: '#b91c1c' } } });

  // Footer: hint and buttons (View Results stays disabled until a row is clicked)
  b += T(20, 450, 'Click a row, then View Results - or double-click the row. Click a column heading to sort by it.', { size: 11.5, color: COLOR.muted });
  b += R(DW - 258, 472, 130, 30, '#e5e7eb', { stroke: '#d1d5db', rx: 4 });
  b += T(DW - 193, 491, 'View Results', { anchor: 'middle', size: 12, weight: 600, color: '#9ca3af' });
  b += R(DW - 118, 472, 98, 30, '#ffffff', { stroke: COLOR.border, rx: 4 });
  b += T(DW - 69, 491, 'Cancel', { anchor: 'middle', size: 12 });
  return svgDoc(DW, DH, 'Choose a Plan Scenario dialog (preview)', b);
}

function planResultsGrid() {
  return frame('Plan Results', 'Plan Results', 540, c => {
    let b = R(c.x, c.y, c.w, 52, '#eff6ff', { stroke: ACTIVE, rx: 6 });
    b += T(c.x + 12, c.y + 21, SCENARIO_LINES[0], { size: 11.5, weight: 700, color: COLOR.blueDark });
    b += T(c.x + 12, c.y + 40, SCENARIO_LINES[1], { size: 11.5 });
    b += button(c.x + c.w - 146, c.y + 13, 134, 'Change Scenario...', { primary: true });
    const ly = c.y + 66;
    b += list(c.x, ly, 200, ['Annual Cash Flows', 'Annual Account Balances', 'Annual Income, Expense Table', 'Annual Income, Expense Graph', 'Annual Net Asset Value Graph', 'Annual Tax Forms'], 0, { h: c.h - 76 });
    const gx = c.x + 214;
    b += grid(gx, ly, [['Year', 40], ['Alex', 34, 'right'], ['Jordan', 42, 'right'], ['Description', 112], ['From', 74], ['To', 86], ['Amount', 62, 'right'], ['1040', 28]], [
      ['2027', '63', '60', 'Jordan salary', 'Jordan', 'Joint Savings', '$87,550', '1a'],
      ['2027', '63', '60', 'Social Security', 'Alex', 'Joint Savings', '$22,063', '6a'],
      ['2027', '63', '60', 'Groceries', 'Joint Savings', 'Living Expenses', '$12,360', ''],
      ['2027', '63', '60', 'Federal Income Tax', 'Joint Savings', 'Federal Income Tax', '$9,812', ''],
      ['2027', '63', '60', 'State Income Tax', 'Joint Savings', 'State Income Tax', '$3,940', ''],
      ['2027', '63', '60', 'Roth Conversion', 'Alex IRA', 'Alex Roth', '$40,210', '4a'],
      ['2028', '64', '61', 'Jordan salary', 'Jordan', 'Joint Savings', '$90,177', '1a'],
    ], { extraRows: 4 });
    b += callout(gx, ly + 300, 478, ['Every view shows the scenario in the banner above. Change Scenario... opens the', 'scenario list again; the views switch to the scenario you choose.']);
    return b;
  });
}

function referenceTable(active, title, cols, rows, note, H = 470) {
  return frame(active, title, H, c => {
    let b = grid(c.x, c.y, cols, rows, { extraRows: 2 });
    if (note) b += callout(c.x, c.y + (rows.length + 3) * 24 + 14, c.w, note);
    return b;
  });
}

function assetClasses() {
  return frame('Asset Classes', 'Asset Classes', 470, c => {
    let b = T(c.x, c.y + 14, 'Asset classes', { size: 11.5, weight: 600, color: COLOR.muted });
    b += grid(c.x, c.y + 22, [['Asset class', 120], ['Growth box', 90], ['Yield box', 80]], [
      ['DomStocks', '7a', '3a'], ['IntStocks', '7a', '3a'], ['MuniBonds', '7a', '2a'], ['Bonds', '7a', '3b'], ['Cash', '-', '2b'], ['Gold', '7a', '-']], { selected: 0 });
    const gx = c.x + 310;
    b += T(gx, c.y + 14, 'Performance history: DomStocks (75 years)', { size: 11.5, weight: 600, color: COLOR.muted });
    b += grid(gx, c.y + 22, [['Year #', 60, 'right'], ['History year', 90, 'right'], ['Growth', 80, 'right'], ['Yield', 70, 'right']], [
      ['1', '2000', '-11.92%', '1.33%'], ['2', '2001', '-12.03%', '1.05%'], ['3', '2002', '-22.03%', '1.06%'], ['4', '2003', '29.50%', '1.85%'],
      ['...', '', '', ''], ['27', '2026 YTD', '11.27%', '0.92%'], ['28', '2000 again', '-11.92%', '1.33%']]);
    b += callout(c.x, c.y + 230, c.w, [
      'Growth = price change, Yield = dividends or interest, both in percent per year. The boxes say where the',
      'planner reports them on Form 1040 for taxable accounts (7a capital gain, 3a qualified dividends, 3b ordinary',
      'dividends, 2b taxable interest, 2a tax-exempt interest).',
    ]);
    return b;
  });
}

function generalSettings() {
  return frame('General Settings', 'General Settings', 470, c => {
    let b = panelHeader(c.x, c.y, c.w, 'Plan settings');
    b += R(c.x, c.y + 26, c.w, 320, '#ffffff');
    b += field(c.x + 16, c.y + 52, 300, 'PLAN NAME', 'New Financial Plan', { left: true });
    b += field(c.x + 16, c.y + 112, 200, 'SOCIAL SECURITY ADJUSTMENT FACTOR', '85.00%');
    b += field(c.x + 256, c.y + 112, 200, 'SOCIAL SECURITY COLA RATE', '2.50%');
    b += field(c.x + 16, c.y + 172, 200, 'GENERAL INFLATION RATE', '3.00%');
    b += field(c.x + 256, c.y + 172, 200, 'TAX FORMS INFLATION RATE', '3.00%');
    b += field(c.x + 16, c.y + 232, 200, 'MEDICARE PREMIUM INFLATION RATE', '5.00%');
    b += TL(c.x + 16, c.y + 292, ['SS adjustment factor: the share of your Social Security benefit you expect to be paid (85% = a 15% cut).', 'COLA rate: the yearly raise of Social Security. General inflation is the default rate of new income and expense rows.', 'Tax forms inflation moves brackets, deductions and IRMAA thresholds each year.'], { size: 11, color: COLOR.muted, lineHeight: 16 });
    return b;
  });
}

function buildWireframes() {
  const files = {};
  files['ui-income-expenses.svg'] = incomeExpenses();
  files['ui-investments.svg'] = investments();
  files['ui-scenario-dialog.svg'] = scenarioDialog();
  files['ui-plan-results.svg'] = planResultsGrid();
  files['ui-income-brackets.svg'] = referenceTable('Income Brackets', 'Income Brackets',
    [['Type', 110], ['Filing status', 170], ['Lower', 110, 'right'], ['Upper', 110, 'right'], ['Rate', 80, 'right']],
    [['Federal', 'Single', '$0', '$12,400', '10%'], ['Federal', 'Single', '$12,400', '$50,400', '12%'], ['Federal', 'Single', '$50,400', '$105,700', '22%'],
      ['Federal', 'Married Filing Jointly', '$0', '$24,800', '10%'], ['State', 'Single', '$0', '$12,400', '4%'], ['Capital Gain', 'Single', '$0', '$49,450', '0%'], ['Capital Gain', 'Single', '$49,450', '$545,500', '15%']],
    ['Federal, State and Capital Gain brackets for both filing statuses, in today\'s dollars (2026).', 'The state table is a 4% placeholder - replace it with your state\'s brackets.']);
  files['ui-medicare-brackets.svg'] = referenceTable('Medicare Brackets', 'Medicare Brackets',
    [['Filing status', 190], ['MAGI from', 120, 'right'], ['MAGI to', 120, 'right'], ['Monthly premium', 140, 'right']],
    [['Single', '$0', '$109,000', '$202.90'], ['Single', '$109,000', '$137,000', '$298.60'], ['Single', '$137,000', '$171,000', '$443.30'], ['Single', '$171,000', '$205,000', '$587.90'],
      ['Single', '$205,000', '$500,000', '$732.50'], ['Single', '$500,000', 'and over', '$780.90'], ['Married Filing Jointly', '$0', '$218,000', '$202.90']],
    ['Per person per month: Part B premium plus any Part D IRMAA surcharge (2026).', 'The planner applies the tier for the MAGI from two years earlier.']);
  files['ui-rmd-table.svg'] = referenceTable('RMD Table', 'RMD Table',
    [['Age', 80, 'right'], ['Divisor', 100, 'right'], ['% of balance', 120, 'right']],
    [['72', '27.4', '3.65%'], ['73', '26.5', '3.77%'], ['74', '25.5', '3.92%'], ['75', '24.6', '4.07%'], ['80', '20.2', '4.95%'], ['90', '12.2', '8.20%'], ['100', '6.4', '15.63%']],
    ['IRS Uniform Lifetime Table (ages 72 to 120). RMD = balance at the end of last year / divisor.']);
  files['ui-asset-classes.svg'] = assetClasses();
  files['ui-general-settings.svg'] = generalSettings();
  return files;
}

module.exports = { buildWireframes };
