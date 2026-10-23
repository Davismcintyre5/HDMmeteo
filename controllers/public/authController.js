const Tenant = require('../../models/admin/Tenant');
const User = require('../../models/client/User');
const Plan = require('../../models/admin/Plan');
const Admin = require('../../models/admin/Admin');
const Verification = require('../../models/client/Verification');
const RefreshToken = require('../../models/client/RefreshToken');
const { generateToken, generateRefreshToken, verify } = require('../../utils/jwt');
const { sha256, randomToken } = require('../../utils/hash');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const env = require('../../config/env');
const invoiceService = require('../../services/invoiceService');
const emailService = require('../../services/emailService');
const smsService = require('../../services/smsService');
const { logger } = require('../../utils/logger');

function slugify(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

async function issueTokens(user) {
  const accessToken = generateToken(user._id, user.role, 'user');
  const raw = randomToken(48);
  await RefreshToken.create({
    userId: user._id,
    tenantId: user.tenantId,
    hash: sha256(raw),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return { accessToken, refreshToken: raw };
}

async function notifyAdminsPending({ tenant, owner }) {
  try {
    const admins = await Admin.find({ status: 'active', role: { $in: ['admin', 'super_admin'] } })
      .select('email fullName')
      .lean();

    for (const admin of admins) {
      emailService
        .sendAdminNewPending({
          to: admin.email,
          businessName: tenant.name,
          ownerName: owner.fullName,
          ownerEmail: owner.email,
          ownerPhone: owner.phone || null,
          registeredAt: tenant.createdAt || new Date().toISOString(),
          reviewUrl: `${env.ADMIN_URL}/pending/${tenant._id}`,
        })
        .catch((err) => logger.warn({ err: err.message, admin: admin.email }, 'admin pending email failed'));
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'admin pending lookup failed');
  }
}

const register = asyncHandler(async (req, res) => {
  const { businessName, fullName, email, phone, password, planCode } = req.body;

  if (!businessName || !fullName || !email || !password || !planCode) {
    return errorResponse(res, 'businessName, fullName, email, password and planCode are required', 400);
  }
  if (password.length < 8) return errorResponse(res, 'Password must be at least 8 characters', 400);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return errorResponse(res, 'Email already registered', 400);

  const plan = await Plan.findOne({ code: planCode, isActive: true, isPublic: true }).lean();
  if (!plan) return errorResponse(res, 'Invalid plan', 400);

  let slug = slugify(businessName);
  let suffix = 1;
  while (await Tenant.findOne({ slug })) slug = `${slugify(businessName)}-${suffix++}`;

  const tenant = await Tenant.create({
    name: businessName,
    slug,
    status: 'pending',
    planCode: plan.code,
    billingInterval: plan.price.interval,
    subscriptionStatus: 'pending',
  });

  const user = await User.create({
    tenantId: tenant._id,
    fullName,
    email: email.toLowerCase(),
    phone: phone || null,
    password,
    role: 'owner',
    status: 'active',
  });

  const { invoice, instructions } = await invoiceService.generateSubscriptionInvoice({
    tenantId: tenant._id,
    owner: { fullName: user.fullName, email: user.email, phone: user.phone },
    tenant,
    plan,
  });

  const paymentLink = `${env.CLIENT_URL}/invoice/${invoice.invoiceNumber}`;

  // ── 1. Email the client ──
  emailService
    .sendRegistrationReceived({
      tenantId: tenant._id,
      recipientId: user._id,
      to: user.email,
      name: user.fullName,
      businessName: tenant.name,
      planName: plan.name,
      amount: invoice.total,
      currency: invoice.currency,
      dueDate: invoice.dueDate.toISOString(),
      invoiceNumber: invoice.invoiceNumber,
      paymentLink,
    })
    .catch((err) => logger.warn({ err: err.message }, 'registration email failed'));

  // ── 2. Email all active admins ──
  notifyAdminsPending({ tenant, owner: user }).catch(() => {});

  // ── 3. SMS the client ──
  if (phone) {
    smsService
      .sendRegistrationReceived({
        tenantId: tenant._id,
        recipientId: user._id,
        to: phone,
        businessName: tenant.name,
        amount: invoice.total,
        currency: invoice.currency,
        dueDate: invoice.dueDate.toISOString().slice(0, 10),
        shortUrl: paymentLink,
      })
      .catch(() => {});
  }

  return successResponse(
    res,
    {
      tenant: { id: String(tenant._id), name: tenant.name, slug: tenant.slug, status: tenant.status },
      user: { id: String(user._id), email: user.email },
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        paymentLink,
      },
      paymentInstructions: instructions,
    },
    'Registered',
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return errorResponse(res, 'Email and password required', 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) return errorResponse(res, 'Invalid credentials', 401);
  if (user.status !== 'active') return errorResponse(res, 'Account inactive', 403);

  const match = await user.comparePassword(password);
  if (!match) return errorResponse(res, 'Invalid credentials', 401);

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokens(user);
  const tenant = await Tenant.findById(user.tenantId).select('name slug status subscriptionStatus').lean();

  return successResponse(
    res,
    {
      ...tokens,
      user: {
        id: String(user._id),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: String(user.tenantId),
      },
      tenant: tenant
        ? {
            id: String(tenant._id),
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
            subscriptionStatus: tenant.subscriptionStatus,
          }
        : null,
    },
    'Login successful'
  );
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return errorResponse(res, 'Refresh token required', 400);

  let payload;
  try {
    payload = verify(refreshToken);
  } catch {
    return errorResponse(res, 'Invalid refresh token', 401);
  }
  if (!payload.refresh) return errorResponse(res, 'Invalid refresh token', 401);

  const doc = await RefreshToken.findOne({ hash: sha256(refreshToken), revokedAt: null });
  if (!doc || doc.expiresAt < new Date()) return errorResponse(res, 'Refresh token invalid or expired', 401);

  const user = await User.findById(doc.userId);
  if (!user || user.status !== 'active') return errorResponse(res, 'User inactive', 401);

  doc.revokedAt = new Date();
  doc.replacedBy = 'rotated';
  await doc.save();

  const tokens = await issueTokens(user);
  return successResponse(res, tokens, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.updateOne({ hash: sha256(refreshToken) }, { $set: { revokedAt: new Date() } });
  }
  return successResponse(res, null, 'Logged out');
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const doc = await Verification.findOne({ hash: sha256(token), type: 'email_verify', usedAt: null });
  if (!doc || doc.expiresAt < new Date()) return errorResponse(res, 'Token invalid or expired', 400);

  await User.updateOne({ _id: doc.userId }, { $set: { emailVerifiedAt: new Date() } });
  doc.usedAt = new Date();
  await doc.save();

  return successResponse(res, { verified: true }, 'Email verified');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return errorResponse(res, 'Email required', 400);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (user && user.status === 'active') {
    const raw = randomToken(32);
    await Verification.create({
      userId: user._id,
      type: 'password_reset',
      hash: sha256(raw),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetUrl = `${env.CLIENT_URL}/reset-password/${raw}`;

    emailService
      .sendPasswordReset({
        tenantId: user.tenantId,
        recipientId: user._id,
        to: user.email,
        fullName: user.fullName,
        resetUrl,
        expiresIn: '1 hour',
      })
      .catch(() => {});

    if (user.phone) {
      smsService
        .sendPasswordReset({
          tenantId: user.tenantId,
          recipientId: user._id,
          to: user.phone,
          shortUrl: resetUrl,
          expiresMin: 60,
        })
        .catch(() => {});
    }
  }

  return successResponse(res, { sent: true }, 'If the email exists, a reset link has been sent');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password || password.length < 8) return errorResponse(res, 'Password must be at least 8 characters', 400);

  const doc = await Verification.findOne({ hash: sha256(token), type: 'password_reset', usedAt: null });
  if (!doc || doc.expiresAt < new Date()) return errorResponse(res, 'Token invalid or expired', 400);

  const user = await User.findById(doc.userId).select('+password');
  if (!user) return errorResponse(res, 'User not found', 404);

  user.password = password;
  await user.save();

  doc.usedAt = new Date();
  await doc.save();

  return successResponse(res, { reset: true }, 'Password reset');
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};