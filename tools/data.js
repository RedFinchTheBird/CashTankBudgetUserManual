// Reference data for the CashTank Financial Planner user manual charts.
//
// These are the values the planner seeds into a new plan (uFinancialPlanNewDm.pas,
// tax year 2026). If the planner's seed data changes, update this file and run
// `node tools/build.js` to regenerate the charts and pages.

'use strict';

// Calendar years 2000..2026 = YEAR_NUMBER 1..27 (2026 is year to date).
// growth = price return %, yield = income return % (dividends / interest).
const PERFORMANCE = {
  firstYear: 2000,
  stitchYears: 75,
  classes: [
    {
      name: 'DomStocks', label: 'Domestic stocks', fund: 'Vanguard Total Stock Market Index (VTSMX)',
      growthBox: '7a', yieldBox: '3a', color: '#2563eb',
      growth: [-11.92, -12.03, -22.03, 29.50, 10.70, 4.28, 13.63, 3.73, -38.35, 25.92,
        14.97, -0.86, 13.90, 30.95, 10.52, -1.55, 10.40, 18.98, -6.93, 28.32,
        18.89, 24.09, -20.79, 24.56, 21.60, 15.72, 11.27],
      yield: [1.33, 1.05, 1.06, 1.85, 1.82, 1.70, 1.88, 1.76, 1.31, 2.77,
        2.12, 1.82, 2.35, 2.39, 1.91, 1.83, 2.14, 2.07, 1.66, 2.32,
        1.97, 1.50, 1.20, 1.82, 1.50, 1.29, 0.92],
    },
    {
      name: 'IntStocks', label: 'International stocks', fund: 'Vanguard Total International Stock Index (VGTSX)',
      growthBox: '7a', yieldBox: '3a', color: '#7c3aed',
      growth: [-17.33, -21.56, -16.81, 37.82, 18.42, 13.25, 23.83, 12.56, -45.75, 33.55,
        9.37, -17.13, 14.70, 11.82, -7.16, -6.82, 1.66, 23.83, -16.83, 17.73,
        8.62, 5.41, -18.53, 11.52, 1.99, 27.86, 9.24],
      yield: [1.74, 1.41, 1.69, 2.46, 2.41, 2.31, 2.81, 2.95, 1.68, 3.17,
        1.76, 2.65, 3.45, 3.23, 2.93, 2.43, 2.98, 3.56, 2.37, 3.71,
        2.54, 3.17, 2.46, 3.65, 3.31, 4.19, 0.71],
    },
    {
      name: 'Bonds', label: 'Bonds', fund: 'Vanguard Total Bond Market Index (VBMFX)',
      growthBox: '7a', yieldBox: '3b', color: '#0d9488',
      growth: [4.18, 1.81, 2.37, -0.67, -0.39, -2.04, -0.70, 1.70, 0.20, 1.67,
        2.42, 3.77, 0.82, -4.78, 2.94, -2.12, 0.09, 0.94, -2.79, 5.74,
        5.16, -3.70, -15.28, 2.43, -2.37, 3.06, -4.20],
      yield: [7.26, 6.58, 6.07, 4.58, 4.66, 4.47, 5.00, 5.25, 4.89, 4.28,
        3.90, 3.82, 3.25, 2.53, 2.83, 2.41, 2.41, 2.53, 2.67, 2.88,
        2.48, 1.95, 2.05, 3.20, 3.51, 3.65, 2.88],
    },
    {
      name: 'MuniBonds', label: 'Municipal bonds', fund: 'Vanguard Intermediate-Term Tax-Exempt (VWITX)',
      growthBox: '7a', yieldBox: '2a', color: '#0891b2',
      growth: [3.92, 0.00, 2.94, 0.29, -0.88, -1.84, 0.15, -0.75, -4.15, 6.06,
        -1.48, 5.73, 2.49, -4.59, 4.01, -0.07, -2.59, 1.73, -1.56, 4.03,
        2.70, -1.08, -9.12, 2.92, -1.31, 1.69, -3.41],
      yield: [5.36, 5.09, 4.94, 4.17, 4.14, 4.09, 4.31, 4.19, 4.05, 4.16,
        3.63, 3.93, 3.20, 3.04, 3.25, 2.95, 2.69, 2.83, 2.82, 2.78,
        2.45, 2.19, 2.22, 2.90, 3.01, 3.35, 2.45],
    },
    {
      name: 'Gold', label: 'Gold', fund: 'SPDR Gold Shares (GLD) from 2005; LBMA gold fix 2000-2004',
      growthBox: '7a', yieldBox: '-', color: '#d97706',
      growth: [-6.06, 1.41, 23.96, 21.44, 4.65, 17.76, 22.55, 30.45, 4.92, 24.03,
        29.27, 9.57, 6.60, -28.33, -2.19, -10.67, 8.03, 12.81, -1.94, 17.86,
        24.81, -4.15, -0.77, 12.69, 26.66, 63.68, -7.49],
      yield: new Array(27).fill(0),
    },
    {
      name: 'Cash', label: 'Cash', fund: 'Held flat at 0% growth and 0% yield',
      growthBox: '-', yieldBox: '2b', color: '#64748b',
      growth: new Array(27).fill(0),
      yield: new Array(27).fill(0),
    },
  ],
};

