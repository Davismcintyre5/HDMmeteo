const { formatMoney, humanDate } = require('../utils/format');

const BRAND_FALLBACK = {
  name: 'HDM METEO',
  logoUrl: '',
  color: '#0F172A',
  accent: '#0EA5A4',
  supportEmail: 'support@hdm.co.ke',
  supportPhone: '',
  supportWhatsapp: '',
  website: 'https://meteo.hdm.co.ke',
  address: '',
};

function normalizeBrand(b = {}) {
  return { ...BRAND_FALLBACK, ...b };
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function money(amount, currency = 'KES') {
  return formatMoney(amount, currency);
}

function date(d, opts = {}) {
  return humanDate(d, opts);
}

function button(url, label, color) {
  if (!url) return '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px 0;">
      <tr><td>
        <a href="${url}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px;line-height:1;">
          ${escapeHtml(label)}
        </a>
      </td></tr>
    </table>`;
}

function kv(label, value, opts = {}) {
  return `
    <tr>
      <td style="padding:7px 0;font-size:13px;color:#64748b;vertical-align:top;">${escapeHtml(label)}</td>
      <td align="right" style="padding:7px 0;font-size:14px;font-weight:${opts.bold ? 600 : 500};color:${opts.color || '#0f172a'};${opts.mono ? 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;' : ''};">
        ${value}
      </td>
    </tr>`;
}

function box(inner, bg = '#f8fafc', border = '#e2e8f0') {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${bg};border:1px solid ${border};border-radius:12px;margin:20px 0;">
      <tr><td style="padding:18px 20px;">${inner}</td></tr>
    </table>`;
}

function supportBlock(b) {
  const rows = [];
  if (b.supportEmail) rows.push(`<a href="mailto:${b.supportEmail}" style="color:${b.accent};text-decoration:none;">${escapeHtml(b.supportEmail)}</a>`);
  if (b.supportPhone) rows.push(`<a href="tel:${b.supportPhone.replace(/\s+/g, '')}" style="color:${b.accent};text-decoration:none;">${escapeHtml(b.supportPhone)}</a>`);
  if (b.supportWhatsapp) rows.push(`<a href="https://wa.me/${b.supportWhatsapp.replace(/\D/g, '')}" style="color:${b.accent};text-decoration:none;">WhatsApp</a>`);
  if (b.website) rows.push(`<a href="${b.website}" style="color:${b.accent};text-decoration:none;">${escapeHtml(b.website)}</a>`);
  return rows.join(' · ') || 'Contact our support team.';
}

function layout(b, { title, preheader = '', body, cta }) {
  const B = normalizeBrand(b);
  const logo = B.logoUrl
    ? `<img src="${B.logoUrl}" alt="${escapeHtml(B.name)}" width="44" height="44" style="display:block;border-radius:22px;">`
    : `<div style="width:44px;height:44px;border-radius:22px;background:${B.accent};color:#fff;font-weight:700;font-size:16px;line-height:44px;text-align:center;">${escapeHtml(B.name.slice(0, 2).toUpperCase())}</div>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">${escapeHtml(preheader)}</span>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,0.06);">
      <tr>
        <td style="background:${B.color};padding:28px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td>${logo}</td>
            <td align="right"><span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.3px;">${escapeHtml(B.name)}</span></td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 32px 8px 32px;">
          <h1 style="margin:0 0 20px 0;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">${escapeHtml(title)}</h1>
          <div style="font-size:15px;line-height:1.65;color:#334155;">${body}</div>
        </td>
      </tr>
      ${cta ? `<tr><td style="padding:8px 32px 24px 32px;">${button(cta.url, cta.label, B.accent)}</td></tr>` : ''}
      <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 0 0;"></td></tr>
      <tr>
        <td style="padding:24px 32px 32px 32px;">
          <p style="margin:0 0 10px 0;font-size:13px;font-weight:600;color:#0f172a;">Need help?</p>
          <p style="margin:0 0 10px 0;font-size:13px;color:#64748b;line-height:1.6;">${supportBlock(B)}</p>
          ${B.address ? `<p style="margin:0 0 16px 0;font-size:12px;color:#94a3b8;">${escapeHtml(B.address)}</p>` : ''}
          <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} ${escapeHtml(B.name)}. All rights reserved.</p>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0 0;font-size:11px;color:#94a3b8;">This is a transactional email. Please do not reply directly.</p>
  </td></tr>
</table>
</body>
</html>`;
}

function plain(lines) {
  return lines.filter(Boolean).join('\n');
}

function cta(url, label) {
  return url ? { url, label } : null;
}

function methodLabel(code) {
  if (!code) return null;
  return code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─────────────── AUTH ─────────────── */

const verification = ({ brand, name, verifyUrl, expiresIn = '24 hours' }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Verify your ${B.name} account`,
    html: layout(B, {
      title: 'Verify your email',
      preheader: `Confirm your ${B.name} account`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="margin:0 0 12px 0;">Thanks for signing up for ${escapeHtml(B.name)}. Click the button below to verify your email and activate your account.</p>
        <p style="margin:0;color:#64748b;font-size:13px;">This link expires in ${escapeHtml(expiresIn)}.</p>`,
      cta: cta(verifyUrl, 'Verify email'),
    }),
    text: plain([`Hi ${name},`, '', `Verify your ${B.name} account:`, verifyUrl, '', `Expires in ${expiresIn}.`]),
  };
};

