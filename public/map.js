// ============================================================================
// VieGeo - map.js (Rendering Learning Path Multi-Tier)
// ============================================================================

const PROVINCE_THEORIES = Object.freeze({
    'ha-noi': `<div class="space-y-4 text-left">
  <h3 class="text-xl font-bold text-blue-600">1. HÃ  Ná»™i lÃ  nÆ¡i nhÆ° tháº¿ nÃ o?</h3>
  <p>HÃ  Ná»™i cÃ³ tÃªn chÃ­nh thá»©c lÃ  ThÃ nh phá»‘ HÃ  Ná»™i vÃ  lÃ  Thá»§ Ä‘Ã´ cá»§a nÆ°á»›c Cá»™ng hÃ²a xÃ£ há»™i chá»§ nghÄ©a Viá»‡t Nam. ÄÃ¢y lÃ  má»™t trong nÄƒm thÃ nh phá»‘ trá»±c thuá»™c Trung Æ°Æ¡ng, Ä‘á»“ng thá»i lÃ  trung tÃ¢m chÃ­nh trá»‹, hÃ nh chÃ­nh, vÄƒn hÃ³a, giÃ¡o dá»¥c vÃ  khoa há»c cá»§a cáº£ nÆ°á»›c.</p>
  <p>Quá»‘c há»™i, ChÃ­nh phá»§, Phá»§ Chá»§ tá»‹ch cÃ¹ng nhiá»u bá»™, ngÃ nh trung Æ°Æ¡ng Ä‘á»u Ä‘áº·t trá»¥ sá»Ÿ táº¡i HÃ  Ná»™i. ThÃ nh phá»‘ cÅ©ng lÃ  nÆ¡i diá»…n ra nhiá»u sá»± kiá»‡n quan trá»ng nhÆ° cÃ¡c ká»³ há»p Quá»‘c há»™i, lá»… ká»· niá»‡m lá»›n cá»§a Ä‘áº¥t nÆ°á»›c, há»™i nghá»‹ quá»‘c táº¿ vÃ  cÃ¡c hoáº¡t Ä‘á»™ng ngoáº¡i giao.</p>
  <p>Vá»›i lá»‹ch sá»­ hÆ¡n 1.000 nÄƒm, HÃ  Ná»™i tá»«ng mang tÃªn ThÄƒng Long. Tráº£i qua nhiá»u giai Ä‘oáº¡n lá»‹ch sá»­, thÃ nh phá»‘ váº«n giá»¯ Ä‘Æ°á»£c nhiá»u cÃ´ng trÃ¬nh cá»•, di tÃ­ch lá»‹ch sá»­ vÃ  giÃ¡ trá»‹ vÄƒn hÃ³a. NgÃ y nay, HÃ  Ná»™i vá»«a lÃ  má»™t Ä‘Ã´ thá»‹ hiá»‡n Ä‘áº¡i vá»«a lÃ  nÆ¡i lÆ°u giá»¯ nhá»¯ng nÃ©t Ä‘áº¹p truyá»n thá»‘ng cá»§a dÃ¢n tá»™c.</p>

  <h3 class="text-xl font-bold text-blue-600">2. HÃ  Ná»™i thuá»™c miá»n vÃ  vÃ¹ng nÃ o?</h3>
  <p>HÃ  Ná»™i náº±m á»Ÿ miá»n Báº¯c cá»§a Viá»‡t Nam. ÄÃ¢y lÃ  khu vá»±c cÃ³ bá»‘n mÃ¹a rÃµ rá»‡t lÃ  xuÃ¢n, háº¡, thu vÃ  Ä‘Ã´ng. Má»—i mÃ¹a Ä‘á»u mang má»™t váº» Ä‘áº¹p riÃªng vÃ  táº¡o nÃªn nhá»¯ng nÃ©t Ä‘áº·c trÆ°ng trong cuá»™c sá»‘ng cá»§a ngÆ°á»i dÃ¢n.</p>
  <p>Theo phÃ¢n chia Ä‘á»‹a lÃ­, HÃ  Ná»™i thuá»™c vÃ¹ng Äá»“ng báº±ng sÃ´ng Há»“ng. VÃ¹ng nÃ y ná»•i tiáº¿ng vá»›i Ä‘áº¥t Ä‘ai mÃ u má»¡, há»‡ thá»‘ng sÃ´ng ngÃ²i dÃ y Ä‘áº·c vÃ  dÃ¢n cÆ° Ä‘Ã´ng Ä‘Ãºc. Tá»« lÃ¢u, Ä‘Ã¢y Ä‘Ã£ lÃ  má»™t trong nhá»¯ng cÃ¡i nÃ´i cá»§a ná»n vÄƒn minh lÃºa nÆ°á»›c Viá»‡t Nam.</p>

  <h3 class="text-xl font-bold text-blue-600">3. KhÃ­ háº­u HÃ  Ná»™i cÃ³ gÃ¬ Ä‘áº·c trÆ°ng?</h3>
  <p>HÃ  Ná»™i cÃ³ khÃ­ háº­u nhiá»‡t Ä‘á»›i giÃ³ mÃ¹a vá»›i bá»‘n mÃ¹a khÃ¡ rÃµ rá»‡t: xuÃ¢n, háº¡, thu vÃ  Ä‘Ã´ng. MÃ¹a hÃ¨ thÆ°á»ng nÃ³ng, áº©m vÃ  cÃ³ mÆ°a nhiá»u; mÃ¹a Ä‘Ã´ng se láº¡nh, Ä‘Ã´i khi cÃ³ mÆ°a phÃ¹n. MÃ¹a thu mÃ¡t máº», trong lÃ nh lÃ  má»™t nÃ©t Ä‘áº·c trÆ°ng Ä‘Æ°á»£c nhiá»u ngÆ°á»i yÃªu thÃ­ch.</p>

  <h3 class="text-xl font-bold text-blue-600">4. Äiá»u gÃ¬ lÃ m HÃ  Ná»™i ná»•i báº­t?</h3>
  <p>Äiá»u lÃ m HÃ  Ná»™i ná»•i báº­t lÃ  bá» dÃ y lá»‹ch sá»­ hÆ¡n má»™t nghÃ¬n nÄƒm vÃ  vai trÃ² lÃ  Thá»§ Ä‘Ã´ cá»§a Viá»‡t Nam. ThÃ nh phá»‘ ná»•i tiáº¿ng vá»›i Há»“ GÆ°Æ¡m, VÄƒn Miáº¿u â€“ Quá»‘c Tá»­ GiÃ¡m, HoÃ ng thÃ nh ThÄƒng Long, LÄƒng Chá»§ tá»‹ch Há»“ ChÃ­ Minh vÃ  khu phá»‘ cá»•.</p>
  <p>NgoÃ i cÃ¡c cÃ´ng trÃ¬nh lá»‹ch sá»­, HÃ  Ná»™i cÃ²n Ä‘Æ°á»£c biáº¿t Ä‘áº¿n vá»›i nhá»¯ng hÃ ng cÃ¢y xanh, nhiá»u há»“ nÆ°á»›c vÃ  ná»n áº©m thá»±c phong phÃº nhÆ° phá»Ÿ, bÃºn cháº£ hay cá»‘m. ÄÃ¢y lÃ  nhá»¯ng hÃ¬nh áº£nh thÆ°á»ng Ä‘Æ°á»£c nháº¯c Ä‘áº¿n khi giá»›i thiá»‡u vá» Thá»§ Ä‘Ã´.</p>
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
let islandQuizAnswerLocked = {};
let islandQuizPenaltyPending = false;
let islandQuizSubmitted = false;
let islandTheoryConfirmed = false;
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

function updateIslandTheoryStartButton() {
    if (!btnStartIslandQuiz) return;
    const ready = Boolean(activeIslandLearning?.questions?.length);
    const enabled = ready && islandTheoryConfirmed;
    btnStartIslandQuiz.disabled = !enabled;
    btnStartIslandQuiz.setAttribute('aria-disabled', String(!enabled));
    btnStartIslandQuiz.style.opacity = enabled ? '1' : '.5';
    btnStartIslandQuiz.style.cursor = enabled ? 'pointer' : 'not-allowed';
    btnStartIslandQuiz.title = enabled ? 'Báº¯t Ä‘áº§u lÃ m bÃ i' : 'HÃ£y xÃ¡c nháº­n Ä‘Ã£ Ä‘á»c lÃ½ thuyáº¿t trÆ°á»›c khi báº¯t Ä‘áº§u.';
}

function resetIslandTheoryConfirmation() {
    islandTheoryConfirmed = false;
    const checkbox = islandTheoryModal?.querySelector('#islandTheoryConfirm');
    if (checkbox) checkbox.checked = false;
    updateIslandTheoryStartButton();
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
        <div id="theory-modal" role="dialog" aria-modal="true" aria-labelledby="islandTheoryTitle" style="position:fixed !important;inset:0 !important;z-index:2147483647 !important;display:none;width:100vw;height:100dvh;overflow-y:auto;background:#0f172a;color:#f8fafc;box-sizing:border-box;">
            <section style="position:relative;box-sizing:border-box;min-height:100dvh;width:100%;padding:clamp(32px,8vw,96px);background:radial-gradient(circle at 78% 0%,rgba(14,165,233,.15),transparent 35%),#0f172a;color:#f8fafc;">
                <button id="btnCloseIslandTheory" type="button" aria-label="ÄÃ³ng lÃ½ thuyáº¿t" style="position:fixed;top:24px;right:24px;z-index:2;width:44px;height:44px;border:1px solid rgba(148,163,184,.3);border-radius:50%;background:rgba(30,41,59,.92);color:#fff;font-size:22px;cursor:pointer;">Ã—</button>
                <div style="width:min(100%,960px);margin:0 auto;padding-bottom:118px;">
                    <p style="margin:0 0 8px;color:#7dd3fc;font-weight:800;letter-spacing:.04em;">HÃ€NH TRANG TRÆ¯á»šC THá»¬ THÃCH</p>
                    <h2 id="islandTheoryTitle" style="margin:0;padding-right:54px;font-size:clamp(2rem,4vw,3.2rem);line-height:1.18;">LÃ½ thuyáº¿t trÆ°á»›c khi thá»±c chiáº¿n</h2>
                    <p id="islandTheoryMeta" style="margin:14px 0 30px;color:#94a3b8;font-size:1rem;">HÃ  Ná»™i Â· Kiáº¿n thá»©c ná»n táº£ng</p>
                    <article id="islandTheoryContent" aria-live="polite" style="color:#dbeafe;line-height:1.85;border:1px solid rgba(125,211,252,.2);border-radius:20px;padding:clamp(22px,4vw,40px);background:rgba(2,12,27,.42);">${theoryHtml || ''}</article>
                    <label for="islandTheoryConfirm" style="display:flex;align-items:flex-start;gap:12px;margin-top:24px;color:#dbeafe;line-height:1.5;cursor:pointer;">
                        <input id="islandTheoryConfirm" type="checkbox" style="width:22px;height:22px;flex:0 0 auto;margin-top:1px;accent-color:#22c55e;cursor:pointer;">
                        <span>TÃ´i Ä‘Ã£ Ä‘á»c vÃ  hiá»ƒu ná»™i dung trÃªn.</span>
                    </label>
                    <div style="position:sticky;bottom:16px;padding-top:16px;background:linear-gradient(180deg,transparent,#0f172a 34%);">
                        <button id="btnStartIslandQuiz" type="button" disabled aria-disabled="true" style="display:flex;width:100%;min-height:58px;align-items:center;justify-content:center;gap:9px;border:0;border-radius:16px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:1rem;font-weight:800;cursor:not-allowed;box-shadow:0 16px 30px rgba(22,163,74,.24);opacity:.5;">ÄÃ£ hiá»ƒu &amp; Báº¯t Ä‘áº§u lÃ m bÃ i</button>
                    </div>
                </div>
            </section>
        </div>`);
    // Bind directly to the elements just inserted. Querying from the modal root
    // guarantees that a stale element with a duplicated ID cannot receive clicks.
    const insertedTheoryModal = document.getElementById('theory-modal');
    const theoryCloseButton = insertedTheoryModal?.querySelector('#btnCloseIslandTheory');
    const theoryStartButton = insertedTheoryModal?.querySelector('#btnStartIslandQuiz');
    const theoryContent = insertedTheoryModal?.querySelector('#islandTheoryContent');
    const theoryConfirmCheckbox = insertedTheoryModal?.querySelector('#islandTheoryConfirm');
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
    const confirmTheoryRead = () => {
        islandTheoryConfirmed = true;
        if (theoryConfirmCheckbox) theoryConfirmCheckbox.checked = true;
        updateIslandTheoryStartButton();
    };
    theoryConfirmCheckbox?.addEventListener('change', () => {
        islandTheoryConfirmed = Boolean(theoryConfirmCheckbox.checked);
        updateIslandTheoryStartButton();
    });
    theoryContent?.addEventListener('scroll', () => {
        const reachedBottom = theoryContent.scrollTop + theoryContent.clientHeight >= theoryContent.scrollHeight - 4;
        if (reachedBottom) confirmTheoryRead();
    }, { passive: true });
    if (theoryStartButton) {
        theoryStartButton.addEventListener('click', async () => {
            if (theoryStartButton.disabled || !islandTheoryConfirmed || !activeIslandLearning?.questions?.length) return;
            insertedTheoryModal?.remove();
            refreshIslandModalReferences();
            await openIslandQuizPreview();
        });
    }
    refreshIslandModalReferences();
    resetIslandTheoryConfirmation();
    bindIslandModalEvents();
    return islandTheoryModal;
}

