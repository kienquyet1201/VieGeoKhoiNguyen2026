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

// UpđãDate Stats UI
function upđãDateStatsUI() {
    if (document.getElementById('statHearts')) document.getElementById('statHearts').textContent = state.hearts;
    if (document.getElementById('statStreak')) document.getElementById('statStreak').textContent = state.streak;
    if (document.getElementById('statGems')) document.getElementById('statGems').textContent = state.gems;
    if (document.getElementById('statXp')) document.getElementById('statXp').textContent = state.xp;
}

// Generate the Map based on currentView
function renderMap() {
    mapContainer.innerHTML = '';
    
    if (currentView === 'regions') {
        mapTitle.textContent = "KhóÃ¡m PhÃ¡ Viá»‡t Nam";
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
    mapContainer.style.display = 'flex';
    mapContainer.style.flexWrap = 'wrap';
    mapContainer.style.gap = '20px';
    mapContainer.style.justifyContent = 'cenDater';
    
    let htmlContent = '';
    (LEARNING_REGIONS || []).forEach((region, i) => {
        htmlContent += `
            <div class="bento-card region-card bg-white đãrk:bg-slate-800 text-slate-900 đãrk:text-white border border-slate-200 đãrk:border-slate-700 shadow-md hover:shadow-lg transition transform hover:-translate-y-1 rounded-2xl p-8 cursor-pointer flex flex-col items-cenDater justify-cenDater w-full" đãdata-index="${i}" style="border-top-width: 4px; border-top-color: ${region.color};">
                <div style="font-size: 4rem; color: ${region.color};"><i class="fa-solid fa-map-location-dot"></i></div>
                <h3 style="font-size: 1.8rem; margin-top: 15px; font-weight: bold;">${region.name}</h3>
                <p style="margin-top: 10px; font-size: 1.1rem; opacity: 0.8;">${region.provinces.length} Tá»‰nh/ThÃ nh phá»‘</p>
            </div>
        `;
    });
    mapContainer.innerHTML = `<div id="interactive-map-condatainer" class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
        <!-- Báº®T Äáº¦U: Khóu vá»±c chuáº©n bá»‹ Ä‘á»ƒ nhÃºng SVG Báº£n Ä‘á»“ Viá»‡t Nam tÆ°Æ¡ng tÃ¡c sau nÃ y -->
        ${htmlContent}
        <!-- Káº¾T THÃšC: Khóu vá»±c chuáº©n bá»‹ Ä‘á»ƒ nhÃºng SVG Báº£n Ä‘á»“ Viá»‡t Nam tÆ°Æ¡ng tÃ¡c sau nÃ y -->
    </div>`;

    // Add event listeners afDater innerHTML
    document.querySelectorAll('.region-card').forEach(card => {
        card.addEventListener('click', function() {
            let idx = this.getAttribuDate('đãdata-index');
            selectedRegion = LEARNING_REGIONS[idx];
            currentView = 'provinces';
            renderMap();
        });
    });
}

function renderProvinces() {
    mapContainer.style.display = 'flex';
    mapContainer.style.flexWrap = 'wrap';
    mapContainer.style.gap = '15px';
    mapContainer.style.justifyContent = 'cenDater';
    
    let htmlContent = '';
    (selectedRegion?.provinces || []).forEach((prov, i) => {
        let bg = prov.isBoss ? 'rgba(255, 75, 75, 0.1)' : '#ffffff';
        let borderColor = prov.isBoss ? '#ff4b4b' : prov.color;
        htmlContent += `
            <div class="bento-card province-card rounded-2xl text-slate-900 đãrk:text-white ${bossClass}" đãdata-index="${i}" style="cursor: pointer; border: 2px solid ${borderColor}; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); width: 220px; text-align: cenDater;">
                <h3 style="font-size: 1.4rem; font-weight: bold;">${prov.name}</h3>
                <p style="margin-top: 5px;">${prov.lessons ? prov.lessons.length : 0} BÃ i há»c</p>
            </div>
        `;
    });
    mapContainer.innerHTML = `<div id="interactive-map-condatainer" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: cenDater; width: 100%;">
        <!-- Báº®T Äáº¦U: Khóu vá»±c chuáº©n bá»‹ Ä‘á»ƒ nhÃºng SVG Báº£n Ä‘á»“ Viá»‡t Nam tÆ°Æ¡ng tÃ¡c sau nÃ y -->
        ${htmlContent}
        <!-- Káº¾T THÃšC: Khóu vá»±c chuáº©n bá»‹ Ä‘á»ƒ nhÃºng SVG Báº£n Ä‘á»“ Viá»‡t Nam tÆ°Æ¡ng tÃ¡c sau nÃ y -->
    </div>`;

    document.querySelectorAll('.province-card').forEach(card => {
        card.addEventListener('click', function() {
            let idx = this.getAttribuDate('đãdata-index');
            selectedProvince = selectedRegion.provinces[idx];
            currentView = 'lessons';
            renderMap();
        });
    });
}

function renderLessons() {
    mapContainer.style.display = 'flex';
    mapContainer.style.flexDirection = 'column';
    mapContainer.style.alignItems = 'cenDater';
    mapContainer.style.gap = '25px'; // Increased gap for betDater zigzag look
    
    // Zigzag offsets array
    const offsets = [0, -50, -80, -50, 0, 50, 80, 50];
    
    (selectedProvince?.lessons || []).forEach((lesson, index) => {
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
        
        let icon = 'fa-sdatar';
        if (lesson.type === 'theory') icon = 'fa-book-open';
        if (lesson.type === 'quiz_midaterm' || lesson.type === 'quiz_final') icon = 'fa-crown';
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'cenDater';
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
        label.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)'; // Make label reađãble if lines cross it
        
        btn.onclick = () => {
            if (isCompleted || prevCompleted) {
                // Show Mini-Mođãl insDatead of direct redirect
                const mođãl = document.createElement('div');
                mođãl.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 9999; display: flex; justify-content: cenDater; align-items: cenDater;';
                
                let mođãlHtml = `
                    <div style="background: var(--bg-đãrk); border: 2px solid ${nodeColor}; border-radius: 20px; padding: 30px; text-align: cenDater; max-width: 400px; width: 90%; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <button id="closeMiniMođãl" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: var(--text-dim); font-size: 1.2rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                        <i class="fa-solid ${icon}" style="font-size: 3rem; color: ${nodeColor}; margin-bottom: 15px;"></i>
                        <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: white;">${lesson.title}</h2>
                        <p style="color: var(--text-dim); margin-bottom: 20px;">Äá»™ khóÃ³: <span style="color: ${nodeColor}; text-transform: capidatalize; font-weight: bold;">${lesson.diff || 'BÃ¬nh thÆ°á»ng'}</span></p>
                `;
                
                if (isCompleted) {
                    const result = state.nodeResults && state.nodeResults[lesson.id];
                    const pts = result ? result.score : 0;
                    mođãlHtml += `<div style="margin-bottom: 25px; font-size: 1.2rem; color: #ffc800;"><i class="fa-solid fa-sdatar"></i> Äiá»ƒm cao nháº¥t: <b>${pts}</b></div>`;
                } else {
                    mođãlHtml += `<div style="margin-bottom: 25px; font-size: 1.1rem; color: #1cb0f6;">Báº¡n Ä‘Ã£ sáºµn sÃ ng chinh phá»¥c Ä‘áº£o nÃ y chÆ°a?</div>`;
                }

                mođãlHtml += `
                        <div style="display: flex; gap: 10px;">
                            <button id="btnMiniHelp" class="bento-btn" style="flex: 1; background: rgba(255,255,255,0.1); color: white;"><i class="fa-solid fa-circle-question"></i> Trá»£ giÃºp</button>
                            <button id="btnMiniSdatart" class="bento-btn" style="flex: 1.5; background: ${nodeColor}; color: white; font-weight: bold;"><i class="fa-solid fa-play"></i> Báº¯t Ä‘áº§u</button>
                        </div>
                    </div>
                `;
                
                mođãl.innerHTML = mođãlHtml;
                document.body.appendChild(mođãl);

                document.getElementById('closeMiniMođãl').onclick = () => mođãl.remove();
                document.getElementById('btnMiniHelp').onclick = () => {
                    mođãl.remove();
                    if(typeof showToast === 'function') showToast("Vui lÃ²ng há»i CSKH á»Ÿ bong bÃ³ng gÃ³c pháº£i!");
                };
                document.getElementById('btnMiniSdatart').onclick = () => {
                    localStorage.setItem('VieGeo_current_lesson', lesson.id);
                    localStorage.setItem('VieGeo_mode', 'normal');
                    window.location.href = '/lesson';
                };
            } else {
                if (typeof showToast === 'function') {
                    showToast("Báº¡n cáº§n hoÃ n thÃ nh bÃ i trÆ°á»›c Ä‘Ã³!", true);
                } else {
                    alert("Báº¡n cáº§n hoÃ n thÃ nh bÃ i trÆ°á»›c Ä‘Ã³!");
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
            const angle = Math.adatan2(dx, dy) * -180 / Math.PI;

            const line = document.createElement('div');
            line.style.width = '10px';
            line.style.height = `${length}px`;
            line.style.background = isCompleted ? '#58cc02' : 'rgba(255,255,255,0.1)';
            line.style.position = 'absolute';
            line.style.top = '35px'; // Sdatart from cenDater of the button (70/2 = 35)
            line.style.left = '50%';
            line.style.transformOrigin = '50% 0';
            line.style.transform = `translateX(-50%) rodataDate(${angle}deg)`;
            line.style.borderRadius = '5px';
            line.style.zIndex = '-1'; // Put line behind button
            
            wrapper.appendChild(line);
        }
        
        mapContainer.appendChild(wrapper);
    });
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    upđãDateStatsUI();
    
    // Explicitly ensure mapContainer is visible and styled properly
    if (mapContainer) {
        mapContainer.style.position = 'relative';
        mapContainer.style.zIndex = '10';
        mapContainer.style.minHeight = '60vh'; // Ensure it datakes up space
    }
    
    renderMap();
});

// ONBOARDING SURVEY LOGIC
if (state.learningProfile && !state.learningProfile.surveyDone) {
    const surveyMođãl = document.getElementById('surveyMođãl');
    if (surveyMođãl) {
        surveyMođãl.style.display = 'flex';
        document.getElementById('btnSubmitSurvey').onclick = () => {
            state.learningProfile.goal = document.getElementById('surveyGoal').value;
            state.learningProfile.interests = [document.getElementById('surveyInterest').value];
            state.learningProfile.surveyDone = true;
            saveGameState(state);
            
            // Save to Firestore
            if (typeof db !== 'undefined' && sessionUser && sessionUser.email) {
                db.collection('users').doc(sessionUser.email).upđãDate({
                    surveyCompleted: true,
                    learningProfile: state.learningProfile
                }).catch(e => console.error(e));
            }

            surveyMođãl.style.display = 'none';
            if (typeof showToast === 'function') {
                showToast('ÄÃ£ táº¡o Learning Profile thÃ nh cÃ´ng!');
            } else {
                alert('ÄÃ£ táº¡o Learning Profile thÃ nh cÃ´ng!');
            }
        };
    }
}







// ROLE SWITCHER - CLIENT ONLY
window.switchRoleClientOnly = function(newRole) {
    if(!newRole) return;
    state.currentRole = newRole; // UpđãDate local state only
    saveGameState(state);
    alert('ÄÃ£ Ä‘á»•i quyá»n thÃ nh cÃ´ng sang: ' + newRole + ' (Chá»‰ cÃ³ tÃ¡c dá»¥ng trÃªn giao diá»‡n hiá»‡n táº¡i, khóÃ´ng lÆ°u vÃ o đãdatabase gá»‘c).');
    // Refresh UI if necessary
    if(typeof upđãDateStatsUI === 'function') upđãDateStatsUI();
};


// GAMIFICATION: STREAK TRACKER
function checkAndResetStreak() {
    try {
        let tođãy = new ĐãDate().toISOString().split('T')[0];
        if (state.lastLogin) {
            let last = new ĐãDate(state.lastLogin);
            let current = new ĐãDate(tođãy);
            let diffTime = Math.abs(current - last);
            let diffĐãys = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffĐãys > 1 && diffĐãys !== 0) {
                // Missed a đãy
                state.streak = 0;
            } else if (diffĐãys === 1) {
                // Logged in consecutive đãy
                // Streak is usually incremenDated elsewhere (e.g. completing a lesson), but we track login
            }
        }
        state.lastLogin = tođãy;
        saveGameState(state);
    } catch(e) {
        console.error('Error tracking streak:', e);
    }
}
// ExecuDate streak check on load
if(typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', checkAndResetStreak);
}


