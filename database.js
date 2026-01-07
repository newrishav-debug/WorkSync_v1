import sqlite3Pkg from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const sqlite3 = sqlite3Pkg.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database.');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    // 1. Engagements Table
    db.run(`CREATE TABLE IF NOT EXISTS engagements (
      id TEXT PRIMARY KEY,
      engagementNumber TEXT,
      orgId TEXT,
      accountName TEXT,
      name TEXT,
      status TEXT,
      timeline TEXT, -- JSON
      files TEXT, -- JSON
      aiSummary TEXT,
      lastSummaryDate TEXT
    )`);

    // 2. Tasks Table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      content TEXT,
      isCompleted INTEGER,
      type TEXT,
      date TEXT,
      createdAt TEXT,
      isPriority INTEGER,
      engagementId TEXT,
      projectId TEXT,
      subtasks TEXT
    )`);

    // 3. Projects Table
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      status TEXT,
      startDate TEXT,
      dueDate TEXT,
      createdAt TEXT
    )`);

    // 4. Project Tasks Table
    db.run(`CREATE TABLE IF NOT EXISTS project_tasks (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      content TEXT,
      isCompleted INTEGER,
      FOREIGN KEY(projectId) REFERENCES projects(id)
    )`);

    // 5. Research Notes Table
    db.run(`CREATE TABLE IF NOT EXISTS research_notes (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      content TEXT,
      date TEXT,
      createdAt TEXT,
      FOREIGN KEY(projectId) REFERENCES projects(id)
    )`);

    // 6. Highlights Table
    db.run(`CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY,
      content TEXT,
      impact TEXT,
      date TEXT,
      needsFollowUp INTEGER,
      followUpContext TEXT,
      createdAt TEXT
    )`);

    // 7. Ideas Table
    db.run(`CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      category TEXT,
      priority TEXT,
      status TEXT,
      createdAt TEXT
    )`);

    // 8. Calendar Events Table
    db.run(`CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      date TEXT,
      startTime TEXT,
      endTime TEXT,
      type TEXT,
      meetingNotes TEXT,
      momSent INTEGER
    )`);

    // 9. Useful Links Table
    db.run(`CREATE TABLE IF NOT EXISTS useful_links (
      id TEXT PRIMARY KEY,
      title TEXT,
      url TEXT,
      category TEXT,
      description TEXT,
      createdAt TEXT
    )`);

    // 10. Notes Table
    db.run(`CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      tags TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )`);

    // Seed Data if Engagements is empty
    db.get("SELECT count(*) as count FROM engagements", (err, row) => {
      if (err) console.error(err);
      if (row.count === 0) {
        console.log("Database empty. Seeding data...");
        seedDatabase();
      }
    });
  });
}

