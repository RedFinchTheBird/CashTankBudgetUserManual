// Builds the CashTank Financial Planner user manual.
//
//   node tools/build.js
//
// 1. Generates the SVG charts (tools/charts.js) and screen mockups (tools/wireframes.js)
//    into assets/img.
// 2. Wraps every page in src/pages with the shared layout (header, sidebar menu,
//    previous / next links, footer) and writes it to the site root as <page>.html.
//    {{tokens}} in a page are replaced with numbers computed by the charts, so the
//    text always matches the charts.
// 3. Checks that every local link and image in the generated pages exists.
//
// GitHub Pages serves the generated files from the repository root; commit them.

'use strict';

const fs = require('fs');
const path = require('path');
const { buildCharts } = require('./charts');
const { buildWireframes } = require('./wireframes');

const ROOT = path.join(__dirname, '..');
const SITE_TITLE = 'CashTank Financial Planner';
const SITE_SUBTITLE = 'User Manual';

// Sidebar menu and page order: [file name without .html, menu label]
const NAV = [
  { section: 'Start here', pages: [['index', 'Welcome'], ['getting-started', 'Getting started']] },
  {
    section: 'Screens', pages: [
      ['tax-payers', 'Tax Payers'], ['income-expenses', 'Income and expenses'], ['investments', 'Investments'],
      ['optimizer', 'Optimizer'], ['plan-results', 'Plan results'], ['reference-tables', 'Reference tables and settings'],
    ],
  },
  {
    section: 'How planning works', pages: [
      ['how-the-plan-works', 'How the plan works'], ['asset-classes', 'Asset classes: growth and yield'],
      ['taxes', 'Income taxes and deductions'], ['social-security', 'Social Security'],
      ['rmds', 'Required minimum distributions'], ['medicare-irmaa', 'Medicare and IRMAA'],
      ['roth-conversions', 'Roth conversions'], ['withdrawals', 'Withdrawals and Auto'],
      ['plan-milestones', 'Plan milestones (year codes)'],
    ],
  },
  { section: 'Reference', pages: [['glossary', 'Glossary']] },
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function writeFiles(dir, files) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
}

// Reads "<!-- key: value ... -->" metadata from the top of a page source
function readPage(id) {
  const file = path.join(ROOT, 'src', 'pages', `${id}.html`);
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/^\s*<!--([\s\S]*?)-->/);
  const meta = {};
  if (m) m[1].split(/\r?\n/).forEach(line => { const kv = line.match(/^\s*(\w+)\s*:\s*(.+?)\s*$/); if (kv) meta[kv[1]] = kv[2]; });
  return { meta, body: m ? src.slice(m[0].length) : src };
}

function sidebar(currentId) {
  return NAV.map(group => `      <div class="nav-section">${esc(group.section)}</div>\n      <ul>\n` +
    group.pages.map(([id, label]) => `        <li><a href="${id}.html"${id === currentId ? ' class="active" aria-current="page"' : ''}>${esc(label)}</a></li>`).join('\n') +
    '\n      </ul>').join('\n');
}

function layout({ id, title, description, body, prev, next }) {
  const pager = `    <nav class="pager" aria-label="Previous and next pages">\n` +
    (prev ? `      <a class="prev" href="${prev[0]}.html"><span>Previous</span>${esc(prev[1])}</a>\n` : '      <span></span>\n') +
    (next ? `      <a class="next" href="${next[0]}.html"><span>Next</span>${esc(next[1])}</a>\n` : '      <span></span>\n') +
    '    </nav>';
  const pageTitle = id === 'index' ? `${SITE_TITLE} - ${SITE_SUBTITLE}` : `${title} - ${SITE_TITLE}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(description || '')}">
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <header class="site-header">
    <button class="menu-toggle" type="button" aria-controls="sidebar" aria-expanded="false">Menu</button>
    <a class="brand" href="index.html"><img src="assets/img/favicon.svg" alt="" width="28" height="28"><span>${esc(SITE_TITLE)}</span><small>${esc(SITE_SUBTITLE)}</small></a>
  </header>
  <div class="page">
    <nav class="sidebar" id="sidebar" aria-label="Manual contents">
${sidebar(id)}
    </nav>
    <main class="content" id="content">
${body.trim()}

${pager}
    </main>
  </div>
  <footer class="site-footer">
    <p>CashTank Financial Planner user manual. Tax values are for 2026 and are inflated by the planner for later years.
    The planner is an educational tool, not tax, legal or investment advice.</p>
  </footer>
  <script src="assets/js/site.js"></script>
</body>
</html>
`;
}

// Every local href / src in the generated pages must exist
function checkLinks(pages) {
  const problems = [];
  for (const [file, html] of pages) {
    const refs = [...html.matchAll(/(?:href|src)="([^"#:]+)(?:#[^"]*)?"/g)].map(m => m[1]).filter(r => r && !r.startsWith('//'));
    for (const ref of refs) if (!fs.existsSync(path.join(ROOT, ref))) problems.push(`${file}: missing ${ref}`);
    const anchors = [...html.matchAll(/href="([\w-]+\.html)#([\w-]+)"/g)];
    for (const [, target, anchor] of anchors) {
      const targetHtml = pages.get(target);
      if (targetHtml && !targetHtml.includes(`id="${anchor}"`)) problems.push(`${file}: missing anchor ${target}#${anchor}`);
    }
  }
  return problems;
}

function build() {
  const { files: charts, values } = buildCharts();
  writeFiles(path.join(ROOT, 'assets', 'img', 'charts'), charts);
  writeFiles(path.join(ROOT, 'assets', 'img', 'screens'), buildWireframes());

  const order = NAV.flatMap(g => g.pages);
  const pages = new Map();
  const unknown = new Set();
  order.forEach(([id, label], i) => {
    const { meta, body } = readPage(id);
    const filled = body.replace(/\{\{(\w+)\}\}/g, (all, key) => {
      if (key in values) return values[key];
      unknown.add(`${id}: {{${key}}}`);
      return all;
    });
    const html = layout({
      id, title: meta.title || label, description: meta.description, body: filled,
      prev: order[i - 1], next: order[i + 1],
    });
    pages.set(`${id}.html`, html);
  });
  for (const [file, html] of pages) fs.writeFileSync(path.join(ROOT, file), html);

  const problems = [...unknown].map(u => `unknown token ${u}`).concat(checkLinks(pages));
  console.log(`${Object.keys(charts).length} charts, ${pages.size} pages written.`);
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log('All links, images and tokens resolved.');
}

build();
