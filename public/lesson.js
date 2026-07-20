// ============================================================================
// VieGeo - lesson.js (Enhanced with Arena & Explanations)
// ============================================================================

let state = getGameState();
const nodeId = localStorage.getItem('VieGeo_current_lesson');
const mode = localStorage.getItem('VieGeo_mode') || 'normal'; 
const arenaId = localStorage.getItem('VieGeo_arena_id');

let currentQuestions = [];
let currentIndex = 0;
let isAnswerChecked = false;
let selectedOptionIndex = null;

// DOM Elements
const questionText = document.getElementById('questionText');
const optionsGrid = document.getElementById('optionsGrid');
const bottomBar = document.getElementById('bottomBar');
const btnCheck = document.getElementById('btnCheck');
const feedbackMsg = document.getElementById('feedbackMsg');
const feedbackIcon = document.getElementById('feedbackIcon');
const feedbackText = document.getElementById('feedbackText');
const feedbackExplanation = document.getElementById('feedbackExplanation');
const progressFill = document.getElementById('progressFill');
const heartsCount = document.getElementById('hearts-count');

// Audio
const sfxCorrect = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
const sfxWrong = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
const sfxWin = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');

// ── ARENA VARIABLES ──
let arenaBots = [];
let arenaTimer = null;
let isDoubleXpActive = false;
let matchReward = 0;
let arenaTimerLeft = 60;
let arenaScoreMe = 0;
let arenaScoreOpp = 0;
let towInterval = null;
let madeMistake = false;

function initLesson() {
    if (mode === 'arena') {
        initArena();
    } else {
        initNormal();
    }
}

function initNormal() {
    // Hide Arena UI
    document.getElementById('arenaUI').style.display = 'none';

    // Tìm bài học
    let foundNode = null;
    let foundProvince = null;
    if (typeof LEARNING_REGIONS !== 'undefined') {
        LEARNING_REGIONS.forEach(region => {
            region.provinces.forEach(prov => {
                const n = prov.lessons.find(x => x.id === nodeId);
                if (n) {
                    foundNode = n;
                    foundProvince = prov;
                }
            });
        });
    }

    if (!foundNode) {
        Swal.fire({ icon: 'error', title: 'Đã xảy ra lỗi', text: 'Lỗi tải bài học!' });
        window.location.href = 'map.html';
        return;
    }

    if (foundNode.type === 'theory') {
        document.getElementById('quizContainer').style.display = 'none';
        const tc = document.getElementById('theoryContainer');
        tc.style.display = 'block';
        document.getElementById('theoryTitle').textContent = foundNode.title;
        document.getElementById('theoryImage').src = foundNode.image || '';
        document.getElementById('theoryContent').textContent = foundNode.content;
        
        document.getElementById('btnFinishTheory').onclick = () => {
            finishLesson(foundNode);
        };
        return;
    } else {
        document.getElementById('quizContainer').style.display = 'block';
        document.getElementById('theoryContainer').style.display = 'none';
        currentQuestions = foundNode.questions || [];
        updateHeartsUI();
        loadQuestion();
    }
}

