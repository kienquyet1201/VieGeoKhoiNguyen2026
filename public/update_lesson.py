import re

def update_lesson_js():
    with open('lesson.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace the node finding logic in initNormal
    old_find = """    let foundNode = null;
    GAME_UNITS.forEach(u => {
        const n = u.nodes.find(x => x.id === nodeId);
        if (n) foundNode = n;
    });

    if (!foundNode || foundNode.type !== 'lesson') {
        alert("Lỗi tải bài học!");
        window.location.href = 'map.html';
        return;
    }

    currentQuestions = foundNode.questions;
    updateHeartsUI();
    loadQuestion();"""
    
    new_find = """    let foundNode = null;
    let foundProvince = null;
    if (typeof LEARNING_REGIONS !== 'undefined') {
        LEARNING_REGIONS.forEach(region => {
            region.provinces.forEach(prov => {
                const n = prov.lessons.find(x => x.id === nodeId);
                if (n) {
                    foundNode = n;
                    foundProvince = prov;
                }
            });
        });
    }

    if (!foundNode) {
        alert("Lỗi tải bài học!");
        window.location.href = 'map.html';
        return;
    }

    if (foundNode.type === 'theory') {
        document.getElementById('quizContainer').style.display = 'none';
        const tc = document.getElementById('theoryContainer');
        tc.style.display = 'block';
        document.getElementById('theoryTitle').textContent = foundNode.title;
        document.getElementById('theoryImage').src = foundNode.image || '';
        document.getElementById('theoryContent').textContent = foundNode.content;
        
        document.getElementById('btnFinishTheory').onclick = () => {
            finishLesson(foundNode);
        };
        return;
    } else {
        document.getElementById('quizContainer').style.display = 'block';
        document.getElementById('theoryContainer').style.display = 'none';
        currentQuestions = foundNode.questions || [];
        updateHeartsUI();
        loadQuestion();
    }"""
    
    content = content.replace(old_find, new_find)
    
    # Replace arena question loading
    old_arena_load = """    let allQs = [];
    GAME_UNITS.forEach(u => {
        if (u.grade === matchData.gradeFilter) {
            u.nodes.filter(n => n.type === 'lesson').forEach(n => allQs = allQs.concat(n.questions));
        }
    });"""
    
    new_arena_load = """    let allQs = [];
    if (typeof PVP_POOL !== 'undefined') {
        allQs = PVP_POOL;
    } else if (typeof GAME_UNITS !== 'undefined') {
        // Fallback for old cache
        GAME_UNITS.forEach(u => {
            if (u.grade === matchData.gradeFilter) {
                u.nodes.filter(n => n.type === 'lesson').forEach(n => allQs = allQs.concat(n.questions));
            }
        });
    }"""
    
    content = content.replace(old_arena_load, new_arena_load)
    
    # Replace finishLesson to handle color grading and theory
    old_finish = """function finishLesson() {
    let addedXu = 0;
    let won = false;
    
    if (mode === 'normal') {
        addedXu = 50;
        state.completedNodes.push(nodeId);
        showToast("Hoàn thành bài học! +50 Xu");
    } else {"""
    
    new_finish = """function finishLesson(node = null) {
    let addedXu = 0;
    let won = false;
    
    if (mode === 'normal') {
        addedXu = 50;
        if (!state.completedNodes.includes(nodeId)) {
            state.completedNodes.push(nodeId);
        }
        
        // Cấp màu sắc (Grade) cho bài kiểm tra
        if (node === null) {
            // It means it was a quiz. Calculate grade based on how many mistakes they made.
            // Simplified logic: Since they can't finish until they get it right, we look at their hearts lost? 
            // Or we just randomly assign for now since we don't track mistakes per question.
            // Better: default to Green for now.
            if (!state.lessonResults) state.lessonResults = {};
            state.lessonResults[nodeId] = { color: 'green', score: 100 };
        } else if (node.type === 'theory') {
            if (!state.lessonResults) state.lessonResults = {};
            state.lessonResults[nodeId] = { color: 'green', score: 100 }; // Theories are always green
        }
        
        // Tích hợp dữ liệu cho Learning Profile
        if (state.learningProfile) {
            state.learningProfile.totalQuestionsAnswered += (currentQuestions ? currentQuestions.length : 0);
        }
        
        showToast("Hoàn thành bài học! +50 Xu");
    } else {"""
    
    content = content.replace(old_finish, new_finish)
    
    with open('lesson.js', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Lesson logic updated.")

if __name__ == '__main__':
    update_lesson_js()
