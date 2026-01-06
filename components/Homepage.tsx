import React, { useMemo } from 'react';
import { Engagement, Task, Highlight, InternalProject, Idea, CalendarEvent, AppTab, UsefulLink } from '../types';
import { Briefcase, CheckSquare, Calendar, Zap, FolderKanban, Lightbulb, ArrowRight, AlertTriangle, Flag, Clock, Link as LinkIcon, ExternalLink, Circle, CheckCircle2, X } from 'lucide-react';

interface HomepageProps {
  engagements: Engagement[];
  tasks: Task[];
  highlights: Highlight[];
  projects: InternalProject[];
  ideas: Idea[];
  calendarEvents: CalendarEvent[];
  usefulLinks: UsefulLink[];
  onNavigate: (tab: AppTab) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const Homepage: React.FC<HomepageProps> = ({
  engagements,
  tasks,
  highlights,
  projects,
  ideas,
  calendarEvents,
  usefulLinks,
  onNavigate,
  onUpdateTask,
  onDeleteTask,
  onEventClick
}) => {
  const today = new Date();

  // -- Greeting Logic --
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // -- Data Calculations --

  // Engagements
  const activeEngagements = engagements.filter(e => e.status === 'Active').length;
  const atRiskEngagements = engagements.filter(e => e.status === 'At Risk').length;

  // Tasks (Today's Priorities)
  // Use local date components to avoid UTC timezone issues
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todaysTasks = tasks.filter(t => t.type === 'daily' && t.date === todayStr);
  const openPriorityTasks = todaysTasks
    .filter(t => !t.isCompleted)
    .sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));
  const completedTodayCount = todaysTasks.filter(t => t.isCompleted).length;

  // Today's Calendar Events
  const todaysEvents = useMemo(() => {
    return calendarEvents
      .filter(e => e.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [calendarEvents, todayStr]);

  // Active Internal Projects
  const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;

  // Recent Highlight
  const recentHighlight = highlights.length > 0
    ? [...highlights].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  // Recent Links (Top 3 most recently added)
  const recentLinks = useMemo(() => {
    return [...usefulLinks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  }, [usefulLinks]);

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{getGreeting()}, Rishav</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here is what's happening in your workspace today, {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Combined Today's Overview Container */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              Daily Overview
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Calendar
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Tasks
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row flex-1 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            {/* Left Pane: Meetings (Schedule) */}
            <div className="flex-1 p-5 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" /> Today's Meetings
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 uppercase">
                  {todaysEvents.length} Scheduled
                </span>
              </div>

              {/* Max height adjusted to show ~5 items (approx 350px) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[350px] pr-1">
                {todaysEvents.length > 0 ? (
                  todaysEvents.map(event => {
                    const now = new Date();
                    const start = new Date(`${event.date}T${event.startTime}`);
                    const end = new Date(`${event.date}T${event.endTime}`);
                    const isPast = end < now;
                    const isCurrent = start <= now && end >= now;

                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all group/meeting ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' :
                            isPast ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60' :
                              'bg-white dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 shadow-sm'
                          } border transition-colors`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} flex items-center gap-1`}>
                            <Clock size={12} /> {event.startTime} - {event.endTime}
                          </span>
                          {isCurrent && <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold animate-pulse">NOW</span>}
                          {event.momSent && <CheckSquare size={12} className="text-green-500 ml-auto" />}
                        </div>
                        <p className={`font-semibold text-sm ${isPast ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-800 dark:text-white'}`}>{event.title}</p>
                        {event.description && !isPast && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{event.description}</p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic py-8">
                    <Calendar size={20} className="opacity-30 mb-2" />
                    No meetings today.
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane: Open Tasks (Focus) */}
            <div className="flex-1 p-5 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={16} className="text-emerald-500" /> Open Tasks
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-blue-300 uppercase">
                  {completedTodayCount}/{todaysTasks.length} Done
                </span>
              </div>

              {/* Max height adjusted to show ~5 items (approx 350px) and enable scrolling */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[350px] pr-1">
                {openPriorityTasks.length > 0 ? (
                  openPriorityTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors group/task">
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateTask({ ...task, isCompleted: true }); }}
                        className="mt-1 flex-shrink-0 text-slate-300 hover:text-emerald-500 transition-colors"
                        title="Mark as completed"
                      >
                        <Circle size={18} className="group-hover/task:hidden" />
                        <CheckCircle2 size={18} className="hidden group-hover/task:block text-emerald-500" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.isPriority ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'} truncate`}>
                          {task.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {task.isPriority && (
                            <span className="text-[10px] flex items-center gap-1 text-red-500 font-bold uppercase"><Flag size={10} /> Priority</span>
                          )}
                          {task.engagementName && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                              <Briefcase size={10} />
                              <span className="truncate max-w-[120px]">{task.engagementName}</span>
                            </div>
                          )}
                          {task.projectName && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                              <FolderKanban size={10} />
                              <span className="truncate max-w-[120px]">{task.projectName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity"
                        title="Close/Dismiss task"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic py-8">
                    {todaysTasks.length > 0 && completedTodayCount === todaysTasks.length ? (
                      <div className="text-center">
                        <CheckSquare size={20} className="opacity-30 mb-2 mx-auto text-emerald-500" />
                        All done for today!
                      </div>
                    ) : (
                      <div className="text-center">
                        <CheckSquare size={20} className="opacity-30 mb-2 mx-auto" />
                        No tasks listed for today.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Pulse */}
        <div
          onClick={() => onNavigate('engagements')}
          className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Briefcase size={24} />
            </div>
            <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Client Engagements</h3>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{activeEngagements}</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active</p>
            </div>
            {atRiskEngagements > 0 && (
              <div className="pl-4 border-l border-slate-100 dark:border-slate-800">
                <span className="text-2xl font-bold text-red-500 flex items-center gap-1">
                  {atRiskEngagements} <AlertTriangle size={16} />
                </span>
                <p className="text-xs text-red-500/80 font-medium">At Risk</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Overview */}
        <div
          onClick={() => onNavigate('projects')}
          className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900/50 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-lg text-amber-600 dark:text-amber-400">
              <FolderKanban size={24} />
            </div>
            <ArrowRight size={20} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Internal Projects</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{activeProjectsCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Projects currently in progress</p>
        </div>

        {/* Quick Links Widget */}
        <div
          onClick={() => onNavigate('links')}
          className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-900/50 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2.5 rounded-lg text-cyan-600 dark:text-cyan-400">
              <LinkIcon size={24} />
            </div>
            <ArrowRight size={20} className="text-slate-300 group-hover:text-cyan-500 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Quick Links</h3>
          <div className="space-y-2">
            {recentLinks.length > 0 ? (
              recentLinks.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group/link"
                >
                  <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={getFavicon(link.url) || ''}
                      alt=""
                      className="w-4 h-4 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <LinkIcon size={12} className="text-slate-400 hidden" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">{link.title}</span>
                  <ExternalLink size={12} className="text-slate-400 opacity-0 group-hover/link:opacity-100" />
                </a>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No useful links added yet.</p>
            )}
          </div>
        </div>

        {/* Recent Highlight */}
        <div
          onClick={() => onNavigate('highlights')}
          className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900/50 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-lg text-purple-600 dark:text-purple-400">
              <Zap size={24} />
            </div>
            <ArrowRight size={20} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Recent Highlight</h3>
          {recentHighlight ? (
            <div className="text-sm">
              <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">"{recentHighlight.content}"</p>
              <p className="text-xs text-slate-400 mt-2">{new Date(recentHighlight.date).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No highlights recorded yet.</p>
          )}
        </div>

        {/* Idea Spark */}
        <div
          onClick={() => onNavigate('ideas')}
          className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer group text-white"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-2.5 rounded-lg text-white backdrop-blur-sm">
              <Lightbulb size={24} />
            </div>
          </div>
          <h3 className="text-lg font-bold mb-1">Got an Idea?</h3>
          <p className="text-indigo-100 text-sm mb-4">Don't let it slip away. Capture it now on your board.</p>
          <div className="text-xs font-bold bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
            {ideas.length} Ideas Logged
          </div>
        </div>

      </div>
    </div>
  );
};

export default Homepage;