const passwordReset = ({ brand, fullName, resetUrl, expiresIn = '1 hour' }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Reset your ${B.name} password`,
    html: layout(B, {
      title: 'Reset your password',
      preheader: 'Password reset requested',
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(fullName)}</strong>,</p>
        <p style="margin:0 0 12px 0;">We received a request to reset your password. Click below to set a new one.</p>
        <p style="margin:0;color:#64748b;font-size:13px;">Expires in ${escapeHtml(expiresIn)}. If you didn't request this, ignore this email.</p>`,
      cta: cta(resetUrl, 'Reset password'),
    }),
    text: plain([`Hi ${fullName},`, '', `Reset: ${resetUrl}`, `Expires in ${expiresIn}.`, '', "If you didn't request this, ignore this email."]),
  };
};

const passwordChanged = ({ brand, fullName, when, ip }) => {
  const B = normalizeBrand(brand);
  return {
    subject: 'Your password was changed',
    html: layout(B, {
      title: 'Password changed',
      preheader: 'Your password was updated',
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(fullName)}</strong>,</p>
        <p style="margin:0 0 12px 0;">Your ${escapeHtml(B.name)} password was changed successfully.</p>
        ${box(kv('When', escapeHtml(date(when, { timeStyle: 'short' }))) + (ip ? kv('IP', escapeHtml(ip), { mono: true }) : ''))}
        <p style="margin:0;color:#64748b;font-size:13px;">If this wasn't you, contact support immediately.</p>`,
    }),
    text: plain([`Hi ${fullName},`, '', 'Your password was changed.', `When: ${date(when, { timeStyle: 'short' })}`, ip ? `IP: ${ip}` : '', '', "If this wasn't you, contact support."]),
  };
};

const welcome = ({ brand, name, businessName, email, temporaryPassword, loginUrl, planName, planPrice, planInterval, planFeatures, startDate, endDate, trialDays }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Welcome to ${B.name} — ${businessName} is active`,
    html: layout(B, {
      title: `Welcome to ${B.name}`,
      preheader: `${businessName} is approved and ready`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="margin:0 0 16px 0;"><strong>${escapeHtml(businessName)}</strong> has been approved and is ready to use.</p>
        ${box(`
          <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Your account</p>
          ${email ? kv('Login email', escapeHtml(email), { bold: true }) : ''}
          ${temporaryPassword ? kv('Temporary password', escapeHtml(temporaryPassword), { mono: true, bold: true }) : ''}
        `)}
        ${planName ? box(`
          <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Your plan</p>
          ${kv('Plan', escapeHtml(planName), { bold: true, color: B.accent })}
          ${planPrice !== undefined ? kv('Price', `${money(planPrice, 'KES')} / ${planInterval || 'month'}`) : ''}
          ${startDate ? kv('Start', escapeHtml(startDate)) : ''}
          ${endDate ? kv('Renews', escapeHtml(endDate)) : ''}
          ${trialDays ? kv('Trial', `${trialDays} days`) : ''}
        `) : ''}
        <p style="margin:16px 0 0 0;">Log in to create your first API key and start building.</p>`,
      cta: cta(loginUrl, 'Open dashboard'),
    }),
    text: plain([`Hi ${name},`, '', `${businessName} approved.`, '', email ? `Email: ${email}` : '', temporaryPassword ? `Password: ${temporaryPassword}` : '', planName ? `Plan: ${planName}` : '', '', `Log in: ${loginUrl}`]),
  };
};

/* ─────────────── REGISTRATION ─────────────── */

