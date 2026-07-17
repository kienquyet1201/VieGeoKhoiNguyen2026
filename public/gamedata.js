// ============================================================================
// VieGeo - GAME DATA & LOGIC CORE (Expanded for Arena & SGK)
// ============================================================================

const defaultGameState = {
    xp: 0,
    hearts: 5,
    streak: 1,
    maxHearts: 5,
    gems: 500, // Tăng thêm xu để dễ test
    currentUnit: 1,
    currentNode: 1,
    completedNodes: [],
    lastLogin: new Date().toISOString().split('T')[0],
    
    // Avatar
    avatar: "fa-user-astronaut",
    avatarIsBase64: false, // Flag để xác định xem Avatar là icon hay ảnh upload

    // Lớp học
    selectedGrade: "all",

    // Inventory (Shop items active)
    inventory: {
        infiniteHeartsExpiry: null,
        streakFreeze: 0,
        powerupDoubleXp: 0,
        powerup5050: 0
    },
    
    // Daily Quests Progress
    questsProgress: {
        "q1": 0,
        "q2": 0,
        "q3": 0,
        "q4": 0,
        "q5": 0,
        "q6": 0,
        "q7": 0
    },
    
    // Achievements Stats
    pvpWins: 0,
    perfectLessons: 0,
    chestsOpened: 0,
    achievementPoints: 0,
    unlockedAchievements: []
};

// ── ACHIEVEMENTS LIST ──
const ACHIEVEMENTS_LIST = [
    { id: "ach_pvp_1", title: "Tân Binh Đấu Trường", desc: "Chiến thắng 1 trận PvP", target: 1, type: "pvpWins", icon: "fa-khanda", color: "#ff4b4b" },
    { id: "ach_pvp_10", title: "Chiến Binh Đấu Trường", desc: "Chiến thắng 10 trận PvP", target: 10, type: "pvpWins", icon: "fa-khanda", color: "#ff7676" },
    { id: "ach_pvp_99", title: "Kẻ Hủy Diệt Đấu Trường", desc: "Chiến thắng 99 trận PvP", target: 99, type: "pvpWins", icon: "fa-skull", color: "#ff0000" },
    
    { id: "ach_lesson_1", title: "Bước Chân Đầu Tiên", desc: "Hoàn thành xuất sắc 1 bài học", target: 1, type: "perfectLessons", icon: "fa-book-open-reader", color: "#1cb0f6" },
    { id: "ach_lesson_10", title: "Học Bá Địa Lý", desc: "Hoàn thành xuất sắc 10 bài học", target: 10, type: "perfectLessons", icon: "fa-graduation-cap", color: "#4bcaff" },
    { id: "ach_lesson_50", title: "Học Giả Uyên Bác", desc: "Hoàn thành xuất sắc 50 bài học", target: 50, type: "perfectLessons", icon: "fa-medal", color: "#ffc800" },
    
    { id: "ach_streak_3", title: "Khởi Động Nhẹ Nhàng", desc: "Đạt chuỗi 3 ngày liên tiếp", target: 3, type: "streak", icon: "fa-fire", color: "#ffc800" },
    { id: "ach_streak_7", title: "Kiên Trì Bền Bỉ", desc: "Đạt chuỗi 7 ngày liên tiếp", target: 7, type: "streak", icon: "fa-fire-flame-curved", color: "#ff6b6b" },
    { id: "ach_streak_30", title: "Người Chơi Hệ Cày Cuốc", desc: "Đạt chuỗi 30 ngày liên tiếp", target: 30, type: "streak", icon: "fa-fire-flame-simple", color: "#ff0000" },
    
    { id: "ach_gems_1k", title: "Khởi Nghiệp", desc: "Tích lũy 1,000 Xu", target: 1000, type: "gems", icon: "fa-coins", color: "#ffc800" },
    { id: "ach_gems_10k", title: "Triệu Phú VieGeo", desc: "Tích lũy 10,000 Xu", target: 10000, type: "gems", icon: "fa-gem", color: "#1cb0f6" },
    
    { id: "ach_chest_1", title: "Chạm Vào May Mắn", desc: "Mở 1 rương báu", target: 1, type: "chestsOpened", icon: "fa-box-open", color: "#964B00" },
    { id: "ach_chest_5", title: "Thợ Săn Kho Báu", desc: "Mở 5 rương báu", target: 5, type: "chestsOpened", icon: "fa-gem", color: "#ce82ff" }
];

