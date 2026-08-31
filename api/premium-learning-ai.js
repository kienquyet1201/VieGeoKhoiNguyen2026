const crypto = require('node:crypto');

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const REQUEST_TIMEOUT_MS = 18_000;
const MAX_REQUESTS_PER_MINUTE = 6;
const COOKIE_NAME = 'viegeo_admin_session';
const ADMIN_ACCOUNTS = [
  { id: '12012001-0000-4000-8000-000000000001', email: 'kienquyet1201@gmail.com', passwordHash: 'e1d9ebc55fd6baff0590282d9d7d5302047b7ab6ca817c6a47b30b791da3e282' },
  { id: 'ad000000-0000-4000-8000-000000000002', email: 'admin@viegeo.local', passwordHash: 'c1c224b03cd9bc7b6a86d77f5dace40191766c485cd55dc48caf9ac873335d6f' },
];
const buckets = new Map();

function clean(value, max = 2000) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(String(req.body || '{}')); } catch { return {}; }
}

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
}

function databaseKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey();
}

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://mijjvqkfkzwpmjpwkbgk.supabase.co';
}

function adminSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.SET_ADMIN_SECRET || ADMIN_ACCOUNTS.map(account => account.passwordHash).join(':');
}

function signed(payload) {
  return crypto.createHmac('sha256', adminSecret()).update(payload).digest('base64url');
}