function rebuildIslandQuizModalWithInlineCss() {
    if (!document.body) return null;
    removeGhostIslandModals();
    document.body.insertAdjacentHTML('beforeend', `
        <div id="islandQuizModal" role="dialog" aria-modal="true" aria-labelledby="islandQuizTitle" style="position:fixed !important;inset:0 !important;z-index:2147483647 !important;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);overflow:auto;box-sizing:border-box;">
            <section style="position:relative;width:min(760px,100%);max-height:80vh;overflow-y:auto;box-sizing:border-box;border:1px solid rgba(96,165,250,.48);border-radius:24px;padding:clamp(24px,5vw,42px);background:#102238;color:#f8fafc;box-shadow:0 30px 80px rgba(0,0,0,.62);">
                <button id="btnCloseIslandQuiz" type="button" aria-label="ÄÃ³ng báº£ng tráº¯c nghiá»‡m" style="position:absolute;top:16px;right:16px;width:40px;height:40px;border:0;border-radius:50%;background:rgba(148,163,184,.2);color:#fff;font-size:20px;cursor:pointer;">Ã—</button>
                <p style="margin:0 0 8px;color:#7dd3fc;font-weight:800;">TRáº®C NGHIá»†M Äáº¢O NHá»Ž</p>
                <h2 id="islandQuizTitle" style="margin:0;padding-right:44px;font-size:clamp(1.5rem,3vw,2rem);line-height:1.25;">CÃ¢u há»i Ä‘Ã£ sáºµn sÃ ng</h2>
                <p id="islandQuizMeta" style="margin:10px 0 20px;color:#94a3b8;"></p>
                <section id="islandQuizContent" aria-live="polite" style="color:#dbeafe;line-height:1.75;border:1px solid rgba(148,163,184,.2);border-radius:16px;padding:20px;background:rgba(2,12,27,.45);"></section>
                <button id="btnLaunchIslandQuiz" type="button" style="display:flex;width:100%;min-height:54px;align-items:center;justify-content:center;gap:9px;margin-top:22px;border:0;border-radius:14px;background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;font-size:1rem;font-weight:800;cursor:pointer;">VÃ o bÃ i tráº¯c nghiá»‡m</button>
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
    return `TrÆ°á»›c khi lÃ m bÃ i, hÃ£y náº¯m cÃ¡c Ã½ chÃ­nh cá»§a ${lesson.title}.\n\nQuan sÃ¡t Ä‘áº·c Ä‘iá»ƒm Ä‘á»‹a lÃ­, ghi nhá»› tá»« khÃ³a quan trá»ng vÃ  liÃªn há»‡ kiáº¿n thá»©c vá»›i Ä‘á»‹a phÆ°Æ¡ng Ä‘ang khÃ¡m phÃ¡. Sau Ä‘Ã³, báº¡n sáº½ tráº£ lá»i 5 cÃ¢u há»i Ä‘á»ƒ kiá»ƒm tra má»©c Ä‘á»™ hiá»ƒu bÃ i.`;
}

function normalizeProvinceSlug(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Ä‘/g, 'd')
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

    return `<div class="text-left"><h3>${lesson?.title || 'Äáº£o tri thá»©c'}</h3><p>${fallbackTheoryFor(lesson || {})}</p></div>`;
}

function theoryHtmlFromLoadedContent(lesson, loadedContent) {
    const fallback = theoryHtmlFor(lesson);
    const rawTheory = String(
        loadedContent?.theory
        || loadedContent?.questions?.map((question) => question?.islandTheory || question?.islandTheoryContent || question?.islandTheoryText || '').find(Boolean)
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

function safeTheoryHtml(value) {
    if (window.VieGeoSecurity?.sanitizeHtml) return window.VieGeoSecurity.sanitizeHtml(value, 12000);
    return String(value ?? '')
        .replace(/<\s*(script|style|iframe|object|embed|link|meta|base|form)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
        .replace(/\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
        .replace(/\s+(href|src|xlink:href)\s*=\s*(['"]?)\s*javascript:[^'"\s>]*/gi, ' $1="#"')
        .trim()
        .slice(0, 12000);
}

function activeIslandQuizQuestions() {
    return Array.isArray(activeIslandLearning?.questions) ? activeIslandLearning.questions : [];
}

function islandQuizWarning(message) {
    if (window.VieGeoUI?.warning) {
        window.VieGeoUI.warning(message);
        return;
    }
    console.warn(message);
}

function showFloatingHeartPenalty() {
    if (!document.body) return;
    const heartCounter = document.getElementById('hdrHearts') || document.getElementById('statHearts');
    const heartBounds = heartCounter?.getBoundingClientRect();
    const fromHeader = Boolean(heartBounds && heartBounds.width && heartBounds.height);
    const penalty = document.createElement('div');
    penalty.className = 'fixed z-[999999] text-red-500 font-bold text-3xl md:text-5xl pointer-events-none';
    penalty.textContent = '-1 â¤ï¸';
    penalty.setAttribute('aria-hidden', 'true');
    penalty.style.cssText = `position:fixed;z-index:2147483647;left:${fromHeader ? heartBounds.left + (heartBounds.width / 2) : window.innerWidth / 2}px;top:${fromHeader ? heartBounds.top + heartBounds.height : window.innerHeight / 2}px;color:#fb7185;font-family:'Be Vietnam Pro',sans-serif;font-size:clamp(1.875rem,5vw,3rem);font-weight:800;line-height:1;white-space:nowrap;pointer-events:none;text-shadow:0 6px 20px rgba(127,29,29,.5);will-change:transform,opacity;`;
    document.body.appendChild(penalty);

    const horizontalOffset = fromHeader ? '-50%' : '-50%';
    penalty.animate([
        { transform: `translate(${horizontalOffset}, 0) scale(1)`, opacity: 1 },
        { transform: `translate(${horizontalOffset}, -100px) scale(1.5)`, opacity: 0 }
    ], {
        duration: 3000,
        easing: 'ease-out',
        fill: 'forwards'
    });
    window.setTimeout(() => penalty.remove(), 3000);
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

async function endIslandQuizForGameOver() {
    const modal = islandQuizModal;
    modal?.remove();
    refreshIslandModalReferences();
    activeIslandLearning = null;
    state = window.gameState || state;
    updateStatsUI();

    const options = {
        title: 'Háº¿t sinh má»‡nh!',
        text: 'Báº¡n Ä‘Ã£ háº¿t trÃ¡i tim sau khi tráº£ lá»i sai. HÃ£y há»“i phá»¥c trÃ¡i tim rá»“i quay láº¡i hÃ nh trÃ¬nh há»c táº­p.',
        icon: 'error',
        confirmButtonText: 'LÃ m láº¡i sau',
        confirmButtonColor: '#0284c7',
        background: '#13253a',
        color: '#f8fafc',
        heightAuto: false
    };
    if (window.Swal && typeof window.Swal.fire === 'function') await window.Swal.fire(options);
    else if (window.VieGeoUI?.error) await window.VieGeoUI.error(options.text, options);
    renderMap();
}

async function applyIslandIncorrectAnswerPenalty() {
    const penalty = typeof window.deductHeartForIncorrectAnswer === 'function'
        ? await window.deductHeartForIncorrectAnswer()
        : { applied: false, gameOver: false };
    if (penalty.applied) {
        state = window.gameState || state;
        updateStatsUI();
        showFloatingHeartPenalty();
    }
    if (penalty.gameOver) await endIslandQuizForGameOver();
    return penalty;
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
        return '<p style="margin:0;color:#86efac;font-weight:700"><i class="fa-solid fa-circle-check"></i> Xuáº¥t sáº¯c! Báº¡n khÃ´ng cÃ³ cÃ¢u tráº£ lá»i sai.</p>';
    }

    const cards = wrongAnswers.map(({ question, index, correctIndex, selectedIndex }) => {
        const options = Array.isArray(question.options) ? question.options : [];
        const selectedText = Number.isInteger(selectedIndex) ? options[selectedIndex] : 'ChÆ°a chá»n Ä‘Ã¡p Ã¡n';
        const correctText = options[correctIndex] || 'ChÆ°a cÃ³ Ä‘Ã¡p Ã¡n Ä‘Ãºng';
        const explanation = String(question.explanation || '').trim();
        return `<article style="padding:15px;border:1px solid rgba(248,113,113,.35);border-radius:14px;background:rgba(127,29,29,.16);text-align:left">
            <strong style="display:block;color:#fecaca;margin-bottom:7px">CÃ¢u ${index + 1}: ${escapeQuizHtml(question.question || question.questionText)}</strong>
            <p style="margin:5px 0;color:#fecaca">Báº¡n chá»n: ${escapeQuizHtml(selectedText || 'ChÆ°a chá»n Ä‘Ã¡p Ã¡n')}</p>
            <p style="margin:5px 0;color:#bbf7d0">ÄÃ¡p Ã¡n Ä‘Ãºng: ${escapeQuizHtml(correctText)}</p>
            ${explanation ? `<p style="margin:9px 0 0;color:#cbd5e1"><strong>Giáº£i thÃ­ch:</strong> ${escapeQuizHtml(explanation)}</p>` : ''}
        </article>`;
    }).join('');

    return `<section style="display:grid;gap:12px;width:100%;margin-top:18px;text-align:left">
        <div style="padding:14px 16px;border:1px solid rgba(250,204,21,.32);border-radius:14px;background:rgba(250,204,21,.1);color:#fef3c7">
            <strong><i class="fa-solid fa-book-open"></i> HÃ£y Ä‘á»c láº¡i lÃ½ thuyáº¿t</strong>
            <p style="margin:5px 0 0">Báº¡n cÃ²n ${wrongAnswers.length} cÃ¢u chÆ°a Ä‘Ãºng. Ã”n láº¡i pháº§n lÃ½ thuyáº¿t cá»§a Ä‘áº£o trÆ°á»›c khi lÃ m láº¡i Ä‘á»ƒ ghi nhá»› tá»‘t hÆ¡n.</p>
        </div>
        ${cards}
    </section>`;
}

async function renderIslandQuizResult() {
    const questions = activeIslandQuizQuestions();
    const correctAnswers = questions.reduce((total, question, index) => total + (islandQuizAnswers[index] === islandQuizCorrectAnswerIndex(question) ? 1 : 0), 0);
    const stars = islandQuizStars(correctAnswers, questions.length);

    if (!islandQuizSubmitted) persistIslandQuizResult(correctAnswers, questions.length);

    const header = document.getElementById('islandQuizStepHeader');
    const body = document.getElementById('islandQuizStepBody');
    const backButton = document.getElementById('islandQuizStepBack');
    const nextButton = document.getElementById('islandQuizStepNext');
    if (!header || !body || !backButton || !nextButton) return;

    header.textContent = 'Káº¿t quáº£ bÃ i tráº¯c nghiá»‡m';
    body.innerHTML = `<div style="display: grid; min-height: 260px; place-items: center; text-align: center; gap: 14px;">
        <div style="font-size: 2rem; letter-spacing: 6px;">${stars ? 'â­'.repeat(stars) : 'â˜†'}</div>
        <h3 style="margin: 0; color: #f8fafc; font-size: 1.5rem;">Báº¡n tráº£ lá»i Ä‘Ãºng ${correctAnswers}/${questions.length} cÃ¢u</h3>
        <p style="margin: 0; color: #cbd5e1;">Sá»‘ sao cao nháº¥t cá»§a Ä‘áº£o Ä‘Ã£ Ä‘Æ°á»£c lÆ°u vÃ o hÃ nh trÃ¬nh há»c táº­p.</p>
        ${renderIslandQuizWrongAnswerReview(questions)}
    </div>`;
    backButton.style.visibility = 'hidden';
    nextButton.textContent = 'HoÃ n táº¥t';
}

function renderIslandQuizQuestion(index) {
    const questions = activeIslandQuizQuestions();
    if (!questions.length || islandQuizSubmitted) {
        if (islandQuizSubmitted) void renderIslandQuizResult();
        return;
    }
    const nextIndex = Math.max(0, Math.min(index, questions.length - 1));
    islandQuizCurrentIndex = nextIndex;
    const question = questions[islandQuizCurrentIndex];
    const header = document.getElementById('islandQuizStepHeader');
    const body = document.getElementById('islandQuizStepBody');
    const backButton = document.getElementById('islandQuizStepBack');
    const nextButton = document.getElementById('islandQuizStepNext');
    if (!header || !body || !backButton || !nextButton) return;

    header.textContent = `CÃ¢u ${islandQuizCurrentIndex + 1} / ${questions.length}`;
    const selectedAnswer = islandQuizAnswers[islandQuizCurrentIndex];
    const answerLocked = Boolean(islandQuizAnswerLocked[islandQuizCurrentIndex]);
    const correctAnswer = islandQuizCorrectAnswerIndex(question);
    const isCorrect = answerLocked && selectedAnswer === correctAnswer;
    const explanation = String(question.explanation || question.theory || '').trim();
    const options = Array.isArray(question.options) ? question.options : [];
    body.innerHTML = `<h3 style="margin: 0 0 22px; color: #f8fafc; font-size: clamp(1.15rem, 2.5vw, 1.45rem); line-height: 1.5;">${escapeQuizHtml(question.question || question.questionText)}</h3>
        <div id="islandQuizOptions" style="display: grid; gap: 12px;"></div>
        ${answerLocked ? `<aside aria-live="polite" style="margin-top:18px;padding:16px;border:1px solid ${isCorrect ? 'rgba(74,222,128,.5)' : 'rgba(248,113,113,.5)'};border-radius:14px;background:${isCorrect ? 'rgba(22,163,74,.12)' : 'rgba(127,29,29,.16)'};color:${isCorrect ? '#dcfce7' : '#fee2e2'};line-height:1.6;text-align:left;"><strong style="display:block;margin-bottom:6px;color:${isCorrect ? '#86efac' : '#fca5a5'}">${isCorrect ? 'âœ“ Tráº£ lá»i chÃ­nh xÃ¡c' : 'âœ• ÄÃ¡p Ã¡n chÆ°a chÃ­nh xÃ¡c'}</strong><strong style="display:block;margin-bottom:5px;color:#e0f2fe">Giáº£i thÃ­ch</strong>${escapeQuizHtml(explanation || 'ChÆ°a cÃ³ ná»™i dung giáº£i thÃ­ch cho cÃ¢u há»i nÃ y.')}</aside>` : ''}`;
    const optionsContainer = document.getElementById('islandQuizOptions');
    options.forEach((option, optionIndex) => {
        const isSelected = selectedAnswer === optionIndex;
        const isCorrectOption = answerLocked && optionIndex === correctAnswer;
        const isWrongSelected = answerLocked && isSelected && !isCorrect;
        const borderColor = isCorrectOption ? '#22c55e' : (isWrongSelected ? '#f87171' : (isSelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)'));
        const background = isCorrectOption ? 'rgba(22, 163, 74, 0.2)' : (isWrongSelected ? 'rgba(220, 38, 38, 0.2)' : (isSelected ? 'rgba(14, 165, 233, 0.22)' : 'rgba(15, 23, 42, 0.5)'));
        const optionButton = document.createElement('button');
        optionButton.type = 'button';
        optionButton.dataset.optionIndex = String(optionIndex);
        optionButton.setAttribute('aria-pressed', String(isSelected));
        optionButton.disabled = answerLocked;
        optionButton.style.cssText = `width: 100%; border: 2px solid ${borderColor}; border-radius: 14px; padding: 15px 16px; background: ${background}; color: #f8fafc; text-align: left; font: inherit; cursor: ${answerLocked ? 'default' : 'pointer'}; opacity:${answerLocked && !isSelected && !isCorrectOption ? '.72' : '1'}; transition: .16s ease;`;
        optionButton.innerHTML = `<strong style="display: inline-grid; width: 28px; height: 28px; place-items: center; margin-right: 10px; border-radius: 50%; background: ${isCorrectOption ? '#16a34a' : (isWrongSelected ? '#dc2626' : (isSelected ? '#0284c7' : 'rgba(148, 163, 184, 0.2)'))};">${String.fromCharCode(65 + optionIndex)}</strong>${escapeQuizHtml(option)}`;
        optionButton.addEventListener('click', async () => {
            if (islandQuizAnswerLocked[islandQuizCurrentIndex]) return;
            islandQuizAnswers[islandQuizCurrentIndex] = optionIndex;
            islandQuizAnswerLocked[islandQuizCurrentIndex] = true;
            const isWrong = optionIndex !== islandQuizCorrectAnswerIndex(question);
            islandQuizPenaltyPending = isWrong;
            renderIslandQuizQuestion(islandQuizCurrentIndex);
            if (!isWrong) return;
            try {
                await applyIslandIncorrectAnswerPenalty();
            } finally {
                islandQuizPenaltyPending = false;
                if (islandQuizModal?.isConnected && !islandQuizSubmitted) renderIslandQuizQuestion(islandQuizCurrentIndex);
            }
        });
        optionsContainer?.appendChild(optionButton);
    });
    backButton.disabled = islandQuizCurrentIndex === 0;
    backButton.style.visibility = islandQuizCurrentIndex === 0 ? 'hidden' : 'visible';
    nextButton.disabled = !answerLocked || islandQuizPenaltyPending;
    nextButton.style.opacity = nextButton.disabled ? '.5' : '1';
    nextButton.style.cursor = nextButton.disabled ? 'not-allowed' : 'pointer';
    nextButton.textContent = islandQuizCurrentIndex === questions.length - 1 ? 'Xem káº¿t quáº£' : 'CÃ¢u tiáº¿p theo';
}

function mountIslandQuizStepper() {
    if (!islandQuizContent) return false;
    islandQuizContent.style.cssText = 'display:flex;flex:1 1 auto;min-height:0;padding:0;overflow:hidden;background:#102238;';
    islandQuizContent.innerHTML = `<section style="display:flex;width:100%;min-height:0;flex:1 1 auto;flex-direction:column;overflow:hidden;">
        <header id="islandQuizStepHeader" style="padding: 16px 20px; border-bottom: 1px solid rgba(148, 163, 184, 0.22); color: #7dd3fc; font-weight: 800;">CÃ¢u 1</header>
        <main id="islandQuizStepBody" style="flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:24px 20px;"></main>
        <footer style="display: flex; justify-content: space-between; gap: 12px; padding: 16px 20px; border-top: 1px solid rgba(148, 163, 184, 0.22);">
            <button id="islandQuizStepBack" type="button" style="min-width: 112px; border: 1px solid rgba(148, 163, 184, 0.45); border-radius: 12px; padding: 12px 16px; background: transparent; color: #e2e8f0; font: inherit; font-weight: 700; cursor: pointer;">Quay láº¡i</button>
            <button id="islandQuizStepNext" type="button" style="min-width: 130px; border: 0; border-radius: 12px; padding: 12px 16px; background: #0284c7; color: #fff; font: inherit; font-weight: 800; cursor: pointer;">Tiáº¿p tá»¥c</button>
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
        if (!islandQuizAnswerLocked[islandQuizCurrentIndex] || islandQuizPenaltyPending) {
            islandQuizWarning('HÃ£y chá»‘t Ä‘Ã¡p Ã¡n vÃ  Ä‘á»c giáº£i thÃ­ch trÆ°á»›c khi tiáº¿p tá»¥c.');
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
        if (window.VieGeoUI?.warning) window.VieGeoUI.warning('Hiá»‡n chÆ°a cÃ³ cÃ¢u há»i Ä‘á»ƒ báº¯t Ä‘áº§u bÃ i há»c nÃ y.');
        return;
    }

    // A quiz always starts on a brand-new root so no duplicate IDs or stale
    // hidden styles can capture the event or hide the current attempt.
    const quizModal = rebuildIslandQuizModalWithInlineCss();
    if (!quizModal || !islandQuizContent || !islandQuizTitle || !islandQuizMeta) {
        console.error('KhÃ´ng thá»ƒ táº¡o Modal tráº¯c nghiá»‡m trong DOM.');
        return;
    }
    islandQuizCurrentIndex = 0;
    islandQuizAnswers = {};
    islandQuizAnswerLocked = {};
    islandQuizPenaltyPending = false;
    islandQuizSubmitted = false;
    islandQuizTitle.textContent = `Tráº¯c nghiá»‡m: ${activeIslandLearning.lesson.title || 'Äáº£o tri thá»©c'}`;
    islandQuizMeta.textContent = `${activeIslandLearning.lesson.province || selectedProvince?.name || 'Viá»‡t Nam'} Â· ${activeIslandLearning.questions.length} cÃ¢u há»i tá»« Supabase`;
    if (btnLaunchIslandQuiz) btnLaunchIslandQuiz.style.display = 'none';
    if (!mountIslandQuizStepper()) return;
    forceShowIslandModal(quizModal);
    renderIslandQuizQuestion(0);
}

function showIslandLoadingFeedback(clickedIsland) {
    const title = clickedIsland?.dataset.lessonTitle || 'Äáº£o tri thá»©c';
    const province = clickedIsland?.dataset.province || selectedProvince?.name || 'Viá»‡t Nam';
    const difficulty = clickedIsland?.dataset.difficulty || 'easy';

    if (!ensureIslandModalDom()) {
        console.error('KhÃ´ng thá»ƒ táº¡o cáº¥u trÃºc Modal lÃ½ thuyáº¿t trong DOM.');
        console.warn('Đã nhận click! Đang kết nối Supabase...');
        return false;
    }

    forceShowIslandModal(islandTheoryModal);
    islandTheoryTitle.textContent = 'LÃ½ thuyáº¿t trÆ°á»›c khi thá»±c chiáº¿n';
    islandTheoryMeta.textContent = `${title} Â· ${province} Â· ${difficulty} Â· 5 cÃ¢u há»i`;
    islandTheoryContent.classList.add('is-loading');
    islandTheoryContent.setAttribute('aria-busy', 'true');
    islandTheoryContent.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Äang táº£i dá»¯ liá»‡u...';
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
        console.error('KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u bÃ i há»c cho Ä‘áº£o:', clickedIsland.dataset.lessonId);
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.textContent = 'KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u bÃ i há»c. Vui lÃ²ng táº£i láº¡i trang vÃ  thá»­ láº¡i.';
        return;
    }

    if (!isUnlocked) {
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.textContent = 'Äáº£o nÃ y chÆ°a má»Ÿ khÃ³a. HÃ£y hoÃ n thÃ nh Ä‘áº£o ngay trÆ°á»›c Ä‘Ã³ Ä‘á»ƒ tiáº¿p tá»¥c hÃ nh trÃ¬nh.';
        return;
    }

    if (nodeKind === 'small') {
        // openIslandTheory keeps the visible loading modal in place, then fetches
        // Supabase fetching is isolated so it never blocks the click feedback.
        await openIslandTheory(lesson);
        return;
    }

    try {
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.textContent = 'Äang chuáº©n bá»‹ bÃ i kiá»ƒm tra...';
        if (typeof window.consumeHeart === 'function' && !await window.consumeHeart()) {
            closeIslandTheory();
            return;
        }
        localStorage.setItem('VieGeo_current_lesson', lesson.id);
        localStorage.setItem('VieGeo_mode', 'normal');
        window.location.href = '/lesson';
    } catch (error) {
        console.error('KhÃ´ng thá»ƒ má»Ÿ bÃ i kiá»ƒm tra cá»§a Ä‘áº£o:', error);
        islandTheoryContent.textContent = 'ChÆ°a thá»ƒ má»Ÿ bÃ i há»c. Vui lÃ²ng thá»­ láº¡i.';
    }
}

async function openIslandTheory(lesson) {
    if (!lesson || !ensureIslandModalDom()) {
        if (!hasTheoryModalDom()) console.error('KhÃ´ng thá»ƒ má»Ÿ lÃ½ thuyáº¿t vÃ¬ thiáº¿u pháº§n tá»­ DOM cáº§n thiáº¿t.');
        return;
    }
    const requestId = ++islandTheoryRequest;
    const theoryHtml = safeTheoryHtml(theoryHtmlFor(lesson));
    activeIslandLearning = { lesson, theory: theoryHtml, questions: [] };
    forceShowIslandModal(islandTheoryModal);
    islandTheoryTitle.textContent = 'LÃ½ thuyáº¿t trÆ°á»›c khi thá»±c chiáº¿n';
    islandTheoryMeta.textContent = `${lesson.title || 'Äáº£o tri thá»©c'} Â· ${lesson.province || selectedProvince?.name || 'Viá»‡t Nam'} Â· ${lesson.difficulty || 'easy'} Â· Äang chuáº©n bá»‹ 5 cÃ¢u há»i`;
    islandTheoryContent.classList.remove('is-loading');
    islandTheoryContent.setAttribute('aria-busy', 'true');
    islandTheoryContent.innerHTML = safeTheoryHtml(theoryHtml);
    resetIslandTheoryConfirmation();

    try {
        const loadIslandContent = window.VieGeoLearningPath?.loadIslandContent;
        if (typeof loadIslandContent !== 'function') throw new Error('KhÃ´ng thá»ƒ khá»Ÿi táº¡o trÃ¬nh táº£i cÃ¢u há»i.');
        const loaded = await loadIslandContent(lesson);
        if (requestId !== islandTheoryRequest || !ensureIslandModalDom() || islandTheoryModal.hidden) return;
        activeIslandLearning = {
            lesson,
            theory: safeTheoryHtml(theoryHtmlFromLoadedContent(lesson, loaded)),
            questions: Array.isArray(loaded?.questions) ? loaded.questions.slice(0, 5) : []
        };
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.innerHTML = safeTheoryHtml(activeIslandLearning.theory);
        const questionCount = activeIslandLearning.questions.length;
        islandTheoryMeta.textContent = `${lesson.title || 'Äáº£o tri thá»©c'} Â· ${lesson.province || selectedProvince?.name || 'Viá»‡t Nam'} Â· ${questionCount} cÃ¢u há»i sáºµn sÃ ng`;
        if (!questionCount) {
            const notice = loaded?.status === 'network-error'
                ? 'Lá»—i Ä‘Æ°á»ng truyá»n hoáº·c mÃ¡y chá»§ Supabase. Vui lÃ²ng kiá»ƒm tra láº¡i máº¡ng!'
                : 'Hiá»‡n chÆ°a cÃ³ cÃ¢u há»i nÃ o cho khu vá»±c nÃ y, vui lÃ²ng quay láº¡i sau!';
            islandTheoryContent.insertAdjacentHTML('beforeend', `<p><strong>ThÃ´ng bÃ¡o:</strong> ${notice}</p>`);
        }
    } catch (error) {
        const message = error?.message || 'KhÃ´ng thá»ƒ káº¿t ná»‘i Supabase.';
        console.error('Lá»—i Supabase khi táº£i ná»™i dung Äáº£o nhá»:', message, error);
        if (requestId !== islandTheoryRequest) return;
        activeIslandLearning = { lesson, theory: safeTheoryHtml(theoryHtmlFor(lesson)), questions: [] };
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.innerHTML = `${safeTheoryHtml(activeIslandLearning.theory)}<p><strong>Lá»—i Ä‘Æ°á»ng truyá»n hoáº·c mÃ¡y chá»§ Supabase.</strong> Vui lÃ²ng kiá»ƒm tra láº¡i máº¡ng!</p>`;
        if (window.VieGeoUI?.warning) window.VieGeoUI.warning('Lá»—i Ä‘Æ°á»ng truyá»n hoáº·c mÃ¡y chá»§ Supabase. Vui lÃ²ng kiá»ƒm tra láº¡i máº¡ng!');
    } finally {
        if (requestId === islandTheoryRequest && islandTheoryModal && !islandTheoryModal.hidden) {
            updateIslandTheoryStartButton();
        }
    }
}

async function beginIslandQuiz() {
    if (!activeIslandLearning?.lesson) return;
    if (!Array.isArray(activeIslandLearning.questions) || !activeIslandLearning.questions.length) {
        if (typeof VieGeoUI !== 'undefined') VieGeoUI.warning('Hiá»‡n chÆ°a cÃ³ cÃ¢u há»i Ä‘á»ƒ báº¯t Ä‘áº§u bÃ i há»c nÃ y.');
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
        console.error('KhÃ´ng thá»ƒ báº¯t Ä‘áº§u bÃ i há»c Äáº£o nhá»:', error);
        if (typeof VieGeoUI !== 'undefined') VieGeoUI.error('ChÆ°a thá»ƒ báº¯t Ä‘áº§u bÃ i há»c. Vui lÃ²ng thá»­ láº¡i.');
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
        document.getElementById('statHearts').textContent = isPremiumIslandLearner() ? 'âˆž' : state.hearts;
    }
    if (document.getElementById('statStreak')) document.getElementById('statStreak').textContent = state.streak;
    if (document.getElementById('statGems')) document.getElementById('statGems').textContent = state.gems;
    if (document.getElementById('statXp')) document.getElementById('statXp').textContent = state.xp;
}

// Generate the Map based on currentView
function renderMap() {
    mapContainer.innerHTML = '';
    mapContainer.classList.remove('map-learning-route');
    mapContainer.classList.remove('region-grid');
    routeResizeObserver?.disconnect();
    routeResizeObserver = null;
    
    if (currentView === 'regions') {
        mapTitle.textContent = "KhÃ¡m PhÃ¡ Viá»‡t Nam";
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
    updateCompletionTheoryButton();

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
    mapContainer.classList.add('region-grid');
    mapContainer.style.display = 'grid';
    mapContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
    mapContainer.style.gap = '20px';
    
    LEARNING_REGIONS.forEach(region => {
        const card = document.createElement('div');
        card.className = 'bento-card region-card';
        card.style.cursor = 'pointer';
        card.style.borderTop = `4px solid ${region.color}`;
        card.innerHTML = `
            <div style="font-size: 3rem; color: ${region.color};"><i class="fa-solid fa-map"></i></div>
            <h3 style="font-size: 1.5rem; margin-top: 10px;">${region.name}</h3>
            <p style="color: var(--text-dim); margin-top: 5px;">${region.provinces.length} Tá»‰nh/ThÃ nh phá»‘</p>
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
            <p style="color: var(--text-dim); margin-top: 5px; font-size: 0.9rem;">Tiáº¿n Ä‘á»™: ${percent}%</p>
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
        wrapper.dataset.lessonTitle = lesson.title || 'Äáº£o tri thá»©c';
        wrapper.dataset.province = lesson.province || selectedProvince?.name || 'Viá»‡t Nam';
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
            stars.textContent = `${'â­'.repeat(starCount)}${'â˜†'.repeat(3 - starCount)}`;
            stars.setAttribute('aria-label', `${starCount} trÃªn 3 sao`);
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

// One-time learner survey. Supabase/localStorage keeps the UI usable online and offline.
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
    const value = document.querySelector(`input[name="${name}"]:checked`)?.value || '';
    const cleanValue = window.VieGeoSecurity?.sanitizeText
        ? window.VieGeoSecurity.sanitizeText(value, 80)
        : String(value).replace(/<[^>]*>/g, '').trim().slice(0, 80);
    return /^[\w-]+$/.test(cleanValue) ? cleanValue : '';
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
            console.warn('KhÃ´ng thá»ƒ Ä‘á»c tráº¡ng thÃ¡i kháº£o sÃ¡t tá»« Supabase/localStorage, dÃ¹ng báº£n lÆ°u cá»¥c bá»™.', error);
        }
    }

    if (!completed) openSurvey(true);
}

