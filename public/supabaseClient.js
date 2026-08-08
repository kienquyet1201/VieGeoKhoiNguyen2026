(function () {
    'use strict';

    const SUPABASE_URL = window.ENV_SUPABASE_URL || 'https://mijjvqkfkzwpmjpwkbgk.supabase.co';
    const SUPABASE_ANON_KEY = window.ENV_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pamp2cWtma3p3cG1qcHdrYmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTI3MzgsImV4cCI6MjEwMTc2ODczOH0.KKomdXKDi1sn7Ems1JxaFLrecq2oA_xVqMgo1jvUhiY';
    const TABLE_ALIASES = {
        Questions: 'questions',
        questions: 'questions',
        question: 'questions',
        users: 'users',
        premium_requests: 'premium_requests',
        submissions: 'submissions',
        ErrorReports: 'error_reports',
        error_reports: 'error_reports',
        UserFeedbacks: 'user_feedbacks',
        user_feedbacks: 'user_feedbacks'
    };
    const REMOTE_TABLES = new Set(Object.values(TABLE_ALIASES));

    function createClientIfPossible() {
        if (window.supabaseClient && typeof window.supabaseClient.from === 'function') return window.supabaseClient;
        if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;
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

    function docFromRow(row, idField = 'id') {
        const data = row && row.legacy_data && typeof row.legacy_data === 'object'
            ? { ...row.legacy_data, ...row }
            : { ...(row || {}) };
        if (data.active_role !== undefined) data.activeRole = data.active_role;
        if (data.force_logout !== undefined) data.forceLogout = data.force_logout;
        if (data.account_status !== undefined) data.accountStatus = data.account_status;
        if (data.last_active_client !== undefined) data.lastActive = data.last_active_client;
        if (data.current_streak !== undefined) data.currentStreak = data.current_streak;
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
        const payload = {
            email: data.email || id,
            role: data.role || data.activeRole || data.active_role || 'user',
            roles: Array.isArray(data.roles) ? data.roles : [data.role || data.activeRole || 'user'],
            active_role: data.active_role || data.activeRole || data.role || 'user',
            full_name: data.full_name || data.name || null,
            name: data.name || data.full_name || null,
            gender: data.gender || null,
            phone: data.phone || null,
            password: data.password || null,
            last_active_client: Number(data.lastActive ?? data.last_active_client ?? 0) || 0,
            force_logout: Boolean(data.forceLogout ?? data.force_logout ?? false),
            account_status: data.accountStatus || data.account_status || 'free',
            selected_grade: data.selectedGrade ?? data.selected_grade ?? null,
            selected_difficulty: data.selectedDifficulty ?? data.selected_difficulty ?? null,
            xp: Number(data.xp ?? 0) || 0,
            gems: Number(data.gems ?? 0) || 0,
            hearts: Number(data.hearts ?? 3) || 0,
            current_streak: Number(data.currentStreak ?? data.streak ?? 0) || 0,
            game_state: data.gameState || data.game_state || null,
            legacy_data: data,
            updated_at: now
        };
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
        return payload;
    }

    function normalizePayload(table, id, data) {
        if (table === 'users') return normalizeUserPayload(id, data);
        if (table === 'premium_requests') {
            return {
                user_email: data.user_email || data.email || id || 'unknown',
                email: data.email || data.user_email || id || null,
                name: data.name || null,
                status: data.status || 'pending',
                created_at: data.created_at || data.timestamp || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        }
        if (table === 'user_feedbacks') {
            return {
                user_email: data.user_email || data.senderId || data.sender_id || 'anonymous',
                content: data.content || data.message || '',
                subject: data.subject || null,
                message: data.message || data.content || '',
                sender_id: data.sender_id || data.senderId || data.user_email || null,
                sender_name: data.sender_name || data.senderName || null,
                status: data.status || 'pending',
                created_at_client: data.created_at_client || data.createdAtClient || Date.now()
            };
        }
        if (table === 'error_reports') {
            return {
                user_email: data.user_email || data.senderId || data.sender_id || 'anonymous',
                error_message: data.error_message || data.message || data.content || '',
                page: data.page || data.subject || location.pathname,
                content: data.content || data.message || '',
                subject: data.subject || data.page || null,
                message: data.message || data.error_message || '',
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
            return { empty: rows.length === 0, docs: rows.map(row => docFromRow(row)) };
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
                    if (data) return docFromRow(data, field);
                } catch (error) {
                    console.warn(`Supabase ${this.table} doc fallback:`, error?.message || error);
                }
            }
            const row = readLocal(this.path).find(item => String(item.id ?? item.email) === this.id);
            return row ? docFromRow(row) : { id: this.id, exists: false, data: () => ({}) };
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
