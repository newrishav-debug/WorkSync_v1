import React, { useState, useEffect, useMemo } from 'react';
import { fetchEngagements, saveEngagementAPI, fetchTasks, saveTaskAPI, fetchHighlights, saveHighlightAPI, fetchProjects, saveProjectAPI, fetchIdeas, saveIdeaAPI, fetchCalendarEvents, saveCalendarEventAPI, fetchUsefulLinks, saveUsefulLinkAPI, fetchTabOrder, saveTabOrderAPI, deleteEngagementAPI, deleteTaskAPI, deleteHighlightAPI, deleteProjectAPI, deleteIdeaAPI, deleteCalendarEventAPI, deleteUsefulLinkAPI, fetchNotes, saveNoteAPI, deleteNoteAPI } from './services/apiService';
import { Engagement, ViewStateData, Task, AppTab, Highlight, InternalProject, Idea, CalendarEvent, UsefulLink, ProjectTask, Note } from './types';
import Dashboard from './components/Dashboard';
import EngagementDetail from './components/EngagementDetail';
import AddEngagementModal from './components/AddEngagementModal';
import EditEngagementModal from './components/EditEngagementModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Sidebar from './components/Sidebar';
import TaskTracker from './components/TaskTracker';
import Highlights from './components/Highlights';
import InternalProjects from './components/InternalProjects';
import IdeaBoard from './components/IdeaBoard';
import CalendarView from './components/CalendarView';
import Homepage from './components/Homepage';
import UsefulLinks from './components/UsefulLinks';
import EventDetailModal from './components/EventDetailModal';
import WorldClock from './components/WorldClock';
import Notes from './components/Notes';

const App: React.FC = () => {
  // State for data
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [projects, setProjects] = useState<InternalProject[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tabOrder, setTabOrder] = useState<AppTab[]>(['home', 'engagements', 'calendar', 'tasks', 'highlights', 'projects', 'ideas', 'links', 'notes']);
  const [isLoaded, setIsLoaded] = useState(false);

  // State for view routing
  const [viewState, setViewState] = useState<ViewStateData>({ tab: 'home', view: 'dashboard' });

  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEngagement, setEditingEngagement] = useState<Engagement | null>(null);
  const [itemsToDelete, setItemsToDelete] = useState<string[] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // State for Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply Dark Mode Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load initial data (ASYNC)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [eng, tsk, hlt, prj, ids, cal, lnk, nts, ord] = await Promise.all([
          fetchEngagements(),
          fetchTasks(),
          fetchHighlights(),
          fetchProjects(),
          fetchIdeas(),
          fetchCalendarEvents(),
          fetchUsefulLinks(),
          fetchNotes(),
          fetchTabOrder()
        ]);
        setEngagements(eng);
        setTasks(tsk);
        setHighlights(hlt);
        setProjects(prj);
        setIdeas(ids);
        setCalendarEvents(cal);
        setUsefulLinks(lnk);
        setNotes(nts);
        setTabOrder(ord);
        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };
    loadData();
  }, []);

  // --- Handlers (Optimistic Updates + API Calls) ---
  const handleNavigate = (id: string) => { setViewState(prev => ({ ...prev, view: 'detail', targetId: id })); window.scrollTo(0, 0); };
  const handleBack = () => { setViewState(prev => ({ ...prev, view: 'dashboard', targetId: undefined })); };

  const handleAddEngagement = async (newEngagement: Engagement) => {
    setEngagements(prev => [newEngagement, ...prev]);
    setIsAddModalOpen(false);
    handleNavigate(newEngagement.id);
    await saveEngagementAPI(newEngagement);
  };

  const handleUpdateEngagement = async (updatedEngagement: Engagement) => {
    setEngagements(prev => prev.map(e => e.id === updatedEngagement.id ? updatedEngagement : e));
    if (editingEngagement) setEditingEngagement(null);
    await saveEngagementAPI(updatedEngagement);
  };

  const handleDeleteRequest = (ids: string[]) => { setItemsToDelete(ids); };
  const handleConfirmDelete = async () => {
    if (!itemsToDelete) return;
    setEngagements(prev => prev.filter(e => !itemsToDelete.includes(e.id)));

    // API Delete for each
    await Promise.all(itemsToDelete.map(id => deleteEngagementAPI(id)));

    setItemsToDelete(null);
    if (viewState.view === 'detail' && viewState.targetId && itemsToDelete.includes(viewState.targetId)) { setViewState(prev => ({ ...prev, view: 'dashboard' })); }
  };

  const handleAddTask = async (task: Task) => {
    setTasks(prev => [task, ...prev]);
    await saveTaskAPI(task);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    // If it's a project task, we update the project state
    if (updatedTask.projectId) {
      // Find the project and update it in DB
      let targetProject: InternalProject | undefined;
      setProjects(prev => {
        const newProjects = prev.map(p => {
          if (p.id === updatedTask.projectId) {
            const updatedProjectTasks = p.tasks.map(pt =>
              pt.id === updatedTask.id ? { ...pt, isCompleted: updatedTask.isCompleted, content: updatedTask.content } : pt
            );
            const pUpdate = { ...p, tasks: updatedProjectTasks };
            targetProject = pUpdate;
            return pUpdate;
          }
          return p;
        });
        return newProjects;
      });
      if (targetProject) await saveProjectAPI(targetProject);

    } else {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      await saveTaskAPI(updatedTask);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Check if it was a project task first
    // Note: Deleting a project task via "All Tasks" view is tricky if we don't have the parent project ID easily accessible in handle delete.
    // Ideally we should pass the task object to delete. But for now, let's scan.

    const projectTaskSource = projects.find(p => p.tasks.some(pt => pt.id === taskId));

    if (projectTaskSource) {
      let updatedProject: InternalProject | undefined;
      setProjects(prev => prev.map(p => {
        if (p.id === projectTaskSource.id) {
          updatedProject = { ...p, tasks: p.tasks.filter(pt => pt.id !== taskId) };
          return updatedProject;
        }
        return p;
      }));
      if (updatedProject) await saveProjectAPI(updatedProject); // Sync whole project for simplicity
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await deleteTaskAPI(taskId);
    }
  };

  const handleAddHighlight = async (highlight: Highlight) => {
    setHighlights(prev => [highlight, ...prev]);
    await saveHighlightAPI(highlight);
  };
  const handleUpdateHighlight = async (updatedHighlight: Highlight) => {
    setHighlights(prev => prev.map(h => h.id === updatedHighlight.id ? updatedHighlight : h));
    await saveHighlightAPI(updatedHighlight);
  };
  const handleDeleteHighlight = async (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    await deleteHighlightAPI(id);
  };

  const handleAddProject = async (project: InternalProject) => {
    setProjects(prev => [project, ...prev]);
    await saveProjectAPI(project);
  };
  const handleUpdateProject = async (updatedProject: InternalProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    await saveProjectAPI(updatedProject);
  };
  const handleDeleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    await deleteProjectAPI(id);
  };

  const handleAddIdea = async (idea: Idea) => {
    setIdeas(prev => [idea, ...prev]);
    await saveIdeaAPI(idea);
  };
  const handleUpdateIdea = async (updatedIdea: Idea) => {
    setIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
    await saveIdeaAPI(updatedIdea);
  };
  const handleDeleteIdea = async (id: string) => {
    setIdeas(prev => prev.filter(i => i.id !== id));
    await deleteIdeaAPI(id);
  };

  const handleAddEvent = async (event: CalendarEvent) => {
    setCalendarEvents(prev => [event, ...prev]);
    await saveCalendarEventAPI(event);
  };
  const handleUpdateEvent = async (updatedEvent: CalendarEvent) => {
    setCalendarEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    await saveCalendarEventAPI(updatedEvent);
  };
  const handleDeleteEvent = async (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    await deleteCalendarEventAPI(id);
  };

  const handleAddLink = async (link: UsefulLink) => {
    setUsefulLinks(prev => [link, ...prev]);
    await saveUsefulLinkAPI(link);
  };
  const handleDeleteLink = async (id: string) => {
    setUsefulLinks(prev => prev.filter(l => l.id !== id));
    await deleteUsefulLinkAPI(id);
  };

  const handleAddNote = async (note: Note) => {
    setNotes(prev => [note, ...prev]);
    await saveNoteAPI(note);
  };
  const handleUpdateNote = async (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    await saveNoteAPI(updatedNote);
  };
  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    await deleteNoteAPI(id);
  };

  const handleTabChange = (tab: AppTab) => { setViewState(prev => ({ ...prev, tab, view: 'dashboard' })); };

  const handleReorderTabs = async (order: AppTab[]) => {
    setTabOrder(order);
    await saveTabOrderAPI(order);
  };

  // Computed: Master task list including project tasks
  const masterTasksList = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const mappedProjectTasks: Task[] = projects.flatMap(p =>
      p.tasks.map(pt => ({
        id: pt.id,
        content: pt.content,
        isCompleted: pt.isCompleted,
        type: 'daily', // Default to daily so they appear in current view
        date: today,   // Default to today
        createdAt: p.createdAt,
        projectId: p.id,
        projectName: p.name
      }))
    );
    return [...tasks, ...mappedProjectTasks];
  }, [tasks, projects]);

  const currentEngagement = viewState.targetId ? engagements.find(e => e.id === viewState.targetId) : undefined;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar
        currentTab={viewState.tab}
        onTabChange={handleTabChange}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        tabOrder={tabOrder}
        onReorderTabs={handleReorderTabs}
      />

      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Top Clock Bar */}
          <WorldClock minimal={viewState.tab !== 'home'} />

          {viewState.tab === 'home' && (
            <Homepage
              engagements={engagements}
              tasks={masterTasksList}
              highlights={highlights}
              projects={projects}
              ideas={ideas}
              calendarEvents={calendarEvents}
              usefulLinks={usefulLinks}
              notes={notes}
              onNavigate={handleTabChange}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onEventClick={(event) => setSelectedEvent(event)}
            />
          )}

          {viewState.tab === 'engagements' && (
            <>
              {viewState.view === 'dashboard' && (
                <Dashboard engagements={engagements} onNavigate={handleNavigate} onAdd={() => setIsAddModalOpen(true)} onUpdate={handleUpdateEngagement} onEdit={(e) => setEditingEngagement(e)} onDelete={handleDeleteRequest} isDarkMode={isDarkMode} />
              )}
              {viewState.view === 'detail' && currentEngagement && (
                <EngagementDetail engagement={currentEngagement} tasks={masterTasksList} onBack={handleBack} onUpdate={handleUpdateEngagement} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />
              )}
            </>
          )}

          {viewState.tab === 'tasks' && <TaskTracker tasks={masterTasksList} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />}
          {viewState.tab === 'highlights' && <Highlights highlights={highlights} onAddHighlight={handleAddHighlight} onUpdateHighlight={handleUpdateHighlight} onDeleteHighlight={handleDeleteHighlight} />}
          {viewState.tab === 'projects' && <InternalProjects projects={projects} onAddProject={handleAddProject} onUpdateProject={handleUpdateProject} onDeleteProject={handleDeleteProject} />}
          {viewState.tab === 'ideas' && <IdeaBoard ideas={ideas} onAddIdea={handleAddIdea} onUpdateIdea={handleUpdateIdea} onDeleteIdea={handleDeleteIdea} />}
          {viewState.tab === 'calendar' && <CalendarView events={calendarEvents} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent} />}
          {viewState.tab === 'links' && <UsefulLinks links={usefulLinks} onAddLink={handleAddLink} onDeleteLink={handleDeleteLink} />}
          {viewState.tab === 'notes' && <Notes notes={notes} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} />}

        </div>
      </main>

      {/* Global Modals */}
      {isAddModalOpen && <AddEngagementModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddEngagement} />}
      {editingEngagement && <EditEngagementModal engagement={editingEngagement} onClose={() => setEditingEngagement(null)} onSave={handleUpdateEngagement} />}
      {itemsToDelete && <DeleteConfirmationModal count={itemsToDelete.length} onConfirm={handleConfirmDelete} onCancel={() => setItemsToDelete(null)} />}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
};

export default App;