async function saveLearnerSurvey() {
    if (surveySubmitButton?.disabled) return;
    const goal = selectedSurveyValue('surveyGoal');
    const interest = selectedSurveyValue('surveyInterest');
    if (!goal || !interest) {
        VieGeoUI.warning('Vui lÃ²ng chá»n má»¥c tiÃªu vÃ  khu vá»±c báº¡n quan tÃ¢m.');
        return;
    }
    const profile = ensureLearningProfile();
    const previousLabel = surveySubmitButton?.textContent;
    if (surveySubmitButton) {
        surveySubmitButton.disabled = true;
        surveySubmitButton.textContent = 'Äang lÆ°uâ€¦';
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
                surveyCompletedAt: new Date().toISOString()
            }, { merge: true });
        }
        saveGameState(state);
        if (surveyModal) surveyModal.style.display = 'none';
        if (typeof renderProfile === 'function') renderProfile();
        if (typeof showToast === 'function') showToast('ÄÃ£ lÆ°u há»“ sÆ¡ há»c táº­p.');
        else VieGeoUI.success('ÄÃ£ lÆ°u há»“ sÆ¡ há»c táº­p.');
    } catch (error) {
        profile.surveyDone = false;
        console.error('KhÃ´ng thá»ƒ lÆ°u kháº£o sÃ¡t:', error);
        VieGeoUI.error('ChÆ°a thá»ƒ lÆ°u kháº£o sÃ¡t. Vui lÃ²ng thá»­ láº¡i.');
    } finally {
        if (surveySubmitButton) {
            surveySubmitButton.disabled = false;
            surveySubmitButton.textContent = previousLabel || 'LÆ°u kháº£o sÃ¡t';
        }
    }
}