function getGameState() {
    // MIGRATION: VieGeo -> VieGeo
    if (localStorage.getItem('VieGeo_state') && !localStorage.getItem('VieGeo_state')) {
        localStorage.setItem('VieGeo_state', localStorage.getItem('VieGeo_state'));
    }

    let state = localStorage.getItem('VieGeo_state');
    if (!state) {
        state = defaultGameState;
        localStorage.setItem('VieGeo_state', JSON.stringify(state));
        return state;
    }
    let parsed = JSON.parse(state);
    if (!parsed.inventory) parsed.inventory = defaultGameState.inventory;
    if (parsed.inventory.powerupDoubleXp === undefined) parsed.inventory.powerupDoubleXp = 0;
    if (parsed.inventory.powerup5050 === undefined) parsed.inventory.powerup5050 = 0;
    if (!parsed.questsProgress) parsed.questsProgress = defaultGameState.questsProgress;
    if (!parsed.avatar) parsed.avatar = defaultGameState.avatar;
    if (parsed.selectedGrade === undefined) parsed.selectedGrade = defaultGameState.selectedGrade;
    // Khởi tạo các trường Premium nếu chưa có
    if (!parsed.accountStatus) parsed.accountStatus = 'free';
    if (!parsed.lastHeartRegenTime) parsed.lastHeartRegenTime = Date.now();
    
    // Khởi tạo các trường Thành tựu nếu chưa có
    if (parsed.pvpWins === undefined) parsed.pvpWins = 0;
    if (parsed.perfectLessons === undefined) parsed.perfectLessons = 0;
    if (parsed.chestsOpened === undefined) parsed.chestsOpened = 0;
    if (parsed.achievementPoints === undefined) parsed.achievementPoints = 0;
    if (!parsed.unlockedAchievements) parsed.unlockedAchievements = [];

    // NEW: Learning Profile & Progress Tracking
    if (!parsed.learningProfile) {
        parsed.learningProfile = {
            surveyDone: false,
            age: null,
            goal: null,
            interests: [],
            strongTopics: [],
            weakTopics: [],
            avgSpeed: 0, 
            totalQuestionsAnswered: 0,
            report: ""
        };
    }
    if (!parsed.lessonResults) parsed.lessonResults = {};

    // PATCH: Fix old storage auto counting PvP wins
    if (!parsed._pvpResetPatch2) {
        parsed.pvpWins = 0;
        parsed.unlockedAchievements = parsed.unlockedAchievements.filter(a => !a.startsWith('ach_pvp_'));
        parsed._pvpResetPatch2 = true;
    }

    // ⏳ LOGIC HỒI TRÁI TIM ⏳
    const maxHearts = parsed.accountStatus === 'premium' ? 10 : 2;
    // Bỏ qua nếu có bùa vô hạn tim
    const hasInfinite = parsed.inventory.infiniteHeartsExpiry && parsed.inventory.infiniteHeartsExpiry > Date.now();
    
    if (!hasInfinite) {
        // Enforce max constraint if downgraded
        if (parsed.hearts > maxHearts) {
            parsed.hearts = maxHearts;
        }

        if (parsed.hearts < maxHearts) {
            const now = Date.now();
            const diffMs = now - parsed.lastHeartRegenTime;
            const msPerHeart = 60 * 60 * 1000; // 60 phút
            
            if (diffMs >= msPerHeart) {
                const heartsToAdd = Math.floor(diffMs / msPerHeart);
                parsed.hearts = Math.min(maxHearts, parsed.hearts + heartsToAdd);
                // Giữ lại phần dư của thời gian (chỉ lấy phần nguyên)
                parsed.lastHeartRegenTime += heartsToAdd * msPerHeart; 
                
                // Lưu lại ngay
                localStorage.setItem('VieGeo_state', JSON.stringify(parsed));
            }
        } else {
            // Đã đầy tim, luôn reset timer về hiện tại để khi vừa mất tim, nó sẽ đếm lại từ đầu là 60 phút
            parsed.lastHeartRegenTime = Date.now();
        }
    }

    return parsed;
}

