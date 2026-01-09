import { Engagement, Task, Highlight, InternalProject, Idea, CalendarEvent, UsefulLink, AppTab, Note } from '../types';

const API_BASE = 'http://localhost:3002/api';

// --- Auth Types ---
export interface AuthUser {
    id: string;
    email: string;
    name: string;
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

// --- Auth Helper: Get token from localStorage ---
const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// --- Helper for API error handling ---
const handleResponse = async (res: Response, action: string) => {
    if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        // Try to parse as JSON to get error message
        let errorMessage = `Failed to ${action}`;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
        } catch {
            // If JSON parsing fails, use the raw error text
            if (errorText && errorText !== 'Unknown error') {
                errorMessage = `Failed to ${action}: ${errorText}`;
            }
        }
        throw new Error(errorMessage);
    }
    return res;
};

// --- Auth API Functions ---
export const loginAPI = async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    await handleResponse(res, 'login');
    return res.json();
};

export const registerAPI = async (name: string, email: string, password: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    await handleResponse(res, 'register');
};

export const getCurrentUserAPI = async (): Promise<AuthUser> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'get current user');
    return res.json();
};

// --- Engagements ---
export const fetchEngagements = async (): Promise<Engagement[]> => {
    const res = await fetch(`${API_BASE}/engagements`, {
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'fetch engagements');
    return res.json();
};

export const saveEngagementAPI = async (engagement: Engagement): Promise<void> => {
    const res = await fetch(`${API_BASE}/engagements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(engagement),
    });
    await handleResponse(res, 'save engagement');
};

export const deleteEngagementAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/engagements/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'delete engagement');
};

// --- Tasks ---
export const fetchTasks = async (): Promise<Task[]> => {
    const res = await fetch(`${API_BASE}/tasks`, {
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'fetch tasks');
    return res.json();
};

export const saveTaskAPI = async (task: Task): Promise<void> => {
    const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(task),
    });
    await handleResponse(res, 'save task');
};

export const deleteTaskAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'delete task');
};

// --- Highlights ---
export const fetchHighlights = async (): Promise<Highlight[]> => {
    const res = await fetch(`${API_BASE}/highlights`, {
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'fetch highlights');
    return res.json();
};

export const saveHighlightAPI = async (highlight: Highlight): Promise<void> => {
    const res = await fetch(`${API_BASE}/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(highlight),
    });
    await handleResponse(res, 'save highlight');
};

export const deleteHighlightAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/highlights/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'delete highlight');
};

// --- Projects ---
export const fetchProjects = async (): Promise<InternalProject[]> => {
    const res = await fetch(`${API_BASE}/projects`, {
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'fetch projects');
    return res.json();
};

export const saveProjectAPI = async (project: InternalProject): Promise<void> => {
    const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(project),
    });
    await handleResponse(res, 'save project');
};

export const deleteProjectAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'delete project');
};

// --- Ideas ---
export const fetchIdeas = async (): Promise<Idea[]> => {
    const res = await fetch(`${API_BASE}/ideas`, {
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'fetch ideas');
    return res.json();
};

export const saveIdeaAPI = async (idea: Idea): Promise<void> => {
    const res = await fetch(`${API_BASE}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(idea),
    });
    await handleResponse(res, 'save idea');
};

export const deleteIdeaAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/ideas/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'delete idea');
};

// Idea Flow Path: Convert idea to project
export const convertIdeaToProjectAPI = async (ideaId: string, projectData?: Partial<InternalProject>): Promise<InternalProject> => {
    const res = await fetch(`${API_BASE}/ideas/${ideaId}/convert-to-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(projectData || {}),
    });
    await handleResponse(res, 'convert idea to project');
    return res.json();
};

// --- Calendar Events ---
export const fetchCalendarEvents = async (): Promise<CalendarEvent[]> => {
    const res = await fetch(`${API_BASE}/calendar`, {
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'fetch calendar events');
    return res.json();
};

export const saveCalendarEventAPI = async (event: CalendarEvent): Promise<void> => {
    const res = await fetch(`${API_BASE}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(event),
    });
    await handleResponse(res, 'save calendar event');
};

export const deleteCalendarEventAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/calendar/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'delete calendar event');
};

// --- Useful Links ---
export const fetchUsefulLinks = async (): Promise<UsefulLink[]> => {
    const res = await fetch(`${API_BASE}/links`, {
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'fetch links');
    return res.json();
};

export const saveUsefulLinkAPI = async (link: UsefulLink): Promise<void> => {
    const res = await fetch(`${API_BASE}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(link),
    });
    await handleResponse(res, 'save link');
};

export const deleteUsefulLinkAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/links/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'delete link');
};

// --- Settings ---
const DEFAULT_TAB_ORDER: AppTab[] = ['home', 'engagements', 'calendar', 'tasks', 'highlights', 'projects', 'ideas', 'links', 'notes'];

export const fetchTabOrder = async (): Promise<AppTab[]> => {
    try {
        const res = await fetch(`${API_BASE}/settings/tabOrder`, {
            headers: { ...getAuthHeader() },
        });
        if (!res.ok) {
            return DEFAULT_TAB_ORDER;
        }
        const data = await res.json();
        if (!data || !Array.isArray(data)) {
            return DEFAULT_TAB_ORDER;
        }
        // Ensure all tabs are present (in case new tabs were added)
        const missingTabs = DEFAULT_TAB_ORDER.filter(tab => !data.includes(tab));
        return [...data, ...missingTabs];
    } catch {
        return DEFAULT_TAB_ORDER;
    }
};

export const saveTabOrderAPI = async (order: AppTab[]): Promise<void> => {
    const res = await fetch(`${API_BASE}/settings/tabOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(order),
    });
    await handleResponse(res, 'save tab order');
};

// --- Notes ---
export const fetchNotes = async (): Promise<Note[]> => {
    const res = await fetch(`${API_BASE}/notes`, {
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'fetch notes');
    return res.json();
};

export const saveNoteAPI = async (note: Note): Promise<void> => {
    const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(note),
    });
    await handleResponse(res, 'save note');
};

export const deleteNoteAPI = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    await handleResponse(res, 'delete note');
};
