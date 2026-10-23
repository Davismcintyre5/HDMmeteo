const Invoice = require('../models/client/Invoice');
const emailService = require('../services/emailService');
const settingsService = require('../services/settingsService');
const { logger } = require('../utils/logger');

const cron = '0 9 * * *';

async function run() {
  const now = new Date();

  const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const brand = await settingsService.getBrand();

  const unpaidSoon = await Invoice.find({
    status: 'sent',
    dueDate: { $gte: now, $lte: dayFromNow },
  }).lean();

  for (const inv of unpaidSoon) {
    try {
      await emailService.sendInvoiceReminder({
        tenantId: inv.tenantId,
        to: inv.customerSnapshot?.email,
        businessName: brand.name,
        customerName: inv.customerSnapshot?.name || 'Customer',
        invoiceNumber: inv.invoiceNumber,
        total: inv.amountDue ?? inv.total,
        currency: inv.currency,
        dueDate: inv.dueDate,
        daysOverdue: 0,
        paymentLink: `${process.env.API_URL}/invoice/${inv.invoiceNumber}`,
      });
    } catch (err) {
      logger.warn({ err: err.message, invoiceNumber: inv.invoiceNumber }, 'invoice reminder failed');
    }
  }

  const overdue = await Invoice.find({
    status: { $in: ['sent', 'overdue'] },
    dueDate: { $lt: now, $lte: threeDaysAgo },
  }).lean();

  for (const inv of overdue) {
    try {
      const daysOverdue = Math.floor((now - inv.dueDate) / (24 * 60 * 60 * 1000));

      await emailService.sendInvoiceOverdue({
        tenantId: inv.tenantId,
        to: inv.customerSnapshot?.email,
        businessName: brand.name,
        customerName: inv.customerSnapshot?.name || 'Customer',
        invoiceNumber: inv.invoiceNumber,
        total: inv.amountDue ?? inv.total,
        currency: inv.currency,
        daysOverdue,
        paymentLink: `${process.env.API_URL}/invoice/${inv.invoiceNumber}`,
      });

      if (inv.status !== 'overdue') {
        await Invoice.updateOne({ _id: inv._id }, { $set: { status: 'overdue' } });
      }
    } catch (err) {
      logger.warn({ err: err.message, invoiceNumber: inv.invoiceNumber }, 'invoice overdue failed');
    }
  }

  logger.info({ reminders: unpaidSoon.length, overdue: overdue.length }, 'invoice reminders done');
}

module.exports = { cron, run };