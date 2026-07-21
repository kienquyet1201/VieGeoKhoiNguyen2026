
// ==========================================================================
// ENTRY QUIZ DATA DEFINITION (10 QUESTIONS)
// ==========================================================================
const questions = [
    {
        id: 1,
        question: "Đỉnh núi nào cao nhất Việt Nam, được mệnh danh là 'Nóc nhà Đông Dương'?",
        options: [
            { letter: "A", text: "Tây Côn Lĩnh", isCorrect: false },
            { letter: "B", text: "Phan Xi Păng", isCorrect: true },
            { letter: "C", text: "Ngọc Linh", isCorrect: false },
            { letter: "D", text: "Bạch Mã", isCorrect: false }
        ]
    },
    {
        id: 2,
        question: "Dòng sông nào dài nhất chảy hoàn toàn trong lãnh thổ nước ta?",
        options: [
            { letter: "A", text: "Sông Hồng", isCorrect: false },
            { letter: "B", text: "Sông Đà", isCorrect: false },
            { letter: "C", text: "Sông Đồng Nai", isCorrect: true },
            { letter: "D", text: "Sông Mê Kông", isCorrect: false }
        ]
    },
    {
        id: 3,
        question: "Tỉnh nào ở nước ta có diện tích nhỏ nhất?",
        options: [
            { letter: "A", text: "Bắc Ninh", isCorrect: true },
            { letter: "B", text: "Hà Nam", isCorrect: false },
            { letter: "C", text: "Hưng Yên", isCorrect: false },
            { letter: "D", text: "Vĩnh Phúc", isCorrect: false }
        ]
    },
    {
        id: 4,
        question: "Tỉnh/Thành phố nào là trung tâm kinh tế lớn nhất cả nước?",
        options: [
            { letter: "A", text: "Hà Nội", isCorrect: false },
            { letter: "B", text: "TP. Hồ Chí Minh", isCorrect: true },
            { letter: "C", text: "Đà Nẵng", isCorrect: false },
            { letter: "D", text: "Hải Phòng", isCorrect: false }
        ]
    },
    {
        id: 5,
        question: "Vịnh biển nào của Việt Nam được UNESCO công nhận là di sản thiên nhiên thế giới?",
        options: [
            { letter: "A", text: "Vịnh Cam Ranh", isCorrect: false },
            { letter: "B", text: "Vịnh Lăng Cô", isCorrect: false },
            { letter: "C", text: "Vịnh Hạ Long", isCorrect: true },
            { letter: "D", text: "Vịnh Vân Phong", isCorrect: false }
        ]
    },
    {
        id: 6,
        question: "Tỉnh nào của nước ta có đường bờ biển dài nhất?",
        options: [
            { letter: "A", text: "Khánh Hòa", isCorrect: true },
            { letter: "B", text: "Bình Thuận", isCorrect: false },
            { letter: "C", text: "Kiên Giang", isCorrect: false },
            { letter: "D", text: "Quảng Ninh", isCorrect: false }
        ]
    },
    {
        id: 7,
        question: "Vùng đồng bằng nào lớn nhất nước ta, là vựa lúa lớn nhất cả nước?",
        options: [
            { letter: "A", text: "Đồng bằng sông Hồng", isCorrect: false },
            { letter: "B", text: "Đồng bằng ven biển miền Trung", isCorrect: false },
            { letter: "C", text: "Đồng bằng sông Cửu Long", isCorrect: true },
            { letter: "D", text: "Đồng bằng Nam Bộ", isCorrect: false }
        ]
    },
    {
        id: 8,
        question: "Đèo Hải Vân là ranh giới tự nhiên giữa hai tỉnh/thành phố nào?",
        options: [
            { letter: "A", text: "Quảng Trị và Thừa Thiên Huế", isCorrect: false },
            { letter: "B", text: "Thừa Thiên Huế và Đà Nẵng", isCorrect: true },
            { letter: "C", text: "Đà Nẵng và Quảng Nam", isCorrect: false },
            { letter: "D", text: "Quảng Bình và Quảng Trị", isCorrect: false }
        ]
    },
    {
        id: 9,
        question: "Quần đảo Trường Sa thuộc sự quản lý hành chính của tỉnh nào?",
        options: [
            { letter: "A", text: "Bà Rịa - Vũng Tàu", isCorrect: false },
            { letter: "B", text: "Khánh Hòa", isCorrect: true },
            { letter: "C", text: "Bình Thuận", isCorrect: false },
            { letter: "D", text: "Đà Nẵng", isCorrect: false }
        ]
    },
    {
        id: 10,
        question: "Khí hậu đặc trưng của phần lãnh thổ phía Nam (từ dãy Bạch Mã trở vào) là gì?",
        options: [
            { letter: "A", text: "Cận nhiệt đới", isCorrect: false },
            { letter: "B", text: "Nhiệt đới gió mùa có mùa đông lạnh", isCorrect: false },
            { letter: "C", text: "Cận xích đạo gió mùa", isCorrect: true },
            { letter: "D", text: "Ôn đới", isCorrect: false }
        ]
    }
];

