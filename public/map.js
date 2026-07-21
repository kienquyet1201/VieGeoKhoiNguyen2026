// ============================================================================
// VieGeo - map.js (Rendering Learning Path Multi-Tier)
// ============================================================================

const mapContainer = document.getElementById('mapViewContainer');
const mapTitle = document.getElementById('mapTitle');
const btnMapBack = document.getElementById('btnMapBack');
const mapSearchInput = document.getElementById('mapSearchInput');
let state = getGameState();

let currentView = 'regions'; // regions | provinces | lessons
let selectedRegion = null;
let selectedProvince = null;
let mapSearchTerm = '';

mapSearchInput?.addEventListener('input', event => {
    mapSearchTerm = event.target.value.toLowerCase().trim();
    renderMap();
});

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
        card.classList.toggle('hidden', Boolean(mapSearchTerm && !region.name.toLowerCase().includes(mapSearchTerm)));
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
            ? window.VieGeoLearningPath.getLessonsForProvince(prov, state.selectedGrade)
            : prov.lessons;
        // Calculate completion
        let completed = 0;
        provinceLessons.forEach(l => {
            if (state.completedNodes && state.completedNodes.includes(l.id)) completed++;
        });
        const percent = Math.round((completed / provinceLessons.length) * 100) || 0;
        
        const card = document.createElement('div');
        card.className = 'bento-card';
        card.classList.toggle('hidden', Boolean(mapSearchTerm && !prov.name.toLowerCase().includes(mapSearchTerm)));
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

function renderLessons() {
    mapContainer.style.display = 'flex';
    mapContainer.style.flexDirection = 'column';
    mapContainer.style.alignItems = 'center';
    mapContainer.style.gap = '25px'; // Increased gap for better zigzag look
    const lessons = (window.VieGeoLearningPath && typeof window.VieGeoLearningPath.getLessonsForProvince === 'function')
        ? window.VieGeoLearningPath.getLessonsForProvince(selectedProvince, state.selectedGrade)
        : selectedProvince.lessons;
    
    // Zigzag offsets array
    const offsets = [0, -50, -80, -50, 0, 50, 80, 50];
    
    lessons.forEach((lesson, index) => {
        const isCompleted = state.completedNodes && state.completedNodes.includes(lesson.id);
        const prevCompleted = index === 0 || (state.completedNodes && state.completedNodes.includes(lessons[index-1].id));
        
        // Colors for grades
        let nodeColor = 'rgba(255,255,255,0.1)';
        let iconColor = 'var(--text-dim)';
        if (isCompleted) {
            const result = state.lessonResults && state.lessonResults[lesson.id];
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
        
        let icon = 'fa-star';
        if (lesson.type === 'theory') icon = 'fa-book-open';
        if (lesson.type === 'quiz_midterm' || lesson.type === 'quiz_final') icon = 'fa-crown';
        
        const wrapper = document.createElement('div');
        wrapper.classList.toggle('hidden', Boolean(mapSearchTerm && !lesson.title.toLowerCase().includes(mapSearchTerm)));
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.position = 'relative'; // For absolute line positioning
        
        // Apply zigzag offset
        const currentOffset = offsets[index % offsets.length];
        wrapper.style.transform = `translateX(${currentOffset}px)`;
        wrapper.style.zIndex = '1';
        
        const btn = document.createElement('button');
        btn.className = 'node-btn ' + (isCompleted ? 'completed' : (prevCompleted ? 'current' : 'locked'));
        btn.style.background = nodeColor;
        btn.innerHTML = `<i class="fa-solid ${icon}" style="color: ${iconColor}; font-size: 1.5rem;"></i>`;
        
        const label = document.createElement('div');
        label.style.marginTop = '8px';
        label.style.fontWeight = 'bold';
        label.style.color = prevCompleted || isCompleted ? '#fff' : 'var(--text-dim)';
        label.textContent = lesson.title;
        label.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)'; // Make label readable if lines cross it
        
        btn.onclick = () => {
            if (isCompleted || prevCompleted) {
                localStorage.setItem('VieGeo_current_lesson', lesson.id);
                localStorage.setItem('VieGeo_mode', 'normal');
                window.location.href = 'lesson.html';
            } else {
                if (typeof showToast === 'function') {
                    showToast("Bạn cần hoàn thành bài trước đó!", true);
                } else {
                    VieGeoUI.warning("Bạn cần hoàn thành bài trước đó!");
                }
            }
        };
        
        wrapper.appendChild(btn);
        wrapper.appendChild(label);
        
        // Connector line inside wrapper pointing to the next node
        if (index < lessons.length - 1) {
            const nextOffset = offsets[(index + 1) % offsets.length];
            const dx = nextOffset - currentOffset;
            const dy = 95; // Approx: button height + label + gap (70 + 25)
            const length = Math.sqrt(dx*dx + dy*dy);
            const angle = Math.atan2(dx, dy) * -180 / Math.PI;

            const line = document.createElement('div');
            line.style.width = '10px';
            line.style.height = `${length}px`;
            line.style.background = isCompleted ? '#58cc02' : 'rgba(255,255,255,0.1)';
            line.style.position = 'absolute';
            line.style.top = '35px'; // Start from center of the button (70/2 = 35)
            line.style.left = '50%';
            line.style.transformOrigin = '50% 0';
            line.style.transform = `translateX(-50%) rotate(${angle}deg)`;
            line.style.borderRadius = '5px';
            line.style.zIndex = '-1'; // Put line behind button
            
            wrapper.appendChild(line);
        }
        
        mapContainer.appendChild(wrapper);
    });
}

// Initial render
updateStatsUI();
renderMap();

// One-time learner survey. Firestore is the source of truth; localStorage only keeps the UI usable offline.
const surveyModal = document.getElementById('surveyModal');
const surveyGoal = document.getElementById('surveyGoal');
const surveyInterest = document.getElementById('surveyInterest');
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
    if (surveyGoal && profile.goal) surveyGoal.value = profile.goal;
    if (surveyInterest && profile.interests && profile.interests[0]) surveyInterest.value = profile.interests[0];
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
    if (!surveyGoal || !surveyInterest) return;
    const profile = ensureLearningProfile();
    const previousLabel = surveySubmitButton?.textContent;
    if (surveySubmitButton) {
        surveySubmitButton.disabled = true;
        surveySubmitButton.textContent = 'Đang lưu…';
    }

    profile.goal = surveyGoal.value;
    profile.interests = [surveyInterest.value];
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
