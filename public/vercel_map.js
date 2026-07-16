// ============================================================================
// LearnMatch - map.js (Rendering Learning Path Multi-Tier)
// ============================================================================

const mapContainer = document.getElementById('mapViewContainer');
const mapTitle = document.getElementById('mapTitle');
const btnMapBack = document.getElementById('btnMapBack');
let state = getGameState();

let currentView = 'regions'; // regions | provinces | lessons
let selectedRegion = null;
let selectedProvince = null;

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
        // Calculate completion
        let completed = 0;
        prov.lessons.forEach(l => {
            if (state.completedNodes && state.completedNodes.includes(l.id)) completed++;
        });
        const percent = Math.round((completed / prov.lessons.length) * 100) || 0;
        
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

function renderLessons() {
    mapContainer.style.display = 'flex';
    mapContainer.style.flexDirection = 'column';
    mapContainer.style.alignItems = 'center';
    mapContainer.style.gap = '15px';
    
    selectedProvince.lessons.forEach((lesson, index) => {
        const isCompleted = state.completedNodes && state.completedNodes.includes(lesson.id);
        const prevCompleted = index === 0 || (state.completedNodes && state.completedNodes.includes(selectedProvince.lessons[index-1].id));
        
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
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        
        const btn = document.createElement('button');
        btn.className = 'node-btn ' + (isCompleted ? 'completed' : (prevCompleted ? 'current' : 'locked'));
        btn.style.background = nodeColor;
        btn.innerHTML = `<i class="fa-solid ${icon}" style="color: ${iconColor}; font-size: 1.5rem;"></i>`;
        
        const label = document.createElement('div');
        label.style.marginTop = '8px';
        label.style.fontWeight = 'bold';
        label.style.color = prevCompleted || isCompleted ? '#fff' : 'var(--text-dim)';
        label.textContent = lesson.title;
        
        btn.onclick = () => {
            if (isCompleted || prevCompleted) {
                localStorage.setItem('LearnMatch_current_lesson', lesson.id);
                localStorage.setItem('LearnMatch_mode', 'normal');
                window.location.href = 'lesson.html';
            } else {
                if (typeof showToast === 'function') {
                    showToast("Bạn cần hoàn thành bài trước đó!", true);
                } else {
                    alert("Bạn cần hoàn thành bài trước đó!");
                }
            }
        };
        
        wrapper.appendChild(btn);
        wrapper.appendChild(label);
        mapContainer.appendChild(wrapper);
        
        // Connector line
        if (index < selectedProvince.lessons.length - 1) {
            const line = document.createElement('div');
            line.style.width = '4px';
            line.style.height = '40px';
            line.style.background = isCompleted ? '#58cc02' : 'rgba(255,255,255,0.1)';
            mapContainer.appendChild(line);
        }
    });
}

// Initial render
updateStatsUI();
renderMap();

// ONBOARDING SURVEY LOGIC
if (state.learningProfile && !state.learningProfile.surveyDone) {
    const surveyModal = document.getElementById('surveyModal');
    if (surveyModal) {
        surveyModal.style.display = 'flex';
        document.getElementById('btnSubmitSurvey').onclick = () => {
            state.learningProfile.goal = document.getElementById('surveyGoal').value;
            state.learningProfile.interests.push(document.getElementById('surveyInterest').value);
            state.learningProfile.surveyDone = true;
            localStorage.setItem('LearnMatch_state', JSON.stringify(state));
            surveyModal.style.display = 'none';
            if (typeof showToast === 'function') {
                showToast('Đã tạo Learning Profile thành công!');
            } else {
                alert('Đã tạo Learning Profile thành công!');
            }
        };
    }
}
