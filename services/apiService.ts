import { Engagement, Task, Highlight, InternalProject, Idea, CalendarEvent, UsefulLink, AppTab, Note } from '../types';

const API_BASE = 'http://localhost:3002/api';

// --- Helper for API error handling ---
const handleResponse = async (res: Response, action: string) => {
    if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Failed to ${action}: ${errorText}`);
    }
    return res;
};

// --- Engagements ---
export const fetchEngagements = async (): Promise<Engagement[]> => {
    const res = await fetch(`${API_BASE}/engagements`);
    await handleResponse(res, 'fetch engagements');
    return res.json();
};

export const saveEngagementAPI = async (engagement: Engagement): Promise<void> => {
    const res = await fetch(`${API_BASE}/engagements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(engagement),
    });
    await handleResponse(res, 'save engagement');
};

export const deleteEngagementAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/engagements/${id}`, { method: 'DELETE' });
    await handleResponse(res, 'delete engagement');
};

// --- Tasks ---
export const fetchTasks = async (): Promise<Task[]> => {
    const res = await fetch(`${API_BASE}/tasks`);
    await handleResponse(res, 'fetch tasks');
    return res.json();
};

export const saveTaskAPI = async (task: Task): Promise<void> => {
    const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
    });
    await handleResponse(res, 'save task');
};

export const deleteTaskAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    await handleResponse(res, 'delete task');
};

// --- Highlights ---
export const fetchHighlights = async (): Promise<Highlight[]> => {
    const res = await fetch(`${API_BASE}/highlights`);
    await handleResponse(res, 'fetch highlights');
    return res.json();
};

export const saveHighlightAPI = async (highlight: Highlight): Promise<void> => {
    const res = await fetch(`${API_BASE}/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(highlight),
    });
    await handleResponse(res, 'save highlight');
};

export const deleteHighlightAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/highlights/${id}`, { method: 'DELETE' });
    await handleResponse(res, 'delete highlight');
};

// --- Projects ---
export const fetchProjects = async (): Promise<InternalProject[]> => {
    const res = await fetch(`${API_BASE}/projects`);
    await handleResponse(res, 'fetch projects');
    return res.json();
};

export const saveProjectAPI = async (project: InternalProject): Promise<void> => {
    const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
    });
    await handleResponse(res, 'save project');
};

export const deleteProjectAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    await handleResponse(res, 'delete project');
};

// --- Ideas ---
export const fetchIdeas = async (): Promise<Idea[]> => {
    const res = await fetch(`${API_BASE}/ideas`);
    await handleResponse(res, 'fetch ideas');
    return res.json();
};

export const saveIdeaAPI = async (idea: Idea): Promise<void> => {
    const res = await fetch(`${API_BASE}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idea),
    });
    await handleResponse(res, 'save idea');
};

export const deleteIdeaAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/ideas/${id}`, { method: 'DELETE' });
    await handleResponse(res, 'delete idea');
};

// --- Calendar Events ---
export const fetchCalendarEvents = async (): Promise<CalendarEvent[]> => {
    const res = await fetch(`${API_BASE}/calendar`);
    await handleResponse(res, 'fetch calendar events');
    return res.json();
};

export const saveCalendarEventAPI = async (event: CalendarEvent): Promise<void> => {
    const res = await fetch(`${API_BASE}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
    });
    await handleResponse(res, 'save calendar event');
};

export const deleteCalendarEventAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/calendar/${id}`, { method: 'DELETE' });
    await handleResponse(res, 'delete calendar event');
};

// --- Useful Links ---
export const fetchUsefulLinks = async (): Promise<UsefulLink[]> => {
    const res = await fetch(`${API_BASE}/links`);
    await handleResponse(res, 'fetch links');
    return res.json();
};

export const saveUsefulLinkAPI = async (link: UsefulLink): Promise<void> => {
    const res = await fetch(`${API_BASE}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(link),
    });
    await handleResponse(res, 'save link');
};

export const deleteUsefulLinkAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/links/${id}`, { method: 'DELETE' });
    await handleResponse(res, 'delete link');
};

// --- Settings ---
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
    const res = await fetch(`${API_BASE}/settings/tabOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
    await handleResponse(res, 'save tab order');
};

// --- Notes ---
export const fetchNotes = async (): Promise<Note[]> => {
    const res = await fetch(`${API_BASE}/notes`);
    await handleResponse(res, 'fetch notes');
    return res.json();
};

export const saveNoteAPI = async (note: Note): Promise<void> => {
    const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
    });
    await handleResponse(res, 'save note');
};

export const deleteNoteAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    await handleResponse(res, 'delete note');
};
