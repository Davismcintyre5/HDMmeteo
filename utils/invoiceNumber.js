const crypto = require('crypto');

function generateInvoiceNumber() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `HDM-${yy}${mm}-${rand}`;
}

module.exports = { generateInvoiceNumber };