function seedDatabase() {
  // We need to replicate the mock data generation logic from storageService.ts
  // For simplicity, we'll hardcode the generation here since we can't easily import TS into JS node script without compilation.

  const getShiftedDateTime = (days, hour, minute) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const getShiftedDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const now = new Date().toISOString();

  // --- 1. Engagements ---
  const engagements = [
    {
      id: 'e-101',
      engagementNumber: 'ENG-2024-001',
      orgId: 'ORG-TFS',
      accountName: 'TechFlow Systems',
      name: 'AI Implementation Strategy',
      status: 'Active',
      timeline: JSON.stringify([
        { id: 't-1', date: getShiftedDateTime(0, 14, 30), content: 'Presented Phase 1 findings...', type: 'meeting' },
        { id: 't-2', date: getShiftedDateTime(-2, 10, 0), content: 'Completed data readiness assessment.', type: 'milestone' },
        { id: 't-3', date: getShiftedDateTime(-10, 9, 0), content: 'Project Kickoff meeting.', type: 'update' }
      ]),
      files: JSON.stringify([]),
      aiSummary: 'Engagement is progressing well...',
      lastSummaryDate: getShiftedDateTime(0, 15, 0)
    },
    {
      id: 'e-102',
      engagementNumber: 'ENG-2024-004',
      orgId: 'ORG-NSB',
      accountName: 'NorthStar Bank',
      name: 'Legacy System Upgrade',
      status: 'At Risk',
      timeline: JSON.stringify([
        { id: 't-4', date: getShiftedDateTime(-1, 9, 0), content: 'Critical Issue: Firewall rules...', type: 'issue' },
        { id: 't-5', date: getShiftedDateTime(-5, 11, 0), content: 'Deployment scheduled...', type: 'update' }
      ]),
      files: JSON.stringify([]),
      aiSummary: 'Project is currently At Risk...',
      lastSummaryDate: getShiftedDateTime(-1, 10, 0)
    },
    {
      id: 'e-103',
      engagementNumber: 'ENG-2023-089',
      orgId: 'ORG-GEC',
      accountName: 'GreenEnergy Corp',
      name: 'Sustainability Dashboard',
      status: 'Completed',
      timeline: JSON.stringify([
        { id: 't-6', date: getShiftedDateTime(-20, 16, 0), content: 'Final sign-off received.', type: 'milestone' },
        { id: 't-7', date: getShiftedDateTime(-25, 10, 0), content: 'UAT Completed successfully.', type: 'update' }
      ]),
      files: JSON.stringify([]),
      aiSummary: 'Project successfully completed...',
      lastSummaryDate: getShiftedDateTime(-20, 17, 0)
    }
  ];

  const stmtEng = db.prepare("INSERT INTO engagements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  engagements.forEach(e => {
    stmtEng.run(e.id, e.engagementNumber, e.orgId, e.accountName, e.name, e.status, e.timeline, e.files, e.aiSummary, e.lastSummaryDate);
  });
  stmtEng.finalize();

  // --- 2. Tasks ---
  const today = new Date().toISOString().slice(0, 10);
  const tasks = [
    {
      id: 'task-1',
      content: 'Review Q3 financial reports',
      isCompleted: 0,
      type: 'daily',
      date: today,
      createdAt: now,
      isPriority: 1,
      subtasks: JSON.stringify([{ id: 'st-1', content: 'Check variance', isCompleted: false }, { id: 'st-2', content: 'Format slides', isCompleted: false }])
    },
    { id: 'task-2', content: 'Email update to NorthStar', isCompleted: 1, type: 'daily', date: today, createdAt: now, isPriority: 1, subtasks: '[]' },
    { id: 'task-3', content: 'Weekly team sync prep', isCompleted: 0, type: 'daily', date: today, createdAt: now, isPriority: 0, subtasks: '[]' }
  ];

  const stmtTask = db.prepare("INSERT INTO tasks (id, content, isCompleted, type, date, createdAt, isPriority, subtasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  tasks.forEach(t => {
    stmtTask.run(t.id, t.content, t.isCompleted, t.type, t.date, t.createdAt, t.isPriority, t.subtasks);
  });
  stmtTask.finalize();

  // --- 3. Projects ---
  const projects = [
    { id: 'p-1', name: 'Certification: AWS SA', description: 'Study for exam', status: 'In Progress', startDate: getShiftedDate(-10), dueDate: getShiftedDate(20), createdAt: now },
    { id: 'p-2', name: 'Internal Dev Tools', description: 'Upgrade CLI', status: 'Not Started', startDate: getShiftedDate(5), dueDate: getShiftedDate(30), createdAt: now }
  ];
  const stmtProj = db.prepare("INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?, ?)");
  projects.forEach(p => stmtProj.run(p.id, p.name, p.description, p.status, p.startDate, p.dueDate, p.createdAt));
  stmtProj.finalize();

  // --- 4. Project Tasks ---
  const pTasks = [
    { id: 'pt-1', projectId: 'p-1', content: 'Complete Section 1-4', isCompleted: 1 },
    { id: 'pt-2', projectId: 'p-1', content: 'Take practice exam 1', isCompleted: 0 },
    { id: 'pt-4', projectId: 'p-2', content: 'Survey team', isCompleted: 0 }
  ];
  const stmtPTask = db.prepare("INSERT INTO project_tasks VALUES (?, ?, ?, ?)");
  pTasks.forEach(pt => stmtPTask.run(pt.id, pt.projectId, pt.content, pt.isCompleted));
  stmtPTask.finalize();

  // --- 5. Research Notes ---
  const notes = [
    { id: 'rn-1', projectId: 'p-1', content: 'S3 consistency model changed...', date: getShiftedDate(-2), createdAt: now },
    { id: 'rn-2', projectId: 'p-1', content: 'Focus on VPC networking...', date: getShiftedDate(-5), createdAt: now }
  ];
  const stmtNote = db.prepare("INSERT INTO research_notes VALUES (?, ?, ?, ?, ?)");
  notes.forEach(n => stmtNote.run(n.id, n.projectId, n.content, n.date, n.createdAt));
  stmtNote.finalize();

  // --- 6. Highlights ---
  const highlights = [
    { id: 'h-1', content: 'Solved caching latency...', impact: 'High impact.', date: getShiftedDate(0), needsFollowUp: 0, followUpContext: '', createdAt: now },
    { id: 'h-2', content: 'Led sprint retro...', impact: 'Team morale boosted.', date: getShiftedDate(-2), needsFollowUp: 1, followUpContext: 'Schedule Jira session.', createdAt: now }
  ];
  const stmtHi = db.prepare("INSERT INTO highlights VALUES (?, ?, ?, ?, ?, ?, ?)");
  highlights.forEach(h => stmtHi.run(h.id, h.content, h.impact, h.date, h.needsFollowUp, h.followUpContext, h.createdAt));
  stmtHi.finalize();

  // --- 7. Ideas ---
  const ideas = [
    { id: 'idea-1', title: 'Automated Status Tool', description: 'Script for Jira...', category: 'Process', priority: 'High', status: 'New', createdAt: now },
    { id: 'idea-2', title: 'Friday Lunch & Learn', description: 'Team rotation...', category: 'Team', priority: 'Medium', status: 'Planned', createdAt: now }
  ];
  const stmtIdea = db.prepare("INSERT INTO ideas VALUES (?, ?, ?, ?, ?, ?, ?)");
  ideas.forEach(i => stmtIdea.run(i.id, i.title, i.description, i.category, i.priority, i.status, i.createdAt));
  stmtIdea.finalize();

  // --- 8. Calendar Events ---
  const events = [
    { id: 'ce-1', title: 'Client Sync', description: 'Weekly update', date: getShiftedDate(0), startTime: '10:00', endTime: '11:00', type: 'meeting', notes: '', mom: 0 },
    { id: 'ce-2', title: 'Focus Time', description: 'Deep work', date: getShiftedDate(0), startTime: '14:00', endTime: '16:00', type: 'work', notes: '', mom: 0 }
  ];
  const stmtEvent = db.prepare("INSERT INTO calendar_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  events.forEach(ev => stmtEvent.run(ev.id, ev.title, ev.description, ev.date, ev.startTime, ev.endTime, ev.type, ev.notes, ev.mom));
  stmtEvent.finalize();

  // --- 9. Links ---
  const links = [
    { id: 'l-1', title: 'HR Portal', url: 'https://google.com', category: 'Company', description: 'Payroll', createdAt: now },
    { id: 'l-2', title: 'Jira', url: 'https://atlassian.com', category: 'Tools', description: 'Tracking', createdAt: now }
  ];
  const stmtLink = db.prepare("INSERT INTO useful_links VALUES (?, ?, ?, ?, ?, ?)");
  links.forEach(l => stmtLink.run(l.id, l.title, l.url, l.category, l.description, l.createdAt));
  stmtLink.finalize();

  console.log("Database seeded successfully.");
}

export default db;
