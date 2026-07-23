// ============================================================================
// VieGeo - map.js (Rendering Learning Path Multi-Tier)
// ============================================================================

const mapContainer = document.getElementById('mapViewContainer');
const mapTitle = document.getElementById('mapTitle');
const btnMapBack = document.getElementById('btnMapBack');
let state = window.gameState || getGameState();

let currentView = 'regions'; // regions | provinces | lessons
let selectedRegion = null;
let selectedProvince = null;
let routeResizeObserver = null;
const islandTheoryModal = document.getElementById('islandTheoryModal');
const islandTheoryTitle = document.getElementById('islandTheoryTitle');
const islandTheoryMeta = document.getElementById('islandTheoryMeta');
const islandTheoryContent = document.getElementById('islandTheoryContent');
const btnStartIslandQuiz = document.getElementById('btnStartIslandQuiz');
let activeIslandLearning = null;
let islandTheoryRequest = 0;

function fallbackTheoryFor(lesson) {
    return `Trước khi làm bài, hãy nắm các ý chính của ${lesson.title}.\n\nQuan sát đặc điểm địa lí, ghi nhớ từ khóa quan trọng và liên hệ kiến thức với địa phương đang khám phá. Sau đó, bạn sẽ trả lời 5 câu hỏi để kiểm tra mức độ hiểu bài.`;
}

function emergencyFallbackQuestions() {
    const supplied = window.VieGeoLearningPath?.createFallbackQuestions?.();
    if (Array.isArray(supplied) && supplied.length === 5) return supplied;
    return [
        { question: 'Thủ đô của Việt Nam là thành phố nào?', options: ['Hà Nội', 'Huế', 'Đà Nẵng', 'Cần Thơ'], correctAnswer: 0 },
        { question: 'Việt Nam nằm ở khu vực nào?', options: ['Đông Nam Á', 'Nam Á', 'Tây Á', 'Trung Á'], correctAnswer: 0 },
        { question: 'Biển nào nằm ở phía đông Việt Nam?', options: ['Biển Đông', 'Biển Đen', 'Biển Đỏ', 'Biển Baltic'], correctAnswer: 0 },
        { question: 'Đồng bằng lớn nhất Việt Nam là gì?', options: ['Đồng bằng sông Cửu Long', 'Đồng bằng sông Hồng', 'Đồng bằng duyên hải miền Trung', 'Đồng bằng Thanh Nghệ Tĩnh'], correctAnswer: 0 },
        { question: 'Núi cao nhất Việt Nam là gì?', options: ['Phan-xi-păng', 'Ngọc Linh', 'Tây Côn Lĩnh', 'Bạch Mã'], correctAnswer: 0 }
    ];
}

function closeIslandTheory() {
    if (islandTheoryModal) islandTheoryModal.hidden = true;
    activeIslandLearning = null;
}

