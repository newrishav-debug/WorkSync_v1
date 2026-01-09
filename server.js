import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './database.js';

const app = express();
const PORT = 3002;

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'worksync-jwt-secret-key-2024';
const SALT_ROUNDS = 10;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- Auth Middleware ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// --- Auth Endpoints ---

// Register new user
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Check if user exists
        db.get("SELECT id FROM users WHERE email = ?", [email.toLowerCase()], async (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row) return res.status(400).json({ error: 'Email already registered' });

            // Hash password and create user
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            const id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const createdAt = new Date().toISOString();

            db.run(
                "INSERT INTO users (id, email, passwordHash, name, createdAt) VALUES (?, ?, ?, ?, ?)",
                [id, email.toLowerCase(), passwordHash, name, createdAt],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Registration successful' });
                }
            );
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email.toLowerCase()], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        try {
            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

            // Generate JWT
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
    db.get("SELECT id, email, name, createdAt FROM users WHERE id = ?", [req.userId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    });
});

// --- API Endpoints ---

// 1. Engagements
app.get('/api/engagements', authMiddleware, (req, res) => {
    db.all("SELECT * FROM engagements WHERE userId = ?", [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Parse JSON fields
        const formatted = rows.map(r => ({
            ...r,
            timeline: JSON.parse(r.timeline || '[]'),
            files: JSON.parse(r.files || '[]')
        }));
        res.json(formatted);
    });
});

