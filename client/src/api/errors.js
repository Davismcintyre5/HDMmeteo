export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ADMIN_INACTIVE: 'Your admin account is suspended',
  USER_INACTIVE: 'Your account is inactive',
  TENANT_INACTIVE: 'Your account is suspended',
  TOKEN_MISSING: 'Please sign in',
  TOKEN_EXPIRED: 'Session expired, please sign in again',
  TOKEN_INVALID: 'This link is invalid or has expired',
  INVALID_TOKEN: 'Invalid session, please sign in',
  REFRESH_INVALID: 'Session expired, please sign in again',
  NOT_ADMIN: 'Admin access required',
  NOT_USER: 'User access required',
  SUPER_ADMIN_REQUIRED: 'Super admin access required',
  SUBSCRIPTION_REQUIRED: 'Please pay your invoice to continue',
  SUBSCRIPTION_EXPIRED: 'Your subscription has expired',
  FEATURE_NOT_IN_PLAN: 'This feature is not available on your plan',
  API_KEY_REQUIRED: 'API key required',
  API_KEY_LIMIT_REACHED: 'You have reached your API key limit',
  API_KEY_NOT_FOUND: 'API key not found',
  API_KEY_EXPIRED: 'API key expired',
  INVALID_API_KEY: 'Invalid API key',
  SCOPE_NOT_ALLOWED: 'This API key does not have permission for this action',
  EMAIL_TAKEN: 'This email is already registered',
  EMAIL_EXISTS: 'This email is already registered',
  INVALID_PLAN: 'Selected plan is not available',
  PLAN_NOT_FOUND: 'Plan not found',
  PLAN_EXISTS: 'A plan with that code already exists',
  INVOICE_NOT_FOUND: 'Invoice not found',
  NO_INVOICE: 'No open invoice',
  ALREADY_PAID: 'This invoice is already paid',
  PAYMENT_NOT_FOUND: 'Payment not found',
  BACKUP_NOT_FOUND: 'Backup not found',
  METHOD_NOT_FOUND: 'Payment method not found',
  METHOD_EXISTS: 'A payment method with that code already exists',
  METHOD_ENABLED: 'Disable the method before deleting',
  TENANT_NOT_FOUND: 'Tenant not found',
  USER_NOT_FOUND: 'User not found',
  ADMIN_NOT_FOUND: 'Admin not found',
  INVALID_PASSWORD: 'Current password is incorrect',
  INVALID_LIMIT: 'API key limit must be null or a positive number',
  INVALID_FREQUENCY: 'Invalid backup frequency',
  INVALID_TIME: 'Time must be HH:MM',
  INVALID_RETENTION: 'Retention must be zero or greater',
  INVALID_MAX_BACKUPS: 'Max backups must be at least 1',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PROVIDER: 'Unknown weather provider',
  INVALID_LAT: 'Latitude must be between -90 and 90',
  INVALID_LON: 'Longitude must be between -180 and 180',
  INVALID_DAYS: 'Days must be a number between 1 and 16',
  INVALID_PHONE: 'Enter a valid phone number',
  VALIDATION_ERROR: 'Please check your input',
  RATE_LIMITED: 'Too many requests, please wait',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
  AI_NOT_CONFIGURED: 'AI summary is not configured',
  CLOUDINARY_DISABLED: 'Storage is not configured',
  NETWORK_ERROR: 'Cannot reach the server. Check your connection.',
};

export function normalizeError(err) {
  if (err?.code && err?.message && !err?.response) {
    return {
      code: err.code,
      message: err.message,
      status: err.status || 0,
      details: err.details || null,
      requestId: err.requestId || null,
    };
  }

  if (!err?.response) {
    return {
      code: 'NETWORK_ERROR',
      message: ERROR_MESSAGES.NETWORK_ERROR,
      status: 0,
      details: null,
      requestId: null,
    };
  }

  const data = err.response.data || {};
  const code = data.code || data.error || `HTTP_${err.response.status}`;
  const message = ERROR_MESSAGES[code] || data.message || data.error || 'Something went wrong';

  return {
    code,
    message,
    status: err.response.status,
    details: data.details || null,
    requestId: data.requestId || err.response.headers?.['x-request-id'] || null,
  };
}

export function isAuthError(err) {
  const code = err?.code || '';
  return (
    code.startsWith('TOKEN_') ||
    code === 'INVALID_TOKEN' ||
    code === 'INVALID_CREDENTIALS' ||
    code === 'REFRESH_INVALID' ||
    code === 'USER_INACTIVE' ||
    code === 'ADMIN_INACTIVE' ||
    code === 'TENANT_INACTIVE'
  );
}

export function isNetworkError(err) {
  return err?.code === 'NETWORK_ERROR' || !err?.status;
}

export function isValidationError(err) {
  return err?.code === 'VALIDATION_ERROR' || (err?.details && Array.isArray(err.details));
}

export function fieldErrors(err) {
  if (!Array.isArray(err?.details)) return {};
  const out = {};
  for (const d of err.details) {
    if (d.path && !out[d.path]) out[d.path] = d.message;
  }
  return out;
}