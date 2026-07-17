// ============================================================================
// VieGeo - map.js (Rendering Learning Path Multi-Tier)
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
        
        if (prov.isBoss) {
            card.style.border = '2px solid #ff4b4b';
            card.style.background = 'rgba(255, 75, 75, 0.1)';
            card.style.boxShadow = '0 0 15px rgba(255, 75, 75, 0.4)';
        } else {
            card.style.borderTop = `4px solid ${prov.color}`;
        }
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
    
    // Zigzag offsets array
    const offsets = [0, -50, -80, -50, 0, 50, 80, 50];
    
    selectedProvince.lessons.forEach((lesson, index) => {
        const isCompleted = state.completedNodes && state.completedNodes.includes(lesson.id);
        const prevCompleted = index === 0 || (state.completedNodes && state.completedNodes.includes(selectedProvince.lessons[index-1].id));
        
        // Colors for grades
        let nodeColor = 'rgba(255,255,255,0.1)';
        let iconColor = 'var(--text-dim)';
        if (isCompleted) {
            const result = state.nodeResults && state.nodeResults[lesson.id];
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
                // Show Mini-Modal instead of direct redirect
                const modal = document.createElement('div');
                modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 9999; display: flex; justify-content: center; align-items: center;';
                
                let modalHtml = `
                    <div style="background: var(--bg-dark); border: 2px solid ${nodeColor}; border-radius: 20px; padding: 30px; text-align: center; max-width: 400px; width: 90%; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <button id="closeMiniModal" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: var(--text-dim); font-size: 1.2rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                        <i class="fa-solid ${icon}" style="font-size: 3rem; color: ${nodeColor}; margin-bottom: 15px;"></i>
                        <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: white;">${lesson.title}</h2>
                        <p style="color: var(--text-dim); margin-bottom: 20px;">Độ khó: <span style="color: ${nodeColor}; text-transform: capitalize; font-weight: bold;">${lesson.diff || 'Bình thường'}</span></p>
                `;
                
                if (isCompleted) {
                    const result = state.nodeResults && state.nodeResults[lesson.id];
                    const pts = result ? result.score : 0;
                    modalHtml += `<div style="margin-bottom: 25px; font-size: 1.2rem; color: #ffc800;"><i class="fa-solid fa-star"></i> Điểm cao nhất: <b>${pts}</b></div>`;
                } else {
                    modalHtml += `<div style="margin-bottom: 25px; font-size: 1.1rem; color: #1cb0f6;">Bạn đã sẵn sàng chinh phục đảo này chưa?</div>`;
                }

                modalHtml += `
                        <div style="display: flex; gap: 10px;">
                            <button id="btnMiniHelp" class="bento-btn" style="flex: 1; background: rgba(255,255,255,0.1); color: white;"><i class="fa-solid fa-circle-question"></i> Trợ giúp</button>
                            <button id="btnMiniStart" class="bento-btn" style="flex: 1.5; background: ${nodeColor}; color: white; font-weight: bold;"><i class="fa-solid fa-play"></i> Bắt đầu</button>
                        </div>
                    </div>
                `;
                
                modal.innerHTML = modalHtml;
                document.body.appendChild(modal);

                document.getElementById('closeMiniModal').onclick = () => modal.remove();
                document.getElementById('btnMiniHelp').onclick = () => {
                    modal.remove();
                    if(typeof showToast === 'function') showToast("Vui lòng hỏi CSKH ở bong bóng góc phải!");
                };
                document.getElementById('btnMiniStart').onclick = () => {
                    localStorage.setItem('VieGeo_current_lesson', lesson.id);
                    localStorage.setItem('VieGeo_mode', 'normal');
                    window.location.href = 'lesson.html';
                };
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
        
        // Connector line inside wrapper pointing to the next node
        if (index < selectedProvince.lessons.length - 1) {
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
document.addEventListener('DOMContentLoaded', () => {
    updateStatsUI();
    
    // Explicitly ensure mapContainer is visible and styled properly
    if (mapContainer) {
        mapContainer.style.position = 'relative';
        mapContainer.style.zIndex = '10';
        mapContainer.style.minHeight = '60vh'; // Ensure it takes up space
    }
    
    renderMap();
});

// ONBOARDING SURVEY LOGIC
if (state.learningProfile && !state.learningProfile.surveyDone) {
    const surveyModal = document.getElementById('surveyModal');
    if (surveyModal) {
        surveyModal.style.display = 'flex';
        document.getElementById('btnSubmitSurvey').onclick = () => {
            state.learningProfile.goal = document.getElementById('surveyGoal').value;
            state.learningProfile.interests = [document.getElementById('surveyInterest').value];
            state.learningProfile.surveyDone = true;
            saveGameState(state);
            
            // Save to Firestore
            if (typeof db !== 'undefined' && sessionUser && sessionUser.email) {
                db.collection('users').doc(sessionUser.email).update({
                    surveyCompleted: true,
                    learningProfile: state.learningProfile
                }).catch(e => console.error(e));
            }

            surveyModal.style.display = 'none';
            if (typeof showToast === 'function') {
                showToast('Đã tạo Learning Profile thành công!');
            } else {
                alert('Đã tạo Learning Profile thành công!');
            }
        };
    }
}




