const Admin = require('../models/admin/Admin');
const User = require('../models/client/User');
const Tenant = require('../models/admin/Tenant');
const Plan = require('../models/admin/Plan');
const emailService = require('./emailService');
const socketService = require('./socketService');
const settingsService = require('./settingsService');
const { logger } = require('../utils/logger');
const env = require('../config/env');

async function notifyPaymentReceived({ invoice, tenant, owner, paymentMethod, paymentReference, paidAt }) {
  const brand = await settingsService.getBrand();

  const plan = tenant?.planCode ? await Plan.findOne({ code: tenant.planCode }).lean() : null;

  /* ── 1. Email the user ── */
  if (owner?.email) {
    emailService
      .sendPaymentReceived({
        tenantId: tenant?._id || invoice.tenantId,
        recipientId: owner._id || null,
        to: owner.email,
        businessName: brand.name,
        customerName: owner.fullName || 'Customer',
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        currency: invoice.currency,
        paidAt: paidAt || new Date().toISOString(),
        paymentMethod,
        paymentReference,
        planName: plan?.name || null,
        planInterval: plan?.price?.interval || null,
        periodEnd: tenant?.currentPeriodEnd || null,
      })
      .catch((err) => logger.warn({ err: err.message, to: owner.email }, 'user payment email failed'));
  }

  /* ── 2. Email all active admins ── */
  try {
    const admins = await Admin.find({ status: 'active', role: { $in: ['admin', 'super_admin'] } })
      .select('email fullName')
      .lean();

    for (const admin of admins) {
      emailService
        .sendAdminPaymentReceived({
          to: admin.email,
          businessName: tenant?.name || invoice.customerSnapshot?.name || 'Tenant',
          ownerName: owner?.fullName || invoice.customerSnapshot?.name || '—',
          ownerEmail: owner?.email || invoice.customerSnapshot?.email || '—',
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total,
          currency: invoice.currency,
          paidAt: paidAt || new Date().toISOString(),
          paymentMethod,
          paymentReference,
          planName: plan?.name || tenant?.planCode || '—',
          reviewUrl: tenant?._id ? `${env.ADMIN_URL}/pending/${tenant._id}` : null,
        })
        .catch((err) => logger.warn({ err: err.message, admin: admin.email }, 'admin payment email failed'));
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'admin payment lookup failed');
  }

  /* ── 3. Socket to admin room (dashboard badge) ── */
  socketService.emitToAdmin('payment:received', {
    tenantId: String(invoice.tenantId),
    tenantName: tenant?.name || null,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.total,
    currency: invoice.currency,
  });

  /* ── 4. Socket to tenant room (their own confirmation) ── */
  if (invoice.tenantId) {
    socketService.emitToTenant(String(invoice.tenantId), 'payment:received', {
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      currency: invoice.currency,
    });
  }
}

async function notifyTenantApproved({ tenant, owner, plan }) {
  if (owner?.email) {
    emailService
      .sendWelcome({
        tenantId: tenant._id,
        recipientId: owner._id,
        to: owner.email,
        name: owner.fullName,
        businessName: tenant.name,
        email: owner.email,
        loginUrl: `${env.CLIENT_URL}/login`,
        planName: plan?.name || tenant.planCode,
        planPrice: plan?.price?.amount,
        planInterval: plan?.price?.interval,
        startDate: tenant.currentPeriodStart ? new Date(tenant.currentPeriodStart).toDateString() : null,
        endDate: tenant.currentPeriodEnd ? new Date(tenant.currentPeriodEnd).toDateString() : null,
      })
      .catch((err) => logger.warn({ err: err.message, to: owner.email }, 'welcome email failed'));
  }

  socketService.emitToAdmin('tenant:approved', {
    id: String(tenant._id),
    name: tenant.name,
  });

  socketService.emitToTenant(String(tenant._id), 'tenant:approved', {
    id: String(tenant._id),
    status: tenant.status,
  });
}

module.exports = { notifyPaymentReceived, notifyTenantApproved };