/* Dynamic learning path: 63 provinces × 100 islands without 6,300 hard-coded records. */
(function () {
    'use strict';

    const GRADE_SOURCES = { '5': 'questions/grade5.json', '9': 'questions/grade9.json', '12': 'questions/grade12.json' };
    const cache = new Map();

    function selectedGrade() {
        try { return typeof gameState !== 'undefined' ? String(gameState.selectedGrade || 'all') : 'all'; }
        catch { return 'all'; }
    }

    function difficultyFor(index) {
        if (index <= 30) return 'easy';
        if (index <= 60) return 'medium';
        return 'hard';
    }

    function provinceKey(province) {
        return String(province.id || province.name || 'province')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    }

    function buildProvincePath(province, grade) {
        const key = `${provinceKey(province)}:${grade}`;
        if (cache.has(key)) return cache.get(key);

        const islands = Array.from({ length: 100 }, (_, offset) => {
            const islandIndex = offset + 1;
            const isBoss = islandIndex % 10 === 0;
            const difficulty = difficultyFor(islandIndex);
            return {
                id: `path-${provinceKey(province)}-g${grade}-i${islandIndex}`,
                title: isBoss ? `Đảo Tổng ôn ${islandIndex / 10}` : `Đảo tri thức ${islandIndex}`,
                type: isBoss ? 'quiz_final' : 'quiz',
                islandIndex,
                isBoss,
                difficulty,
                grade: String(grade),
                dynamicPath: true,
                reward: { xp: isBoss ? 80 : 12, gems: isBoss ? 35 : 5, booster: isBoss ? 'random' : null },
            };
        });
        cache.set(key, islands);
        return islands;
    }

    function getLessonsForProvince(province, grade = selectedGrade()) {
        if (!GRADE_SOURCES[String(grade)]) return province.lessons || [];
        return buildProvincePath(province, String(grade));
    }

    function findProvinceByKey(key) {
        if (typeof LEARNING_REGIONS === 'undefined') return null;
        for (const region of LEARNING_REGIONS) {
            const province = region.provinces.find(item => provinceKey(item) === key);
            if (province) return province;
        }
        return null;
    }

    function findLesson(id) {
        const matched = /^path-(.+)-g(5|9|12)-i(\d{1,3})$/.exec(String(id || ''));
        if (!matched) return null;
        const province = findProvinceByKey(matched[1]);
        if (!province) return null;
        return buildProvincePath(province, matched[2]).find(item => item.id === id) || null;
    }

    async function loadQuestions(lesson) {
        const fallback = [{
            question: `Kiến thức địa lí nào phù hợp với ${lesson.title}?`,
            options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
            correctAnswer: 0,
            explanation: 'Hãy xem lại kiến thức nền tảng trước khi tiếp tục hành trình.'
        }];
        const source = GRADE_SOURCES[String(lesson.grade)];
        if (!source) return fallback;
        try {
            const response = await fetch(source, { cache: 'force-cache' });
            if (!response.ok) throw new Error('Không tải được ngân hàng câu hỏi.');
            const bank = await response.json();
            const tier = bank?.tiers?.[lesson.difficulty] || bank?.tiers?.easy || fallback;
            const amount = lesson.isBoss ? 8 : 5;
            return Array.from({ length: amount }, (_, index) => {
                const item = tier[(lesson.islandIndex + index) % tier.length];
                return { ...item, question: item.question || item.q || fallback[0].question };
            });
        } catch (error) {
            console.warn('Dùng câu hỏi dự phòng cho lộ trình động:', error);
            return fallback;
        }
    }

    window.VieGeoLearningPath = { getLessonsForProvince, findLesson, loadQuestions, difficultyFor };
}());
