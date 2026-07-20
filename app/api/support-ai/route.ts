import { NextRequest, NextResponse } from 'next/server';

const systemPrompt = 'Bạn là Trợ lý ảo VieGeo. Trả lời bằng tiếng Việt, thân thiện, ngắn gọn, hỗ trợ học địa lí Việt Nam và sử dụng ứng dụng VieGeo. Không bịa đặt chính sách hoặc dữ liệu cá nhân.';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    const question = String(message || '').trim().slice(0, 1600);
    if (!question) return NextResponse.json({ error: 'Tin nhắn trống.' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: 'Hiện chưa có nhân viên CSKH trực tuyến. Tôi đã ghi nhận yêu cầu của bạn và sẽ chuyển tới đội ngũ VieGeo.', fallback: true });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_SUPPORT_MODEL || 'gpt-4o-mini',
        temperature: 0.35,
        max_tokens: 280,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: question }],
      }),
    });

    if (!response.ok) throw new Error(`AI response ${response.status}`);
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('AI không trả về nội dung.');
    return NextResponse.json({ reply, fallback: false });
  } catch (error) {
    console.error('Support AI error:', error);
    return NextResponse.json({ reply: 'Tôi chưa thể phản hồi ngay lúc này. Yêu cầu của bạn đã được lưu để CSKH VieGeo tiếp nhận.', fallback: true });
  }
}
