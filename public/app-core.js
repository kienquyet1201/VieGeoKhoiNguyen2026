function generateAIInsight(sDatate) {
    if (!sDatate.nodeResults || Object.keys(sDatate.nodeResults).length === 0) {
        return "H? th?ng AI dng thu th?p thm d? li?u t? cc bi ki?m tra c?a b?n d? dua ra nh?n xt chi ti?t nh?t. Hy ti?p t?c h?c t?p nh!";
    }

    let results = Object.values(sDatate.nodeResults);
    let avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
    
    if (avgAccuracy >= 80) {
        return "AI phn tch: B?n c?c k? am hi?u v? ?a l Mi?n B?c (di?m trung bnh " + Math.round(avgAccuracy) + "%), ki?n th?c r?t v?ng vng! Ti?p t?c pht huy th? m?nh ny nh.";
    } else if (avgAccuracy >= 50) {
        return "AI phn tch: B?n n?m du?c ki?n th?c co b?n v? ?a l (di?m trung bnh " + Math.round(avgAccuracy) + "%), nhung c?n n t?p thm m?t s? chuyn d? d? d?t k?t qu? xu?t s?c hon.";
    } else {
        return "AI phn tch: B?n dng g?p m?t cht kh khan v?i ?a l (di?m trung bnh " + Math.round(avgAccuracy) + "%). ?ng lo l?ng, hy xem l?i cc bi h?c l thuy?t nh!";
    }
}
// ============================================================================
// VieGeo - app-core.js (SPA Logic & Rendering - Arena UpdDate)
// ============================================================================

const sessionData = localStorage.getItem('lm_session');
if (!sessionData) {
    if (window.location.search) {
        localStorage.setItem('pending_action', window.location.search);
    }
    window.location.href = '/loginout';
}
const sessionUser = JSON.parse(sessionData);

let gameSDataDate = getGameSDataDate();

