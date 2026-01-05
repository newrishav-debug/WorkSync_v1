import React, { useState, useMemo } from 'react';
import { InternalProject, ProjectStatus, ProjectTask, ResearchNote } from '../types';
import { Plus, FolderKanban, Trash2, Calendar, CheckSquare, Square, X, ChevronDown, MoreVertical, ArrowLeft, BookOpen, Clock, PenTool } from 'lucide-react';

interface InternalProjectsProps {
  projects: InternalProject[];
  onAddProject: (project: InternalProject) => void;
  onUpdateProject: (project: InternalProject) => void;
  onDeleteProject: (id: string) => void;
}

const InternalProjects: React.FC<InternalProjectsProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // State for tasks in detail view
  const [newTaskContent, setNewTaskContent] = useState('');

  // State for research notes
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().slice(0, 10));

  // New Project Form State
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    status: 'Not Started' as ProjectStatus,
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: ''
  });

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
        const statusOrder: Record<ProjectStatus, number> = {
            'In Progress': 1,
            'Not Started': 2,
            'On Hold': 3,
            'Completed': 4
        };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [projects]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
  [projects, selectedProjectId]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectData.name.trim()) return;

    const newProject: InternalProject = {
      id: crypto.randomUUID(),
      name: newProjectData.name,
      description: newProjectData.description,
      status: newProjectData.status,
      startDate: newProjectData.startDate,
      dueDate: newProjectData.dueDate,
      tasks: [],
      researchNotes: [],
      createdAt: new Date().toISOString()
    };

    onAddProject(newProject);
    setNewProjectData({
      name: '',
      description: '',
      status: 'Not Started',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: ''
    });
    setIsModalOpen(false);
  };

  // --- Task Logic ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim() || !activeProject) return;

    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      content: newTaskContent.trim(),
      isCompleted: false
    };

    onUpdateProject({
      ...activeProject,
      tasks: [...activeProject.tasks, newTask]
    });
    setNewTaskContent('');
  };

  const toggleTaskStatus = (taskId: string) => {
    if (!activeProject) return;
    const updatedTasks = activeProject.tasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    onUpdateProject({ ...activeProject, tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    if (!activeProject) return;
    const updatedTasks = activeProject.tasks.filter(t => t.id !== taskId);
    onUpdateProject({ ...activeProject, tasks: updatedTasks });
  };

  // --- Research Note Logic ---
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !activeProject) return;

    const newNote: ResearchNote = {
      id: crypto.randomUUID(),
      content: newNoteContent.trim(),
      date: newNoteDate,
      createdAt: new Date().toISOString()
    };

    onUpdateProject({
      ...activeProject,
      researchNotes: [newNote, ...activeProject.researchNotes]
    });
    setNewNoteContent('');
    setNewNoteDate(new Date().toISOString().slice(0, 10));
  };

  const deleteNote = (noteId: string) => {
    if (!activeProject) return;
    const updatedNotes = activeProject.researchNotes.filter(n => n.id !== noteId);
    onUpdateProject({ ...activeProject, researchNotes: updatedNotes });
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'On Hold': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const calculateProgress = (tasks: ProjectTask[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.isCompleted).length;
    return Math.round((completed / tasks.length) * 100);
  };

  // --- RENDER: Detailed View ---
  if (selectedProjectId && activeProject) {
    const sortedNotes = [...activeProject.researchNotes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <button 
          onClick={() => setSelectedProjectId(null)}
          className="flex items-center text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium text-sm"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Projects
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{activeProject.name}</h1>
               <div className="flex items-center gap-3">
                 <select 
                    value={activeProject.status}
                    onChange={(e) => onUpdateProject({ ...activeProject, status: e.target.value as ProjectStatus })}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${getStatusColor(activeProject.status)}`}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                     <Calendar size={14}/> {new Date(activeProject.startDate).toLocaleDateString()}
                     {activeProject.dueDate && ` - ${new Date(activeProject.dueDate).toLocaleDateString()}`}
                  </span>
               </div>
            </div>
            <button 
                onClick={() => { onDeleteProject(activeProject.id); setSelectedProjectId(null); }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
                <Trash2 size={16} /> Delete Project
            </button>
          </div>
          
          <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
             {activeProject.description || "No description provided."}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COL: Tasks */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <CheckSquare className="text-indigo-500" size={20}/> Tasks
                 </h3>
                 <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                    {activeProject.tasks.filter(t => t.isCompleted).length}/{activeProject.tasks.length} Done
                 </span>
               </div>

               <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                 <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                   <input 
                     type="text"
                     className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                     placeholder="Add a new task..."
                     value={newTaskContent}
                     onChange={(e) => setNewTaskContent(e.target.value)}
                   />
                   <button 
                     type="submit"
                     disabled={!newTaskContent.trim()}
                     className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                   >
                     <Plus size={20} />
                   </button>
                 </form>

                 <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeProject.tasks.map(task => (
                       <li key={task.id} className="flex items-start gap-3 group bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                         <button 
                           onClick={() => toggleTaskStatus(task.id)}
                           className={`mt-0.5 flex-shrink-0 ${task.isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}`}
                         >
                           {task.isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
                         </button>
                         <span className={`text-sm flex-1 break-words ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                           {task.content}
                         </span>
                         <button 
                           onClick={() => deleteTask(task.id)}
                           className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           <X size={16} />
                         </button>
                       </li>
                    ))}
                    {activeProject.tasks.length === 0 && (
                        <li className="text-center py-8 text-slate-400 text-sm italic">No tasks yet.</li>
                    )}
                 </ul>
               </div>
            </div>

            {/* RIGHT COL: Research Notes */}
            <div className="space-y-4">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <BookOpen className="text-indigo-500" size={20}/> Research Notes
               </h3>

               <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                 <form onSubmit={handleAddNote} className="space-y-3 mb-6 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">New Note</label>
                      <input 
                        type="date"
                        className="bg-transparent text-xs text-slate-500 focus:outline-none text-right"
                        value={newNoteDate}
                        onChange={(e) => setNewNoteDate(e.target.value)}
                      />
                   </div>
                   <textarea 
                     className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none dark:text-white"
                     rows={3}
                     placeholder="Log your research, findings, or daily progress..."
                     value={newNoteContent}
                     onChange={(e) => setNewNoteContent(e.target.value)}
                   />
                   <div className="flex justify-end">
                     <button 
                       type="submit"
                       disabled={!newNoteContent.trim()}
                       className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                     >
                       Add Note
                     </button>
                   </div>
                 </form>

                 <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6 pb-2">
                    {sortedNotes.map(note => (
                      <div key={note.id} className="relative pl-6 group">
                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors" />
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-all">
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                <Clock size={10} /> {new Date(note.date).toLocaleDateString()}
                              </span>
                              <button 
                                onClick={() => deleteNote(note.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={12} />
                              </button>
                           </div>
                           <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                             {note.content}
                           </p>
                        </div>
                      </div>
                    ))}
                    {sortedNotes.length === 0 && (
                        <div className="pl-6 text-sm text-slate-400 italic">No research notes recorded.</div>
                    )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: List View ---
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FolderKanban className="text-indigo-600 dark:text-indigo-400" />
            Internal Projects
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Track your personal projects and internal initiatives.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="flex flex-col space-y-4">
        {sortedProjects.map(project => {
          const progress = calculateProgress(project.tasks);
          
          const stripeColor = 
            project.status === 'Completed' ? 'bg-green-500' :
            project.status === 'In Progress' ? 'bg-blue-500' :
            project.status === 'On Hold' ? 'bg-amber-500' :
            'bg-slate-300 dark:bg-slate-600';

          return (
            <div 
              key={project.id} 
              onClick={() => setSelectedProjectId(project.id)}
              className="group w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 cursor-pointer overflow-hidden flex flex-col sm:flex-row relative"
            >
              <div className={`w-full sm:w-2 h-2 sm:h-auto flex-shrink-0 ${stripeColor}`} />
              
              <div className="p-5 flex-1 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate" title={project.name}>{project.name}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}>
                            {project.status}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-1">
                        {project.description || "No description provided."}
                    </p>
                 </div>

                 <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                    <div className="flex flex-col items-start sm:items-end min-w-[100px]">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            <span>Progress</span>
                            <span className="text-slate-800 dark:text-white">{progress}%</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${stripeColor}`} style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    <div className="text-right min-w-[120px]">
                        <div className="text-xs text-slate-400 flex items-center justify-end gap-1 mb-1">
                            <Calendar size={12}/> Start: {new Date(project.startDate).toLocaleDateString()}
                        </div>
                        {project.dueDate && (
                            <div className={`text-xs flex items-center justify-end gap-1 ${new Date(project.dueDate) < new Date() && project.status !== 'Completed' ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                                <Clock size={12}/> Due: {new Date(project.dueDate).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-full text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                        <PenTool size={16} />
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
        
        {sortedProjects.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
             <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600 shadow-sm">
               <FolderKanban size={32} />
             </div>
             <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No projects yet</h3>
             <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
               Create your first internal project to track tasks, progress, and research notes.
             </p>
             <button 
               onClick={() => setIsModalOpen(true)}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
             >
               <Plus size={20} /> Create Project
             </button>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">New Internal Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Q4 Skill Development"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  value={newProjectData.name}
                  onChange={e => setNewProjectData({...newProjectData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea 
                  placeholder="Brief details about this project..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors h-24 resize-none"
                  value={newProjectData.description}
                  onChange={e => setNewProjectData({...newProjectData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      required
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                      value={newProjectData.startDate}
                      onChange={e => setNewProjectData({...newProjectData, startDate: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date (Opt)</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                      value={newProjectData.dueDate}
                      onChange={e => setNewProjectData({...newProjectData, dueDate: e.target.value})}
                    />
                 </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
                <select 
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  value={newProjectData.status}
                  onChange={e => setNewProjectData({...newProjectData, status: e.target.value as ProjectStatus})}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalProjects;