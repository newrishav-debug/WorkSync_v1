import { Engagement, EngagementStatus, Task, Highlight, InternalProject, Idea, CalendarEvent, ProjectStatus, UsefulLink, AppTab } from '../types';

const ENGAGEMENT_STORAGE_KEY = 'engagetrack_data_v1';
const TASK_STORAGE_KEY = 'engagetrack_tasks_v1';
const HIGHLIGHT_STORAGE_KEY = 'engagetrack_highlights_v1';
const PROJECT_STORAGE_KEY = 'engagetrack_projects_v1';
const IDEA_STORAGE_KEY = 'engagetrack_ideas_v1';
const CALENDAR_STORAGE_KEY = 'engagetrack_calendar_v1';
const LINKS_STORAGE_KEY = 'engagetrack_links_v1';
const TAB_ORDER_STORAGE_KEY = 'engagetrack_tab_order_v1';

// --- Helper Utilities for Mock Data ---
const getTodayISO = () => new Date().toISOString().slice(0, 10);
const getShiftedDateISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const getShiftedDateTimeISO = (days: number, hour: number, minute: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const DEFAULT_TAB_ORDER: AppTab[] = ['home', 'engagements', 'calendar', 'tasks', 'highlights', 'projects', 'ideas', 'links'];

// --- Storage Functions ---

export const getTabOrder = (): AppTab[] => {
  try {
    const data = localStorage.getItem(TAB_ORDER_STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_TAB_ORDER;
  } catch {
    return DEFAULT_TAB_ORDER;
  }
};

export const saveTabOrder = (order: AppTab[]): void => {
  localStorage.setItem(TAB_ORDER_STORAGE_KEY, JSON.stringify(order));
};

export const getEngagements = (): Engagement[] => {
  try {
    const data = localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.map((e: any) => ({
        ...e,
        files: e.files || []
      }));
    }
    const mocks = generateMockEngagements();
    saveEngagements(mocks); 
    return mocks;
  } catch (e) {
    console.error("Failed to load engagement data", e);
    return [];
  }
};

export const saveEngagements = (engagements: Engagement[]): void => {
  try {
    localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(engagements));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      alert("Storage Limit Exceeded! \n\nYour browser's local storage is full. Please delete some files or engagements.");
    }
    console.error("Failed to save engagement data", e);
  }
};

export const getTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(TASK_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    const mocks = generateMockTasks();
    saveTasks(mocks);
    return mocks;
  } catch (e) {
    console.error("Failed to load task data", e);
    return [];
  }
};

export const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to save task data", e);
  }
};

export const getHighlights = (): Highlight[] => {
  try {
    const data = localStorage.getItem(HIGHLIGHT_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    const mocks = generateMockHighlights();
    saveHighlights(mocks);
    return mocks;
  } catch (e) {
    console.error("Failed to load highlights data", e);
    return [];
  }
};

export const saveHighlights = (highlights: Highlight[]): void => {
  try {
    localStorage.setItem(HIGHLIGHT_STORAGE_KEY, JSON.stringify(highlights));
  } catch (e) {
    console.error("Failed to save highlights data", e);
  }
};

export const getInternalProjects = (): InternalProject[] => {
  try {
    const data = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.map((p: any) => ({
        ...p,
        tasks: p.tasks || [],
        researchNotes: p.researchNotes || []
      }));
    }
    const mocks = generateMockProjects();
    saveInternalProjects(mocks);
    return mocks;
  } catch (e) {
    console.error("Failed to load projects data", e);
    return [];
  }
};

export const saveInternalProjects = (projects: InternalProject[]): void => {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to save projects data", e);
  }
};

