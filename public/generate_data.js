const fs = require('fs');
const path = require('path');

const PROVINCES = [
    // Miền Bắc
    "Hà Nội", "Hà Giang", "Cao Bằng", "Bắc Kạn", "Tuyên Quang", "Lào Cai", "Điện Biên", "Lai Châu", "Sơn La", "Yên Bái", "Hòa Bình", "Thái Nguyên", "Lạng Sơn", "Quảng Ninh", "Bắc Giang", "Phú Thọ", "Vĩnh Phúc", "Bắc Ninh", "Hải Dương", "Hải Phòng", "Hưng Yên", "Thái Bình", "Hà Nam", "Nam Định", "Ninh Bình",
    // Miền Trung
    "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng",
    // Miền Nam
    "Bình Phước", "Tây Ninh", "Bình Dương", "Đồng Nai", "Bà Rịa - Vũng Tàu", "TP Hồ Chí Minh", "Long An", "Tiền Giang", "Bến Tre", "Trà Vinh", "Vĩnh Long", "Đồng Tháp", "An Giang", "Kiên Giang", "Cần Thơ", "Hậu Giang", "Sóc Trăng", "Bạc Liêu", "Cà Mau"
];

function generateProvincesData(grade) {
    const regions = [
        { id: 'north', name: 'Miền Bắc', provinces: [] },
        { id: 'central', name: 'Miền Trung', provinces: [] },
        { id: 'south', name: 'Miền Nam', provinces: [] }
    ];

    PROVINCES.forEach((provName, idx) => {
        let regionId = 0;
        if (idx >= 25) regionId = 1;
        if (idx >= 44) regionId = 2;

        const lessons = [];
        let difficultyCount = { easy: 0, medium: 0, hard: 0 };
        
        for (let i = 1; i <= 110; i++) {
            const isBigIsland = (i % 11 === 0);
            
            let diff = 'easy';
            if (difficultyCount.easy < 30) {
                diff = 'easy'; difficultyCount.easy++;
            } else if (difficultyCount.medium < 30) {
                diff = 'medium'; difficultyCount.medium++;
            } else if (difficultyCount.hard < 40) {
                diff = 'hard'; difficultyCount.hard++;
            } else {
                diff = 'hard';
            }

            const questions = [1, 2, 3].map(qNum => ({
                question: "[Lớp " + grade + " - " + diff.toUpperCase() + "] Câu hỏi " + qNum + " về " + provName + " (Bài " + i + ")?",
                options: ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
                correctAnswer: 0,
                explanation: "Giải thích chi tiết cho câu hỏi " + qNum + " của tỉnh " + provName + "."
            }));

            lessons.push({
                id: "node_" + grade + "_" + idx + "_" + i,
                type: isBigIsland ? 'boss' : 'lesson',
                title: isBigIsland ? "Tổng Ôn " + Math.floor(i/11) + ": " + provName : "Bài " + i + ": Khám phá " + provName,
                diff: diff,
                questions: questions
            });
        }

        regions[regionId].provinces.push({
            id: "prov_" + grade + "_" + idx,
            name: provName,
            color: regionId === 0 ? '#1cb0f6' : (regionId === 1 ? '#ffc800' : '#58cc02'),
            lessons: lessons
        });
    });

    return regions;
}

[5, 9, 12].forEach(grade => {
    const data = generateProvincesData(grade);
    const fileContent = "// Tự động sinh dữ liệu lớp " + grade + "\nwindow.LEARNING_REGIONS_" + grade + " = " + JSON.stringify(data, null, 2) + ";\n";
    fs.writeFileSync(path.join(__dirname, "data_grade" + grade + ".js"), fileContent);
    console.log("Generated data_grade" + grade + ".js");
});
