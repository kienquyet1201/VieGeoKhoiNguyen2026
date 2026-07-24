// ============================================================================
// VieGeo - map.js (Rendering Learning Path Multi-Tier)
// ============================================================================

const PROVINCE_THEORIES = Object.freeze({
    'ha-noi': `<div class="space-y-4 text-left">
  <h3 class="text-xl font-bold text-blue-600">1. Hà Nội là nơi như thế nào?</h3>
  <p>Hà Nội có tên chính thức là Thành phố Hà Nội và là Thủ đô của nước Cộng hòa xã hội chủ nghĩa Việt Nam. Đây là một trong năm thành phố trực thuộc Trung ương, đồng thời là trung tâm chính trị, hành chính, văn hóa, giáo dục và khoa học của cả nước.</p>
  <p>Quốc hội, Chính phủ, Phủ Chủ tịch cùng nhiều bộ, ngành trung ương đều đặt trụ sở tại Hà Nội. Thành phố cũng là nơi diễn ra nhiều sự kiện quan trọng như các kỳ họp Quốc hội, lễ kỷ niệm lớn của đất nước, hội nghị quốc tế và các hoạt động ngoại giao.</p>
  <p>Với lịch sử hơn 1.000 năm, Hà Nội từng mang tên Thăng Long. Trải qua nhiều giai đoạn lịch sử, thành phố vẫn giữ được nhiều công trình cổ, di tích lịch sử và giá trị văn hóa. Ngày nay, Hà Nội vừa là một đô thị hiện đại vừa là nơi lưu giữ những nét đẹp truyền thống của dân tộc.</p>

  <h3 class="text-xl font-bold text-blue-600">2. Hà Nội thuộc miền và vùng nào?</h3>
  <p>Hà Nội nằm ở miền Bắc của Việt Nam. Đây là khu vực có bốn mùa rõ rệt là xuân, hạ, thu và đông. Mỗi mùa đều mang một vẻ đẹp riêng và tạo nên những nét đặc trưng trong cuộc sống của người dân.</p>
  <p>Theo phân chia địa lí, Hà Nội thuộc vùng Đồng bằng sông Hồng. Vùng này nổi tiếng với đất đai màu mỡ, hệ thống sông ngòi dày đặc và dân cư đông đúc. Từ lâu, đây đã là một trong những cái nôi của nền văn minh lúa nước Việt Nam.</p>

  <h3 class="text-xl font-bold text-blue-600">3. Khí hậu Hà Nội có gì đặc trưng?</h3>
  <p>Hà Nội có khí hậu nhiệt đới gió mùa với bốn mùa khá rõ rệt: xuân, hạ, thu và đông. Mùa hè thường nóng, ẩm và có mưa nhiều; mùa đông se lạnh, đôi khi có mưa phùn. Mùa thu mát mẻ, trong lành là một nét đặc trưng được nhiều người yêu thích.</p>

  <h3 class="text-xl font-bold text-blue-600">4. Điều gì làm Hà Nội nổi bật?</h3>
  <p>Điều làm Hà Nội nổi bật là bề dày lịch sử hơn một nghìn năm và vai trò là Thủ đô của Việt Nam. Thành phố nổi tiếng với Hồ Gươm, Văn Miếu – Quốc Tử Giám, Hoàng thành Thăng Long, Lăng Chủ tịch Hồ Chí Minh và khu phố cổ.</p>
  <p>Ngoài các công trình lịch sử, Hà Nội còn được biết đến với những hàng cây xanh, nhiều hồ nước và nền ẩm thực phong phú như phở, bún chả hay cốm. Đây là những hình ảnh thường được nhắc đến khi giới thiệu về Thủ đô.</p>
</div>`
});

const mapContainer = document.getElementById('mapViewContainer');
const mapTitle = document.getElementById('mapTitle');
const btnMapBack = document.getElementById('btnMapBack');
let state = window.gameState || getGameState();

let currentView = 'regions'; // regions | provinces | lessons
let selectedRegion = null;
let selectedProvince = null;
let routeResizeObserver = null;
let islandTheoryModal = document.getElementById('islandTheoryModal');
let islandTheoryTitle = document.getElementById('islandTheoryTitle');
let islandTheoryMeta = document.getElementById('islandTheoryMeta');
let islandTheoryContent = document.getElementById('islandTheoryContent');
let btnStartIslandQuiz = document.getElementById('btnStartIslandQuiz');
let islandQuizModal = document.getElementById('islandQuizModal');
let islandQuizTitle = document.getElementById('islandQuizTitle');
let islandQuizMeta = document.getElementById('islandQuizMeta');
let islandQuizContent = document.getElementById('islandQuizContent');
let btnLaunchIslandQuiz = document.getElementById('btnLaunchIslandQuiz');
let activeIslandLearning = null;
let islandTheoryRequest = 0;
let islandQuizCurrentIndex = 0;
let islandQuizAnswers = {};
let islandQuizSubmitted = false;
let islandQuizSummaryPenaltyPending = false;
let islandQuizScrollLock = null;

function setIslandQuizScrollLocked(locked) {
    const root = document.documentElement;
    const page = document.body;
    if (!root || !page) return;
    if (locked) {
        if (islandQuizScrollLock) return;
        islandQuizScrollLock = {
            rootOverflow: root.style.overflow,
            pageOverflow: page.style.overflow,
            pagePaddingRight: page.style.paddingRight
        };
        const scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth);
        root.style.overflow = 'hidden';
        page.style.overflow = 'hidden';
        if (scrollbarWidth) page.style.paddingRight = `${scrollbarWidth}px`;
        return;
    }
    if (!islandQuizScrollLock) return;
    root.style.overflow = islandQuizScrollLock.rootOverflow;
    page.style.overflow = islandQuizScrollLock.pageOverflow;
    page.style.paddingRight = islandQuizScrollLock.pagePaddingRight;
    islandQuizScrollLock = null;
}

function hasTheoryModalDom() {
    return Boolean(islandTheoryModal && islandTheoryTitle && islandTheoryMeta && islandTheoryContent && btnStartIslandQuiz);
}

const ISLAND_MODAL_ROOT_IDS = Object.freeze(['theory-modal', 'islandTheoryModal', 'quiz-modal', 'islandQuizModal']);

function removeGhostIslandModals() {
    // IDs must be unique. Remove every stale root, not just the first match
    // returned by getElementById, before drawing a fresh modal under <body>.
    const selector = ISLAND_MODAL_ROOT_IDS.map((id) => `[id="${id}"]`).join(', ');
    document.querySelectorAll(selector).forEach((modal) => modal.remove());
    setIslandQuizScrollLocked(false);
    islandTheoryModal = null;
    islandQuizModal = null;
    islandTheoryTitle = null;
    islandTheoryMeta = null;
    islandTheoryContent = null;
    islandQuizTitle = null;
    islandQuizMeta = null;
    islandQuizContent = null;
    btnStartIslandQuiz = null;
    btnLaunchIslandQuiz = null;
}

function refreshIslandModalReferences() {
    islandTheoryModal = document.getElementById('theory-modal') || document.getElementById('islandTheoryModal');
    islandTheoryTitle = document.getElementById('islandTheoryTitle');
    islandTheoryMeta = document.getElementById('islandTheoryMeta');
    islandTheoryContent = document.getElementById('islandTheoryContent');
    btnStartIslandQuiz = document.getElementById('btnStartIslandQuiz');
    islandQuizModal = document.getElementById('islandQuizModal');
    islandQuizTitle = document.getElementById('islandQuizTitle');
    islandQuizMeta = document.getElementById('islandQuizMeta');
    islandQuizContent = document.getElementById('islandQuizContent');
    btnLaunchIslandQuiz = document.getElementById('btnLaunchIslandQuiz');
}

