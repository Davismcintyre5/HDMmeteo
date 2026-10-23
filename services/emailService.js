const hdmBridge = require('../config/hdmBridge');
const Notification = require('../models/client/Notification');
const settingsService = require('./settingsService');
const emailTemplates = require('../templates/emailTemplates');
const { logger } = require('../utils/logger');

async function getBrand() {
  return settingsService.getBrand();
}

async function send({
  tenantId = null,
  scope = null,
  recipientId = null,
  to,
  subject,
  html,
  text,
  template = 'generic',
}) {
  if (!to) throw new Error('emailService.send: "to" is required');
  if (!subject) throw new Error('emailService.send: "subject" is required');

  const resolvedScope = scope || (tenantId ? 'tenant' : 'system');

  let result = null;
  let error = null;

  try {
    result = await hdmBridge.sendEmail({
      to,
      subject,
      htmlBody: html || '',
      textBody: text || '',
    });
  } catch (e) {
    error = e;
  }

  try {
    await Notification.create({
      scope: resolvedScope,
      tenantId: tenantId || null,
      recipientId: recipientId || null,
      channel: 'email',
      template,
      to,
      subject,
      body: text || html || '',
      status: error ? 'failed' : 'sent',
      providerMessageId: result?.messageId || null,
      error: error ? error.message : null,
      errorCode: error?.response?.status ? String(error.response.status) : null,
      sentAt: error ? null : new Date(),
    });
  } catch (logErr) {
    logger.warn({ err: logErr.message }, 'notification log failed (email)');
  }

  if (error) throw error;
  return result;
}

async function renderAndSend(templateFn, templateKey, { tenantId = null, scope = null, recipientId = null, to, data = {} }) {
  if (!to) return null;
  const brand = await getBrand();
  const tpl = templateFn({ brand, ...data });
  return send({ tenantId, scope, recipientId, to, ...tpl, template: templateKey });
}

/* ─── AUTH ─── */

const sendVerification = ({ tenantId, recipientId, to, name, verifyUrl, expiresIn }) =>
  renderAndSend(emailTemplates.verification, 'verification', { tenantId, recipientId, to, data: { name, verifyUrl, expiresIn } });

const sendPasswordReset = ({ tenantId, recipientId, to, fullName, resetUrl, expiresIn }) =>
  renderAndSend(emailTemplates.passwordReset, 'password_reset', { tenantId, recipientId, to, data: { fullName, resetUrl, expiresIn } });

const sendPasswordChanged = ({ tenantId, recipientId, to, fullName, when, ip }) =>
  renderAndSend(emailTemplates.passwordChanged, 'password_changed', { tenantId, recipientId, to, data: { fullName, when, ip } });

const sendWelcome = ({ tenantId, recipientId, to, name, businessName, email, temporaryPassword, loginUrl, planName, planPrice, planInterval, planFeatures, startDate, endDate, trialDays }) =>
  renderAndSend(emailTemplates.welcome, 'welcome', {
    tenantId, recipientId, to,
    data: { name, businessName, email, temporaryPassword, loginUrl, planName, planPrice, planInterval, planFeatures, startDate, endDate, trialDays },
  });

/* ─── REGISTRATION ─── */

const sendRegistrationReceived = ({ tenantId, recipientId, to, name, businessName, planName, amount, currency, dueDate, invoiceNumber, paymentLink }) =>
  renderAndSend(emailTemplates.registrationReceived, 'registration_received', { tenantId, recipientId, to, data: { name, businessName, planName, amount, currency, dueDate, invoiceNumber, paymentLink } });

const sendRegistrationRejected = ({ tenantId, recipientId, to, name, businessName, reason }) =>
  renderAndSend(emailTemplates.registrationRejected, 'registration_rejected', { tenantId, recipientId, to, data: { name, businessName, reason } });

const sendTenantReactivated = ({ tenantId, recipientId, to, fullName, businessName, loginUrl }) =>
  renderAndSend(emailTemplates.tenantReactivated, 'tenant_reactivated', { tenantId, recipientId, to, data: { fullName, businessName, loginUrl } });

/* ─── BILLING ─── */

const sendInvoice = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.invoice, 'invoice', { tenantId, to, data });

const sendPaymentReceived = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.paymentReceived, 'payment_received', { tenantId, to, data });

const sendInvoiceReminder = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.invoiceReminder, 'invoice_reminder', { tenantId, to, data });

const sendInvoiceOverdue = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.invoiceOverdue, 'invoice_overdue', { tenantId, to, data });

const sendInvoiceCancelled = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.invoiceCancelled, 'invoice_cancelled', { tenantId, to, data });

const sendPaymentRefunded = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.paymentRefunded, 'payment_refunded', { tenantId, to, data });

/* ─── RENEWAL / UPGRADE ─── */

const sendRenewalRequestReceived = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.renewalRequestReceived, 'renewal_request_received', { tenantId, to, data });

const sendUpgradeRequestReceived = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.upgradeRequestReceived, 'upgrade_request_received', { tenantId, to, data });

