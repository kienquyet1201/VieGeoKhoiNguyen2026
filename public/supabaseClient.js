(function () {
    'use strict';

    // The public anon key is designed to be shipped to the browser. Keep this
    // fallback so authentication still works if the optional runtime-config
    // endpoint is unavailable during a deployment.
    const FALLBACK_SUPABASE_URL = 'https://mijjvqkfkzwpmjpwkbgk.supabase.co';
    const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pamp2cWtma3p3cG1qcHdrYmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTI3MzgsImV4cCI6MjEwMTc2ODczOH0.KKomdXKDi1sn7Ems1JxaFLrecq2oA_xVqMgo1jvUhiY';
    const SUPABASE_URL = String(window.ENV_SUPABASE_URL || FALLBACK_SUPABASE_URL).trim();
    const SUPABASE_ANON_KEY = String(window.ENV_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY).trim();
    const TABLE_ALIASES = {
        Questions: 'questions',
        questions: 'questions',
        question: 'questions',
        users: 'users',
        leaderboard: 'leaderboard',
        premium_requests: 'premium_requests',
        submissions: 'submissions',
        ErrorReports: 'error_reports',
        error_reports: 'error_reports',
        UserFeedbacks: 'user_feedbacks',
        user_feedbacks: 'user_feedbacks',
        support_tickets: 'support_tickets',
        support_messages: 'support_messages'
    };
    const REMOTE_TABLES = new Set(Object.values(TABLE_ALIASES));

    function createClientIfPossible() {
        if (window.supabaseClient && typeof window.supabaseClient.from === 'function') return window.supabaseClient;
        if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            window.VieGeoSupabaseConfigError = 'SUPABASE_CONFIG_MISSING';
            console.error('[VieGeo] Thiếu cấu hình kết nối Supabase công khai.');
            return null;
        }
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return null;
    }

    const client = createClientIfPossible();
    if (client) {
        window.supabaseClient = client;
        window.supabase = client;
    }

    const DANGEROUS_TAGS = /<\s*(script|style|iframe|object|embed|link|meta|base|form)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi;
    const EVENT_ATTRIBUTES = /\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
    const JAVASCRIPT_URLS = /\s+(href|src|xlink:href)\s*=\s*(['"]?)\s*javascript:[^'"\s>]*/gi;

    function limitText(value, maxLength = 2000) {
        return String(value ?? '').slice(0, Math.max(0, Number(maxLength) || 0));
    }

    function sanitizeHtml(value, maxLength = 12000) {
        return limitText(value, maxLength)
            .replace(DANGEROUS_TAGS, '')
            .replace(EVENT_ATTRIBUTES, '')
            .replace(JAVASCRIPT_URLS, ' $1="#"')
            .replace(/<!--[\s\S]*?-->/g, '')
            .trim();
    }

    function sanitizeText(value, maxLength = 2000) {
        return sanitizeHtml(value, maxLength)
            .replace(/<[^>]*>/g, '')
            .replace(/\u0000/g, '')
            .replace(/[ \t]+\n/g, '\n')
            .trim();
    }

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim().toLowerCase());
    }

    function rateLimit(key, { limit = 5, windowMs = 60000 } = {}) {
        const storageKey = `VieGeo_rate_${key}`;
        const now = Date.now();
        let bucket = { count: 0, resetAt: now + windowMs };
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
            if (stored && Number(stored.resetAt) > now) bucket = stored;
        } catch {}
        if (Number(bucket.count) >= limit) {
            return { allowed: false, retryAfterMs: Math.max(0, Number(bucket.resetAt) - now) };
        }
        bucket.count = Number(bucket.count || 0) + 1;
        bucket.resetAt = Number(bucket.resetAt || now + windowMs);
        localStorage.setItem(storageKey, JSON.stringify(bucket));
        return { allowed: true, retryAfterMs: 0 };
    }

    function clearRateLimit(key) {
        localStorage.removeItem(`VieGeo_rate_${key}`);
    }

    window.VieGeoSecurity = window.VieGeoSecurity || {
        sanitizeHtml,
        sanitizeText,
        isValidEmail,
        rateLimit,
        clearRateLimit
    };

    function tableName(name) {
        return TABLE_ALIASES[name] || name;
    }

    function localKey(path) {
        return `VieGeo_local_${path.replace(/[^\w.-]+/g, '_')}`;
    }

    function readLocal(path) {
        try {
            const rows = JSON.parse(localStorage.getItem(localKey(path)) || '[]');
            return Array.isArray(rows) ? rows : [];
        } catch {
            return [];
        }
    }

    function writeLocal(path, rows) {
        localStorage.setItem(localKey(path), JSON.stringify(rows));
    }

    function normalizeQuestionRowForRead(row = {}) {
        const options = Array.isArray(row.options)
            ? row.options
            : [row.option_a, row.option_b, row.option_c, row.option_d, row.option0, row.option1, row.option2, row.option3]
                .filter(value => value !== undefined && value !== null);
        const cleanOptions = options.map(option => String(option ?? '').trim()).filter(Boolean);
        const rawAnswer = row.correct_option ?? row.correctAnswer ?? row.answerIndex ?? row.correct_answer ?? row.answer ?? 0;
        const answerIndex = Number(rawAnswer);
        const normalizedAnswer = Number.isInteger(answerIndex) ? answerIndex : 0;
        const islandMatch = String(row.island || '').match(/\d+/);
        const islandNumberFromLabel = islandMatch && islandMatch[0] ? Number(islandMatch[0]) : 0;
        const subIsland = row.sub_island ?? row.subIsland ?? row.islandIndex ?? row.island_index ?? (islandNumberFromLabel || '');
        return {
            ...row,
            question: row.question ?? row.questionText ?? row.question_text ?? '',
            questionText: row.questionText ?? row.question ?? row.question_text ?? '',
            options: cleanOptions,
            answer: normalizedAnswer,
            correctAnswer: normalizedAnswer,
            answerIndex: normalizedAnswer,
            province: row.province ?? row.province_slug ?? '',
            difficulty: String(row.difficulty || 'easy').toLowerCase(),
            island: row.island ?? (subIsland ? `Đảo nhỏ ${subIsland}` : ''),
            subIsland,
            islandIndex: row.islandIndex ?? row.island_index ?? subIsland,
            topic: row.topic ?? row.lessonTitle ?? row.lesson_title ?? '',
            lessonTitle: row.lessonTitle ?? row.topic ?? row.lesson_title ?? '',
            theory: row.theory ?? row.explanation ?? row.solution ?? row.explain ?? '',
            explanation: row.explanation ?? row.theory ?? row.solution ?? row.explain ?? '',
            hint1: row.hint1 ?? '',
            hint2: row.hint2 ?? '',
            islandTheory: row.islandTheory ?? row.island_theory ?? row.islandTheoryContent ?? row.island_theory_content ?? '',
            islandTheoryContent: row.islandTheoryContent ?? row.island_theory ?? row.islandTheory ?? row.island_theory_content ?? '',
            lessonId: row.lessonId ?? row.lesson_id ?? '',
            createdAt: row.createdAt ?? row.created_at ?? null,
            updatedAt: row.updatedAt ?? row.updated_at ?? null
        };
    }

    function docFromRow(row, idField = 'id', table = '') {
        const data = row && row.legacy_data && typeof row.legacy_data === 'object'
            ? { ...row.legacy_data, ...row }
            : { ...(row || {}) };
        if (table === 'questions') {
            const normalizedQuestion = normalizeQuestionRowForRead(data);
            return {
                id: String(row?.[idField] ?? row?.id ?? row?.question_id ?? ''),
                exists: Boolean(row),
                rawId: row?.[idField] ?? row?.id,
                data: () => normalizedQuestion
            };
        }
        if (data.active_role !== undefined) data.activeRole = data.active_role;
        if (data.force_logout !== undefined) data.forceLogout = data.force_logout;
        if (data.account_status !== undefined) data.accountStatus = data.account_status;
        if (data.last_active_client !== undefined) data.lastActive = data.last_active_client;
        if (data.current_streak !== undefined) data.currentStreak = data.current_streak;
        if (data.school_grade !== undefined) data.schoolGrade = data.school_grade;
        if (data.textbook_curriculum !== undefined) data.textbookCurriculum = data.textbook_curriculum;
        if (data.selected_grade !== undefined) data.selectedGrade = data.selected_grade;
        if (data.selected_difficulty !== undefined) data.selectedDifficulty = data.selected_difficulty;
        if (data.game_state !== undefined) data.gameState = data.game_state;
        if (data.created_at !== undefined) data.createdAt = data.created_at;
        return {
            id: String(row?.[idField] ?? row?.email ?? row?.user_email ?? row?.id ?? ''),
            exists: Boolean(row),
            data: () => data
        };
    }

    function normalizeUserPayload(id, data) {
        const now = new Date().toISOString();
        const { password: _discardedPassword, ...safeLegacyData } = data || {};
        const normalizeRoleValue = (value) => ({ student: 'user', map: 'user', cskh: 'cs', support: 'cs' })[String(value || '').trim().toLowerCase()] || String(value || '').trim().toLowerCase();
        const collectedRoles = [];
        const appendRole = (value) => {
            if (!value) return;
            if (Array.isArray(value)) { value.forEach(appendRole); return; }
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed) return;
                if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.includes(',')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) { parsed.forEach(appendRole); return; }
                    } catch {}
                    trimmed.split(',').forEach(appendRole);
                    return;
                }
                collectedRoles.push(normalizeRoleValue(trimmed));
                return;
            }
            collectedRoles.push(normalizeRoleValue(value));
        };
        const hasExplicitRoles = Object.prototype.hasOwnProperty.call(data || {}, 'roles');
        appendRole(data.roles);
        if (!hasExplicitRoles) {
            appendRole(data.role);
            appendRole(data.activeRole);
            appendRole(data.active_role);
            if (data.isAdmin || data.isSuperAdmin) appendRole('admin');
        }
        const validRoles = [...new Set(collectedRoles.filter(role => ['user', 'parent', 'cs', 'admin'].includes(role)))];
        const primaryRole = validRoles.includes(normalizeRoleValue(data.role || data.activeRole || data.active_role))
            ? normalizeRoleValue(data.role || data.activeRole || data.active_role)
            : (validRoles[0] || 'user');
        const payload = {
            email: data.email || id,
            role: primaryRole,
            roles: validRoles.length ? validRoles : ['user'],
            active_role: primaryRole,
            full_name: data.full_name || data.name || null,
            name: data.name || data.full_name || null,
            gender: sanitizeText(data.gender || '', 24) || null,
            phone: sanitizeText(data.phone || '', 32) || null,
            password: null,
            last_active_client: Number(data.lastActive ?? data.last_active_client ?? 0) || 0,
            force_logout: Boolean(data.forceLogout ?? data.force_logout ?? false),
            account_status: data.accountStatus || data.account_status || 'free',
            selected_grade: data.selectedGrade ?? data.selected_grade ?? null,
            age: Number(data.age ?? 0) || null,
            school_grade: Number(data.schoolGrade ?? data.school_grade ?? 0) || null,
            textbook_curriculum: sanitizeText(data.textbookCurriculum ?? data.textbook_curriculum ?? '', 160) || 'Chương trình GDPT 2018',
            selected_difficulty: data.selectedDifficulty ?? data.selected_difficulty ?? null,
            xp: Number(data.xp ?? 0) || 0,
            gems: Number(data.gems ?? 0) || 0,
            hearts: Number(data.hearts ?? 3) || 0,
            current_streak: Number(data.currentStreak ?? data.streak ?? 0) || 0,
            game_state: data.gameState || data.game_state || null,
            legacy_data: safeLegacyData,
            created_at: data.created_at || data.createdAt || now,
            updated_at: now
        };
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
        return payload;
    }

    function normalizePayload(table, id, data) {
        if (table === 'users') return normalizeUserPayload(id, data);
        if (table === 'questions') {
            const options = Array.isArray(data.options)
                ? data.options
                : [data.option_a, data.option_b, data.option_c, data.option_d];
            const cleanOptions = options.map(option => sanitizeText(option, 500));
            return {
                ...data,
                question: sanitizeText(data.question || data.questionText || '', 1000),
                option_a: cleanOptions[0] || '',
                option_b: cleanOptions[1] || '',
                option_c: cleanOptions[2] || '',
                option_d: cleanOptions[3] || '',
                correct_option: Math.max(0, Math.min(3, Number(data.correct_option ?? data.answer ?? data.correctAnswer ?? 0) || 0)),
                province: sanitizeText(data.province || '', 80),
                island: sanitizeText(data.island || '', 80),
                topic: sanitizeText(data.topic || data.lessonTitle || '', 160),
                theory: sanitizeHtml(data.theory || data.explanation || '', 6000),
                hint1: sanitizeText(data.hint1 || '', 1000),
                hint2: sanitizeText(data.hint2 || '', 1000),
                difficulty: ['easy', 'medium', 'hard'].includes(String(data.difficulty || '').toLowerCase()) ? String(data.difficulty).toLowerCase() : 'easy',
                island_theory: sanitizeHtml(data.island_theory || data.islandTheory || '', 12000),
                updated_at: data.updated_at || new Date().toISOString()
            };
        }
        if (table === 'premium_requests') {
            return {
                user_email: data.user_email || data.email || id || 'unknown',
                email: data.email || data.user_email || id || null,
                name: sanitizeText(data.name || '', 120) || null,
                status: data.status || 'pending',
                created_at: data.created_at || data.timestamp || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        }
        if (table === 'user_feedbacks') {
            return {
                user_email: data.user_email || data.senderId || data.sender_id || 'anonymous',
                content: sanitizeText(data.content || data.message || '', 3000),
                subject: sanitizeText(data.subject || '', 160) || null,
                message: sanitizeText(data.message || data.content || '', 3000),
                sender_id: data.sender_id || data.senderId || data.user_email || null,
                sender_name: data.sender_name || data.senderName || null,
                status: data.status || 'pending',
                created_at_client: data.created_at_client || data.createdAtClient || Date.now()
            };
        }
        if (table === 'error_reports') {
            return {
                user_email: data.user_email || data.senderId || data.sender_id || 'anonymous',
                error_message: sanitizeText(data.error_message || data.message || data.content || '', 3000),
                page: sanitizeText(data.page || data.subject || location.pathname, 180),
                content: sanitizeText(data.content || data.message || '', 3000),
                subject: sanitizeText(data.subject || data.page || '', 160) || null,
                message: sanitizeText(data.message || data.error_message || '', 3000),
                sender_id: data.sender_id || data.senderId || data.user_email || null,
                sender_name: data.sender_name || data.senderName || null,
                status: data.status || 'pending',
                created_at_client: data.created_at_client || data.createdAtClient || Date.now()
            };
        }
        return { ...data };
    }

    function applyLocalFilters(rows, filters) {
        return rows.filter(row => filters.every(filter => {
            const actual = row[filter.field] ?? row[fieldAlias(filter.field)];
            if (filter.op === '==') return String(actual) === String(filter.value);
            if (filter.op === '>=') return Number(actual) >= Number(filter.value);
            if (filter.op === '<=') return Number(actual) <= Number(filter.value);
            return true;
        }));
    }

    function fieldAlias(field) {
        return ({
            lastActive: 'last_active_client',
            activeRole: 'active_role',
            forceLogout: 'force_logout',
            accountStatus: 'account_status',
            currentStreak: 'current_streak',
            schoolGrade: 'school_grade',
            textbookCurriculum: 'textbook_curriculum',
            selectedGrade: 'selected_grade',
            selectedDifficulty: 'selected_difficulty',
            lessonId: 'lesson_id'
        })[field] || field;
    }

    class QueryRef {
        constructor(path, options = {}) {
            this.path = path;
            this.table = tableName(path.split('/')[0]);
            this.filters = options.filters || [];
            this.sortField = options.sortField || null;
            this.sortDirection = options.sortDirection || 'asc';
            this.maxRows = options.maxRows || null;
            this.parentPath = options.parentPath || null;
        }

        doc(id) { return new DocRef(this.path, String(id)); }

        where(field, op, value) {
            return new QueryRef(this.path, { ...this, filters: [...this.filters, { field, op, value }] });
        }

        orderBy(field, direction = 'asc') {
            return new QueryRef(this.path, { ...this, sortField: field, sortDirection: direction });
        }

        limit(count) {
            return new QueryRef(this.path, { ...this, maxRows: count });
        }

        async get() {
            let rows = [];
            if (client && REMOTE_TABLES.has(this.table) && !this.path.includes('/')) {
                try {
                    let request = client.from(this.table).select('*');
                    this.filters.forEach(filter => {
                        const field = fieldAlias(filter.field);
                        if (filter.op === '==') request = request.eq(field, filter.value);
                        else if (filter.op === '>=') request = request.gte(field, filter.value);
                        else if (filter.op === '<=') request = request.lte(field, filter.value);
                    });
                    if (this.sortField) request = request.order(fieldAlias(this.sortField), { ascending: this.sortDirection !== 'desc' });
                    if (this.maxRows) request = request.limit(this.maxRows);
                    const { data, error } = await request;
                    if (error) throw error;
                    rows = Array.isArray(data) ? data : [];
                    if (this.table === 'questions') {
                        console.log('[VieGeo Supabase] questions query OK', {
                            filters: this.filters,
                            orderBy: this.sortField,
                            limit: this.maxRows,
                            rawCount: rows.length,
                            firstRow: rows[0] || null
                        });
                    }
                } catch (error) {
                    console.warn(`Supabase ${this.table} query fallback:`, error?.message || error);
                    rows = readLocal(this.path);
                }
            } else {
                rows = readLocal(this.path);
            }
            rows = applyLocalFilters(rows, this.filters);
            if (this.sortField) {
                const alias = fieldAlias(this.sortField);
                rows.sort((a, b) => {
                    const av = a[this.sortField] ?? a[alias] ?? 0;
                    const bv = b[this.sortField] ?? b[alias] ?? 0;
                    return this.sortDirection === 'desc' ? Number(bv) - Number(av) : Number(av) - Number(bv);
                });
            }
            if (this.maxRows) rows = rows.slice(0, this.maxRows);
            const docs = rows.map(row => docFromRow(row, 'id', this.table));
            if (this.table === 'questions') {
                console.log('[VieGeo Supabase] questions normalized docs', {
                    count: docs.length,
                    firstDoc: docs[0]?.data?.() || null
                });
            }
            return { empty: rows.length === 0, docs };
        }

        async add(data) {
            const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const payload = normalizePayload(this.table, id, { ...data, id });
            if (client && REMOTE_TABLES.has(this.table) && !this.path.includes('/')) {
                try {
                    const { data: inserted, error } = await client.from(this.table).insert([payload]).select('*').single();
                    if (error) throw error;
                    return new DocRef(this.path, String(inserted?.id ?? id));
                } catch (error) {
                    console.warn(`Supabase ${this.table} insert fallback:`, error?.message || error);
                }
            }
            const rows = readLocal(this.path);
            rows.push({ ...payload, id });
            writeLocal(this.path, rows);
            return new DocRef(this.path, id);
        }

        onSnapshot(next, errorHandler) {
            this.get().then(next).catch(error => {
                if (typeof errorHandler === 'function') errorHandler(error);
                else console.warn('Realtime fallback query failed:', error);
            });
            return () => {};
        }
    }

    class DocRef {
        constructor(path, id) {
            this.path = path;
            this.table = tableName(path.split('/')[0]);
            this.id = id;
        }

        collection(name) {
            return new QueryRef(`${this.path}/${encodeURIComponent(this.id)}/${name}`);
        }

        async get() {
            if (client && REMOTE_TABLES.has(this.table) && !this.path.includes('/')) {
                try {
                    const field = this.table === 'users' && !/^\d+$/.test(this.id) ? 'email' : 'id';
                    const { data, error } = await client.from(this.table).select('*').eq(field, field === 'id' ? Number(this.id) : this.id).maybeSingle();
                    if (error) throw error;
                    if (data) return docFromRow(data, field, this.table);
                } catch (error) {
                    console.warn(`Supabase ${this.table} doc fallback:`, error?.message || error);
                }
            }
            const row = readLocal(this.path).find(item => String(item.id ?? item.email) === this.id);
            return row ? docFromRow(row, 'id', this.table) : { id: this.id, exists: false, data: () => ({}) };
        }

        async set(data, options = {}) {
            const payload = normalizePayload(this.table, this.id, { ...data, id: this.id });
            if (client && REMOTE_TABLES.has(this.table) && !this.path.includes('/')) {
                try {
                    if (this.table === 'users') {
                        const { error } = await client.from(this.table).upsert(payload, { onConflict: 'email' });
                        if (error) throw error;
                        return;
                    }
                    const { error } = await client.from(this.table).insert([payload]);
                    if (error) throw error;
                    return;
                } catch (error) {
                    console.warn(`Supabase ${this.table} set fallback:`, error?.message || error);
                }
            }
            const rows = readLocal(this.path);
            const index = rows.findIndex(item => String(item.id ?? item.email) === this.id);
            const nextRow = options.merge && index >= 0 ? { ...rows[index], ...payload } : { ...payload, id: this.id };
            if (index >= 0) rows[index] = nextRow;
            else rows.push(nextRow);
            writeLocal(this.path, rows);
        }

        async update(data) {
            const current = await this.get();
            return this.set({ ...(current.exists ? current.data() : {}), ...data }, { merge: true });
        }

        async delete() {
            if (client && REMOTE_TABLES.has(this.table) && !this.path.includes('/')) {
                try {
                    const field = this.table === 'users' && !/^\d+$/.test(this.id) ? 'email' : 'id';
                    const { error } = await client.from(this.table).delete().eq(field, field === 'id' ? Number(this.id) : this.id);
                    if (error) throw error;
                    return;
                } catch (error) {
                    console.warn(`Supabase ${this.table} delete fallback:`, error?.message || error);
                }
            }
            writeLocal(this.path, readLocal(this.path).filter(item => String(item.id ?? item.email) !== this.id));
        }

        onSnapshot(next, errorHandler) {
            this.get().then(next).catch(error => {
                if (typeof errorHandler === 'function') errorHandler(error);
                else console.warn('Realtime fallback doc failed:', error);
            });
            return () => {};
        }
    }

    window.db = window.db || {
        collection(name) { return new QueryRef(name); },
        batch() {
            const tasks = [];
            return {
                update(ref, data) { tasks.push(() => ref.update(data)); },
                set(ref, data, options) { tasks.push(() => ref.set(data, options)); },
                delete(ref) { tasks.push(() => ref.delete()); },
                commit() { return Promise.all(tasks.map(task => task())); }
            };
        }
    };

    window.VieGeoSupabase = { client, db: window.db };
}());