function bindIslandModalEvents() {
    if (islandTheoryModal && !islandTheoryModal.dataset.viegeoBound) {
        islandTheoryModal.dataset.viegeoBound = 'true';
        document.getElementById('btnCloseIslandTheory')?.addEventListener('click', closeIslandTheory);
        btnStartIslandQuiz?.addEventListener('click', openIslandQuizPreview);
        islandTheoryModal.addEventListener('click', (event) => {
            if (event.target === islandTheoryModal) closeIslandTheory();
        });
    }
    if (islandQuizModal && !islandQuizModal.dataset.viegeoBound) {
        islandQuizModal.dataset.viegeoBound = 'true';
        document.getElementById('btnCloseIslandQuiz')?.addEventListener('click', closeIslandQuiz);
        btnLaunchIslandQuiz?.addEventListener('click', beginIslandQuiz);
        islandQuizModal.addEventListener('click', (event) => {
            if (event.target === islandQuizModal) closeIslandQuiz();
        });
    }
}

function ensureIslandModalDom() {
    if (!document.body) return false;
    const theoryRoots = document.querySelectorAll('[id="theory-modal"], [id="islandTheoryModal"]');
    const activeTheoryRoot = theoryRoots.length === 1 ? theoryRoots[0] : null;
    if (!activeTheoryRoot || activeTheoryRoot.parentElement !== document.body) {
        rebuildTheoryModalWithInlineCss(PROVINCE_THEORIES['ha-noi']);
        return hasTheoryModalDom();
    }
    refreshIslandModalReferences();
    bindIslandModalEvents();
    return hasTheoryModalDom();
}

function forceShowIslandModal(modal) {
    if (!modal) return false;
    modal.hidden = false;
    modal.removeAttribute('hidden');
    modal.classList.remove('hidden', 'opacity-0', 'invisible', 'pointer-events-none');
    modal.classList.add('flex');
    modal.style.setProperty('position', 'fixed', 'important');
    modal.style.setProperty('top', '0', 'important');
    modal.style.setProperty('right', '0', 'important');
    modal.style.setProperty('bottom', '0', 'important');
    modal.style.setProperty('left', '0', 'important');
    modal.style.setProperty('z-index', '2147483647', 'important');
    modal.style.setProperty('background', 'rgba(0, 0, 0, 0.85)', 'important');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    modal.style.setProperty('width', '100vw', 'important');
    modal.style.setProperty('height', '100vh', 'important');
    if (modal.id === 'islandQuizModal') setIslandQuizScrollLocked(true);
    return true;
}

function forceHideIslandModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    modal.style.setProperty('display', 'none', 'important');
    if (modal.id === 'islandQuizModal') setIslandQuizScrollLocked(false);
}

function rebuildTheoryModalWithInlineCss(theoryHtml) {
    if (!document.body) return null;
    removeGhostIslandModals();
    document.body.insertAdjacentHTML('beforeend', `
        <div id="theory-modal" role="dialog" aria-modal="true" aria-labelledby="islandTheoryTitle" style="position:fixed !important;inset:0 !important;z-index:2147483647 !important;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);overflow:auto;box-sizing:border-box;">
            <section style="position:relative;width:min(760px,100%);max-height:80vh;overflow-y:auto;box-sizing:border-box;border:1px solid rgba(96,165,250,.48);border-radius:24px;padding:clamp(24px,5vw,42px);background:#102238;color:#f8fafc;box-shadow:0 30px 80px rgba(0,0,0,.62);">
                <button id="btnCloseIslandTheory" type="button" aria-label="Đóng lý thuyết" style="position:absolute;top:16px;right:16px;width:40px;height:40px;border:0;border-radius:50%;background:rgba(148,163,184,.2);color:#fff;font-size:20px;cursor:pointer;">×</button>
                <p style="margin:0 0 8px;color:#7dd3fc;font-weight:800;">HÀNH TRANG TRƯỚC THỬ THÁCH</p>
                <h2 id="islandTheoryTitle" style="margin:0;padding-right:44px;font-size:clamp(1.5rem,3vw,2rem);line-height:1.25;">Lý thuyết trước khi thực chiến</h2>
                <p id="islandTheoryMeta" style="margin:10px 0 20px;color:#94a3b8;">Hà Nội · Kiến thức nền tảng</p>
                <article id="islandTheoryContent" aria-live="polite" style="color:#dbeafe;line-height:1.75;border:1px solid rgba(148,163,184,.2);border-radius:16px;padding:20px;background:rgba(2,12,27,.45);">${theoryHtml || ''}</article>
                <button id="btnStartIslandQuiz" type="button" style="display:flex;width:100%;min-height:54px;align-items:center;justify-content:center;gap:9px;margin-top:22px;border:0;border-radius:14px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:1rem;font-weight:800;cursor:pointer;">Đã hiểu &amp; Bắt đầu làm bài</button>
            </section>
        </div>`);
    // Bind directly to the elements just inserted. Querying from the modal root
    // guarantees that a stale element with a duplicated ID cannot receive clicks.
    const insertedTheoryModal = document.getElementById('theory-modal');
    const theoryCloseButton = insertedTheoryModal?.querySelector('#btnCloseIslandTheory');
    const theoryStartButton = insertedTheoryModal?.querySelector('#btnStartIslandQuiz');
    if (insertedTheoryModal) {
        insertedTheoryModal.dataset.viegeoBound = 'true';
        insertedTheoryModal.addEventListener('click', (event) => {
            if (event.target !== insertedTheoryModal) return;
            activeIslandLearning = null;
            insertedTheoryModal.remove();
            refreshIslandModalReferences();
        });
    }
    if (theoryCloseButton) {
        theoryCloseButton.addEventListener('click', () => {
            activeIslandLearning = null;
            insertedTheoryModal?.remove();
            refreshIslandModalReferences();
        });
    }
    if (theoryStartButton) {
        theoryStartButton.addEventListener('click', async () => {
            if (theoryStartButton.disabled || !activeIslandLearning?.questions?.length) return;
            insertedTheoryModal?.remove();
            refreshIslandModalReferences();
            await openIslandQuizPreview();
        });
    }
    refreshIslandModalReferences();
    bindIslandModalEvents();
    return islandTheoryModal;
}

