require('./dnsSet');
require('dotenv/config');

const readline = require('readline');

const { connectDB, disconnectDB } = require('../config/db');
const env = require('../config/env');
const Plan = require('../models/admin/Plan');
const PaymentMethod = require('../models/admin/PaymentMethod');
const Setting = require('../models/admin/Setting');

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));
}

function clear() { process.stdout.write('\x1b[2J\x1b[0f'); }
function line(s = '') { console.log(s); }
function heading(title) {
  line();
  line(`${C.bold}${C.cyan}${title}${C.reset}`);
  line(`${C.dim}${'─'.repeat(title.length)}${C.reset}`);
  line();
}
function ok(msg) { line(`${C.green}✔${C.reset} ${msg}`); }
function warn(msg) { line(`${C.yellow}⚠${C.reset} ${msg}`); }
function err(msg) { line(`${C.red}✖${C.reset} ${msg}`); }

/* ─────────────────────── PLANS ─────────────────────── */

async function seedPlans() {
  const plans = [
    {
      code: 'monthly',
      name: 'Monthly',
      description: 'HDM METEO API — billed monthly',
      price: { amount: 1500, currency: 'KES', interval: 'month' },
      features: {
        currentWeather: true,
        forecast: true,
        aiSummary: false,
        historical: false,
        alerts: false,
        bulkLookup: false,
      },
      isPublic: true,
      isActive: true,
      sortOrder: 1,
      trialDays: 0,
    },
    {
      code: 'yearly',
      name: 'Yearly',
      description: 'HDM METEO API — billed yearly, 2 months free',
      price: { amount: 15000, currency: 'KES', interval: 'year' },
      features: {
        currentWeather: true,
        forecast: true,
        aiSummary: true,
        historical: false,
        alerts: true,
        bulkLookup: true,
      },
      isPublic: true,
      isActive: true,
      sortOrder: 2,
      trialDays: 0,
    },
    {
      code: 'lifetime',
      name: 'Lifetime',
      description: 'HDM METEO API — one-time payment, lifetime access',
      price: { amount: 30000, currency: 'KES', interval: 'once' },
      features: {
        currentWeather: true,
        forecast: true,
        aiSummary: true,
        historical: true,
        alerts: true,
        bulkLookup: true,
      },
      isPublic: true,
      isActive: true,
      sortOrder: 3,
      trialDays: 0,
    },
  ];

  let count = 0;
  for (const plan of plans) {
    await Plan.updateOne({ code: plan.code }, { $set: plan }, { upsert: true });
    count++;
  }
  ok(`Plans: ${count} upserted`);
}

/* ─────────────────────── PAYMENT METHODS ─────────────────────── */

async function seedPaymentMethods() {
  const methods = [
    { code: 'cash', label: 'Cash', mode: 'manual', enabled: true, order: 1, config: {} },
    { code: 'mpesa_stk', label: 'M-Pesa STK Push', mode: 'auto', enabled: false, order: 2, config: { shortcode: '', name: '' } },
    { code: 'mpesa_send', label: 'M-Pesa Send Money', mode: 'manual', enabled: false, order: 3, config: { phone: '', name: '' } },
    { code: 'mpesa_till', label: 'M-Pesa Buy Goods (Till)', mode: 'manual', enabled: false, order: 4, config: { tillNumber: '', name: '' } },
    { code: 'mpesa_paybill', label: 'M-Pesa Paybill', mode: 'manual', enabled: false, order: 5, config: { paybillNumber: '', accountNumber: '', name: '' } },
    { code: 'bank', label: 'Bank Transfer', mode: 'manual', enabled: false, order: 6, config: { bankName: '', accountName: '', accountNumber: '', branch: '', swift: '' } },
    { code: 'stripe', label: 'Card (Stripe)', mode: 'auto', enabled: false, order: 7, config: { publishableKey: '' } },
  ];

  let count = 0;
  for (const m of methods) {
    await PaymentMethod.updateOne({ code: m.code }, { $setOnInsert: m }, { upsert: true });
    count++;
  }
  ok(`Payment methods: ${count} upserted`);
}

/* ─────────────────────── SETTINGS ─────────────────────── */

async function seedSettings() {
  const weatherDefault = {
    current: 'open_meteo',
    forecast: 'open_meteo',
    fallbackToOpenMeteo: true,
    credentials: {
      openweather: { apiKey: env.OPENWEATHER_API_KEY || '', enabled: false },
      weatherapi: { apiKey: env.WEATHERAPI_API_KEY || '', enabled: false },
    },
  };

  const apiKeysDefault = {
    maxPerUser: env.API_KEY_DEFAULT_MAX,
    allowedScopes: env.API_KEY_DEFAULT_SCOPES,
    livePrefix: env.API_KEY_LIVE_PREFIX,
    testPrefix: env.API_KEY_TEST_PREFIX,
    defaultExpiryDays: env.API_KEY_DEFAULT_EXPIRY_DAYS,
  };

  const brandDefault = {
    name: env.APP_NAME,
    logoUrl: `${env.API_URL}/brand/hdm-meteo.svg`,
    color: '#0F172A',
    accent: '#0EA5A4',
    supportEmail: env.HDM_FROM_EMAIL || 'support@hdm.co.ke',
    supportPhone: '',
    supportWhatsapp: '',
    website: 'https://meteo.hdm.co.ke',
    address: 'Nairobi, Kenya',
  };

  const settings = [
    ['weather', weatherDefault],
    ['apiKeys', apiKeysDefault],
    ['brand', brandDefault],
  ];

  let count = 0;
  for (const [key, value] of settings) {
    await Setting.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true });
    count++;
  }
  ok(`Settings: ${count} upserted`);
}

/* ─────────────────────── MENU ─────────────────────── */

async function menu() {
  clear();
  line();
  line(`${C.bold}${C.cyan}╭───────────────────────────────────────╮${C.reset}`);
  line(`${C.bold}${C.cyan}│   HDM METEO — Seed CLI                │${C.reset}`);
  line(`${C.bold}${C.cyan}╰───────────────────────────────────────╯${C.reset}`);
  line();
  line(`  ${C.bold}1${C.reset}.  Seed all`);
  line(`  ${C.bold}2${C.reset}.  Seed settings`);
  line(`  ${C.bold}3${C.reset}.  Seed plans`);
  line(`  ${C.bold}4${C.reset}.  Seed payment methods`);
  line();
  line(`  ${C.dim}0.  Exit${C.reset}`);
  line();
  return await ask(`${C.cyan}›${C.reset} Select option: `);
}

async function main() {
  clear();
  line(`${C.dim}Connecting to MongoDB...${C.reset}`);
  try {
    await connectDB();
    ok('Connected');
  } catch (e) {
    err(`Connection failed: ${e.message}`);
    process.exit(1);
  }

  while (true) {
    const choice = await menu();
    try {
      heading('Seeding');
      if (choice === '1') {
        await seedPlans();
        await seedPaymentMethods();
        await seedSettings();
        line();
        ok('All seeds complete');
      } else if (choice === '2') {
        await seedSettings();
      } else if (choice === '3') {
        await seedPlans();
      } else if (choice === '4') {
        await seedPaymentMethods();
      } else if (choice === '0') {
        break;
      } else {
        continue;
      }
    } catch (e) {
      err(e.message);
    }
    await ask(`${C.dim}Press Enter to continue...${C.reset}`);
  }

  rl.close();
  await disconnectDB();
  line();
  ok('Bye');
  process.exit(0);
}

main();