export const getIdeas = (): Idea[] => {
  try {
    const data = localStorage.getItem(IDEA_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    const mocks = generateMockIdeas();
    saveIdeas(mocks);
    return mocks;
  } catch (e) {
    console.error("Failed to load ideas data", e);
    return [];
  }
};

export const saveIdeas = (ideas: Idea[]): void => {
  try {
    localStorage.setItem(IDEA_STORAGE_KEY, JSON.stringify(ideas));
  } catch (e) {
    console.error("Failed to save ideas data", e);
  }
};

export const getCalendarEvents = (): CalendarEvent[] => {
  try {
    const data = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    const mocks = generateMockCalendarEvents();
    saveCalendarEvents(mocks);
    return mocks;
  } catch (e) {
    console.error("Failed to load calendar events", e);
    return [];
  }
};

export const saveCalendarEvents = (events: CalendarEvent[]): void => {
  try {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error("Failed to save calendar events", e);
  }
};

export const getUsefulLinks = (): UsefulLink[] => {
  try {
    const data = localStorage.getItem(LINKS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    const mocks = generateMockLinks();
    saveUsefulLinks(mocks);
    return mocks;
  } catch (e) {
    console.error("Failed to load links", e);
    return [];
  }
};

export const saveUsefulLinks = (links: UsefulLink[]): void => {
  try {
    localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
  } catch (e) {
    console.error("Failed to save links", e);
  }
};

// --- Mock Data Generators ---

const generateMockEngagements = (): Engagement[] => {
  return [
    {
      id: 'e-101',
      engagementNumber: 'ENG-2024-001',
      orgId: 'ORG-TFS',
      accountName: 'TechFlow Systems',
      name: 'AI Implementation Strategy',
      status: EngagementStatus.Active,
      timeline: [
        { 
          id: 't-1', 
          date: getShiftedDateTimeISO(0, 14, 30), 
          content: 'Presented Phase 1 findings to the steering committee. Feedback was positive, approved to proceed to Phase 2.', 
          type: 'meeting' 
        },
        { 
          id: 't-2', 
          date: getShiftedDateTimeISO(-2, 10, 0), 
          content: 'Completed data readiness assessment.', 
          type: 'milestone' 
        },
        { 
          id: 't-3', 
          date: getShiftedDateTimeISO(-10, 9, 0), 
          content: 'Project Kickoff meeting.', 
          type: 'update' 
        }
      ],
      files: [],
      aiSummary: 'Engagement is progressing well. Phase 1 assessment is complete and Phase 2 has been approved by the steering committee.',
      lastSummaryDate: getShiftedDateTimeISO(0, 15, 0)
    },
    {
      id: 'e-102',
      engagementNumber: 'ENG-2024-004',
      orgId: 'ORG-NSB',
      accountName: 'NorthStar Bank',
      name: 'Legacy System Upgrade',
      status: EngagementStatus.AtRisk,
      timeline: [
        { 
          id: 't-4', 
          date: getShiftedDateTimeISO(-1, 9, 0), 
          content: 'Critical Issue: Client firewall rules are blocking the deployment pipeline. Escalated to IT security.', 
          type: 'issue' 
        },
        { 
          id: 't-5', 
          date: getShiftedDateTimeISO(-5, 11, 0), 
          content: 'Deployment scheduled for next weekend.', 
          type: 'update' 
        }
      ],
      files: [],
      aiSummary: 'Project is currently At Risk due to firewall blocking issues preventing deployment. Immediate escalation to IT security is required.',
      lastSummaryDate: getShiftedDateTimeISO(-1, 10, 0)
    },
    {
      id: 'e-103',
      engagementNumber: 'ENG-2023-089',
      orgId: 'ORG-GEC',
      accountName: 'GreenEnergy Corp',
      name: 'Sustainability Dashboard',
      status: EngagementStatus.Completed,
      timeline: [
        { id: 't-6', date: getShiftedDateTimeISO(-20, 16, 0), content: 'Final sign-off received.', type: 'milestone' },
        { id: 't-7', date: getShiftedDateTimeISO(-25, 10, 0), content: 'UAT Completed successfully.', type: 'update' }
      ],
      files: [],
      aiSummary: 'Project successfully completed and signed off.',
      lastSummaryDate: getShiftedDateTimeISO(-20, 17, 0)
    },
    {
      id: 'e-104',
      engagementNumber: 'ENG-2024-012',
      orgId: 'ORG-ACM',
      accountName: 'Acme Logistics',
      name: 'Supply Chain Optimization',
      status: EngagementStatus.Active,
      timeline: [
         { id: 't-8', date: getShiftedDateTimeISO(-3, 13, 0), content: 'Interviewed logistics managers for requirements gathering.', type: 'update' }
      ],
      files: [],
      aiSummary: null,
      lastSummaryDate: null
    }
  ];
};

const generateMockTasks = (): Task[] => {
  const today = getTodayISO();
  const startOfWeek = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const date = new Date(d.setDate(diff));
    return date.toISOString().slice(0, 10);
  })();

  return [
    {
      id: 'task-1',
      content: 'Review Q3 financial reports for TechFlow',
      isCompleted: false,
      type: 'daily',
      date: today,
      createdAt: new Date().toISOString(),
      isPriority: true,
      subtasks: [
        { id: 'st-1', content: 'Check variance analysis', isCompleted: false },
        { id: 'st-2', content: 'Format summary slides', isCompleted: false }
      ]
    },
    {
      id: 'task-2',
      content: 'Email update to NorthStar Bank regarding firewall issue',
      isCompleted: true,
      type: 'daily',
      date: today,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isPriority: true
    },
    {
      id: 'task-3',
      content: 'Weekly team sync preparation',
      isCompleted: false,
      type: 'daily',
      date: today,
      createdAt: new Date().toISOString(),
      isPriority: false
    },
    {
      id: 'task-4',
      content: 'Complete AWS Cloud Practitioner certification course',
      isCompleted: false,
      type: 'weekly',
      date: startOfWeek,
      createdAt: new Date().toISOString(),
      isPriority: true
    },
    {
      id: 'task-5',
      content: 'Update internal knowledge base with new deployment protocols',
      isCompleted: false,
      type: 'weekly',
      date: startOfWeek,
      createdAt: new Date().toISOString(),
      isPriority: false
    }
  ];
};