function rebuildIslandQuizModalWithInlineCss() {
    if (!document.body) return null;
    removeGhostIslandModals();
    document.body.insertAdjacentHTML('beforeend', `
        <div id="islandQuizModal" role="dialog" aria-modal="true" aria-labelledby="islandQuizTitle" style="position:fixed !important;inset:0 !important;z-index:2147483647 !important;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);overflow:auto;box-sizing:border-box;">
            <section style="position:relative;width:min(760px,100%);max-height:80vh;overflow-y:auto;box-sizing:border-box;border:1px solid rgba(96,165,250,.48);border-radius:24px;padding:clamp(24px,5vw,42px);background:#102238;color:#f8fafc;box-shadow:0 30px 80px rgba(0,0,0,.62);">
                <button id="btnCloseIslandQuiz" type="button" aria-label="Đóng bảng trắc nghiệm" style="position:absolute;top:16px;right:16px;width:40px;height:40px;border:0;border-radius:50%;background:rgba(148,163,184,.2);color:#fff;font-size:20px;cursor:pointer;">×</button>
                <p style="margin:0 0 8px;color:#7dd3fc;font-weight:800;">TRẮC NGHIỆM ĐẢO NHỎ</p>
                <h2 id="islandQuizTitle" style="margin:0;padding-right:44px;font-size:clamp(1.5rem,3vw,2rem);line-height:1.25;">Câu hỏi đã sẵn sàng</h2>
                <p id="islandQuizMeta" style="margin:10px 0 20px;color:#94a3b8;"></p>
                <section id="islandQuizContent" aria-live="polite" style="color:#dbeafe;line-height:1.75;border:1px solid rgba(148,163,184,.2);border-radius:16px;padding:20px;background:rgba(2,12,27,.45);"></section>
                <button id="btnLaunchIslandQuiz" type="button" style="display:flex;width:100%;min-height:54px;align-items:center;justify-content:center;gap:9px;margin-top:22px;border:0;border-radius:14px;background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;font-size:1rem;font-weight:800;cursor:pointer;">Vào bài trắc nghiệm</button>
            </section>
        </div>`);
    const insertedQuizModal = document.getElementById('islandQuizModal');
    const quizCloseButton = insertedQuizModal?.querySelector('#btnCloseIslandQuiz');
    const quizDialog = insertedQuizModal?.querySelector('section');
    if (insertedQuizModal) {
        insertedQuizModal.style.setProperty('padding', '0', 'important');
        insertedQuizModal.style.setProperty('overflow', 'hidden', 'important');
    }
    if (quizDialog) {
        quizDialog.style.cssText = 'position:relative;display:flex;width:100vw;height:100dvh;max-width:none;max-height:none;min-height:0;flex-direction:column;overflow:hidden;box-sizing:border-box;border:0;border-radius:0;padding:clamp(18px,3vw,34px);background:#102238;color:#f8fafc;box-shadow:none;';
    }
    if (insertedQuizModal) {
        insertedQuizModal.dataset.viegeoBound = 'true';
        insertedQuizModal.addEventListener('click', (event) => {
            if (event.target !== insertedQuizModal) return;
            activeIslandLearning = null;
            setIslandQuizScrollLocked(false);
            insertedQuizModal.remove();
            refreshIslandModalReferences();
        });
    }
    if (quizCloseButton) {
        quizCloseButton.addEventListener('click', () => {
            activeIslandLearning = null;
            setIslandQuizScrollLocked(false);
            insertedQuizModal?.remove();
            refreshIslandModalReferences();
        });
    }
    refreshIslandModalReferences();
    bindIslandModalEvents();
    return islandQuizModal;
}

function fallbackTheoryFor(lesson) {
    return `Trước khi làm bài, hãy nắm các ý chính của ${lesson.title}.\n\nQuan sát đặc điểm địa lí, ghi nhớ từ khóa quan trọng và liên hệ kiến thức với địa phương đang khám phá. Sau đó, bạn sẽ trả lời 5 câu hỏi để kiểm tra mức độ hiểu bài.`;
}