function safeEqual(first, second) {
  const left = Buffer.from(String(first || ''));
  const right = Buffer.from(String(second || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function cookieValue(req, name) {
  for (const pair of String(req.headers.cookie || '').split(';')) {
    const separator = pair.indexOf('=');
    if (separator >= 0 && pair.slice(0, separator).trim() === name) return decodeURIComponent(pair.slice(separator + 1).trim());
  }
  return '';
}

function adminFromSession(req) {
  const [payload, signature] = String(cookieValue(req, COOKIE_NAME)).split('.');
  if (!payload || !signature || !safeEqual(signature, signed(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data?.email || Number(data.exp) <= Math.floor(Date.now() / 1000)) return null;
    return ADMIN_ACCOUNTS.find(account => account.email === String(data.email).toLowerCase()) || null;
  } catch { return null; }
}

async function authUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const key = anonKey();
  if (token && key) {
    const response = await fetch(`${supabaseUrl()}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` }, cache: 'no-store'
    });
    if (response.ok) {
      const data = await response.json();
      if (data?.id && data?.email) return { id: String(data.id), email: String(data.email).toLowerCase() };
    }
  }
  const admin = adminFromSession(req);
  return admin ? { id: admin.id, email: admin.email, isBootstrapAdmin: true } : null;
}

function allowed(userId) {
  const now = Date.now();
  const previous = buckets.get(userId);
  if (!previous || previous.resetAt <= now) {
    buckets.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  previous.count += 1;
  buckets.set(userId, previous);
  return previous.count <= MAX_REQUESTS_PER_MINUTE;
}

async function selectRows(table, query) {
  const key = databaseKey();
  if (!key) throw new Error('SUPABASE_NOT_CONFIGURED');
  const response = await fetch(`${supabaseUrl()}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store'
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function premium(profile) {
  const roles = Array.isArray(profile?.roles) ? profile.roles : String(profile?.roles || '').split(',');
  return [profile?.account_status, profile?.role, profile?.active_role, ...roles]
    .map(value => clean(value, 40).toLowerCase())
    .some(value => ['premium', 'active', 'approved'].includes(value));
}

function scoreOf(submission) {
  const details = submission?.details || {};
  const correct = Number(submission?.correct_count ?? details.correct_count ?? details.correctAnswers);
  const total = Number(submission?.total_count ?? details.total_count ?? details.totalQuestions);
  if (Number.isFinite(correct) && Number.isFinite(total) && total > 0) return Math.round(correct / total * 100);
  const score = Number(submission?.score ?? details.score);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null;
}

function weaknessSummary(rows) {
  const grouped = new Map();
  rows.forEach(row => {
    const details = row?.details || {};
    const title = clean(row?.topic || details.topic || `${row?.province || details.province || 'Địa lí'} · ${row?.island || details.island || 'Bài học'}`, 140);
    const score = scoreOf(row);
    if (!title || score === null) return;
    const current = grouped.get(title) || { title, count: 0, total: 0 };
    current.count += 1;
    current.total += score;
    grouped.set(title, current);
  });
  const items = [...grouped.values()].map(item => ({ ...item, average: Math.round(item.total / item.count) }))
    .sort((left, right) => left.average - right.average || right.count - left.count).slice(0, 5);
  return items.length ? items.map(item => `- ${item.title}: ${item.average}% qua ${item.count} lượt`).join('\n') : '- Chưa có đủ dữ liệu; đề xuất bài đánh giá ngắn theo lớp học.';
}

function promptFor(action, profile, submissions, context) {
  const curriculum = clean(profile?.textbook_curriculum || 'Chương trình GDPT 2018', 160);
  const grade = Number(profile?.school_grade) || 0;
  const age = Number(profile?.age) || 0;
  const base = `Bạn là Gia sư Premium của VieGeo. Trả lời tiếng Việt rõ ràng, tích cực, đúng độ tuổi. Hồ sơ: ${age ? `${age} tuổi` : 'chưa khai báo tuổi'}, ${grade ? `lớp ${grade}` : 'chưa khai báo lớp'}, chương trình ${curriculum}. Chỉ dùng kiến thức SGK, không bịa trích dẫn hay số trang.\nKết quả gần đây:\n${weaknessSummary(submissions)}\n`;
  if (action === 'analysis') return `${base}\nPhân tích theo đúng 3 mục: (1) Điểm cần củng cố, (2) Bài học nên làm tiếp theo, (3) Kế hoạch 20 phút hôm nay. Tối đa 260 từ.`;
  if (action === 'hint') {
    const question = clean(context?.question, 1200);
    const options = Array.isArray(context?.options) ? context.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${clean(option, 240)}`).join('\n') : '';
    const theory = clean(context?.theory || context?.textbookQuote, 1800);
    return `${base}\nCâu hỏi hiện tại: ${question || 'chưa có nội dung'}\nLựa chọn:\n${options || 'chưa có'}\nNội dung SGK/lý thuyết: ${theory || 'chưa có'}\nCho một gợi ý gần nhất để học sinh tự suy luận. Tuyệt đối không nêu đáp án hoặc nhắc lại nguyên văn lựa chọn đúng. Chỉ 2–4 câu, tối đa 90 từ.`;
  }
  return `${base}\nSoạn 5 bài tập về nhà vừa sức và có phân hóa. Mỗi bài gồm câu hỏi, đáp án ngắn, giải thích 1–2 câu. Tối đa 500 từ.`;
}

function extractReply(data) {
  const direct = clean(data?.output_text ?? data?.outputText, 4000);
  if (direct) return direct;
  for (const step of Array.isArray(data?.steps) ? data.steps.slice().reverse() : []) {
    const text = (Array.isArray(step?.content) ? step.content : []).map(item => clean(item?.text, 1600)).filter(Boolean).join('\n');
    if (text) return clean(text, 4000);
  }
  return '';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Phiên Premium không còn hiệu lực.' });
    if (!allowed(user.id)) return res.status(429).json({ error: 'Bạn đang gửi yêu cầu quá nhanh. Hãy thử lại sau ít phút.' });
    const body = parseBody(req);
    const action = clean(body.action, 32);
    if (!['analysis', 'homework', 'hint'].includes(action)) return res.status(400).json({ error: 'Yêu cầu AI không hợp lệ.' });

    let profiles = await selectRows('users', `select=email,user_name,name,role,active_role,roles,account_status,age,school_grade,textbook_curriculum&email=eq.${encodeURIComponent(user.email)}&limit=1`);
    let profile = profiles[0];
    if (!profile && user.isBootstrapAdmin) profile = { email: user.email, account_status: 'premium', role: 'admin', roles: ['admin'] };
    if (!profile) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    if (!premium(profile)) return res.status(403).json({ error: 'Tính năng này dành cho tài khoản Premium.' });

    const submissions = await selectRows('submissions', `select=province,island,topic,correct_count,total_count,score,details,created_at&user_email=eq.${encodeURIComponent(user.email)}&order=created_at.desc&limit=60`).catch(() => []);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Trợ lý AI Premium chưa được cấu hình.' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey, 'Api-Revision': '2026-05-20' },
        body: JSON.stringify({ model: process.env.GEMINI_LEARNING_MODEL || process.env.GEMINI_SUPPORT_MODEL || DEFAULT_MODEL, input: promptFor(action, profile, submissions, body.context || {}) }),
        signal: controller.signal,
      });
    } finally { clearTimeout(timeout); }
    if (!response.ok) return res.status(502).json({ error: 'Trợ lý AI chưa thể phản hồi lúc này. Vui lòng thử lại.' });
    const reply = extractReply(await response.json());
    if (!reply) return res.status(502).json({ error: 'Trợ lý AI chưa tạo được phản hồi.' });
    return res.status(200).json({ action, reply });
  } catch (error) {
    console.error('[VieGeo Premium AI] Request failed:', error);
    return res.status(500).json({ error: 'Trợ lý AI chưa thể xử lý yêu cầu. Vui lòng thử lại.' });
  }
};