// ==========================================================================
// STATE VARIABLES
// ==========================================================================
let currentQuestionIndex = 0;
let userAnswers = [];
let startTime = 0;
let endTime = 0;

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const themeToggleBtn = document.getElementById('theme-toggle');

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

// ==========================================================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================================================
startBtn.addEventListener('click', () => {
    startQuiz();
});
backBtn.addEventListener('click', goToPreviousQuestion);
nextBtn.addEventListener('click', goToNextQuestion);
restartBtn.addEventListener('click', resetQuiz);

// Theme Toggle
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const icon = themeToggleBtn.querySelector('i');
    if (document.body.classList.contains('light-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// Check auto-redirect for existing users (handled by the root page or loginout.js but we leave it here just in case)
const sess = localStorage.getItem('lm_session');
if (!sess) {
    window.location.href = '/loginout';
}

// ==========================================================================
// QUIZ FLOW LOGIC
// ==========================================================================
function startQuiz() {
    welcomeScreen.classList.remove('active');
    quizScreen.classList.add('active');
    
    currentQuestionIndex = 0;
    userAnswers = new Array(questions.length).fill(null);
    startTime = Date.now();
    
    renderQuestion();
}

function renderQuestion() {
    const q = questions[currentQuestionIndex];
    questionText.textContent = q.question;
    optionsContainer.innerHTML = '';
    
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('div');
        btn.className = 'option-card';
        if (userAnswers[currentQuestionIndex] === idx) {
            btn.classList.add('selected');
        }
        
        btn.innerHTML = `
            <div class="option-badge">${opt.letter}</div>
            <div class="option-text">${opt.text}</div>
            <div class="option-check"><i class="fa-solid fa-check"></i></div>
        `;
        
        btn.addEventListener('click', () => selectOption(idx, btn));
        optionsContainer.appendChild(btn);
    });

    updateProgress();
    
    backBtn.style.visibility = currentQuestionIndex === 0 ? 'hidden' : 'visible';
    nextBtn.disabled = userAnswers[currentQuestionIndex] === null;
    
    if (currentQuestionIndex === questions.length - 1) {
        nextBtn.innerHTML = 'Xem kết quả <i class="fa-solid fa-flag-checkered"></i>';
        nextBtn.classList.replace('btn-primary', 'btn-warning');
    } else {
        nextBtn.innerHTML = 'Câu tiếp theo <i class="fa-solid fa-arrow-right"></i>';
        nextBtn.classList.replace('btn-warning', 'btn-primary');
    }
}

function selectOption(index, btnElement) {
    userAnswers[currentQuestionIndex] = index;
    
    const allBtns = optionsContainer.querySelectorAll('.option-card');
    allBtns.forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');
    
    nextBtn.disabled = false;
    
    setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
            goToNextQuestion();
        }
    }, 400);
}

function goToNextQuestion() {
    if (userAnswers[currentQuestionIndex] === null) return;
    
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        quizScreen.classList.add('slide-out-left');
        setTimeout(() => {
            renderQuestion();
            quizScreen.classList.remove('slide-out-left');
            quizScreen.classList.add('slide-in-right');
            setTimeout(() => {
                quizScreen.classList.remove('slide-in-right');
            }, 300);
        }, 300);
    } else {
        finishQuiz();
    }
}