function saveGameState(state) {
    localStorage.setItem('VieGeo_state', JSON.stringify(state));
    
    // Đồng bộ lên Firebase (Fire and forget)
    const sessionData = localStorage.getItem('lm_session');
    if (sessionData && typeof db !== 'undefined') {
        const sessionUser = JSON.parse(sessionData);
        db.collection('users').doc(sessionUser.email).update({
            xp: state.xp,
            hearts: state.hearts,
            streak: state.streak,
            gems: state.gems,
            avatar: state.avatar,
            avatarIsBase64: state.avatarIsBase64,
            accountStatus: state.accountStatus,
            lastHeartRegenTime: state.lastHeartRegenTime
        }).catch(err => console.log("Lỗi đồng bộ Firebase:", err));
    }
}

// ── LEVEL CALCULATION ──
function getLevel(xp) {
    return Math.floor(xp / 100) + 1;
}

// ── LEADERBOARD MOCK DATA ──
const MOCK_LEADERBOARD = [
    { name: "Hải Nam", xp: 1250, avatar: "fa-user-ninja", color: "#58cc02" },
    { name: "Lan Anh", xp: 1100, avatar: "fa-user-astronaut", color: "#1cb0f6" },
    { name: "Bạn", xp: 0, avatar: "fa-user", color: "#ffc800", isMe: true },
    { name: "Minh Tuấn", xp: 850, avatar: "fa-user-secret", color: "#ce82ff" },
    { name: "Khánh Vy", xp: 620, avatar: "fa-user-graduate", color: "#ff4b4b" },
    { name: "Bot_Vina", xp: 450, avatar: "fa-robot", color: "#9ca3af" },
    { name: "Người Chơi Hệ Chiến", xp: 300, avatar: "fa-dragon", color: "#ffc800" },
    { name: "Học Bá Địa Lý", xp: 200, avatar: "fa-book-atlas", color: "#1cb0f6" }
];

// ── DAILY & EPIC QUESTS ──
const DAILY_QUESTS = [
    { id: "q1", title: "Khởi động nhẹ nhàng", desc: "Hoàn thành 3 bài học hôm nay", target: 3, reward: 20, type: "daily" },
    { id: "q2", title: "Hoàn mỹ", desc: "Đạt điểm tối đa 1 lần trong bài học", target: 1, reward: 50, type: "daily" },
    { id: "q3", title: "Cày cuốc XP", desc: "Kiếm được 150 XP", target: 150, reward: 100, type: "epic" },
    { id: "q4", title: "Kỷ luật thép", desc: "Giữ chuỗi học tập 7 ngày liên tiếp", target: 7, reward: 500, type: "epic" },
    { id: "q5", title: "Vua Đấu Trường", desc: "Tham gia 5 trận Đấu Trường Sinh Tử", target: 5, reward: 300, type: "epic" },
    { id: "q6", title: "Nhà Thám Hiểm Lão Làng", desc: "Đạt mốc Cấp 10", target: 10, reward: 1000, type: "achievement" },
    { id: "q7", title: "Đại Gia Tiền Tỷ", desc: "Thu thập 10,000 Xu", target: 10000, reward: 2000, type: "achievement" }
];