function initArena() {
    // Show Tug of War UI, Hide Normal
    document.getElementById('arenaTugOfWar').style.display = 'flex';
    document.getElementById('normalProgress').style.display = 'none';
    document.getElementById('hearts-count').style.display = 'none';
    document.getElementById('arenaBuffs').style.display = 'flex';

    const matchData = ARENA_MATCHES.find(m => m.id === arenaId);
    if (!matchData) { window.location.href = 'map.html'; return; }
    matchReward = matchData.reward;

    // Load questions based on gradeFilter
    let allQs = [];
    if (typeof PVP_POOL !== 'undefined') {
        const matchingPool = PVP_POOL.find(p => p.grade === matchData.gradeFilter);
        if (matchingPool && matchingPool.nodes) {
            matchingPool.nodes.forEach(node => {
                if (node.questions) {
                    allQs = allQs.concat(node.questions);
                }
            });
        }
    } else if (typeof GAME_UNITS !== 'undefined') {
        // Fallback for old cache
        GAME_UNITS.forEach(u => {
            if (u.grade === matchData.gradeFilter) {
                u.nodes.filter(n => n.type === 'lesson').forEach(n => allQs = allQs.concat(n.questions));
            }
        });
    }
    currentQuestions = allQs.sort(() => 0.5 - Math.random());
    currentIndex = 0;

    arenaScoreMe = 0;
    arenaScoreOpp = 0;
    arenaTimerLeft = 60;
    updateTugOfWarUI();

    document.getElementById('countDouble').textContent = state.inventory.powerupDoubleXp || 0;
    document.getElementById('count5050').textContent = state.inventory.powerup5050 || 0;

    document.getElementById('btnUseDouble').onclick = () => {
        if (state.inventory.powerupDoubleXp > 0 && !isDoubleXpActive) {
            state.inventory.powerupDoubleXp--;
            saveGameState(state);
            isDoubleXpActive = true;
            document.getElementById('countDouble').textContent = state.inventory.powerupDoubleXp;
            document.getElementById('btnUseDouble').style.opacity = '0.5';
            showToast("Đã kích hoạt x2 Điểm cho câu hỏi này!");
        }
    };

    document.getElementById('btnUse5050').onclick = () => {
        if (state.inventory.powerup5050 > 0 && !isAnswerChecked) {
            state.inventory.powerup5050--;
            saveGameState(state);
            document.getElementById('count5050').textContent = state.inventory.powerup5050;
            const q = currentQuestions[currentIndex];
            let hiddenCount = 0;
            const btns = optionsGrid.querySelectorAll('.option-btn');
            btns.forEach((btn, idx) => {
                if (idx !== q.correctAnswer && hiddenCount < 2) {
                    btn.style.visibility = 'hidden';
                    hiddenCount++;
                }
            });
            document.getElementById('btnUse5050').style.opacity = '0.5';
        }
    };

    const roomId = localStorage.getItem('VieGeo_pvp_room');
    const role = localStorage.getItem('VieGeo_pvp_role'); // 'player1' or 'player2'
    
    if(roomId && typeof db !== 'undefined') {
        towInterval = setInterval(() => {
            arenaTimerLeft--;
            document.getElementById('arenaTimerDisplay').textContent = arenaTimerLeft + 's';
            if (arenaTimerLeft <= 0) {
                clearInterval(towInterval);
                finishLesson();
            }
        }, 1000);

        db.collection('pvp_rooms').doc(roomId).onSnapshot(doc => {
            const data = doc.data();
            if(data) {
                if(role === 'player1') {
                    arenaScoreMe = data.p1Score || 0;
                    arenaScoreOpp = data.p2Score || 0;
                } else {
                    arenaScoreMe = data.p2Score || 0;
                    arenaScoreOpp = data.p1Score || 0;
                }
                updateTugOfWarUI();
            }
        });
    }

    loadQuestion();
}

function updateTugOfWarUI() {
    let total = arenaScoreMe + arenaScoreOpp;
    let mePercent = 50;
    if (total > 0) {
        let diff = arenaScoreMe - arenaScoreOpp;
        mePercent = 50 + (diff * 5);
        if (mePercent > 95) mePercent = 95;
        if (mePercent < 5) mePercent = 5;
    }
    document.getElementById('arenaTowMe').style.width = mePercent + '%';
    document.getElementById('arenaTowOpponent').style.width = (100 - mePercent) + '%';
}

function renderArenaLeaderboard() {
    const container = document.getElementById('arenaLeaderboard');
    container.innerHTML = '';
    
    // Sort
    const sorted = [...arenaBots].sort((a,b) => b.score - a.score);
    sorted.forEach((b, idx) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        if (b.isMe) {
            div.style.color = 'var(--green)';
            div.style.fontWeight = 'bold';
        }
        div.innerHTML = `<span>#${idx+1} ${b.name}</span> <span>${b.score}</span>`;
        container.appendChild(div);
    });
}

function updateHeartsUI() {
    const hasInfiniteHearts = state.inventory && state.inventory.infiniteHeartsExpiry && Date.now() < state.inventory.infiniteHeartsExpiry;
    if (hasInfiniteHearts) {
        heartsCount.innerHTML = `<i class="fa-solid fa-heart"></i> ∞`;
    } else {
        heartsCount.innerHTML = `<i class="fa-solid fa-heart"></i> ${state.hearts}`;
    }
}

function updateProgress() {
    const percent = (currentIndex / currentQuestions.length) * 100;
    progressFill.style.width = `${percent}%`;
}