const registrationReceived = ({ brand, name, businessName, planName, amount, currency, dueDate, invoiceNumber, paymentLink }) => {
  const B = normalizeBrand(brand);
  const hasPayment = Number(amount) > 0;
  return {
    subject: `We received your registration — ${businessName}`,
    html: layout(B, {
      title: 'Registration received',
      preheader: `Thanks for registering ${businessName}`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="margin:0 0 12px 0;">Thank you for registering <strong>${escapeHtml(businessName)}</strong> on ${escapeHtml(B.name)}.</p>
        <p style="margin:0 0 8px 0;">Your registration is with our team for review. We'll notify you once approved — usually within a few hours.</p>
        ${hasPayment ? box(`
          <p style="margin:0 0 10px 0;font-size:13px;font-weight:600;color:#0f172a;">Action required</p>
          <p style="margin:0 0 12px 0;font-size:14px;color:#334155;">Pay <strong>${escapeHtml(money(amount, currency))}</strong> for the <strong>${escapeHtml(planName)}</strong> plan to secure your account.</p>
          ${kv('Invoice', escapeHtml(invoiceNumber), { mono: true, bold: true })}
          ${kv('Pay before', escapeHtml(dueDate), { bold: true })}
        `, '#fffbeb', '#fde68a') : ''}`,
      cta: paymentLink ? cta(paymentLink, 'Pay invoice') : null,
    }),
    text: plain([`Hi ${name},`, '', `Registered ${businessName} on ${B.name}.`, 'Under review.', hasPayment ? `Pay ${money(amount, currency)} for ${planName}.` : '', hasPayment ? `Invoice: ${invoiceNumber}` : '', paymentLink || '']),
  };
};

const registrationRejected = ({ brand, name, businessName, reason }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Your ${B.name} registration was not approved`,
    html: layout(B, {
      title: 'Registration not approved',
      preheader: 'Registration status',
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="margin:0 0 12px 0;">Registration for <strong>${escapeHtml(businessName)}</strong> was not approved.</p>
        ${reason ? box(kv('Reason', escapeHtml(reason), { bold: true }), '#fef2f2', '#fecaca') : ''}
        <p style="margin:0;">If you believe this is a mistake, contact support.</p>`,
    }),
    text: plain([`Hi ${name},`, '', `Registration for ${businessName} not approved.`, reason ? `Reason: ${reason}` : '']),
  };
};

const tenantReactivated = ({ brand, fullName, businessName, loginUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `${businessName} is active again`,
    html: layout(B, {
      title: 'Welcome back',
      preheader: `${businessName} reactivated`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(fullName)}</strong>,</p>
        <p style="margin:0 0 12px 0;"><strong>${escapeHtml(businessName)}</strong> has been reactivated on ${escapeHtml(B.name)}.</p>`,
      cta: loginUrl ? cta(loginUrl, 'Sign in') : null,
    }),
    text: plain([`Hi ${fullName},`, '', `${businessName} reactivated.`, loginUrl || '']),
  };
};

/* ─────────────── BILLING ─────────────── */

const invoice = ({ brand, businessName, customerName, invoiceNumber, items, subtotal, discount, tax, total, amountDue, currency, dueDate, issuedAt, notes, instructions, payUrl }) => {
  const B = normalizeBrand(brand);
  const fmt = (n) => money(n, currency);
  const itemsHtml = (items || []).map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">
        <div style="font-weight:600;color:#0f172a;">${escapeHtml(item.name)}</div>
        ${item.description ? `<div style="font-size:12px;color:#94a3b8;margin-top:3px;">${escapeHtml(item.description)}</div>` : ''}
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${item.qty}</td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:#0f172a;">${fmt(item.subtotal)}</td>
    </tr>`).join('');

  const instructionsHtml = (instructions && instructions.length) ? `
    <div style="margin:24px 0 0 0;padding:18px 20px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;">
      <p style="margin:0 0 14px 0;font-size:11px;font-weight:700;color:#0f766e;letter-spacing:1px;text-transform:uppercase;">How to pay</p>
      ${instructions.map((m, i) => `
        <div style="margin-bottom:${i < instructions.length - 1 ? '18px' : '0'};">
          <p style="margin:0 0 6px 0;font-size:14px;font-weight:600;color:#0f766e;">${escapeHtml(m.title)}</p>
          ${m.description ? `<p style="margin:0 0 8px 0;font-size:12px;color:#134e4a;">${escapeHtml(m.description)}</p>` : ''}
          ${m.steps?.length ? `<ol style="margin:0;padding-left:18px;font-size:13px;color:#134e4a;line-height:1.8;">${m.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>` : ''}
        </div>`).join('')}
    </div>` : '';

  return {
    subject: `Invoice ${invoiceNumber} from ${businessName}`,
    html: layout(B, {
      title: `Invoice ${invoiceNumber}`,
      preheader: `Amount due ${fmt(amountDue ?? total)}`,
      body: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
          <td style="vertical-align:top;">
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Billed to</p>
            <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${escapeHtml(customerName)}</p>
          </td>
          <td align="right" style="vertical-align:top;">
            <p style="margin:0;font-size:13px;color:#334155;">Issued: ${escapeHtml(date(issuedAt))}</p>
            ${dueDate ? `<p style="margin:0;font-size:13px;color:#334155;">Due: ${escapeHtml(date(dueDate))}</p>` : ''}
          </td>
        </tr></table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:collapse;">
          <thead><tr>
            <th align="left" style="padding:8px 0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e2e8f0;">Item</th>
            <th align="right" style="padding:8px 0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e2e8f0;">Qty</th>
            <th align="right" style="padding:8px 0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e2e8f0;">Amount</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
          ${kv('Subtotal', fmt(subtotal))}
          ${discount > 0 ? kv('Discount', `-${fmt(discount)}`) : ''}
          ${tax > 0 ? kv('Tax', fmt(tax)) : ''}
          ${kv('Total', fmt(total), { bold: true })}
          ${amountDue !== undefined ? kv('Amount due', fmt(amountDue), { bold: true, color: B.accent }) : ''}
        </table>
        ${notes ? box(`<p style="margin:0;font-size:13px;color:#334155;">${escapeHtml(notes)}</p>`, '#eff6ff', '#bfdbfe') : ''}
        ${instructionsHtml}`,
      cta: payUrl ? cta(payUrl, 'Pay invoice') : null,
    }),
    text: plain([`INVOICE ${invoiceNumber}`, `From: ${businessName}`, `To: ${customerName}`, '', ...(items || []).map((i) => `- ${i.name} x${i.qty} = ${fmt(i.subtotal)}`), '', `Total: ${fmt(total)}`, amountDue !== undefined ? `Due: ${fmt(amountDue)}` : '', payUrl || '']),
  };
};