function showIslandLoadingFeedback(clickedIsland) {
    const title = clickedIsland?.dataset.lessonTitle || 'Đảo tri thức';
    const province = clickedIsland?.dataset.province || selectedProvince?.name || 'Việt Nam';
    const difficulty = clickedIsland?.dataset.difficulty || 'easy';

    if (!islandTheoryModal) {
        // This should never run on map.html, but it prevents a silent click if
        // the modal markup is accidentally removed in a future layout change.
        window.alert('Đã nhận click! Đang kết nối Firebase...');
        return;
    }

    islandTheoryModal.hidden = false;
    islandTheoryTitle.textContent = title;
    islandTheoryMeta.textContent = `${province} · ${difficulty} · 5 câu hỏi`;
    islandTheoryContent.classList.add('is-loading');
    islandTheoryContent.setAttribute('aria-busy', 'true');
    islandTheoryContent.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Đang tải dữ liệu...';
    if (btnStartIslandQuiz) btnStartIslandQuiz.disabled = true;
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

    console.log('✅ Đã nhận sự kiện click vào đảo:', clickedIsland);
    showIslandLoadingFeedback(clickedIsland);

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
    if (!islandTheoryModal || !lesson) return;
    const requestId = ++islandTheoryRequest;
    activeIslandLearning = { lesson, theory: fallbackTheoryFor(lesson), questions: [] };
    islandTheoryModal.hidden = false;
    islandTheoryTitle.textContent = lesson.title || 'Lý thuyết Đảo nhỏ';
    islandTheoryMeta.textContent = `${lesson.province || selectedProvince?.name || 'Việt Nam'} · ${lesson.difficulty || 'easy'} · 5 câu hỏi`;
    islandTheoryContent.classList.add('is-loading');
    islandTheoryContent.setAttribute('aria-busy', 'true');
    islandTheoryContent.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Đang tải câu hỏi thật từ Firebase...';
    btnStartIslandQuiz.disabled = true;

    try {
        const loadIslandContent = window.VieGeoLearningPath?.loadIslandContent;
        if (typeof loadIslandContent !== 'function') throw new Error('Không thể khởi tạo trình tải câu hỏi.');
        const loaded = await loadIslandContent(lesson);
        if (requestId !== islandTheoryRequest || !islandTheoryModal || islandTheoryModal.hidden) return;
        activeIslandLearning = {
            lesson,
            theory: String(loaded?.theory || fallbackTheoryFor(lesson)).trim(),
            questions: Array.isArray(loaded?.questions) ? loaded.questions.slice(0, 5) : []
        };
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.textContent = activeIslandLearning.theory;
        if (loaded?.isFallback) {
            const notice = 'Lỗi kết nối máy chủ, đang sử dụng dữ liệu dự phòng.';
            if (window.VieGeoUI?.warning) window.VieGeoUI.warning(notice);
            else console.warn(notice);
        }
    } catch (error) {
        console.error('Lỗi Firebase khi tải nội dung Đảo nhỏ:', error);
        if (requestId !== islandTheoryRequest) return;
        activeIslandLearning = { lesson, theory: fallbackTheoryFor(lesson), questions: emergencyFallbackQuestions() };
        islandTheoryContent.classList.remove('is-loading');
        islandTheoryContent.setAttribute('aria-busy', 'false');
        islandTheoryContent.textContent = 'Lỗi kết nối máy chủ, đang sử dụng dữ liệu dự phòng. Bạn vẫn có thể bắt đầu làm bài.';
        if (window.VieGeoUI?.warning) window.VieGeoUI.warning('Lỗi kết nối máy chủ, đang sử dụng dữ liệu dự phòng.');
    } finally {
        if (requestId === islandTheoryRequest && islandTheoryModal && !islandTheoryModal.hidden) {
            btnStartIslandQuiz.disabled = activeIslandLearning?.questions?.length !== 5;
        }
    }
}

async function beginIslandQuiz() {
    if (!activeIslandLearning?.lesson || btnStartIslandQuiz?.disabled) return;
    if (!Array.isArray(activeIslandLearning.questions) || activeIslandLearning.questions.length !== 5) {
        if (typeof VieGeoUI !== 'undefined') VieGeoUI.warning('Cần tải đủ 5 câu hỏi thật từ Firebase trước khi bắt đầu.');
        return;
    }
    btnStartIslandQuiz.disabled = true;
    try {
        if (typeof window.consumeHeart === 'function' && !await window.consumeHeart()) return;
        localStorage.setItem('VieGeo_current_lesson', activeIslandLearning.lesson.id);
        localStorage.setItem('VieGeo_mode', 'normal');
        localStorage.setItem('VieGeo_island_learning', JSON.stringify({
            lessonId: activeIslandLearning.lesson.id,
            theory: activeIslandLearning.theory,
            questions: activeIslandLearning.questions,
            createdAt: Date.now()
        }));
        closeIslandTheory();
        window.location.href = '/lesson';
    } catch (error) {
        console.error('Không thể bắt đầu bài học Đảo nhỏ:', error);
        if (typeof VieGeoUI !== 'undefined') VieGeoUI.error('Chưa thể bắt đầu bài học. Vui lòng thử lại.');
    } finally {
        if (islandTheoryModal && !islandTheoryModal.hidden) btnStartIslandQuiz.disabled = false;
    }
}

document.getElementById('btnCloseIslandTheory')?.addEventListener('click', closeIslandTheory);
btnStartIslandQuiz?.addEventListener('click', beginIslandQuiz);
islandTheoryModal?.addEventListener('click', (event) => {
    if (event.target === islandTheoryModal) closeIslandTheory();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && islandTheoryModal && !islandTheoryModal.hidden) closeIslandTheory();
});

// Islands are rendered again whenever the learner changes region/province.
// Event delegation keeps their click flow intact after every dynamic render.
mapContainer?.addEventListener('click', handleDelegatedIslandClick);

// Update Stats UI
function updateStatsUI() {
    if (document.getElementById('statHearts')) document.getElementById('statHearts').textContent = state.hearts;
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
