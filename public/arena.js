(function () {
    'use strict';

    const QUESTION_COUNT = 10;
    const ROUND_SECONDS = 20;
    const BASE_DAMAGE = 10;
    const WRONG_PENALTY = 5;
    const SPEED_BONUS = 5;
    const WIN_ELO = 25;
    const LOSE_ELO = -15;
    const MATCH_GEMS = 10;
    const MATCH_XP = 10;
    const ANSWER_LABELS = ['A', 'B', 'C', 'D'];
    let currentCombo = 0;

    const elements = {};
    const state = {
        client: null,
        user: null,
        matchmakingChannel: null,
        battleChannel: null,
        searching: false,
        matched: false,
        matchProposal: '',
        difficulty: 'easy',
        roomId: '',
        playerSlot: '',
        players: { p1: null, p2: null },
        questions: [],
        correctAnswers: [],
        questionIndex: 0,
        position: 50,
        combos: { p1: 0, p2: 0 },
        powerups: {
            p1: { shield: false, boost: false, usedShield: false, usedBoost: false },
            p2: { shield: false, boost: false, usedShield: false, usedBoost: false }
        },
        roundAnswers: new Map(),
        resolvedRounds: new Set(),
        ownSubmitted: false,
        roundTimer: null,
        roundTimeLeft: ROUND_SECONDS,
        questionBatchLoading: false,
        started: false,
        ended: false,
        opponentMissingTimer: null,
        toastTimer: null
    };

    function byId(id) {
        return document.getElementById(id);
    }

    function cacheElements() {
        [
            'arenaConnectionBadge', 'tugPlayerOneName', 'tugPlayerTwoName',
            'tugPlayerOnePercent', 'tugPlayerTwoPercent', 'tugTrack', 'tugPlayerOneBar',
            'tugPlayerTwoBar', 'tugCenterMark', 'matchmakingView', 'matchmakingMessage',
            'arenaDifficulty', 'arenaFindButton', 'arenaCancelButton', 'matchmakingDots',
            'battleView', 'playerOneCard', 'playerTwoCard', 'playerOneAvatar', 'playerTwoAvatar',
            'playerOneName', 'playerTwoName', 'playerOneElo', 'playerTwoElo',
            'playerOneCombo', 'playerTwoCombo', 'playerOneState', 'playerTwoState',
            'arenaRoundLabel', 'arenaQuestionTimer', 'arenaDifficultyLabel',
            'arenaQuestionText', 'arenaOptions', 'arenaRoundFeedback', 'arenaLeaveButton',
            'arenaResultOverlay', 'arenaExplosion', 'arenaResultIcon', 'arenaResultEyebrow',
            'arenaResultTitle', 'arenaResultText', 'arenaEloReward', 'arenaGemReward', 'arenaXpReward',
            'arenaResultContinue', 'arenaToast'
        ].forEach(function (id) { elements[id] = byId(id); });
    }

    function getClient() {
        const candidate = window.supabaseClient || window.supabase || window.VieGeoSupabase?.client;
        return candidate && typeof candidate.from === 'function' && typeof candidate.channel === 'function' ? candidate : null;
    }

    function cleanText(value, fallback) {
        const text = String(value ?? '').trim();
        return text || fallback || '';
    }

    function initials(name) {
        const parts = cleanText(name, 'Player').split(/\s+/).filter(Boolean);
        return parts.slice(-2).map(function (part) { return part.charAt(0); }).join('').toUpperCase().slice(0, 2);
    }

    function displayName(profile) {
        return cleanText(profile?.user_name || profile?.name || profile?.full_name || profile?.email?.split('@')[0], 'Người chơi');
    }

    function readElo(profile) {
        const value = Number(profile?.elo ?? profile?.legacy_data?.arena_elo ?? profile?.legacy_data?.arenaElo);
        return Number.isFinite(value) ? value : 1000;
    }

    function difficultyLabel(value) {
        return ({ easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' })[value] || 'Dễ';
    }

    function setConnection(message, online) {
        if (!elements.arenaConnectionBadge) return;
        elements.arenaConnectionBadge.textContent = message;
        elements.arenaConnectionBadge.classList.toggle('is-online', Boolean(online));
    }

    function notify(message) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'info');
            return;
        }
        window.clearTimeout(state.toastTimer);
        elements.arenaToast.textContent = message;
        elements.arenaToast.classList.add('is-visible');
        state.toastTimer = window.setTimeout(function () {
            elements.arenaToast.classList.remove('is-visible');
        }, 3000);
    }

    function setMatchmakingMessage(message) {
        elements.matchmakingMessage.textContent = message;
    }

    function hashString(value) {
        let hash = 2166136261;
        for (let index = 0; index < value.length; index += 1) {
            hash ^= value.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
    }

    function userPresence() {
        return {
            id: String(state.user.id),
            email: state.user.email,
            name: state.user.name,
            elo: state.user.elo,
            difficulty: state.difficulty,
            searching: true,
            ticket: Date.now()
        };
    }

    function flattenPresence(channel) {
        const raw = channel?.presenceState?.() || {};
        const unique = new Map();
        Object.values(raw).flat().forEach(function (presence) {
            if (!presence?.id || !presence.searching) return;
            const existing = unique.get(String(presence.id));
            if (!existing || Number(presence.ticket) < Number(existing.ticket)) {
                unique.set(String(presence.id), presence);
            }
        });
        return Array.from(unique.values());
    }

    function pairRoomId(first, second) {
        const orderedIds = [String(first.id), String(second.id)].sort();
        const ticket = Math.min(Number(first.ticket) || Date.now(), Number(second.ticket) || Date.now());
        return `arena-${hashString(`${orderedIds.join(':')}:${ticket}:${state.difficulty}`)}`;
    }

    function attemptPairing() {
        if (!state.searching || state.matched || !state.matchmakingChannel) return;
        const candidates = flattenPresence(state.matchmakingChannel)
            .filter(function (player) { return player.difficulty === state.difficulty; })
            .sort(function (a, b) {
                return (Number(a.ticket) - Number(b.ticket)) || String(a.id).localeCompare(String(b.id));
            });
        const ownIndex = candidates.findIndex(function (player) { return String(player.id) === String(state.user.id); });
        if (ownIndex < 0) return;
        const pairStart = ownIndex - (ownIndex % 2);
        const pair = candidates.slice(pairStart, pairStart + 2);
        if (pair.length < 2) {
            setMatchmakingMessage('Đang chờ một đối thủ cùng mức độ tham gia...');
            return;
        }
        const leader = pair[0];
        if (String(leader.id) !== String(state.user.id)) return;
        const roomId = pairRoomId(pair[0], pair[1]);
        if (state.matchProposal === roomId) return;
        state.matchProposal = roomId;
        const payload = {
            roomId: roomId,
            difficulty: state.difficulty,
            playerIds: pair.map(function (player) { return String(player.id); }),
            players: {
                p1: { id: String(pair[0].id), email: pair[0].email, name: pair[0].name, elo: Number(pair[0].elo) || 1000 },
                p2: { id: String(pair[1].id), email: pair[1].email, name: pair[1].name, elo: Number(pair[1].elo) || 1000 }
            }
        };
        setMatchmakingMessage('Đã tìm thấy đối thủ. Đang tạo phòng chiến đấu...');
        state.matchmakingChannel.send({ type: 'broadcast', event: 'pair-found', payload: payload });
        window.setTimeout(function () {
            if (state.searching && !state.matched) handlePairFound(payload);
        }, 500);
    }

    async function startMatchmaking() {
        if (state.searching || state.started) return;
        if (!state.client || !state.user) {
            notify('Chưa thể kết nối máy chủ. Vui lòng tải lại trang.');
            return;
        }
        state.difficulty = elements.arenaDifficulty.value;
        state.searching = true;
        state.matched = false;
        state.matchProposal = '';
        elements.arenaFindButton.disabled = true;
        elements.arenaDifficulty.disabled = true;
        elements.arenaCancelButton.hidden = false;
        elements.matchmakingDots.hidden = false;
        setMatchmakingMessage('Đang kết nối phòng chờ và tìm đối thủ phù hợp...');
        setConnection('Đang tìm trận', false);

        const channel = state.client.channel('arena-matchmaking', {
            config: {
                presence: { key: String(state.user.id) },
                broadcast: { self: true, ack: true }
            }
        });
        state.matchmakingChannel = channel;
        channel
            .on('presence', { event: 'sync' }, attemptPairing)
            .on('presence', { event: 'join' }, attemptPairing)
            .on('broadcast', { event: 'pair-found' }, function (message) {
                handlePairFound(message.payload || {});
            })
            .subscribe(async function (status) {
                if (status === 'SUBSCRIBED') {
                    setConnection('Phòng chờ online', true);
                    await channel.track(userPresence());
                    attemptPairing();
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    notify('Kết nối ghép trận bị gián đoạn. Đang thử lại...');
                    setConnection('Mất kết nối', false);
                }
            });
    }

    async function cancelMatchmaking(restoreMessage) {
        state.searching = false;
        state.matchProposal = '';
        const channel = state.matchmakingChannel;
        state.matchmakingChannel = null;
        if (channel) {
            try { await channel.untrack(); } catch (_) {}
            try { await state.client.removeChannel(channel); } catch (_) {}
        }
        elements.arenaFindButton.disabled = false;
        elements.arenaDifficulty.disabled = false;
        elements.arenaCancelButton.hidden = true;
        elements.matchmakingDots.hidden = true;
        setConnection('Sẵn sàng', true);
        if (restoreMessage !== false) setMatchmakingMessage('Đã hủy tìm kiếm. Bạn có thể bắt đầu lại bất cứ lúc nào.');
    }

    async function handlePairFound(payload) {
        if (!state.searching || state.matched) return;
        const ids = Array.isArray(payload.playerIds) ? payload.playerIds.map(String) : [];
        if (!ids.includes(String(state.user.id)) || !payload.roomId) return;
        state.matched = true;
        state.searching = false;
        state.roomId = String(payload.roomId);
        state.difficulty = payload.difficulty || state.difficulty;
        state.players = payload.players || state.players;
        state.playerSlot = String(state.players?.p1?.id) === String(state.user.id) ? 'p1' : 'p2';
        await cancelMatchmaking(false);
        openBattleView();
        await joinBattleRoom();
    }

    function renderPlayers() {
        ['p1', 'p2'].forEach(function (slot) {
            const suffix = slot === 'p1' ? 'One' : 'Two';
            const player = state.players[slot] || {};
            elements[`player${suffix}Name`].textContent = displayName(player);
            elements[`player${suffix}Avatar`].textContent = initials(displayName(player));
            elements[`player${suffix}Elo`].textContent = Number(player.elo) || 1000;
            elements[`tugPlayer${suffix}Name`].textContent = displayName(player);
            elements[`player${suffix}Card`].classList.toggle('is-local-player', state.playerSlot === slot);
        });
        updateComboUi();
        updatePowerupUi();
    }

    function openBattleView() {
        elements.matchmakingView.hidden = true;
        elements.battleView.hidden = false;
        elements.arenaDifficultyLabel.textContent = difficultyLabel(state.difficulty);
        renderPlayers();
        updateBattleBar(50, false);
        setConnection('Đang vào phòng', false);
    }

    async function joinBattleRoom() {
        const channelName = `battle-room-${state.roomId}`;
        const channel = state.client.channel(channelName, {
            config: {
                presence: { key: String(state.user.id) },
                broadcast: { self: true, ack: true }
            }
        });
        state.battleChannel = channel;
        channel
            .on('presence', { event: 'sync' }, handleBattlePresence)
            .on('broadcast', { event: 'ready' }, handlePlayerReady)
            .on('broadcast', { event: 'questions' }, handleQuestions)
            .on('broadcast', { event: 'answer' }, handleAnswer)
            .on('broadcast', { event: 'round-result' }, handleRoundResult)
            .on('broadcast', { event: 'next-question' }, handleNextQuestion)
            .on('broadcast', { event: 'powerup' }, handlePowerup)
            .on('broadcast', { event: 'game-over' }, handleGameOver)
            .on('broadcast', { event: 'arena-error' }, handleArenaError)
            .subscribe(async function (status) {
                if (status === 'SUBSCRIBED') {
                    setConnection('Đã vào phòng', true);
                    await channel.track({
                        id: String(state.user.id),
                        slot: state.playerSlot,
                        name: state.user.name,
                        onlineAt: new Date().toISOString()
                    });
                    sendBattle('ready', { id: String(state.user.id), slot: state.playerSlot });
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setConnection('Mất kết nối', false);
                    notify('Kết nối trận đấu bị gián đoạn.');
                }
            });
    }

    function sendBattle(event, payload) {
        if (!state.battleChannel) return Promise.resolve('no-channel');
        return state.battleChannel.send({
            type: 'broadcast',
            event: event,
            payload: Object.assign({ roomId: state.roomId }, payload || {})
        });
    }

    function battlePresenceCount() {
        const presence = state.battleChannel?.presenceState?.() || {};
        const ids = new Set(Object.values(presence).flat().map(function (item) { return String(item.id || ''); }).filter(Boolean));
        return ids.size;
    }

    function handleBattlePresence() {
        const count = battlePresenceCount();
        if (count >= 2) {
            window.clearTimeout(state.opponentMissingTimer);
            state.opponentMissingTimer = null;
            setConnection('Cả hai đang online', true);
            if (state.playerSlot === 'p1' && !state.started && !state.questionBatchLoading) initializeQuestions();
            return;
        }
        if (!state.started || state.ended) return;
        setConnection('Đối thủ mất kết nối', false);
        if (!state.opponentMissingTimer) {
            state.opponentMissingTimer = window.setTimeout(function () {
                if (!state.ended && battlePresenceCount() < 2 && state.playerSlot === 'p1') {
                    finishGame(state.playerSlot === 'p1' ? 'p1' : 'p2', 'Đối thủ đã rời trận');
                }
            }, 5000);
        }
    }

    function handlePlayerReady() {
        if (state.playerSlot === 'p1' && battlePresenceCount() >= 2 && !state.started && !state.questionBatchLoading) {
            initializeQuestions();
        }
    }

    function normalizeAnswerIndex(value, options) {
        const numeric = Number(value);
        if (Number.isInteger(numeric) && numeric >= 0 && numeric < options.length) return numeric;
        const letter = cleanText(value).toUpperCase();
        if (ANSWER_LABELS.includes(letter)) return ANSWER_LABELS.indexOf(letter);
        const matched = options.findIndex(function (option) { return cleanText(option) === cleanText(value); });
        return matched;
    }

    function normalizeQuestion(row, index) {
        const options = Array.isArray(row?.options)
            ? row.options
            : [row?.option_a, row?.option_b, row?.option_c, row?.option_d, row?.optionA, row?.optionB, row?.optionC, row?.optionD]
                .filter(function (value, optionIndex, source) { return value != null && source.indexOf(value) === optionIndex; });
        const cleanOptions = options.map(function (option) { return cleanText(option); }).filter(Boolean).slice(0, 4);
        const text = cleanText(row?.question || row?.question_text || row?.questionText || row?.content);
        const correct = normalizeAnswerIndex(row?.correct_option ?? row?.correct_answer ?? row?.correctAnswer ?? row?.answerIndex ?? row?.answer, cleanOptions);
        if (!text || cleanOptions.length < 2 || correct < 0) return null;
        return {
            id: cleanText(row.id, `question-${index + 1}`),
            text: text,
            options: cleanOptions,
            correct: correct,
            topic: cleanText(row.topic || row.province, 'Địa lí Việt Nam'),
            difficulty: cleanText(row.difficulty).toLowerCase()
        };
    }

    function seededShuffle(items, seedText) {
        let seed = parseInt(hashString(seedText), 36) || 1;
        const result = items.slice();
        function random() {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        }
        for (let index = result.length - 1; index > 0; index -= 1) {
            const target = Math.floor(random() * (index + 1));
            [result[index], result[target]] = [result[target], result[index]];
        }
        return result;
    }

    async function loadQuestionBank() {
        let response = await state.client.from('questions').select('*').eq('difficulty', state.difficulty).limit(250);
        if (response.error) {
            response = await state.client.from('questions').select('*').limit(250);
        }
        if (response.error) throw response.error;
        const normalized = (response.data || []).map(normalizeQuestion).filter(Boolean);
        const matching = normalized.filter(function (question) {
            return !question.difficulty || question.difficulty === state.difficulty;
        });
        const pool = matching.length >= QUESTION_COUNT ? matching : normalized;
        if (pool.length < QUESTION_COUNT) {
            throw new Error(`Ngân hàng cần tối thiểu ${QUESTION_COUNT} câu hỏi hợp lệ.`);
        }
        return seededShuffle(pool, state.roomId).slice(0, QUESTION_COUNT);
    }

    async function initializeQuestions() {
        if (state.questionBatchLoading || state.started || state.ended) return;
        state.questionBatchLoading = true;
        elements.arenaQuestionText.textContent = 'Đang đồng bộ 10 câu hỏi cho cả hai người chơi...';
        try {
            const loaded = await loadQuestionBank();
            state.correctAnswers = loaded.map(function (question) { return question.correct; });
            const publicQuestions = loaded.map(function (question) {
                return { id: question.id, text: question.text, options: question.options, topic: question.topic };
            });
            await sendBattle('questions', { questions: publicQuestions, startedAt: Date.now() });
        } catch (error) {
            console.error('[VieGeo Arena] Không thể tải câu hỏi:', error);
            await sendBattle('arena-error', { message: error.message || 'Không thể tải ngân hàng câu hỏi.' });
        } finally {
            state.questionBatchLoading = false;
        }
    }

    function handleQuestions(message) {
        const payload = message.payload || {};
        if (state.started || !Array.isArray(payload.questions) || payload.questions.length !== QUESTION_COUNT) return;
        state.questions = payload.questions;
        state.questionIndex = 0;
        state.started = true;
        setConnection('Trận đấu đang diễn ra', true);
        setupRound(0);
    }

    function setupRound(index) {
        window.clearInterval(state.roundTimer);
        state.questionIndex = index;
        state.ownSubmitted = false;
        state.roundTimeLeft = ROUND_SECONDS;
        const question = state.questions[index];
        if (!question) return;
        elements.arenaRoundLabel.textContent = `Câu ${index + 1} / ${state.questions.length}`;
        elements.arenaQuestionTimer.textContent = String(ROUND_SECONDS);
        elements.arenaQuestionText.textContent = question.text;
        elements.arenaRoundFeedback.className = 'round-feedback';
        elements.arenaRoundFeedback.textContent = question.topic || 'Chọn đáp án nhanh và chính xác.';
        renderOptions(question);
        setFighterState('p1', 'Đang trả lời', '');
        setFighterState('p2', 'Đang trả lời', '');
        updatePowerupUi();
        state.roundTimer = window.setInterval(function () {
            state.roundTimeLeft -= 1;
            elements.arenaQuestionTimer.textContent = String(Math.max(0, state.roundTimeLeft));
            if (state.roundTimeLeft <= 0) {
                window.clearInterval(state.roundTimer);
                if (!state.ownSubmitted) submitAnswer(-1);
            }
        }, 1000);
    }

    function renderOptions(question) {
        elements.arenaOptions.innerHTML = '';
        question.options.forEach(function (option, index) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'arena-option';
            button.innerHTML = `<span class="arena-option-letter">${ANSWER_LABELS[index]}</span><span></span>`;
            button.lastElementChild.textContent = option;
            button.addEventListener('click', function () {
                elements.arenaOptions.querySelectorAll('.arena-option').forEach(function (item) { item.classList.remove('is-selected'); });
                button.classList.add('is-selected');
                submitAnswer(index);
            });
            elements.arenaOptions.appendChild(button);
        });
    }

    function submitAnswer(answerIndex) {
        if (state.ended || !state.started || state.ownSubmitted) return;
        state.ownSubmitted = true;
        window.clearInterval(state.roundTimer);
        elements.arenaOptions.querySelectorAll('button').forEach(function (button) { button.disabled = true; });
        setFighterState(state.playerSlot, answerIndex < 0 ? 'Hết thời gian' : 'Đã trả lời', 'is-answered');
        elements.arenaRoundFeedback.className = 'round-feedback is-accent';
        elements.arenaRoundFeedback.textContent = 'Đã khóa đáp án. Đang chờ kết quả của vòng này...';
        sendBattle('answer', {
            index: state.questionIndex,
            userId: String(state.user.id),
            slot: state.playerSlot,
            answer: answerIndex,
            submittedAt: Date.now()
        });
    }

    function handleAnswer(message) {
        const payload = message.payload || {};
        if (Number(payload.index) !== state.questionIndex || !['p1', 'p2'].includes(payload.slot)) return;
        setFighterState(payload.slot, Number(payload.answer) < 0 ? 'Hết thời gian' : 'Đã trả lời', 'is-answered');
        if (state.playerSlot !== 'p1' || state.resolvedRounds.has(state.questionIndex)) return;
        const round = state.roundAnswers.get(state.questionIndex) || {};
        if (!round[payload.slot]) {
            round[payload.slot] = {
                answer: Number(payload.answer),
                submittedAt: Number(payload.submittedAt) || Date.now(),
                correct: Number(payload.answer) === Number(state.correctAnswers[state.questionIndex])
            };
            state.roundAnswers.set(state.questionIndex, round);
        }
        if (round.p1 && round.p2) resolveRound(round);
    }

    function resolveRound(round) {
        if (state.resolvedRounds.has(state.questionIndex)) return;
        state.resolvedRounds.add(state.questionIndex);
        const beforeCombo = { p1: state.combos.p1, p2: state.combos.p2 };
        let p1Force = round.p1.correct ? BASE_DAMAGE * (beforeCombo.p1 >= 3 ? 1.5 : 1) : -WRONG_PENALTY;
        let p2Force = round.p2.correct ? -BASE_DAMAGE * (beforeCombo.p2 >= 3 ? 1.5 : 1) : WRONG_PENALTY;

        if (round.p1.correct && state.powerups.p1.boost) p1Force *= 2;
        if (round.p2.correct && state.powerups.p2.boost) p2Force *= 2;
        state.powerups.p1.boost = false;
        state.powerups.p2.boost = false;

        let speedWinner = '';
        if (round.p1.correct && round.p2.correct && round.p1.submittedAt !== round.p2.submittedAt) {
            speedWinner = round.p1.submittedAt < round.p2.submittedAt ? 'p1' : 'p2';
            if (speedWinner === 'p1') p1Force += SPEED_BONUS;
            else p2Force -= SPEED_BONUS;
        }
        if (p2Force < 0 && state.powerups.p1.shield) {
            p2Force *= .5;
            state.powerups.p1.shield = false;
        }
        if (p1Force > 0 && state.powerups.p2.shield) {
            p1Force *= .5;
            state.powerups.p2.shield = false;
        }

        state.combos.p1 = round.p1.correct ? state.combos.p1 + 1 : 0;
        state.combos.p2 = round.p2.correct ? state.combos.p2 + 1 : 0;
        state.position = Math.max(0, Math.min(100, state.position + p1Force + p2Force));
        sendBattle('round-result', {
            index: state.questionIndex,
            position: state.position,
            combos: state.combos,
            powerups: state.powerups,
            correct: { p1: round.p1.correct, p2: round.p2.correct },
            correctAnswer: state.correctAnswers[state.questionIndex],
            speedWinner: speedWinner
        });
    }

    function handleRoundResult(message) {
        const payload = message.payload || {};
        const index = Number(payload.index);
        if (index !== state.questionIndex) return;
        window.clearInterval(state.roundTimer);
        state.position = Number(payload.position);
        state.combos = payload.combos || state.combos;
        currentCombo = Number(state.combos[state.playerSlot]) || 0;
        state.powerups = payload.powerups || state.powerups;
        updateBattleBar(state.position, true);
        updateComboUi();
        updatePowerupUi();
        setFighterState('p1', payload.correct?.p1 ? 'Chính xác' : 'Sai', payload.correct?.p1 ? 'is-correct' : 'is-wrong');
        setFighterState('p2', payload.correct?.p2 ? 'Chính xác' : 'Sai', payload.correct?.p2 ? 'is-correct' : 'is-wrong');

        const ownCorrect = Boolean(payload.correct?.[state.playerSlot]);
        const correctLabel = ANSWER_LABELS[Number(payload.correctAnswer)] || '';
        elements.arenaRoundFeedback.className = `round-feedback ${ownCorrect ? 'is-success' : 'is-danger'}`;
        elements.arenaRoundFeedback.textContent = ownCorrect
            ? `Chính xác!${payload.speedWinner === state.playerSlot ? ' Bạn nhận thêm 5% thưởng tốc độ.' : ''}`
            : `Chưa chính xác. Đáp án đúng là ${correctLabel}.`;

        if (state.playerSlot !== 'p1') return;
        const isLast = index >= state.questions.length - 1;
        const reachedBoundary = state.position <= 0 || state.position >= 100;
        window.setTimeout(function () {
            if (state.ended) return;
            if (isLast || reachedBoundary) {
                const winner = state.position === 50 ? 'draw' : (state.position > 50 ? 'p1' : 'p2');
                finishGame(winner, reachedBoundary ? 'Thanh chiến đấu đã chạm giới hạn' : 'Đã hoàn thành 10 câu hỏi');
            } else {
                sendBattle('next-question', { index: index + 1 });
            }
        }, 1800);
    }

    function handleNextQuestion(message) {
        const nextIndex = Number(message.payload?.index);
        if (state.ended || !Number.isInteger(nextIndex) || nextIndex !== state.questionIndex + 1) return;
        setupRound(nextIndex);
    }

    function setFighterState(slot, message, className) {
        const element = slot === 'p1' ? elements.playerOneState : elements.playerTwoState;
        element.textContent = message;
        element.className = `fighter-answer-state${className ? ` ${className}` : ''}`;
    }

    function updateComboUi() {
        elements.playerOneCombo.textContent = String(state.combos.p1 || 0);
        elements.playerTwoCombo.textContent = String(state.combos.p2 || 0);
    }

    function updateBattleBar(position, shake) {
        const value = Math.max(0, Math.min(100, Number(position) || 0));
        elements.tugPlayerOneBar.style.width = `${value}%`;
        elements.tugPlayerTwoBar.style.width = `${100 - value}%`;
        elements.tugCenterMark.style.left = `${value}%`;
        elements.tugPlayerOnePercent.textContent = `${Math.round(value)}%`;
        elements.tugPlayerTwoPercent.textContent = `${Math.round(100 - value)}%`;
        if (shake) {
            elements.tugTrack.classList.remove('is-shaking');
            void elements.tugTrack.offsetWidth;
            elements.tugTrack.classList.add('is-shaking');
        }
    }

    function activatePowerup(power) {
        const slot = state.playerSlot;
        const inventory = state.powerups[slot];
        if (!state.started || state.ended || state.ownSubmitted) return;
        if (power === 'shield' && inventory.usedShield) return;
        if (power === 'boost' && inventory.usedBoost) return;
        sendBattle('powerup', { slot: slot, userId: String(state.user.id), power: power });
    }

    function handlePowerup(message) {
        const payload = message.payload || {};
        if (!['p1', 'p2'].includes(payload.slot) || !['shield', 'boost'].includes(payload.power)) return;
        const inventory = state.powerups[payload.slot];
        const usedKey = payload.power === 'shield' ? 'usedShield' : 'usedBoost';
        if (inventory[usedKey]) return;
        inventory[usedKey] = true;
        inventory[payload.power] = true;
        updatePowerupUi();
        notify(`${displayName(state.players[payload.slot])} đã kích hoạt ${payload.power === 'shield' ? 'Khiên' : 'x2 lực'}.`);
    }

    function updatePowerupUi() {
        document.querySelectorAll('.powerup-button').forEach(function (button) {
            const slot = button.dataset.player;
            const power = button.dataset.power;
            const inventory = state.powerups[slot];
            const used = power === 'shield' ? inventory.usedShield : inventory.usedBoost;
            button.disabled = slot !== state.playerSlot || used || state.ownSubmitted || !state.started || state.ended;
            button.classList.toggle('is-active', Boolean(inventory[power]));
            const count = button.querySelector('small');
            if (count) count.textContent = used ? '0' : '1';
        });
    }

    function finishGame(winner, reason) {
        if (state.ended) return;
        sendBattle('game-over', {
            winner: winner,
            reason: reason,
            position: state.position,
            endedAt: Date.now()
        });
    }

    async function handleGameOver(message) {
        if (state.ended) return;
        state.ended = true;
        window.clearInterval(state.roundTimer);
        window.clearTimeout(state.opponentMissingTimer);
        const payload = message.payload || {};
        const winner = payload.winner || 'draw';
        const isDraw = winner === 'draw';
        const isWinner = !isDraw && winner === state.playerSlot;
        const eloDelta = isDraw ? 0 : (isWinner ? WIN_ELO : LOSE_ELO);
        const reward = await updateArenaRewards(eloDelta, MATCH_GEMS, MATCH_XP);
        showResult({
            isDraw: isDraw,
            isWinner: isWinner,
            reason: payload.reason || 'Trận đấu kết thúc',
            eloDelta: reward.eloDelta,
            gemDelta: reward.gemDelta,
            xpDelta: reward.xpDelta
        });
    }

    async function updateArenaRewards(eloDelta, gemDelta, xpDelta) {
        const rewardKey = `viegeo-arena-reward-${state.roomId}`;
        if (sessionStorage.getItem(rewardKey)) return { eloDelta: 0, gemDelta: 0, xpDelta: 0 };
        sessionStorage.setItem(rewardKey, 'pending');
        try {
            const response = await state.client.from('users').select('*').eq('email', state.user.email).maybeSingle();
            if (response.error) throw response.error;
            const profile = response.data || {};
            const currentElo = readElo(profile);
            const currentGems = Number(profile.gems ?? profile.diamonds ?? profile.legacy_data?.gems) || 0;
            const currentXp = Number(profile.xp ?? profile.score ?? profile.exp) || 0;
            const nextElo = Math.max(0, currentElo + eloDelta);
            const nextGems = Math.max(0, currentGems + gemDelta);
            const nextXp = Math.max(0, currentXp + xpDelta);
            const actualGemDelta = nextGems - currentGems;
            const actualXpDelta = nextXp - currentXp;
            const payload = {};
            if (Object.prototype.hasOwnProperty.call(profile, 'gems')) payload.gems = nextGems;
            else if (Object.prototype.hasOwnProperty.call(profile, 'diamonds')) payload.diamonds = nextGems;
            if (Object.prototype.hasOwnProperty.call(profile, 'xp')) payload.xp = nextXp;
            else if (Object.prototype.hasOwnProperty.call(profile, 'score')) payload.score = nextXp;
            else if (Object.prototype.hasOwnProperty.call(profile, 'exp')) payload.exp = nextXp;
            if (Object.prototype.hasOwnProperty.call(profile, 'elo')) {
                payload.elo = nextElo;
            } else if (Object.prototype.hasOwnProperty.call(profile, 'legacy_data')) {
                payload.legacy_data = Object.assign({}, profile.legacy_data || {}, {
                    arena_elo: nextElo,
                    gems: nextGems
                });
            }
            if (Object.prototype.hasOwnProperty.call(profile, 'updated_at')) payload.updated_at = new Date().toISOString();
            if (Object.keys(payload).length) {
                const update = await state.client.from('users').update(payload).eq('email', state.user.email);
                if (update.error) throw update.error;
            }
            state.user.elo = nextElo;
            state.user.gems = nextGems;
            state.user.xp = nextXp;
            state.user.score = nextXp;
            syncLocalReward(nextElo, nextGems, nextXp);
            sessionStorage.setItem(rewardKey, 'done');
            return { eloDelta: eloDelta, gemDelta: actualGemDelta, xpDelta: actualXpDelta };
        } catch (error) {
            sessionStorage.removeItem(rewardKey);
            console.error('[VieGeo Arena] Không thể cập nhật phần thưởng:', error);
            notify('Kết quả đã ghi nhận, phần thưởng sẽ được cập nhật khi kết nối ổn định.');
            return { eloDelta: 0, gemDelta: 0, xpDelta: 0 };
        }
    }

    function syncLocalReward(elo, gems, xp) {
        try {
            const local = JSON.parse(localStorage.getItem('VieGeo_state') || '{}');
            local.elo = elo;
            local.gems = gems;
            local.xp = xp;
            localStorage.setItem('VieGeo_state', JSON.stringify(local));
        } catch (_) {}
    }

    function createExplosion() {
        elements.arenaExplosion.innerHTML = '';
        const colors = ['#38bdf8', '#fb7185', '#facc15', '#a78bfa', '#4ade80'];
        for (let index = 0; index < 28; index += 1) {
            const particle = document.createElement('i');
            particle.style.setProperty('--burst-angle', `${index * (360 / 28)}deg`);
            particle.style.setProperty('--burst-color', colors[index % colors.length]);
            particle.style.animationDelay = `${(index % 5) * .06}s`;
            elements.arenaExplosion.appendChild(particle);
        }
    }

    function showResult(result) {
        elements.arenaResultOverlay.hidden = false;
        elements.arenaResultOverlay.classList.toggle('is-defeat', !result.isWinner && !result.isDraw);
        elements.arenaResultTitle.textContent = result.isDraw ? 'Draw' : (result.isWinner ? 'Victory' : 'Defeat');
        elements.arenaResultEyebrow.textContent = result.reason;
        elements.arenaResultText.textContent = result.isDraw
            ? 'Hai người chơi đã chiến đấu ngang tài ngang sức.'
            : (result.isWinner ? 'Bạn đã làm chủ thanh chiến đấu và giành chiến thắng!' : 'Bạn đã chiến đấu hết mình. Hãy trở lại mạnh mẽ hơn!');
        elements.arenaResultIcon.innerHTML = result.isWinner
            ? '<i class="fa-solid fa-trophy"></i>'
            : (result.isDraw ? '<i class="fa-solid fa-handshake"></i>' : '<i class="fa-solid fa-shield-halved"></i>');
        elements.arenaEloReward.textContent = result.eloDelta >= 0 ? `+${result.eloDelta}` : String(result.eloDelta);
        elements.arenaGemReward.textContent = result.gemDelta >= 0 ? `+${result.gemDelta}` : String(result.gemDelta);
        elements.arenaXpReward.textContent = result.xpDelta >= 0 ? `+${result.xpDelta}` : String(result.xpDelta);
        createExplosion();
    }

    function handleArenaError(message) {
        const text = cleanText(message.payload?.message, 'Không thể khởi tạo trận đấu.');
        notify(text);
        setConnection('Không thể bắt đầu', false);
        elements.arenaQuestionText.textContent = text;
    }

    async function cleanupChannels() {
        window.clearInterval(state.roundTimer);
        window.clearTimeout(state.opponentMissingTimer);
        if (!state.client) return;
        const channels = [state.matchmakingChannel, state.battleChannel].filter(Boolean);
        state.matchmakingChannel = null;
        state.battleChannel = null;
        await Promise.all(channels.map(async function (channel) {
            try { await channel.untrack(); } catch (_) {}
            try { await state.client.removeChannel(channel); } catch (_) {}
        }));
    }

    async function leaveArena() {
        await cleanupChannels();
        window.location.href = 'student-dashboard.html';
    }

    function bindEvents() {
        elements.arenaFindButton.addEventListener('click', startMatchmaking);
        elements.arenaCancelButton.addEventListener('click', function () { cancelMatchmaking(true); });
        elements.arenaLeaveButton.addEventListener('click', leaveArena);
        elements.arenaResultContinue.addEventListener('click', leaveArena);
        document.querySelectorAll('.powerup-button').forEach(function (button) {
            button.addEventListener('click', function () { activatePowerup(button.dataset.power); });
        });
        window.addEventListener('pagehide', cleanupChannels);
    }

    async function initialize() {
        cacheElements();
        bindEvents();
        state.client = getClient();
        if (!state.client) {
            setConnection('Không có kết nối', false);
            setMatchmakingMessage('Không thể kết nối máy chủ Arena. Vui lòng tải lại trang.');
            elements.arenaFindButton.disabled = true;
            return;
        }
        try {
            const verified = window.VieGeoAuthReady ? await window.VieGeoAuthReady : window.VieGeoCurrentUser;
            if (!verified?.email) return;
            const response = await state.client.from('users').select('*').eq('email', verified.email).maybeSingle();
            if (response.error) throw response.error;
            const profile = response.data || verified;
            state.user = {
                id: verified.auth_id || verified.id || profile.id || verified.email,
                email: cleanText(verified.email || profile.email).toLowerCase(),
                name: displayName(profile),
                elo: readElo(profile),
                gems: Number(profile.gems) || 0
            };
            setConnection('Sẵn sàng', true);
            setMatchmakingMessage(`Xin chào ${state.user.name}. Chọn độ khó và bắt đầu tìm đối thủ.`);
        } catch (error) {
            console.error('[VieGeo Arena] Không thể tải người chơi:', error);
            setConnection('Lỗi tài khoản', false);
            setMatchmakingMessage('Không thể tải dữ liệu người chơi. Vui lòng đăng nhập lại.');
            elements.arenaFindButton.disabled = true;
        }
    }

    document.addEventListener('DOMContentLoaded', initialize);
}());