/* Blocks legacy compatibility calls from mutating the canonical users table.
 * Existing screens may still read a profile through db.collection('users'),
 * but every write must use a named Supabase RPC. */
(function () {
    'use strict';
    try {
        if (!window.db?.collection || window.db.__viegeoCanonicalUserGuard) return;
        var originalCollection = window.db.collection.bind(window.db);
        window.db.collection = function (name) {
            var collection = originalCollection(name);
            if (String(name || '').toLowerCase() !== 'users') return collection;
            var originalDoc = collection.doc?.bind(collection);
            collection.doc = function (id) {
                var reference = originalDoc(id);
                reference.get = async function () {
                    var profile = await window.VieGeoUserStore?.ready?.({ refreshStreak: false });
                    var requested = String(id || '').trim().toLowerCase();
                    if (!profile || (requested && requested !== String(profile.id).toLowerCase() && requested !== String(profile.email).toLowerCase())) {
                        return { id: String(id || ''), exists: false, data: function () { return {}; } };
                    }
                    var legacyShape = Object.assign({}, profile, {
                        user_name: profile.display_name, name: profile.display_name, full_name: profile.display_name,
                        current_streak: profile.streak, score: profile.xp
                    });
                    return { id: profile.id, exists: true, data: function () { return legacyShape; } };
                };
                reference.set = async function () {
                    console.warn('[VieGeo] Chặn ghi trực tiếp public.users; hãy dùng Supabase RPC.');
                    return null;
                };
                reference.update = reference.set;
                reference.delete = reference.set;
                reference.onSnapshot = function (next) {
                    reference.get().then(next).catch(function (error) { console.warn('[VieGeo] Không thể đọc hồ sơ chuẩn:', error); });
                    return function () {};
                };
                return reference;
            };
            collection.add = async function () {
                console.warn('[VieGeo] Chặn tạo public.users trực tiếp; hồ sơ được tạo bởi trigger Auth.');
                return null;
            };
            return collection;
        };
        window.db.__viegeoCanonicalUserGuard = true;
    } catch (error) {
        console.warn('[VieGeo] Không thể gắn bảo vệ users legacy:', error);
    }
}());

