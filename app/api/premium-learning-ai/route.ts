import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '../../lib/supabase-auth';
import { selectRows } from '../../lib/supabase-rest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const MAX_REQUESTS_PER_MINUTE = 6;
const REQUEST_TIMEOUT_MS = 18_000;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

type LearningAction = 'analysis' | 'homework' | 'hint';
type UserProfile = {
  email?: string;
  user_name?: string;
  name?: string;
  role?: string;
  active_role?: string;
  roles?: string[] | string;
  account_status?: string;
  age?: number;
  school_grade?: number;
  textbook_curriculum?: string;
};
type Submission = {
  province?: string;
  island?: string;
  topic?: string;
  correct_count?: number;
  total_count?: number;
  score?: number;
  details?: Record<string, unknown>;
  created_at?: string;
};
type QuestionSource = {
  id?: string;
  province?: string;
  island?: string;
  topic?: string;
  question?: string;
  theory?: string;
  explanation?: string;
  textbook_quote?: string;
};

function cleanText(value: unknown, maximum = 1000) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

function validAction(value: unknown): LearningAction | null {
  return ['analysis', 'homework', 'hint'].includes(String(value || '')) ? value as LearningAction : null;
}

function isPremium(profile: UserProfile) {
  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : String(profile?.roles || '').split(',');
  const values = [profile?.account_status, profile?.role, profile?.active_role, ...roles]
    .map(value => cleanText(value, 40).toLowerCase());
  return values.includes('premium') || values.includes('active') || values.includes('approved');
}

