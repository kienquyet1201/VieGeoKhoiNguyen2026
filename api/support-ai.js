const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const MAX_MESSAGE_LENGTH = 1600;
const MAX_CONTEXT_MESSAGES = 8;

const systemInstruction = `Bạn là Trợ lý CSKH tự động của VieGeo và trả lời bằng tiếng Việt.
- Trả lời thân thiện, rõ ràng, ngắn gọn và ưu tiên hướng dẫn từng bước.
- Chỉ hỗ trợ VieGeo, tài khoản, bài học, bản đồ, câu hỏi, Premium và lỗi giao diện phổ biến.
- Không yêu cầu mật khẩu, OTP, khóa API, dữ liệu thanh toán hoặc thông tin nhạy cảm.
- Không tự nhận đã duyệt Premium, đổi quyền, hoàn tiền hoặc sửa dữ liệu.
- Nếu cần quyền quản trị hoặc không chắc chắn, hãy nói yêu cầu sẽ được chuyển cho nhân viên CSKH.
- Không bịa đặt trạng thái tài khoản. Trả lời tối đa khoảng 120 từ.`;

function cleanText(value, maxLength) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function requestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(String(req.body || '{}')); } catch { return {}; }
}

function promptFor(message, conversation) {
  const history = (Array.isArray(conversation) ? conversation : []).slice(-MAX_CONTEXT_MESSAGES).map((item) => {
    const role = ['ai', 'admin', 'cs'].includes(cleanText(item?.sender, 20).toLowerCase()) ? 'CSKH' : 'Người dùng';
    const text = cleanText(item?.text ?? item?.message, 500);
    return text ? `${role}: ${text}` : '';
  }).filter(Boolean);
  return history.length ? `Lịch sử hội thoại gần nhất:\n${history.join('\n')}\n\nTin nhắn mới: ${message}` : message;
}

function extractReply(data) {
  const direct = cleanText(data?.output_text ?? data?.outputText, 2400);
  if (direct) return direct;
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    if (steps[index]?.type !== 'model_output') continue;
    const content = Array.isArray(steps[index]?.content) ? steps[index].content : [];
    const text = content.map((item) => cleanText(item?.text, 1200)).filter(Boolean).join('\n');
    if (text) return cleanText(text, 2400);
  }
  return '';
}

function fallbackReply() {
  return 'Tôi đã nhận được yêu cầu của bạn. Nhân viên CSKH VieGeo sẽ tiếp tục hỗ trợ trong cuộc trò chuyện này.';
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const body = requestBody(req);
  const message = cleanText(body.message, MAX_MESSAGE_LENGTH);
  if (!message) return res.status(400).json({ error: 'Tin nhắn trống.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(200).json({ reply: fallbackReply(), fallback: true, reason: 'not_configured' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'Api-Revision': '2026-05-20'
      },
      body: JSON.stringify({
        model: process.env.GEMINI_SUPPORT_MODEL || DEFAULT_MODEL,
        system_instruction: systemInstruction,
        input: promptFor(message, body.conversation)
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      console.error('[VieGeo Support AI] Google API request failed', { status: response.status });
      return res.status(200).json({ reply: fallbackReply(), fallback: true, reason: 'provider_error' });
    }
    const reply = extractReply(await response.json());
    return res.status(200).json({ reply: reply || fallbackReply(), fallback: !reply, provider: 'google-gemini' });
  } catch (error) {
    console.error('[VieGeo Support AI] Request failed', { reason: error?.name === 'AbortError' ? 'timeout' : 'request_error' });
    return res.status(200).json({ reply: fallbackReply(), fallback: true, reason: 'request_error' });
  } finally {
    clearTimeout(timeout);
  }
};
