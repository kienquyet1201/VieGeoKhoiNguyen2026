/* VieGeo Exam Prep: phòng thi 40 câu, lưu kết quả vào Learning Profile. */
(function () {
    'use strict';

    const EXAM_DURATION_SECONDS = 50 * 60;
    const answerLabels = ['A', 'B', 'C', 'D'];
    const topicBank = [
        { tag: 'Atlat', prompt: 'Căn cứ vào Atlat Địa lí Việt Nam, nhận xét nào phù hợp nhất khi khai thác số liệu và kí hiệu bản đồ?' },
        { tag: 'Biểu đồ', prompt: 'Dạng biểu đồ nào thích hợp nhất để thể hiện sự chuyển dịch cơ cấu kinh tế qua nhiều năm?' },
        { tag: 'Kinh tế vùng', prompt: 'Nhân tố nào có vai trò then chốt trong việc phát triển liên kết vùng ở Việt Nam?' },
        { tag: 'Dân cư', prompt: 'Đặc điểm nào phản ánh đúng tác động của cơ cấu dân số đến phát triển kinh tế - xã hội?' },
        { tag: 'Tự nhiên', prompt: 'Biện pháp nào phù hợp nhất để sử dụng bền vững tài nguyên thiên nhiên ở Việt Nam?' }
    ];

    const fallbackQuestions = Array.from({ length: 40 }, (_, index) => {
        const topic = topicBank[index % topicBank.length];
        const correct = index % answerLabels.length;
        return {
            id: index + 1,
            tag: topic.tag,
            text: `${topic.prompt} (Câu ${index + 1})`,
            options: [
                'Phương án A',
                'Phương án B',
                'Phương án C',
                'Phương án D'
            ],
            correct
        };
    });

    const elements = {};
    let questions = [];
    let selectedExamConfig = null;
    let currentIndex = 0;
    let timeLeft = EXAM_DURATION_SECONDS;
    let timerId = null;
    let submitted = false;
    let questionStartedAt = Date.now();
    const answers = new Map();
    const marked = new Set();
    const questionMetrics = new Map();

    function getElement(id) {
        return document.getElementById(id);
    }

    function cacheElements() {
        [
            'examTimer', 'examQuestionCounter', 'examQuestionTag', 'examQuestionText',
            'examOptions', 'examPrevious', 'examMark', 'examNext', 'examAnsweredCount',
            'examQuestionNav', 'examSubmit', 'examArenaTitle', 'examArenaSubtitle',
            'examSetupForm', 'examSetupGrade',
            'examSetupDifficulty', 'examSetupTopic', 'examSetupStart'
        ].forEach((id) => { elements[id] = getElement(id); });
    }

    function titleForGrade(grade) {
        if (Number(grade) === 5) return 'Đấu trường luyện thi THCS';
        if (Number(grade) === 9) return 'Luyện thi THPT';
        return 'Luyện thi THPTQG';
    }

    function updateSetupTitle() {
        const config = readExamConfig();
        if (elements.examArenaTitle) elements.examArenaTitle.textContent = config.title;
        if (elements.examArenaSubtitle) {
            elements.examArenaSubtitle.textContent = `Sẵn sàng luyện 40 câu · Lớp ${config.grade} · ${config.topic}`;
        }
    }

    function readExamConfig() {
        const grade = Number(elements.examSetupGrade?.value || 5);
        return {
            grade,
            difficulty: elements.examSetupDifficulty?.value || 'easy',
            topic: elements.examSetupTopic?.value || 'Atlat',
            title: titleForGrade(grade)
        };
    }

    function setExamInteractionEnabled(isEnabled) {
        ['examPrevious', 'examMark', 'examNext', 'examSubmit'].forEach((key) => {
            if (elements[key]) elements[key].disabled = !isEnabled;
        });
    }

    function renderWaitingState() {
        if (elements.examQuestionCounter) elements.examQuestionCounter.textContent = 'Chưa bắt đầu';
        if (elements.examQuestionTag) elements.examQuestionTag.textContent = 'Thiết lập đề luyện';
        if (elements.examQuestionText) elements.examQuestionText.textContent = 'Chọn cấu hình ở bảng điều khiển phía trên để bắt đầu luyện đề.';
        if (elements.examOptions) {
            elements.examOptions.innerHTML = '<p class="exam-waiting-state"><i class="fa-solid fa-circle-info"></i> Đề thi sẽ xuất hiện tại đây sau khi bạn nhấn “Bắt đầu làm đề”.</p>';
        }
        if (elements.examQuestionNav) elements.examQuestionNav.innerHTML = '<p class="exam-waiting-nav">Danh sách 40 câu hỏi sẽ sẵn sàng sau khi khởi tạo đề.</p>';
    }

    function shuffle(items) {
        const result = [...items];
        for (let index = result.length - 1; index > 0; index -= 1) {
            const target = Math.floor(Math.random() * (index + 1));
            [result[index], result[target]] = [result[target], result[index]];
        }
        return result;
    }

    function answerIndex(answer, options) {
        if (Number.isInteger(answer) && answer >= 0 && answer < options.length) return answer;
        const numeric = Number(answer);
        if (Number.isInteger(numeric) && numeric >= 0 && numeric < options.length) return numeric;
        const letter = String(answer || '').trim().toUpperCase();
        if (answerLabels.includes(letter)) return answerLabels.indexOf(letter);
        const matchingOption = options.findIndex((option) => String(option).trim() === String(answer).trim());
        return matchingOption >= 0 ? matchingOption : 0;
    }

    function normalizeQuestion(id, data, number) {
        const options = Array.isArray(data.options)
            ? data.options
            : [data.optionA, data.optionB, data.optionC, data.optionD].filter((option) => option !== undefined && option !== null);
        if (options.length < 2) return null;
        return {
            id: String(id),
            number,
            tag: data.topic || data.tag || 'Địa lí Việt Nam',
            text: data.text || data.question || data.content || 'Câu hỏi chưa có nội dung.',
            options: options.slice(0, 4),
            correct: answerIndex(data.correctAnswer ?? data.correct ?? data.answer, options)
        };
    }

    async function fetchExamQuestions(config) {
        let remoteQuestions = [];
        if (typeof db !== 'undefined') {
            try {
                // Admin reminder: every questions document must contain grade (5/9/12), topic and difficulty.
                const selectedGrade = config.grade;
                const snapshot = await db.collection('questions').where("grade", "==", selectedGrade).get();
                remoteQuestions = snapshot.docs
                    .map((document, index) => normalizeQuestion(document.id, document.data() || {}, index + 1))
                    .filter(Boolean)
                    .filter((question) => {
                        const source = snapshot.docs.find((document) => String(document.id) === question.id)?.data() || {};
                        return (!source.topic || source.topic === config.topic) && (!source.difficulty || source.difficulty === config.difficulty);
                    });
            } catch (error) {
                console.warn('Không thể tải đề Firebase, dùng đề minh họa an toàn.', error);
            }
        }

        const source = remoteQuestions.length >= 40 ? shuffle(remoteQuestions).slice(0, 40) : fallbackQuestions.map((question, index) => ({
            ...question,
            id: `demo-${config.grade}-${config.topic}-${index + 1}`,
            number: index + 1,
            tag: config.topic,
            text: `${question.text} — Lớp ${config.grade}, mức ${config.difficulty}`
        }));
        return source.map((question, index) => ({ ...question, number: index + 1 }));
    }

    async function startExamFromSetup(event) {
        event?.preventDefault();
        selectedExamConfig = readExamConfig();
        const startButton = elements.examSetupStart;
        if (startButton) {
            startButton.disabled = true;
            startButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải đề…';
        }

        try {
            questions = await fetchExamQuestions(selectedExamConfig);
            window.clearInterval(timerId);
            currentIndex = 0;
            timeLeft = EXAM_DURATION_SECONDS;
            submitted = false;
            answers.clear();
            marked.clear();
            questionMetrics.clear();
            questionStartedAt = Date.now();
            if (elements.examArenaTitle) elements.examArenaTitle.textContent = selectedExamConfig.title;
            if (elements.examArenaSubtitle) elements.examArenaSubtitle.textContent = `Đề 40 câu · Lớp ${selectedExamConfig.grade} · ${selectedExamConfig.topic} · ${selectedExamConfig.difficulty}`;
            setExamInteractionEnabled(true);
            renderQuestion();
            renderNavigator();
            startTimer();
        } catch (error) {
            console.error('Không thể khởi tạo đề thi:', error);
            if (window.Swal) Swal.fire({ icon: 'error', title: 'Chưa thể khởi tạo đề', text: 'Vui lòng thử lại.' });
        } finally {
            if (startButton) {
                startButton.disabled = false;
                startButton.innerHTML = '<i class="fa-solid fa-play"></i> Bắt đầu làm đề';
            }
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(Math.max(0, seconds) / 60);
        const remainder = Math.max(0, seconds) % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
    }

    function recordCurrentQuestionTime() {
        const question = questions[currentIndex];
        if (!question) return;
        const previous = questionMetrics.get(question.id) || { timeSpent: 0 };
        previous.timeSpent += Math.max(0, Math.round((Date.now() - questionStartedAt) / 1000));
        questionMetrics.set(question.id, previous);
        questionStartedAt = Date.now();
    }

    function renderQuestion() {
        const question = questions[currentIndex];
        if (!question) {
            renderWaitingState();
            return;
        }
        elements.examQuestionCounter.textContent = `Câu ${question.number || currentIndex + 1} / ${questions.length}`;
        elements.examQuestionTag.textContent = question.tag;
        elements.examQuestionText.textContent = question.text;
        elements.examOptions.innerHTML = '';

        question.options.forEach((option, index) => {
            const label = document.createElement('label');
            const isSelected = answers.get(question.id) === index;
            label.className = `exam-option${isSelected ? ' selected' : ''}`;
            label.innerHTML = `<input type="radio" name="exam-question-${question.id}" value="${index}" ${isSelected ? 'checked' : ''}><span class="exam-option-letter">${answerLabels[index]}</span><span>${option}</span>`;
            label.querySelector('input').addEventListener('change', () => {
                recordCurrentQuestionTime();
                answers.set(question.id, index);
                renderQuestion();
                renderNavigator();
            });
            elements.examOptions.appendChild(label);
        });

        elements.examPrevious.disabled = currentIndex === 0;
        elements.examNext.innerHTML = currentIndex === questions.length - 1
            ? 'Kiểm tra bài <i class="fa-solid fa-flag-checkered"></i>'
            : 'Câu tiếp <i class="fa-solid fa-arrow-right"></i>';
        elements.examMark.classList.toggle('is-marked', marked.has(question.id));
        elements.examMark.innerHTML = marked.has(question.id)
            ? '<i class="fa-solid fa-bookmark"></i> Đã đánh dấu'
            : '<i class="fa-regular fa-bookmark"></i> Đánh dấu';
    }

    function goToQuestion(nextIndex) {
        if (nextIndex < 0 || nextIndex >= questions.length || nextIndex === currentIndex) return;
        recordCurrentQuestionTime();
        currentIndex = nextIndex;
        renderQuestion();
        renderNavigator();
    }

    function renderNavigator() {
        elements.examAnsweredCount.textContent = answers.size;
        elements.examQuestionNav.innerHTML = '';
        questions.forEach((question, index) => {
            const button = document.createElement('button');
            const hasAnswer = answers.has(question.id);
            const isMarked = marked.has(question.id);
            button.type = 'button';
            button.textContent = question.number || index + 1;
            button.setAttribute('aria-label', `Đi tới câu ${question.number || index + 1}`);
            button.className = `exam-nav-number${index === currentIndex ? ' is-current' : ''}${hasAnswer ? ' is-answered' : ''}${isMarked ? ' is-marked' : ''}`;
            button.addEventListener('click', () => goToQuestion(index));
            elements.examQuestionNav.appendChild(button);
        });
    }

    function startTimer() {
        window.clearInterval(timerId);
        elements.examTimer.textContent = formatTime(timeLeft);
        timerId = window.setInterval(() => {
            timeLeft -= 1;
            elements.examTimer.textContent = formatTime(timeLeft);
            if (timeLeft <= 0) submitExam(true);
        }, 1000);
    }

    function readUserId() {
        try {
            const session = JSON.parse(localStorage.getItem('lm_session') || '{}');
            return session.email || session.uid || session.userId || 'guest';
        } catch (error) {
            return 'guest';
        }
    }

    async function submitExam(autoSubmitted) {
        if (submitted) return;
        submitted = true;
        window.clearInterval(timerId);
        recordCurrentQuestionTime();

        const unanswered = questions.length - answers.size;
        if (!autoSubmitted && unanswered > 0 && window.Swal) {
            const confirmation = await Swal.fire({
                title: 'Bạn còn câu chưa trả lời',
                text: `Còn ${unanswered} câu chưa chọn đáp án. Bạn vẫn muốn nộp bài?`,
                icon: 'question', showCancelButton: true,
                confirmButtonText: 'Nộp bài', cancelButtonText: 'Làm tiếp'
            });
            if (!confirmation.isConfirmed) {
                submitted = false;
                startTimer();
                return;
            }
        }

        const telemetry = questions.map((question) => {
            const selected = answers.get(question.id);
            const metric = questionMetrics.get(question.id) || { timeSpent: 0 };
            return {
                questionId: `thpt-${question.id}`,
                tag: question.tag,
                isCorrect: selected === question.correct,
                timeSpent: metric.timeSpent,
                answered: selected !== undefined
            };
        });
        const correct = telemetry.filter((item) => item.isCorrect).length;
        const result = {
            source: 'exam-arena',
            title: selectedExamConfig?.title || 'Đấu trường Luyện thi',
            grade: selectedExamConfig?.grade || null,
            topic: selectedExamConfig?.topic || null,
            difficulty: selectedExamConfig?.difficulty || null,
            score: correct,
            totalQuestions: questions.length,
            questions: telemetry,
            completedAt: new Date().toISOString()
        };

        try {
            if (typeof window.updateLearningProfile === 'function') {
                await window.updateLearningProfile(readUserId(), result);
            }
        } catch (error) {
            console.warn('Không thể đồng bộ hồ sơ học tập ngay lúc này.', error);
        }

        const message = `Bạn trả lời đúng ${correct}/${questions.length} câu.${unanswered ? ` Còn ${unanswered} câu chưa trả lời.` : ''}`;
        if (window.Swal) {
            await Swal.fire({ title: autoSubmitted ? 'Đã hết giờ' : 'Đã nộp bài', text: message, icon: correct >= 28 ? 'success' : 'info', confirmButtonText: 'Về lộ trình' });
        }
        window.location.href = '/map';
    }

    function bindEvents() {
        elements.examPrevious.addEventListener('click', () => goToQuestion(currentIndex - 1));
        elements.examNext.addEventListener('click', () => goToQuestion(currentIndex + 1));
        elements.examMark.addEventListener('click', () => {
            const question = questions[currentIndex];
            if (!question) return;
            const id = question.id;
            if (marked.has(id)) marked.delete(id); else marked.add(id);
            renderQuestion();
            renderNavigator();
        });
        elements.examSubmit.addEventListener('click', () => submitExam(false));
    }

    document.addEventListener('DOMContentLoaded', () => {
        cacheElements();
        if (!elements.examQuestionText) return;
        bindEvents();
        setExamInteractionEnabled(false);
        renderWaitingState();
        elements.examSetupGrade?.addEventListener('change', updateSetupTitle);
        elements.examSetupDifficulty?.addEventListener('change', updateSetupTitle);
        elements.examSetupTopic?.addEventListener('change', updateSetupTitle);
        elements.examSetupForm?.addEventListener('submit', startExamFromSetup);
        updateSetupTitle();
    });
}());
