import { Engagement, Task, Highlight, InternalProject, Idea, CalendarEvent, UsefulLink, AppTab } from '../types';

const API_BASE = 'http://localhost:3001/api';

// --- Helper for formatting dates ---
// SQLite returns ISO strings, which is what our types expect mostly.
// But legacy logic might expect Date objects in some places or strict strings.
// For now, simple fetch is enough.

export const fetchEngagements = async (): Promise<Engagement[]> => {
    const res = await fetch(`${API_BASE}/engagements`);
    if (!res.ok) throw new Error('Failed to fetch engagements');
    return res.json();
};

export const saveEngagementAPI = async (engagement: Engagement): Promise<void> => {
    await fetch(`${API_BASE}/engagements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(engagement),
    });
};

export const deleteEngagementAPI = async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/engagements/${id}`, { method: 'DELETE' });
};

export const fetchTasks = async (): Promise<Task[]> => {
    const res = await fetch(`${API_BASE}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
};

export const saveTaskAPI = async (task: Task): Promise<void> => {
    await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
    });
};

export const deleteTaskAPI = async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
};


export const fetchHighlights = async (): Promise<Highlight[]> => {
    const res = await fetch(`${API_BASE}/highlights`);
    return res.json();
};

export const saveHighlightAPI = async (highlight: Highlight): Promise<void> => {
    await fetch(`${API_BASE}/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(highlight),
    });
};

export const deleteHighlightAPI = async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/highlights/${id}`, { method: 'DELETE' });
};

export const fetchProjects = async (): Promise<InternalProject[]> => {
    const res = await fetch(`${API_BASE}/projects`);
    return res.json();
};

export const saveProjectAPI = async (project: InternalProject): Promise<void> => {
    await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
    });
};

export const deleteProjectAPI = async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
};

export const fetchIdeas = async (): Promise<Idea[]> => {
    const res = await fetch(`${API_BASE}/ideas`);
    return res.json();
};

export const saveIdeaAPI = async (idea: Idea): Promise<void> => {
    await fetch(`${API_BASE}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idea),
    });
};

export const deleteIdeaAPI = async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/ideas/${id}`, { method: 'DELETE' });
};

export const fetchCalendarEvents = async (): Promise<CalendarEvent[]> => {
    const res = await fetch(`${API_BASE}/calendar`);
    return res.json();
};

export const saveCalendarEventAPI = async (event: CalendarEvent): Promise<void> => {
    await fetch(`${API_BASE}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
    });
};

export const deleteCalendarEventAPI = async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/calendar/${id}`, { method: 'DELETE' });
};

export const fetchUsefulLinks = async (): Promise<UsefulLink[]> => {
    const res = await fetch(`${API_BASE}/links`);
    return res.json();
};

export const saveUsefulLinkAPI = async (link: UsefulLink): Promise<void> => {
    await fetch(`${API_BASE}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(link),
    });
};

export const deleteUsefulLinkAPI = async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/links/${id}`, { method: 'DELETE' });
};

export const fetchTabOrder = async (): Promise<AppTab[]> => {
    try {
        const res = await fetch(`${API_BASE}/settings/tabOrder`);
        const data = await res.json();
        return data || ['home', 'engagements', 'calendar', 'tasks', 'highlights', 'projects', 'ideas', 'links'];
    } catch {
        return ['home', 'engagements', 'calendar', 'tasks', 'highlights', 'projects', 'ideas', 'links'];
    }
};

export const saveTabOrderAPI = async (order: AppTab[]): Promise<void> => {
    await fetch(`${API_BASE}/settings/tabOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
};