function normalizeProvinceSlug(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function provinceSlugFor(lesson) {
    const fromId = /^path-(.+)-(?:d(?:easy|medium|hard)|g(?:5|9|12))-i\d+$/i.exec(String(lesson?.id || ''));
    return normalizeProvinceSlug(lesson?.provinceSlug || fromId?.[1] || lesson?.province || selectedProvince?.name);
}

function theoryHtmlFor(lesson) {
    const provinceSlug = provinceSlugFor(lesson);
    if (PROVINCE_THEORIES[provinceSlug]) return PROVINCE_THEORIES[provinceSlug];

    return `<div class="text-left"><h3>${lesson?.title || 'Đảo tri thức'}</h3><p>${fallbackTheoryFor(lesson || {})}</p></div>`;
}

function theoryHtmlFromLoadedContent(lesson, loadedContent) {
    const fallback = theoryHtmlFor(lesson);
    const rawTheory = String(
        loadedContent?.theory
        || loadedContent?.questions?.map((question) => question?.theory || question?.theoryContent || question?.lyThuyet || '').find(Boolean)
        || ''
    ).trim();
    if (!rawTheory) return fallback;

    // Admin text imports are plain text. Preserve paragraphs while still
    // accepting trusted rich HTML that was deliberately entered by an admin.
    if (/<[a-z][\s\S]*>/i.test(rawTheory)) return rawTheory;
    const paragraphs = rawTheory.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
    return `<div style="text-align:left">${paragraphs.map((paragraph) => `<p style="margin:0 0 14px">${escapeQuizHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('')}</div>`;
}

function closeIslandTheory() {
    if (islandTheoryModal) {
        forceHideIslandModal(islandTheoryModal);
    }
    activeIslandLearning = null;
}

function closeIslandQuiz() {
    if (!islandQuizModal) return;
    forceHideIslandModal(islandQuizModal);
    setIslandQuizScrollLocked(false);
}

function escapeQuizHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[character]));
}

function activeIslandQuizQuestions() {
    return Array.isArray(activeIslandLearning?.questions) ? activeIslandLearning.questions : [];
}

function islandQuizWarning(message) {
    if (window.VieGeoUI?.warning) {
        window.VieGeoUI.warning(message);
        return;
    }
    window.alert(message);
}

function islandQuizCorrectAnswerIndex(question) {
    const rawAnswer = question?.correctAnswer ?? question?.answerIndex ?? question?.answer;
    const normalized = String(rawAnswer ?? '').trim();
    const letterIndex = 'ABCD'.indexOf(normalized.toUpperCase());
    if (letterIndex >= 0) return letterIndex;
    const numericIndex = Number(normalized);
    return Number.isInteger(numericIndex) ? numericIndex : -1;
}

function isPremiumIslandLearner() {
    const playerState = window.gameState || state || {};
    if (String(playerState.accountStatus || '').trim().toLowerCase() === 'premium') return true;
    try {
        const session = JSON.parse(localStorage.getItem('lm_session') || '{}');
        return String(session.accountStatus || '').trim().toLowerCase() === 'premium';
    } catch (error) {
        return false;
    }
}

function showIslandSummaryPenaltyNotice() {
    const message = 'Bạn chưa đạt 5/5! Đã bị trừ 1 sinh mệnh 💔';
    if (window.Swal && typeof window.Swal.fire === 'function') {
        window.Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            background: '#13253a',
            color: '#f8fafc'
        });
        return;
    }
    if (window.VieGeoUI?.warning) window.VieGeoUI.warning(message);
}

async function endIslandQuizForGameOver() {
    const modal = islandQuizModal;
    modal?.remove();
    refreshIslandModalReferences();
    activeIslandLearning = null;
    state = window.gameState || state;
    updateStatsUI();

    const options = {
        title: 'Hết sinh mệnh!',
        text: 'Bạn đã hết trái tim vì chưa đạt 5/5. Hãy hồi phục trái tim rồi làm lại bài từ đầu.',
        icon: 'error',
        confirmButtonText: 'Làm lại sau',
        confirmButtonColor: '#0284c7',
        background: '#13253a',
        color: '#f8fafc',
        heightAuto: false
    };
    if (window.Swal && typeof window.Swal.fire === 'function') await window.Swal.fire(options);
    else if (window.VieGeoUI?.error) await window.VieGeoUI.error(options.text, options);
    renderMap();
}

async function applyIslandSummaryPenalty(correctAnswers) {
    const isPremium = isPremiumIslandLearner();
    if (isPremium || correctAnswers >= 5) return { continueQuiz: true, isPremium };

    const penalty = typeof window.deductHeartForIslandSummary === 'function'
        ? await window.deductHeartForIslandSummary()
        : { applied: false, gameOver: false };

    if (penalty.applied) {
        state = window.gameState || state;
        updateStatsUI();
        showIslandSummaryPenaltyNotice();
    }
    if (penalty.gameOver) {
        await endIslandQuizForGameOver();
        return { continueQuiz: false, isPremium: false };
    }
    return { continueQuiz: Boolean(penalty.applied || penalty.protected), isPremium: false };
}

function islandQuizStars(correctAnswers, questionCount) {
    if (!questionCount || !correctAnswers) return 0;
    if (questionCount >= 5) {
        if (correctAnswers >= 5) return 3;
        if (correctAnswers >= 3) return 2;
        return 1;
    }
    const ratio = correctAnswers / questionCount;
    if (ratio === 1) return 3;
    if (ratio >= 0.6) return 2;
    return 1;
}

function persistIslandQuizResult(correctAnswers, questionCount) {
    const lesson = activeIslandLearning?.lesson;
    if (!lesson || islandQuizSubmitted) return;
    const stars = islandQuizStars(correctAnswers, questionCount);
    const reward = lesson.reward || {};
    if (!state.lessonResults || typeof state.lessonResults !== 'object') state.lessonResults = {};
    if (!Array.isArray(state.completedNodes)) state.completedNodes = [];
    const previousResult = state.lessonResults[lesson.id] || {};
    state.lessonResults[lesson.id] = {
        ...previousResult,
        stars: Math.max(Number(previousResult.stars) || 0, stars),
        bestCorrectAnswers: Math.max(Number(previousResult.bestCorrectAnswers) || 0, correctAnswers),
        lastCorrectAnswers: correctAnswers,
        questionCount,
        color: stars === 3 ? 'green' : stars === 2 ? 'yellow' : 'red',
        updatedAt: Date.now()
    };
    if (!state.completedNodes.includes(lesson.id)) {
        state.completedNodes.push(lesson.id);
        state.xp = (Number(state.xp) || 0) + (Number(reward.xp) || 15);
        state.gems = (Number(state.gems) || 0) + (Number(reward.gems) || 10);
    }
    if (typeof recordLessonHistory === 'function') {
        recordLessonHistory(state, {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            correctAnswers,
            questionCount,
            completedAt: Date.now()
        });
    }
    if (typeof recordStudyActivity === 'function') recordStudyActivity(state);
    if (typeof saveGameState === 'function') saveGameState(state);
    if (typeof updateHeaderStats === 'function') updateHeaderStats();
    islandQuizSubmitted = true;
}

function renderIslandQuizWrongAnswerReview(questions) {
    const wrongAnswers = questions.map((question, index) => {
        const correctIndex = islandQuizCorrectAnswerIndex(question);
        const selectedIndex = islandQuizAnswers[index];
        return { question, index, correctIndex, selectedIndex };
    }).filter(({ correctIndex, selectedIndex }) => selectedIndex !== correctIndex);

    if (!wrongAnswers.length) {
        return '<p style="margin:0;color:#86efac;font-weight:700"><i class="fa-solid fa-circle-check"></i> Xuất sắc! Bạn không có câu trả lời sai.</p>';
    }

    const cards = wrongAnswers.map(({ question, index, correctIndex, selectedIndex }) => {
        const options = Array.isArray(question.options) ? question.options : [];
        const selectedText = Number.isInteger(selectedIndex) ? options[selectedIndex] : 'Chưa chọn đáp án';
        const correctText = options[correctIndex] || 'Chưa có đáp án đúng';
        const explanation = String(question.explanation || '').trim();
        return `<article style="padding:15px;border:1px solid rgba(248,113,113,.35);border-radius:14px;background:rgba(127,29,29,.16);text-align:left">
            <strong style="display:block;color:#fecaca;margin-bottom:7px">Câu ${index + 1}: ${escapeQuizHtml(question.question || question.questionText)}</strong>
            <p style="margin:5px 0;color:#fecaca">Bạn chọn: ${escapeQuizHtml(selectedText || 'Chưa chọn đáp án')}</p>
            <p style="margin:5px 0;color:#bbf7d0">Đáp án đúng: ${escapeQuizHtml(correctText)}</p>
            ${explanation ? `<p style="margin:9px 0 0;color:#cbd5e1"><strong>Giải thích:</strong> ${escapeQuizHtml(explanation)}</p>` : ''}
        </article>`;
    }).join('');

    return `<section style="display:grid;gap:12px;width:100%;margin-top:18px;text-align:left">
        <div style="padding:14px 16px;border:1px solid rgba(250,204,21,.32);border-radius:14px;background:rgba(250,204,21,.1);color:#fef3c7">
            <strong><i class="fa-solid fa-book-open"></i> Hãy đọc lại lý thuyết</strong>
            <p style="margin:5px 0 0">Bạn còn ${wrongAnswers.length} câu chưa đúng. Ôn lại phần lý thuyết của đảo trước khi làm lại để ghi nhớ tốt hơn.</p>
        </div>
        ${cards}
    </section>`;
}

async function renderIslandQuizResult() {
    const questions = activeIslandQuizQuestions();
    const correctAnswers = questions.reduce((total, question, index) => total + (islandQuizAnswers[index] === islandQuizCorrectAnswerIndex(question) ? 1 : 0), 0);
    const stars = islandQuizStars(correctAnswers, questions.length);

    if (!islandQuizSubmitted) {
        if (islandQuizSummaryPenaltyPending) return;
        islandQuizSummaryPenaltyPending = true;
        try {
            const summary = await applyIslandSummaryPenalty(correctAnswers);
            if (!summary.continueQuiz) return;
            persistIslandQuizResult(correctAnswers, questions.length);
        } finally {
            islandQuizSummaryPenaltyPending = false;
        }
    }

    const header = document.getElementById('islandQuizStepHeader');
    const body = document.getElementById('islandQuizStepBody');
    const backButton = document.getElementById('islandQuizStepBack');
    const nextButton = document.getElementById('islandQuizStepNext');
    if (!header || !body || !backButton || !nextButton) return;

    header.textContent = 'Kết quả bài trắc nghiệm';
    body.innerHTML = `<div style="display: grid; min-height: 260px; place-items: center; text-align: center; gap: 14px;">
        <div style="font-size: 2rem; letter-spacing: 6px;">${stars ? '⭐'.repeat(stars) : '☆'}</div>
        <h3 style="margin: 0; color: #f8fafc; font-size: 1.5rem;">Bạn trả lời đúng ${correctAnswers}/${questions.length} câu</h3>
        <p style="margin: 0; color: #cbd5e1;">Số sao cao nhất của đảo đã được lưu vào hành trình học tập.</p>
        ${renderIslandQuizWrongAnswerReview(questions)}
    </div>`;
    backButton.style.visibility = 'hidden';
    nextButton.textContent = 'Hoàn tất';
}

function renderIslandQuizQuestion(index) {
    const questions = activeIslandQuizQuestions();
    if (!questions.length || islandQuizSubmitted) {
        if (islandQuizSubmitted) void renderIslandQuizResult();
        return;
    }
    islandQuizCurrentIndex = Math.max(0, Math.min(index, questions.length - 1));
    const question = questions[islandQuizCurrentIndex];
    const header = document.getElementById('islandQuizStepHeader');
    const body = document.getElementById('islandQuizStepBody');
    const backButton = document.getElementById('islandQuizStepBack');
    const nextButton = document.getElementById('islandQuizStepNext');
    if (!header || !body || !backButton || !nextButton) return;

    header.textContent = `Câu ${islandQuizCurrentIndex + 1} / ${questions.length}`;
    const selectedAnswer = islandQuizAnswers[islandQuizCurrentIndex];
    const options = Array.isArray(question.options) ? question.options : [];
    body.innerHTML = `<h3 style="margin: 0 0 22px; color: #f8fafc; font-size: clamp(1.15rem, 2.5vw, 1.45rem); line-height: 1.5;">${escapeQuizHtml(question.question || question.questionText)}</h3>
        <div id="islandQuizOptions" style="display: grid; gap: 12px;"></div>`;
    const optionsContainer = document.getElementById('islandQuizOptions');
    options.forEach((option, optionIndex) => {
        const isSelected = selectedAnswer === optionIndex;
        const optionButton = document.createElement('button');
        optionButton.type = 'button';
        optionButton.dataset.optionIndex = String(optionIndex);
        optionButton.setAttribute('aria-pressed', String(isSelected));
        optionButton.style.cssText = `width: 100%; border: 2px solid ${isSelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)'}; border-radius: 14px; padding: 15px 16px; background: ${isSelected ? 'rgba(14, 165, 233, 0.22)' : 'rgba(15, 23, 42, 0.5)'}; color: #f8fafc; text-align: left; font: inherit; cursor: pointer; transition: .16s ease;`;
        optionButton.innerHTML = `<strong style="display: inline-grid; width: 28px; height: 28px; place-items: center; margin-right: 10px; border-radius: 50%; background: ${isSelected ? '#0284c7' : 'rgba(148, 163, 184, 0.2)'};">${String.fromCharCode(65 + optionIndex)}</strong>${escapeQuizHtml(option)}`;
        optionButton.addEventListener('click', () => {
            islandQuizAnswers[islandQuizCurrentIndex] = optionIndex;
            renderIslandQuizQuestion(islandQuizCurrentIndex);
        });
        optionsContainer?.appendChild(optionButton);
    });
    backButton.disabled = islandQuizCurrentIndex === 0;
    backButton.style.visibility = islandQuizCurrentIndex === 0 ? 'hidden' : 'visible';
    nextButton.textContent = islandQuizCurrentIndex === questions.length - 1 ? 'Nộp bài' : 'Tiếp tục';
}

