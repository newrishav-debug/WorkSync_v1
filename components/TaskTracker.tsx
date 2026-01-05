import React, { useState, useMemo } from 'react';
import { Task, Subtask } from '../types';
import { Plus, Calendar, Target, CheckCircle2, Circle, Trash2, ChevronLeft, ChevronRight, CalendarDays, Flag, ChevronDown, ChevronUp, CornerDownRight, X, Copy, Briefcase, FolderKanban } from 'lucide-react';

interface TaskTrackerProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskTracker: React.FC<TaskTrackerProps> = ({ tasks, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [newTaskContent, setNewTaskContent] = useState('');
  const [isNewTaskPriority, setIsNewTaskPriority] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);
  
  // Expanded state for subtasks
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [newSubtaskContent, setNewSubtaskContent] = useState<{[key: string]: string}>({});
  
  // Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Helper: Get start of week (Monday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const currentWeekStart = useMemo(() => getStartOfWeek(currentDate), [currentDate]);

  // Derived Values
  const dateKey = activeTab === 'daily' 
    ? currentDate.toISOString().slice(0, 10) 
    : currentWeekStart.toISOString().slice(0, 10);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.type === activeTab && t.date === dateKey)
      .sort((a, b) => {
        // Sort by completion (uncompleted first)
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        // Then sort by priority (priority first)
        if ((a.isPriority || false) !== (b.isPriority || false)) return a.isPriority ? -1 : 1;
        // Finally by creation time
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, activeTab, dateKey]);

  const progress = useMemo(() => {
    if (filteredTasks.length === 0) return 0;
    const completed = filteredTasks.filter(t => t.isCompleted).length;
    return Math.round((completed / filteredTasks.length) * 100);
  }, [filteredTasks]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      content: newTaskContent,
      isCompleted: false,
      type: activeTab,
      date: dateKey,
      createdAt: new Date().toISOString(),
      isPriority: isNewTaskPriority,
      subtasks: []
    };

    onAddTask(newTask);
    setNewTaskContent('');
    setIsNewTaskPriority(false);
  };

  const handleToggleComplete = (task: Task) => {
    onUpdateTask({ ...task, isCompleted: !task.isCompleted });
  };

  const handleTogglePriority = (task: Task) => {
    onUpdateTask({ ...task, isPriority: !task.isPriority });
  };

  const handleCloneTask = (task: Task) => {
    // Cannot clone project tasks directly this way as they are linked to state
    if (task.projectId) {
      showToast("Linked project tasks cannot be cloned.");
      return;
    }

    const nextDate = new Date(task.date);
    let message = '';
    
    if (task.type === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
      const dateStr = nextDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      message = `Task cloned to ${dateStr}`;
    } else {
      nextDate.setDate(nextDate.getDate() + 7);
      message = `Task cloned to next week`;
    }

    const clonedTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      date: nextDate.toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      isCompleted: false, // Reset completion for the new instance
      subtasks: task.subtasks ? task.subtasks.map(st => ({
        ...st,
        id: crypto.randomUUID(),
        isCompleted: false
      })) : []
    };

    onAddTask(clonedTask);
    showToast(message);
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newSet = new Set(expandedTaskIds);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setExpandedTaskIds(newSet);
  };

  const handleAddSubtask = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    const content = newSubtaskContent[taskId];
    if (!content?.trim()) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      content: content.trim(),
      isCompleted: false
    };

    onUpdateTask({
      ...task,
      subtasks: [...(task.subtasks || []), newSubtask]
    });

    setNewSubtaskContent(prev => ({ ...prev, [taskId]: '' }));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );

    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (activeTab === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const isToday = (d: Date) => {
    return d.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
  };

  const isCurrentWeek = (d: Date) => {
    return getStartOfWeek(d).getTime() === getStartOfWeek(new Date()).getTime();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Task Tracker</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your daily priorities and weekly goals.</p>
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center">
          <button
            onClick={() => { setActiveTab('daily'); setCurrentDate(new Date()); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
              ${activeTab === 'daily' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Calendar size={16} /> Daily Plan
          </button>
          <button
            onClick={() => { setActiveTab('weekly'); setCurrentDate(new Date()); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
              ${activeTab === 'weekly' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Target size={16} /> Weekly Goals
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
          
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
              {activeTab === 'daily' ? (
                <>
                  {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  {isToday(currentDate) && <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full">Today</span>}
                </>
              ) : (
                <>
                  Week of {currentWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {isCurrentWeek(currentWeekStart) && <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full">Current Week</span>}
                </>
              )}
            </h3>
          </div>

          <button onClick={() => navigateDate('next')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full">
           <div 
             className="h-full bg-indigo-500 transition-all duration-500 ease-out"
             style={{ width: `${progress}%` }}
           />
        </div>

        <div className="p-6">
          <div className="space-y-3 mb-6">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => {
                const subtaskCount = task.subtasks?.length || 0;
                const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
                const isExpanded = expandedTaskIds.has(task.id);
                
                return (
                  <div key={task.id} className={`group rounded-lg border transition-all bg-white dark:bg-slate-900
                    ${task.isPriority ? 'border-l-4 border-l-red-500 border-t border-r border-b border-slate-100 dark:border-t-slate-800 dark:border-r-slate-800 dark:border-b-slate-800' : 'border border-slate-100 dark:border-slate-800'}
                    ${task.isCompleted ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'hover:shadow-sm'}
                  `}>
                    <div className="flex items-center gap-3 p-3">
                      <button 
                        onClick={() => handleToggleComplete(task)}
                        className={`flex-shrink-0 transition-colors ${task.isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}`}
                      >
                        {task.isCompleted ? <CheckCircle2 size={22} className="fill-green-100 dark:fill-green-900/20" /> : <Circle size={22} />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 ${task.isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700 dark:text-slate-200'}`}>
                           {task.isPriority && <Flag size={14} className="text-red-500 fill-red-100 dark:fill-red-900/30" />}
                           <span className="truncate text-sm font-medium">{task.content}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {subtaskCount > 0 && (
                            <p className="text-[10px] text-slate-400 font-medium">
                              {completedSubtasks}/{subtaskCount} subtasks
                            </p>
                          )}
                          {task.engagementId && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                               <Briefcase size={10} />
                               <span className="truncate max-w-[150px]">{task.engagementName || 'Engagement'}</span>
                            </div>
                          )}
                          {task.projectId && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                               <FolderKanban size={10} />
                               <span className="truncate max-w-[150px]">{task.projectName || 'Internal Project'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!task.projectId && (
                          <>
                            <button
                              onClick={() => handleTogglePriority(task)}
                              className={`p-1.5 rounded-lg transition-colors ${task.isPriority ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                              title={task.isPriority ? "Remove Priority" : "Mark as Priority"}
                            >
                              <Flag size={16} className={task.isPriority ? "fill-red-500" : ""} />
                            </button>

                            <button 
                              onClick={() => handleCloneTask(task)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title={activeTab === 'daily' ? "Clone to tomorrow" : "Clone to next week"}
                            >
                              <Copy size={16} />
                            </button>
                          </>
                        )}

                        {!task.projectId && (
                          <button
                            onClick={() => toggleTaskExpansion(task.id)}
                            className={`p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : ''}`}
                            title={isExpanded ? "Collapse subtasks" : "View subtasks"}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}

                        <button 
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && !task.projectId && (
                      <div className="bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 p-3 pl-10 rounded-b-lg animate-slide-down">
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {task.subtasks.map(subtask => (
                              <div key={subtask.id} className="flex items-center gap-2 group/sub">
                                <button 
                                  onClick={() => handleToggleSubtask(task.id, subtask.id)}
                                  className={`flex-shrink-0 transition-colors ${subtask.isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}`}
                                >
                                  {subtask.isCompleted ? <CheckCircle2 size={16} className="fill-green-100 dark:fill-green-900/20" /> : <Circle size={16} />}
                                </button>
                                <span className={`flex-1 text-xs ${subtask.isCompleted ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {subtask.content}
                                </span>
                                <button 
                                  onClick={() => handleDeleteSubtask(task.id, subtask.id)}
                                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover/sub:opacity-100 transition-opacity p-1"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <form onSubmit={(e) => handleAddSubtask(e, task.id)} className="flex items-center gap-2">
                           <CornerDownRight size={14} className="text-slate-400" />
                           <input 
                              type="text"
                              placeholder="Add a subtask..."
                              className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 py-1 text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                              value={newSubtaskContent[task.id] || ''}
                              onChange={(e) => setNewSubtaskContent(prev => ({ ...prev, [task.id]: e.target.value }))}
                           />
                           <button 
                             type="submit"
                             disabled={!newSubtaskContent[task.id]?.trim()}
                             className="text-xs bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded disabled:opacity-50"
                           >
                             Add
                           </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                   <CalendarDays size={24} className="opacity-50"/>
                </div>
                <p>No tasks planned for {activeTab === 'daily' ? 'this day' : 'this week'}.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleAddTask} className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
               type="button"
               onClick={() => setIsNewTaskPriority(!isNewTaskPriority)}
               className={`p-2 rounded-lg transition-colors ${isNewTaskPriority ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
               title="Mark as Priority"
            >
               <Flag size={20} className={isNewTaskPriority ? "fill-current" : ""} />
            </button>
            <input 
              type="text" 
              placeholder={activeTab === 'daily' ? "Add a new task for the day..." : "Add a new goal for the week..."}
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!newTaskContent.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add
            </button>
          </form>
        </div>
        
        {toast && (
          <div className="fixed bottom-6 right-6 bg-slate-800 dark:bg-slate-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-indigo-500/10 text-sm font-medium animate-fade-in flex items-center gap-3 z-50 border border-slate-700 dark:border-slate-600">
             <div className="bg-green-500/20 p-1 rounded-full">
               <CheckCircle2 size={16} className="text-green-400" />
             </div>
             {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskTracker;