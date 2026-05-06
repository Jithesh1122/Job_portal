export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

export const normalizeString = (value) => String(value || '').trim();

export const ensureMinLength = (value, length) =>
  normalizeString(value).length >= length;

export const parseAllowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