function mountIslandQuizStepper() {
    if (!islandQuizContent) return false;
    islandQuizContent.style.cssText = 'display:flex;flex:1 1 auto;min-height:0;padding:0;overflow:hidden;background:#102238;';
    islandQuizContent.innerHTML = `<section style="display:flex;width:100%;min-height:0;flex:1 1 auto;flex-direction:column;overflow:hidden;">
        <header id="islandQuizStepHeader" style="padding: 16px 20px; border-bottom: 1px solid rgba(148, 163, 184, 0.22); color: #7dd3fc; font-weight: 800;">Câu 1</header>
        <main id="islandQuizStepBody" style="flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:24px 20px;"></main>
        <footer style="display: flex; justify-content: space-between; gap: 12px; padding: 16px 20px; border-top: 1px solid rgba(148, 163, 184, 0.22);">
            <button id="islandQuizStepBack" type="button" style="min-width: 112px; border: 1px solid rgba(148, 163, 184, 0.45); border-radius: 12px; padding: 12px 16px; background: transparent; color: #e2e8f0; font: inherit; font-weight: 700; cursor: pointer;">Quay lại</button>
            <button id="islandQuizStepNext" type="button" style="min-width: 130px; border: 0; border-radius: 12px; padding: 12px 16px; background: #0284c7; color: #fff; font: inherit; font-weight: 800; cursor: pointer;">Tiếp tục</button>
        </footer>
    </section>`;
    document.getElementById('islandQuizStepBack')?.addEventListener('click', () => {
        if (!islandQuizSubmitted && islandQuizCurrentIndex > 0) renderIslandQuizQuestion(islandQuizCurrentIndex - 1);
    });
    document.getElementById('islandQuizStepNext')?.addEventListener('click', async () => {
        if (islandQuizSubmitted) {
            closeIslandQuiz();
            activeIslandLearning = null;
            renderMap();
            return;
        }
        if (!Number.isInteger(islandQuizAnswers[islandQuizCurrentIndex])) {
            islandQuizWarning('Hãy chọn một đáp án trước khi tiếp tục.');
            return;
        }
        if (islandQuizCurrentIndex === activeIslandQuizQuestions().length - 1) {
            await renderIslandQuizResult();
            return;
        }
        renderIslandQuizQuestion(islandQuizCurrentIndex + 1);
    });
    return true;
}

async function openIslandQuizPreview() {
    if (!activeIslandLearning?.lesson || !Array.isArray(activeIslandLearning.questions) || !activeIslandLearning.questions.length) {
        if (window.VieGeoUI?.warning) window.VieGeoUI.warning('Hiện chưa có câu hỏi để bắt đầu bài học này.');
        return;
    }

    // A quiz always starts on a brand-new root so no duplicate IDs or stale
    // hidden styles can capture the event or hide the current attempt.
    const quizModal = rebuildIslandQuizModalWithInlineCss();
    if (!quizModal || !islandQuizContent || !islandQuizTitle || !islandQuizMeta) {
        console.error('Không thể tạo Modal trắc nghiệm trong DOM.');
        return;
    }
    islandQuizCurrentIndex = 0;
    islandQuizAnswers = {};
    islandQuizSubmitted = false;
    islandQuizSummaryPenaltyPending = false;
    islandQuizTitle.textContent = `Trắc nghiệm: ${activeIslandLearning.lesson.title || 'Đảo tri thức'}`;
    islandQuizMeta.textContent = `${activeIslandLearning.lesson.province || selectedProvince?.name || 'Việt Nam'} · ${activeIslandLearning.questions.length} câu hỏi từ Firebase`;
    if (btnLaunchIslandQuiz) btnLaunchIslandQuiz.style.display = 'none';
    if (!mountIslandQuizStepper()) return;
    forceShowIslandModal(quizModal);
    renderIslandQuizQuestion(0);
}

function showIslandLoadingFeedback(clickedIsland) {
    const title = clickedIsland?.dataset.lessonTitle || 'Đảo tri thức';
    const province = clickedIsland?.dataset.province || selectedProvince?.name || 'Việt Nam';
    const difficulty = clickedIsland?.dataset.difficulty || 'easy';

    if (!ensureIslandModalDom()) {
        console.error('Không thể tạo cấu trúc Modal lý thuyết trong DOM.');
        window.alert('Đã nhận click! Đang kết nối Firebase...');
        return false;
    }

    forceShowIslandModal(islandTheoryModal);
    islandTheoryTitle.textContent = 'Lý thuyết trước khi thực chiến';
    islandTheoryMeta.textContent = `${title} · ${province} · ${difficulty} · 5 câu hỏi`;
    islandTheoryContent.classList.add('is-loading');
    islandTheoryContent.setAttribute('aria-busy', 'true');
    islandTheoryContent.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Đang tải dữ liệu...';
    btnStartIslandQuiz.disabled = true;
    return true;
}

function findRenderedIslandLesson(lessonId) {
    if (!lessonId) return null;
    const dynamicLesson = window.VieGeoLearningPath?.findLesson?.(lessonId);
    if (dynamicLesson) return dynamicLesson;
    return selectedProvince?.lessons?.find((lesson) => lesson.id === lessonId) || null;
}

async function handleDelegatedIslandClick(event) {
    const clickedIsland = event.target.closest('.island');
    if (!clickedIsland || !mapContainer?.contains(clickedIsland)) return;

    if (!showIslandLoadingFeedback(clickedIsland)) return;

    const lesson = findRenderedIslandLesson(clickedIsland.dataset.lessonId);
    const isUnlocked = clickedIsland.dataset.unlocked === 'true';
    const nodeKind = clickedIsland.dataset.nodeKind || 'small';

    if (!lesson) {
        console.error('Không tìm thấy dữ liệu bài học cho đảo:', clickedIsland.dataset.lessonId);
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.textContent = 'Không tìm thấy dữ liệu bài học. Vui lòng tải lại trang và thử lại.';
        return;
    }

    if (!isUnlocked) {
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.textContent = 'Đảo này chưa mở khóa. Hãy hoàn thành đảo ngay trước đó để tiếp tục hành trình.';
        return;
    }

    if (nodeKind === 'small') {
        // openIslandTheory keeps the visible loading modal in place, then fetches
        // Firestore inside its own try/catch without blocking the click feedback.
        await openIslandTheory(lesson);
        return;
    }

    try {
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.textContent = 'Đang chuẩn bị bài kiểm tra...';
        if (typeof window.consumeHeart === 'function' && !await window.consumeHeart()) {
            closeIslandTheory();
            return;
        }
        localStorage.setItem('VieGeo_current_lesson', lesson.id);
        localStorage.setItem('VieGeo_mode', 'normal');
        window.location.href = '/lesson';
    } catch (error) {
        console.error('Không thể mở bài kiểm tra của đảo:', error);
        islandTheoryContent.textContent = 'Chưa thể mở bài học. Vui lòng thử lại.';
    }
}