const paymentReceived = ({ brand, businessName, customerName, invoiceNumber, amount, currency, paidAt, paymentMethod, paymentReference, planName, planInterval, periodEnd }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Payment received — ${invoiceNumber}`,
    html: layout(B, {
      title: 'Payment received',
      preheader: `We received ${money(amount, currency)}`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(customerName)}</strong>,</p>
        <p style="margin:0 0 12px 0;">We've confirmed your payment for <strong>${escapeHtml(invoiceNumber)}</strong>. Thank you!</p>
        ${box(`
          <p style="margin:0 0 4px 0;font-size:12px;color:#166534;">Amount</p>
          <p style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#14532d;">${escapeHtml(money(amount, currency))}</p>
          ${paymentMethod ? kv('Method', escapeHtml(methodLabel(paymentMethod))) : ''}
          ${paymentReference ? kv('Reference', escapeHtml(paymentReference), { mono: true }) : ''}
          ${kv('Date', escapeHtml(date(paidAt, { timeStyle: 'short' })))}
        `, '#f0fdf4', '#bbf7d0')}
        ${planName ? box(`
          ${kv('Plan', escapeHtml(planName), { bold: true, color: B.accent })}
          ${periodEnd ? kv('Active until', escapeHtml(date(periodEnd)), { bold: true }) : ''}
        `) : ''}
        <p style="margin:0;">You're all set.</p>`,
    }),
    text: plain([`Hi ${customerName},`, '', `Payment for ${invoiceNumber} received.`, `Amount: ${money(amount, currency)}`, paymentMethod ? `Method: ${methodLabel(paymentMethod)}` : '', paymentReference ? `Reference: ${paymentReference}` : '', '', 'Thanks!']),
  };
};

const invoiceReminder = ({ brand, businessName, customerName, invoiceNumber, total, currency, dueDate, daysOverdue, paymentLink }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Reminder: Invoice ${invoiceNumber} is unpaid`,
    html: layout(B, {
      title: 'Friendly reminder',
      preheader: `Invoice ${invoiceNumber} awaiting payment`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(customerName)}</strong>,</p>
        <p style="margin:0 0 12px 0;">Invoice <strong>${escapeHtml(invoiceNumber)}</strong> from ${escapeHtml(businessName)} is still unpaid.</p>
        ${box(`
          ${kv('Amount due', escapeHtml(money(total, currency)), { bold: true, color: '#92400e' })}
          ${dueDate ? kv('Due', escapeHtml(date(dueDate))) : ''}
          ${daysOverdue ? kv('Overdue', `${daysOverdue} day${daysOverdue === 1 ? '' : 's'}`) : ''}
        `, '#fffbeb', '#fde68a')}`,
      cta: paymentLink ? cta(paymentLink, 'Pay now') : null,
    }),
    text: plain([`Invoice ${invoiceNumber} unpaid.`, `Amount: ${money(total, currency)}`, dueDate ? `Due: ${date(dueDate)}` : '', paymentLink || '']),
  };
};

const invoiceOverdue = ({ brand, businessName, customerName, invoiceNumber, total, currency, daysOverdue, paymentLink }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Overdue: Invoice ${invoiceNumber} — ${daysOverdue} days`,
    html: layout(B, {
      title: 'Invoice overdue',
      preheader: `Overdue by ${daysOverdue} days`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(customerName)}</strong>,</p>
        <p style="margin:0 0 12px 0;">Invoice <strong>${escapeHtml(invoiceNumber)}</strong> is now <strong>${daysOverdue}</strong> days overdue.</p>
        ${box(kv('Amount due', escapeHtml(money(total, currency)), { bold: true, color: '#7f1d1d' }), '#fef2f2', '#fecaca')}
        <p style="margin:0;">Please settle as soon as possible.</p>`,
      cta: paymentLink ? cta(paymentLink, 'Pay now') : null,
    }),
    text: plain([`Invoice ${invoiceNumber} overdue ${daysOverdue} days.`, `Amount: ${money(total, currency)}`, paymentLink || '']),
  };
};

const invoiceCancelled = ({ brand, businessName, customerName, invoiceNumber, reason }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Cancelled: Invoice ${invoiceNumber}`,
    html: layout(B, {
      title: `Invoice ${invoiceNumber} cancelled`,
      preheader: 'Invoice cancelled',
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(customerName)}</strong>,</p>
        <p style="margin:0 0 12px 0;">Invoice <strong>${escapeHtml(invoiceNumber)}</strong> from ${escapeHtml(businessName)} has been cancelled.</p>
        ${reason ? `<p style="margin:0;color:#64748b;font-size:13px;">Reason: ${escapeHtml(reason)}</p>` : ''}`,
    }),
    text: plain([`Invoice ${invoiceNumber} cancelled.`, reason || '']),
  };
};

const paymentRefunded = ({ brand, businessName, customerName, amount, currency, reason, refundedAt }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Refund processed — ${money(amount, currency)}`,
    html: layout(B, {
      title: 'Refund processed',
      preheader: 'Your refund has been issued',
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(customerName)}</strong>,</p>
        <p style="margin:0 0 12px 0;">A refund has been processed for <strong>${escapeHtml(businessName)}</strong>.</p>
        ${box(`
          ${kv('Amount', escapeHtml(money(amount, currency)), { bold: true, color: B.accent })}
          ${refundedAt ? kv('Refunded', escapeHtml(date(refundedAt, { timeStyle: 'short' }))) : ''}
          ${reason ? kv('Reason', escapeHtml(reason)) : ''}
        `, '#f0fdfa', '#99f6e4')}`,
    }),
    text: plain([`Hi ${customerName},`, '', `Refund of ${money(amount, currency)} processed.`, reason ? `Reason: ${reason}` : '']),
  };
};

/* ─────────────── RENEWAL / UPGRADE ─────────────── */

