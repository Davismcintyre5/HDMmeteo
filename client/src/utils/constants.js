export const ROUTES = {
  HOME: '/',
  PRICING: '/pricing',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  PENDING: '/pending',
  INVOICE: '/invoice/:number',
  DASHBOARD: '/app/dashboard',
  API_KEYS: '/app/api-keys',
  BILLING: '/app/billing',
  PROFILE: '/app/profile',
  DOCS: '/app/docs',
};

export const PUBLIC_LINKS = [
  { label: 'Product', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/app/docs' },
  { label: 'Contact', href: '/#contact' },
];

export const SIDEBAR_ITEMS = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: 'LayoutDashboard' },
  { label: 'API Keys', to: ROUTES.API_KEYS, icon: 'Key' },
  { label: 'Billing', to: ROUTES.BILLING, icon: 'CreditCard' },
  { label: 'Docs', to: ROUTES.DOCS, icon: 'BookOpen' },
  { label: 'Profile', to: ROUTES.PROFILE, icon: 'User' },
];

export const PLAN_INTERVALS = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
  { value: 'once', label: 'One-time' },
];

export const SCOPES = [
  { value: 'current', label: 'Current weather' },
  { value: 'forecast', label: 'Forecast' },
];

export const STATUS_VARIANT = {
  active: 'success',
  paid: 'success',
  success: 'success',
  enabled: 'success',
  pending: 'warning',
  unpaid: 'warning',
  sent: 'warning',
  suspended: 'danger',
  rejected: 'danger',
  expired: 'danger',
  overdue: 'danger',
  cancelled: 'neutral',
  revoked: 'neutral',
  refunded: 'info',
  disabled: 'neutral',
};

export const DEFAULT_THEME = 'system';