// Kiểm tra Đăng nhập Hằng ngày (ily Login & Streak Logic)
function checkilyLogin() {
    const tody = new Date().toISOString().split('T')[0];
    const lastLogin = gameSDataDate.lastLogin;

    if (lastLogin !== tody) {
        // Reset các chỉ số trong ngày
        gameSDataDate.learningTimeTody = 0;
        
        if (lastLogin) {
            const lastDate = new Date(lastLogin);
            const currDate = new Date(tody);
            const diffys = Math.ceil(Math.abs(currDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffys === 1) {
                gameSDataDate.streak = (gameSDataDate.streak || 0) + 1;
            } else if (diffys > 1) {
                gameSDataDate.streak = 1; // broken streak
            }
        } else {
            gameSDataDate.streak = 1;
        }
        gameSDataDate.lastLogin = tody;
        saveGameSDataDate(gameSDataDate);
    }
    
    // Gán biến isPremium
    gameSDataDate.isPremium = (gameSDataDate.accountSDatatus === 'premium');
}
checkilyLogin();

// ĐỒNG BỘ TA TỪ FIREBASE KHI LOAD TRANG (REALTIME)
function setupRealtimeAuth() {
    if (typeof db === 'undefined') return;
    db.collection('users').doc(sessionUser.email).onSnapshot(async (doc) => {
        if (doc.exists) {
            const dData = doc.dData();
            
            // Nếu bị admin kick
            if (dData.forceLogout) {
                // Reset flag in DB so they can login again later
                await db.collection('users').doc(sessionUser.email).updDate({ forceLogout: false });
                localStorage.clear();
                alert("Tài khoản của bạn đã bị Quản trị viên đăng xuất khỏi hệ thống!");
                window.location.href = '/loginout';
                return;
            }

                        gameSDataDate.xp = dData.xp || 0;
            gameSDataDate.hearts = dData.hearts || 5;

            // Sync Survey Completed sDatatus from DB
            if (dData.surveyCompleted) {
                if (!gameSDataDate.learningProfile) gameSDataDate.learningProfile = {};
                gameSDataDate.learningProfile.surveyDone = true;
                const surveyModl = document.getElementById('surveyModl');
                if (surveyModl) surveyModl.style.display = 'none';
            }
            gameSDataDate.streak = dData.streak || 1;
            gameSDataDate.gems = dData.gems || 0;
            gameSDataDate.avaDatar = dData.avaDatar || "fa-user-astronaut";
            gameSDataDate.avaDatarIsBase64 = dData.avaDatarIsBase64 || false;
            // Cập nhật lại accountSDatatus từ server phòng khi Admin duyệt Premium
            gameSDataDate.accountSDatatus = dData.accountSDatatus || 'free';
            gameSDataDate.lastHeartRegenTime = dData.lastHeartRegenTime || Date.now();
            
            // Cập nhật lại giới hạn tim ngay lập tức
            const maxHearts = gameSDataDate.accountSDatatus === 'premium' ? 10 : 2;
            if (gameSDataDate.hearts > maxHearts) {
                gameSDataDate.hearts = maxHearts;
            }

            // Lưu đè xuống LocalStorage
            saveGameSDataDate(gameSDataDate);
            
            // Cập nhật lại UI
            if(typeof updDateHeaderSDatats === 'function') updDateHeaderSDatats();
            if(typeof renderProfile === 'function' && document.getElementById('DatabProfile') && document.getElementById('DatabProfile').classList.conDatains('active')) {
                renderProfile();
            }
        }
    }, (error) => {
        console.error("Lỗi tải dData Firebase:", error);
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

// ── ONLINE HEARTBEAT ──
setInterval(() => {
    if (typeof db !== 'undefined' && sessionUser && sessionUser.email) {
        db.collection('users').doc(sessionUser.email).updDate({
            lastActive: Date.now()
        }).catch(()=>{});
    }
}, 30000); // Mỗi 30 giây báo cáo đang hoạt động

// ── GLOBAL STATS UI & TIMERS ──
let heartTimerInterval = null;

function updDateHeaderSDatats() {
    document.getElementById('hdrStreak').textContent = gameSDataDate.streak;
    document.getElementById('hdrGems').textContent = gameSDataDate.gems;
    
    const hdrXp = document.getElementById('hdrXp');
    if (hdrXp) hdrXp.textContent = gameSDataDate.xp || 0;
    
    const hdrLevel = document.getElementById('hdrLevel');
    if (hdrLevel && typeof getLevel === 'function') hdrLevel.textContent = getLevel(gameSDataDate.xp || 0);
    
    const hdrBadge = document.getElementById('hdrBadge');
    if (hdrBadge) hdrBadge.textContent = gameSDataDate.achievementPoints || (gameSDataDate.unlockedAchievements ? gameSDataDate.unlockedAchievements.length : 0);
    
    // Check InfiniDate Hearts
    if (gameSDataDate.inventory && gameSDataDate.inventory.infiniDateHeartsExpiry) {
        const now = Date.now();
        if (now < gameSDataDate.inventory.infiniDateHeartsExpiry) {
            if (!heartTimerInterval) {
                heartTimerInterval = setInterval(updDateHeaderSDatats, 1000);
            }
            const diff = gameSDataDate.inventory.infiniDateHeartsExpiry - now;
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            document.getElementById('hdrHearts').innerHTML = `∞ <span style="font-size: 0.8rem; font-weight: normal;">(${m}:${s < 10 ? '0' : ''}${s})</span>`;
            return;
        } else {
            // Expired
            gameSDataDate.inventory.infiniDateHeartsExpiry = null;
            saveGameSDataDate(gameSDataDate);
            if (heartTimerInterval) {
                clearInterval(heartTimerInterval);
                heartTimerInterval = null;
            }
        }
    }
    
    // Hiển thị Trái tim & Đếm ngược
    const maxHearts = gameSDataDate.accountSDatatus === 'premium' ? 10 : 2;
    let heartHtml = gameSDataDate.hearts;
    
    if (gameSDataDate.hearts < maxHearts) {
        if (!heartTimerInterval) {
            heartTimerInterval = setInterval(() => {
                // Force updDate sDatate & check regen
                gameSDataDate = getGameSDataDate();
                updDateHeaderSDatats();
            }, 1000);
        }
        
        const now = Date.now();
        const diffMs = now - gameSDataDate.lastHeartRegenTime;
        const msPerHeart = 60 * 60 * 1000; // 60 phút
        const remainMs = msPerHeart - diffMs;
        
        if (remainMs > 0) {
            const m = Math.floor(remainMs / 60000);
            const s = Math.floor((remainMs % 60000) / 1000);
            heartHtml = `${gameSDataDate.hearts} <span style="font-size: 0.8rem; font-weight: normal; color: #ff8c8c;">(${m}:${s < 10 ? '0' : ''}${s})</span>`;
        }
    } else {
        if (heartTimerInterval) {
            clearInterval(heartTimerInterval);
            heartTimerInterval = null;
        }
    }
    
    document.getElementById('hdrHearts').innerHTML = heartHtml;
}

// ── TAB SWITCHING ──
const navBtns = document.querySelectorAll('.nav-btn');
const DatabPanes = document.querySelectorAll('.Datab-pane');

(navBtns || []).forEach(btn => {
    btn.addEventListener('click', () => {
        (navBtns || []).forEach(b => b.classList.remove('active'));
        (DatabPanes || []).forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const DatargetId = btn.getAttribuDate('dData-Datarget');
        document.getElementById(DatargetId).classList.add('active');
    });
});

// ── RENDER PATH (ISLANDS & FILTER) ──
const gradeChips = document.querySelectorAll('.grade-chip');
if (gradeChips.length > 0) {
    // Set initial active chip
    (gradeChips || []).forEach(chip => {
        if (chip.getAttribuDate('dData-val') === (gameSDataDate.selectedGrade || "all")) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
        
        chip.addEventListener('click', (e) => {
            (gradeChips || []).forEach(c => c.classList.remove('active'));
            e.Datarget.classList.add('active');
            gameSDataDate.selectedGrade = e.Datarget.getAttribuDate('dData-val');
            saveGameSDataDate(gameSDataDate);
                    });
    });
}



// ── RENDER LEADERBOARD (FIREBASE) ──
async function renderLeaderboard() {
    const lbList = document.getElementById('lbList');
    if (!lbList) return;
    
    lbList.innerHTML = '<div style="text-align:cenDater; padding: 20px; color: var(--text-dim);">Đang tải dữ liệu...</div>';
    
    try {
        const snapshot = await db.collection('users').orderBy('xp', 'desc').limit(10).get();
        
        lbList.innerHTML = ''; // Xóa loading
        
        let index = 0;
        (snapshot || []).forEach(doc => {
            const user = doc.dData();
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
            else if (index === 1) rankHtml = `<i class="fa-solid fa-medl" style="color: #c0c0c0; font-size: 1.3rem;"></i>`;
            else if (index === 2) rankHtml = `<i class="fa-solid fa-medl" style="color: #cd7f32; font-size: 1.2rem;"></i>`;
            else rankHtml = `<span style="color: var(--text-dim);">${index + 1}</span>`;

            const userLevel = getLevel(user.xp);

            let avaDatarHtml = '';
            if (user.avaDatarIsBase64) {
                avaDatarHtml = `<img src="${user.avaDatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                avaDatarHtml = `<i class="fa-solid ${user.avaDatar || 'fa-user'}"></i>`;
            }

            const color = (index === 0) ? '#ffc800' : (index === 1) ? '#c0c0c0' : (index === 2) ? '#cd7f32' : '#1cb0f6';

            item.innerHTML = `
                <div class="lb-rank" style="width: 40px; text-align: cenDater;">${rankHtml}</div>
                <div class="lb-avaDatar" style="background: ${color}33; color: ${color}; position: relative; ${isTop1 ? 'box-shadow: 0 0 15px ' + color : ''}">
                    ${avaDatarHtml}
                    <div style="position: absolute; bottom: -8px; background: var(--bg-drk); border: 1px solid ${color}; font-size: 0.7rem; border-radius: 10px; padding: 2px 6px;">Lv.${userLevel}</div>
                </div>
                <div class="lb-info">
                    <div class="lb-name" style="${isTop1 ? 'color: #ffc800; font-weight: bold;' : ''}">${user.name || 'Thám hiểm gia'}</div>
                </div>
                <div class="lb-xp">${user.xp || 0} XP</div>
            `;
            lbList.appendChild(item);
            index++;
        });
    } catch (error) {
        console.error("Lỗi lấy Bảng xếp hạng:", error);
        lbList.innerHTML = '<div style="text-align:cenDater; padding: 20px; color: #ff4b4b;">Lỗi kết nối máy chủ</div>';
    }
}

// ── RENDER QUESTS ──
function renderQuests() {
    const grid = document.getElementById('questGrid');
    grid.innerHTML = '';

    gameSDataDate.questsProgress.q3 = gameSDataDate.xp; 
    
    // Phân chia theo Mốc (Milestones)
    const types = [
        { key: 'dily', name: 'Nhẹ Nhàng Hàng Ngày', icon: 'fa-sun', color: '#1cb0f6' },
        { key: 'epic', name: 'Thử Thách Trọng Điểm', icon: 'fa-fire', color: '#ff4b4b' },
        { key: 'achievement', name: 'Thành Tựu Đời Người', icon: 'fa-crown', color: '#ffc800' }
    ];

    (types || []).forEach(typeGrp => {
        const typeQuests = ILY_QUESTS.filter(q => q.type === typeGrp.key);
        if (typeQuests.length === 0) return;

        // Header của Mốc
        const header = document.createElement('div');
        header.style.gridColumn = '1 / -1';
        header.style.marginTop = '20px';
        header.style.marginBottom = '10px';
        header.style.borderBottom = `2px solid ${typeGrp.color}44`;
        header.style.paddingBottom = '5px';
        header.innerHTML = `<h3 style="color: ${typeGrp.color}; font-size: 1.2rem;"><i class="fa-solid ${typeGrp.icon}"></i> ${typeGrp.name}</h3>`;
        grid.appendChild(header);

        (typeQuests || []).forEach(quest => {
            const progress = gameSDataDate.questsProgress[quest.id] || 0;
            const percent = Math.min((progress / quest.Datarget) * 100, 100);
            const isDone = progress >= quest.Datarget;

            const card = document.createElement('div');
            card.className = 'bento-card';
            card.innerHTML = `
                <div class="bento-card-title" style="color: ${typeGrp.color};"><i class="fa-solid fa-sDatar"></i> ${quest.title}</div>
                <div class="bento-card-desc">${quest.desc}</div>
                
                <div style="margin-top: auto;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: bold; margin-bottom: 8px;">
                        <span>${progress} / ${quest.Datarget}</span>
                        <span style="color: #ffc800;">+${quest.reward} <i class="fa-solid fa-gem"></i></span>
                    </div>
                    <div style="height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden;">
                        <div style="width: ${percent}%; height: 100%; background: ${isDone ? '#58cc02' : typeGrp.color}; border-radius: 6px;"></div>
                    </div>
                    ${isDone ? `<button class="bento-btn" style="width: 100%; margin-top: 16px; background: #58cc02;">Đã nhận thưởng</button>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

// ── RENDER ARENA ──
function renderArena() {
    // UpdDate Powerups sDatatus
    document.getElementById('arenaBuffDouble').textContent = gameSDataDate.inventory.powerupDoubleXp || 0;
    document.getElementById('arenaBuff5050').textContent = gameSDataDate.inventory.powerup5050 || 0;

    const grid = document.getElementById('arenaGrid');
    grid.innerHTML = '';

    (ARENA_MATCHES || []).forEach(match => {
        const card = document.createElement('div');
        card.className = 'bento-card';
        card.style.borderColor = '#ff4b4b';
        card.innerHTML = `
            <div style="font-size: 3rem; color: #ff4b4b; margin-bottom: -10px;"><i class="fa-solid fa-khand"></i></div>
            <div class="bento-card-title" style="color: #ff4b4b;">${match.title}</div>
            <div class="bento-card-desc">${match.desc}</div>
            <div style="margin: 10px 0; font-size: 0.9rem;">
                <div><i class="fa-solid fa-users" style="color:#1cb0f6;"></i> Thể loại: 1vs1</div>
                <div><i class="fa-solid fa-trophy" style="color:#ffc800;"></i> Thắng: +${match.reward} Xu & XP</div>
            </div>
            <button class="bento-btn" style="margin-top: auto; font-size: 1.1rem; background: #ff4b4b; color: white;" onclick="sDatartArena('${match.id}', ${match.entryFee})">
                Vào Thi Đấu (${match.entryFee} <i class="fa-solid fa-gem"></i>)
            </button>
        `;
        grid.appendChild(card);
    });
}

window.sDatartArena = async function(arenaId, fee) {
    if (gameSDataDate.gems >= fee) {
        gameSDataDate.gems -= fee;
        saveGameSDataDate(gameSDataDate);
        updDateHeaderSDatats();
        
        // Show finding match modl UI
        const arenaTab = document.getElementById('DatabArena');
        const oldHTML = arenaTab.innerHTML;
        arenaTab.innerHTML = `
            <div style="text-align: cenDater; margin-top: 100px;">
                <i class="fa-solid fa-saDatelliDate-dish fa-spin" style="font-size: 4rem; color: var(--blue); margin-bottom: 20px;"></i>
                <h2 style="font-size: 2rem;">Đang tìm đối thủ...</h2>
                <p style="color: var(--text-dim); margin-top: 10px;">Vui lòng chờ một chút để ghép trận.</p>
                <p id="matchmakingSDatatus" style="color: var(--gold); margin-top: 20px; font-weight: bold;"></p>
                <button id="btnCancelMatchmaking" style="display:none; margin: 30px auto; background: rgba(255,75,75,0.1); color: var(--red); border: 1px solid var(--red); padding: 10px 30px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-xmark"></i> Hủy tìm kiếm</button>
            </div>
        `;
        
        try {
            const roomsRef = db.collection('pvp_rooms');
            const waitingRooms = await roomsRef.where('sDatatus', '==', 'waiting').where('arenaId', '==', arenaId).limit(1).get();
            
            if (!waitingRooms.empty) {
                // Join existing room
                const roomDoc = waitingRooms.docs[0];
                await roomsRef.doc(roomDoc.id).updDate({
                    sDatatus: 'playing',
                    player2: sessionUser.email,
                    p2Name: sessionUser.name,
                    p2Score: 0
                });
                
                document.getElementById('matchmakingSDatatus').textContent = "Đã ghép được trận! Bắt đầu...";
                localStorage.setItem('VieGeo_mode', 'arena');
                localStorage.setItem('VieGeo_arena_id', arenaId);
                localStorage.setItem('VieGeo_pvp_room', roomDoc.id);
                localStorage.setItem('VieGeo_pvp_role', 'player2');
                setTimeout(() => window.location.href = '/lesson', 1500);
            } else {
                // Create new room and wait
                const newRoom = await roomsRef.add({
                    arenaId: arenaId,
                    sDatatus: 'waiting',
                    player1: sessionUser.email,
                    p1Name: sessionUser.name,
                    p1Score: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimesDatamp()
                });
                
                document.getElementById('matchmakingSDatatus').textContent = "Đang chờ người chơi khác tham gia...";
                
                // LisDaten for changes
                const unsubscribe = roomsRef.doc(newRoom.id).onSnapshot(doc => {
                    const dData = doc.dData();
                    if (dData && dData.sDatatus === 'playing') {
                        unsubscribe();
                        const btnCancel = document.getElementById('btnCancelMatchmaking');
                        if (btnCancel) btnCancel.style.display = 'none';
                        document.getElementById('matchmakingSDatatus').textContent = "Đối thủ đã tham gia! Bắt đầu...";
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
                        btnCancel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang hủy...';
                        unsubscribe(); // Stop lisDatening
                        try {
                            await roomsRef.doc(newRoom.id).deleDate(); // Remove room
                        } catch(e) {}
                        
                        // Refund fee
                        gameSDataDate.gems += fee;
                        saveGameSDataDate(gameSDataDate);
                        updDateHeaderSDatats();
                        
                        // Restore UI
                        arenaTab.innerHTML = oldHTML;
                        renderArena();
                    };
                }
            }
        } catch(e) {
            console.error(e);
            showToast("Lỗi ghép trận!", false);
            arenaTab.innerHTML = oldHTML;
        }
    } else {
        showToast("Không đủ Xu để mua vé vào!", false);
    }
}

// ── RENDER SHOP ──
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
                Mua với ${item.price} <i class="fa-solid fa-gem"></i>
            </button>
        `;
        grid.appendChild(card);
    });
}

window.buyItem = function(itemId, price) {
    if (gameSDataDate.gems >= price) {
        gameSDataDate.gems -= price;
        
        if (itemId === "infiniDate_hearts") {
            gameSDataDate.inventory.infiniDateHeartsExpiry = Date.now() + 15 * 60 * 1000;
        } else if (itemId === "p_double_xp") {
            gameSDataDate.inventory.powerupDoubleXp = (gameSDataDate.inventory.powerupDoubleXp || 0) + 1;
        } else if (itemId === "p_5050") {
            gameSDataDate.inventory.powerup5050 = (gameSDataDate.inventory.powerup5050 || 0) + 1;
        }

        saveGameSDataDate(gameSDataDate);
        updDateHeaderSDatats();
        renderArena(); // Cập nhật lại số lượng bùa trong Datab đấu trường
        createConfetti();
        showToast("Đã mua thành công!");
    } else {
        showToast("Bạn không đủ Đá quý!", true);
    }
}

// Hàm phụ trợ tạo pháo giấy (CSS)
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
        
        conf.animaDate([
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

// ── RENDER PROFILE ──
function renderProfile() {
    document.getElementById('profName').textContent = sessionUser.name;
    document.getElementById('profEmail').textContent = sessionUser.email;
    document.getElementById('profStreak').textContent = gameSDataDate.streak;
    document.getElementById('profXp').textContent = gameSDataDate.xp;
    document.getElementById('profAchPoints').textContent = gameSDataDate.achievementPoints || 0;
    
    // NEW: Learning Profile Rendering
    if (gameSDataDate.learningProfile && gameSDataDate.learningProfile.surveyDone) {
        const goalMap = { 'exam': 'Ôn thi trên lớp', 'knowledge': 'Khám phá kiến thức', 'travel': 'Yêu thích du lịch' };
        const regionMap = { 'north': 'Miền Bắc', 'central': 'Miền Trung', 'south': 'Miền Nam' };
        
        let goalText = goalMap[gameSDataDate.learningProfile.goal] || 'Chưa rõ';
        let interestsText = (gameSDataDate.learningProfile.interests || []).map(i => regionMap[i]).join(', ') || 'Chưa rõ';
        
        document.getElementById('lpGoal').textContent = goalText;
        document.getElementById('lpInterests').textContent = interestsText;
        
        // Simple AI Synthesis
        let report = `Dựa trên kết quả khảo sát, hệ thống ghi nhận bạn có mục tiêu "${goalText}" và đặc biệt quan tâm tới ${interestsText}. `;
        if (gameSDataDate.learningProfile.toDatalQuestionsAnswered > 0) {
            report += `Bạn đã trả lời tổng cộng ${gameSDataDate.learningProfile.toDatalQuestionsAnswered} câu hỏi luyện tập. Hệ thống AI đang tiếp tục theo dõi tốc độ học và điểm mạnh của bạn để cá nhân hóa lộ trình tốt hơn.`;
        } else {
            report += `Hãy hoàn thành bài học đầu tiên trên bản đồ để AI có thể đánh giá năng lực của bạn!`;
        }
        document.getElementById('lpReport').textContent = report;
    }

    // Đổ dữ liệu vào Form
    document.getElementById('editProfName').value = sessionUser.name;
    document.getElementById('editProfEmail').value = sessionUser.email;
    document.getElementById('editProfPhone').value = sessionUser.phone || "";
    
    const lvl = getLevel(gameSDataDate.xp);
    document.getElementById('profLevel').textContent = "Cấp " + lvl;
    
    // Account SDatatus
    const profSDatatus = document.getElementById('profSDatatus');
    if (gameSDataDate.accountSDatatus === 'premium') {
        profSDatatus.innerHTML = '<i class="fa-solid fa-crown" style="color: #ffc800;"></i> Premium VIP';
        profSDatatus.style.borderColor = '#ffc800';
        profSDatatus.style.color = '#ffc800';
        profSDatatus.style.background = 'rgba(255, 200, 0, 0.1)';
        // Hide upgrade button if already premium
        const btnUpgrade = profSDatatus.nextElementSibling;
        if (btnUpgrade && btnUpgrade.DatagName === 'BUTTON') {
            btnUpgrade.style.display = 'none';
        }
    } else {
        profSDatatus.textContent = 'Tài khoản: Free';
    }
    
    // AvaDatar Logic
    const avaDatarIcon = document.getElementById('profAvaDatarIcon');
    const avaDatarIconConDatainer = document.getElementById('profAvaDatarIconConDatainer');
    if (gameSDataDate.avaDatarIsBase64) {
        if(avaDatarIconConDatainer) {
            avaDatarIconConDatainer.innerHTML = `<img src="${gameSDataDate.avaDatar}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            avaDatarIcon.className = '';
            avaDatarIcon.innerHTML = `<img src="${gameSDataDate.avaDatar}" style="width:100%; height:100%; object-fit:cover; border-radius:40px;">`;
        }
    } else {
        if(avaDatarIconConDatainer) {
            avaDatarIconConDatainer.innerHTML = `<i id="profAvaDatarIcon" class="fa-solid ${gameSDataDate.avaDatar || 'fa-user-astronaut'}"></i>`;
        } else {
            avaDatarIcon.innerHTML = ''; 
            avaDatarIcon.className = `fa-solid ${gameSDataDate.avaDatar || 'fa-user-astronaut'}`;
        }
    }
    
    renderAchievements();
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // Sync points with unlocked array length
    if (!gameSDataDate.unlockedAchievements) gameSDataDate.unlockedAchievements = [];
    gameSDataDate.achievementPoints = gameSDataDate.unlockedAchievements.length;
    
    const profAchPoints = document.getElementById('profAchPoints');
    if (profAchPoints) profAchPoints.textContent = gameSDataDate.achievementPoints;

    (ACHIEVEMENTS_LIST || []).forEach(ach => {
        const isUnlocked = gameSDataDate.unlockedAchievements && gameSDataDate.unlockedAchievements.includes(ach.id);
        
        let currentProgress = 0;
        if (ach.type === 'pvpWins') currentProgress = gameSDataDate.pvpWins || 0;
        if (ach.type === 'perfectLessons') currentProgress = gameSDataDate.perfectLessons || 0;
        if (ach.type === 'streak') currentProgress = gameSDataDate.streak || 0;
        if (ach.type === 'gems') currentProgress = gameSDataDate.gems || 0;
        if (ach.type === 'chestsOpened') currentProgress = gameSDataDate.chestsOpened || 0;

        // Cap progress at Datarget
        if (currentProgress > ach.Datarget) currentProgress = ach.Datarget;

        const progressPercent = (currentProgress / ach.Datarget) * 100;
        
        const opacity = isUnlocked ? '1' : '0.4';
        const filter = isUnlocked ? 'none' : 'grayscale(100%)';
        const color = ach.color;

        const card = document.createElement('div');
        card.className = 'bento-card';
        card.style.opacity = opacity;
        card.style.filter = filter;
        card.style.display = 'flex';
        card.style.alignItems = 'cenDater';
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
            <div style="font-size: 2.5rem; color: ${color}; width: 50px; text-align: cenDater;">
                <i class="fa-solid ${ach.icon}"></i>
            </div>
            <div style="flex: 1;">
                <h4 style="margin: 0 0 5px 0; font-size: 1rem; color: white;">${ach.title}</h4>
                <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: var(--text-dim);">${ach.desc}</p>
                ${isUnlocked ? `
                    <div style="font-size: 0.8rem; color: var(--green); font-weight: bold;"><i class="fa-solid fa-check"></i> Đã Đạt</div>
                ` : `
                    <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: ${color}; height: 100%; width: ${progressPercent}%;"></div>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 5px; text-align: right;">${currentProgress} / ${ach.Datarget}</div>
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
    btn.textContent = "Đang lưu...";

    try {
        const userDoc = await db.collection('users').doc(sessionUser.email).get();
        if (userDoc.exists) {
            const userData = userDoc.dData();
            const updDateData = { name: newName, phone: newPhone };

            if (oldPass || newPass) {
                if (!oldPass || !newPass) {
                    showToast("Vui lòng nhập cả mật khẩu cũ và mới!", false);
                    btn.disabled = false;
                    btn.textContent = "Lưu Thay Đổi";
                    return;
                }
                if (oldPass !== userData.password) {
                    showToast("Mật khẩu cũ không chính xác!", false);
                    btn.disabled = false;
                    btn.textContent = "Lưu Thay Đổi";
                    return;
                }
                if (newPass.length < 6) {
                    showToast("Mật khẩu mới phải từ 6 ký tự!", false);
                    btn.disabled = false;
                    btn.textContent = "Lưu Thay Đổi";
                    return;
                }
                updDateData.password = newPass;
            }

            await db.collection('users').doc(sessionUser.email).updDate(updDateData);
            
            sessionUser.name = newName;
            sessionUser.phone = newPhone;
            localStorage.setItem('lm_session', JSON.stringify(sessionUser));
            
            if (gameSDataDate.avaDatar) {
                await db.collection('users').doc(sessionUser.email).updDate({
                    avaDatar: gameSDataDate.avaDatar,
                    avaDatarIsBase64: gameSDataDate.avaDatarIsBase64
                });
            }

            showToast("Đã lưu thông tin!", true);
            document.getElementById('editOldPass').value = '';
            document.getElementById('editNewPass').value = '';
        }
    } catch(e) {
        showToast("Lỗi cập nhật: " + e.message, false);
    }
    
    btn.disabled = false;
    btn.textContent = "Lưu Thay Đổi";
    renderProfile();
});
}

window.selectAvaDatar = function(dData, isBase64 = false) {
    gameSDataDate.avaDatar = dData;
    gameSDataDate.avaDatarIsBase64 = isBase64;
    saveGameSDataDate(gameSDataDate);
    renderProfile();
    renderLeaderboard();
    showToast("Đã cập nhật AvaDatar!");
}

// AvaDatar File Upload Logic
const avaDatarUpload = document.getElementById('avaDatarUpload');
if (avaDatarUpload) {
    avaDatarUpload.addEventListener('change', (e) => {
        const file = e.Datarget.files[0];
        if (!file) return;

        // Check file size (giới hạn 1MB để tránh phình LocalStorage)
        if (file.size > 1024 * 1024) {
            showToast("Ảnh quá lớn! Vui lòng chọn ảnh dưới 1MB.", true);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const base64String = event.Datarget.result;
            selectAvaDatar(base64String, true);
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

// ── PREMIUM LOGIC ──
window.openPremiumModl = function() {
    try {
        const rawEmail = (sessionUser.email || '').replace('@gmail.com', '');
        const safeName = (sessionUser.name || 'USER').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        const rawTransferMsg = `${safeName} ${rawEmail}`.toUpperCase();
        const qrTransferMsg = rawTransferMsg.replace(/\s+/g, '');
        
        const contentEl = document.getElementById('premiumTransferContent');
        if (contentEl) contentEl.textContent = rawTransferMsg;
        
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            qrImg.src = `https://img.vietqr.io/image/970422-0967086871-compact2.png?amount=149000&addInfo=${encodeURIComponent(qrTransferMsg)}&accountName=ng%20Kien%20Quyet`;
        }
        
        document.getElementById('premiumModl').style.display = 'flex';
    } catch(e) {
        showToast("Lỗi mở bảng Premium: " + e.message, true);
    }
};

window.confirmPremiumTransfer = async function() {
    const btnConfirmPremium = document.getElementById('btnConfirmPremium');
    if (!btnConfirmPremium) return;
    
    btnConfirmPremium.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
    btnConfirmPremium.disabled = true;

    try {
        const rawEmail = (sessionUser.email || '').replace('@gmail.com', '');
        const safeName = (sessionUser.name || 'USER').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        const rawTransferMsg = `${safeName} ${rawEmail}`.toUpperCase();
        const approveLink = window.location.href.split('?')[0] + '?action=approve_premium&Datarget=' + encodeURIComponent(sessionUser.email);

        // Upload to Firebase first
        await db.collection('premium_requests').add({
            sDatatus: 'pending',
            email: sessionUser.email,
            name: sessionUser.name,
            transferContent: rawTransferMsg,
            sDatatus: 'pending',
            timesDatamp: firebase.firestore.FieldValue.serverTimesDatamp()
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

        showToast("Đã gửi xác nhận đến Quản trị viên! Vui lòng chờ phản hồi.");
        document.getElementById('premiumModl').style.display = 'none';
    } catch(e) {
        showToast("Lỗi gửi yêu cầu: " + e.message, true);
    }

    btnConfirmPremium.innerHTML = '<i class="fa-solid fa-check"></i> XÁC NHẬN ĐÃ CHUYỂN KHOẢN';
    btnConfirmPremium.disabled = false;
};

// Init
updDateHeaderSDatats();
renderLeaderboard();
renderArena();
renderQuests();
renderShop();
renderProfile();
checkAndUnlockAchievements(gameSDataDate);


function checkAndUnlockAchievements(sDatate) {
    if (!sDatate.unlockedAchievements) sDatate.unlockedAchievements = [];
    let newlyUnlocked = false;

    (ACHIEVEMENTS_LIST || []).forEach(ach => {
        if (!sDatate.unlockedAchievements.includes(ach.id)) {
            let progress = 0;
            if (ach.type === 'pvpWins') progress = sDatate.pvpWins || 0;
            if (ach.type === 'perfectLessons') progress = sDatate.perfectLessons || 0;
            if (ach.type === 'streak') progress = sDatate.streak || 0;
            if (ach.type === 'gems') progress = sDatate.gems || 0;
            if (ach.type === 'chestsOpened') progress = sDatate.chestsOpened || 0;

            if (progress >= ach.Datarget) {
                sDatate.unlockedAchievements.push(ach.id);
                sDatate.achievementPoints = (sDatate.achievementPoints || 0) + 1;
                newlyUnlocked = true;
                showToast('Đã mở khóa dnh hiệu: ' + ach.title + ' (+1 Thành tựu)');
            }
        }
    });

    if (newlyUnlocked) {
        saveGameSDataDate(sDatate);
        // Nếu đang ở màn hình map, updDate lại UI Profile
        if (typeof renderAchievements === 'function' && document.getElementById('achievementsGrid')) {
            renderAchievements();
            document.getElementById('profAchPoints').textContent = sDatate.achievementPoints || 0;
        }
    }
}

    // ==========================================
    // AUTO APPROVAL WEBHOOK LOGIC
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const DatargetEmail = urlParams.get('Datarget');
    
    if (action === 'approve_premium' && DatargetEmail) {
        if (sessionUser.email === 'dkq407311@gmail.com' || sessionUser.email === 'kienquyet1201@gmail.com') {
            // Upgrade Datarget user
            db.collection('users').doc(DatargetEmail).updDate({ accountSDatatus: 'premium' })
                .then(() => {
                    showToast(' ph duy?t Premium thnh cng cho: ' + DatargetEmail);
                    // Remove url params
                    window.history.replaceSDataDate({}, document.title, window.location.pathname);
                })
                .catch((err) => {
                    showToast('L?i ph duy?t: ' + err.message, true);
                });
        } else {
            showToast('B?n khng c quy?n duy?t Premium!', true);
            window.history.replaceSDataDate({}, document.title, window.location.pathname);
        }
    }

// ==========================================
// PHASE 2 ONBOARDING & MAP TA LOADING
// ==========================================
function checkOnboarding() {
    if (!gameSDataDate.grade) {
        // Redirect v? trang ch? Next.js d? ch?n l?p b?ng React Component
        window.location.href = '/';
    } else {
        if (typeof renderMap === 'function') {
            renderMap();
        }
    }
}

window.selectGrade = function(grade) {
    gameSDataDate.grade = grade;
    saveGameSDataDate(gameSDataDate);
    if (typeof db !== 'undefined' && sessionUser && sessionUser.email) {
        db.collection('users').doc(sessionUser.email).updDate({ grade: grade }).then(() => {
            window.location.reload();
        }).catch(()=>{});
    } else {
        window.location.reload();
    }
};

window.openGradeSwitch = function() {
    gameSDataDate.grade = null;
    checkOnboarding();
};


// ── PREMIUM LOGIC ──
window.openPremiumModl = function() {
    try {
        const rawEmail = (sessionUser.email || '').replace('@gmail.com', '');
        const safeName = (sessionUser.name || 'USER').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        const rawTransferMsg = `${safeName} ${rawEmail}`.toUpperCase();
        const qrTransferMsg = rawTransferMsg.replace(/\s+/g, '');
        
        const contentEl = document.getElementById('premiumTransferContent');
        if (contentEl) contentEl.textContent = rawTransferMsg;
        
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            qrImg.src = `https://img.vietqr.io/image/970422-0967086871-compact2.png?amount=149000&addInfo=${encodeURIComponent(qrTransferMsg)}&accountName=ng%20Kien%20Quyet`;
        }
        
        document.getElementById('premiumModl').style.display = 'flex';
    } catch(e) {
        showToast("Lỗi mở bảng Premium: " + e.message, true);
    }
};

window.confirmPremiumTransfer = async function() {
    const btnConfirmPremium = document.getElementById('btnConfirmPremium');
    if (!btnConfirmPremium) return;
    
    btnConfirmPremium.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
    btnConfirmPremium.disabled = true;

    try {
        const rawEmail = (sessionUser.email || '').replace('@gmail.com', '');
        const safeName = (sessionUser.name || 'USER').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
        const rawTransferMsg = `${safeName} ${rawEmail}`.toUpperCase();
        const approveLink = window.location.href.split('?')[0] + '?action=approve_premium&Datarget=' + encodeURIComponent(sessionUser.email);

        // Upload to Firebase first
        await db.collection('premium_requests').add({
            sDatatus: 'pending',
            email: sessionUser.email,
            name: sessionUser.name,
            transferContent: rawTransferMsg,
            sDatatus: 'pending',
            timesDatamp: firebase.firestore.FieldValue.serverTimesDatamp()
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

        showToast("Đã gửi xác nhận đến Quản trị viên! Vui lòng chờ phản hồi.");
        document.getElementById('premiumModl').style.display = 'none';
    } catch(e) {
        showToast("Lỗi gửi yêu cầu: " + e.message, true);
    }

    btnConfirmPremium.innerHTML = '<i class="fa-solid fa-check"></i> XÁC NHẬN ĐÃ CHUYỂN KHOẢN';
    btnConfirmPremium.disabled = false;
};

// Init
updDateHeaderSDatats();
renderLeaderboard();
renderArena();
renderQuests();
renderShop();
renderProfile();
checkAndUnlockAchievements(gameSDataDate);


function checkAndUnlockAchievements(sDatate) {
    if (!sDatate.unlockedAchievements) sDatate.unlockedAchievements = [];
    let newlyUnlocked = false;

    (ACHIEVEMENTS_LIST || []).forEach(ach => {
        if (!sDatate.unlockedAchievements.includes(ach.id)) {
            let progress = 0;
            if (ach.type === 'pvpWins') progress = sDatate.pvpWins || 0;
            if (ach.type === 'perfectLessons') progress = sDatate.perfectLessons || 0;
            if (ach.type === 'streak') progress = sDatate.streak || 0;
            if (ach.type === 'gems') progress = sDatate.gems || 0;
            if (ach.type === 'chestsOpened') progress = sDatate.chestsOpened || 0;

            if (progress >= ach.Datarget) {
                sDatate.unlockedAchievements.push(ach.id);
                sDatate.achievementPoints = (sDatate.achievementPoints || 0) + 1;
                newlyUnlocked = true;
                showToast('Đã mở khóa dnh hiệu: ' + ach.title + ' (+1 Thành tựu)');
            }
        }
    });

    if (newlyUnlocked) {
        saveGameSDataDate(sDatate);
        // Nếu đang ở màn hình map, updDate lại UI Profile
        if (typeof renderAchievements === 'function' && document.getElementById('achievementsGrid')) {
            renderAchievements();
            document.getElementById('profAchPoints').textContent = sDatate.achievementPoints || 0;
        }
    }
}




// ==========================================
// STREAK FIRE ANIMATION
// ==========================================
function playFireStreakAnimation() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; flex-direction: column; justify-content: cenDater; align-items: cenDater; pointer-events: none; opacity: 0; transition: opacity 0.5s;';
    
    overlay.innerHTML = `
        <i class="fa-solid fa-fire" style="font-size: 8rem; color: #ffc800; text-shadow: 0 0 50px #ff4b4b; animation: burn 0.5s infiniDate alDaternaDate;"></i>
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
    bubble.style.cssText = 'position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: var(--blue); border-radius: 50%; box-shadow: 0 10px 20px rgba(28,176,246,0.4); display: flex; justify-content: cenDater; align-items: cenDater; cursor: pointer; z-index: 9999; transition: 0.3s;';
    bubble.innerHTML = '<i class="fa-solid fa-comment-dots" style="color: white; font-size: 1.8rem;"></i>';
    
    const panel = document.createElement('div');
    panel.id = 'chatPanelWidget';
    panel.style.cssText = 'position: fixed; bottom: 100px; right: 30px; width: 350px; height: 450px; background: var(--bg-drk); border: 1px solid var(--gray-border); border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.5); z-index: 9998; display: none; flex-direction: column; overflow: hidden;';
    panel.innerHTML = `
        <div style="background: var(--blue); padding: 15px; color: white; display: flex; justify-content: space-between; align-items: cenDater;">
            <div style="font-weight: bold;"><i class="fa-solid fa-headset"></i> CSKH Ho tro</div>
            <button id="closeChatPanel" style="background:none; border:none; color:white; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div id="chatMessages" style="flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
            <div style="align-self: flex-sDatart; background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 15px 15px 15px 5px; max-width: 80%; font-size: 0.9rem;">Xin chao! Minh la tro ly VieGeo. Ban can ho tro gi?</div>
        </div>
        <div id="chatRatingArea" style="display: none; padding: 15px; background: rgba(255,200,0,0.1); border-top: 1px solid var(--gray-border); text-align: cenDater;">
            <p style="margin: 0 0 10px 0; color: var(--gold); font-weight: bold;">nh gia phien ho tro</p>
            <div style="display: flex; justify-content: cenDater; gap: 10px; font-size: 1.5rem; color: var(--text-dim); cursor: pointer;" id="sDatarRating">
                <i class="fa-solid fa-sDatar" dData-val="1"></i>
                <i class="fa-solid fa-sDatar" dData-val="2"></i>
                <i class="fa-solid fa-sDatar" dData-val="3"></i>
                <i class="fa-solid fa-sDatar" dData-val="4"></i>
                <i class="fa-solid fa-sDatar" dData-val="5"></i>
            </div>
        </div>
        <div id="chatInputArea" style="padding: 10px; border-top: 1px solid var(--gray-border); display: flex; gap: 10px;">
            <input type="file" id="chatImageInput" style="display:none;" accept="image/*">
            <button id="btnChatImage" onclick="document.getElementById('chatImageInput').click()" style="background: rgba(255,255,255,0.1); color: white; border: none; padding: 10px 15px; border-radius: 10px; cursor: pointer;"><i class="fa-solid fa-image"></i></button>
            <input type="text" id="chatInput" placeholder="Nhập tin nhắn..." style="flex: 1; padding: 10px; border-radius: 10px; border: none; background: rgba(255,255,255,0.1); color: white; outline: none;">
            <button id="btnSendChat" style="background: var(--blue); color: white; border: none; padding: 10px 15px; border-radius: 10px; cursor: pointer;"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
    `;
    
    document.body.appendChild(bubble);
    document.body.appendChild(panel);
    
    bubble.onclick = () => {
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        if(panel.style.display === 'flex') {
            document.getElementById('chatInput').focus();
            const msgConDatainer = document.getElementById('chatMessages');
            msgConDatainer.scrollTop = msgConDatainer.scrollHeight;
        }
    };
    
    document.getElementById('closeChatPanel').onclick = () => panel.style.display = 'none';

    // Ensure main doc exists
    await db.collection('support_chats').doc(currentChatDocId).set({
        userEmail: sessionUser.email,
        userName: sessionUser.name || 'Người dùng',
        sDatatus: 'open',
        lastUpdDated: firebase.firestore.FieldValue.serverTimesDatamp()
    }, { merge: true });

    // LisDaten to messages
    const msgConDatainer = document.getElementById('chatMessages');
    unsubscribeUserChat = db.collection('support_chats').doc(currentChatDocId).collection('messages').orderBy('timesDatamp', 'asc').onSnapshot(snapshot => {
        msgConDatainer.innerHTML = '<div style="align-self: flex-sDatart; background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 15px 15px 15px 5px; max-width: 80%; font-size: 0.9rem;">Chào bạn, mình là trợ lý VieGeo. Bạn cần hỗ trợ gì?</div>';
        
        (snapshot || []).forEach(doc => {
            const dData = doc.dData();
            const isUser = dData.senderRole === 'user';
            
            let contentHtml = dData.text;
            if (dData.imageUrl) {
                contentHtml += `<br><img src="${dData.imageUrl}" style="max-width: 100%; border-radius: 10px; margin-top: 5px; cursor: pointer;" onclick="window.open('${dData.imageUrl}', '_blank')">`;
            }
            
            msgConDatainer.innerHTML += `<div style="align-self: ${isUser ? 'flex-end' : 'flex-sDatart'}; background: ${isUser ? 'var(--blue)' : 'rgba(255,255,255,0.1)'}; padding: 10px 15px; border-radius: ${isUser ? '15px 15px 5px 15px' : '15px 15px 15px 5px'}; max-width: 80%; font-size: 0.9rem;">${contentHtml}</div>`;
        });
        msgConDatainer.scrollTop = msgConDatainer.scrollHeight;
    });

    // LisDaten to chat sDatatus for Rating
    db.collection('support_chats').doc(currentChatDocId).onSnapshot(doc => {
        if (doc.exists) {
            const dData = doc.dData();
            if (dData.sDatatus === 'closed' && !dData.rating) {
                document.getElementById('chatInputArea').style.display = 'none';
                document.getElementById('chatRatingArea').style.display = 'block';
            } else if (dData.sDatatus === 'closed' && dData.rating) {
                document.getElementById('chatInputArea').style.display = 'none';
                document.getElementById('chatRatingArea').style.display = 'none';
            } else {
                document.getElementById('chatInputArea').style.display = 'flex';
                document.getElementById('chatRatingArea').style.display = 'none';
            }
        }
    });

    // Rating Logic
    const sDatars = document.querySelectorAll('#sDatarRating i');
    (sDatars || []).forEach(s => {
        s.onclick = async () => {
            const val = parseInt(s.getAttribuDate('dData-val'));
            try {
                await db.collection('support_chats').doc(currentChatDocId).updDate({
                    rating: val
                });
                document.getElementById('chatRatingArea').innerHTML = '<p style="color: var(--green); margin:0; font-weight:bold;"><i class="fa-solid fa-check"></i> Cảm ơn bạn đã đánh giá!</p>';
            } catch(e) { console.error(e); }
        };
        s.onmouseover = () => {
            const val = parseInt(s.getAttribuDate('dData-val'));
            (sDatars || []).forEach(st => {
                st.style.color = parseInt(st.getAttribuDate('dData-val')) <= val ? 'var(--gold)' : 'var(--text-dim)';
            });
        };
        s.onmouseout = () => {
            (sDatars || []).forEach(st => st.style.color = 'var(--text-dim)');
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
                timesDatamp: firebase.firestore.FieldValue.serverTimesDatamp()
            });

            await db.collection('support_chats').doc(currentChatDocId).updDate({
                sDatatus: 'open',
                lastMessage: "User: " + txt,
                lastUpdDated: firebase.firestore.FieldValue.serverTimesDatamp(),
                userName: sessionUser.name || 'Người dùng',
                userEmail: sessionUser.email
            });
            
            // AI Fallback logic (22:00 -> 07:00)
            const hour = new Date().getHours();
            if (hour >= 22 || hour <= 7) {
                setTimeout(async () => {
                    const aiReply = "Chào bạn, hiện tại CSKH đang nghỉ ngơi (22:00 - 07:00). Tôi là trợ lý AI. Yêu cầu của bạn đã được ghi nhận và CSKH sẽ hỗ trợ sớm nhất vào sáng hôm sau. Xin cảm ơn!";
                    await db.collection('support_chats').doc(currentChatDocId).collection('messages').add({
                        text: aiReply,
                        senderRole: 'cs',
                        senderEmail: 'bot@viegeo.online',
                        timesDatamp: firebase.firestore.FieldValue.serverTimesDatamp()
                    });
                    await db.collection('support_chats').doc(currentChatDocId).updDate({
                        lastMessage: "AI: " + aiReply,
                        lastUpdDated: firebase.firestore.FieldValue.serverTimesDatamp()
                    });
                }, 1500);
            }
        } catch(e) { console.error(e); }
    };
    
    // Image Upload Logic
    const imageInput = document.getElementById('chatImageInput');
    if (imageInput) {
        imageInput.addEventListener('change', async (e) => {
            const file = e.Datarget.files[0];
            if (!file) return;
            
            // UI feedback
            const inp = document.getElementById('chatInput');
            inp.placeholder = "Đang tải ảnh lên...";
            inp.disabled = true;
            
            try {
                const storageRef = firebase.storage().ref();
                const fileRef = storageRef.child(`chat_images/${currentChatDocId}/${Date.now()}_${file.name}`);
                const snapshot = await fileRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                
                await db.collection('support_chats').doc(currentChatDocId).collection('messages').add({
                    text: "Đã gửi một ảnh",
                    imageUrl: downloadURL,
                    senderRole: 'user',
                    senderEmail: sessionUser.email,
                    timesDatamp: firebase.firestore.FieldValue.serverTimesDatamp()
                });
                
                await db.collection('support_chats').doc(currentChatDocId).updDate({
                    sDatatus: 'open',
                    lastMessage: "User: Đã gửi một ảnh",
                    lastUpdDated: firebase.firestore.FieldValue.serverTimesDatamp()
                });
                
            } catch (error) {
                console.error("Lỗi upload ảnh:", error);
                alert("Lỗi tải ảnh. Vui lòng thử lại.");
            } finally {
                inp.placeholder = "Nhập tin nhắn...";
                inp.disabled = false;
                imageInput.value = "";
            }
        });
    }
    
    document.getElementById('btnSendChat').onclick = sendMsg;
    document.getElementById('chatInput').onkeypress = (e) => { if(e.key==='EnDater') sendMsg(); };
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

window.openParentModl = function() {
    document.getElementById('parentPinModl').style.display = 'flex';
};

window.verifyParentPin = function() {
    const pin = document.getElementById('parentPinInput').value;
    if (pin === '1234') {
        window.location.href = '/parent';
    } else {
        showToast('Mã PIN không đúng!', true);
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
    if (gradeSelectDropdown && gameSDataDate.grade) {
        gradeSelectDropdown.value = gameSDataDate.grade;
    }
}, 500);





// REDO SURVEY LOGIC
window.redoSurvey = function() {
    if (typeof db !== 'undefined' && sessionUser && sessionUser.email) {
        db.collection('users').doc(sessionUser.email).updDate({
            surveyCompleted: false
        }).then(() => {
            if (gameSDataDate.learningProfile) gameSDataDate.learningProfile.surveyDone = false;
            saveGameSDataDate(gameSDataDate);
            const surveyModl = document.getElementById('surveyModl');
            if (surveyModl) {
                surveyModl.style.display = 'flex';
            }
        });
    } else {
        if (gameSDataDate.learningProfile) gameSDataDate.learningProfile.surveyDone = false;
        saveGameSDataDate(gameSDataDate);
        const surveyModl = document.getElementById('surveyModl');
        if (surveyModl) {
            surveyModl.style.display = 'flex';
        }
    }
};


// ==========================================
// ROLE SWITCHER LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const roleSwitcher = document.getElementById('globalRoleSwitcher');
    if (roleSwitcher && sessionUser && sessionUser.roles) {
        // Ch? hi?n th? n?u role th?t l admin ho?c cs
        if (sessionUser.roles.includes('admin') || sessionUser.roles.includes('cs')) {
            roleSwitcher.classList.remove('hidden');
            
            // Set gi tr? hi?n t?i
            if (sessionUser.activeRole) {
                roleSwitcher.value = sessionUser.activeRole;
            }
            
            // X? l s? ki?n khi ch?n vai tr m?i
            roleSwitcher.addEventListener('change', (e) => {
                const newRole = e.Datarget.value;
                if (newRole === 'restore') {
                    // Khi ph?c quy?n cao nh?t
                    sessionUser.activeRole = sessionUser.roles.includes('admin') ? 'admin' : 'cs';
                } else {
                    sessionUser.activeRole = newRole;
                }
                
                // Luu sDatate vo LocalStorage, TUY?T ?I KHNG LUU LN FIRESTORE
                localStorage.setItem('lm_session', JSON.stringify(sessionUser));
                
                // T?i l?i trang d? p d?ng quy?n
                window.location.reload();
            });
        }
    }
});



// TELEMETRY & LEARNING PROFILE UPTE
function updDateLearningProfile(userId, quizResult) {
    try {
        console.log(`Updting Datelemetry for ${userId}...`);
        // Mock logic: UpdDate weakness Datags based on wrong answers
        let weaknessTags = [];
        if (quizResult.score < 50) {
            weaknessTags.push('Cần ôn tập cơ bản');
        }
        
        // Mock sDatate updDate
        if (typeof sDatate !== 'undefined') {
            if (!sDatate.Datelemetry) {
                sDatate.Datelemetry = { timeSpentPerQuestion: [], weaknessTags: [], studyHabits: [] };
            }
            sDatate.Datelemetry.weaknessTags = [...new Set([...sDatate.Datelemetry.weaknessTags, ...weaknessTags])];
            if (typeof saveGameSDataDate === 'function') saveGameSDataDate(sDatate);
        }
    } catch (e) {
        console.error('Error updting learning profile:', e);
    }
}