/*
 * Phase 1 canonical user store.
 * Browser storage is deliberately not used for role, Premium, streak, XP or gems.
 * Supabase Auth identifies the caller; public.users is the only profile source.
 */
(function () {
    'use strict';

    var currentUser = null;
    var readyPromise = null;
    var realtimeChannel = null;

    function getClient() {
        return window.supabaseClient || window.supabase || window.VieGeoSupabase?.client || null;
    }

    function normaliseRoles(value, primaryRole) {
        var allowed = ['user', 'parent', 'cs', 'admin'];
        var aliases = { student: 'user', cskh: 'cs', support: 'cs' };
        var values = Array.isArray(value) ? value : String(value || '').split(',');
        if (primaryRole) values.push(primaryRole);
        var normalisedValues = values.map(function (role) {
            var normalised = String(role || '').trim().toLowerCase();
            return aliases[normalised] || normalised;
        }).filter(function (role) { return allowed.includes(role); });
        var roles = Array.from(new Set(normalisedValues));
        return roles.length ? roles : ['user'];
    }

    function normaliseProfile(profile) {
        if (!profile || typeof profile !== 'object') return null;
        var roles = normaliseRoles(profile.roles, profile.role);
        return Object.freeze({
            id: String(profile.id || ''),
            email: String(profile.email || '').trim().toLowerCase(),
            display_name: String(profile.display_name || profile.user_name || profile.name || 'Người chơi'),
            role: roles.includes(String(profile.role || '').toLowerCase()) ? String(profile.role).toLowerCase() : roles[0],
            roles: roles,
            is_premium: profile.is_premium === true,
            streak: Math.max(0, Number(profile.streak) || 0),
            xp: Math.max(0, Number(profile.xp) || 0),
            gems: Math.max(0, Number(profile.gems) || 0),
            age: profile.age === null || profile.age === undefined ? null : Number(profile.age),
            school_grade: profile.school_grade === null || profile.school_grade === undefined ? null : Number(profile.school_grade),
            gender: profile.gender || '',
            phone: profile.phone || '',
            textbook_curriculum: profile.textbook_curriculum || 'Chương trình GDPT 2018',
            updated_at: profile.updated_at || ''
        });
    }

    function emit(profile) {
        currentUser = normaliseProfile(profile);
        window.VieGeoCurrentUser = currentUser;
        window.dispatchEvent(new CustomEvent('viegeo:user-hydrated', { detail: currentUser }));
        return currentUser;
    }

    function subscribe(client, userId) {
        try {
            if (realtimeChannel) client.removeChannel(realtimeChannel);
            realtimeChannel = client.channel('viegeo-user-' + userId)
                .on('postgres_changes', {
                    event: '*', schema: 'public', table: 'users', filter: 'id=eq.' + userId
                }, function (payload) {
                    if (payload && payload.new) emit(payload.new);
                })
                .subscribe();
        } catch (error) {
            console.warn('[VieGeo UserStore] Không thể đăng ký đồng bộ hồ sơ:', error);
        }
    }

    async function load(options) {
        try {
            var client = getClient();
            if (!client || !client.auth || !client.from) throw new Error('SUPABASE_CLIENT_UNAVAILABLE');
            var sessionResult = await client.auth.getSession();
            var session = sessionResult?.data?.session;
            if (!session?.access_token || !session?.user?.id) {
                currentUser = null;
                window.VieGeoCurrentUser = null;
                return null;
            }
            var ensure = await client.rpc('ensure_own_user_profile');
            var profileResult;
            if (ensure.error?.code === 'PGRST202') {
                // A previously provisioned profile can still be read safely while
                // the missing database bootstrap RPC is restored.
                console.warn('[VieGeo UserStore] Thiếu RPC khởi tạo hồ sơ; đang kiểm tra hồ sơ hiện có.');
                profileResult = await client.from('users').select('*').eq('id', session.user.id).single();
                if (profileResult.error) throw ensure.error;
            } else {
                if (ensure.error) throw ensure.error;
                profileResult = await client.from('users').select('*').eq('id', session.user.id).single();
            }
            if (profileResult.error) throw profileResult.error;
            var profile = emit(profileResult.data);
            subscribe(client, session.user.id);
            if (options?.refreshStreak !== false) {
                var streakResult = await client.rpc('refresh_own_streak');
                if (!streakResult.error && streakResult.data) profile = emit(streakResult.data);
            }
            return profile;
        } catch (error) {
            console.error('[VieGeo UserStore] Không thể tải hồ sơ chuẩn:', error?.message || error);
            throw error;
        }
    }

    function ready(options) {
        if (!readyPromise || options?.force === true || options?.refreshStreak === true) readyPromise = load(options || {});
        return readyPromise;
    }

    function getActiveRole() {
        try {
            if (!currentUser) return '';
            var requested = String(sessionStorage.getItem('viegeo_active_role') || '').trim().toLowerCase();
            return currentUser.roles.includes(requested) ? requested : currentUser.role;
        } catch (_) {
            return currentUser?.role || '';
        }
    }

    function setActiveRole(role) {
        if (!currentUser || !currentUser.roles.includes(role)) throw new Error('ROLE_NOT_GRANTED');
        sessionStorage.setItem('viegeo_active_role', role);
        window.dispatchEvent(new CustomEvent('viegeo:role-changed', { detail: { role: role, user: currentUser } }));
        return role;
    }

    async function completeLesson(payload) {
        try {
            var client = getClient();
            if (!client) throw new Error('SUPABASE_CLIENT_UNAVAILABLE');
            var result = await client.rpc('complete_lesson', {
                p_lesson_key: String(payload?.lessonKey || ''),
                p_province: String(payload?.province || ''),
                p_island: String(payload?.island || ''),
                p_topic: String(payload?.topic || ''),
                p_stars: Math.max(0, Math.min(3, Number(payload?.stars) || 0)),
                p_correct_count: Math.max(0, Number(payload?.correctCount) || 0),
                p_total_count: Math.max(1, Number(payload?.totalCount) || 1)
            });
            if (result.error) throw result.error;
            var row = Array.isArray(result.data) ? result.data[0] : result.data;
            await load({ refreshStreak: false });
            return row;
        } catch (error) {
            console.error('[VieGeo UserStore] Không thể lưu kết quả bài học:', error?.message || error);
            throw error;
        }
    }

    async function updateProfile(payload) {
        try {
            var client = getClient();
            if (!client) throw new Error('SUPABASE_CLIENT_UNAVAILABLE');
            var result = await client.rpc('update_own_profile', {
                p_display_name: String(payload?.displayName || '').trim(),
                p_age: payload?.age === '' || payload?.age === null ? null : Number(payload?.age),
                p_school_grade: payload?.schoolGrade === '' || payload?.schoolGrade === null ? null : Number(payload?.schoolGrade),
                p_gender: String(payload?.gender || ''),
                p_phone: String(payload?.phone || '')
            });
            if (result.error) throw result.error;
            return emit(result.data);
        } catch (error) {
            console.error('[VieGeo UserStore] Không thể cập nhật hồ sơ:', error?.message || error);
            throw error;
        }
    }

    async function signOut() {
        try {
            var client = getClient();
            if (realtimeChannel && client?.removeChannel) await client.removeChannel(realtimeChannel);
            realtimeChannel = null;
            currentUser = null;
            window.VieGeoCurrentUser = null;
            sessionStorage.removeItem('viegeo_active_role');
            if (client?.auth?.signOut) await client.auth.signOut();
        } catch (error) {
            console.warn('[VieGeo UserStore] Không thể kết thúc phiên:', error);
        }
    }

    window.VieGeoUserStore = Object.freeze({
        ready: ready,
        reload: function () { return ready({ force: true }); },
        get: function () { return currentUser; },
        getActiveRole: getActiveRole,
        setActiveRole: setActiveRole,
        completeLesson: completeLesson,
        updateProfile: updateProfile,
        signOut: signOut
    });
}());