window.VieGeoSurvey = { open: () => openSurvey(true) };
surveySubmitButton?.addEventListener('click', saveLearnerSurvey);
initializeLearnerSurvey();


/* =========================================================
   100% ISLAND COMPLETION & CONSOLIDATED THEORY REVIEW MODAL
   ========================================================= */

function checkAllIslandsCompleted(province) {
    if (!province) return false;
    const lessons = (window.VieGeoLearningPath && typeof window.VieGeoLearningPath.getLessonsForProvince === 'function')
        ? window.VieGeoLearningPath.getLessonsForProvince(province, state.selectedDifficulty)
        : (province.lessons || []);
    if (!lessons.length) return false;
    const completedCount = lessons.filter(l => state.completedNodes && state.completedNodes.includes(l.id)).length;
    return completedCount === lessons.length || completedCount >= 34;
}

function updateCompletionTheoryButton() {
    const actionsContainer = document.getElementById('mapHeaderActions');
    if (!actionsContainer) return;

    if (currentView === 'lessons' && selectedProvince && checkAllIslandsCompleted(selectedProvince)) {
        actionsContainer.innerHTML = `
            <button id="btnReviewAllTheory" type="button" onclick="openAllIslandsTheoryModal(selectedProvince)" class="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold p-3 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 border border-amber-300/40 text-sm md:text-base cursor-pointer glow-btn">
                <span>ðŸ“–</span> Xem láº¡i toÃ n bá»™ LÃ½ thuyáº¿t
            </button>
        `;
    } else {
        actionsContainer.innerHTML = '';
    }
}

