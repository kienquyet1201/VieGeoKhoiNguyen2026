const crypto = require('node:crypto');

const COOKIE_NAME = 'viegeo_admin_session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const ACCOUNTS = [
  {
    id: '12012001-0000-4000-8000-000000000001',
    username: 'kienquyet1201@gmail.com',
    email: 'kienquyet1201@gmail.com',
    passwordHash: 'e1d9ebc55fd6baff0590282d9d7d5302047b7ab6ca817c6a47b30b791da3e282',
    name: 'Đặng Kiên Quyết',
    userName: 'adminQuyet',
  },
  {
    id: 'ad000000-0000-4000-8000-000000000002',
    username: 'admin',
    email: 'admin@viegeo.local',
    passwordHash: 'c1c224b03cd9bc7b6a86d77f5dace40191766c485cd55dc48caf9ac873335d6f',
    name: 'Admin Tổng',
    userName: 'Admin',
  },
];

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(String(req.body || '{}')); } catch { return {}; }
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function safeEqual(first, second) {
  const left = Buffer.from(String(first || ''));
  const right = Buffer.from(String(second || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET
    || process.env.SET_ADMIN_SECRET
    || ACCOUNTS.map(account => account.passwordHash).join(':');
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function tokenFor(email) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function cookieValue(req, name) {
  const pairs = String(req.headers.cookie || '').split(';');
  for (const pair of pairs) {
    const separator = pair.indexOf('=');
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() === name) return decodeURIComponent(pair.slice(separator + 1).trim());
  }
  return '';
}

function accountFromRequest(req) {
  const token = cookieValue(req, COOKIE_NAME);
  const [payload, signature] = String(token).split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session?.email || Number(session.exp) <= Math.floor(Date.now() / 1000)) return null;
    return ACCOUNTS.find(account => account.email === String(session.email).toLowerCase()) || null;
  } catch {
    return null;
  }
}

function publicProfile(account) {
  return {
    id: account.id,
    email: account.email,
    user_name: account.userName,
    name: account.name,
    full_name: account.name,
    role: 'admin',
    roles: ['admin', 'cs', 'parent', 'user'],
    active_role: 'admin',
    account_status: 'premium',
    isAdmin: true,
    isSuperAdmin: true,
  };
}

function setSessionCookie(res, value, maxAge) {
  const attributes = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
}

module.exports = function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    const body = parseBody(req);
    const username = String(body.username || '').trim().toLowerCase();
    const account = ACCOUNTS.find(item => item.username === username);
    if (!account || !safeEqual(hash(body.password), account.passwordHash)) {
      return res.status(401).json({ ok: false, error: 'Thông tin quản trị không đúng.' });
    }
    setSessionCookie(res, tokenFor(account.email), SESSION_SECONDS);
    return res.status(200).json({ ok: true, profile: publicProfile(account) });
  }

  if (req.method === 'GET') {
    const account = accountFromRequest(req);
    if (!account) return res.status(401).json({ ok: false });
    return res.status(200).json({ ok: true, profile: publicProfile(account) });
  }

  if (req.method === 'DELETE') {
    setSessionCookie(res, '', 0);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed.' });
};