const renewalRequestReceived = ({ brand, name, businessName, planName, amount, currency, invoiceNumber, dueDate, paymentLink }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Renewal request received — ${businessName}`,
    html: layout(B, {
      title: 'Renewal request received',
      preheader: 'We got your renewal request',
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="margin:0 0 16px 0;">We received your request to renew <strong>${escapeHtml(planName)}</strong> for <strong>${escapeHtml(businessName)}</strong>.</p>
        ${box(`
          ${kv('Amount', escapeHtml(money(amount, currency)), { bold: true, color: B.accent })}
          ${kv('Invoice', escapeHtml(invoiceNumber), { mono: true })}
          ${dueDate ? kv('Pay before', escapeHtml(dueDate), { bold: true }) : ''}
        `, '#eff6ff', '#bfdbfe')}
        <p style="margin:16px 0 0 0;">Once paid, your plan extends automatically.</p>`,
      cta: paymentLink ? cta(paymentLink, 'Pay renewal') : null,
    }),
    text: plain([`Hi ${name},`, '', `Renewal requested for ${businessName}.`, `Plan: ${planName}`, `Amount: ${money(amount, currency)}`, `Invoice: ${invoiceNumber}`, paymentLink || '']),
  };
};

const upgradeRequestReceived = ({ brand, name, businessName, fromPlan, toPlan, amount, currency, invoiceNumber, dueDate, paymentLink }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Upgrade request received — ${businessName}`,
    html: layout(B, {
      title: 'Upgrade request received',
      preheader: `Upgrade ${fromPlan} → ${toPlan}`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="margin:0 0 16px 0;">We received your request to upgrade <strong>${escapeHtml(businessName)}</strong> from <strong>${escapeHtml(fromPlan)}</strong> to <strong>${escapeHtml(toPlan)}</strong>.</p>
        ${box(`
          ${kv('From', escapeHtml(fromPlan))}
          ${kv('To', escapeHtml(toPlan), { bold: true, color: B.accent })}
          ${kv('Amount due', escapeHtml(money(amount, currency)), { bold: true, color: B.accent })}
          ${kv('Invoice', escapeHtml(invoiceNumber), { mono: true })}
          ${dueDate ? kv('Pay before', escapeHtml(dueDate), { bold: true }) : ''}
        `, '#eff6ff', '#bfdbfe')}`,
      cta: paymentLink ? cta(paymentLink, 'Pay upgrade') : null,
    }),
    text: plain([`Hi ${name},`, '', `Upgrade requested for ${businessName}.`, `${fromPlan} → ${toPlan}`, `Amount: ${money(amount, currency)}`, paymentLink || '']),
  };
};

const renewalApproved = ({ brand, name, businessName, planName, amount, currency, periodStart, periodEnd, reference, loginUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Renewal approved — ${planName} extended`,
    html: layout(B, {
      title: 'Renewal approved',
      preheader: `${planName} extended`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="margin:0 0 16px 0;">Your renewal for <strong>${escapeHtml(businessName)}</strong> is confirmed.</p>
        ${box(`
          ${kv('Plan', escapeHtml(planName), { bold: true, color: B.accent })}
          ${amount !== undefined ? kv('Amount', escapeHtml(money(amount, currency)), { bold: true }) : ''}
          ${periodStart ? kv('New period', `${escapeHtml(date(periodStart))} → ${escapeHtml(date(periodEnd))}`) : ''}
          ${periodEnd ? kv('Active until', escapeHtml(date(periodEnd)), { bold: true }) : ''}
          ${reference ? kv('Reference', escapeHtml(reference), { mono: true }) : ''}
        `, '#f0fdf4', '#bbf7d0')}`,
      cta: loginUrl ? cta(loginUrl, 'Go to dashboard') : null,
    }),
    text: plain([`Hi ${name},`, '', `Renewal approved for ${businessName}.`, `Plan: ${planName}`, periodEnd ? `Active until: ${date(periodEnd)}` : '', loginUrl || '']),
  };
};