async function openAllIslandsTheoryModal(province) {
    const modal = document.getElementById('allIslandsTheoryModal');
    if (!modal) return;

    modal.style.display = 'block';
    modal.hidden = false;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const titleEl = document.getElementById('allTheoryModalTitle');
    const subEl = document.getElementById('allTheoryModalSub');
    const container = document.getElementById('allTheoryCardsContainer');
    const searchInput = document.getElementById('allTheorySearchInput');

    const provName = province ? province.name : 'Táº¥t cáº£ 34 Äáº£o';
    if (titleEl) titleEl.textContent = `Tá»”NG Há»¢P LÃ THUYáº¾T - ${provName.toUpperCase()}`;
    if (subEl) subEl.textContent = `Danh sÃ¡ch lÃ½ thuyáº¿t 34 Ä‘áº£o tri thá»©c tá»‰nh ${provName} Ä‘Æ°á»£c tá»•ng há»£p Ä‘áº§y Ä‘á»§.`;
    if (searchInput) searchInput.value = '';

    if (container) {
        container.innerHTML = '<div class="text-center py-12 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-3xl mb-3"></i><p>Äang tá»•ng há»£p dá»¯ liá»‡u lÃ½ thuyáº¿t 34 Ä‘áº£o...</p></div>';
    }

    const supabaseClient = window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    const islandDataMap = new Map();

    for (let i = 1; i <= 34; i++) {
        const defaultTitle = i === 34 ? 'BOSS CUá»I Â· Chinh phá»¥c tá»‰nh thÃ nh' : (i % 11 === 0 ? `Tráº¡m kiá»ƒm tra ${i}` : `Äáº£o nhá» ${i}`);
        islandDataMap.set(i, {
            islandIndex: i,
            title: defaultTitle,
            topic: `Chá»§ Ä‘á» Äáº£o ${i}`,
            theory: `Ná»™i dung trá»ng tÃ¢m cá»§a Äáº£o nhá» ${i}: Ghi nhá»› kiáº¿n thá»©c cÆ¡ báº£n, cÃ¡c tá»« khÃ³a Ä‘á»‹a lÃ­ quan trá»ng vÃ  liÃªn há»‡ thá»±c táº¿ tá»‰nh thÃ nh ${provName} Ä‘ang khÃ¡m phÃ¡.`
        });
    }

    if (supabaseClient && typeof supabaseClient.from === 'function' && province) {
        try {
            const { data, error } = await supabaseClient
                .from('questions')
                .select('province,island,topic,theory,island_theory')
                .eq('province', normalizeProvinceSlug(province.name))
                .limit(300);

            if (error) throw error;
            if (Array.isArray(data) && data.length) {
                data.forEach(d => {
                    const idx = Number(d.subIsland || d.sub_island || d.islandIndex || d.island_index || (String(d.island || '').match(/\d+/)?.[0])) || 0;
                    if (idx >= 1 && idx <= 34) {
                        const existing = islandDataMap.get(idx);
                        if (existing) {
                            if (d.topic) existing.topic = d.topic;
                            if (d.island_theory || d.islandTheory || d.islandTheoryContent || d.islandTheoryText || d.theory) {
                                existing.theory = d.island_theory || d.islandTheory || d.islandTheoryContent || d.islandTheoryText || d.theory;
                            }
                        }
                    }
                });
            }
        } catch (err) {
            console.warn('KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u lÃ½ thuyáº¿t tá»« Supabase:', err);
        }
    }

    if (window.VieGeoLearningPath && typeof window.VieGeoLearningPath.getLessonsForProvince === 'function' && province) {
        const lessons = window.VieGeoLearningPath.getLessonsForProvince(province, state?.selectedDifficulty || 'easy');
        lessons.forEach(l => {
            const idx = l.islandIndex;
            if (idx && islandDataMap.has(idx)) {
                const item = islandDataMap.get(idx);
                if (l.title && (!item.topic || item.topic.startsWith('Chá»§ Ä‘á» Äáº£o'))) item.topic = l.title;
            }
        });
    }

    window.currentAllTheoryList = [...islandDataMap.values()];
    renderTheoryCards(window.currentAllTheoryList);
}

