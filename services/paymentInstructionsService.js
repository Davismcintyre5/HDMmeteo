const PaymentMethod = require('../models/admin/PaymentMethod');

const PUBLIC_FIELDS = {
  cash: ['name'],
  mpesa_send: ['phone', 'name'],
  mpesa_till: ['tillNumber', 'name'],
  mpesa_paybill: ['paybillNumber', 'accountNumber', 'name'],
  bank: ['bankName', 'accountName', 'accountNumber', 'branch', 'swift'],
  stripe: ['publishableKey'],
  mpesa_stk: ['shortcode', 'name'],
};

function sanitizeConfig(code, config = {}) {
  const allowed = PUBLIC_FIELDS[code] || [];
  const out = {};
  for (const key of allowed) {
    const v = config[key];
    if (v !== undefined && v !== null && v !== '') out[key] = v;
  }
  return out;
}

function substitute(template, vars) {
  if (typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
  );
}

function buildVars({ amount, currency, invoiceNumber }) {
  const amountStr = Number(amount).toLocaleString('en-KE');
  return { sale_number: invoiceNumber, invoice_number: invoiceNumber, invoiceNumber, invoice: invoiceNumber, amount: amountStr, amountRaw: amount, currency };
}

function buildInstructions(method, ctx) {
  const c = method.config || {};
  const vars = buildVars(ctx);
  const { currency, invoiceNumber } = ctx;

  switch (method.code) {
    case 'mpesa_stk':
      return {
        code: 'mpesa_stk', mode: 'auto', title: 'M-Pesa STK Push',
        description: "Enter your M-Pesa phone number and we'll send a payment prompt.",
        action: { type: 'stk', label: 'Send STK to my phone', phoneField: true },
      };
    case 'cash':
      return {
        code: 'cash', mode: 'manual', title: 'Cash', description: 'Pay in cash at our office.',
        steps: ['Visit our office during business hours', `Mention invoice ${invoiceNumber}`, `Pay ${currency} ${vars.amount}`, 'Request a receipt'],
      };
    case 'mpesa_send':
      return {
        code: 'mpesa_send', mode: 'manual', title: 'M-Pesa Send Money',
        description: 'Send money directly to our number.',
        steps: ['Go to M-Pesa menu', 'Select "Send Money"', `Enter number: ${c.phone || '[not configured]'}`, `Enter amount: ${currency} ${vars.amount}`, 'Enter PIN', `Reason: ${invoiceNumber}`, 'Keep the confirmation code'],
        recipient: { phone: c.phone || null, name: c.name || null },
      };
    case 'mpesa_till':
      return {
        code: 'mpesa_till', mode: 'manual', title: 'M-Pesa Buy Goods (Till)',
        description: 'Pay via our Buy Goods till number.',
        steps: ['Go to M-Pesa menu', 'Select "Lipa na M-Pesa"', 'Select "Buy Goods"', `Till: ${c.tillNumber || '[not configured]'}`, `Amount: ${currency} ${vars.amount}`, 'Enter PIN', 'Keep the confirmation code'],
        recipient: { tillNumber: c.tillNumber || null, name: c.name || null },
      };
    case 'mpesa_paybill': {
      const accountNumber = substitute(c.accountNumber || invoiceNumber, vars);
      return {
        code: 'mpesa_paybill', mode: 'manual', title: 'M-Pesa Paybill',
        description: 'Pay via our Paybill number.',
        steps: ['Go to M-Pesa menu', 'Select "Lipa na M-Pesa"', 'Select "Pay Bill"', `Business: ${c.paybillNumber || '[not configured]'}`, `Account: ${accountNumber}`, `Amount: ${currency} ${vars.amount}`, 'Enter PIN', 'Keep the confirmation code'],
        recipient: { paybillNumber: c.paybillNumber || null, accountNumber, name: c.name || null },
      };
    }
    case 'bank':
      return {
        code: 'bank', mode: 'manual', title: 'Bank Transfer',
        description: 'Transfer to our bank account.',
        steps: [`Bank: ${c.bankName || '[not configured]'}`, `Account name: ${c.accountName || '[not configured]'}`, `Account number: ${c.accountNumber || '[not configured]'}`, c.branch ? `Branch: ${c.branch}` : null, c.swift ? `SWIFT: ${c.swift}` : null, `Amount: ${currency} ${vars.amount}`, `Reference: ${invoiceNumber}`, 'Send us a screenshot once paid'].filter(Boolean),
        recipient: { bankName: c.bankName || null, accountName: c.accountName || null, accountNumber: c.accountNumber || null, branch: c.branch || null, swift: c.swift || null },
      };
    case 'stripe':
      return {
        code: 'stripe', mode: 'auto', title: 'Card (Stripe)',
        description: 'Pay securely by card.',
        action: { type: 'stripe', label: 'Pay with card', amount: ctx.amount, currency, invoiceNumber },
      };
    default:
      return null;
  }
}

async function getPaymentInstructions(ctx) {
  const methods = await PaymentMethod.find({ enabled: true }).sort({ order: 1 }).lean();
  const out = [];
  for (const m of methods) {
    const clean = { ...m, config: sanitizeConfig(m.code, m.config) };
    const built = buildInstructions(clean, ctx);
    if (built) out.push(built);
  }
  return out;
}

async function getPublicPaymentMethods() {
  const methods = await PaymentMethod.find({ enabled: true }).sort({ order: 1 }).lean();
  return methods.map((m) => ({
    code: m.code,
    label: m.label,
    mode: m.mode,
    config: sanitizeConfig(m.code, m.config),
  }));
}

module.exports = { getPaymentInstructions, getPublicPaymentMethods, sanitizeConfig };