// ============================================================================
// VieGeo Telemetry Module - learning signals used by the AI learning profile.
// ============================================================================
(function initTelemetryModule() {
    'use strict';

    const MAX_SAMPLES = 250;
    const tagRules = [
        { tag: 'Atlat', matcher: /atlat|bản đồ/i },
        { tag: 'Biểu đồ', matcher: /biểu đồ|chart|số liệu/i },
        { tag: 'Kinh tế vùng', matcher: /kinh tế|vùng kinh tế/i },
        { tag: 'Dân cư', matcher: /dân cư|dân số|lao động/i },
        { tag: 'Tự nhiên', matcher: /địa hình|khí hậu|tự nhiên/i }
    ];

    function getStudyHabit(date) {
        const hour = date.getHours();
        if (hour < 11) return 'Buổi sáng';
        if (hour < 14) return 'Buổi trưa';
        if (hour < 18) return 'Buổi chiều';
        return 'Buổi tối';
    }

    function tagsForMetric(metric) {
        const source = `${metric.tag || ''} ${metric.topic || ''} ${metric.questionText || ''}`;
        const matched = tagRules.filter(rule => rule.matcher.test(source)).map(rule => rule.tag);
        return matched.length ? matched : ['Kiến thức tổng hợp'];
    }

    window.updateLearningProfile = function updateLearningProfile(userId, quizResult) {
        try {
            if (typeof getGameState !== 'function' || typeof saveGameState !== 'function') return null;

            const state = getGameState();
            const profile = state.learningProfile || (state.learningProfile = {});
            const telemetry = state.telemetry || (state.telemetry = {});
            const metrics = Array.isArray(quizResult && quizResult.questionMetrics)
                ? quizResult.questionMetrics
                : (Array.isArray(quizResult && quizResult.questions) ? quizResult.questions : []);

            telemetry.timeSpentPerQuestion = Array.isArray(telemetry.timeSpentPerQuestion) ? telemetry.timeSpentPerQuestion : [];
            telemetry.weaknessTags = Array.isArray(telemetry.weaknessTags) ? telemetry.weaknessTags : [];
            telemetry.studyHabits = Array.isArray(telemetry.studyHabits) ? telemetry.studyHabits : [];

            metrics.forEach(metric => {
                const seconds = Math.max(0, Math.round(Number(metric.timeSpentSeconds || metric.timeSpent) || 0));
                telemetry.timeSpentPerQuestion.push(seconds);
                if (!metric.isCorrect) telemetry.weaknessTags.push(...tagsForMetric(metric));
            });

            const now = new Date();
            telemetry.studyHabits.push(getStudyHabit(now));
            telemetry.timeSpentPerQuestion = telemetry.timeSpentPerQuestion.slice(-MAX_SAMPLES);
            telemetry.studyHabits = telemetry.studyHabits.slice(-MAX_SAMPLES);
            telemetry.weaknessTags = [...new Set(telemetry.weaknessTags)].slice(-12);
            telemetry.lastUpdatedAt = now.toISOString();

            const totalTime = telemetry.timeSpentPerQuestion.reduce((sum, seconds) => sum + seconds, 0);
            profile.totalQuestionsAnswered = (Number(profile.totalQuestionsAnswered) || 0) + metrics.length;
            profile.avgSpeed = telemetry.timeSpentPerQuestion.length
                ? Math.round(totalTime / telemetry.timeSpentPerQuestion.length)
                : 0;
            profile.weakTopics = telemetry.weaknessTags;
            profile.lastTelemetryLesson = quizResult && (quizResult.lessonTitle || quizResult.title)
                ? (quizResult.lessonTitle || quizResult.title)
                : '';

            saveGameState(state);

            if (userId && userId !== 'guest' && typeof db !== 'undefined') {
                db.collection('users').doc(userId).set({
                    telemetry,
                    learningProfile: profile,
                    streak: state.streak,
                    lastLogin: state.lastLogin,
                    lastStudyDate: state.lastStudyDate,
                    lastStreakAwardDate: state.lastStreakAwardDate || state.lastStudyDate || null
                }, { merge: true }).catch(error => console.warn('Telemetry sync failed:', error));
            }
            return { telemetry, learningProfile: profile };
        } catch (error) {
            console.error('Không thể cập nhật Learning Profile:', error);
            return null;
        }
    };
})();
