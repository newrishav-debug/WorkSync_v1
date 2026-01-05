
export enum EngagementStatus {
  Active = 'Active',
  OnHold = 'On Hold',
  Completed = 'Completed',
  AtRisk = 'At Risk'
}

export interface TimelineEntry {
  id: string;
  date: string; // ISO string
  content: string;
  type: 'update' | 'milestone' | 'issue' | 'meeting';
}

export interface EngagementFile {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  data: string; // Base64 Data URI
  uploadDate: string;
}

export interface Engagement {
  id: string;
  engagementNumber: string;
  orgId: string;
  accountName: string;
  name: string;
  status: EngagementStatus;
  timeline: TimelineEntry[];
  files: EngagementFile[];
  aiSummary: string | null;
  lastSummaryDate: string | null;
}

export interface Subtask {
  id: string;
  content: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  content: string;
  isCompleted: boolean;
  type: 'daily' | 'weekly';
  date: string; // ISO Date string (YYYY-MM-DD) for daily, or Start of Week Date for weekly
  createdAt: string;
  isPriority?: boolean;
  subtasks?: Subtask[];
  engagementId?: string;
  engagementName?: string;
  projectId?: string; // Reference to Internal Project
  projectName?: string; // Cached project name for display
}

// Added Highlight interface to resolve import errors
export interface Highlight {
  id: string;
  content: string;
  impact: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  needsFollowUp: boolean;
  followUpContext?: string;
  createdAt: string;
}

export type ProjectStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';

export interface ProjectTask {
  id: string;
  content: string;
  isCompleted: boolean;
}

export interface ResearchNote {
  id: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  content: string;
  createdAt: string;
}

export interface InternalProject {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  dueDate: string; // ISO Date string (YYYY-MM-DD)
  tasks: ProjectTask[];
  researchNotes: ResearchNote[];
  createdAt: string;
}

export type IdeaCategory = 'Team' | 'Product' | 'Process' | 'General';
export type IdeaPriority = 'Low' | 'Medium' | 'High';
export type IdeaStatus = 'New' | 'Planned' | 'In Progress' | 'Implemented' | 'Discarded';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  priority: IdeaPriority;
  status: IdeaStatus;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  startTime: string; // HH:mm (24h format)
  endTime: string; // HH:mm (24h format)
  type: 'meeting' | 'work' | 'personal';
  meetingNotes?: string;
  momSent?: boolean;
}

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  createdAt: string;
}

export type AppTab = 'home' | 'engagements' | 'tasks' | 'highlights' | 'projects' | 'ideas' | 'calendar' | 'links';
export type ViewState = 'dashboard' | 'detail';

export interface ViewStateData {
  tab: AppTab;
  view: ViewState;
  targetId?: string;
}
