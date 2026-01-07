import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './database.js';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- API Endpoints ---

// 1. Engagements
app.get('/api/engagements', (req, res) => {
    db.all("SELECT * FROM engagements", [], (err, rows) => {
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

app.post('/api/engagements', (req, res) => {
    const e = req.body;
    const sql = `INSERT OR REPLACE INTO engagements 
    (id, engagementNumber, orgId, accountName, name, status, timeline, files, aiSummary, lastSummaryDate) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        e.id, e.engagementNumber, e.orgId, e.accountName, e.name, e.status,
        JSON.stringify(e.timeline || []), JSON.stringify(e.files || []), e.aiSummary, e.lastSummaryDate
    ];
    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved", changes: this.changes });
    });
});

app.delete('/api/engagements/:id', (req, res) => {
    db.run("DELETE FROM engagements WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// 2. Tasks (Standard)
app.get('/api/tasks', (req, res) => {
    db.all("SELECT * FROM tasks", [], (err, rows) => {
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

app.post('/api/tasks', (req, res) => {
    const t = req.body;
    const sql = `INSERT OR REPLACE INTO tasks (id, content, isCompleted, type, date, createdAt, isPriority, subtasks, engagementId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [t.id, t.content, t.isCompleted ? 1 : 0, t.type, t.date, t.createdAt, t.isPriority ? 1 : 0, JSON.stringify(t.subtasks || []), t.engagementId];
    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    db.run("DELETE FROM tasks WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// 3. Projects (Internal)
// We need to fetch projects AND their sub-resources (tasks, notes)
app.get('/api/projects', (req, res) => {
    const sqlProjects = "SELECT * FROM projects";
    const sqlTasks = "SELECT * FROM project_tasks";
    const sqlNotes = "SELECT * FROM research_notes";

    db.all(sqlProjects, [], (err, projects) => {
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

app.post('/api/projects', (req, res) => {
    const p = req.body;
    // Save Project
    const sqlP = `INSERT OR REPLACE INTO projects (id, name, description, status, startDate, dueDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sqlP, [p.id, p.name, p.description, p.status, p.startDate, p.dueDate, p.createdAt], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // We assume separate endpoints for saving project tasks/notes, OR we can sync them here.
        // For simplicity, let's just save the main project fields here. 
        // The frontend currently saves whole objects, so we should probably sync children too.
        // BUT, simplistic SQL sync is hard (delete orphans?). 
        // Let's rely on granular endpoints for robust apps, but for this migration let's just supporting "saving the project" assuming tasks are saved via separate calls or we implement a bulk sync?

        // actually, let's do a naive delete-insert for children since it's a migration from localstorage "save whole blob"

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

app.delete('/api/projects/:id', (req, res) => {
    db.serialize(() => {
        db.run("DELETE FROM project_tasks WHERE projectId = ?", req.params.id);
        db.run("DELETE FROM research_notes WHERE projectId = ?", req.params.id);
        db.run("DELETE FROM projects WHERE id = ?", req.params.id, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ deleted: this.changes });
        });
    });
});


// 4. Highlights
app.get('/api/highlights', (req, res) => {
    db.all("SELECT * FROM highlights", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, needsFollowUp: !!r.needsFollowUp })));
    });
});
app.post('/api/highlights', (req, res) => {
    const h = req.body;
    const sql = `INSERT OR REPLACE INTO highlights (id, content, impact, date, needsFollowUp, followUpContext, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [h.id, h.content, h.impact, h.date, h.needsFollowUp ? 1 : 0, h.followUpContext, h.createdAt], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});
app.delete('/api/highlights/:id', (req, res) => {
    db.run("DELETE FROM highlights WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// 5. Ideas
app.get('/api/ideas', (req, res) => {
    db.all("SELECT * FROM ideas", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/ideas', (req, res) => {
    const i = req.body;
    const sql = `INSERT OR REPLACE INTO ideas (id, title, description, category, priority, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [i.id, i.title, i.description, i.category, i.priority, i.status, i.createdAt], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});
app.delete('/api/ideas/:id', (req, res) => {
    db.run("DELETE FROM ideas WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// 6. Calendar Events
app.get('/api/calendar', (req, res) => {
    db.all("SELECT * FROM calendar_events", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, momSent: !!r.momSent })));
    });
});
app.post('/api/calendar', (req, res) => {
    const e = req.body;
    const sql = `INSERT OR REPLACE INTO calendar_events (id, title, description, date, startTime, endTime, type, meetingNotes, momSent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [e.id, e.title, e.description, e.date, e.startTime, e.endTime, e.type, e.meetingNotes, e.momSent ? 1 : 0], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});
app.delete('/api/calendar/:id', (req, res) => {
    db.run("DELETE FROM calendar_events WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// 7. Links
app.get('/api/links', (req, res) => {
    db.all("SELECT * FROM useful_links", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/links', (req, res) => {
    const l = req.body;
    const sql = `INSERT OR REPLACE INTO useful_links (id, title, url, category, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [l.id, l.title, l.url, l.category, l.description, l.createdAt], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});
app.delete('/api/links/:id', (req, res) => {
    db.run("DELETE FROM useful_links WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// 8. Notes
app.get('/api/notes', (req, res) => {
    db.all("SELECT * FROM notes", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const formatted = rows.map(r => ({
            ...r,
            tags: JSON.parse(r.tags || '[]')
        }));
        res.json(formatted);
    });
});
app.post('/api/notes', (req, res) => {
    const n = req.body;
    const sql = `INSERT OR REPLACE INTO notes (id, title, content, tags, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [n.id, n.title, n.content, JSON.stringify(n.tags || []), n.createdAt, n.updatedAt], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});
app.delete('/api/notes/:id', (req, res) => {
    db.run("DELETE FROM notes WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// Tab Order (Simple key-value store in a persistent config table, or just json file. 
// For now, let's just make a simple key-value table if we want to be pure DB, 
// OR just keep using localstorage for UI prefs like tab order? 
// The prompt said "backend database for this app", usually implies business data. 
// UI state like tab order is fine in localstorage, but let's be thorough and add a KV table.)
// ... actually, looking at the code, saveTabOrder IS a business requirement for user customization.
// Let's add a 'settings' table.
db.run("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)");

app.get('/api/settings/:key', (req, res) => {
    db.get("SELECT value FROM settings WHERE key = ?", req.params.key, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row ? JSON.parse(row.value) : null);
    });
});
app.post('/api/settings/:key', (req, res) => {
    const sql = "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)";
    db.run(sql, [req.params.key, JSON.stringify(req.body)], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved" });
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
