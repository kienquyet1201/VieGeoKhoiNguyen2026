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
const LEARNING_REGIONS = [
    {
        "id": "region_north",
        "name": "Miền Bắc",
        "color": "#ff4b4b",
        "provinces": [
            {
                "id": "prov_hanoi",
                "name": "Hà Nội",
                "color": "#1cb0f6",
                "lessons": [
                    {
                        "id": "hanoi_1",
                        "type": "theory",
                        "title": "Lý thuyết: Vị trí Địa lí",
                        "content": "Hà Nội là thủ đô của nước Cộng hòa Xã hội chủ nghĩa Việt Nam, nằm ở phía tây bắc trung tâm đồng bằng châu thổ sông Hồng. Hà Nội có vị trí từ 20°34' đến 21°18' vĩ độ Bắc và từ 105°17' đến 106°02' kinh độ Đông, tiếp giáp với các tỉnh Thái Nguyên, Vĩnh Phúc ở phía Bắc, Hà Nam, Hòa Bình ở phía Nam, Bắc Giang, Bắc Ninh và Hưng Yên ở phía Đông, Hòa Bình cùng Phú Thọ ở phía Tây.",
                        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Ho_Hoan_Kiem.jpg/800px-Ho_Hoan_Kiem.jpg"
                    },
                    {
                        "id": "hanoi_2",
                        "type": "quiz",
                        "title": "Luyện tập: Vị trí Địa lí",
                        "questions": [
                            {
                                "question": "Hà Nội nằm ở đồng bằng nào?",
                                "options": [
                                    "Đồng bằng sông Hồng",
                                    "Đồng bằng sông Cửu Long",
                                    "Đồng bằng duyên hải miền Trung",
                                    "Đồng bằng Bắc Bộ"
                                ],
                                "correctAnswer": 0,
                                "explanation": "Hà Nội nằm ở trung tâm đồng bằng châu thổ sông Hồng."
                            },
                            {
                                "question": "Thủ đô Hà Nội không tiếp giáp với tỉnh nào sau đây?",
                                "options": [
                                    "Bắc Ninh",
                                    "Hải Phòng",
                                    "Hưng Yên",
                                    "Vĩnh Phúc"
                                ],
                                "correctAnswer": 1,
                                "explanation": "Hà Nội không giáp với Hải Phòng."
                            }
                        ]
                    },
                    {
                        "id": "hanoi_mid",
                        "type": "quiz_midterm",
                        "title": "Kiểm tra Giữa khóa (Hà Nội)",
                        "questions": [
                            {
                                "question": "Phía Bắc của Hà Nội giáp với tỉnh nào?",
                                "options": [
                                    "Thái Nguyên, Vĩnh Phúc",
                                    "Bắc Giang, Bắc Ninh",
                                    "Hà Nam, Hòa Bình",
                                    "Phú Thọ"
                                ],
                                "correctAnswer": 0,
                                "explanation": "Hà Nội tiếp giáp với Thái Nguyên và Vĩnh Phúc ở phía Bắc."
                            }
                        ]
                    },
                    {
                        "id": "hanoi_3",
                        "type": "theory",
                        "title": "Văn hóa & Lịch sử",
                        "content": "Hà Nội có lịch sử ngàn năm văn hiến, nổi tiếng với 36 phố phường, Văn Miếu Quốc Tử Giám - trường đại học đầu tiên của Việt Nam, và Lăng Chủ tịch Hồ Chí Minh. Ẩm thực Hà Nội phong phú với các món ăn đặc trưng như Phở, Bún chả, Cốm làng Vòng...",
                        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Van_Mieu.jpg/800px-Van_Mieu.jpg"
                    },
                    {
                        "id": "hanoi_4",
                        "type": "theory",
                        "title": "Kinh tế và Giao thông",
                        "content": "Hà Nội là đầu mối giao thông quan trọng với Sân bay Quốc tế Nội Bài, ga Hà Nội và nhiều tuyến đường bộ cao tốc huyết mạch. Kinh tế thủ đô đang phát triển mạnh mẽ theo hướng công nghiệp hóa và dịch vụ.",
                        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Noibai_terminal_2.jpg/800px-Noibai_terminal_2.jpg"
                    },
                    {
                        "id": "hanoi_final",
                        "type": "quiz_final",
                        "title": "Đại Thử Thách (Hà Nội)",
                        "questions": [
                            {
                                "question": "Trường đại học đầu tiên của Việt Nam nằm ở Hà Nội là gì?",
                                "options": [
                                    "Quốc Học Huế",
                                    "Văn Miếu Quốc Tử Giám",
                                    "Đại học Đông Dương",
                                    "Đại học Tổng hợp"
                                ],
                                "correctAnswer": 1,
                                "explanation": "Văn Miếu Quốc Tử Giám là trường đại học đầu tiên của Việt Nam."
                            },
                            {
                                "question": "Món ăn nào sau đây là đặc sản nổi tiếng của Hà Nội?",
                                "options": [
                                    "Mì Quảng",
                                    "Hủ tiếu",
                                    "Cốm làng Vòng",
                                    "Bánh xèo"
                                ],
                                "correctAnswer": 2,
                                "explanation": "Cốm làng Vòng là đặc sản rất nổi tiếng của Hà Nội."
                            }
                        ]
                    }
                ]
            },
            {
                "id": "prov_quangninh",
                "name": "Quảng Ninh",
                "color": "#ce82ff",
                "lessons": [
                    {
                        "id": "qn_1",
                        "type": "theory",
                        "title": "Vịnh Hạ Long",
                        "content": "Quảng Ninh nổi tiếng với Vịnh Hạ Long, một Di sản Thiên nhiên Thế giới được UNESCO công nhận. Nơi đây có hàng ngàn hòn đảo đá vôi nhô lên từ mặt nước biển xanh biếc, tạo nên một cảnh quan thiên nhiên hùng vĩ và thơ mộng.",
                        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Ha_Long_Bay_Vietnam.jpg/800px-Ha_Long_Bay_Vietnam.jpg"
                    },
                    {
                        "id": "qn_2",
                        "type": "quiz_midterm",
                        "title": "Thử thách Hạ Long",
                        "questions": [
                            {
                                "question": "Vịnh Hạ Long có khoảng bao nhiêu hòn đảo lớn nhỏ?",
                                "options": ["Gần 1,000", "Gần 2,000", "Gần 3,000", "Gần 4,000"],
                                "correctAnswer": 1,
                                "explanation": "Vịnh Hạ Long bao gồm khoảng 1,969 hòn đảo lớn nhỏ."
                            }
                        ]
                    },
                    {
                        "id": "qn_3",
                        "type": "theory",
                        "title": "Công nghiệp khai thác than",
                        "content": "Quảng Ninh là vùng khai thác than đá lớn nhất Việt Nam. Ngành công nghiệp khai thác than đóng vai trò quan trọng trong sự phát triển kinh tế của tỉnh, với các mỏ than lớn như Cẩm Phả, Hòn Gai, Uông Bí.",
                        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/M%E1%BB%8F_than_C%E1%BB%8Dc_S%C3%A1u.jpg/800px-M%E1%BB%8F_than_C%E1%BB%8Dc_S%C3%A1u.jpg"
                    },
                    {
                        "id": "qn_4",
                        "type": "quiz_midterm",
                        "title": "Thủ phủ vàng đen",
                        "questions": [
                            {
                                "question": "Tài nguyên khoáng sản nổi bật nhất của Quảng Ninh là gì?",
                                "options": ["Dầu mỏ", "Bô-xít", "Than đá", "Sắt"],
                                "correctAnswer": 2,
                                "explanation": "Quảng Ninh là trung tâm khai thác than đá lớn nhất cả nước."
                            }
                        ]
                    },
                    {
                        "id": "qn_final",
                        "type": "quiz_final",
                        "title": "Kiểm tra Tổng hợp (Quảng Ninh)",
                        "questions": [
                            {
                                "question": "Di sản thiên nhiên thế giới nào nằm ở Quảng Ninh?",
                                "options": [
                                    "Vịnh Nha Trang",
                                    "Vịnh Lăng Cô",
                                    "Vịnh Hạ Long",
                                    "Vịnh Cam Ranh"
                                ],
                                "correctAnswer": 2,
                                "explanation": "Vịnh Hạ Long được UNESCO công nhận là di sản thiên nhiên thế giới."
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "id": "region_central",
        "name": "Miền Trung",
        "color": "#ffc800",
        "provinces": [
            {
                "id": "prov_danang",
                "name": "Đà Nẵng",
                "color": "#1cb0f6",
                "lessons": [
                    {
                        "id": "dn_1",
                        "type": "theory",
                        "title": "Thành phố Đáng Sống",
                        "content": "Đà Nẵng là trung tâm kinh tế, văn hóa, giáo dục và khoa học công nghệ của miền Trung - Tây Nguyên. Nơi đây có các danh thắng nổi tiếng như Ngũ Hành Sơn, Bà Nà Hills, Bán đảo Sơn Trà và bãi biển Mỹ Khê.",
                        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Da_Nang_Skyline.jpg/800px-Da_Nang_Skyline.jpg"
                    },
                    {
                        "id": "dn_2",
                        "type": "quiz_midterm",
                        "title": "Khám phá Sơn Trà",
                        "questions": [
                            {
                                "question": "Bán đảo Sơn Trà nằm ở hướng nào của thành phố Đà Nẵng?",
                                "options": ["Đông Bắc", "Tây Bắc", "Đông Nam", "Tây Nam"],
                                "correctAnswer": 0,
                                "explanation": "Bán đảo Sơn Trà nằm ở hướng Đông Bắc của thành phố Đà Nẵng."
                            }
                        ]
                    },
                    {
                        "id": "dn_3",
                        "type": "theory",
                        "title": "Những cây cầu lịch sử",
                        "content": "Đà Nẵng được mệnh danh là 'Thành phố của những cây cầu' với nhiều cây cầu độc đáo như Cầu Rồng, Cầu Sông Hàn (cầu quay duy nhất tại Việt Nam), và Cầu Trần Thị Lý.",
                        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Dragon_Bridge%2C_Da_Nang_01.jpg/800px-Dragon_Bridge%2C_Da_Nang_01.jpg"
                    },
                    {
                        "id": "dn_4",
                        "type": "quiz_midterm",
                        "title": "Thử thách Cầu Rồng",
                        "questions": [
                            {
                                "question": "Cây cầu nào ở Đà Nẵng có khả năng phun lửa và phun nước?",
                                "options": ["Cầu Sông Hàn", "Cầu Rồng", "Cầu Thuận Phước", "Cầu Trần Thị Lý"],
                                "correctAnswer": 1,
                                "explanation": "Cầu Rồng là biểu tượng mới của Đà Nẵng, có khả năng phun lửa và nước vào mỗi dịp cuối tuần."
                            }
                        ]
                    },
                    {
                        "id": "dn_5",
                        "type": "theory",
                        "title": "Văn hóa Ẩm thực",
                        "content": "Đến Đà Nẵng không thể không thưởng thức các món ăn đặc sản như Mì Quảng, Bánh tráng cuốn thịt heo, Gỏi cá Nam Ô và hải sản tươi ngon.",
                        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Mi_Quang_Da_Nang.jpg/800px-Mi_Quang_Da_Nang.jpg"
                    },
                    {
                        "id": "dn_6",
                        "type": "quiz_midterm",
                        "title": "Món ngon Đà Nẵng",
                        "questions": [
                            {
                                "question": "Món ăn nào sau đây là đặc sản nổi tiếng của Đà Nẵng?",
                                "options": ["Phở bò", "Bún chả", "Mì Quảng", "Cơm tấm"],
                                "correctAnswer": 2,
                                "explanation": "Mì Quảng là món ăn truyền thống và đặc sản nổi tiếng của Quảng Nam - Đà Nẵng."
                            }
                        ]
                    },
                    {
                        "id": "dn_final",
                        "type": "quiz_final",
                        "title": "Kiểm tra Tổng hợp (Đà Nẵng)",
                        "questions": [
                            {
                                "question": "Bãi biển nào sau đây thuộc Đà Nẵng?",
                                "options": [
                                    "Bãi biển Nha Trang",
                                    "Bãi biển Mỹ Khê",
                                    "Bãi biển Cửa Lò",
                                    "Bãi biển Sầm Sơn"
                                ],
                                "correctAnswer": 1,
                                "explanation": "Bãi biển Mỹ Khê là một trong những bãi biển đẹp nhất ở Đà Nẵng."
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "id": "region_south",
        "name": "Miền Nam",
        "color": "#58cc02",
        "provinces": [
            {
                "id": "prov_hcm",
                "name": "TP. Hồ Chí Minh",
                "color": "#1cb0f6",
                "lessons": [
                    {
                        "id": "hcm_1",
                        "type": "theory",
                        "title": "Trung tâm Kinh tế",
                        "content": "TP. Hồ Chí Minh (Sài Gòn) là thành phố lớn nhất Việt Nam về dân số và quy mô kinh tế. Thành phố có nhiều công trình kiến trúc mang đậm dấu ấn lịch sử như Dinh Độc Lập, Nhà thờ Đức Bà, Bưu điện trung tâm Sài Gòn, Chợ Bến Thành.",
                        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Ho_Chi_Minh_City_skyline.jpg/800px-Ho_Chi_Minh_City_skyline.jpg"
                    },
                    {
                        "id": "hcm_final",
                        "type": "quiz_final",
                        "title": "Kiểm tra Tổng hợp (TP.HCM)",
                        "questions": [
                            {
                                "question": "Công trình nào sau đây biểu tượng của TP.HCM?",
                                "options": [
                                    "Chùa Một Cột",
                                    "Chợ Bến Thành",
                                    "Cầu Rồng",
                                    "Tháp Chàm"
                                ],
                                "correctAnswer": 1,
                                "explanation": "Chợ Bến Thành là một trong những biểu tượng nổi tiếng của TP.HCM."
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

// ── KHO CÂU HỎI PVP (Đấu trường) ──
const PVP_POOL = [
    {
    "id": "pvp_easy_pool",
    "title": "Kho câu hỏi PvP Dễ",
    "grade": "5",
    "color": "#ff4b4b",
    "minLevel": 1,
    "isPvPOnly": true,
    "nodes": [
        {
            "id": "pvp_easy_pool_m1",
            "title": "Mốc 1: Dễ",
            "type": "lesson",
            "icon": "fa-khanda",
            "questions": [
            {
                    "question": "Diện tích tự nhiên phần đất liền của Việt Nam là khoảng bao nhiêu?",
                    "options": [
                            "320.000 km²",
                            "331.212 km²",
                            "336.000 km²",
                            "350.000 km²"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Đường bờ biển Việt Nam dài bao nhiêu km?",
                    "options": [
                            "3.260 km",
                            "2.360 km",
                            "3.460 km",
                            "3.026 km"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Điểm cực Bắc của phần đất liền nước ta nằm ở tỉnh nào?",
                    "options": [
                            "Cao Bằng",
                            "Lạng Sơn",
                            "Hà Giang",
                            "Lào Cai"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Điểm cực Nam của phần đất liền nước ta nằm ở tỉnh nào?",
                    "options": [
                            "Kiên Giang",
                            "Bạc Liêu",
                            "Cà Mau",
                            "Sóc Trăng"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Điểm cực Đông của phần đất liền nước ta nằm ở tỉnh nào?",
                    "options": [
                            "Phú Yên",
                            "Khánh Hòa",
                            "Ninh Thuận",
                            "Bình Định"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Điểm cực Tây của phần đất liền nước ta nằm ở tỉnh nào?",
                    "options": [
                            "Điện Biên",
                            "Lai Châu",
                            "Sơn La",
                            "Hà Giang"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Nước ta có chung đường biên giới trên đất liền dài nhất với quốc gia nào?",
                    "options": [
                            "Trung Quốc",
                            "Lào",
                            "Campuchia",
                            "Thái Lan"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Nước ta có chung đường biên giới trên đất liền ngắn nhất với quốc gia nào?",
                    "options": [
                            "Trung Quốc",
                            "Lào",
                            "Campuchia",
                            "Thái Lan"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Vịnh biển nào của Việt Nam được UNESCO nhiều lần công nhận là Di sản thiên nhiên thế giới?",
                    "options": [
                            "Vịnh Nha Trang",
                            "Vịnh Cam Ranh",
                            "Vịnh Hạ Long",
                            "Vịnh Xuân Đài"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Quần đảo Trường Sa thuộc đơn vị hành chính của tỉnh/thành phố nào?",
                    "options": [
                            "Đà Nẵng",
                            "Quảng Nam",
                            "Khánh Hòa",
                            "Bà Rịa - Vũng Tàu"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Quần đảo Hoàng Sa thuộc đơn vị hành chính của tỉnh/thành phố nào?",
                    "options": [
                            "Đà Nẵng",
                            "Quảng Nam",
                            "Khánh Hòa",
                            "Thừa Thiên Huế"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Lãnh thổ Việt Nam nằm hoàn toàn trong múi giờ thứ mấy?",
                    "options": [
                            "Múi giờ số 6",
                            "Múi giờ số 7",
                            "Múi giờ số 8",
                            "Múi giờ số 9"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Tổng chiều dài đường biên giới trên đất liền của nước ta là bao nhiêu?",
                    "options": [
                            "Khoảng 3.260 km",
                            "Khoảng 4.600 km",
                            "Khoảng 5.000 km",
                            "Khoảng 4.000 km"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Vùng biển Việt Nam có diện tích khoảng bao nhiêu?",
                    "options": [
                            "Khoảng 1 triệu km²",
                            "Khoảng 2 triệu km²",
                            "Khoảng 3 triệu km²",
                            "Khoảng 1,5 triệu km²"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Tỉnh nào ở nước ta vừa có đường biên giới trên đất liền, vừa có đường bờ biển?",
                    "options": [
                            "Quảng Ninh và Kiên Giang",
                            "Hải Phòng và Cà Mau",
                            "Lạng Sơn và Kiên Giang",
                            "Quảng Ninh và Cà Mau"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Địa hình đồi núi chiếm khoảng bao nhiêu phần diện tích lãnh thổ nước ta?",
                    "options": [
                            "1/2 diện tích",
                            "1/3 diện tích",
                            "3/4 diện tích",
                            "1/4 diện tích"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Hướng nghiêng chung của địa hình Việt Nam là hướng nào?",
                    "options": [
                            "Tây - Đông",
                            "Bắc - Nam",
                            "Tây Bắc - Đông Nam",
                            "Đông Bắc - Tây Nam"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Đỉnh núi nào được mệnh danh là \"Nóc nhà Đông Dương\"?",
                    "options": [
                            "Pu Ta Leng",
                            "Fansipan",
                            "Tây Côn Lĩnh",
                            "Ngọc Linh"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Đỉnh Fansipan có độ cao bao nhiêu mét?",
                    "options": [
                            "3.143m",
                            "3.413m",
                            "3.314m",
                            "3.134m"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Dãy núi dài nhất Việt Nam là dãy núi nào?",
                    "options": [
                            "Dãy Hoàng Liên Sơn",
                            "Dãy Trường Sơn",
                            "Dãy Bạch Mã",
                            "Dãy Con Voi"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Địa hình đồng bằng chiếm bao nhiêu phần diện tích lãnh thổ?",
                    "options": [
                            "1/4 diện tích",
                            "2/4 diện tích",
                            "3/4 diện tích",
                            "1/3 diện tích"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Đồng bằng phù sa lớn nhất Việt Nam là đồng bằng nào?",
                    "options": [
                            "Đồng bằng sông Hồng",
                            "Đồng bằng sông Cửu Long",
                            "Đồng bằng ven biển miền Trung",
                            "Đồng bằng Thanh Hóa"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Đồng bằng sông Hồng do hệ thống sông nào bồi đắp?",
                    "options": [
                            "Sông Hồng và sông Đà",
                            "Sông Hồng và sông Thái Bình",
                            "Sông Hồng và sông Lô",
                            "Sông Hồng và sông Mã"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Dãy Bạch Mã là ranh giới tự nhiên giữa 2 tỉnh/thành phố nào?",
                    "options": [
                            "Quảng Trị - Thừa Thiên Huế",
                            "Thừa Thiên Huế - Đà Nẵng",
                            "Đà Nẵng - Quảng Nam",
                            "Hà Tĩnh - Quảng Bình"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Vùng núi Đông Bắc có những cánh cung núi lớn nào?",
                    "options": [
                            "Sông Gâm, Ngân Sơn, Bắc Sơn, Đông Triều",
                            "Hoàng Liên Sơn, Con Voi, Tam Đảo",
                            "Pu Đen Đinh, Pu Sam Sao",
                            "Trường Sơn Bắc, Hoành Sơn"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Dãy Hoàng Liên Sơn nằm ở vùng núi nào của nước ta?",
                    "options": [
                            "Vùng Tây Bắc",
                            "Vùng Đông Bắc",
                            "Vùng Bắc Trung Bộ",
                            "Vùng Tây Nguyên"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Dạng địa hình bán bình nguyên thể hiện rõ nhất ở vùng nào?",
                    "options": [
                            "Tây Nguyên",
                            "Đông Nam Bộ",
                            "Bắc Trung Bộ",
                            "Trung du và miền núi Bắc Bộ"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Vùng núi Trường Sơn Bắc kéo dài từ đâu đến đâu?",
                    "options": [
                            "Từ phía nam sông Mã đến dãy Bạch Mã",
                            "Từ phía nam sông Cả đến dãy Bạch Mã",
                            "Từ sông Chu đến đèo Hải Vân",
                            "Từ sông Hồng đến sông Cả"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Đặc điểm nổi bật của địa hình đồng bằng ven biển miền Trung là gì?",
                    "options": [
                            "Rộng lớn, bằng phẳng",
                            "Hẹp ngang, bị chia cắt thành nhiều đồng bằng nhỏ",
                            "Thấp trũng, nhiều đầm lầy",
                            "Mở rộng về phía Tây"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Địa hình cacxtơ (núi đá vôi) có nhiều nhất ở khu vực nào?",
                    "options": [
                            "Tây Bắc, Đông Bắc và Bắc Trung Bộ",
                            "Tây Nguyên",
                            "Nam Trung Bộ",
                            "Đông Nam Bộ"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Đèo Hải Vân là đoạn cắt ngang ra biển của dãy núi nào?",
                    "options": [
                            "Dãy Hoàng Liên Sơn",
                            "Dãy Hoành Sơn",
                            "Dãy Bạch Mã",
                            "Dãy Trường Sơn Nam"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Cao nguyên đá Đồng Văn nằm ở tỉnh nào?",
                    "options": [
                            "Cao Bằng",
                            "Hà Giang",
                            "Lạng Sơn",
                            "Sơn La"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Nhóm đất feralit phân bố chủ yếu ở dạng địa hình nào?",
                    "options": [
                            "Vùng đồi núi",
                            "Vùng đồng bằng",
                            "Vùng ven biển",
                            "Vùng thung lũng"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Vùng đất phù sa màu mỡ phân bố chủ yếu ở đâu?",
                    "options": [
                            "Các cao nguyên",
                            "Vùng đồi núi thấp",
                            "Các đồng bằng châu thổ và thung lũng sông",
                            "Vùng bán bình nguyên"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Cao nguyên lớn nhất ở vùng Tây Nguyên là cao nguyên nào?",
                    "options": [
                            "Cao nguyên Lâm Viên",
                            "Cao nguyên Đắk Lắk",
                            "Cao nguyên Pleiku",
                            "Cao nguyên Kon Tum"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Khí hậu Việt Nam mang đặc điểm cơ bản của đới khí hậu nào?",
                    "options": [
                            "Khí hậu ôn đới",
                            "Khí hậu cận nhiệt đới",
                            "Khí hậu nhiệt đới ẩm gió mùa",
                            "Khí hậu xích đạo"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Yếu tố nào quy định tính chất nhiệt đới của khí hậu nước ta?",
                    "options": [
                            "Biển Đông",
                            "Vị trí nằm trong vùng nội chí tuyến Bắc bán cầu",
                            "Hoạt động của gió mùa",
                            "Địa hình đồi núi chiếm ưu thế"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Vào mùa đông, miền Bắc chịu ảnh hưởng chủ yếu của loại gió nào?",
                    "options": [
                            "Gió mùa Đông Bắc",
                            "Gió mùa Tây Nam",
                            "Gió mùa Đông Nam",
                            "Tín phong bán cầu Bắc"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Gió mùa mùa hạ hoạt động ở nước ta có hướng chính là gì?",
                    "options": [
                            "Hướng Tây Nam",
                            "Hướng Đông Nam",
                            "Hướng Đông Bắc",
                            "Hướng Tây Bắc"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Nguyên nhân chính gây ra thời tiết khô nóng (hiện tượng phơn) ở Bắc Trung Bộ là gì?",
                    "options": [
                            "Gió mùa Đông Bắc suy yếu",
                            "Gió Tây Nam vượt dãy Trường Sơn bị biến tính",
                            "Ảnh hưởng của bão",
                            "Tín phong hoạt động mạnh"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Ranh giới khí hậu tự nhiên giữa miền Bắc và miền Nam là địa danh nào?",
                    "options": [
                            "Dãy Hoành Sơn",
                            "Dãy Bạch Mã",
                            "Đèo Ngang",
                            "Đèo Cù Mông"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Mưa lớn vào mùa hạ ở Nam Bộ và Tây Nguyên chủ yếu do gió nào mang lại?",
                    "options": [
                            "Gió mùa Tây Nam",
                            "Gió mùa Đông Bắc",
                            "Gió bão",
                            "Áp thấp nhiệt đới"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Mùa bão ở Việt Nam thường diễn ra vào khoảng thời gian nào?",
                    "options": [
                            "Từ tháng 1 đến tháng 5",
                            "Từ tháng 6 đến tháng 12",
                            "Từ tháng 3 đến tháng 8",
                            "Từ tháng 10 đến tháng 12"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Đặc điểm nổi bật của khí hậu miền Nam là gì?",
                    "options": [
                            "Có 4 mùa rõ rệt",
                            "Nhiệt độ cao quanh năm, chia thành 2 mùa mưa - khô",
                            "Lạnh và ẩm ướt",
                            "Khô hạn quanh năm"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Hiện tượng \"nồm ẩm\" ở miền Bắc thường xảy ra vào thời gian nào?",
                    "options": [
                            "Đầu mùa đông",
                            "Cuối mùa đông, đầu mùa xuân",
                            "Giữa mùa hạ",
                            "Mùa thu"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Khu vực nào chịu ảnh hưởng nặng nề nhất của bão ở nước ta?",
                    "options": [
                            "Đồng bằng sông Hồng",
                            "Duyên hải miền Trung",
                            "Đông Nam Bộ",
                            "Đồng bằng sông Cửu Long"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Nhiệt độ trung bình năm của nước ta thay đổi theo chiều hướng nào?",
                    "options": [
                            "Tăng dần từ Bắc vào Nam",
                            "Giảm dần từ Bắc vào Nam",
                            "Tăng dần từ Tây sang Đông",
                            "Không thay đổi"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Lượng mưa trung bình năm của nước ta dao động trong khoảng bao nhiêu?",
                    "options": [
                            "500 - 1.000 mm",
                            "1.000 - 1.500 mm",
                            "1.500 - 2.000 mm",
                            "2.000 - 2.500 mm"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Tại sao mùa đông ở Tây Bắc thường ngắn và ấm hơn Đông Bắc?",
                    "options": [
                            "Do gần biển hơn",
                            "Do dãy Hoàng Liên Sơn chắn gió mùa Đông Bắc",
                            "Do nằm ở vĩ độ thấp hơn",
                            "Do có nhiều sông hồ điều hòa"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Sự phân hóa khí hậu theo độ cao rõ rệt nhất ở khu vực nào?",
                    "options": [
                            "Vùng Tây Nguyên",
                            "Vùng núi Tây Bắc",
                            "Vùng núi Đông Bắc",
                            "Vùng Trường Sơn Nam"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Mạng lưới sông ngòi nước ta có đặc điểm chung là gì?",
                    "options": [
                            "Ít sông, chủ yếu là sông lớn",
                            "Dày đặc, chủ yếu là sông nhỏ, ngắn và dốc",
                            "Sông lớn, chảy chậm, ít phù sa",
                            "Chỉ tập trung ở miền Bắc"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Chế độ nước sông ngòi nước ta phụ thuộc chặt chẽ vào yếu tố nào?",
                    "options": [
                            "Địa hình",
                            "Thảm thực vật",
                            "Chế độ mưa",
                            "Hệ thống hồ đầm"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Sông dài nhất chảy hoàn toàn trong lãnh thổ Việt Nam là sông nào?",
                    "options": [
                            "Sông Hồng",
                            "Sông Đồng Nai",
                            "Sông Thái Bình",
                            "Sông Mã"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Khi chảy vào Việt Nam, sông Mê Kông được gọi là gì?",
                    "options": [
                            "Sông Cửu Long",
                            "Sông Hậu",
                            "Sông Tiền",
                            "Sông Đồng Nai"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Sông Hồng bắt nguồn từ đâu?",
                    "options": [
                            "Lào",
                            "Campuchia",
                            "Vân Nam (Trung Quốc)",
                            "Thái Lan"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Hai hướng chảy chính của sông ngòi Việt Nam là hướng nào?",
                    "options": [
                            "Tây Bắc - Đông Nam và hướng vòng cung",
                            "Bắc - Nam và Tây - Đông",
                            "Tây Bắc - Đông Nam và Tây - Đông",
                            "Hướng vòng cung và Bắc - Nam"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Hệ thống sông lớn nhất ở miền Bắc nước ta là hệ thống sông nào?",
                    "options": [
                            "Sông Thái Bình",
                            "Sông Mã",
                            "Sông Hồng",
                            "Sông Đà"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Sông Đà là phụ lưu lớn nhất của dòng sông nào?",
                    "options": [
                            "Sông Mã",
                            "Sông Lô",
                            "Sông Thái Bình",
                            "Sông Hồng"
                    ],
                    "correctAnswer": 3,
                    "explanation": "Đáp án đúng là D."
            },
            {
                    "question": "Hồ tự nhiên lớn nhất Việt Nam là hồ nào?",
                    "options": [
                            "Hồ Thác Bà",
                            "Hồ Ba Bể",
                            "Hồ Trị An",
                            "Hồ Dầu Tiếng"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Hiện tượng lũ quét thường xảy ra ở dạng địa hình nào?",
                    "options": [
                            "Vùng đồng bằng châu thổ",
                            "Vùng núi có độ dốc lớn, mất lớp phủ thực vật",
                            "Vùng ven biển",
                            "Vùng cao nguyên bằng phẳng"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Vườn quốc gia đầu tiên của Việt Nam là vườn quốc gia nào?",
                    "options": [
                            "Vườn quốc gia Cát Tiên",
                            "Vườn quốc gia Phong Nha - Kẻ Bàng",
                            "Vườn quốc gia Cúc Phương",
                            "Vườn quốc gia Ba Vì"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Hệ sinh thái rừng ngập mặn phát triển mạnh nhất ở khu vực nào?",
                    "options": [
                            "Đồng bằng sông Hồng",
                            "Bắc Trung Bộ",
                            "Nam Bộ, đặc biệt là Bán đảo Cà Mau",
                            "Duyên hải Nam Trung Bộ"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Hiện nay, loại rừng nào chiếm diện tích lớn nhất nước ta?",
                    "options": [
                            "Rừng đặc dụng",
                            "Rừng sản xuất",
                            "Rừng phòng hộ và rừng tự nhiên",
                            "Rừng ngập mặn"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Sông Cửu Long đổ ra Biển Đông qua bao nhiêu cửa chính?",
                    "options": [
                            "7 cửa",
                            "8 cửa",
                            "9 cửa",
                            "10 cửa"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Tổng lượng phù sa hàng năm của sông ngòi nước ta khoảng bao nhiêu?",
                    "options": [
                            "Khoảng 100 triệu tấn",
                            "Khoảng 150 triệu tấn",
                            "Khoảng 200 triệu tấn",
                            "Khoảng 250 triệu tấn"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Biển Đông có đặc điểm là biển kín hay biển mở?",
                    "options": [
                            "Là biển mở hoàn toàn",
                            "Là biển kín",
                            "Là biển tương đối kín",
                            "Là biển không có dòng hải lưu"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Nước ta có bao nhiêu tỉnh, thành phố trực thuộc trung ương giáp biển?",
                    "options": [
                            "26 tỉnh/thành",
                            "27 tỉnh/thành",
                            "28 tỉnh/thành",
                            "29 tỉnh/thành"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Đảo có diện tích lớn nhất Việt Nam là đảo nào?",
                    "options": [
                            "Đảo Cát Bà",
                            "Đảo Côn Đảo",
                            "Đảo Phú Quốc",
                            "Đảo Lý Sơn"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Vịnh biển nước sâu lý tưởng nhất để xây dựng cảng lớn ở miền Trung là vịnh nào?",
                    "options": [
                            "Vịnh Hạ Long",
                            "Vịnh Vân Phong",
                            "Vịnh Cam Ranh",
                            "Vịnh Xuân Đài"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Tài nguyên khoáng sản có giá trị kinh tế lớn nhất ở thềm lục địa nước ta là gì?",
                    "options": [
                            "Than đá",
                            "Quặng sắt",
                            "Dầu mỏ và khí đốt",
                            "Titan"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Bể trầm tích chứa dầu khí lớn nhất nước ta phân bố chủ yếu ở khu vực nào?",
                    "options": [
                            "Thềm lục địa vịnh Bắc Bộ",
                            "Thềm lục địa Nam Trung Bộ",
                            "Thềm lục địa Đông Nam Bộ (Nam Côn Sơn, Cửu Long)",
                            "Khu vực quần đảo Trường Sa"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Khu dự trữ sinh quyển thế giới Cần Giờ nằm ở địa phương nào?",
                    "options": [
                            "Bà Rịa - Vũng Tàu",
                            "TP. Hồ Chí Minh",
                            "Đồng Nai",
                            "Tiền Giang"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Nghề làm muối phát triển mạnh nhất ở vùng ven biển nào?",
                    "options": [
                            "Đồng bằng sông Hồng",
                            "Duyên hải Nam Trung Bộ",
                            "Đông Nam Bộ",
                            "Đồng bằng sông Cửu Long"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Cát trắng làm thủy tinh, pha lê phân bố nhiều nhất ở đâu?",
                    "options": [
                            "Ven biển miền Trung",
                            "Ven biển đồng bằng sông Cửu Long",
                            "Vùng Tây Nguyên",
                            "Vùng Tây Bắc"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Quần đảo Thổ Chu thuộc tỉnh nào?",
                    "options": [
                            "Cà Mau",
                            "Kiên Giang",
                            "Bạc Liêu",
                            "Bà Rịa - Vũng Tàu"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Huyện đảo Cồn Cỏ thuộc tỉnh nào?",
                    "options": [
                            "Quảng Bình",
                            "Quảng Trị",
                            "Thừa Thiên Huế",
                            "Quảng Nam"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Huyện đảo Lý Sơn thuộc tỉnh nào?",
                    "options": [
                            "Quảng Nam",
                            "Quảng Ngãi",
                            "Bình Định",
                            "Phú Yên"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Huyện đảo Phú Quý thuộc tỉnh nào?",
                    "options": [
                            "Ninh Thuận",
                            "Bình Thuận",
                            "Khánh Hòa",
                            "Bà Rịa - Vũng Tàu"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Hiện tượng sạt lở bờ biển xảy ra nghiêm trọng nhất ở vùng nào hiện nay?",
                    "options": [
                            "Ven biển miền Bắc",
                            "Đồng bằng sông Cửu Long và ven biển miền Trung",
                            "Ven biển Đông Nam Bộ",
                            "Khu vực Vịnh Hạ Long"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Chế độ thủy triều đặc trưng và rõ rệt nhất ở Vịnh Bắc Bộ là gì?",
                    "options": [
                            "Chế độ nhật triều",
                            "Chế độ bán nhật triều",
                            "Chế độ tạp triều",
                            "Không có thủy triều"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Việt Nam có bao nhiêu dân tộc anh em?",
                    "options": [
                            "52 dân tộc",
                            "53 dân tộc",
                            "54 dân tộc",
                            "55 dân tộc"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Dân tộc nào chiếm tỷ lệ dân số đông nhất?",
                    "options": [
                            "Dân tộc Tày",
                            "Dân tộc Thái",
                            "Dân tộc Kinh",
                            "Dân tộc Mường"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Dân cư nước ta tập trung đông đúc nhất ở khu vực nào?",
                    "options": [
                            "Đồng bằng sông Hồng",
                            "Đồng bằng sông Cửu Long",
                            "Đông Nam Bộ",
                            "Duyên hải miền Trung"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Vùng có mật độ dân số thấp nhất nước ta là vùng nào?",
                    "options": [
                            "Tây Bắc và Tây Nguyên",
                            "Đông Bắc",
                            "Bắc Trung Bộ",
                            "Đồng bằng sông Cửu Long"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Đô thị có quy mô dân số lớn nhất Việt Nam hiện nay là thành phố nào?",
                    "options": [
                            "Hà Nội",
                            "TP. Hồ Chí Minh",
                            "Đà Nẵng",
                            "Hải Phòng"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Nước ta được chia thành bao nhiêu vùng kinh tế - xã hội?",
                    "options": [
                            "5 vùng",
                            "6 vùng",
                            "7 vùng",
                            "8 vùng"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Vùng nào là vựa lúa (trọng điểm sản xuất lương thực) lớn nhất nước ta?",
                    "options": [
                            "Đồng bằng sông Hồng",
                            "Đồng bằng sông Cửu Long",
                            "Bắc Trung Bộ",
                            "Duyên hải Nam Trung Bộ"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Cây công nghiệp lâu năm (cà phê, cao su) được trồng nhiều nhất ở 2 vùng nào?",
                    "options": [
                            "Tây Bắc và Đông Bắc",
                            "Tây Nguyên và Đông Nam Bộ",
                            "Đồng bằng sông Hồng",
                            "Đồng bằng sông Cửu Long"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Vùng công nghiệp phát triển nhất, đóng góp GDP lớn nhất cả nước là vùng nào?",
                    "options": [
                            "Đồng bằng sông Hồng",
                            "Đông Nam Bộ",
                            "Đồng bằng sông Cửu Long",
                            "Vùng kinh tế trọng điểm miền Trung"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Vùng duy nhất ở nước ta không tiếp giáp với Biển Đông là vùng nào?",
                    "options": [
                            "Tây Bắc",
                            "Tây Nguyên",
                            "Đông Nam Bộ",
                            "Đông Bắc"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Trung tâm công nghiệp lớn nhất miền Bắc là thành phố nào?",
                    "options": [
                            "Hải Phòng",
                            "Quảng Ninh",
                            "Hà Nội",
                            "Bắc Ninh"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Tuyến đường giao thông huyết mạch, quan trọng nhất nối liền Bắc - Nam là gì?",
                    "options": [
                            "Quốc lộ 1A",
                            "Đường Hồ Chí Minh",
                            "Quốc lộ 5",
                            "Cao tốc Bắc Nam"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Vùng nào có tiềm năng thủy điện lớn nhất nước ta?",
                    "options": [
                            "Tây Nguyên",
                            "Trung du và miền núi Bắc Bộ",
                            "Bắc Trung Bộ",
                            "Đông Nam Bộ"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Nhà máy thủy điện có công suất lớn nhất Việt Nam hiện nay là?",
                    "options": [
                            "Thủy điện Hòa Bình",
                            "Thủy điện Sơn La",
                            "Thủy điện Lai Châu",
                            "Thủy điện Yaly"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Vùng nào có sản lượng nuôi trồng thủy sản lớn nhất cả nước?",
                    "options": [
                            "Đồng bằng sông Hồng",
                            "Đồng bằng sông Cửu Long",
                            "Bắc Trung Bộ",
                            "Duyên hải Nam Trung Bộ"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Tuyến đường mòn Hồ Chí Minh lịch sử hiện nay đã được nâng cấp thành tuyến đường bộ nào?",
                    "options": [
                            "Quốc lộ 1A",
                            "Đường Hồ Chí Minh",
                            "Đường Trường Sơn Đông",
                            "Đường Xuyên Á"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Hai mặt hàng xuất khẩu nông sản chủ lực, thường xuyên đứng Top đầu thế giới của Việt Nam là gì?",
                    "options": [
                            "Gạo và Cà phê",
                            "Chè và Cao su",
                            "Hồ tiêu và Hạt điều",
                            "Bắp và Đậu nành"
                    ],
                    "correctAnswer": 0,
                    "explanation": "Đáp án đúng là A."
            },
            {
                    "question": "Vùng kinh tế trọng điểm phía Nam bao gồm bao nhiêu tỉnh/thành phố?",
                    "options": [
                            "6 tỉnh/thành",
                            "7 tỉnh/thành",
                            "8 tỉnh/thành",
                            "9 tỉnh/thành"
                    ],
                    "correctAnswer": 2,
                    "explanation": "Đáp án đúng là C."
            },
            {
                    "question": "Cây chè được trồng nhiều nhất ở vùng nào nước ta?",
                    "options": [
                            "Tây Nguyên",
                            "Trung du và miền núi Bắc Bộ",
                            "Bắc Trung Bộ",
                            "Đông Nam Bộ"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            },
            {
                    "question": "Thách thức tự nhiên lớn nhất đối với sản xuất nông nghiệp ở Đồng bằng sông Cửu Long hiện nay là gì?",
                    "options": [
                            "Rét đậm, rét hại",
                            "Biến đổi khí hậu, xâm nhập mặn và thiếu nước ngọt",
                            "Bão và sạt lở đất đồi núi",
                            "Địa hình dốc, dễ bị rửa trôi"
                    ],
                    "correctAnswer": 1,
                    "explanation": "Đáp án đúng là B."
            }
    ]
        }
    ]
}
];

