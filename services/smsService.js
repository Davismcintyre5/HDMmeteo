const hdmBridge = require('../config/hdmBridge');
const Notification = require('../models/client/Notification');
const smsTemplates = require('../templates/smsTemplates');
const env = require('../config/env');
const { logger } = require('../utils/logger');

function isEnabled() {
  return Boolean(
    env.HDM_BRIDGE_SMS_ENABLED &&
    env.HDM_BRIDGE_ENABLED &&
    env.HDM_API_KEY
  );
}

async function send({
  tenantId = null,
  scope = null,
  recipientId = null,
  to,
  content,
  type = 'transactional',
  template = 'generic',
}) {
  if (!isEnabled()) {
    logger.debug({ template, to }, 'sms skipped (HDM_BRIDGE_SMS_ENABLED=false)');
    return { success: false, skipped: true };
  }

  if (!to) throw new Error('smsService.send: "to" is required');
  if (!content) throw new Error('smsService.send: "content" is required');

  const resolvedScope = scope || (tenantId ? 'tenant' : 'system');
  const phone = String(to).replace(/\D/g, '');

  let result = null;
  let error = null;

  try {
    result = await hdmBridge.sendSms({ to: phone, content, type });
  } catch (e) {
    error = e;
  }

  try {
    await Notification.create({
      scope: resolvedScope,
      tenantId: tenantId || null,
      recipientId: recipientId || null,
      channel: 'sms',
      template,
      to: phone,
      subject: null,
      body: content,
      status: error ? 'failed' : 'sent',
      providerMessageId: result?.messageId || null,
      error: error ? error.message : null,
      errorCode: error?.response?.status ? String(error.response.status) : null,
      sentAt: error ? null : new Date(),
    });
  } catch (logErr) {
    logger.warn({ err: logErr.message }, 'notification log failed (sms)');
  }

  if (error) throw error;
  return result;
}

function render(templateFn, data) {
  return templateFn(data).text;
}

/* ─── AUTH ─── */

const sendVerification = ({ tenantId, recipientId, to, code, expiresMin }) =>
  send({ tenantId, recipientId, to, template: 'verification', content: render(smsTemplates.verification, { code, expiresMin }) });

const sendPasswordReset = ({ tenantId, recipientId, to, shortUrl, expiresMin }) =>
  send({ tenantId, recipientId, to, template: 'password_reset', content: render(smsTemplates.passwordReset, { shortUrl, expiresMin }) });

/* ─── REGISTRATION ─── */

const sendRegistrationReceived = ({ tenantId, recipientId, to, businessName, amount, currency, dueDate, shortUrl }) =>
  send({ tenantId, recipientId, to, template: 'registration_received', content: render(smsTemplates.registrationReceived, { businessName, amount, currency, dueDate, shortUrl }) });

/* ─── BILLING ─── */

const sendPaymentReceived = ({ tenantId, recipientId, to, amount, currency, invoiceNumber }) =>
  send({ tenantId, recipientId, to, template: 'payment_received', content: render(smsTemplates.paymentReceived, { amount, currency, invoiceNumber }) });

/* ─── RENEWAL / UPGRADE ─── */

const sendRenewalApproved = ({ tenantId, recipientId, to, planName, periodEnd }) =>
  send({ tenantId, recipientId, to, template: 'renewal_approved', content: render(smsTemplates.renewalApproved, { planName, periodEnd }) });

const sendUpgradeApproved = ({ tenantId, recipientId, to, planName, periodEnd }) =>
  send({ tenantId, recipientId, to, template: 'upgrade_approved', content: render(smsTemplates.upgradeApproved, { planName, periodEnd }) });

/* ─── SUBSCRIPTION ─── */

const sendSubscriptionExpiring = ({ tenantId, recipientId, to, planName, daysLeft, shortUrl }) =>
  send({ tenantId, recipientId, to, template: 'subscription_expiring', content: render(smsTemplates.subscriptionExpiring, { planName, daysLeft, shortUrl }) });

const sendSubscriptionExpired = ({ tenantId, recipientId, to, planName, shortUrl }) =>
  send({ tenantId, recipientId, to, template: 'subscription_expired', content: render(smsTemplates.subscriptionExpired, { planName, shortUrl }) });

/* ─── API KEYS ─── */

const sendApiKeyCreated = ({ tenantId, recipientId, to, keyName }) =>
  send({ tenantId, recipientId, to, template: 'api_key_created', content: render(smsTemplates.apiKeyCreated, { keyName }) });

const sendApiKeyRevoked = ({ tenantId, recipientId, to, keyName }) =>
  send({ tenantId, recipientId, to, template: 'api_key_revoked', content: render(smsTemplates.apiKeyRevoked, { keyName }) });

/* ─── GENERIC ─── */

const sendGeneric = ({ tenantId = null, scope = null, recipientId = null, to, content, type, template = 'generic' }) =>
  send({ tenantId, scope, recipientId, to, content, type, template });

module.exports = {
  send,
  isEnabled,
  sendGeneric,
  sendVerification,
  sendPasswordReset,
  sendRegistrationReceived,
  sendPaymentReceived,
  sendRenewalApproved,
  sendUpgradeApproved,
  sendSubscriptionExpiring,
  sendSubscriptionExpired,
  sendApiKeyCreated,
  sendApiKeyRevoked,
};