async function openIslandTheory(lesson) {
    if (!lesson || !ensureIslandModalDom()) {
        if (!hasTheoryModalDom()) console.error('Không thể mở lý thuyết vì thiếu phần tử DOM cần thiết.');
        return;
    }
    const requestId = ++islandTheoryRequest;
    const theoryHtml = theoryHtmlFor(lesson);
    activeIslandLearning = { lesson, theory: theoryHtml, questions: [] };
    forceShowIslandModal(islandTheoryModal);
    islandTheoryTitle.textContent = 'Lý thuyết trước khi thực chiến';
    islandTheoryMeta.textContent = `${lesson.title || 'Đảo tri thức'} · ${lesson.province || selectedProvince?.name || 'Việt Nam'} · ${lesson.difficulty || 'easy'} · Đang chuẩn bị 5 câu hỏi`;
    islandTheoryContent.classList.remove('is-loading');
    islandTheoryContent.setAttribute('aria-busy', 'true');
    islandTheoryContent.innerHTML = theoryHtml;
    btnStartIslandQuiz.disabled = true;

    try {
        const loadIslandContent = window.VieGeoLearningPath?.loadIslandContent;
        if (typeof loadIslandContent !== 'function') throw new Error('Không thể khởi tạo trình tải câu hỏi.');
        const loaded = await loadIslandContent(lesson);
        if (requestId !== islandTheoryRequest || !ensureIslandModalDom() || islandTheoryModal.hidden) return;
        activeIslandLearning = {
            lesson,
            theory: theoryHtmlFromLoadedContent(lesson, loaded),
            questions: Array.isArray(loaded?.questions) ? loaded.questions.slice(0, 5) : []
        };
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.innerHTML = activeIslandLearning.theory;
        const questionCount = activeIslandLearning.questions.length;
        islandTheoryMeta.textContent = `${lesson.title || 'Đảo tri thức'} · ${lesson.province || selectedProvince?.name || 'Việt Nam'} · ${questionCount} câu hỏi sẵn sàng`;
        if (!questionCount) {
            const notice = loaded?.status === 'network-error'
                ? 'Lỗi đường truyền hoặc máy chủ Firebase. Vui lòng kiểm tra lại mạng!'
                : 'Hiện chưa có câu hỏi nào cho khu vực này, vui lòng quay lại sau!';
            islandTheoryContent.insertAdjacentHTML('beforeend', `<p><strong>Thông báo:</strong> ${notice}</p>`);
        }
    } catch (error) {
        const message = error?.message || 'Không thể kết nối Firestore.';
        console.error('Lỗi Firebase khi tải nội dung Đảo nhỏ:', message, error);
        if (requestId !== islandTheoryRequest) return;
        activeIslandLearning = { lesson, theory: theoryHtmlFor(lesson), questions: [] };
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.innerHTML = `${activeIslandLearning.theory}<p><strong>Lỗi đường truyền hoặc máy chủ Firebase.</strong> Vui lòng kiểm tra lại mạng!</p>`;
        if (window.VieGeoUI?.warning) window.VieGeoUI.warning('Lỗi đường truyền hoặc máy chủ Firebase. Vui lòng kiểm tra lại mạng!');
    } finally {
        if (requestId === islandTheoryRequest && islandTheoryModal && !islandTheoryModal.hidden) {
            btnStartIslandQuiz.disabled = !activeIslandLearning?.questions?.length;
        }
    }
}

async function beginIslandQuiz() {
    if (!activeIslandLearning?.lesson) return;
    if (!Array.isArray(activeIslandLearning.questions) || !activeIslandLearning.questions.length) {
        if (typeof VieGeoUI !== 'undefined') VieGeoUI.warning('Hiện chưa có câu hỏi để bắt đầu bài học này.');
        return;
    }
    const launchButton = btnLaunchIslandQuiz || btnStartIslandQuiz;
    if (launchButton?.disabled) return;
    if (launchButton) launchButton.disabled = true;
    try {
        localStorage.setItem('VieGeo_current_lesson', activeIslandLearning.lesson.id);
        localStorage.setItem('VieGeo_mode', 'normal');
        localStorage.setItem('VieGeo_island_learning', JSON.stringify({
            lessonId: activeIslandLearning.lesson.id,
            theory: activeIslandLearning.theory,
            questions: activeIslandLearning.questions,
            createdAt: Date.now()
        }));
        closeIslandQuiz();
        closeIslandTheory();
        window.location.href = '/lesson';
    } catch (error) {
        console.error('Không thể bắt đầu bài học Đảo nhỏ:', error);
        if (typeof VieGeoUI !== 'undefined') VieGeoUI.error('Chưa thể bắt đầu bài học. Vui lòng thử lại.');
    } finally {
        if (islandQuizModal && !islandQuizModal.hidden && launchButton) launchButton.disabled = false;
        if (islandTheoryModal && !islandTheoryModal.hidden && btnStartIslandQuiz) btnStartIslandQuiz.disabled = false;
    }
}

ensureIslandModalDom();
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (islandQuizModal && !islandQuizModal.hidden) closeIslandQuiz();
    else if (islandTheoryModal && !islandTheoryModal.hidden) closeIslandTheory();
});

// Islands are rendered again whenever the learner changes region/province.
// Event delegation keeps their click flow intact after every dynamic render.
mapContainer?.addEventListener('click', handleDelegatedIslandClick);

// Update Stats UI
function updateStatsUI() {
    if (document.getElementById('statHearts')) {
        document.getElementById('statHearts').textContent = isPremiumIslandLearner() ? '∞' : state.hearts;
    }
    if (document.getElementById('statStreak')) document.getElementById('statStreak').textContent = state.streak;
    if (document.getElementById('statGems')) document.getElementById('statGems').textContent = state.gems;
    if (document.getElementById('statXp')) document.getElementById('statXp').textContent = state.xp;
}

// Generate the Map based on currentView
function renderMap() {
    mapContainer.innerHTML = '';
    mapContainer.classList.remove('map-learning-route');
    routeResizeObserver?.disconnect();
    routeResizeObserver = null;
    
    if (currentView === 'regions') {
        mapTitle.textContent = "Khám Phá Việt Nam";
        btnMapBack.style.display = 'none';
        renderRegions();
    } else if (currentView === 'provinces') {
        mapTitle.textContent = selectedRegion.name;
        btnMapBack.style.display = 'block';
        renderProvinces();
    } else if (currentView === 'lessons') {
        mapTitle.textContent = selectedProvince.name;
        btnMapBack.style.display = 'block';
        renderLessons();
    }
}

btnMapBack.addEventListener('click', () => {
    if (currentView === 'lessons') {
        currentView = 'provinces';
    } else if (currentView === 'provinces') {
        currentView = 'regions';
        selectedRegion = null;
    }
    renderMap();
});