const generateMockHighlights = (): Highlight[] => {
  return [
    {
      id: 'h-1',
      content: 'Solved a complex caching latency issue on the TechFlow API, improving response times by 40%.',
      impact: 'Client CTO expressed appreciation directly. Improves user experience significantly.',
      date: getShiftedDateISO(0),
      needsFollowUp: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'h-2',
      content: 'Led the sprint retrospective meeting effectively, identifying 3 key process improvements.',
      impact: 'Team morale boosted, clearer path for next sprint.',
      date: getShiftedDateISO(-2),
      needsFollowUp: true,
      followUpContext: 'Schedule session to implement the new Jira workflow.',
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 'h-3',
      content: 'Completed the GreenEnergy dashboard project ahead of schedule.',
      impact: 'Client signed up for a follow-up maintenance contract immediately.',
      date: getShiftedDateISO(-15),
      needsFollowUp: false,
      createdAt: new Date(Date.now() - 1296000000).toISOString()
    }
  ];
};

const generateMockProjects = (): InternalProject[] => {
  return [
    {
      id: 'p-1',
      name: 'Certification: AWS Solutions Architect',
      description: 'Study and pass the SAA-C03 exam to improve cloud architecture skills.',
      status: 'In Progress',
      startDate: getShiftedDateISO(-10),
      dueDate: getShiftedDateISO(20),
      tasks: [
        { id: 'pt-1', content: 'Complete Section 1-4 of video course', isCompleted: true },
        { id: 'pt-2', content: 'Take practice exam 1', isCompleted: false },
        { id: 'pt-3', content: 'Review whitepapers', isCompleted: false }
      ],
      researchNotes: [
        { id: 'rn-1', date: getShiftedDateISO(-2), content: 'S3 consistency model has changed. Read updated docs.', createdAt: new Date().toISOString() },
        { id: 'rn-2', date: getShiftedDateISO(-5), content: 'Focus on VPC networking, got some questions wrong in quiz.', createdAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'p-2',
      name: 'Internal Dev Tools Upgrade',
      description: 'Audit and upgrade the CLI tools used by the development team.',
      status: 'Not Started',
      startDate: getShiftedDateISO(5),
      dueDate: getShiftedDateISO(30),
      tasks: [
        { id: 'pt-4', content: 'Survey team for pain points', isCompleted: false }
      ],
      researchNotes: [],
      createdAt: new Date().toISOString()
    }
  ];
};

const generateMockIdeas = (): Idea[] => {
  return [
    {
      id: 'idea-1',
      title: 'Automated Status Reporting Tool',
      description: 'Build a script that pulls Jira data and formats it into a weekly email draft for clients. Would save 2 hours per week.',
      category: 'Process',
      priority: 'High',
      status: 'New',
      createdAt: new Date().toISOString()
    },
    {
      id: 'idea-2',
      title: 'Friday "Lunch & Learn" Sessions',
      description: 'Team members rotate presenting a new tech topic or hobby during lunch.',
      category: 'Team',
      priority: 'Medium',
      status: 'Planned',
      createdAt: new Date().toISOString()
    },
    {
      id: 'idea-3',
      title: 'Dark Mode for Admin Portal',
      description: 'Add dark mode support to the internal admin portal used by support staff.',
      category: 'Product',
      priority: 'Low',
      status: 'In Progress',
      createdAt: new Date().toISOString()
    }
  ];
};

const generateMockCalendarEvents = (): CalendarEvent[] => {
  return [
    {
      id: 'ce-1',
      title: 'Client Sync: TechFlow',
      date: getShiftedDateISO(0), // Today
      startTime: '10:00',
      endTime: '11:00',
      type: 'meeting',
      description: 'Weekly status update with Sarah and Mike.'
    },
    {
      id: 'ce-2',
      title: 'Focus Time: Reports',
      date: getShiftedDateISO(0), // Today
      startTime: '14:00',
      endTime: '16:00',
      type: 'work',
      description: 'Deep work on Q3 financial analysis.'
    },
    {
      id: 'ce-3',
      title: 'Team Standup',
      date: getShiftedDateISO(1), // Tomorrow
      startTime: '09:30',
      endTime: '10:00',
      type: 'meeting',
      description: 'Daily operational sync.'
    },
    {
      id: 'ce-4',
      title: 'Doctor Appointment',
      date: getShiftedDateISO(2), 
      startTime: '15:00',
      endTime: '16:00',
      type: 'personal',
      description: 'Annual checkup.'
    }
  ];
};

const generateMockLinks = (): UsefulLink[] => {
  return [
    {
      id: 'l-1',
      title: 'Company HR Portal',
      url: 'https://www.google.com/search?q=hr+portal', // Dummy
      category: 'Company',
      description: 'Payroll, Benefits, and Time Off',
      createdAt: new Date().toISOString()
    },
    {
      id: 'l-2',
      title: 'Jira Dashboard',
      url: 'https://www.atlassian.com/software/jira', 
      category: 'Tools',
      description: 'Main project tracking board',
      createdAt: new Date().toISOString()
    },
    {
      id: 'l-3',
      title: 'Figma Design System',
      url: 'https://www.figma.com',
      category: 'Design',
      description: 'Official brand assets and components',
      createdAt: new Date().toISOString()
    },
    {
      id: 'l-4',
      title: 'AWS Console',
      url: 'https://aws.amazon.com/console/',
      category: 'Tools',
      description: 'Production Environment',
      createdAt: new Date().toISOString()
    }
  ];
};