function isRateLimited(userId: string) {
  const now = Date.now();
  const bucket = requestBuckets.get(userId);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(userId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  requestBuckets.set(userId, bucket);
  return bucket.count > MAX_REQUESTS_PER_MINUTE;
}

function scoreOf(submission: Submission) {
  const details = submission?.details || {};
  const correct = Number(submission?.correct_count ?? details.correct_count ?? details.correctAnswers);
  const total = Number(submission?.total_count ?? details.total_count ?? details.totalQuestions);
  if (Number.isFinite(correct) && Number.isFinite(total) && total > 0) return Math.max(0, Math.min(100, Math.round(correct / total * 100)));
  const score = Number(submission?.score ?? details.score);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null;
}

function weaknessSummary(submissions: Submission[]) {
  const groups = new Map<string, { attempts: number; total: number; label: string }>();
  submissions.forEach((submission) => {
    const details = submission?.details || {};
    const label = cleanText(submission?.topic || details.topic || `${submission?.province || details.province || 'Địa lí'} · ${submission?.island || details.island || 'Bài học'}`, 140);
    const score = scoreOf(submission);
    if (!label || score === null) return;
    const current = groups.get(label) || { attempts: 0, total: 0, label };
    current.attempts += 1;
    current.total += score;
    groups.set(label, current);
  });
  const items = [...groups.values()]
    .map(item => ({ ...item, average: Math.round(item.total / item.attempts) }))
    .sort((left, right) => left.average - right.average || right.attempts - left.attempts)
    .slice(0, 5);
  return items.length
    ? items.map(item => `- ${item.label}: ${item.average}% qua ${item.attempts} lượt`).join('\n')
    : '- Chưa có đủ dữ liệu làm bài; hãy đề xuất một bài đánh giá ngắn theo lớp học.';
}

function buildPremiumLearningPrompt(action: LearningAction, profile: UserProfile, submissions: Submission[], source: QuestionSource, clientContext: Record<string, unknown>) {
  const grade = Number(profile?.school_grade) || 0;
  const age = Number(profile?.age) || 0;
  const curriculum = cleanText(profile?.textbook_curriculum || 'Chương trình GDPT 2018', 160);
  const sourceTitle = [source?.province, source?.island, source?.topic].map(value => cleanText(value, 120)).filter(Boolean).join(' · ');
  const textbookQuote = cleanText(source?.textbook_quote || clientContext?.textbookQuote, 1200);
  const theory = cleanText(source?.theory || source?.explanation || clientContext?.theory, 3000);
  const question = cleanText(source?.question || clientContext?.question, 1200);
  const options = Array.isArray(clientContext?.options)
    ? clientContext.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${cleanText(option, 320)}`).join('\n')
    : '';

  const rules = `Bạn là Gia sư Premium của VieGeo. Trả lời bằng tiếng Việt rõ ràng, tích cực và đúng độ tuổi.
Hồ sơ học sinh: ${age ? `${age} tuổi` : 'chưa khai báo tuổi'}, ${grade ? `lớp ${grade}` : 'chưa khai báo lớp'}, chương trình ${curriculum}.
Chỉ dùng thông tin SGK/nguồn được cung cấp. Không bịa trích dẫn, số trang, kiến thức hoặc đáp án. Nếu nguồn chưa đủ, nói rõ phần nào cần học sinh cung cấp thêm.
Nguồn bài học: ${sourceTitle || 'chưa xác định'}.
Trích dẫn SGK: ${textbookQuote || 'chưa có trích dẫn SGK'}.
Nội dung lý thuyết đã lưu: ${theory || 'chưa có'}.
`;

  if (action === 'analysis') {
    return `${rules}
Nhiệm vụ: Phân tích điểm yếu từ kết quả sau và đề xuất lộ trình ôn tập bám sát SGK.
Kết quả gần đây:
${weaknessSummary(submissions)}
Trả lời theo đúng 3 mục: (1) Điểm cần củng cố, (2) Bài học nên làm tiếp theo, (3) Kế hoạch 20 phút hôm nay. Không quá 260 từ.`;
  }
  if (action === 'homework') {
    return `${rules}
Nhiệm vụ: Soạn 5 bài tập về nhà vừa sức nhưng có phân hóa, ưu tiên những điểm yếu sau:
${weaknessSummary(submissions)}
Mỗi bài gồm: câu hỏi, yêu cầu trả lời, đáp án ngắn và giải thích 1–2 câu. Không dùng câu hỏi trắc nghiệm giống hệt ngân hàng. Không quá 500 từ.`;
  }
  return `${rules}
Nhiệm vụ: Cho một HINT gần nhất với câu hỏi đang làm, giúp học sinh tự suy luận nhưng tuyệt đối không nêu đáp án hoặc nhắc lại nguyên văn một phương án.
Câu hỏi: ${question || 'chưa có nội dung'}
Các lựa chọn:
${options || 'chưa có'}
Chỉ trả lời 2–4 câu, tối đa 90 từ.`;
}

async function queryQuestionSource(questionId: string) {
  try {
    if (!questionId) return {};
    const query = `select=id,province,island,topic,question,theory,explanation,textbook_quote&id=eq.${encodeURIComponent(questionId)}&limit=1`;
    const rows = await selectRows<QuestionSource>('questions', query, true);
    return rows[0] || {};
  } catch (error) {
    console.warn('[VieGeo Premium AI] Không tải được nguồn câu hỏi:', error);
    return {};
  }
}

async function queryRelevantTextbookSource(submissions: Submission[]) {
  try {
    const recent = submissions.find(item => cleanText(item?.province, 80) && cleanText(item?.island, 80));
    if (!recent) return {};
    const province = encodeURIComponent(cleanText(recent.province, 80));
    const island = encodeURIComponent(cleanText(recent.island, 80));
    const query = `select=id,province,island,topic,question,theory,explanation,textbook_quote&province=eq.${province}&island=eq.${island}&limit=1`;
    const rows = await selectRows<QuestionSource>('questions', query, true);
    return rows[0] || {};
  } catch (error) {
    console.warn('[VieGeo Premium AI] Không tải được trích dẫn SGK phù hợp:', error);
    return {};
  }
}

function extractReply(data: any) {
  const direct = cleanText(data?.output_text ?? data?.outputText, 4000);
  if (direct) return direct;
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const content = Array.isArray(steps[index]?.content) ? steps[index].content : [];
    const text = content.map((item: any) => cleanText(item?.text, 1600)).filter(Boolean).join('\n');
    if (text) return cleanText(text, 4000);
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedSupabaseUser(request);
    if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập lại để dùng trợ lý Premium.' }, { status: 401 });
    if (isRateLimited(user.id)) return NextResponse.json({ error: 'Bạn đang gửi yêu cầu quá nhanh. Hãy thử lại sau ít phút.' }, { status: 429 });

    const body = await request.json();
    const action = validAction(body?.action);
    if (!action) return NextResponse.json({ error: 'Yêu cầu AI không hợp lệ.' }, { status: 400 });

    const profileRows = await selectRows<UserProfile>('users', `select=email,user_name,name,role,active_role,roles,account_status,age,school_grade,textbook_curriculum&email=eq.${encodeURIComponent(user.email)}&limit=1`, true);
    const profile = profileRows[0];
    if (!profile) return NextResponse.json({ error: 'Không tìm thấy hồ sơ người dùng.' }, { status: 404 });
    if (!isPremium(profile)) return NextResponse.json({ error: 'Tính năng này dành cho tài khoản Premium.' }, { status: 403 });

    const submissionRows = await selectRows<Submission>('submissions', `select=province,island,topic,correct_count,total_count,score,details,created_at&user_email=eq.${encodeURIComponent(user.email)}&order=created_at.desc&limit=60`, true)
      .catch((error) => {
        console.warn('[VieGeo Premium AI] Không tải lịch sử làm bài:', error);
        return [] as Submission[];
      });
    const requestedSource = await queryQuestionSource(cleanText(body?.questionId, 100));
    const source = requestedSource?.id ? requestedSource : await queryRelevantTextbookSource(submissionRows);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Trợ lý AI Premium chưa được cấu hình.' }, { status: 503 });

    const prompt = buildPremiumLearningPrompt(action, profile, submissionRows, source, body?.context && typeof body.context === 'object' ? body.context : {});
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey, 'Api-Revision': '2026-05-20' },
        body: JSON.stringify({ model: process.env.GEMINI_LEARNING_MODEL || process.env.GEMINI_SUPPORT_MODEL || DEFAULT_MODEL, input: prompt }),
        cache: 'no-store',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      console.error('[VieGeo Premium AI] Google API request failed', { status: response.status });
      return NextResponse.json({ error: 'Trợ lý AI chưa thể phản hồi lúc này. Vui lòng thử lại.' }, { status: 502 });
    }

    const reply = extractReply(await response.json());
    if (!reply) return NextResponse.json({ error: 'Trợ lý AI chưa tạo được phản hồi.' }, { status: 502 });
    return NextResponse.json({ action, reply, textbookQuote: cleanText(source?.textbook_quote, 1200) });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Trợ lý AI phản hồi quá lâu. Vui lòng thử lại.'
      : 'Trợ lý AI chưa thể xử lý yêu cầu. Vui lòng thử lại.';
    console.error('[VieGeo Premium AI] Request failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