function renderRegions() {
    mapContainer.style.display = 'grid';
    mapContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
    mapContainer.style.gap = '20px';
    
    LEARNING_REGIONS.forEach(region => {
        const card = document.createElement('div');
        card.className = 'bento-card';
        card.style.cursor = 'pointer';
        card.style.borderTop = `4px solid ${region.color}`;
        card.innerHTML = `
            <div style="font-size: 3rem; color: ${region.color};"><i class="fa-solid fa-map"></i></div>
            <h3 style="font-size: 1.5rem; margin-top: 10px;">${region.name}</h3>
            <p style="color: var(--text-dim); margin-top: 5px;">${region.provinces.length} Tỉnh/Thành phố</p>
        `;
        card.onclick = () => {
            selectedRegion = region;
            currentView = 'provinces';
            renderMap();
        };
        mapContainer.appendChild(card);
    });
}

function renderProvinces() {
    mapContainer.style.display = 'grid';
    mapContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    mapContainer.style.gap = '20px';
    
    selectedRegion.provinces.forEach(prov => {
        const provinceLessons = (window.VieGeoLearningPath && typeof window.VieGeoLearningPath.getLessonsForProvince === 'function')
            ? window.VieGeoLearningPath.getLessonsForProvince(prov, state.selectedDifficulty)
            : prov.lessons;
        // Calculate completion
        let completed = 0;
        provinceLessons.forEach(l => {
            if (state.completedNodes && state.completedNodes.includes(l.id)) completed++;
        });
        const percent = Math.round((completed / provinceLessons.length) * 100) || 0;
        
        const card = document.createElement('div');
        card.className = 'bento-card';
        card.style.cursor = 'pointer';
        card.style.borderTop = `4px solid ${prov.color}`;
        card.innerHTML = `
            <h3 style="font-size: 1.3rem;">${prov.name}</h3>
            <div style="margin-top: 10px; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px;">
                <div style="background: ${prov.color}; width: ${percent}%; height: 100%; border-radius: 4px;"></div>
            </div>
            <p style="color: var(--text-dim); margin-top: 5px; font-size: 0.9rem;">Tiến độ: ${percent}%</p>
        `;
        card.onclick = () => {
            selectedProvince = prov;
            currentView = 'lessons';
            renderMap();
        };
        mapContainer.appendChild(card);
    });
}

function islandKindFor(lesson) {
    if (lesson.nodeKind) return lesson.nodeKind;
    return lesson.isBoss ? 'checkpoint' : 'small';
}

function islandSizeFor(kind) {
    if (kind === 'boss') return 116;
    if (kind === 'checkpoint') return 90;
    return 70;
}

let islandTopicSyncRequest = 0;

async function syncIslandTopicsFromAdmin(lessons) {
    const loadIslandTopics = window.VieGeoLearningPath?.loadIslandTopics;
    if (typeof loadIslandTopics !== 'function' || !Array.isArray(lessons) || !lessons.length) return;

    const requestId = ++islandTopicSyncRequest;
    const topicsByLessonId = await loadIslandTopics(lessons);
    if (requestId !== islandTopicSyncRequest || !topicsByLessonId || !mapContainer) return;

    mapContainer.querySelectorAll('.island[data-lesson-id]').forEach((island) => {
        const lessonId = island.dataset.lessonId;
        const topic = String(topicsByLessonId[lessonId] || '').trim();
        if (!topic) return;
        island.dataset.lessonTitle = topic;
        const label = island.querySelector('.map-island-label');
        if (label) label.textContent = topic;
    });
    window.requestAnimationFrame(() => drawIslandRoute());
}

function renderLessons() {
    mapContainer.style.display = 'flex';
    mapContainer.style.flexDirection = 'column';
    mapContainer.style.alignItems = 'center';
    mapContainer.style.gap = '0';
    mapContainer.style.position = 'relative';
    mapContainer.classList.add('map-learning-route');
    const lessons = (window.VieGeoLearningPath && typeof window.VieGeoLearningPath.getLessonsForProvince === 'function')
        ? window.VieGeoLearningPath.getLessonsForProvince(selectedProvince, state.selectedDifficulty)
        : selectedProvince.lessons;
    
    // A broad, symmetrical path keeps each island readable and leaves room for
    // the shared SVG route to connect the real centers of adjacent islands.
    const routeWidth = Math.max(88, Math.min(210, Math.round(mapContainer.clientWidth * 0.24)));
    const offsets = [0, -routeWidth * .62, -routeWidth, -routeWidth * .62, 0, routeWidth * .62, routeWidth, routeWidth * .62];
    
    lessons.forEach((lesson, index) => {
        const isCompleted = state.completedNodes && state.completedNodes.includes(lesson.id);
        const prevCompleted = index === 0 || (state.completedNodes && state.completedNodes.includes(lessons[index-1].id));
        const islandResult = state.lessonResults && state.lessonResults[lesson.id];
        const starCount = Math.max(0, Math.min(3, Number(islandResult?.stars) || 0));
        
        // Colors for grades
        let nodeColor = 'rgba(255,255,255,0.1)';
        let iconColor = 'var(--text-dim)';
        if (isCompleted) {
            const result = islandResult;
            if (result && result.color) {
                if (result.color === 'green') { nodeColor = '#58cc02'; iconColor = '#fff'; }
                if (result.color === 'yellow') { nodeColor = '#ffc800'; iconColor = '#fff'; }
                if (result.color === 'red') { nodeColor = '#ff4b4b'; iconColor = '#fff'; }
            } else {
                nodeColor = '#58cc02'; iconColor = '#fff';
            }
        } else if (prevCompleted) {
            nodeColor = '#1cb0f6'; iconColor = '#fff'; // Active
        }
        
        const nodeKind = islandKindFor(lesson);
        const nodeSize = islandSizeFor(nodeKind);
        let icon = 'fa-star';
        if (lesson.type === 'theory') icon = 'fa-book-open';
        if (nodeKind === 'checkpoint') icon = 'fa-flag-checkered';
        if (nodeKind === 'boss' || lesson.type === 'quiz_final') icon = 'fa-crown';
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.position = 'relative'; // For absolute line positioning
        wrapper.className = `map-island-node map-island-${nodeKind} island`;
        wrapper.dataset.routeNode = String(index);
        wrapper.dataset.lessonId = lesson.id;
        wrapper.dataset.completed = String(Boolean(isCompleted));
        wrapper.dataset.unlocked = String(Boolean(isCompleted || prevCompleted));
        wrapper.dataset.nodeKind = nodeKind;
        wrapper.dataset.lessonTitle = lesson.title || 'Đảo tri thức';
        wrapper.dataset.province = lesson.province || selectedProvince?.name || 'Việt Nam';
        wrapper.dataset.difficulty = lesson.difficulty || 'easy';
        wrapper.style.marginBottom = nodeKind === 'boss' ? '52px' : nodeKind === 'checkpoint' ? '42px' : '32px';
        
        // Apply zigzag offset
        const currentOffset = offsets[index % offsets.length];
        wrapper.style.transform = `translateX(${currentOffset}px)`;
        wrapper.style.zIndex = '1';
        
        const btn = document.createElement('button');
        btn.className = `node-btn island-${nodeKind} ${isCompleted ? 'completed' : (prevCompleted ? 'current' : 'locked')}`;
        btn.style.background = nodeColor;
        btn.style.width = `${nodeSize}px`;
        btn.style.height = `${nodeSize}px`;
        btn.type = 'button';
        // Heart consumption is handled by handleDelegatedIslandClick. This marker
        // avoids the legacy per-button wrapper in app-core.js.
        btn.dataset.heartGated = 'delegated';
        if (nodeKind === 'small') btn.dataset.skipHeartGate = 'true';
        btn.innerHTML = `<i class="fa-solid ${icon}" style="color: ${iconColor}; font-size: ${nodeKind === 'boss' ? '2.35rem' : nodeKind === 'checkpoint' ? '1.9rem' : '1.5rem'};"></i>`;
        
        const label = document.createElement('div');
        label.style.marginTop = '8px';
        label.style.fontWeight = 'bold';
        label.style.color = prevCompleted || isCompleted ? '#fff' : 'var(--text-dim)';
        label.textContent = lesson.title;
        label.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)'; // Make label readable if lines cross it
        label.className = 'map-island-label';
        
        wrapper.appendChild(btn);
        wrapper.appendChild(label);
        if (starCount > 0) {
            const stars = document.createElement('div');
            stars.className = 'map-island-stars';
            stars.textContent = `${'⭐'.repeat(starCount)}${'☆'.repeat(3 - starCount)}`;
            stars.setAttribute('aria-label', `${starCount} trên 3 sao`);
            wrapper.appendChild(stars);
        }
        
        mapContainer.appendChild(wrapper);
    });

    void syncIslandTopicsFromAdmin(lessons);

    const redrawRoute = () => drawIslandRoute();
    window.requestAnimationFrame(redrawRoute);
    if (typeof ResizeObserver !== 'undefined') {
        routeResizeObserver = new ResizeObserver(redrawRoute);
        routeResizeObserver.observe(mapContainer);
    }
}

