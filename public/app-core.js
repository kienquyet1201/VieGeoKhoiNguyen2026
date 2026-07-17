function generateAIInsight(state) {
    if (!state.nodeResults || Object.keys(state.nodeResults).length === 0) {
        return "H? th?ng AI dang thu th?p thï¿½m d? li?u t? cï¿½c bï¿½i ki?m tra c?a b?n d? dua ra nh?n xï¿½t chi ti?t nh?t. Hï¿½y ti?p t?c h?c t?p nhï¿½!";
    }

    let results = Object.values(state.nodeResults);
    let avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
    
    if (avgAccuracy >= 80) {
        return "AI phï¿½n tï¿½ch: B?n c?c k? am hi?u v? ï¿½?a lï¿½ Mi?n B?c (di?m trung bï¿½nh " + Math.round(avgAccuracy) + "%), ki?n th?c r?t v?ng vï¿½ng! Ti?p t?c phï¿½t huy th? m?nh nï¿½y nhï¿½.";
    } else if (avgAccuracy >= 50) {
        return "AI phï¿½n tï¿½ch: B?n n?m du?c ki?n th?c co b?n v? ï¿½?a lï¿½ (di?m trung bï¿½nh " + Math.round(avgAccuracy) + "%), nhung c?n ï¿½n t?p thï¿½m m?t s? chuyï¿½n d? d? d?t k?t qu? xu?t s?c hon.";
    } else {
        return "AI phï¿½n tï¿½ch: B?n dang g?p m?t chï¿½t khï¿½ khan v?i ï¿½?a lï¿½ (di?m trung bï¿½nh " + Math.round(avgAccuracy) + "%). ï¿½?ng lo l?ng, hï¿½y xem l?i cï¿½c bï¿½i h?c lï¿½ thuy?t nhï¿½!";
    }
}
// ============================================================================
// VieGeo - app-core.js (SPA Logic & Rendering - Arena Update)
// ============================================================================

const sessionData = localStorage.getItem('lm_session');
if (!sessionData) {
    if (window.location.search) {
        localStorage.setItem('pending_action', window.location.search);
    }
    window.location.href = '/loginout';
}
const sessionUser = JSON.parse(sessionData);

let gameState = getGameState();

// Kiá»ƒm tra ÄÄƒng nháº­p Háº±ng ngÃ y (Daily Login & Streak Logic)
function checkDailyLogin() {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = gameState.lastLogin;

    if (lastLogin !== today) {
        // Reset cÃ¡c chá»‰ sá»‘ trong ngÃ y
        gameState.learningTimeToday = 0;
        
        if (lastLogin) {
            const lastDate = new Date(lastLogin);
            const currDate = new Date(today);
            const diffDays = Math.ceil(Math.abs(currDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                gameState.streak = (gameState.streak || 0) + 1;
            } else if (diffDays > 1) {
                gameState.streak = 1; // broken streak
            }
        } else {
            gameState.streak = 1;
        }
        gameState.lastLogin = today;
        saveGameState(gameState);
    }
    
    // GÃ¡n biáº¿n isPremium
    gameState.isPremium = (gameState.accountStatus === 'premium');
}
checkDailyLogin();

// Äá»’NG Bá»˜ DATA Tá»ª FIREBASE KHI LOAD TRANG (REALTIME)
function setupRealtimeAuth() {
    if (typeof db === 'undefined') return;
    db.collection('users').doc(sessionUser.email).onSnapshot(async (doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            // Náº¿u bá»‹ admin kick
            if (data.forceLogout) {
                // Reset flag in DB so they can login again later
                await db.collection('users').doc(sessionUser.email).update({ forceLogout: false });
                localStorage.clear();
                alert("TÃ i khoáº£n cá»§a báº¡n Ä‘Ã£ bá»‹ Quáº£n trá»‹ viÃªn Ä‘Äƒng xuáº¥t khá»i há»‡ thá»‘ng!");
                window.location.href = '/loginout';
                return;
            }

                        gameState.xp = data.xp || 0;
            gameState.hearts = data.hearts || 5;

            // Sync Survey Completed status from DB
            if (data.surveyCompleted) {
                if (!gameState.learningProfile) gameState.learningProfile = {};
                gameState.learningProfile.surveyDone = true;
                const surveyModal = document.getElementById('surveyModal');
                if (surveyModal) surveyModal.style.display = 'none';
            }
            gameState.streak = data.streak || 1;
            gameState.gems = data.gems || 0;
            gameState.avatar = data.avatar || "fa-user-astronaut";
            gameState.avatarIsBase64 = data.avatarIsBase64 || false;
            // Cáº­p nháº­t láº¡i accountStatus tá»« server phÃ²ng khi Admin duyá»‡t Premium
            gameState.accountStatus = data.accountStatus || 'free';
            gameState.lastHeartRegenTime = data.lastHeartRegenTime || Date.now();
            
            // Cáº­p nháº­t láº¡i giá»›i háº¡n tim ngay láº­p tá»©c
            const maxHearts = gameState.accountStatus === 'premium' ? 10 : 2;
            if (gameState.hearts > maxHearts) {
                gameState.hearts = maxHearts;
            }

            // LÆ°u Ä‘Ã¨ xuá»‘ng LocalStorage
            saveGameState(gameState);
            
            // Cáº­p nháº­t láº¡i UI
            if(typeof updateHeaderStats === 'function') updateHeaderStats();
            if(typeof renderProfile === 'function' && document.getElementById('tabProfile') && document.getElementById('tabProfile').classList.contains('active')) {
                renderProfile();
            }
        }
    }, (error) => {
        console.error("Lá»—i táº£i data Firebase:", error);
    });
}
setupRealtimeAuth();


function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = isError ? 'var(--holo-1)' : 'var(--holo-3)';
    toast.style.opacity = '1';
    toast.style.bottom = '40px';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.bottom = '-50px';
    }, 3000);
}

// â”€â”€ ONLINE HEARTBEAT â”€â”€
setInterval(() => {
    if (typeof db !== 'undefined' && sessionUser && sessionUser.email) {
        db.collection('users').doc(sessionUser.email).update({
            lastActive: Date.now()
        }).catch(()=>{});
    }
}, 30000); // Má»—i 30 giÃ¢y bÃ¡o cÃ¡o Ä‘ang hoáº¡t Ä‘á»™ng

// â”€â”€ GLOBAL STATS UI & TIMERS â”€â”€
let heartTimerInterval = null;

