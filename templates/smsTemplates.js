const { formatMoney } = require('../utils/format');

function m(amount, currency = 'KES') {
  return formatMoney(amount, currency);
}

function clip(s, max = 160) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

const APP = process.env.APP_NAME || 'HDM METEO';

const verification = ({ code, expiresMin = 10 }) => ({
  text: clip(`${APP}: Your verification code is ${code}. Expires in ${expiresMin} min.`),
});

const passwordReset = ({ shortUrl, expiresMin = 60 }) => ({
  text: clip(`${APP}: Reset your password: ${shortUrl} (expires ${expiresMin}m)`),
});

const registrationReceived = ({ businessName, amount, currency, dueDate, shortUrl }) => ({
  text: clip(`${APP}: ${businessName} registered. Pay ${m(amount, currency)} by ${dueDate}. ${shortUrl}`),
});

const paymentReceived = ({ amount, currency, invoiceNumber }) => ({
  text: clip(`${APP}: Payment ${m(amount, currency)} received. Invoice ${invoiceNumber}. Account activating.`),
});

const renewalApproved = ({ planName, periodEnd }) => ({
  text: clip(`${APP}: Renewal approved. ${planName} active until ${periodEnd}.`),
});

const upgradeApproved = ({ planName, periodEnd }) => ({
  text: clip(`${APP}: Upgrade to ${planName} approved. Active until ${periodEnd}.`),
});

const subscriptionExpiring = ({ planName, daysLeft, shortUrl }) => ({
  text: clip(`${APP}: Your ${planName} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew: ${shortUrl}`),
});

const subscriptionExpired = ({ planName, shortUrl }) => ({
  text: clip(`${APP}: Your ${planName} has expired. Renew: ${shortUrl}`),
});

const apiKeyCreated = ({ keyName }) => ({
  text: clip(`${APP}: New API key "${keyName}" created. Revoke if this wasn't you.`),
});

const apiKeyRevoked = ({ keyName }) => ({
  text: clip(`${APP}: API key "${keyName}" was revoked.`),
});

module.exports = {
  verification,
  passwordReset,
  registrationReceived,
  paymentReceived,
  renewalApproved,
  upgradeApproved,
  subscriptionExpiring,
  subscriptionExpired,
  apiKeyCreated,
  apiKeyRevoked,
};