const upgradeApproved = ({ brand, name, businessName, fromPlan, toPlan, amount, currency, periodEnd, reference, loginUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Upgrade approved — you're on ${toPlan}`,
    html: layout(B, {
      title: 'Upgrade approved',
      preheader: `${businessName} is now on ${toPlan}`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="margin:0 0 16px 0;">Your upgrade from <strong>${escapeHtml(fromPlan)}</strong> to <strong>${escapeHtml(toPlan)}</strong> has been approved.</p>
        ${box(`
          ${kv('New plan', escapeHtml(toPlan), { bold: true, color: B.accent })}
          ${amount !== undefined ? kv('Amount', escapeHtml(money(amount, currency)), { bold: true }) : ''}
          ${periodEnd ? kv('Active until', escapeHtml(date(periodEnd)), { bold: true }) : ''}
          ${reference ? kv('Reference', escapeHtml(reference), { mono: true }) : ''}
        `, '#f0fdf4', '#bbf7d0')}`,
      cta: loginUrl ? cta(loginUrl, 'Go to dashboard') : null,
    }),
    text: plain([`Hi ${name},`, '', `Upgrade approved for ${businessName}.`, `${fromPlan} → ${toPlan}`, loginUrl || '']),
  };
};

const subscriptionExpiring = ({ brand, businessName, planName, daysLeft, expiresAt, renewUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Subscription expiring in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    html: layout(B, {
      title: 'Subscription expiring soon',
      preheader: `${planName} expires soon`,
      body: `
        <p style="margin:0 0 12px 0;">Your <strong>${escapeHtml(planName)}</strong> plan for <strong>${escapeHtml(businessName)}</strong> expires in <strong>${daysLeft}</strong> day${daysLeft === 1 ? '' : 's'}.</p>
        <p style="margin:0;">Renew to avoid interruption.</p>`,
      cta: renewUrl ? cta(renewUrl, 'Renew now') : null,
    }),
    text: plain([`${planName} for ${businessName} expires in ${daysLeft} day(s).`, renewUrl || '']),
  };
};

const subscriptionExpired = ({ brand, businessName, planName, renewUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: 'Your subscription has expired',
    html: layout(B, {
      title: 'Subscription expired',
      preheader: `${planName} expired`,
      body: `
        <p style="margin:0 0 12px 0;">The <strong>${escapeHtml(planName)}</strong> subscription for <strong>${escapeHtml(businessName)}</strong> has expired.</p>
        <p style="margin:0;">Renew to restore access.</p>`,
      cta: renewUrl ? cta(renewUrl, 'Renew now') : null,
    }),
    text: plain([`Subscription for ${businessName} expired.`, renewUrl || '']),
  };
};

const subscriptionFailed = ({ brand, businessName, planName, amount, currency, reason, retryUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: 'Subscription payment failed',
    html: layout(B, {
      title: 'Payment failed',
      preheader: 'We could not process your payment',
      body: `
        <p style="margin:0 0 12px 0;">Could not process the subscription payment for <strong>${escapeHtml(businessName)}</strong>.</p>
        ${box(`
          ${kv('Plan', escapeHtml(planName))}
          ${kv('Amount', escapeHtml(money(amount, currency)))}
          ${reason ? kv('Reason', escapeHtml(reason)) : ''}
        `, '#fef2f2', '#fecaca')}`,
      cta: retryUrl ? cta(retryUrl, 'Retry payment') : null,
    }),
    text: plain([`Payment failed for ${businessName}.`, `Plan: ${planName} · Amount: ${money(amount, currency)}`, reason || '', retryUrl || '']),
  };
};

const planCancelled = ({ brand, businessName, planName, endsAt }) => {
  const B = normalizeBrand(brand);
  return {
    subject: 'Plan cancelled',
    html: layout(B, {
      title: 'Plan cancelled',
      preheader: `${planName} will end soon`,
      body: `
        <p style="margin:0 0 12px 0;">The <strong>${escapeHtml(planName)}</strong> plan for <strong>${escapeHtml(businessName)}</strong> has been cancelled.</p>
        <p style="margin:0;color:#64748b;font-size:13px;">Access ends: ${escapeHtml(endsAt ? date(endsAt) : 'end of current period')}</p>`,
    }),
    text: plain([`${planName} for ${businessName} cancelled.`, endsAt ? `Ends: ${date(endsAt)}` : '']),
  };
};

/* ─────────────── API KEYS ─────────────── */

const apiKeyCreated = ({ brand, fullName, keyName, keyPrefix, keyLast4, scopes, loginUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `New API key created — ${keyName}`,
    html: layout(B, {
      title: 'New API key created',
      preheader: `Key "${keyName}" is active`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(fullName)}</strong>,</p>
        <p style="margin:0 0 12px 0;">A new API key was just created on your account.</p>
        ${box(`
          ${kv('Name', escapeHtml(keyName), { bold: true })}
          ${kv('Key', `${escapeHtml(keyPrefix)}••••${escapeHtml(keyLast4)}`, { mono: true })}
          ${scopes?.length ? kv('Scopes', escapeHtml(scopes.join(', '))) : ''}
          ${kv('Created', escapeHtml(date(new Date(), { timeStyle: 'short' })))}
        `)}
        <p style="margin:0;color:#64748b;font-size:13px;">If this wasn't you, revoke the key immediately.</p>`,
      cta: loginUrl ? cta(loginUrl, 'Manage API keys') : null,
    }),
    text: plain([`Hi ${fullName},`, '', `New API key "${keyName}" created.`, scopes?.length ? `Scopes: ${scopes.join(', ')}` : '', '', "If this wasn't you, revoke it now."]),
  };
};

const apiKeyRevoked = ({ brand, fullName, keyName, loginUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `API key revoked — ${keyName}`,
    html: layout(B, {
      title: 'API key revoked',
      preheader: `Key "${keyName}" was revoked`,
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(fullName)}</strong>,</p>
        <p style="margin:0 0 12px 0;">The API key <strong>${escapeHtml(keyName)}</strong> has been revoked and will no longer work.</p>
        <p style="margin:0;color:#64748b;font-size:13px;">If this wasn't you, contact support immediately.</p>`,
      cta: loginUrl ? cta(loginUrl, 'Manage API keys') : null,
    }),
    text: plain([`Hi ${fullName},`, '', `API key "${keyName}" revoked.`, '', "If this wasn't you, contact support."]),
  };
};

/* ─────────────── ADMIN ─────────────── */

const adminWelcome = ({ brand, fullName, email, temporaryPassword, loginUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `You've been added as a ${B.name} admin`,
    html: layout(B, {
      title: 'Welcome to the admin panel',
      preheader: 'Your admin account is ready',
      body: `
        <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(fullName)}</strong>,</p>
        <p style="margin:0 0 16px 0;">Your ${escapeHtml(B.name)} admin account has been created.</p>
        ${box(`
          ${kv('Email', escapeHtml(email), { bold: true })}
          ${temporaryPassword ? kv('Temporary password', escapeHtml(temporaryPassword), { mono: true, bold: true }) : ''}
        `)}
        <p style="margin:0;">Log in and change your password immediately.</p>`,
      cta: cta(loginUrl, 'Open admin panel'),
    }),
    text: plain([`Hi ${fullName},`, '', 'Admin account created.', `Email: ${email}`, temporaryPassword ? `Password: ${temporaryPassword}` : '', '', `Log in: ${loginUrl}`]),
  };
};

