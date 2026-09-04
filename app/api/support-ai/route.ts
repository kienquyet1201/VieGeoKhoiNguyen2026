import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const MAX_MESSAGE_LENGTH = 1600;
const MAX_CONTEXT_MESSAGES = 8;
const REQUEST_TIMEOUT_MS = 15000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

const systemPrompt = `Bạn là Trợ lý CSKH tự động của VieGeo, trả lời bằng tiếng Việt.
- Giọng điệu thân thiện, rõ ràng, ngắn gọn và ưu tiên hướng dẫn từng bước.
- Chỉ hỗ trợ cách sử dụng VieGeo, tài khoản, bài học, bản đồ, câu hỏi, Premium và lỗi giao diện phổ biến.
- Không yêu cầu hoặc tiết lộ mật khẩu, OTP, khóa API, thông tin thanh toán hay dữ liệu cá nhân nhạy cảm.
- Không tự nhận đã duyệt Premium, đổi quyền, hoàn tiền hoặc sửa dữ liệu nếu hệ thống chưa thực hiện.
- Nếu cần thao tác của quản trị viên, liên quan bảo mật/tài khoản hoặc không chắc chắn, hãy nói rõ yêu cầu đã được chuyển cho nhân viên CSKH.
- Không bịa đặt chính sách hoặc trạng thái tài khoản. Trả lời tối đa khoảng 120 từ.`;

type ConversationItem = { sender?: unknown; text?: unknown; message?: unknown };

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function clientKey(request: NextRequest) {
  return cleanText(request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'anonymous', 80);
}

function isRateLimited(request: NextRequest) {
  const key = clientKey(request);
  const now = Date.now();
  const current = requestBuckets.get(key);
  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  current.count += 1;
  requestBuckets.set(key, current);
  return current.count > RATE_LIMIT;
}

function conversationPrompt(message: string, conversation: ConversationItem[]) {
  const history = conversation.slice(-MAX_CONTEXT_MESSAGES).map((item) => {
    const role = ['ai', 'admin', 'cs'].includes(cleanText(item?.sender, 20).toLowerCase()) ? 'CSKH' : 'Người dùng';
    const text = cleanText(item?.text ?? item?.message, 500);
    return text ? `${role}: ${text}` : '';
  }).filter(Boolean);
  return history.length
    ? `Lịch sử hội thoại gần nhất:\n${history.join('\n')}\n\nTin nhắn mới của người dùng: ${message}`
    : message;
}

function extractReply(data: any) {
  const direct = cleanText(data?.output_text ?? data?.outputText, 2400);
  if (direct) return direct;
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    if (steps[index]?.type !== 'model_output') continue;
    const content = Array.isArray(steps[index]?.content) ? steps[index].content : [];
    const text = content.map((item: any) => cleanText(item?.text, 1200)).filter(Boolean).join('\n');
    if (text) return cleanText(text, 2400);
  }
  return '';
}

function fallbackReply() {
  return 'Tôi đã ghi nhận câu hỏi của bạn. Hiện trợ lý tự động chưa thể phản hồi đầy đủ, nhân viên CSKH VieGeo sẽ tiếp tục hỗ trợ trong cuộc trò chuyện này.';
}

export async function POST(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json({ reply: 'Bạn đang gửi tin nhắn khá nhanh. Vui lòng chờ một lát rồi thử lại.', fallback: true }, { status: 429 });
  }

  try {
    const body = await request.json();
    const message = cleanText(body?.message, MAX_MESSAGE_LENGTH);
    const conversation = Array.isArray(body?.conversation) ? body.conversation : [];
    if (!message) return NextResponse.json({ error: 'Tin nhắn trống.' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: fallbackReply(), fallback: true, reason: 'not_configured' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          'Api-Revision': '2026-05-20',
        },
        body: JSON.stringify({
          model: process.env.GEMINI_SUPPORT_MODEL || DEFAULT_MODEL,
          system_instruction: systemPrompt,
          input: conversationPrompt(message, conversation),
        }),
        cache: 'no-store',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error('[VieGeo Support AI] Google API request failed', { status: response.status });
      return NextResponse.json({ reply: fallbackReply(), fallback: true, reason: 'provider_error' });
    }

    const data = await response.json();
    const reply = extractReply(data);
    if (!reply) return NextResponse.json({ reply: fallbackReply(), fallback: true, reason: 'empty_response' });
    return NextResponse.json({ reply, fallback: false, provider: 'google-gemini' });
  } catch (error) {
    const reason = error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'request_error';
    console.error('[VieGeo Support AI] Request failed', { reason });
    return NextResponse.json({ reply: fallbackReply(), fallback: true, reason });
  }
}