app.post('/api/engagements', authMiddleware, (req, res) => {
    const e = req.body;
    const sql = `INSERT OR REPLACE INTO engagements 
    (id, userId, engagementNumber, orgId, accountName, name, status, timeline, files, aiSummary, lastSummaryDate) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        e.id, req.userId, e.engagementNumber, e.orgId, e.accountName, e.name, e.status,
        JSON.stringify(e.timeline || []), JSON.stringify(e.files || []), e.aiSummary, e.lastSummaryDate
    ];
    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved", changes: this.changes });
    });
});

app.delete('/api/engagements/:id', authMiddleware, (req, res) => {
    db.run("DELETE FROM engagements WHERE id = ? AND userId = ?", [req.params.id, req.userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// 2. Tasks (Standard)
app.get('/api/tasks', authMiddleware, (req, res) => {
    db.all("SELECT * FROM tasks WHERE userId = ?", [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const formatted = rows.map(r => ({
            ...r,
            isCompleted: !!r.isCompleted,
            isPriority: !!r.isPriority,
            subtasks: JSON.parse(r.subtasks || '[]')
        }));
        res.json(formatted);
    });
});

app.post('/api/tasks', authMiddleware, (req, res) => {
    const t = req.body;
    const sql = `INSERT OR REPLACE INTO tasks (id, userId, content, isCompleted, type, date, createdAt, isPriority, subtasks, engagementId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [t.id, req.userId, t.content, t.isCompleted ? 1 : 0, t.type, t.date, t.createdAt, t.isPriority ? 1 : 0, JSON.stringify(t.subtasks || []), t.engagementId];
    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});

app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
    db.run("DELETE FROM tasks WHERE id = ? AND userId = ?", [req.params.id, req.userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// 3. Projects (Internal)
// We need to fetch projects AND their sub-resources (tasks, notes)
app.get('/api/projects', authMiddleware, (req, res) => {
    const sqlProjects = "SELECT * FROM projects WHERE userId = ?";
    const sqlTasks = "SELECT * FROM project_tasks";
    const sqlNotes = "SELECT * FROM research_notes";

    db.all(sqlProjects, [req.userId], (err, projects) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(sqlTasks, [], (err, tasks) => {
            if (err) return res.status(500).json({ error: err.message });

            db.all(sqlNotes, [], (err, notes) => {
                if (err) return res.status(500).json({ error: err.message });

                // Assemble structure
                const result = projects.map(p => ({
                    ...p,
                    tasks: tasks.filter(t => t.projectId === p.id).map(t => ({ ...t, isCompleted: !!t.isCompleted })),
                    researchNotes: notes.filter(n => n.projectId === p.id)
                }));
                res.json(result);
            });
        });
    });
});

app.post('/api/projects', authMiddleware, (req, res) => {
    const p = req.body;
    // Save Project with source tracking fields
    const sqlP = `INSERT OR REPLACE INTO projects (id, userId, name, description, status, startDate, dueDate, createdAt, sourceIdeaId, sourceIdeaTitle, sourceEngagementId, sourceEngagementName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sqlP, [p.id, req.userId, p.name, p.description, p.status, p.startDate, p.dueDate, p.createdAt, p.sourceIdeaId || null, p.sourceIdeaTitle || null, p.sourceEngagementId || null, p.sourceEngagementName || null], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Naive delete-insert for children
        db.serialize(() => {
            db.run("DELETE FROM project_tasks WHERE projectId = ?", p.id);
            db.run("DELETE FROM research_notes WHERE projectId = ?", p.id);

            const stmtTask = db.prepare("INSERT INTO project_tasks (id, projectId, content, isCompleted) VALUES (?, ?, ?, ?)");
            if (p.tasks) p.tasks.forEach(t => stmtTask.run(t.id, p.id, t.content, t.isCompleted ? 1 : 0));
            stmtTask.finalize();

            const stmtNote = db.prepare("INSERT INTO research_notes (id, projectId, content, date, createdAt) VALUES (?, ?, ?, ?, ?)");
            if (p.researchNotes) p.researchNotes.forEach(n => stmtNote.run(n.id, p.id, n.content, n.date, n.createdAt));
            stmtNote.finalize();
        });

        res.json({ message: "Project synced" });
    });
});

// Convert Idea to Project (Idea Flow Path)
app.post('/api/ideas/:id/convert-to-project', authMiddleware, (req, res) => {
    const ideaId = req.params.id;
    const projectData = req.body;

    // First, get the idea to extract source info
    db.get("SELECT * FROM ideas WHERE id = ? AND userId = ?", [ideaId, req.userId], (err, idea) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!idea) return res.status(404).json({ error: 'Idea not found' });

        const projectId = 'proj-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const now = new Date().toISOString();

        // Create the project with source tracking
        const sqlP = `INSERT INTO projects (id, userId, name, description, status, startDate, dueDate, createdAt, sourceIdeaId, sourceIdeaTitle, sourceEngagementId, sourceEngagementName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const projectName = projectData.name || idea.title;
        const projectDescription = projectData.description || idea.description;
        const projectStatus = projectData.status || 'Not Started';
        const startDate = projectData.startDate || now.slice(0, 10);
        const dueDate = projectData.dueDate || '';

        db.run(sqlP, [
            projectId, req.userId, projectName, projectDescription, projectStatus,
            startDate, dueDate, now,
            idea.id, idea.title, idea.engagementId || null, idea.engagementName || null
        ], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Update the idea to mark it as converted
            db.run("UPDATE ideas SET convertedToProjectId = ?, status = 'Implemented' WHERE id = ? AND userId = ?",
                [projectId, ideaId, req.userId],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });

                    // Return the created project
                    res.json({
                        id: projectId,
                        name: projectName,
                        description: projectDescription,
                        status: projectStatus,
                        startDate: startDate,
                        dueDate: dueDate,
                        createdAt: now,
                        tasks: [],
                        researchNotes: [],
                        sourceIdeaId: idea.id,
                        sourceIdeaTitle: idea.title,
                        sourceEngagementId: idea.engagementId || null,
                        sourceEngagementName: idea.engagementName || null
                    });
                }
            );
        });
    });
});

app.delete('/api/projects/:id', authMiddleware, (req, res) => {
    // First verify ownership
    db.get("SELECT id FROM projects WHERE id = ? AND userId = ?", [req.params.id, req.userId], (err, project) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        db.serialize(() => {
            db.run("DELETE FROM project_tasks WHERE projectId = ?", req.params.id);
            db.run("DELETE FROM research_notes WHERE projectId = ?", req.params.id);
            db.run("DELETE FROM projects WHERE id = ? AND userId = ?", [req.params.id, req.userId], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ deleted: this.changes });
            });
        });
    });
});


