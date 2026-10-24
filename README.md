---
title: CashTank Financial Planner User Manual
description: Source and generator for the CashTank Financial Planner user manual website published with GitHub Pages
ms.date: 2026-10-24
ms.topic: overview
---

## About

This repository holds the user manual website for the financial planning part of the
CashTank application. The site is plain HTML, CSS and SVG with no framework, so GitHub
Pages can serve it straight from the `main` branch.

Published site: <https://redfinchthebird.github.io/CashTankBudgetUserManual/>

The manual covers:

* Setting up a plan: tax payers, income and expenses, investments, the optimizer and the
  plan results.
* The reference tables the planner uses: income brackets, Medicare brackets, the RMD
  table, asset classes and general settings.
* The financial planning concepts behind the engine: asset class growth and yield,
  normal versus down markets, income taxes, Social Security, RMDs, Medicare IRMAA,
  Roth conversions, withdrawal order and plan milestone year codes.

Screens that are already built in the app use real screenshots. Screens still in
development use SVG mockups marked "Preview - screen in progress".

## Folder layout

| Path                     | Contents                                                          |
|--------------------------|-------------------------------------------------------------------|
| `*.html` (root)          | Generated pages that GitHub Pages serves. Do not edit by hand.    |
| `src/pages/`             | Page content. Edit these files, then rebuild.                     |
| `tools/build.js`         | Builds the site: page layout, navigation order, tokens and checks |
| `tools/data.js`          | Seed data: asset class history, tax brackets, IRMAA, RMD divisors |
| `tools/charts.js`        | Generates the concept charts and the computed example values      |
| `tools/wireframes.js`    | Generates the mockups of screens that are still in progress      |
| `tools/svg.js`           | Small SVG drawing helpers shared by the generators                |
| `assets/css/site.css`    | Site styles, including the mobile layout and print styles         |
| `assets/js/site.js`      | Menu toggle for small screens                                     |
| `assets/img/charts/`     | Generated chart SVGs                                              |
| `assets/img/screens/`    | Real app screenshots (PNG) and generated mockups (SVG)            |

## Rebuild the site

The build needs [Node.js](https://nodejs.org/) 18 or later and has no package
dependencies.

```powershell
node tools/build.js
```

The build regenerates every chart, mockup and page, then confirms that all links,
images, anchors and `{{tokens}}` resolve. It stops with an error if anything is missing.
Commit the generated files along with your source changes, because GitHub Pages serves
the files as they are in the repository.

### Page sources

Each file in `src/pages/` starts with a metadata comment that sets the browser title and
description:

```html
<!--
title: Tax Payers
description: Enter each tax payer's birth year, life expectancy, retirement ages and Social Security estimates.
-->
```

To add a page, create the source file and add it to the `NAV` list at the top of
`tools/build.js`. The list controls the sidebar order and the previous and next links.

### Computed values

Numbers in the text that come from the charts, such as the growth of $10,000 or an RMD
example, use tokens like `{{rmdEx75}}`. `tools/charts.js` computes them from
`tools/data.js`, so the text stays in step with the charts when the data changes.

### Update data or screenshots

* Edit `tools/data.js` to change the asset class history, tax tables or Medicare tiers,
  then rebuild.
* Replace a PNG in `assets/img/screens/` with a new capture from the app to refresh a
  screenshot. Keep the file name so the pages pick it up.
* When a screen moves from preview to built, swap its mockup SVG for a screenshot and
  change the page badge from "Preview" to "Built".

## Publish with GitHub Pages

1. Push the `main` branch to GitHub.
2. In the repository, open Settings, then Pages.
3. Under Build and deployment, set Source to "Deploy from a branch".
4. Select the `main` branch and the `/ (root)` folder, then save.

The site appears at <https://redfinchthebird.github.io/CashTankBudgetUserManual/> within a
few minutes. The empty `.nojekyll` file tells GitHub Pages to serve the files as they are
without running Jekyll.

## Disclaimer

The manual explains how the planner models taxes, Social Security, Medicare and
investments. It is general information, not tax, legal or investment advice.