function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        quizScreen.classList.add('slide-out-right');
        setTimeout(() => {
            renderQuestion();
            quizScreen.classList.remove('slide-out-right');
            quizScreen.classList.add('slide-in-left');
            setTimeout(() => {
                quizScreen.classList.remove('slide-in-left');
            }, 300);
        }, 300);
    }
}

function updateProgress() {
    const total = questions.length;
    const current = currentQuestionIndex + 1;
    const percentage = (current / total) * 100;
    
    progressFill.style.width = percentage + '%';
    progressText.textContent = `Câu hỏi ${current} / ${total}`;
}

function resetQuiz() {
    resultScreen.classList.remove('active');
    welcomeScreen.classList.add('active');
    currentQuestionIndex = 0;
    userAnswers = [];
}

// ==========================================================================
// RESULT CALCULATION & RENDERING
// ==========================================================================
function finishQuiz() {
    endTime = Date.now();
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    calculateAndShowResult();
    createConfetti();
}

function calculateAndShowResult() {
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
        if (userAnswers[i] !== null) {
            const selectedOpt = questions[i].options[userAnswers[i]];
            if (selectedOpt.isCorrect) {
                score++;
            }
        }
    }
    
    // Evaluate based on score
    let evaluation = "";
    let styleClass = "";
    let iconClass = "";
    
    if (score <= 4) {
        evaluation = "Không Có Kiến Thức Về Địa Lý";
        styleClass = "text-danger";
        iconClass = "fa-face-frown-open";
    } else if (score <= 8) {
        evaluation = "Hiểu Biết Cơ Bản";
        styleClass = "text-warning";
        iconClass = "fa-face-smile";
    } else {
        evaluation = "Hiểu Biết Thâm Sâu";
        styleClass = "text-success";
        iconClass = "fa-medal";
    }

    document.getElementById('primary-style-name').textContent = evaluation;
    document.getElementById('primary-icon').innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
    document.getElementById('time-feedback-text').textContent = `Số câu trả lời đúng: ${score} / 10`;
    
    document.getElementById('style-description').textContent = `Dựa trên kết quả bài kiểm tra, mức độ hiểu biết về Địa lý Việt Nam của bạn đang ở mức: ${evaluation}. Ứng dụng sẽ cung cấp cho bạn một bản đồ các tỉnh thành để bạn tự do khám phá và học hỏi thêm nhiều điều thú vị về đất nước mình!`;
    
    document.getElementById('style-tips').innerHTML = `
        <li><i class="fa-solid fa-check text-teal"></i> Hệ thống đã cập nhật hồ sơ năng lực của bạn.</li>
        <li><i class="fa-solid fa-check text-teal"></i> Bạn sẽ bắt đầu từ chương <b>Tổng quan Địa lý Việt Nam</b>, sau đó lần lượt khám phá các <b>Tỉnh Thành</b>.</li>
        <li><i class="fa-solid fa-check text-teal"></i> Hãy cố gắng vượt qua các mốc câu hỏi để mở khóa thêm nhiều tỉnh thành mới nhé!</li>
    `;

    // Lưu vào localStorage
    let state = localStorage.getItem('VieGeo_state');
    if (state) {
        state = JSON.parse(state);
    } else {
        state = {};
    }
    state.assessmentScore = score;
    localStorage.setItem('VieGeo_state', JSON.stringify(state));
}

// ==========================================================================
// EFFECTS
// ==========================================================================
function createConfetti() {
    const colors = ['#1cb0f6', '#ff4b4b', '#ffc800', '#58cc02', '#ce82ff'];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const tx = (Math.random() - 0.5) * 200;
        const ty = Math.random() * 300 + 200;
        
        confetti.animate([
            { transform: 'translate3d(0, -10vh, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate3d(${tx}px, ${ty}vh, 0) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 2000 + 1500,
            easing: 'cubic-bezier(.37,0,.63,1)',
            fill: 'forwards'
        });
        
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}
