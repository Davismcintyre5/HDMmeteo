const emailService = require('./emailService');
const smsService = require('./smsService');
const settingsService = require('./settingsService');
const emailTemplates = require('../templates/emailTemplates');
const smsTemplates = require('../templates/smsTemplates');
const { logger } = require('../utils/logger');

async function notify({ to, phone, subject, html, text, sms }) {
  const jobs = [];
  if (to) jobs.push(emailService.send({ to, subject, html, text }));
  if (phone && sms) jobs.push(smsService.send({ to: phone, content: sms }));
  if (!jobs.length) return [];
  return Promise.allSettled(jobs);
}

async function sendTemplate({ template, email, phone, sms = false, vars = {} }) {
  const brand = await settingsService.getBrand();
  const emailTpl = emailTemplates[template];
  const smsTpl = smsTemplates[template];

  const jobs = [];

  if (email && emailTpl) {
    const tpl = emailTpl({ brand, ...vars });
    jobs.push(emailService.send({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text }));
  }

  if (sms && phone && smsTpl) {
    const tpl = smsTpl(vars);
    jobs.push(smsService.send({ to: phone, content: tpl.text }));
  }

  if (!jobs.length) {
    logger.warn({ template }, 'sendTemplate: no channel matched');
    return [];
  }

  return Promise.allSettled(jobs);
}

module.exports = { notify, sendTemplate };