// ── SHOP ITEMS ──
const SHOP_ITEMS = [
    { id: "infinite_hearts", title: "Trái tim vô hạn", desc: "Không bao giờ mất mạng trong 15 phút.", price: 50, icon: "fa-heart", color: "#ff4b4b" },
    { id: "freeze", title: "Khiên đóng băng", desc: "Bảo vệ Chuỗi ngày nếu bạn quên học 1 ngày.", price: 200, icon: "fa-shield-halved", color: "#1cb0f6" },
    { id: "p_double_xp", title: "Bùa x2 XP (Đấu Trường)", desc: "Nhân đôi điểm số trong 1 câu hỏi đấu trường.", price: 30, icon: "fa-bolt", color: "#ffc800" },
    { id: "p_5050", title: "Bùa 50/50 (Đấu Trường)", desc: "Loại bỏ 2 đáp án sai trong đấu trường.", price: 40, icon: "fa-wand-magic-sparkles", color: "#ce82ff" }
];

// ── ARENA MATCHES (1vs1) ──
const ARENA_MATCHES = [
    { id: "arena_easy", title: "Khởi động (Dễ)", desc: "Trận chiến 1vs1. Nhịp độ chậm, câu hỏi lớp 5.", entryFee: 10, reward: 100, gradeFilter: "5", speed: "slow" },
    { id: "arena_medium", title: "Hiểu biết (Vừa)", desc: "Trận chiến 1vs1. Nhịp độ bình thường, câu hỏi lớp 8.", entryFee: 30, reward: 300, gradeFilter: "8", speed: "normal" },
    { id: "arena_hard", title: "Cao thủ (Khó)", desc: "Trận chiến 1vs1. Tốc độ cực gắt, câu hỏi lớp 12.", entryFee: 100, reward: 1000, gradeFilter: "12", speed: "fast" }
];

// ── GEOGRAPHY CONTENT (Theo SGK) ──
const N_PROVINCES = [
    "H� N?i", "H?i Ph�ng", "Qu?ng Ninh", "H� Giang", "L�o Cai", "Lai Ch�u", "�i?n Bi�n", "Son La", "Y�n B�i", "H�a B�nh", 
    "Ph� Th?", "Tuy�n Quang", "Cao B?ng", "B?c K?n", "Th�i Nguy�n", "L?ng Son", "B?c Giang", "B?c Ninh", "H?i Duong", 
    "Hung Y�n", "Vinh Ph�c", "H� Nam", "Nam �?nh", "Ninh B�nh", "Th�i B�nh"
];

const C_PROVINCES = [
    "Thanh H�a", "Ngh? An", "H� Tinh", "Qu?ng B�nh", "Qu?ng Tr?", "Th?a Thi�n Hu?", "�� N?ng", "Qu?ng Nam", "Qu?ng Ng�i", 
    "B�nh �?nh", "Ph� Y�n", "Kh�nh H�a", "Ninh Thu?n", "B�nh Thu?n", "Kon Tum", "Gia Lai", "�?k L?k", "�?k N�ng", "L�m �?ng"
];

const S_PROVINCES = [
    "H? Ch� Minh", "C?n Tho", "B�nh Phu?c", "T�y Ninh", "B�nh Duong", "�?ng Nai", "B� R?a - Vung T�u", "Long An", 
    "Ti?n Giang", "B?n Tre", "Tr� Vinh", "Vinh Long", "�?ng Th�p", "An Giang", "Ki�n Giang", "H?u Giang", "S�c Trang", 
    "B?c Li�u", "C� Mau"
];

