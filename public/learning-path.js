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
                const questions = randomFive(
                    snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                    fallback
                );
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
            return localQuestions.length === 5 ? localQuestions : Array.from({ length: 5 }, () => ({ ...fallback }));
        } catch (error) {
            console.warn('Không thể tải ngân hàng dự phòng:', error);
            return Array.from({ length: 5 }, () => ({ ...fallback }));
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
        const theory = String(documents.map(item => item.theory || item.theoryContent || item.lyThuyet || '').find(Boolean)
            || `Nội dung trọng tâm của ${lesson.title}: ghi nhớ các ý chính, từ khóa địa lí và liên hệ với địa phương đang khám phá.`).trim();
        const questions = randomFive(documents, fallback);
        return {
            theory,
            questions: questions.length === 5 ? questions : await loadQuestions(lesson)
        };
    }

    function optionsFromQuestionDocument(data) {
        if (Array.isArray(data?.options)) return data.options.map(String).map(value => value.trim()).filter(Boolean);
        if (Array.isArray(data?.answers)) return data.answers.map(String).map(value => value.trim()).filter(Boolean);
        if (data?.options && typeof data.options === 'object') {
            return ['A', 'B', 'C', 'D'].map(key => data.options[key] ?? data.options[key.toLowerCase()]).filter(value => value !== undefined && value !== null).map(String).map(value => value.trim());
        }
        return [data?.optionA ?? data?.a, data?.optionB ?? data?.b, data?.optionC ?? data?.c, data?.optionD ?? data?.d]
            .filter(value => value !== undefined && value !== null)
            .map(String)
            .map(value => value.trim());
    }

    function answerIndexFromQuestionDocument(data, options) {
        const raw = data?.correctAnswer ?? data?.answerIndex ?? data?.correct ?? data?.answer;
        const asText = String(raw ?? '').trim();
        const letterIndex = 'ABCD'.indexOf(asText.toUpperCase());
        if (letterIndex >= 0) return letterIndex;
        const numericIndex = Number(asText);
        if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < options.length) return numericIndex;
        return options.findIndex(option => option.toLowerCase() === asText.toLowerCase());
    }

    function createFallbackQuestions() {
        return [
            { question: 'Thủ đô của Việt Nam là thành phố nào?', options: ['Hà Nội', 'Đà Nẵng', 'Huế', 'Cần Thơ'], correctAnswer: 0, explanation: 'Hà Nội là thủ đô của Việt Nam.' },
            { question: 'Việt Nam thuộc khu vực nào của châu Á?', options: ['Đông Nam Á', 'Nam Á', 'Tây Á', 'Trung Á'], correctAnswer: 0, explanation: 'Việt Nam nằm ở khu vực Đông Nam Á.' },
            { question: 'Biển nào nằm ở phía đông Việt Nam?', options: ['Biển Đông', 'Biển Đen', 'Biển Đỏ', 'Biển Baltic'], correctAnswer: 0, explanation: 'Việt Nam giáp Biển Đông ở phía đông.' },
            { question: 'Dãy núi nào là ranh giới tự nhiên giữa Bắc Bộ và Trung Bộ?', options: ['Tam Điệp', 'Hoàng Liên Sơn', 'Trường Sơn', 'Bạch Mã'], correctAnswer: 0, explanation: 'Dãy Tam Điệp là ranh giới tự nhiên quen thuộc giữa Bắc Bộ và Bắc Trung Bộ.' },
            { question: 'Đồng bằng lớn nhất Việt Nam là đồng bằng nào?', options: ['Đồng bằng sông Cửu Long', 'Đồng bằng sông Hồng', 'Đồng bằng Thanh Nghệ Tĩnh', 'Đồng bằng duyên hải miền Trung'], correctAnswer: 0, explanation: 'Đồng bằng sông Cửu Long là đồng bằng lớn nhất Việt Nam.' }
        ].map((question, index) => ({ ...question, id: `offline-fallback-${index + 1}`, source: 'fallback' }));
    }

    // Firestore source of truth for Hà Nội Island quizzes.
    async function fetchHanoiQuestions(difficulty = 'easy') {
        try {
            const firestore = window.db || (typeof db !== 'undefined' ? db : null);
            if (!firestore) throw new Error('Firestore chưa sẵn sàng.');
            const selectedDifficulty = ['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase())
                ? String(difficulty).toLowerCase()
                : 'easy';
            const snapshot = await firestore.collection('Questions')
                .where('province', '==', 'ha-noi')
                .where('difficulty', '==', selectedDifficulty)
                .get();
            const questions = snapshot.docs.map((doc, index) => {
                const data = doc.data() || {};
                const options = Array.isArray(data.options) ? data.options.map(String).map(value => value.trim()) : [];
                const correctAnswer = Number(data.answer);
                const question = String(data.question || '').trim();
                if (!question || options.length < 4 || !Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
                    console.warn(`Bỏ qua Questions/${doc.id}: thiếu nội dung, đáp án hoặc đáp án đúng.`);
                    return null;
                }
                return {
                    id: doc.id || `question-${index}`,
                    questionText: question,
                    question,
                    options: options.slice(0, 4),
                    correctAnswer,
                    explanation: String(data.explanation ?? data.solution ?? data.explain ?? '').trim(),
                    theory: String(data.theory ?? data.theoryContent ?? data.lyThuyet ?? '').trim()
                };
            }).filter(Boolean);
            if (questions.length < 5) throw new Error('Collection Questions cần tối thiểu 5 câu hỏi hợp lệ.');
            console.log('Dữ liệu tải về:', questions);
            return questions;
        } catch (error) {
            console.error('Lỗi Firebase:', error);
            return createFallbackQuestions();
        }
    }

    function randomFiveFirestoreQuestions(questions) {
        if (!Array.isArray(questions) || questions.length < 5) {
            throw new Error('Collection Question cần tối thiểu 5 câu hỏi hợp lệ để bắt đầu một Đảo.');
        }
        return [...questions].sort(() => Math.random() - 0.5).slice(0, 5);
    }

    async function loadFirebaseIslandContent(lesson) {
        const questions = randomFiveFirestoreQuestions(await fetchHanoiQuestions(lesson?.difficulty || 'easy'));
        const theory = String(questions.map(item => item.theory || item.theoryContent || '').find(Boolean)
            || `Nội dung trọng tâm của ${lesson.title}: ghi nhớ các ý chính, từ khóa địa lí và liên hệ với địa phương đang khám phá.`).trim();
        return { theory, questions, isFallback: questions.some(question => question.source === 'fallback') };
    }

    async function loadFirebaseIslandQuestions(lesson) {
        return (await loadFirebaseIslandContent(lesson)).questions;
    }

    window.fetchHanoiQuestions = fetchHanoiQuestions;
    window.VieGeoLearningPath = {
        getLessonsForProvince,
        findLesson,
        loadQuestions: loadFirebaseIslandQuestions,
        loadIslandContent: loadFirebaseIslandContent,
        fetchHanoiQuestions,
        createFallbackQuestions
    };
}());