function drawIslandRoute() {
    mapContainer.querySelector('.island-route-svg')?.remove();
    const wrappers = [...mapContainer.querySelectorAll('[data-route-node]')];
    if (wrappers.length < 2) return;

    const bounds = mapContainer.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(mapContainer.scrollHeight));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'island-route-svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('aria-hidden', 'true');

    wrappers.slice(0, -1).forEach((wrapper, index) => {
        const fromButton = wrapper.querySelector('.node-btn');
        const toButton = wrappers[index + 1].querySelector('.node-btn');
        if (!fromButton || !toButton) return;

        const from = fromButton.getBoundingClientRect();
        const to = toButton.getBoundingClientRect();
        const fromCenter = { x: from.left - bounds.left + from.width / 2, y: from.top - bounds.top + from.height / 2 };
        const toCenter = { x: to.left - bounds.left + to.width / 2, y: to.top - bounds.top + to.height / 2 };
        const distance = Math.hypot(toCenter.x - fromCenter.x, toCenter.y - fromCenter.y) || 1;
        const unit = { x: (toCenter.x - fromCenter.x) / distance, y: (toCenter.y - fromCenter.y) / distance };
        const start = { x: fromCenter.x + unit.x * (from.width * .42), y: fromCenter.y + unit.y * (from.height * .42) };
        const end = { x: toCenter.x - unit.x * (to.width * .42), y: toCenter.y - unit.y * (to.height * .42) };
        const curve = Math.max(46, Math.min(148, distance * .32));
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${start.x} ${start.y} C ${start.x} ${start.y + curve}, ${end.x} ${end.y - curve}, ${end.x} ${end.y}`);
        path.setAttribute('class', `island-route-segment${wrapper.dataset.completed === 'true' ? ' is-completed' : ''}`);
        svg.appendChild(path);
    });

    mapContainer.prepend(svg);
}

// Initial render
updateStatsUI();
renderMap();

window.addEventListener('viegeo:state-hydrated', () => {
    state = window.gameState || getGameState();
    updateStatsUI();
    renderMap();
});

// One-time learner survey. Firestore is the source of truth; localStorage only keeps the UI usable offline.
const surveyModal = document.getElementById('surveyModal');
const surveyGoalInputs = [...document.querySelectorAll('input[name="surveyGoal"]')];
const surveyInterestInputs = [...document.querySelectorAll('input[name="surveyInterest"]')];
const surveySubmitButton = document.getElementById('btnSubmitSurvey');

function getSurveySession() {
    try {
        return JSON.parse(localStorage.getItem('lm_session') || '{}');
    } catch (error) {
        return {};
    }
}

function ensureLearningProfile() {
    const fallback = { surveyDone: false, goal: null, interests: [], strongTopics: [], weakTopics: [] };
    state.learningProfile = { ...fallback, ...(state.learningProfile || {}) };
    if (!Array.isArray(state.learningProfile.interests)) state.learningProfile.interests = [];
    return state.learningProfile;
}

function hydrateSurveyInputs(profile) {
    const goalInput = surveyGoalInputs.find((input) => input.value === profile.goal);
    const interestInput = surveyInterestInputs.find((input) => input.value === profile.interests?.[0]);
    if (goalInput) goalInput.checked = true;
    if (interestInput) interestInput.checked = true;
}

function selectedSurveyValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value || '';
}

function openSurvey(forceOpen = false) {
    const profile = ensureLearningProfile();
    if (!surveyModal || (!forceOpen && profile.surveyDone)) return;
    hydrateSurveyInputs(profile);
    surveyModal.style.display = 'flex';
}

async function initializeLearnerSurvey() {
    const profile = ensureLearningProfile();
    const session = getSurveySession();
    let completed = profile.surveyDone === true;

    if (session.email && typeof db !== 'undefined') {
        try {
            const userSnapshot = await db.collection('users').doc(session.email).get();
            if (userSnapshot.exists) {
                const userData = userSnapshot.data() || {};
                if (userData.learningProfile && typeof userData.learningProfile === 'object') {
                    state.learningProfile = { ...profile, ...userData.learningProfile };
                    if (!Array.isArray(state.learningProfile.interests)) state.learningProfile.interests = [];
                }
                // Undefined is deliberately treated as not completed, so old accounts receive the survey once.
                completed = userData.hasCompletedSurvey === true;
                state.learningProfile.surveyDone = completed;
                localStorage.setItem('VieGeo_state', JSON.stringify(state));
            }
        } catch (error) {
            console.warn('Không thể đọc trạng thái khảo sát từ Firebase, dùng bản lưu cục bộ.', error);
        }
    }

    if (!completed) openSurvey(true);
}

async function saveLearnerSurvey() {
    const goal = selectedSurveyValue('surveyGoal');
    const interest = selectedSurveyValue('surveyInterest');
    if (!goal || !interest) {
        VieGeoUI.warning('Vui lòng chọn mục tiêu và khu vực bạn quan tâm.');
        return;
    }
    const profile = ensureLearningProfile();
    const previousLabel = surveySubmitButton?.textContent;
    if (surveySubmitButton) {
        surveySubmitButton.disabled = true;
        surveySubmitButton.textContent = 'Đang lưu…';
    }

    profile.goal = goal;
    profile.interests = [interest];
    profile.surveyDone = true;

    try {
        const session = getSurveySession();
        if (session.email && typeof db !== 'undefined') {
            await db.collection('users').doc(session.email).set({
                learningProfile: profile,
                hasCompletedSurvey: true,
                surveyCompletedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        saveGameState(state);
        if (surveyModal) surveyModal.style.display = 'none';
        if (typeof renderProfile === 'function') renderProfile();
        if (typeof showToast === 'function') showToast('Đã lưu hồ sơ học tập.');
        else VieGeoUI.success('Đã lưu hồ sơ học tập.');
    } catch (error) {
        profile.surveyDone = false;
        console.error('Không thể lưu khảo sát:', error);
        VieGeoUI.error('Chưa thể lưu khảo sát. Vui lòng thử lại.');
    } finally {
        if (surveySubmitButton) {
            surveySubmitButton.disabled = false;
            surveySubmitButton.textContent = previousLabel || 'Lưu khảo sát';
        }
    }
}

window.VieGeoSurvey = { open: () => openSurvey(true) };
surveySubmitButton?.addEventListener('click', saveLearnerSurvey);
initializeLearnerSurvey();
