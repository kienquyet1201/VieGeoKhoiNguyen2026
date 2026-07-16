function seedMockData() {
    let users = JSON.parse(localStorage.getItem('lm_users'));
    if (!users || users.length === 0) {
        users = [
            { email: 'gv.thuchanh@abc.edu.vn', name: 'Thầy Cường (Thực hành)', role: 'teacher', password: 'password', hasCompletedQuiz: true, quizResult: 'THỰC HÀNH' },
            { email: 'gv.vidu@abc.edu.vn', name: 'Cô Mai (Ví dụ)', role: 'teacher', password: 'password', hasCompletedQuiz: true, quizResult: 'VÍ DỤ' },
            { email: 'gv.quytrinh@abc.edu.vn', name: 'Thầy Hùng (Quy trình)', role: 'teacher', password: 'password', hasCompletedQuiz: true, quizResult: 'QUY TRÌNH' },
            { email: 'gv.logic@abc.edu.vn', name: 'Cô Lan (Logic)', role: 'teacher', password: 'password', hasCompletedQuiz: true, quizResult: 'LOGIC' },
            { email: 'hs.minh@abc.edu.vn', name: 'Học sinh Minh', role: 'student', password: 'password', hasCompletedQuiz: true, quizResult: 'THỰC HÀNH' },
            { email: 'hs.hoa@abc.edu.vn', name: 'Học sinh Hoa', role: 'student', password: 'password', hasCompletedQuiz: true, quizResult: 'VÍ DỤ' }
        ];
        localStorage.setItem('lm_users', JSON.stringify(users));
    }

    let questions = JSON.parse(localStorage.getItem('lm_questions'));
    if (!questions || questions.length === 0) {
        questions = [
            {
                id: '1234567890',
                qCode: '#GEO-A1B2',
                title: 'Đặc điểm địa hình Nam Mỹ',
                content: 'Các thầy cô cho em hỏi tại sao dãy Andes lại kéo dài dọc theo bờ Tây của Nam Mỹ ạ?',
                studentEmail: 'hs.minh@abc.edu.vn',
                studentName: 'Học sinh Minh',
                ts: Date.now() - 100000,
                comments: [
                    { email: 'gv.thuchanh@abc.edu.vn', name: 'Thầy Cường (Thực hành)', role: 'teacher', text: 'Đây là do sự va chạm giữa mảng kiến tạo Nazca và mảng Nam Mỹ nhé em. Em có thể tìm hiểu thêm về đứt gãy mảng.', ts: Date.now() - 50000 }
                ]
            },
            {
                id: '0987654321',
                qCode: '#GEO-C3D4',
                title: 'Sông ngòi Việt Nam',
                content: 'Sông ngòi nước ta có đặc điểm gì nổi bật về hướng chảy?',
                studentEmail: 'hs.hoa@abc.edu.vn',
                studentName: 'Học sinh Hoa',
                ts: Date.now() - 200000,
                comments: [
                    { email: 'gv.vidu@abc.edu.vn', name: 'Cô Mai (Ví dụ)', role: 'teacher', text: 'Đa số chảy theo hướng Tây Bắc - Đông Nam và vòng cung em nhé. Ví dụ điển hình là sông Hồng và sông Thái Bình.', ts: Date.now() - 150000 }
                ]
            }
        ];
        localStorage.setItem('lm_questions', JSON.stringify(questions));
    }
}
seedMockData();
