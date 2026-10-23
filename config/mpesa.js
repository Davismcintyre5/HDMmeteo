const env = require('./env');

const mpesaConfig = {
  env: env.MPESA_ENV,
  baseUrl: env.MPESA_BASE_URL,
  consumerKey: env.MPESA_CONSUMER_KEY,
  consumerSecret: env.MPESA_CONSUMER_SECRET,
  shortcode: env.MPESA_SHORTCODE,
  tillNumber: env.MPESA_TILL_NUMBER,
  partyB: env.MPESA_TILL_NUMBER || env.MPESA_SHORTCODE,
  passkey: env.MPESA_PASSKEY,
  callbackUrl: env.MPESA_CALLBACK_URL,
  transactionType: env.MPESA_TRANSACTION_TYPE,
  enabled: () => Boolean(env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET && env.MPESA_SHORTCODE),
};

module.exports = { mpesaConfig };