const adminNewPending = ({ brand, businessName, ownerName, ownerEmail, ownerPhone, registeredAt, reviewUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `New registration pending — ${businessName}`,
    html: layout(B, {
      title: 'New pending registration',
      preheader: `${businessName} awaiting approval`,
      body: `
        <p style="margin:0 0 12px 0;">A new registration needs approval.</p>
        ${box(`
          ${kv('Business', escapeHtml(businessName), { bold: true })}
          ${kv('Owner', `${escapeHtml(ownerName)} · ${escapeHtml(ownerEmail)}${ownerPhone ? ` · ${escapeHtml(ownerPhone)}` : ''}`)}
          ${kv('Registered', escapeHtml(date(registeredAt, { timeStyle: 'short' })))}
        `)}`,
      cta: cta(reviewUrl, 'Review registration'),
    }),
    text: plain([`New pending registration: ${businessName}`, `Owner: ${ownerName} (${ownerEmail})`, `Registered: ${date(registeredAt, { timeStyle: 'short' })}`, '', `Review: ${reviewUrl}`]),
  };
};

const adminPaymentReceived = ({ brand, businessName, ownerName, ownerEmail, invoiceNumber, amount, currency, paidAt, paymentMethod, paymentReference, planName, reviewUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Payment received — ${businessName} (${money(amount, currency)})`,
    html: layout(B, {
      title: 'Payment received',
      preheader: `${businessName} paid ${money(amount, currency)}`,
      body: `
        <p style="margin:0 0 12px 0;">Payment received from a pending tenant. Review and approve.</p>
        ${box(`
          ${kv('Business', escapeHtml(businessName), { bold: true })}
          ${kv('Plan', escapeHtml(planName || '—'))}
          ${kv('Invoice', escapeHtml(invoiceNumber), { mono: true })}
          ${kv('Amount', escapeHtml(money(amount, currency)), { bold: true, color: B.accent })}
          ${kv('Method', escapeHtml(methodLabel(paymentMethod) || '—'))}
          ${paymentReference ? kv('Reference', escapeHtml(paymentReference), { mono: true }) : ''}
          ${kv('Paid', escapeHtml(date(paidAt, { timeStyle: 'short' })))}
        `)}
        ${box(`
          ${kv('Owner', escapeHtml(ownerName || '—'))}
          ${kv('Email', escapeHtml(ownerEmail || '—'))}
        `, '#eff6ff', '#bfdbfe')}`,
      cta: reviewUrl ? cta(reviewUrl, 'Review & approve') : null,
    }),
    text: plain([`Payment received from ${businessName}.`, `Plan: ${planName}`, `Invoice: ${invoiceNumber}`, `Amount: ${money(amount, currency)}`, `Method: ${methodLabel(paymentMethod)}`, '', `Review: ${reviewUrl}`]),
  };
};

const adminRenewalRequested = ({ brand, businessName, ownerName, ownerEmail, planName, amount, currency, invoiceNumber, reviewUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Renewal requested — ${businessName}`,
    html: layout(B, {
      title: 'Renewal requested',
      preheader: `${businessName} requested a renewal`,
      body: `
        <p style="margin:0 0 12px 0;">A tenant requested a renewal. Renewal extends automatically on payment.</p>
        ${box(`
          ${kv('Business', escapeHtml(businessName), { bold: true })}
          ${kv('Plan', escapeHtml(planName), { color: B.accent })}
          ${kv('Amount', escapeHtml(money(amount, currency)), { bold: true })}
          ${kv('Invoice', escapeHtml(invoiceNumber), { mono: true })}
        `, '#eff6ff', '#bfdbfe')}
        ${box(`
          ${kv('Owner', escapeHtml(ownerName))}
          ${kv('Email', escapeHtml(ownerEmail))}
        `)}`,
      cta: reviewUrl ? cta(reviewUrl, 'View in admin') : null,
    }),
    text: plain([`${businessName} requested a renewal.`, `Plan: ${planName}`, `Amount: ${money(amount, currency)}`, `Invoice: ${invoiceNumber}`, '', `Owner: ${ownerName} <${ownerEmail}>`, '', reviewUrl ? `View: ${reviewUrl}` : '']),
  };
};

const adminUpgradeRequested = ({ brand, businessName, ownerName, ownerEmail, fromPlan, toPlan, amount, currency, invoiceNumber, reviewUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Upgrade requested — ${businessName} (${fromPlan} → ${toPlan})`,
    html: layout(B, {
      title: 'Upgrade requested',
      preheader: `${businessName} wants to upgrade`,
      body: `
        <p style="margin:0 0 12px 0;">A tenant requested a plan upgrade. Manual approval is required after payment.</p>
        ${box(`
          ${kv('Business', escapeHtml(businessName), { bold: true })}
          ${kv('From', escapeHtml(fromPlan))}
          ${kv('To', escapeHtml(toPlan), { bold: true, color: B.accent })}
          ${kv('Amount', escapeHtml(money(amount, currency)), { bold: true })}
          ${kv('Invoice', escapeHtml(invoiceNumber), { mono: true })}
        `, '#eff6ff', '#bfdbfe')}
        ${box(`
          ${kv('Owner', escapeHtml(ownerName))}
          ${kv('Email', escapeHtml(ownerEmail))}
        `)}`,
      cta: reviewUrl ? cta(reviewUrl, 'Review upgrade') : null,
    }),
    text: plain([`${businessName} requested an upgrade.`, `${fromPlan} → ${toPlan}`, `Amount: ${money(amount, currency)}`, `Invoice: ${invoiceNumber}`, '', `Owner: ${ownerName} <${ownerEmail}>`, '', reviewUrl ? `Review: ${reviewUrl}` : '']),
  };
};

const adminServiceDown = ({ brand, service, error, since }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Alert: ${service} is down`,
    html: layout(B, {
      title: `Service alert — ${service}`,
      preheader: `${service} health check failed`,
      body: `
        <p style="margin:0 0 12px 0;">The health check for <strong>${escapeHtml(service)}</strong> failed.</p>
        ${box(kv('Error', escapeHtml(error || 'Unknown')) + kv('Since', escapeHtml(date(since, { timeStyle: 'short' }))), '#fef2f2', '#fecaca')}`,
    }),
    text: plain([`${service} down.`, `Error: ${error || 'Unknown'}`, `Since: ${date(since, { timeStyle: 'short' })}`]),
  };
};