function updateHeaderStats() {
    document.getElementById('hdrStreak').textContent = gameState.streak;
    document.getElementById('hdrGems').textContent = gameState.gems;
    
    const hdrXp = document.getElementById('hdrXp');
    if (hdrXp) hdrXp.textContent = gameState.xp || 0;
    
    const hdrLevel = document.getElementById('hdrLevel');
    if (hdrLevel && typeof getLevel === 'function') hdrLevel.textContent = getLevel(gameState.xp || 0);
    
    const hdrBadge = document.getElementById('hdrBadge');
    if (hdrBadge) hdrBadge.textContent = gameState.achievementPoints || (gameState.unlockedAchievements ? gameState.unlockedAchievements.length : 0);
    
    // Check Infinite Hearts
    if (gameState.inventory && gameState.inventory.infiniteHeartsExpiry) {
        const now = Date.now();
        if (now < gameState.inventory.infiniteHeartsExpiry) {
            if (!heartTimerInterval) {
                heartTimerInterval = setInterval(updateHeaderStats, 1000);
            }
            const diff = gameState.inventory.infiniteHeartsExpiry - now;
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            document.getElementById('hdrHearts').innerHTML = `âˆž <span style="font-size: 0.8rem; font-weight: normal;">(${m}:${s < 10 ? '0' : ''}${s})</span>`;
            return;
        } else {
            // Expired
            gameState.inventory.infiniteHeartsExpiry = null;
            saveGameState(gameState);
            if (heartTimerInterval) {
                clearInterval(heartTimerInterval);
                heartTimerInterval = null;
            }
        }
    }
    
    // Hiá»ƒn thá»‹ TrÃ¡i tim & Äáº¿m ngÆ°á»£c
    const maxHearts = gameState.accountStatus === 'premium' ? 10 : 2;
    let heartHtml = gameState.hearts;
    
    if (gameState.hearts < maxHearts) {
        if (!heartTimerInterval) {
            heartTimerInterval = setInterval(() => {
                // Force update state & check regen
                gameState = getGameState();
                updateHeaderStats();
            }, 1000);
        }
        
        const now = Date.now();
        const diffMs = now - gameState.lastHeartRegenTime;
        const msPerHeart = 60 * 60 * 1000; // 60 phÃºt
        const remainMs = msPerHeart - diffMs;
        
        if (remainMs > 0) {
            const m = Math.floor(remainMs / 60000);
            const s = Math.floor((remainMs % 60000) / 1000);
            heartHtml = `${gameState.hearts} <span style="font-size: 0.8rem; font-weight: normal; color: #ff8c8c;">(${m}:${s < 10 ? '0' : ''}${s})</span>`;
        }
    } else {
        if (heartTimerInterval) {
            clearInterval(heartTimerInterval);
            heartTimerInterval = null;
        }
    }
    
    document.getElementById('hdrHearts').innerHTML = heartHtml;
}

// â”€â”€ TAB SWITCHING â”€â”€
const navBtns = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

