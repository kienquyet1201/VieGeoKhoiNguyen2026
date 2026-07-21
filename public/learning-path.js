/* Dynamic learning path: every province has a 34-island progression. */
(function () {
    'use strict';

    const GRADE_SOURCES = { '5': 'questions/grade5.json', '9': 'questions/grade9.json', '12': 'questions/grade12.json' };
    const cache = new Map();

    function selectedGrade() {
        try { return typeof gameState !== 'undefined' ? String(gameState.selectedGrade || 'all') : 'all'; }
        catch { return 'all'; }
    }

    function difficultyFor(index) {
        if (index <= 11) return 'easy';
        if (index <= 22) return 'medium';
        return 'hard';
    }

    function provinceKey(province) {
        return String(province.id || province.name || 'province')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    }

    function buildProvincePath(province, grade) {
        const key = `${provinceKey(province)}:${grade}`;
        if (cache.has(key)) return cache.get(key);

        const islands = Array.from({ length: 34 }, (_, offset) => {
            const islandIndex = offset + 1;
            const nodeKind = islandIndex === 34 ? 'boss' : ([11, 22, 33].includes(islandIndex) ? 'checkpoint' : 'small');
            const isBoss = nodeKind !== 'small';
            const difficulty = difficultyFor(islandIndex);
            const title = nodeKind === 'boss'
                ? 'BOSS CUỐI · Chinh phục tỉnh thành'
                : nodeKind === 'checkpoint'
                    ? `Trạm kiểm tra ${difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Trung bình' : 'Khó'}`
                    : `Đảo tri thức ${islandIndex}`;
            return {
                id: `path-${provinceKey(province)}-g${grade}-i${islandIndex}`,
                title,
                islandIndex,
                isBoss,
                nodeKind,
                province: province.name,
                difficulty,
                grade: String(grade),
                dynamicPath: true,
                type: isBoss ? 'quiz_final' : 'quiz',
                reward: { xp: nodeKind === 'boss' ? 180 : isBoss ? 80 : 12, gems: nodeKind === 'boss' ? 90 : isBoss ? 35 : 5, booster: isBoss ? 'random' : null },
            };
        });
        cache.set(key, islands);
        return islands;
    }

    function getLessonsForProvince(province, grade = selectedGrade()) {
        const normalizedGrade = GRADE_SOURCES[String(grade)] ? String(grade) : '9';
        return buildProvincePath(province, normalizedGrade);
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

    function provinceForLesson(lesson) {
        if (lesson?.province) return lesson.province;
        const matched = /^path-(.+)-g(5|9|12)-i\d{1,3}$/.exec(String(lesson?.id || ''));
        const province = matched ? findProvinceByKey(matched[1]) : null;
        return province?.name || '';
    }

    function normalizeQuestion(item, fallback, index) {
        const options = Array.isArray(item?.options) ? item.options : (Array.isArray(item?.answers) ? item.answers : []);
        if (options.length < 2) return null;
        const correctAnswer = Number.isInteger(item.correctAnswer) ? item.correctAnswer : Number(item.answerIndex ?? item.correct ?? 0);
        return {
            id: item.id || `remote-question-${index}`,
            question: item.question || item.q || item.text || fallback.question,
            options,
            correctAnswer: Math.max(0, Math.min(options.length - 1, Number.isFinite(correctAnswer) ? correctAnswer : 0)),
            explanation: item.explanation || item.solution || fallback.explanation
        };
    }

    function randomFive(items, fallback) {
        const pool = items.map((item, index) => normalizeQuestion(item, fallback, index)).filter(Boolean);
        if (!pool.length) return [];
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return Array.from({ length: 5 }, (_, index) => ({ ...shuffled[index % shuffled.length] }));
    }

    async function fetchQuestionsFromFirebase(lesson, fallback) {
        const province = provinceForLesson(lesson);
        if (typeof db === 'undefined' || !province) return [];

        for (const collectionName of ['questions', 'question']) {
            try {
                const snapshot = await db.collection(collectionName)
                    .where('province', '==', province)
                    .where('difficulty', '==', lesson.difficulty || 'easy')
                    .limit(50)
                    .get();
                const matchingGrade = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(item => item.grade === undefined || String(item.grade) === String(lesson.grade));
                const questions = randomFive(matchingGrade, fallback);
                if (questions.length === 5) return questions;
            } catch (error) {
                console.warn(`Không thể tải câu hỏi từ ${collectionName}:`, error);
            }
        }
        return [];
    }

    async function loadQuestions(lesson) {
        const fallback = {
            question: `Kiến thức địa lí nào phù hợp với ${lesson.title}?`,
            options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
            correctAnswer: 0,
            explanation: 'Hãy xem lại kiến thức nền tảng trước khi tiếp tục hành trình.'
        };
        const remoteQuestions = await fetchQuestionsFromFirebase(lesson, fallback);
        if (remoteQuestions.length === 5) return remoteQuestions;

        const source = GRADE_SOURCES[String(lesson.grade)];
        if (!source) return Array.from({ length: 5 }, () => ({ ...fallback }));
        try {
            const response = await fetch(source, { cache: 'force-cache' });
            if (!response.ok) throw new Error('Không tải được ngân hàng câu hỏi.');
            const bank = await response.json();
            const tier = bank?.tiers?.[lesson.difficulty] || bank?.tiers?.easy || [];
            const localQuestions = randomFive(tier, fallback);
            return localQuestions.length === 5 ? localQuestions : Array.from({ length: 5 }, () => ({ ...fallback }));
        } catch (error) {
            console.warn('Không thể tải ngân hàng dự phòng:', error);
            return Array.from({ length: 5 }, () => ({ ...fallback }));
        }
    }

    window.VieGeoLearningPath = { getLessonsForProvince, findLesson, loadQuestions, difficultyFor };
}());
