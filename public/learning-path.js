/* Dynamic learning path: every province has a 34-island progression. */
(function () {
    'use strict';

    // Existing question banks remain internal sources; learners select only a
    // difficulty tier, never a school grade.
    const QUESTION_SOURCES = ['questions/grade5.json', 'questions/grade9.json', 'questions/grade12.json'];
    const cache = new Map();

    function normalizeLearningDifficulty(value) {
        const normalized = String(value || '').toLowerCase();
        return ['easy', 'medium', 'hard'].includes(normalized) ? normalized : 'easy';
    }

    function selectedDifficulty() {
        try { return normalizeLearningDifficulty(gameState?.selectedDifficulty); }
        catch { return 'easy'; }
    }

    function difficultyLabel(difficulty) {
        return ({ easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' })[difficulty] || 'Dễ';
    }

    function provinceKey(province) {
        return String(province.id || province.name || 'province')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    }

    function buildProvincePath(province, selectedTier) {
        const difficulty = normalizeLearningDifficulty(selectedTier);
        const key = `${provinceKey(province)}:${difficulty}`;
        if (cache.has(key)) return cache.get(key);

        const islands = Array.from({ length: 34 }, (_, offset) => {
            const islandIndex = offset + 1;
            const nodeKind = islandIndex === 34 ? 'boss' : ([11, 22, 33].includes(islandIndex) ? 'checkpoint' : 'small');
            const isBoss = nodeKind !== 'small';
            const title = nodeKind === 'boss'
                ? 'BOSS CUỐI · Chinh phục tỉnh thành'
                : nodeKind === 'checkpoint'
                    ? `Trạm kiểm tra ${difficultyLabel(difficulty)}`
                    : `Đảo tri thức ${islandIndex}`;
            return {
                id: `path-${provinceKey(province)}-d${difficulty}-i${islandIndex}`,
                title,
                defaultTitle: title,
                islandIndex,
                isBoss,
                nodeKind,
                province: province.name,
                difficulty,
                dynamicPath: true,
                type: isBoss ? 'quiz_final' : 'quiz',
                reward: { xp: nodeKind === 'boss' ? 180 : isBoss ? 80 : 12, gems: nodeKind === 'boss' ? 90 : isBoss ? 35 : 5, booster: isBoss ? 'random' : null },
            };
        });
        cache.set(key, islands);
        return islands;
    }

    function getLessonsForProvince(province, difficulty = selectedDifficulty()) {
        return buildProvincePath(province, normalizeLearningDifficulty(difficulty));
    }

    function findProvinceByKey(key) {
        if (typeof LEARNING_REGIONS === 'undefined') return null;
        for (const region of LEARNING_REGIONS) {
            const province = region.provinces.find(item => provinceKey(item) === key);
            if (province) return province;
        }
        return null;
    }

    function difficultyFromLegacyGrade(grade) {
        return ({ '5': 'easy', '9': 'medium', '12': 'hard' })[String(grade || '')] || 'easy';
    }

    function findLesson(id) {
        const matched = /^path-(.+)-(?:d(easy|medium|hard)|g(5|9|12))-i(\d{1,3})$/.exec(String(id || ''));
        if (!matched) return null;
        const province = findProvinceByKey(matched[1]);
        if (!province) return null;
        const difficulty = matched[2] || difficultyFromLegacyGrade(matched[3]);
        const islandIndex = Number(matched[4]);
        return buildProvincePath(province, difficulty).find(item => item.islandIndex === islandIndex) || null;
    }

    function provinceForLesson(lesson) {
        if (lesson?.province) return lesson.province;
        const matched = /^path-(.+)-(?:d(?:easy|medium|hard)|g(?:5|9|12))-i\d{1,3}$/.exec(String(lesson?.id || ''));
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
        return fisherYatesShuffle(pool).slice(0, 5);
    }

    async function fetchQuestionsFromDataStore(lesson, fallback) {
        const province = provinceForLesson(lesson);
        const provinceSlug = dataStoreProvinceSlug(province);
        const islandLabel = lessonIslandLabel(lesson);
        if (typeof db === 'undefined' || !provinceSlug) return [];

        for (const collectionName of ['questions', 'question']) {
            try {
                let query = db.collection(collectionName)
                    .where('province', '==', provinceSlug)
                    .where('difficulty', '==', lesson.difficulty || 'easy');
                if (islandLabel) query = query.where('island', '==', islandLabel);
                const snapshot = await query.limit(50).get();
                const questions = randomFive(
                    snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                    fallback
                );
                if (questions.length) return questions;
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
        const remoteQuestions = await fetchQuestionsFromDataStore(lesson, fallback);
        if (remoteQuestions.length) return remoteQuestions;

        try {
            const banks = await Promise.all(QUESTION_SOURCES.map(async (source) => {
                const response = await fetch(source, { cache: 'force-cache' });
                if (!response.ok) throw new Error('Không tải được ngân hàng câu hỏi.');
                return response.json();
            }));
            const tier = banks.flatMap((bank) => Array.isArray(bank?.tiers?.[lesson.difficulty])
                ? bank.tiers[lesson.difficulty]
                : []);
            const localQuestions = randomFive(tier, fallback);
            return localQuestions;
        } catch (error) {
            console.warn('Không thể tải ngân hàng dự phòng:', error);
            return [];
        }
    }

    async function fetchIslandDocuments(lesson) {
        if (typeof db === 'undefined' || !lesson?.id) return [];
        for (const collectionName of ['questions', 'question']) {
            try {
                // Questions created by the Admin parser are bound to this island.
                const snapshot = await db.collection(collectionName)
                    .where('lessonId', '==', lesson.id)
                    .limit(50)
                    .get();
                if (!snapshot.empty) return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.warn(`Unable to load island questions from ${collectionName}:`, error);
            }
        }
        return [];
    }

    async function loadIslandContent(lesson) {
        const fallback = {
            question: `Kiến thức nào phù hợp với ${lesson.title}?`,
            options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
            correctAnswer: 0,
            explanation: 'Hãy xem lại kiến thức nền tảng trước khi tiếp tục.'
        };
        const documents = await fetchIslandDocuments(lesson);
        const theory = String(documents.map(item => item.islandTheory || item.islandTheoryContent || item.islandTheoryText || '').find(Boolean)
            || `Nội dung trọng tâm của ${lesson.title}: ghi nhớ các ý chính, từ khóa địa lí và liên hệ với địa phương đang khám phá.`).trim();
        const questions = randomFive(documents, fallback);
        return {
            theory,
            questions
        };
    }

    function optionsFromQuestionDocument(data) {
        if (Array.isArray(data?.options)) return data.options.map(String).map(value => value.trim()).filter(Boolean);
        if (Array.isArray(data?.answers)) return data.answers.map(String).map(value => value.trim()).filter(Boolean);
        if (data?.options && typeof data.options === 'object') {
            return ['A', 'B', 'C', 'D'].map(key => data.options[key] ?? data.options[key.toLowerCase()]).filter(value => value !== undefined && value !== null).map(String).map(value => value.trim());
        }
        return [
            data?.option_a ?? data?.optionA ?? data?.a,
            data?.option_b ?? data?.optionB ?? data?.b,
            data?.option_c ?? data?.optionC ?? data?.c,
            data?.option_d ?? data?.optionD ?? data?.d
        ]
            .filter(value => value !== undefined && value !== null)
            .map(String)
            .map(value => value.trim());
    }

    function answerIndexFromQuestionDocument(data, options) {
        const raw = data?.correct_option ?? data?.correctAnswer ?? data?.answerIndex ?? data?.correct ?? data?.answer;
        const asText = String(raw ?? '').trim();
        const letterIndex = 'ABCD'.indexOf(asText.toUpperCase());
        if (letterIndex >= 0) return letterIndex;
        const numericIndex = Number(asText);
        if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < options.length) return numericIndex;
        return options.findIndex(option => option.toLowerCase() === asText.toLowerCase());
    }

    function notifyQuestionLoad(message, isError = false) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, isError);
            return;
        }
        if (window.VieGeoUI?.warning) {
            window.VieGeoUI.warning(message);
            return;
        }
        console.warn(message);
    }

    function dataStoreProvinceSlug(value) {
        return String(value || 'ha-noi')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'ha-noi';
    }

    function lessonIslandLabel(lesson = {}) {
        const index = Number(lesson.islandIndex || String(lesson.island || lesson.title || '').match(/\d+/)?.[0]) || 1;
        return `Đảo nhỏ ${index}`;
    }

    function mapDataStoreQuestions(snapshot) {
        return snapshot.docs.map((doc, index) => {
            const data = doc.data() || {};
            const options = optionsFromQuestionDocument(data);
            const correctAnswer = answerIndexFromQuestionDocument(data, options);
            const question = String(data.question ?? data.questionText ?? data.text ?? '').trim();
            if (!question || options.length < 2 || correctAnswer < 0 || correctAnswer >= options.length) {
                console.warn(`Skipping Questions/${doc.id}: invalid question data.`);
                return null;
            }
            return {
                id: doc.id || `question-${index}`,
                questionText: question,
                question,
                options,
                correctAnswer,
                explanation: String(data.theory ?? data.explanation ?? data.solution ?? data.explain ?? '').trim(),
                islandTheory: String(data.island_theory ?? data.islandTheory ?? data.islandTheoryContent ?? data.islandTheoryText ?? '').trim(),
                hint1: String(data.hint1 ?? '').trim(),
                hint2: String(data.hint2 ?? '').trim(),
                lessonId: String(data.lesson_id ?? data.lessonId ?? '').trim()
            };
        }).filter(Boolean);
    }

    // Prefer the exact lessonId saved by Admin. The province/difficulty query is
    // retained only for legacy question documents that are not island-specific.
    async function fetchQuestionsForLesson(lesson = {}) {
        const client = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        const lessonId = String(lesson.id || lesson.lessonId || '').trim();
        const provinceSlug = dataStoreProvinceSlug(lesson.province || '');
        const islandLabel = lessonIslandLabel(lesson);

        if (client && typeof client.from === 'function') {
            try {
                let query = client.from('questions').select('*');
                if (provinceSlug) query = query.eq('province', provinceSlug);
                if (islandLabel) query = query.eq('island', islandLabel);
                if (lesson.difficulty) query = query.eq('difficulty', lesson.difficulty);
                const { data, error } = await query.limit(100);
                if (!error && Array.isArray(data) && data.length) {
                    window.VieGeoQuestionLoadState = 'ready';
                    return mapDataStoreQuestions({ docs: data.map(item => ({ id: item.id, data: () => item })) });
                }
                if (error && String(error.message || '').includes('difficulty')) {
                    const fallbackQuery = client.from('questions').select('*').eq('province', provinceSlug).eq('island', islandLabel);
                    const fallbackResult = await fallbackQuery.limit(100);
                    if (!fallbackResult.error && Array.isArray(fallbackResult.data) && fallbackResult.data.length) {
                        window.VieGeoQuestionLoadState = 'ready';
                        return mapDataStoreQuestions({ docs: fallbackResult.data.map(item => ({ id: item.id, data: () => item })) });
                    }
                }
            } catch (err) {
                console.warn('Lỗi đọc câu hỏi từ Supabase:', err, { lessonId, provinceSlug, islandLabel });
            }
        }
        window.VieGeoQuestionLoadState = 'empty';
        return [];
    }

    async function loadIslandTopics(lessons) {
        const routeLessons = Array.isArray(lessons) ? lessons.filter((lesson) => lesson?.id) : [];
        const client = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        if (!routeLessons.length || !client || typeof client.from !== 'function') return {};

        const topicsByLessonId = {};
        try {
            const provinceSlug = dataStoreProvinceSlug(routeLessons[0]?.province || '');
            const islandLabels = [...new Set(routeLessons.map(lessonIslandLabel))];
            const { data, error } = await client
                .from('questions')
                .select('province,island,topic')
                .eq('province', provinceSlug)
                .in('island', islandLabels)
                .limit(300);
            if (error) throw error;
            (Array.isArray(data) ? data : []).forEach((item) => {
                const island = String(item.island || '').trim();
                const topic = String(item.topic || '').trim();
                const lesson = routeLessons.find(routeLesson => lessonIslandLabel(routeLesson) === island);
                if (lesson?.id && topic && !topicsByLessonId[lesson.id]) topicsByLessonId[lesson.id] = topic;
            });
            routeLessons.forEach((lesson) => {
                lesson.title = topicsByLessonId[lesson.id] || lesson.defaultTitle || lesson.title;
            });
        } catch (error) {
            // A missing permission/index must never prevent the learning route
            // from rendering with its default island labels.
            console.warn('Không thể tải tên chủ đề đảo từ Supabase:', error);
        }
        return topicsByLessonId;
    }

    function fisherYatesShuffle(items) {
        const shuffled = Array.isArray(items) ? [...items] : [];
        for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
        }
        return shuffled;
    }

    function randomFiveQuestions(questions) {
        if (!Array.isArray(questions) || !questions.length) return [];
        // Supabase provides the full available question pool for this island
        // (up to the query limit); draw a new unbiased set of five each time.
        return fisherYatesShuffle(questions).slice(0, 5);
    }

    async function loadSupabaseIslandContent(lesson) {
        let sourceQuestions = [];
        try {
            sourceQuestions = await fetchQuestionsForLesson(lesson || {});
        } catch (error) {
            console.error('Supabase island content load failed:', error);
            window.VieGeoQuestionLoadState = 'network-error';
            notifyQuestionLoad('Lỗi đường truyền hoặc máy chủ Supabase. Vui lòng kiểm tra lại mạng!', true);
        }
        const questions = randomFiveQuestions(sourceQuestions);
        if (!questions.length && window.VieGeoQuestionLoadState !== 'network-error') {
            notifyQuestionLoad('Hiện chưa có câu hỏi nào cho đảo này, vui lòng quay lại sau!');
        }
        const theory = String(questions.map(item => item.islandTheory || item.islandTheoryContent || '').find(Boolean)
            || sourceQuestions.map(item => item.islandTheory || item.islandTheoryContent || '').find(Boolean)
            || `Nội dung trọng tâm của ${lesson.title}: ghi nhớ các ý chính, từ khóa địa lí và liên hệ với địa phương đang khám phá.`).trim();
        return { theory, questions, status: window.VieGeoQuestionLoadState || (questions.length ? 'ready' : 'empty') };
    }

    async function loadSupabaseIslandQuestions(lesson) {
        return (await loadSupabaseIslandContent(lesson)).questions;
    }

    window.VieGeoLearningPath = {
        getLessonsForProvince,
        findLesson,
        loadIslandTopics,
        loadQuestions: loadSupabaseIslandQuestions,
        loadIslandContent: loadSupabaseIslandContent
    };
}());