(navBtns || []).forEach(btn => {
    btn.addEventListener('click', () => {
        (navBtns || []).forEach(b => b.classList.remove('active'));
        (tabPanes || []).forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// â”€â”€ RENDER PATH (ISLANDS & FILTER) â”€â”€
const gradeChips = document.querySelectorAll('.grade-chip');
if (gradeChips.length > 0) {
    // Set initial active chip
    (gradeChips || []).forEach(chip => {
        if (chip.getAttribute('data-val') === (gameState.selectedGrade || "all")) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
        
        chip.addEventListener('click', (e) => {
            (gradeChips || []).forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            gameState.selectedGrade = e.target.getAttribute('data-val');
            saveGameState(gameState);
                    });
    });
}



// â”€â”€ RENDER LEADERBOARD (FIREBASE) â”€â”€
async function renderLeaderboard() {
    const lbList = document.getElementById('lbList');
    if (!lbList) return;
    
    lbList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-dim);">Äang táº£i dá»¯ liá»‡u...</div>';
    
    try {
        const snapshot = await db.collection('users').orderBy('xp', 'desc').limit(10).get();
        
        lbList.innerHTML = ''; // XÃ³a loading
        
        let index = 0;
        (snapshot || []).forEach(doc => {
            const user = doc.data();
            const isMe = (user.email === sessionUser.email);
            
            const item = document.createElement('div');
            const isTop3 = index < 3;
            const isTop1 = index === 0;
            
            item.className = `lb-item ${isMe ? 'is-me' : ''}`;
            
            if (isTop1) {
                item.style.background = 'linear-gradient(90deg, rgba(255,200,0,0.2), rgba(255,200,0,0.05))';
                item.style.border = '1px solid #ffc800';
                item.style.transform = 'scale(1.02)';
            } else if (isTop3) {
                item.style.background = 'rgba(255,255,255,0.08)';
            }
            
            let rankHtml = '';
            if (index === 0) rankHtml = `<i class="fa-solid fa-crown" style="color: #ffc800; font-size: 1.5rem;"></i>`;
            else if (index === 1) rankHtml = `<i class="fa-solid fa-medal" style="color: #c0c0c0; font-size: 1.3rem;"></i>`;
            else if (index === 2) rankHtml = `<i class="fa-solid fa-medal" style="color: #cd7f32; font-size: 1.2rem;"></i>`;
            else rankHtml = `<span style="color: var(--text-dim);">${index + 1}</span>`;

            const userLevel = getLevel(user.xp);

            let avatarHtml = '';
            if (user.avatarIsBase64) {
                avatarHtml = `<img src="${user.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                avatarHtml = `<i class="fa-solid ${user.avatar || 'fa-user'}"></i>`;
            }

            const color = (index === 0) ? '#ffc800' : (index === 1) ? '#c0c0c0' : (index === 2) ? '#cd7f32' : '#1cb0f6';

            item.innerHTML = `
                <div class="lb-rank" style="width: 40px; text-align: center;">${rankHtml}</div>
                <div class="lb-avatar" style="background: ${color}33; color: ${color}; position: relative; ${isTop1 ? 'box-shadow: 0 0 15px ' + color : ''}">
                    ${avatarHtml}
                    <div style="position: absolute; bottom: -8px; background: var(--bg-dark); border: 1px solid ${color}; font-size: 0.7rem; border-radius: 10px; padding: 2px 6px;">Lv.${userLevel}</div>
                </div>
                <div class="lb-info">
                    <div class="lb-name" style="${isTop1 ? 'color: #ffc800; font-weight: bold;' : ''}">${user.name || 'ThÃ¡m hiá»ƒm gia'}</div>
                </div>
                <div class="lb-xp">${user.xp || 0} XP</div>
            `;
            lbList.appendChild(item);
            index++;
        });
    } catch (error) {
        console.error("Lá»—i láº¥y Báº£ng xáº¿p háº¡ng:", error);
        lbList.innerHTML = '<div style="text-align:center; padding: 20px; color: #ff4b4b;">Lá»—i káº¿t ná»‘i mÃ¡y chá»§</div>';
    }
}

// â”€â”€ RENDER QUESTS â”€â”€
function renderQuests() {
    const grid = document.getElementById('questGrid');
    grid.innerHTML = '';

    gameState.questsProgress.q3 = gameState.xp; 
    
    // PhÃ¢n chia theo Má»‘c (Milestones)
    const types = [
        { key: 'daily', name: 'Nháº¹ NhÃ ng HÃ ng NgÃ y', icon: 'fa-sun', color: '#1cb0f6' },
        { key: 'epic', name: 'Thá»­ ThÃ¡ch Trá»ng Äiá»ƒm', icon: 'fa-fire', color: '#ff4b4b' },
        { key: 'achievement', name: 'ThÃ nh Tá»±u Äá»i NgÆ°á»i', icon: 'fa-crown', color: '#ffc800' }
    ];

    (types || []).forEach(typeGrp => {
        const typeQuests = DAILY_QUESTS.filter(q => q.type === typeGrp.key);
        if (typeQuests.length === 0) return;

        // Header cá»§a Má»‘c
        const header = document.createElement('div');
        header.style.gridColumn = '1 / -1';
        header.style.marginTop = '20px';
        header.style.marginBottom = '10px';
        header.style.borderBottom = `2px solid ${typeGrp.color}44`;
        header.style.paddingBottom = '5px';
        header.innerHTML = `<h3 style="color: ${typeGrp.color}; font-size: 1.2rem;"><i class="fa-solid ${typeGrp.icon}"></i> ${typeGrp.name}</h3>`;
        grid.appendChild(header);

        (typeQuests || []).forEach(quest => {
            const progress = gameState.questsProgress[quest.id] || 0;
            const percent = Math.min((progress / quest.target) * 100, 100);
            const isDone = progress >= quest.target;

            const card = document.createElement('div');
            card.className = 'bento-card';
            card.innerHTML = `
                <div class="bento-card-title" style="color: ${typeGrp.color};"><i class="fa-solid fa-star"></i> ${quest.title}</div>
                <div class="bento-card-desc">${quest.desc}</div>
                
                <div style="margin-top: auto;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: bold; margin-bottom: 8px;">
                        <span>${progress} / ${quest.target}</span>
                        <span style="color: #ffc800;">+${quest.reward} <i class="fa-solid fa-gem"></i></span>
                    </div>
                    <div style="height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden;">
                        <div style="width: ${percent}%; height: 100%; background: ${isDone ? '#58cc02' : typeGrp.color}; border-radius: 6px;"></div>
                    </div>
                    ${isDone ? `<button class="bento-btn" style="width: 100%; margin-top: 16px; background: #58cc02;">ÄÃ£ nháº­n thÆ°á»Ÿng</button>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

// â”€â”€ RENDER ARENA â”€â”€
function renderArena() {
    // Update Powerups status
    document.getElementById('arenaBuffDouble').textContent = gameState.inventory.powerupDoubleXp || 0;
    document.getElementById('arenaBuff5050').textContent = gameState.inventory.powerup5050 || 0;

    const grid = document.getElementById('arenaGrid');
    grid.innerHTML = '';

    (ARENA_MATCHES || []).forEach(match => {
        const card = document.createElement('div');
        card.className = 'bento-card';
        card.style.borderColor = '#ff4b4b';
        card.innerHTML = `
            <div style="font-size: 3rem; color: #ff4b4b; margin-bottom: -10px;"><i class="fa-solid fa-khanda"></i></div>
            <div class="bento-card-title" style="color: #ff4b4b;">${match.title}</div>
            <div class="bento-card-desc">${match.desc}</div>
            <div style="margin: 10px 0; font-size: 0.9rem;">
                <div><i class="fa-solid fa-users" style="color:#1cb0f6;"></i> Thá»ƒ loáº¡i: 1vs1</div>
                <div><i class="fa-solid fa-trophy" style="color:#ffc800;"></i> Tháº¯ng: +${match.reward} Xu & XP</div>
            </div>
            <button class="bento-btn" style="margin-top: auto; font-size: 1.1rem; background: #ff4b4b; color: white;" onclick="startArena('${match.id}', ${match.entryFee})">
                VÃ o Thi Äáº¥u (${match.entryFee} <i class="fa-solid fa-gem"></i>)
            </button>
        `;
        grid.appendChild(card);
    });
}

window.startArena = async function(arenaId, fee) {
    if (gameState.gems >= fee) {
        gameState.gems -= fee;
        saveGameState(gameState);
        updateHeaderStats();
        
        // Show finding match modal UI
        const arenaTab = document.getElementById('tabArena');
        const oldHTML = arenaTab.innerHTML;
        arenaTab.innerHTML = `
            <div style="text-align: center; margin-top: 100px;">
                <i class="fa-solid fa-satellite-dish fa-spin" style="font-size: 4rem; color: var(--blue); margin-bottom: 20px;"></i>
                <h2 style="font-size: 2rem;">Äang tÃ¬m Ä‘á»‘i thá»§...</h2>
                <p style="color: var(--text-dim); margin-top: 10px;">Vui lÃ²ng chá» má»™t chÃºt Ä‘á»ƒ ghÃ©p tráº­n.</p>
                <p id="matchmakingStatus" style="color: var(--gold); margin-top: 20px; font-weight: bold;"></p>
                <button id="btnCancelMatchmaking" style="display:none; margin: 30px auto; background: rgba(255,75,75,0.1); color: var(--red); border: 1px solid var(--red); padding: 10px 30px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-xmark"></i> Há»§y tÃ¬m kiáº¿m</button>
            </div>
        `;
        
        try {
            const roomsRef = db.collection('pvp_rooms');
            const waitingRooms = await roomsRef.where('status', '==', 'waiting').where('arenaId', '==', arenaId).limit(1).get();
            
            if (!waitingRooms.empty) {
                // Join existing room
                const roomDoc = waitingRooms.docs[0];
                await roomsRef.doc(roomDoc.id).update({
                    status: 'playing',
                    player2: sessionUser.email,
                    p2Name: sessionUser.name,
                    p2Score: 0
                });
                
                document.getElementById('matchmakingStatus').textContent = "ÄÃ£ ghÃ©p Ä‘Æ°á»£c tráº­n! Báº¯t Ä‘áº§u...";
                localStorage.setItem('VieGeo_mode', 'arena');
                localStorage.setItem('VieGeo_arena_id', arenaId);
                localStorage.setItem('VieGeo_pvp_room', roomDoc.id);
                localStorage.setItem('VieGeo_pvp_role', 'player2');
                setTimeout(() => window.location.href = '/lesson', 1500);
            } else {
                // Create new room and wait
                const newRoom = await roomsRef.add({
                    arenaId: arenaId,
                    status: 'waiting',
                    player1: sessionUser.email,
                    p1Name: sessionUser.name,
                    p1Score: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                document.getElementById('matchmakingStatus').textContent = "Äang chá» ngÆ°á»i chÆ¡i khÃ¡c tham gia...";
                
                // Listen for changes
                const unsubscribe = roomsRef.doc(newRoom.id).onSnapshot(doc => {
                    const data = doc.data();
                    if (data && data.status === 'playing') {
                        unsubscribe();
                        const btnCancel = document.getElementById('btnCancelMatchmaking');
                        if (btnCancel) btnCancel.style.display = 'none';
                        document.getElementById('matchmakingStatus').textContent = "Äá»‘i thá»§ Ä‘Ã£ tham gia! Báº¯t Ä‘áº§u...";
                        localStorage.setItem('VieGeo_mode', 'arena');
                        localStorage.setItem('VieGeo_arena_id', arenaId);
                        localStorage.setItem('VieGeo_pvp_room', newRoom.id);
                        localStorage.setItem('VieGeo_pvp_role', 'player1');
                        setTimeout(() => window.location.href = '/lesson', 1500);
                    }
                });

                // Setup cancel logic
                const btnCancel = document.getElementById('btnCancelMatchmaking');
                if (btnCancel) {
                    btnCancel.style.display = 'block';
                    btnCancel.onclick = async () => {
                        btnCancel.disabled = true;
                        btnCancel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Äang há»§y...';
                        unsubscribe(); // Stop listening
                        try {
                            await roomsRef.doc(newRoom.id).delete(); // Remove room
                        } catch(e) {}
                        
                        // Refund fee
                        gameState.gems += fee;
                        saveGameState(gameState);
                        updateHeaderStats();
                        
                        // Restore UI
                        arenaTab.innerHTML = oldHTML;
                        renderArena();
                    };
                }
            }
        } catch(e) {
            console.error(e);
            showToast("Lá»—i ghÃ©p tráº­n!", false);
            arenaTab.innerHTML = oldHTML;
        }
    } else {
        showToast("KhÃ´ng Ä‘á»§ Xu Ä‘á»ƒ mua vÃ© vÃ o!", false);
    }
}

// â”€â”€ RENDER SHOP â”€â”€
function renderShop() {
    const grid = document.getElementById('shopGrid');
    grid.innerHTML = '';

    (SHOP_ITEMS || []).forEach(item => {
        const card = document.createElement('div');
        card.className = 'bento-card';
        card.innerHTML = `
            <div style="font-size: 3rem; color: ${item.color}; margin-bottom: -10px;"><i class="fa-solid ${item.icon}"></i></div>
            <div class="bento-card-title" style="color: ${item.color};">${item.title}</div>
            <div class="bento-card-desc">${item.desc}</div>
            <button class="bento-btn holo-bg" style="margin-top: auto; font-size: 1.1rem;" onclick="buyItem('${item.id}', ${item.price})">
                Mua vá»›i ${item.price} <i class="fa-solid fa-gem"></i>
            </button>
        `;
        grid.appendChild(card);
    });
}

window.buyItem = function(itemId, price) {
    if (gameState.gems >= price) {
        gameState.gems -= price;
        
        if (itemId === "infinite_hearts") {
            gameState.inventory.infiniteHeartsExpiry = Date.now() + 15 * 60 * 1000;
        } else if (itemId === "p_double_xp") {
            gameState.inventory.powerupDoubleXp = (gameState.inventory.powerupDoubleXp || 0) + 1;
        } else if (itemId === "p_5050") {
            gameState.inventory.powerup5050 = (gameState.inventory.powerup5050 || 0) + 1;
        }

        saveGameState(gameState);
        updateHeaderStats();
        renderArena(); // Cáº­p nháº­t láº¡i sá»‘ lÆ°á»£ng bÃ¹a trong tab Ä‘áº¥u trÆ°á»ng
        createConfetti();
        showToast("ÄÃ£ mua thÃ nh cÃ´ng!");
    } else {
        showToast("Báº¡n khÃ´ng Ä‘á»§ ÄÃ¡ quÃ½!", true);
    }
}

// HÃ m phá»¥ trá»£ táº¡o phÃ¡o giáº¥y (CSS)
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
        
        const tx = (Math.random() - 0.5) * 400;
        const ty = (Math.random() - 0.5) * 400 - 200;
        
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

// â”€â”€ RENDER PROFILE â”€â”€
function renderProfile() {
    document.getElementById('profName').textContent = sessionUser.name;
    document.getElementById('profEmail').textContent = sessionUser.email;
    document.getElementById('profStreak').textContent = gameState.streak;
    document.getElementById('profXp').textContent = gameState.xp;
    document.getElementById('profAchPoints').textContent = gameState.achievementPoints || 0;
    
    // NEW: Learning Profile Rendering
    if (gameState.learningProfile && gameState.learningProfile.surveyDone) {
        const goalMap = { 'exam': 'Ã”n thi trÃªn lá»›p', 'knowledge': 'KhÃ¡m phÃ¡ kiáº¿n thá»©c', 'travel': 'YÃªu thÃ­ch du lá»‹ch' };
        const regionMap = { 'north': 'Miá»n Báº¯c', 'central': 'Miá»n Trung', 'south': 'Miá»n Nam' };
        
        let goalText = goalMap[gameState.learningProfile.goal] || 'ChÆ°a rÃµ';
        let interestsText = (gameState.learningProfile.interests || []).map(i => regionMap[i]).join(', ') || 'ChÆ°a rÃµ';
        
        document.getElementById('lpGoal').textContent = goalText;
        document.getElementById('lpInterests').textContent = interestsText;
        
        // Simple AI Synthesis
        let report = `Dá»±a trÃªn káº¿t quáº£ kháº£o sÃ¡t, há»‡ thá»‘ng ghi nháº­n báº¡n cÃ³ má»¥c tiÃªu "${goalText}" vÃ  Ä‘áº·c biá»‡t quan tÃ¢m tá»›i ${interestsText}. `;
        if (gameState.learningProfile.totalQuestionsAnswered > 0) {
            report += `Báº¡n Ä‘Ã£ tráº£ lá»i tá»•ng cá»™ng ${gameState.learningProfile.totalQuestionsAnswered} cÃ¢u há»i luyá»‡n táº­p. Há»‡ thá»‘ng AI Ä‘ang tiáº¿p tá»¥c theo dÃµi tá»‘c Ä‘á»™ há»c vÃ  Ä‘iá»ƒm máº¡nh cá»§a báº¡n Ä‘á»ƒ cÃ¡ nhÃ¢n hÃ³a lá»™ trÃ¬nh tá»‘t hÆ¡n.`;
        } else {
            report += `HÃ£y hoÃ n thÃ nh bÃ i há»c Ä‘áº§u tiÃªn trÃªn báº£n Ä‘á»“ Ä‘á»ƒ AI cÃ³ thá»ƒ Ä‘Ã¡nh giÃ¡ nÄƒng lá»±c cá»§a báº¡n!`;
        }
        document.getElementById('lpReport').textContent = report;
    }

    // Äá»• dá»¯ liá»‡u vÃ o Form
    document.getElementById('editProfName').value = sessionUser.name;
    document.getElementById('editProfEmail').value = sessionUser.email;
    document.getElementById('editProfPhone').value = sessionUser.phone || "";
    
    const lvl = getLevel(gameState.xp);
    document.getElementById('profLevel').textContent = "Cáº¥p " + lvl;
    
    // Account Status
    const profStatus = document.getElementById('profStatus');
    if (gameState.accountStatus === 'premium') {
        profStatus.innerHTML = '<i class="fa-solid fa-crown" style="color: #ffc800;"></i> Premium VIP';
        profStatus.style.borderColor = '#ffc800';
        profStatus.style.color = '#ffc800';
        profStatus.style.background = 'rgba(255, 200, 0, 0.1)';
        // Hide upgrade button if already premium
        const btnUpgrade = profStatus.nextElementSibling;
        if (btnUpgrade && btnUpgrade.tagName === 'BUTTON') {
            btnUpgrade.style.display = 'none';
        }
    } else {
        profStatus.textContent = 'TÃ i khoáº£n: Free';
    }
    
    // Avatar Logic
    const avatarIcon = document.getElementById('profAvatarIcon');
    const avatarIconContainer = document.getElementById('profAvatarIconContainer');
    if (gameState.avatarIsBase64) {
        if(avatarIconContainer) {
            avatarIconContainer.innerHTML = `<img src="${gameState.avatar}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            avatarIcon.className = '';
            avatarIcon.innerHTML = `<img src="${gameState.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:40px;">`;
        }
    } else {
        if(avatarIconContainer) {
            avatarIconContainer.innerHTML = `<i id="profAvatarIcon" class="fa-solid ${gameState.avatar || 'fa-user-astronaut'}"></i>`;
        } else {
            avatarIcon.innerHTML = ''; 
            avatarIcon.className = `fa-solid ${gameState.avatar || 'fa-user-astronaut'}`;
        }
    }
    
    renderAchievements();
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // Sync points with unlocked array length
    if (!gameState.unlockedAchievements) gameState.unlockedAchievements = [];
    gameState.achievementPoints = gameState.unlockedAchievements.length;
    
    const profAchPoints = document.getElementById('profAchPoints');
    if (profAchPoints) profAchPoints.textContent = gameState.achievementPoints;

    (ACHIEVEMENTS_LIST || []).forEach(ach => {
        const isUnlocked = gameState.unlockedAchievements && gameState.unlockedAchievements.includes(ach.id);
        
        let currentProgress = 0;
        if (ach.type === 'pvpWins') currentProgress = gameState.pvpWins || 0;
        if (ach.type === 'perfectLessons') currentProgress = gameState.perfectLessons || 0;
        if (ach.type === 'streak') currentProgress = gameState.streak || 0;
        if (ach.type === 'gems') currentProgress = gameState.gems || 0;
        if (ach.type === 'chestsOpened') currentProgress = gameState.chestsOpened || 0;

        // Cap progress at target
        if (currentProgress > ach.target) currentProgress = ach.target;

        const progressPercent = (currentProgress / ach.target) * 100;
        
        const opacity = isUnlocked ? '1' : '0.4';
        const filter = isUnlocked ? 'none' : 'grayscale(100%)';
        const color = ach.color;

        const card = document.createElement('div');
        card.className = 'bento-card';
        card.style.opacity = opacity;
        card.style.filter = filter;
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '15px';
        card.style.padding = '15px';
        card.style.transition = 'all 0.3s ease';

        if (isUnlocked) {
            card.classList.add('completed-achievement');
            card.style.border = `2px solid ${color}`;
            card.style.background = 'rgba(255,255,255,0.08)';
            card.style.boxShadow = `0 5px 15px ${color}33`; // Append 33 for 20% opacity on hex
        }

        card.innerHTML = `
            <div style="font-size: 2.5rem; color: ${color}; width: 50px; text-align: center;">
                <i class="fa-solid ${ach.icon}"></i>
            </div>
            <div style="flex: 1;">
                <h4 style="margin: 0 0 5px 0; font-size: 1rem; color: white;">${ach.title}</h4>
                <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: var(--text-dim);">${ach.desc}</p>
                ${isUnlocked ? `
                    <div style="font-size: 0.8rem; color: var(--green); font-weight: bold;"><i class="fa-solid fa-check"></i> ÄÃ£ Äáº¡t</div>
                ` : `
                    <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: ${color}; height: 100%; width: ${progressPercent}%;"></div>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 5px; text-align: right;">${currentProgress} / ${ach.target}</div>
                `}
            </div>
        `;
        grid.appendChild(card);
    });
}

const btnSaveProfileElem = document.getElementById('btnSaveProfile');
if (btnSaveProfileElem) {
    btnSaveProfileElem.addEventListener('click', async () => {
        const newName = document.getElementById('editProfName').value.trim();
        const newPhone = document.getElementById('editProfPhone').value.trim();
        const oldPass = document.getElementById('editOldPass').value;
        const newPass = document.getElementById('editNewPass').value;
    
        const btn = btnSaveProfileElem;
    btn.disabled = true;
    btn.textContent = "Äang lÆ°u...";

    try {
        const userDoc = await db.collection('users').doc(sessionUser.email).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const updateData = { name: newName, phone: newPhone };

            if (oldPass || newPass) {
                if (!oldPass || !newPass) {
                    showToast("Vui lÃ²ng nháº­p cáº£ máº­t kháº©u cÅ© vÃ  má»›i!", false);
                    btn.disabled = false;
                    btn.textContent = "LÆ°u Thay Äá»•i";
                    return;
                }
                if (oldPass !== userData.password) {
                    showToast("Máº­t kháº©u cÅ© khÃ´ng chÃ­nh xÃ¡c!", false);
                    btn.disabled = false;
                    btn.textContent = "LÆ°u Thay Äá»•i";
                    return;
                }
                if (newPass.length < 6) {
                    showToast("Máº­t kháº©u má»›i pháº£i tá»« 6 kÃ½ tá»±!", false);
                    btn.disabled = false;
                    btn.textContent = "LÆ°u Thay Äá»•i";
                    return;
                }
                updateData.password = newPass;
            }

            await db.collection('users').doc(sessionUser.email).update(updateData);
            
            sessionUser.name = newName;
            sessionUser.phone = newPhone;
            localStorage.setItem('lm_session', JSON.stringify(sessionUser));
            
            if (gameState.avatar) {
                await db.collection('users').doc(sessionUser.email).update({
                    avatar: gameState.avatar,
                    avatarIsBase64: gameState.avatarIsBase64
                });
            }

            showToast("ÄÃ£ lÆ°u thÃ´ng tin!", true);
            document.getElementById('editOldPass').value = '';
            document.getElementById('editNewPass').value = '';
        }
    } catch(e) {
        showToast("Lá»—i cáº­p nháº­t: " + e.message, false);
    }
    
    btn.disabled = false;
    btn.textContent = "LÆ°u Thay Äá»•i";
    renderProfile();
});
}

window.selectAvatar = function(data, isBase64 = false) {
    gameState.avatar = data;
    gameState.avatarIsBase64 = isBase64;
    saveGameState(gameState);
    renderProfile();
    renderLeaderboard();
    showToast("ÄÃ£ cáº­p nháº­t Avatar!");
}

// Avatar File Upload Logic
const avatarUpload = document.getElementById('avatarUpload');
if (avatarUpload) {
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (giá»›i háº¡n 1MB Ä‘á»ƒ trÃ¡nh phÃ¬nh LocalStorage)
        if (file.size > 1024 * 1024) {
            showToast("áº¢nh quÃ¡ lá»›n! Vui lÃ²ng chá»n áº£nh dÆ°á»›i 1MB.", true);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const base64String = event.target.result;
            selectAvatar(base64String, true);
        };
        reader.readAsDataURL(file);
    });
}

const btnLogoutElem = document.getElementById('btnLogout');
if (btnLogoutElem) {
    btnLogoutElem.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/loginout';
    });
}

// â”€â”€ PREMIUM LOGIC â”€â”€
window.openPremiumModal = function() {
    try {
        const rawEmail = (sessionUser.email || '').replace('@gmail.com', '');
        const safeName = (sessionUser.name || 'USER').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        const rawTransferMsg = `${safeName} ${rawEmail}`.toUpperCase();
        const qrTransferMsg = rawTransferMsg.replace(/\s+/g, '');
        
        const contentEl = document.getElementById('premiumTransferContent');
        if (contentEl) contentEl.textContent = rawTransferMsg;
        
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            qrImg.src = `https://img.vietqr.io/image/970422-0967086871-compact2.png?amount=149000&addInfo=${encodeURIComponent(qrTransferMsg)}&accountName=Dang%20Kien%20Quyet`;
        }
        
        document.getElementById('premiumModal').style.display = 'flex';
    } catch(e) {
        showToast("Lá»—i má»Ÿ báº£ng Premium: " + e.message, true);
    }
};