function generateProvinceLessons(provName, provId) {
    try {
        const topics = [
            { id: "vt", name: "V? tr� d?a l�" },
            { id: "tn", name: "�i?u ki?n t? nhi�n" },
            { id: "dc", name: "D�n cu" },
            { id: "vh", name: "Van h�a" },
            { id: "kt", name: "Kinh t?" },
            { id: "dl", name: "Du l?ch" }
        ];

        let lessons = [];
        
        topics.forEach((topic, index) => {
            // L� thuy?t
            lessons.push({
                id: provId + "_th_" + topic.id,
                type: "theory",
                title: "L� thuy?t: " + topic.name,
                content: "�o?n d?c ng?n v? " + topic.name + " c?a " + provName + "...",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Ho_Hoan_Kiem.jpg/800px-Ho_Hoan_Kiem.jpg"
            });
            // Tr?c nghi?m
            lessons.push({
                id: provId + "_qz_" + topic.id,
                type: "quiz",
                title: "Luy?n t?p: " + topic.name,
                questions: [
                    { q: "�?c di?m " + topic.name.toLowerCase() + " c?a " + provName + " l� g�?", options: ["A", "B", "C", "D"], correctAnswer: 0, explanation: "��p �n d�ng." }
                ]
            });

            // Midterm 1 sau 3 b�i d?u
            if (index === 2) {
                lessons.push({
                    id: provId + "_midterm_1",
                    type: "quiz_midterm",
                    title: "Ki?m tra Gi?a kh�a 1 (" + provName + ")",
                    questions: [
                        { q: "T?ng h?p ki?n th?c ph?n 1 v? " + provName + "?", options: ["A", "B", "C", "D"], correctAnswer: 1, explanation: "T?t." }
                    ]
                });
            }
            // Midterm 2 sau 3 b�i cu?i
            if (index === 5) {
                lessons.push({
                    id: provId + "_midterm_2",
                    type: "quiz_midterm",
                    title: "Ki?m tra Gi?a kh�a 2 (" + provName + ")",
                    questions: [
                        { q: "T?ng h?p ki?n th?c ph?n 2 v? " + provName + "?", options: ["A", "B", "C", "D"], correctAnswer: 2, explanation: "Gi?i." }
                    ]
                });
            }
        });

        // Final quiz
        lessons.push({
            id: provId + "_final",
            type: "quiz_final",
            title: "Ki?m tra T?ng h?p " + provName,
            questions: [
                { q: "Ki?n th?c t?ng qu�t v? " + provName + "?", options: ["A", "B", "C", "D"], correctAnswer: 3, explanation: "Xu?t s?c." }
            ]
        });

        return lessons;
    } catch (e) {
        console.error("L?i khi t?o d? li?u b�i h?c cho " + provName, e);
        return []; // Fallback an to�n
    }
}

function generateRegions() {
    try {
        let northProvinces = N_PROVINCES.map((name, i) => ({
            id: "n_prov_" + i,
            name: name,
            color: "#1cb0f6",
            lessons: generateProvinceLessons(name, "n_prov_" + i)
        }));

        let centralProvinces = C_PROVINCES.map((name, i) => ({
            id: "c_prov_" + i,
            name: name,
            color: "#ff9600",
            lessons: generateProvinceLessons(name, "c_prov_" + i)
        }));

        let southProvinces = S_PROVINCES.map((name, i) => ({
            id: "s_prov_" + i,
            name: name,
            color: "#58cc02",
            lessons: generateProvinceLessons(name, "s_prov_" + i)
        }));

        return [
            {
                id: "region_north",
                name: "Mi?n B?c",
                color: "#ff4b4b",
                provinces: northProvinces
            },
            {
                id: "region_central",
                name: "Mi?n Trung",
                color: "#ffc800",
                provinces: centralProvinces
            },
            {
                id: "region_south",
                name: "Mi?n Nam",
                color: "#58cc02",
                provinces: southProvinces
            }
        ];
    } catch (e) {
        console.error("L?i khi t?o danh s�ch c�c Mi?n", e);
        return [];
    }
}

const LEARNING_REGIONS = generateRegions();