// 4. Highlights
app.get('/api/highlights', authMiddleware, (req, res) => {
    db.all("SELECT * FROM highlights WHERE userId = ?", [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, needsFollowUp: !!r.needsFollowUp })));
    });
});
app.post('/api/highlights', authMiddleware, (req, res) => {
    const h = req.body;
    const sql = `INSERT OR REPLACE INTO highlights (id, userId, content, impact, date, needsFollowUp, followUpContext, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [h.id, req.userId, h.content, h.impact, h.date, h.needsFollowUp ? 1 : 0, h.followUpContext, h.createdAt], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});
app.delete('/api/highlights/:id', authMiddleware, (req, res) => {
    db.run("DELETE FROM highlights WHERE id = ? AND userId = ?", [req.params.id, req.userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// 5. Ideas
app.get('/api/ideas', authMiddleware, (req, res) => {
    db.all("SELECT * FROM ideas WHERE userId = ?", [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Parse entries JSON and migrate legacy descriptions
        const formatted = rows.map(r => {
            let entries = [];
            try {
                entries = JSON.parse(r.entries || '[]');
            } catch (e) {
                entries = [];
            }
            // Migrate legacy description to entries if entries is empty and description exists
            if (entries.length === 0 && r.description && r.description.trim()) {
                entries = [{
                    id: 'legacy-' + r.id,
                    content: r.description,
                    timestamp: r.createdAt || new Date().toISOString()
                }];
            }
            return { ...r, entries };
        });
        res.json(formatted);
    });
});
app.post('/api/ideas', authMiddleware, (req, res) => {
    const i = req.body;
    // Store entries as JSON string
    const entriesJson = JSON.stringify(i.entries || []);
    // Keep description as first entry content for backwards compatibility
    const description = i.entries && i.entries.length > 0 ? i.entries[0].content : (i.description || '');
    const sql = `INSERT OR REPLACE INTO ideas (id, userId, title, description, entries, category, priority, status, createdAt, updatedAt, aiSummary, lastSummaryDate, engagementId, engagementName, convertedToProjectId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [i.id, req.userId, i.title, description, entriesJson, i.category, i.priority, i.status, i.createdAt, i.updatedAt || null, i.aiSummary || null, i.lastSummaryDate || null, i.engagementId || null, i.engagementName || null, i.convertedToProjectId || null], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});
app.delete('/api/ideas/:id', authMiddleware, (req, res) => {
    db.run("DELETE FROM ideas WHERE id = ? AND userId = ?", [req.params.id, req.userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// 6. Calendar Events
app.get('/api/calendar', authMiddleware, (req, res) => {
    db.all("SELECT * FROM calendar_events WHERE userId = ?", [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, momSent: !!r.momSent })));
    });
});
app.post('/api/calendar', authMiddleware, (req, res) => {
    const e = req.body;
    const sql = `INSERT OR REPLACE INTO calendar_events (id, userId, title, description, date, startTime, endTime, type, meetingNotes, momSent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [e.id, req.userId, e.title, e.description, e.date, e.startTime, e.endTime, e.type, e.meetingNotes, e.momSent ? 1 : 0], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});
app.delete('/api/calendar/:id', authMiddleware, (req, res) => {
    db.run("DELETE FROM calendar_events WHERE id = ? AND userId = ?", [req.params.id, req.userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// 7. Links
app.get('/api/links', authMiddleware, (req, res) => {
    db.all("SELECT * FROM useful_links WHERE userId = ?", [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/links', authMiddleware, (req, res) => {
    const l = req.body;
    const sql = `INSERT OR REPLACE INTO useful_links (id, userId, title, url, category, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [l.id, req.userId, l.title, l.url, l.category, l.description, l.createdAt], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});
app.delete('/api/links/:id', authMiddleware, (req, res) => {
    db.run("DELETE FROM useful_links WHERE id = ? AND userId = ?", [req.params.id, req.userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// 8. Notes
app.get('/api/notes', authMiddleware, (req, res) => {
    db.all("SELECT * FROM notes WHERE userId = ?", [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const formatted = rows.map(r => ({
            ...r,
            tags: JSON.parse(r.tags || '[]')
        }));
        res.json(formatted);
    });
});
app.post('/api/notes', authMiddleware, (req, res) => {
    const n = req.body;
    const sql = `INSERT OR REPLACE INTO notes (id, userId, title, content, tags, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [n.id, req.userId, n.title, n.content, JSON.stringify(n.tags || []), n.createdAt, n.updatedAt], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});
app.delete('/api/notes/:id', authMiddleware, (req, res) => {
    db.run("DELETE FROM notes WHERE id = ? AND userId = ?", [req.params.id, req.userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// Settings - per-user settings using composite key
app.get('/api/settings/:key', authMiddleware, (req, res) => {
    const compositeKey = `${req.userId}:${req.params.key}`;
    db.get("SELECT value FROM settings WHERE key = ?", compositeKey, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row ? JSON.parse(row.value) : null);
    });
});
app.post('/api/settings/:key', authMiddleware, (req, res) => {
    const compositeKey = `${req.userId}:${req.params.key}`;
    const sql = "INSERT OR REPLACE INTO settings (key, value, userId) VALUES (?, ?, ?)";
    db.run(sql, [compositeKey, JSON.stringify(req.body), req.userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