window.confirmPremiumTransfer = async function() {
    const btnConfirmPremium = document.getElementById('btnConfirmPremium');
    if (!btnConfirmPremium) return;
    
    btnConfirmPremium.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Äang gá»­i...';
    btnConfirmPremium.disabled = true;

    try {
        const rawEmail = (sessionUser.email || '').replace('@gmail.com', '');
        const safeName = (sessionUser.name || 'USER').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        const rawTransferMsg = `${safeName} ${rawEmail}`.toUpperCase();
        const approveLink = window.location.href.split('?')[0] + '?action=approve_premium&target=' + encodeURIComponent(sessionUser.email);

        // Upload to Firebase first
        await db.collection('premium_requests').add({
            status: 'pending',
            email: sessionUser.email,
            name: sessionUser.name,
            transferContent: rawTransferMsg,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Try to send email silently
        if (typeof emailjs !== 'undefined') {
            try {
                emailjs.init('Is8N-wrtdAZpySOJW');
                await emailjs.send('service_iksinb9', 'template_z7kjarh', {
                    to_email: 'kienquyet1201@gmail.com',
                    user_name: sessionUser.name || 'USER',
                    user_email: sessionUser.email,
                    transfer_msg: rawTransferMsg,
                    approve_link: approveLink
                });
            } catch(emailErr) {
                console.error("EmailJS sending failed:", emailErr);
            }
        }

        showToast("ÄÃ£ gá»­i xÃ¡c nháº­n Ä‘áº¿n Quáº£n trá»‹ viÃªn! Vui lÃ²ng chá» pháº£n há»“i.");
        document.getElementById('premiumModal').style.display = 'none';
    } catch(e) {
        showToast("Lá»—i gá»­i yÃªu cáº§u: " + e.message, true);
    }

    btnConfirmPremium.innerHTML = '<i class="fa-solid fa-check"></i> XÃC NHáº¬N ÄÃƒ CHUYá»‚N KHOáº¢N';
    btnConfirmPremium.disabled = false;
};

// Init
updateHeaderStats();
renderLeaderboard();
renderArena();
renderQuests();
renderShop();
renderProfile();
checkAndUnlockAchievements(gameState);


function checkAndUnlockAchievements(state) {
    if (!state.unlockedAchievements) state.unlockedAchievements = [];
    let newlyUnlocked = false;

    (ACHIEVEMENTS_LIST || []).forEach(ach => {
        if (!state.unlockedAchievements.includes(ach.id)) {
            let progress = 0;
            if (ach.type === 'pvpWins') progress = state.pvpWins || 0;
            if (ach.type === 'perfectLessons') progress = state.perfectLessons || 0;
            if (ach.type === 'streak') progress = state.streak || 0;
            if (ach.type === 'gems') progress = state.gems || 0;
            if (ach.type === 'chestsOpened') progress = state.chestsOpened || 0;

            if (progress >= ach.target) {
                state.unlockedAchievements.push(ach.id);
                state.achievementPoints = (state.achievementPoints || 0) + 1;
                newlyUnlocked = true;
                showToast('ÄÃ£ má»Ÿ khÃ³a danh hiá»‡u: ' + ach.title + ' (+1 ThÃ nh tá»±u)');
            }
        }
    });

    if (newlyUnlocked) {
        saveGameState(state);
        // Náº¿u Ä‘ang á»Ÿ mÃ n hÃ¬nh map, update láº¡i UI Profile
        if (typeof renderAchievements === 'function' && document.getElementById('achievementsGrid')) {
            renderAchievements();
            document.getElementById('profAchPoints').textContent = state.achievementPoints || 0;
        }
    }
}

    // ==========================================
    // AUTO APPROVAL WEBHOOK LOGIC
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const targetEmail = urlParams.get('target');
    
    if (action === 'approve_premium' && targetEmail) {
        if (sessionUser.email === 'dkq407311@gmail.com' || sessionUser.email === 'kienquyet1201@gmail.com') {
            // Upgrade target user
            db.collection('users').doc(targetEmail).update({ accountStatus: 'premium' })
                .then(() => {
                    showToast('ï¿½ï¿½ phï¿½ duy?t Premium thï¿½nh cï¿½ng cho: ' + targetEmail);
                    // Remove url params
                    window.history.replaceState({}, document.title, window.location.pathname);
                })
                .catch((err) => {
                    showToast('L?i phï¿½ duy?t: ' + err.message, true);
                });
        } else {
            showToast('B?n khï¿½ng cï¿½ quy?n duy?t Premium!', true);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

// ==========================================
// PHASE 2 ONBOARDING & MAP DATA LOADING
// ==========================================
function checkOnboarding() {
    if (!gameState.grade) {
        // Redirect v? trang ch? Next.js d? ch?n l?p b?ng React Component
        window.location.href = '/';
    } else {
        if (typeof renderMap === 'function') {
            renderMap();
        }
    }
}

window.selectGrade = function(grade) {
    gameState.grade = grade;
    saveGameState(gameState);
    if (typeof db !== 'undefined' && sessionUser && sessionUser.email) {
        db.collection('users').doc(sessionUser.email).update({ grade: grade }).then(() => {
            window.location.reload();
        }).catch(()=>{});
    } else {
        window.location.reload();
    }
};

window.openGradeSwitch = function() {
    gameState.grade = null;
    checkOnboarding();
};


// â”€â”€ PREMIUM LOGIC â”€â”€
window.openPremiumModal = function() {
    try {
        const rawEmail = (sessionUser.email || '').replace('@gmail.com', '');
        const safeName = (sessionUser.name || 'USER').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        const rawTransferMsg = `${safeName} ${rawEmail}`.toUpperCase();
        const qrTransferMsg = rawTransferMsg.replace(/\s+/g, '');
        
        const contentEl = document.getElementById('premiumTransferContent');
        if (contentEl) contentEl.textContent = rawTransferMsg;
        
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            qrImg.src = `https://img.vietqr.io/image/970422-0967086871-compact2.png?amount=149000&addInfo=${encodeURIComponent(qrTransferMsg)}&accountName=Dang%20Kien%20Quyet`;
        }
        
        document.getElementById('premiumModal').style.display = 'flex';
    } catch(e) {
        showToast("Lá»—i má»Ÿ báº£ng Premium: " + e.message, true);
    }
};

window.confirmPremiumTransfer = async function() {
    const btnConfirmPremium = document.getElementById('btnConfirmPremium');
    if (!btnConfirmPremium) return;
    
    btnConfirmPremium.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Äang gá»­i...';
    btnConfirmPremium.disabled = true;

    try {
        const rawEmail = (sessionUser.email || '').replace('@gmail.com', '');
        const safeName = (sessionUser.name || 'USER').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        const rawTransferMsg = `${safeName} ${rawEmail}`.toUpperCase();
        const approveLink = window.location.href.split('?')[0] + '?action=approve_premium&target=' + encodeURIComponent(sessionUser.email);

        // Upload to Firebase first
        await db.collection('premium_requests').add({
            status: 'pending',
            email: sessionUser.email,
            name: sessionUser.name,
            transferContent: rawTransferMsg,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Try to send email silently
        if (typeof emailjs !== 'undefined') {
            try {
                emailjs.init('Is8N-wrtdAZpySOJW');
                await emailjs.send('service_iksinb9', 'template_z7kjarh', {
                    to_email: 'kienquyet1201@gmail.com',
                    user_name: sessionUser.name || 'USER',
                    user_email: sessionUser.email,
                    transfer_msg: rawTransferMsg,
                    approve_link: approveLink
                });
            } catch(emailErr) {
                console.error("EmailJS sending failed:", emailErr);
            }
        }

        showToast("ÄÃ£ gá»­i xÃ¡c nháº­n Ä‘áº¿n Quáº£n trá»‹ viÃªn! Vui lÃ²ng chá» pháº£n há»“i.");
        document.getElementById('premiumModal').style.display = 'none';
    } catch(e) {
        showToast("Lá»—i gá»­i yÃªu cáº§u: " + e.message, true);
    }

    btnConfirmPremium.innerHTML = '<i class="fa-solid fa-check"></i> XÃC NHáº¬N ÄÃƒ CHUYá»‚N KHOáº¢N';
    btnConfirmPremium.disabled = false;
};

// Init
updateHeaderStats();
renderLeaderboard();
renderArena();
renderQuests();
renderShop();
renderProfile();
checkAndUnlockAchievements(gameState);


function checkAndUnlockAchievements(state) {
    if (!state.unlockedAchievements) state.unlockedAchievements = [];
    let newlyUnlocked = false;

    (ACHIEVEMENTS_LIST || []).forEach(ach => {
        if (!state.unlockedAchievements.includes(ach.id)) {
            let progress = 0;
            if (ach.type === 'pvpWins') progress = state.pvpWins || 0;
            if (ach.type === 'perfectLessons') progress = state.perfectLessons || 0;
            if (ach.type === 'streak') progress = state.streak || 0;
            if (ach.type === 'gems') progress = state.gems || 0;
            if (ach.type === 'chestsOpened') progress = state.chestsOpened || 0;

            if (progress >= ach.target) {
                state.unlockedAchievements.push(ach.id);
                state.achievementPoints = (state.achievementPoints || 0) + 1;
                newlyUnlocked = true;
                showToast('ÄÃ£ má»Ÿ khÃ³a danh hiá»‡u: ' + ach.title + ' (+1 ThÃ nh tá»±u)');
            }
        }
    });

    if (newlyUnlocked) {
        saveGameState(state);
        // Náº¿u Ä‘ang á»Ÿ mÃ n hÃ¬nh map, update láº¡i UI Profile
        if (typeof renderAchievements === 'function' && document.getElementById('achievementsGrid')) {
            renderAchievements();
            document.getElementById('profAchPoints').textContent = state.achievementPoints || 0;
        }
    }
}




// ==========================================
// STREAK FIRE ANIMATION
// ==========================================
function playFireStreakAnimation() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; flex-direction: column; justify-content: center; align-items: center; pointer-events: none; opacity: 0; transition: opacity 0.5s;';
    
    overlay.innerHTML = `
        <i class="fa-solid fa-fire" style="font-size: 8rem; color: #ffc800; text-shadow: 0 0 50px #ff4b4b; animation: burn 0.5s infinite alternate;"></i>
        <h1 style="font-size: 3rem; color: white; margin-top: 20px; text-shadow: 0 5px 15px rgba(0,0,0,0.5);">STREAK +1</h1>
        <style>
            @keyframes burn { from { transform: scale(1); filter: brightness(1); } to { transform: scale(1.1); filter: brightness(1.3); } }
        </style>
    `;
    
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
    }, 2500);
}

// ==========================================
// CHAT BUBBLE WIDGET (REAL-TIME FIREBASE)
// ==========================================
let unsubscribeUserChat = null;
let currentChatDocId = null;

async function initChatBubble() {
    if (!sessionUser || !sessionUser.email || typeof db === 'undefined') return;
    
    currentChatDocId = sessionUser.email; // Use email as unique chat session per user

    const bubble = document.createElement('div');
    bubble.id = 'chatBubbleWidget';
    bubble.style.cssText = 'position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: var(--blue); border-radius: 50%; box-shadow: 0 10px 20px rgba(28,176,246,0.4); display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 9999; transition: 0.3s;';
    bubble.innerHTML = '<i class="fa-solid fa-comment-dots" style="color: white; font-size: 1.8rem;"></i>';
    
    const panel = document.createElement('div');
    panel.id = 'chatPanelWidget';
    panel.style.cssText = 'position: fixed; bottom: 100px; right: 30px; width: 350px; height: 450px; background: var(--bg-dark); border: 1px solid var(--gray-border); border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.5); z-index: 9998; display: none; flex-direction: column; overflow: hidden;';
    panel.innerHTML = `
        <div style="background: var(--blue); padding: 15px; color: white; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: bold;"><i class="fa-solid fa-headset"></i> CSKH Ho tro</div>
            <button id="closeChatPanel" style="background:none; border:none; color:white; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div id="chatMessages" style="flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
            <div style="align-self: flex-start; background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 15px 15px 15px 5px; max-width: 80%; font-size: 0.9rem;">Xin chao! Minh la tro ly VieGeo. Ban can ho tro gi?</div>
        </div>
        <div id="chatRatingArea" style="display: none; padding: 15px; background: rgba(255,200,0,0.1); border-top: 1px solid var(--gray-border); text-align: center;">
            <p style="margin: 0 0 10px 0; color: var(--gold); font-weight: bold;">Danh gia phien ho tro</p>
            <div style="display: flex; justify-content: center; gap: 10px; font-size: 1.5rem; color: var(--text-dim); cursor: pointer;" id="starRating">
                <i class="fa-solid fa-star" data-val="1"></i>
                <i class="fa-solid fa-star" data-val="2"></i>
                <i class="fa-solid fa-star" data-val="3"></i>
                <i class="fa-solid fa-star" data-val="4"></i>
                <i class="fa-solid fa-star" data-val="5"></i>
            </div>
        </div>
        <div id="chatInputArea" style="padding: 10px; border-top: 1px solid var(--gray-border); display: flex; gap: 10px;">
            <input type="file" id="chatImageInput" style="display:none;" accept="image/*">
            <button id="btnChatImage" onclick="document.getElementById('chatImageInput').click()" style="background: rgba(255,255,255,0.1); color: white; border: none; padding: 10px 15px; border-radius: 10px; cursor: pointer;"><i class="fa-solid fa-image"></i></button>
            <input type="text" id="chatInput" placeholder="Nháº­p tin nháº¯n..." style="flex: 1; padding: 10px; border-radius: 10px; border: none; background: rgba(255,255,255,0.1); color: white; outline: none;">
            <button id="btnSendChat" style="background: var(--blue); color: white; border: none; padding: 10px 15px; border-radius: 10px; cursor: pointer;"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
    `;
    
    document.body.appendChild(bubble);
    document.body.appendChild(panel);
    
    bubble.onclick = () => {
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        if(panel.style.display === 'flex') {
            document.getElementById('chatInput').focus();
            const msgContainer = document.getElementById('chatMessages');
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }
    };
    
    document.getElementById('closeChatPanel').onclick = () => panel.style.display = 'none';

    // Ensure main doc exists
    await db.collection('support_chats').doc(currentChatDocId).set({
        userEmail: sessionUser.email,
        userName: sessionUser.name || 'NgÆ°á»i dÃ¹ng',
        status: 'open',
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Listen to messages
    const msgContainer = document.getElementById('chatMessages');
    unsubscribeUserChat = db.collection('support_chats').doc(currentChatDocId).collection('messages').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        msgContainer.innerHTML = '<div style="align-self: flex-start; background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 15px 15px 15px 5px; max-width: 80%; font-size: 0.9rem;">ChÃ o báº¡n, mÃ¬nh lÃ  trá»£ lÃ½ VieGeo. Báº¡n cáº§n há»— trá»£ gÃ¬?</div>';
        
        (snapshot || []).forEach(doc => {
            const data = doc.data();
            const isUser = data.senderRole === 'user';
            
            let contentHtml = data.text;
            if (data.imageUrl) {
                contentHtml += `<br><img src="${data.imageUrl}" style="max-width: 100%; border-radius: 10px; margin-top: 5px; cursor: pointer;" onclick="window.open('${data.imageUrl}', '_blank')">`;
            }
            
            msgContainer.innerHTML += `<div style="align-self: ${isUser ? 'flex-end' : 'flex-start'}; background: ${isUser ? 'var(--blue)' : 'rgba(255,255,255,0.1)'}; padding: 10px 15px; border-radius: ${isUser ? '15px 15px 5px 15px' : '15px 15px 15px 5px'}; max-width: 80%; font-size: 0.9rem;">${contentHtml}</div>`;
        });
        msgContainer.scrollTop = msgContainer.scrollHeight;
    });

    // Listen to chat status for Rating
    db.collection('support_chats').doc(currentChatDocId).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.status === 'closed' && !data.rating) {
                document.getElementById('chatInputArea').style.display = 'none';
                document.getElementById('chatRatingArea').style.display = 'block';
            } else if (data.status === 'closed' && data.rating) {
                document.getElementById('chatInputArea').style.display = 'none';
                document.getElementById('chatRatingArea').style.display = 'none';
            } else {
                document.getElementById('chatInputArea').style.display = 'flex';
                document.getElementById('chatRatingArea').style.display = 'none';
            }
        }
    });

    // Rating Logic
    const stars = document.querySelectorAll('#starRating i');
    (stars || []).forEach(s => {
        s.onclick = async () => {
            const val = parseInt(s.getAttribute('data-val'));
            try {
                await db.collection('support_chats').doc(currentChatDocId).update({
                    rating: val
                });
                document.getElementById('chatRatingArea').innerHTML = '<p style="color: var(--green); margin:0; font-weight:bold;"><i class="fa-solid fa-check"></i> Cáº£m Æ¡n báº¡n Ä‘Ã£ Ä‘Ã¡nh giÃ¡!</p>';
            } catch(e) { console.error(e); }
        };
        s.onmouseover = () => {
            const val = parseInt(s.getAttribute('data-val'));
            (stars || []).forEach(st => {
                st.style.color = parseInt(st.getAttribute('data-val')) <= val ? 'var(--gold)' : 'var(--text-dim)';
            });
        };
        s.onmouseout = () => {
            (stars || []).forEach(st => st.style.color = 'var(--text-dim)');
        };
    });
    
    const sendMsg = async () => {
        const inp = document.getElementById('chatInput');
        const txt = inp.value.trim();
        if(!txt) return;
        inp.value = '';
        
        try {
            await db.collection('support_chats').doc(currentChatDocId).collection('messages').add({
                text: txt,
                senderRole: 'user',
                senderEmail: sessionUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('support_chats').doc(currentChatDocId).update({
                status: 'open',
                lastMessage: "User: " + txt,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                userName: sessionUser.name || 'NgÆ°á»i dÃ¹ng',
                userEmail: sessionUser.email
            });
            
            // AI Fallback logic (22:00 -> 07:00)
            const hour = new Date().getHours();
            if (hour >= 22 || hour <= 7) {
                setTimeout(async () => {
                    const aiReply = "ChÃ o báº¡n, hiá»‡n táº¡i CSKH Ä‘ang nghá»‰ ngÆ¡i (22:00 - 07:00). TÃ´i lÃ  trá»£ lÃ½ AI. YÃªu cáº§u cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n vÃ  CSKH sáº½ há»— trá»£ sá»›m nháº¥t vÃ o sÃ¡ng hÃ´m sau. Xin cáº£m Æ¡n!";
                    await db.collection('support_chats').doc(currentChatDocId).collection('messages').add({
                        text: aiReply,
                        senderRole: 'cs',
                        senderEmail: 'bot@viegeo.online',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    await db.collection('support_chats').doc(currentChatDocId).update({
                        lastMessage: "AI: " + aiReply,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }, 1500);
            }
        } catch(e) { console.error(e); }
    };
    
    // Image Upload Logic
    const imageInput = document.getElementById('chatImageInput');
    if (imageInput) {
        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // UI feedback
            const inp = document.getElementById('chatInput');
            inp.placeholder = "Äang táº£i áº£nh lÃªn...";
            inp.disabled = true;
            
            try {
                const storageRef = firebase.storage().ref();
                const fileRef = storageRef.child(`chat_images/${currentChatDocId}/${Date.now()}_${file.name}`);
                const snapshot = await fileRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                
                await db.collection('support_chats').doc(currentChatDocId).collection('messages').add({
                    text: "ÄÃ£ gá»­i má»™t áº£nh",
                    imageUrl: downloadURL,
                    senderRole: 'user',
                    senderEmail: sessionUser.email,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                await db.collection('support_chats').doc(currentChatDocId).update({
                    status: 'open',
                    lastMessage: "User: ÄÃ£ gá»­i má»™t áº£nh",
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                
            } catch (error) {
                console.error("Lá»—i upload áº£nh:", error);
                alert("Lá»—i táº£i áº£nh. Vui lÃ²ng thá»­ láº¡i.");
            } finally {
                inp.placeholder = "Nháº­p tin nháº¯n...";
                inp.disabled = false;
                imageInput.value = "";
            }
        });
    }
    
    document.getElementById('btnSendChat').onclick = sendMsg;
    document.getElementById('chatInput').onkeypress = (e) => { if(e.key==='Enter') sendMsg(); };
}

setTimeout(initChatBubble, 1000);

// ==========================================
// TASKBAR LOGIC (NEW)
// ==========================================

window.toggleTheme = function() {
    const isLight = document.body.classList.toggle('light-mode');
    const icon = document.getElementById('themeIcon');
    if (isLight) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
};

window.openParentModal = function() {
    document.getElementById('parentPinModal').style.display = 'flex';
};

window.verifyParentPin = function() {
    const pin = document.getElementById('parentPinInput').value;
    if (pin === '1234') {
        window.location.href = '/parent';
    } else {
        showToast('MÃ£ PIN khÃ´ng Ä‘Ãºng!', true);
    }
};

const btnLogoutMap = document.getElementById('btnLogoutMap');
if (btnLogoutMap) {
    btnLogoutMap.addEventListener('click', () => {
        localStorage.clear();
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().signOut().then(() => {
                window.location.href = '/loginout';
            }).catch(() => {
                window.location.href = '/loginout';
            });
        } else {
            window.location.href = '/loginout';
        }
    });
}

// Sync dropdown to current grade
setTimeout(() => {
    const gradeSelectDropdown = document.getElementById('gradeSelectDropdown');
    if (gradeSelectDropdown && gameState.grade) {
        gradeSelectDropdown.value = gameState.grade;
    }
}, 500);





// REDO SURVEY LOGIC
window.redoSurvey = function() {
    if (typeof db !== 'undefined' && sessionUser && sessionUser.email) {
        db.collection('users').doc(sessionUser.email).update({
            surveyCompleted: false
        }).then(() => {
            if (gameState.learningProfile) gameState.learningProfile.surveyDone = false;
            saveGameState(gameState);
            const surveyModal = document.getElementById('surveyModal');
            if (surveyModal) {
                surveyModal.style.display = 'flex';
            }
        });
    } else {
        if (gameState.learningProfile) gameState.learningProfile.surveyDone = false;
        saveGameState(gameState);
        const surveyModal = document.getElementById('surveyModal');
        if (surveyModal) {
            surveyModal.style.display = 'flex';
        }
    }
};


// ==========================================
// ROLE SWITCHER LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const roleSwitcher = document.getElementById('globalRoleSwitcher');
    if (roleSwitcher && sessionUser && sessionUser.roles) {
        // Ch? hi?n th? n?u role th?t lï¿½ admin ho?c cs
        if (sessionUser.roles.includes('admin') || sessionUser.roles.includes('cs')) {
            roleSwitcher.classList.remove('hidden');
            
            // Set giï¿½ tr? hi?n t?i
            if (sessionUser.activeRole) {
                roleSwitcher.value = sessionUser.activeRole;
            }
            
            // X? lï¿½ s? ki?n khi ch?n vai trï¿½ m?i
            roleSwitcher.addEventListener('change', (e) => {
                const newRole = e.target.value;
                if (newRole === 'restore') {
                    // Khï¿½i ph?c quy?n cao nh?t
                    sessionUser.activeRole = sessionUser.roles.includes('admin') ? 'admin' : 'cs';
                } else {
                    sessionUser.activeRole = newRole;
                }
                
                // Luu state vï¿½o LocalStorage, TUY?T ï¿½?I KHï¿½NG LUU Lï¿½N FIRESTORE
                localStorage.setItem('lm_session', JSON.stringify(sessionUser));
                
                // T?i l?i trang d? ï¿½p d?ng quy?n
                window.location.reload();
            });
        }
    }
});



// TELEMETRY & LEARNING PROFILE UPDATE
function updateLearningProfile(userId, quizResult) {
    try {
        console.log(`Updating telemetry for ${userId}...`);
        // Mock logic: Update weakness tags based on wrong answers
        let weaknessTags = [];
        if (quizResult.score < 50) {
            weaknessTags.push('Cáº§n Ã´n táº­p cÆ¡ báº£n');
        }
        
        // Mock state update
        if (typeof state !== 'undefined') {
            if (!state.telemetry) {
                state.telemetry = { timeSpentPerQuestion: [], weaknessTags: [], studyHabits: [] };
            }
            state.telemetry.weaknessTags = [...new Set([...state.telemetry.weaknessTags, ...weaknessTags])];
            if (typeof saveGameState === 'function') saveGameState(state);
        }
    } catch (e) {
        console.error('Error updating learning profile:', e);
    }
}