// 2. Load Question
function loadQuestion() {
    updateProgress();
    isAnswerChecked = false;
    selectedOptionIndex = null;
    bottomBar.className = 'bottom-bar';
    feedbackMsg.classList.remove('show');
    feedbackExplanation.style.display = 'none';
    btnCheck.textContent = 'Kiểm tra';
    btnCheck.className = 'btn-check'; 

    // Reset Buffs visually
    if (mode === 'arena') {
        document.getElementById('btnUseDouble').style.opacity = '1';
        document.getElementById('btnUse5050').style.opacity = '1';
        isDoubleXpActive = false;
    }

    if (mode === 'normal' && currentIndex >= currentQuestions.length) {
        finishLesson();
        return;
    }
    if (mode === 'arena' && currentIndex >= currentQuestions.length) {
        currentQuestions = currentQuestions.sort(() => 0.5 - Math.random());
        currentIndex = 0;
    }

    const q = currentQuestions[currentIndex];
    questionText.textContent = q.question;
    
    optionsGrid.innerHTML = q.options.map((opt, idx) => `
        <button class="option-btn" data-index="${idx}">${opt}</button>
    `).join('');

    const btns = optionsGrid.querySelectorAll('.option-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isAnswerChecked) return;
            btns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedOptionIndex = parseInt(btn.dataset.index);
            btnCheck.classList.add('active');
            
            if (mode === 'arena') {
                checkAnswer(); // Thi máy dập
            }
        });
    });
}

// 3. Handle Check Button
btnCheck.addEventListener('click', () => {
    if (!btnCheck.classList.contains('active')) return;

    if (!isAnswerChecked) {
        checkAnswer();
    } else {
        currentIndex++;
        loadQuestion();
    }
});

function checkAnswer() {
    isAnswerChecked = true;
    const q = currentQuestions[currentIndex];
    const btns = optionsGrid.querySelectorAll('.option-btn');
    const selectedBtn = btns[selectedOptionIndex];

    // Show Explanation
    if (q.explanation) {
        feedbackExplanation.style.display = 'block';
        feedbackExplanation.innerHTML = `<i class="fa-solid fa-book-open"></i> <strong>Giải thích:</strong> ${q.explanation}`;
    }

    if (selectedOptionIndex === q.correctAnswer) {
        // Đúng
        sfxCorrect.play();
        selectedBtn.classList.add('correct');
        
        bottomBar.classList.add('state-correct');
        feedbackIcon.innerHTML = `<i class="fa-solid fa-check"></i>`;
        feedbackText.textContent = "Tuyệt vời!";
        feedbackMsg.classList.add('show');
        
        createConfetti(); 
        
        if (mode === 'arena') {
            arenaScoreMe += (isDoubleXpActive ? 2 : 1);
            isDoubleXpActive = false;
            
            // Push to Firebase
            const roomId = localStorage.getItem('VieGeo_pvp_room');
            const role = localStorage.getItem('VieGeo_pvp_role');
            if(roomId && typeof db !== 'undefined') {
                const updateData = {};
                if(role === 'player1') updateData.p1Score = arenaScoreMe;
                else updateData.p2Score = arenaScoreMe;
                db.collection('pvp_rooms').doc(roomId).update(updateData);
            }

            updateTugOfWarUI();
            setTimeout(() => {
                currentIndex++;
                loadQuestion();
            }, 300);
            return;
        }

        btnCheck.textContent = 'Tiếp tục';
        
    } else {
        // Sai
        madeMistake = true;
        sfxWrong.play();
        selectedBtn.classList.add('wrong');
        btns[q.correctAnswer].classList.add('correct');
        
        bottomBar.classList.add('state-wrong');
        feedbackIcon.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        feedbackText.textContent = "Đáp án đúng là: " + q.options[q.correctAnswer];
        feedbackMsg.classList.add('show');
        
        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 400);
        
        if (mode === 'arena') {
            updateTugOfWarUI();
            setTimeout(() => {
                currentIndex++;
                loadQuestion();
            }, 300);
            return;
        }
        
        if (mode === 'normal') {
            const hasInfiniteHearts = state.inventory && state.inventory.infiniteHeartsExpiry && Date.now() < state.inventory.infiniteHeartsExpiry;
            if (!hasInfiniteHearts) {
                state.hearts--;
                updateHeartsUI();
                saveGameState(state);
                
                if (state.hearts <= 0) {
                    btnCheck.textContent = 'Kết thúc';
                    btnCheck.addEventListener('click', () => {
                        window.location.href = 'map.html';
                    }, {once: true});
                    return;
                }
            } else {
                feedbackText.textContent += " (Được bảo vệ bởi Vô Hạn Tim ∞)";
            }
        }

        btnCheck.textContent = 'Tiếp tục';
    }
}