function closeAllIslandsTheoryModal() {
    const modal = document.getElementById('allIslandsTheoryModal');
    if (modal) {
        modal.style.display = 'none';
        modal.hidden = true;
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function renderTheoryCards(islandsList) {
    const container = document.getElementById('allTheoryCardsContainer');
    if (!container) return;

    if (!islandsList.length) {
        container.innerHTML = '<p class="text-center text-slate-400 py-8">KhÃ´ng tÃ¬m tháº¥y ná»™i dung phÃ¹ há»£p.</p>';
        return;
    }

    container.innerHTML = islandsList.map(item => `
        <div class="theory-card-item bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/60 rounded-2xl p-6 transition-all shadow-md hover:shadow-xl group" data-search-text="${(item.title + ' ' + item.topic + ' ' + item.theory).toLowerCase()}">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/60">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black flex items-center justify-center text-sm shadow-sm">
                        ${item.islandIndex}
                    </span>
                    <div>
                        <h3 class="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">${item.title}</h3>
                        <p class="text-xs text-amber-400/90 font-medium"><i class="fa-solid fa-bookmark"></i> ${item.topic}</p>
                    </div>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/50">
                    Äáº£o ${item.islandIndex}/34
                </span>
            </div>
            <div class="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                ${item.theory}
            </div>
        </div>
    `).join('');
}

window.checkAllIslandsCompleted = checkAllIslandsCompleted;
window.openAllIslandsTheoryModal = openAllIslandsTheoryModal;
window.closeAllIslandsTheoryModal = closeAllIslandsTheoryModal;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('allTheorySearchInput')?.addEventListener('input', function(e) {
        const query = (e.target.value || '').toLowerCase().trim();
        const cards = document.querySelectorAll('.theory-card-item');
        cards.forEach(card => {
            const text = card.dataset.searchText || '';
            card.style.display = (!query || text.includes(query)) ? 'block' : 'none';
        });
    });
});



