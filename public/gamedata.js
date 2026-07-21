// ============================================================================
// VieGeo - GAME DATA & LOGIC CORE (Expanded for Arena & SGK)
// ============================================================================

const defaultGameState = {
    xp: 0,
    hearts: 3,
    streak: 0,
    maxHearts: 3,
    gems: 500, // Tăng thêm xu để dễ test
    currentUnit: 1,
    currentNode: 1,
    completedNodes: [],
    lastLogin: null,
    lastLoginDate: null,
    lastHeartUpdate: Date.now(),
    lastStudyDate: null,
    lastStreakAwardDate: null,
    
    // Avatar
    avatar: "fa-user-astronaut",
    avatarIsBase64: false, // Flag để xác định xem Avatar là icon hay ảnh upload

    // Lớp học
    selectedGrade: "all",
    gender: null,

    // Inventory (Shop items active)
    inventory: {
        infiniteHeartsExpiry: null,
        streakFreeze: 0,
        powerupDoubleXp: 0,
        powerup5050: 1,
        quizFreeze: 1,
        quizRemoveOne: 1
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
    unlockedAchievements: [],
    telemetry: {
        timeSpentPerQuestion: [],
        weaknessTags: [],
        studyHabits: [],
        lastUpdatedAt: null
    }
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

function getAchievementProgress(state, type) {
    const progressFields = {
        pvpWins: 'pvpWins',
        perfectLessons: 'perfectLessons',
        streak: 'streak',
        gems: 'gems',
        chestsOpened: 'chestsOpened'
    };
    return Math.max(0, Number(state?.[progressFields[type]]) || 0);
}

// Keeps achievement badges and their counter derived from the real game state.
// Once unlocked, a badge remains unlocked even if a spendable stat later drops.
function synchronizeAchievementsWithState(state) {
    if (!state || typeof state !== 'object') return [];
    const knownIds = new Set(ACHIEVEMENTS_LIST.map((achievement) => achievement.id));
    const unlocked = [...new Set((Array.isArray(state.unlockedAchievements) ? state.unlockedAchievements : [])
        .map(String)
        .filter((id) => knownIds.has(id)))];
    const unlockedSet = new Set(unlocked);
    const newlyUnlocked = [];

    ACHIEVEMENTS_LIST.forEach((achievement) => {
        if (!unlockedSet.has(achievement.id) && getAchievementProgress(state, achievement.type) >= achievement.target) {
            unlocked.push(achievement.id);
            unlockedSet.add(achievement.id);
            newlyUnlocked.push(achievement);
        }
    });

    state.unlockedAchievements = unlocked;
    state.achievementPoints = unlocked.length;
    return newlyUnlocked;
}

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
    let parsed;
    try {
        parsed = JSON.parse(state);
    } catch (error) {
        console.error('Dữ liệu trò chơi bị lỗi, đang khôi phục cấu trúc mặc định:', error);
        parsed = JSON.parse(JSON.stringify(defaultGameState));
    }
    if (!parsed.inventory) parsed.inventory = defaultGameState.inventory;
    if (parsed.inventory.powerupDoubleXp === undefined) parsed.inventory.powerupDoubleXp = 0;
    if (parsed.inventory.powerup5050 === undefined) parsed.inventory.powerup5050 = 1;
    if (parsed.inventory.quizFreeze === undefined) parsed.inventory.quizFreeze = 1;
    if (parsed.inventory.quizRemoveOne === undefined) parsed.inventory.quizRemoveOne = 1;
    if (!parsed.questsProgress) parsed.questsProgress = defaultGameState.questsProgress;
    if (!parsed.avatar) parsed.avatar = defaultGameState.avatar;
    if (parsed.selectedGrade === undefined) parsed.selectedGrade = defaultGameState.selectedGrade;
    // Khởi tạo các trường Premium nếu chưa có
    if (!parsed.accountStatus) parsed.accountStatus = 'free';
    if (!parsed.lastHeartUpdate) parsed.lastHeartUpdate = Number(parsed.lastHeartRegenTime) || Date.now();
    if (!parsed.lastHeartRegenTime) parsed.lastHeartRegenTime = parsed.lastHeartUpdate;
    
    // Khởi tạo các trường Thành tựu nếu chưa có
    if (parsed.pvpWins === undefined) parsed.pvpWins = 0;
    if (parsed.perfectLessons === undefined) parsed.perfectLessons = 0;
    if (parsed.chestsOpened === undefined) parsed.chestsOpened = 0;
    if (parsed.achievementPoints === undefined) parsed.achievementPoints = 0;
    if (!parsed.unlockedAchievements) parsed.unlockedAchievements = [];
    if (!parsed.telemetry || typeof parsed.telemetry !== 'object') parsed.telemetry = {};
    if (!Array.isArray(parsed.telemetry.timeSpentPerQuestion)) parsed.telemetry.timeSpentPerQuestion = [];
    if (!Array.isArray(parsed.telemetry.weaknessTags)) parsed.telemetry.weaknessTags = [];
    if (!Array.isArray(parsed.telemetry.studyHabits)) parsed.telemetry.studyHabits = [];
    if (!parsed.lastStudyDate) parsed.lastStudyDate = null;
    if (!parsed.lastStreakAwardDate) parsed.lastStreakAwardDate = parsed.lastStudyDate || null;

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
    // Migration for accounts created before the complete learning-profile schema.
    if (!Array.isArray(parsed.learningProfile.interests)) parsed.learningProfile.interests = [];
    if (!Array.isArray(parsed.learningProfile.strongTopics)) parsed.learningProfile.strongTopics = [];
    if (!Array.isArray(parsed.learningProfile.weakTopics)) parsed.learningProfile.weakTopics = [];
    if (!Number.isFinite(parsed.learningProfile.totalQuestionsAnswered)) parsed.learningProfile.totalQuestionsAnswered = 0;
    if (!parsed.lessonResults) parsed.lessonResults = {};

    refreshStreakForToday(parsed);

    // Preserve recorded PvP progress. Earlier versions reset it here, which
    // made achievement data disagree with the rest of the user's progress.
    if (!parsed._pvpResetPatch2) {
        parsed._pvpResetPatch2 = true;
    }

    synchronizeAchievementsWithState(parsed);

    // ⏳ LOGIC HỒI TRÁI TIM ⏳
    const maxHearts = 3;
    parsed.maxHearts = maxHearts;
    // Bỏ qua nếu có bùa vô hạn tim
    const hasInfinite = parsed.inventory.infiniteHeartsExpiry && parsed.inventory.infiniteHeartsExpiry > Date.now();
    
    if (!hasInfinite) {
        // Enforce max constraint if downgraded
        if (parsed.hearts > maxHearts) {
            parsed.hearts = maxHearts;
        }

        if (parsed.hearts < maxHearts) {
            const now = Date.now();
            const diffMs = now - parsed.lastHeartUpdate;
            const msPerHeart = 15 * 60 * 1000;
            
            if (diffMs >= msPerHeart) {
                const heartsToAdd = Math.floor(diffMs / msPerHeart);
                parsed.hearts = Math.min(maxHearts, parsed.hearts + heartsToAdd);
                // Giữ lại phần dư của thời gian (chỉ lấy phần nguyên)
                parsed.lastHeartUpdate += heartsToAdd * msPerHeart;
                parsed.lastHeartRegenTime = parsed.lastHeartUpdate;
                
                // Lưu lại ngay
                localStorage.setItem('VieGeo_state', JSON.stringify(parsed));
            }
        } else {
            // Đã đầy tim, luôn reset timer về hiện tại để khi vừa mất tim, nó sẽ đếm lại từ đầu là 60 phút
            parsed.lastHeartUpdate = Date.now();
            parsed.lastHeartRegenTime = parsed.lastHeartUpdate;
        }
    }

    return parsed;
}

function buildPersistedGameState(state) {
    synchronizeAchievementsWithState(state);
    const copyObject = (value, fallback = {}) => value && typeof value === 'object' && !Array.isArray(value)
        ? JSON.parse(JSON.stringify(value))
        : fallback;
    const copyArray = (value) => Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : [];

    return {
        schemaVersion: 2,
        updatedAt: Date.now(),
        xp: Number(state.xp) || 0,
        hearts: Math.max(0, Number(state.hearts) || 0),
        maxHearts: Number(state.maxHearts) || 3,
        gems: Number(state.gems) || 0,
        streak: Number(state.streak) || 0,
        currentUnit: Number(state.currentUnit) || 1,
        currentNode: Number(state.currentNode) || 1,
        completedNodes: [...new Set(copyArray(state.completedNodes).map(String))],
        lessonResults: copyObject(state.lessonResults),
        inventory: copyObject(state.inventory),
        questsProgress: copyObject(state.questsProgress),
        claimedMissionRewards: copyArray(state.claimedMissionRewards).map(String),
        unlockedAchievements: copyArray(state.unlockedAchievements).map(String),
        pvpWins: Number(state.pvpWins) || 0,
        perfectLessons: Number(state.perfectLessons) || 0,
        chestsOpened: Number(state.chestsOpened) || 0,
        achievementPoints: Number(state.achievementPoints) || 0,
        lastHeartUpdate: Number(state.lastHeartUpdate) || Date.now(),
        lastHeartRegenTime: Number(state.lastHeartRegenTime || state.lastHeartUpdate) || Date.now(),
        lastLogin: state.lastLogin || null,
        lastLoginDate: state.lastLoginDate || state.lastLogin || null,
        lastStudyDate: state.lastStudyDate || null,
        lastStreakAwardDate: state.lastStreakAwardDate || state.lastStudyDate || null,
        selectedGrade: state.selectedGrade || 'all',
        gender: state.gender || null,
        avatar: state.avatar || null,
        avatarIsBase64: state.avatarIsBase64 === true,
        accountStatus: state.accountStatus || 'free',
        learningProfile: copyObject(state.learningProfile),
        telemetry: copyObject(state.telemetry)
    };
}

function saveGameState(state) {
    if (!state || typeof state !== 'object') return Promise.resolve(false);
    const persistedState = buildPersistedGameState(state);
    Object.assign(state, persistedState);
    if (window.gameState && window.gameState !== state) Object.assign(window.gameState, persistedState);
    localStorage.setItem('VieGeo_state', JSON.stringify(persistedState));
    
    // Đồng bộ lên Firebase (Fire and forget)
    const sessionData = localStorage.getItem('lm_session');
    if (sessionData && typeof db !== 'undefined') {
        const sessionUser = JSON.parse(sessionData);
        return db.collection('users').doc(sessionUser.email).set({
            xp: state.xp,
            hearts: state.hearts,
            streak: state.streak,
            currentStreak: state.streak,
            gems: state.gems,
            pvpWins: state.pvpWins,
            perfectLessons: state.perfectLessons,
            chestsOpened: state.chestsOpened,
            achievementPoints: state.achievementPoints,
            unlockedAchievements: persistedState.unlockedAchievements,
            avatar: state.avatar,
            avatarIsBase64: state.avatarIsBase64,
            accountStatus: state.accountStatus,
            lastHeartUpdate: state.lastHeartUpdate,
            lastHeartRegenTime: state.lastHeartRegenTime,
            lastLogin: state.lastLogin,
            lastLoginDate: state.lastLoginDate || state.lastLogin,
            lastStudyDate: state.lastStudyDate,
            lastStreakAwardDate: state.lastStreakAwardDate || state.lastStudyDate || null,
            grade: state.selectedGrade === 'all' ? null : Number(state.selectedGrade),
            selectedGrade: state.selectedGrade,
            gender: state.gender || null,
            learningProfile: state.learningProfile || {},
            telemetry: state.telemetry || {},
            gameState: persistedState,
            completedNodes: persistedState.completedNodes,
            currentNode: persistedState.currentNode,
            lessonResults: persistedState.lessonResults,
            inventory: persistedState.inventory,
            questsProgress: persistedState.questsProgress,
            gameStateUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => true).catch(err => {
            console.error("Lỗi đồng bộ Firebase:", err);
            return false;
        });
    }
    return Promise.resolve(false);
}

function refreshStreakForToday(state) {
    // Opening a page is not study activity: do not increment or reset streaks here.
    return state;
}

function recordStudyActivity(state) {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const previousKey = state.lastStreakAwardDate || state.lastStudyDate;

    // A second completed lesson on the same calendar day receives no extra streak.
    if (previousKey === todayKey) return state;

    const previousStreak = Math.max(0, Number(state.streak) || 0);
    if (!previousKey) {
        state.streak = Math.max(1, previousStreak);
    } else {
        const previousDate = new Date(`${previousKey}T00:00:00`);
        const todayDate = new Date(`${todayKey}T00:00:00`);
        const daysElapsed = Math.round((todayDate - previousDate) / 86400000);
        state.streak = daysElapsed === 1 ? Math.max(1, previousStreak + 1) : 1;
    }

    state.lastStudyDate = todayKey;
    state.lastStreakAwardDate = todayKey;
    return state;
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
    "Hà Nội", "Hải Phòng", "Quảng Ninh", "Hà Giang", "Lào Cai", "Lai Châu", "Điện Biên", "Sơn La", "Yên Bái", "Hòa Bình", 
    "Phú Thọ", "Tuyên Quang", "Cao Bằng", "Bắc Kạn", "Thái Nguyên", "Lạng Sơn", "Bắc Giang", "Bắc Ninh", "Hải Dương", 
    "Hưng Yên", "Vĩnh Phúc", "Hà Nam", "Nam Định", "Ninh Bình", "Thái Bình"
];

const C_PROVINCES = [
    "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", 
    "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng"
];

const S_PROVINCES = [
    "Hồ Chí Minh", "Cần Thơ", "Bình Phước", "Tây Ninh", "Bình Dương", "Đồng Nai", "Bà Rịa - Vũng Tàu", "Long An", 
    "Tiền Giang", "Bến Tre", "Trà Vinh", "Vĩnh Long", "Đồng Tháp", "An Giang", "Kiên Giang", "Hậu Giang", "Sóc Trăng", 
    "Bạc Liêu", "Cà Mau"
];

function generateProvinceLessons(provName, provId) {
    try {
        const topics = [
            { id: "vt", name: "Vị trí địa lý" },
            { id: "tn", name: "Điều kiện tự nhiên" },
            { id: "dc", name: "Dân cư" },
            { id: "vh", name: "Văn hóa" },
            { id: "kt", name: "Kinh tế" },
            { id: "dl", name: "Du lịch" }
        ];

        let lessons = [];
        
        topics.forEach((topic, index) => {
            // Lý thuyết
            lessons.push({
                id: provId + "_th_" + topic.id,
                type: "theory",
                title: "Lý thuyết: " + topic.name,
                content: "Đoạn đọc ngắn về " + topic.name + " của " + provName + "...",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Ho_Hoan_Kiem.jpg/800px-Ho_Hoan_Kiem.jpg"
            });
            // Trắc nghiệm
            lessons.push({
                id: provId + "_qz_" + topic.id,
                type: "quiz",
                title: "Luyện tập: " + topic.name,
                questions: [
                    { q: "Đặc điểm " + topic.name.toLowerCase() + " của " + provName + " là gì?", options: ["A", "B", "C", "D"], correctAnswer: 0, explanation: "Đáp án đúng." }
                ]
            });

            // Giữa kỳ 1 sau 3 bài đầu
            if (index === 2) {
                lessons.push({
                    id: provId + "_midterm_1",
                    type: "quiz_midterm",
                    title: "Kiểm tra Giữa khóa 1 (" + provName + ")",
                    questions: [
                        { q: "Tổng hợp kiến thức phần 1 về " + provName + "?", options: ["A", "B", "C", "D"], correctAnswer: 1, explanation: "Tốt." }
                    ]
                });
            }
            // Giữa kỳ 2 sau 3 bài cuối
            if (index === 5) {
                lessons.push({
                    id: provId + "_midterm_2",
                    type: "quiz_midterm",
                    title: "Kiểm tra Giữa khóa 2 (" + provName + ")",
                    questions: [
                        { q: "Tổng hợp kiến thức phần 2 về " + provName + "?", options: ["A", "B", "C", "D"], correctAnswer: 2, explanation: "Giỏi." }
                    ]
                });
            }
        });

        // Final quiz
        lessons.push({
            id: provId + "_final",
            type: "quiz_final",
            title: "Kiểm tra Tổng hợp " + provName,
            questions: [
                { q: "Kiến thức tổng quát về " + provName + "?", options: ["A", "B", "C", "D"], correctAnswer: 3, explanation: "Xuất sắc." }
            ]
        });

        return lessons;
    } catch (e) {
        console.error("Lỗi khi tạo dữ liệu bài học cho " + provName, e);
        return []; // Fallback an toàn
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
                name: "Miền Bắc",
                color: "#ff4b4b",
                provinces: northProvinces
            },
            {
                id: "region_central",
                name: "Miền Trung",
                color: "#ffc800",
                provinces: centralProvinces
            },
            {
                id: "region_south",
                name: "Miền Nam",
                color: "#58cc02",
                provinces: southProvinces
            }
        ];
    } catch (e) {
        console.error("Lỗi khi tạo danh sách các Miền", e);
        return [];
    }
}

const LEARNING_REGIONS = generateRegions();