// 4. Finish Logic
function finishLesson() {
    sfxWin.play();
    progressFill.style.width = `100%`;
    feedbackMsg.classList.remove('show');
    feedbackExplanation.style.display = 'none';

    if (mode === 'arena') {
        if (towInterval) clearInterval(towInterval);
        
        let won = (arenaScoreMe > arenaScoreOpp);
        let isTie = (arenaScoreMe === arenaScoreOpp);
        if (isTie) won = true; // Tie goes to player
        
        questionText.textContent = won ? "CHIẾN THẮNG KÉO CO!" : "THẤT BẠI!";
        
        let addedXu = won ? matchReward : Math.floor(matchReward / 3);
        
        optionsGrid.innerHTML = `
            <div style="text-align: center; width:100%; grid-column: span 2;">
                <i class="fa-solid ${won ? 'fa-trophy' : 'fa-skull'}" style="font-size: 5rem; color: ${won ? '#ffc800' : '#ff4b4b'}; margin-bottom: 20px;"></i>
                <h3 style="font-size: 1.5rem; margin-bottom:10px;">${won ? 'Thật áp đảo!' : 'Đối thủ quá mạnh!'}</h3>
                <h3 style="font-size: 1.5rem; color: ${won ? 'var(--green)' : '#ff4b4b'};">+${addedXu} Xu | +${addedXu} XP</h3>
                <h4 style="color: var(--text-dim); margin-top: 10px;">Tỉ số: ${arenaScoreMe} - ${arenaScoreOpp}</h4>
            </div>
        `;
        
        state.xp += addedXu;
        state.gems += addedXu;
        if (won) {
            state.pvpWins = (state.pvpWins || 0) + 1;
            if (typeof showToast === 'function') {
                showToast("🏆 CHÚC MỪNG CHIẾN THẮNG PVP! 🏆");
            }
        }
        
        if (typeof checkAndUnlockAchievements === 'function') {
            checkAndUnlockAchievements(state);
        }
        saveGameState(state);
        
        btnCheck.textContent = 'Trở về Bản đồ';
        btnCheck.classList.add('active');
        btnCheck.onclick = () => window.location.href = 'map.html';

    } else {
        // Normal mode
        questionText.textContent = "Hoàn thành xuất sắc!";
        optionsGrid.innerHTML = `
            <div style="text-align: center; width:100%; grid-column: span 2;">
                <i class="fa-solid fa-gem" style="font-size: 4rem; color: var(--blue); margin-bottom: 20px;"></i>
                <h3 style="font-size: 1.5rem;">+15 XP</h3>
            </div>
        `;
        
        state.xp += 15;
        state.gems += 10;
        
        if (state.questsProgress) {
            state.questsProgress.q1 += 1; 
            state.questsProgress.q2 += 1; 
        }

        if (!state.completedNodes.includes(nodeId)) {
            state.completedNodes.push(nodeId);
        }
        
        if (!madeMistake) {
            state.perfectLessons = (state.perfectLessons || 0) + 1;
        }

        if (typeof checkAndUnlockAchievements === 'function') {
            checkAndUnlockAchievements(state);
        }
        saveGameState(state);
    }

    bottomBar.className = 'bottom-bar state-correct';
    btnCheck.className = 'btn-check active';
    btnCheck.textContent = 'Hoàn tất';

    btnCheck.addEventListener('click', () => {
        window.location.href = 'map.html';
    }, {once: true});
}

function showToast(msg) {
    // Simple alert for lesson page since we don't have the toast container here
    Swal.fire({ icon: 'info', title: 'Thông báo', text: String(msg) }); 
}

function createConfetti() {
    for (let i = 0; i < 30; i++) {
        const conf = document.createElement('div');
        conf.style.position = 'fixed';
        conf.style.width = '10px';
        conf.style.height = '10px';
        conf.style.backgroundColor = ['#58cc02', '#1cb0f6', '#ffc800', '#ce82ff', '#ff4b4b'][Math.floor(Math.random() * 5)];
        conf.style.left = '50%';
        conf.style.top = '50%';
        conf.style.zIndex = '9999';
        conf.style.borderRadius = '50%';
        conf.style.pointerEvents = 'none';
        
        const tx = (Math.random() - 0.5) * 600;
        const ty = (Math.random() - 0.5) * 600 - 300;
        
        conf.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
        });
        
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 1500);
    }
}

// Khởi chạy
initLesson();