// 2026 federal ordinary income brackets (upper edges; the last is open ended)
const FEDERAL = {
  rates: [10, 12, 22, 24, 32, 35, 37],
  single: [12400, 50400, 105700, 201775, 256225, 640600, Infinity],
  married: [24800, 100800, 211400, 403550, 512450, 768700, Infinity],
};

// 2026 long-term capital gain / qualified dividend brackets
const CAPITAL_GAINS = {
  rates: [0, 15, 20],
  single: [49450, 545500, Infinity],
  married: [98900, 613700, Infinity],
};

const STATE_RATE = 4.0; // seeded placeholder flat rate - edit for your state

const DEDUCTIONS = {
  standard: { single: 16100, married: 32200 },
  add65: { single: 2050, married: 1650 },          // per person 65 or older
  senior: { amount: 6000, phaseOutRate: 6, single: 75000, married: 150000, firstYear: 2025, lastYear: 2028 },
};

// Social Security benefits worksheet base and additional amounts
const SS_WORKSHEET = {
  base: { single: 25000, married: 32000 },
  additional: { single: 9000, married: 12000 },
};

// 2026 IRMAA tiers: per-person monthly Part B (incl. IRMAA) + Part D IRMAA surcharge
const IRMAA = {
  single: [109000, 137000, 171000, 205000, 500000, Infinity],
  married: [218000, 274000, 342000, 410000, 750000, Infinity],
  partB: [202.90, 284.10, 405.80, 527.50, 649.20, 689.90],
  partD: [0.00, 14.50, 37.50, 60.40, 83.30, 91.00],
};

// IRS Uniform Lifetime Table divisors, ages 72..120
const RMD = {
  firstAge: 72,
  divisors: [27.4, 26.5, 25.5, 24.6, 23.7, 22.9, 22.0, 21.1, 20.2, 19.4,
    18.5, 17.7, 16.8, 16.0, 15.2, 14.4, 13.7, 12.9, 12.2, 11.5,
    10.8, 10.1, 9.5, 8.9, 8.4, 7.8, 7.3, 6.8, 6.4, 6.0,
    5.6, 5.2, 4.9, 4.6, 4.3, 4.1, 3.9, 3.7, 3.5, 3.4,
    3.3, 3.1, 3.0, 2.9, 2.8, 2.7, 2.5, 2.3, 2.0],
};

const PLAN_DEFAULTS = {
  ssAdjustment: 85, medicareInflation: 5, taxInflation: 3, generalInflation: 3, ssColaRate: 2.5,
  taxPayerAge: 60, lifeExpectancy: 90, retirementAges: [62, 65, 67], claimAges: [62, 67, 70],
};

module.exports = {
  PERFORMANCE, FEDERAL, CAPITAL_GAINS, STATE_RATE, DEDUCTIONS, SS_WORKSHEET, IRMAA, RMD, PLAN_DEFAULTS,
};