const sendRenewalApproved = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.renewalApproved, 'renewal_approved', { tenantId, to, data });

const sendUpgradeApproved = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.upgradeApproved, 'upgrade_approved', { tenantId, to, data });

/* ─── SUBSCRIPTION ─── */

const sendSubscriptionExpiring = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.subscriptionExpiring, 'subscription_expiring', { tenantId, to, data });

const sendSubscriptionExpired = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.subscriptionExpired, 'subscription_expired', { tenantId, to, data });

const sendSubscriptionFailed = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.subscriptionFailed, 'subscription_failed', { tenantId, to, data });

const sendPlanCancelled = ({ tenantId, to, ...data }) =>
  renderAndSend(emailTemplates.planCancelled, 'plan_cancelled', { tenantId, to, data });

/* ─── API KEYS ─── */

const sendApiKeyCreated = ({ tenantId, recipientId, to, fullName, keyName, keyPrefix, keyLast4, scopes, loginUrl }) =>
  renderAndSend(emailTemplates.apiKeyCreated, 'api_key_created', { tenantId, recipientId, to, data: { fullName, keyName, keyPrefix, keyLast4, scopes, loginUrl } });

const sendApiKeyRevoked = ({ tenantId, recipientId, to, fullName, keyName, loginUrl }) =>
  renderAndSend(emailTemplates.apiKeyRevoked, 'api_key_revoked', { tenantId, recipientId, to, data: { fullName, keyName, loginUrl } });

/* ─── ADMIN ─── */

const sendAdminWelcome = ({ to, recipientId = null, ...data }) =>
  renderAndSend(emailTemplates.adminWelcome, 'admin_welcome', { tenantId: null, scope: 'admin', recipientId, to, data });

const sendAdminNewPending = ({ to, ...data }) =>
  renderAndSend(emailTemplates.adminNewPending, 'admin_new_pending', { tenantId: null, scope: 'admin', to, data });

const sendAdminPaymentReceived = ({ to, ...data }) =>
  renderAndSend(emailTemplates.adminPaymentReceived, 'admin_payment_received', { tenantId: null, scope: 'admin', to, data });

const sendAdminRenewalRequested = ({ to, ...data }) =>
  renderAndSend(emailTemplates.adminRenewalRequested, 'admin_renewal_requested', { tenantId: null, scope: 'admin', to, data });

const sendAdminUpgradeRequested = ({ to, ...data }) =>
  renderAndSend(emailTemplates.adminUpgradeRequested, 'admin_upgrade_requested', { tenantId: null, scope: 'admin', to, data });

const sendAdminServiceDown = ({ to, ...data }) =>
  renderAndSend(emailTemplates.adminServiceDown, 'admin_service_down', { tenantId: null, scope: 'admin', to, data });

const sendAdminBackupSuccess = ({ to, ...data }) =>
  renderAndSend(emailTemplates.adminBackupSuccess, 'admin_backup_success', { tenantId: null, scope: 'admin', to, data });

const sendAdminBackupFailed = ({ to, ...data }) =>
  renderAndSend(emailTemplates.adminBackupFailed, 'admin_backup_failed', { tenantId: null, scope: 'admin', to, data });

const sendAdminRestoreComplete = ({ to, ...data }) =>
  renderAndSend(emailTemplates.adminRestoreComplete, 'admin_restore_complete', { tenantId: null, scope: 'admin', to, data });

const sendBackupDelivered = ({ to, ...data }) =>
  renderAndSend(emailTemplates.backupDelivered, 'backup_delivered', { tenantId: null, scope: 'admin', to, data });

/* ─── GENERIC ─── */

const sendGeneric = ({ tenantId = null, scope = null, recipientId = null, to, subject, html, text, template = 'generic' }) =>
  send({ tenantId, scope, recipientId, to, subject, html, text, template });

module.exports = {
  send,
  getBrand,
  sendGeneric,

  sendVerification,
  sendPasswordReset,
  sendPasswordChanged,
  sendWelcome,

  sendRegistrationReceived,
  sendRegistrationRejected,
  sendTenantReactivated,

  sendInvoice,
  sendPaymentReceived,
  sendInvoiceReminder,
  sendInvoiceOverdue,
  sendInvoiceCancelled,
  sendPaymentRefunded,

  sendRenewalRequestReceived,
  sendUpgradeRequestReceived,
  sendRenewalApproved,
  sendUpgradeApproved,

  sendSubscriptionExpiring,
  sendSubscriptionExpired,
  sendSubscriptionFailed,
  sendPlanCancelled,

  sendApiKeyCreated,
  sendApiKeyRevoked,

  sendAdminWelcome,
  sendAdminNewPending,
  sendAdminPaymentReceived,
  sendAdminRenewalRequested,
  sendAdminUpgradeRequested,
  sendAdminServiceDown,
  sendAdminBackupSuccess,
  sendAdminBackupFailed,
  sendAdminRestoreComplete,
  sendBackupDelivered,
};