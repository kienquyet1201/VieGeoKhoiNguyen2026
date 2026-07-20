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

    const questions = Array.from({ length: 40 }, (_, index) => {
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
            'examQuestionNav', 'examSubmit'
        ].forEach((id) => { elements[id] = getElement(id); });
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
        elements.examQuestionCounter.textContent = `Câu ${question.id} / ${questions.length}`;
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
            button.textContent = question.id;
            button.setAttribute('aria-label', `Đi tới câu ${question.id}`);
            button.className = `exam-nav-number${index === currentIndex ? ' is-current' : ''}${hasAnswer ? ' is-answered' : ''}${isMarked ? ' is-marked' : ''}`;
            button.addEventListener('click', () => goToQuestion(index));
            elements.examQuestionNav.appendChild(button);
        });
    }

    function startTimer() {
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
            title: 'Đấu trường Luyện thi THPT',
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
        window.location.href = 'map.html';
    }

    function bindEvents() {
        elements.examPrevious.addEventListener('click', () => goToQuestion(currentIndex - 1));
        elements.examNext.addEventListener('click', () => goToQuestion(currentIndex + 1));
        elements.examMark.addEventListener('click', () => {
            const id = questions[currentIndex].id;
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
        renderQuestion();
        renderNavigator();
        startTimer();
    });
}());