const adminBackupSuccess = ({ brand, filename, sizeHuman, durationMs, collections, at, downloadUrl }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Backup completed — ${filename}`,
    html: layout(B, {
      title: 'Backup completed',
      preheader: `${filename} finished successfully`,
      body: `
        <p style="margin:0 0 12px 0;">Automatic backup completed successfully.</p>
        ${box(`
          ${kv('Filename', escapeHtml(filename), { mono: true })}
          ${kv('Size', escapeHtml(sizeHuman || '—'))}
          ${kv('Duration', `${((durationMs || 0) / 1000).toFixed(1)}s`)}
          ${kv('Collections', escapeHtml(String((collections || []).length)))}
          ${kv('When', escapeHtml(date(at, { timeStyle: 'short' })))}
        `, '#f0fdf4', '#bbf7d0')}`,
      cta: downloadUrl ? cta(downloadUrl, 'Download backup') : null,
    }),
    text: plain([`Backup ${filename} completed.`, `Size: ${sizeHuman || '—'}`, `At: ${date(at, { timeStyle: 'short' })}`, downloadUrl || '']),
  };
};

const adminBackupFailed = ({ brand, error, at }) => {
  const B = normalizeBrand(brand);
  return {
    subject: 'Backup failed',
    html: layout(B, {
      title: 'Backup failed',
      preheader: 'Automatic backup did not complete',
      body: `
        <p style="margin:0 0 12px 0;">An automatic backup failed.</p>
        ${box(kv('Error', escapeHtml(error || 'Unknown')) + kv('When', escapeHtml(date(at, { timeStyle: 'short' }))), '#fef2f2', '#fecaca')}`,
    }),
    text: plain(['Backup failed.', `Error: ${error || 'Unknown'}`, `At: ${date(at, { timeStyle: 'short' })}`]),
  };
};

const adminRestoreComplete = ({ brand, filename, collections, at }) => {
  const B = normalizeBrand(brand);
  return {
    subject: 'Backup restore completed',
    html: layout(B, {
      title: 'Restore completed',
      preheader: `Restore of ${filename} finished`,
      body: `
        <p style="margin:0 0 12px 0;">Restore from <strong>${escapeHtml(filename)}</strong> completed.</p>
        ${box(kv('Collections', escapeHtml((collections || []).join(', '))) + kv('When', escapeHtml(date(at, { timeStyle: 'short' }))), '#f0fdf4', '#bbf7d0')}`,
    }),
    text: plain([`Restore from ${filename} completed.`, `Collections: ${(collections || []).join(', ')}`, `At: ${date(at, { timeStyle: 'short' })}`]),
  };
};

const backupDelivered = ({ brand, filename, sizeHuman, downloadUrl, expiresIn = '7 days' }) => {
  const B = normalizeBrand(brand);
  return {
    subject: `Backup file — ${filename}`,
    html: layout(B, {
      title: 'Your backup file',
      preheader: `${filename} (${sizeHuman || '—'})`,
      body: `
        <p style="margin:0 0 12px 0;">Here is the backup file you requested.</p>
        ${box(`
          ${kv('Filename', escapeHtml(filename), { mono: true })}
          ${kv('Size', escapeHtml(sizeHuman || '—'))}
        `)}
        <p style="margin:0;color:#64748b;font-size:13px;">This link expires in ${escapeHtml(expiresIn)}.</p>`,
      cta: cta(downloadUrl, 'Download backup'),
    }),
    text: plain([`Backup file: ${filename}`, `Size: ${sizeHuman || '—'}`, '', downloadUrl, '', `Expires in ${expiresIn}.`]),
  };
};

module.exports = {
  verification,
  passwordReset,
  passwordChanged,
  welcome,
  registrationReceived,
  registrationRejected,
  tenantReactivated,
  invoice,
  paymentReceived,
  invoiceReminder,
  invoiceOverdue,
  invoiceCancelled,
  paymentRefunded,
  renewalRequestReceived,
  upgradeRequestReceived,
  renewalApproved,
  upgradeApproved,
  subscriptionExpiring,
  subscriptionExpired,
  subscriptionFailed,
  planCancelled,
  apiKeyCreated,
  apiKeyRevoked,
  adminWelcome,
  adminNewPending,
  adminPaymentReceived,
  adminRenewalRequested,
  adminUpgradeRequested,
  adminServiceDown,
  adminBackupSuccess,
  adminBackupFailed,
  adminRestoreComplete,
  backupDelivered,
};