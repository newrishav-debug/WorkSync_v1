import React, { useState } from 'react';
import { Engagement, EngagementStatus, TimelineEntry, EngagementFile, Task, Subtask, Idea } from '../types';
import Timeline from './Timeline';
import { generateEngagementSummary } from '../services/geminiService';
import { ArrowLeft, Plus, Sparkles, Building2, Hash, Calendar, Loader2, Paperclip, Upload, FileText, File as FileIcon, Trash2, CheckSquare, Circle, CheckCircle2, X, Lightbulb } from 'lucide-react';

interface EngagementDetailProps {
  engagement: Engagement;
  tasks: Task[];
  onBack: () => void;
  onUpdate: (updatedEngagement: Engagement) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddIdea?: (idea: Idea) => void;
  onNavigateToIdeas?: () => void;
}

const EngagementDetail: React.FC<EngagementDetailProps> = ({
  engagement,
  tasks,
  onBack,
  onUpdate,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddIdea,
  onNavigateToIdeas
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryType, setNewEntryType] = useState<TimelineEntry['type']>('update');
  const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().slice(0, 16));

  // Task states
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');

  const engagementTasks = tasks.filter(t => t.engagementId === engagement.id);

  const generateId = () => {
    return crypto.randomUUID();
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const summary = await generateEngagementSummary(engagement);
      onUpdate({
        ...engagement,
        aiSummary: summary,
        lastSummaryDate: new Date().toISOString()
      });
    } catch (error) {
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTimelineEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryContent.trim()) return;

    const newEntry: TimelineEntry = {
      id: generateId(),
      date: new Date(newEntryDate).toISOString(),
      content: newEntryContent,
      type: newEntryType
    };

    onUpdate({
      ...engagement,
      timeline: [newEntry, ...engagement.timeline]
    });

    setNewEntryContent('');
    setShowAddEntry(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;

    const newTask: Task = {
      id: generateId(),
      content: newTaskContent.trim(),
      isCompleted: false,
      type: 'daily',
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      engagementId: engagement.id,
      engagementName: engagement.name,
      subtasks: []
    };

    onAddTask(newTask);
    setNewTaskContent('');
    setShowAddTask(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("File is too large! Please upload files smaller than 50MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newFile: EngagementFile = {
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target.result as string,
          uploadDate: new Date().toISOString()
        };

        onUpdate({
          ...engagement,
          files: [newFile, ...(engagement.files || [])]
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this file?")) {
      onUpdate({
        ...engagement,
        files: (engagement.files || []).filter(f => f.id !== fileId)
      });
    }
  };

  const openFileInNewTab = (file: EngagementFile) => {
    const win = window.open();
    if (!win) return;

    let content = '';
    if (file.type.startsWith('image/')) {
      content = `<div style="display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;"><img src="${file.data}" style="max-width:95%; max-height:95vh;"/></div>`;
    } else if (file.type === 'application/pdf') {
      content = `<iframe src="${file.data}" style="width:100%; height:100vh; border:none;"></iframe>`;
    } else {
      content = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h2>Preview not available</h2><a href="${file.data}" download="${file.name}">Download ${file.name}</a></div>`;
    }
    win.document.write(`<html><head><title>${file.name}</title></head><body>${content}</body></html>`);
    win.document.close();
  };

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statusColors = {
    [EngagementStatus.Active]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900',
    [EngagementStatus.Completed]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900',
    [EngagementStatus.AtRisk]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900',
    [EngagementStatus.OnHold]: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900',
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <button
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium text-sm"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{engagement.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[engagement.status]}`}>
              {engagement.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Building2 size={14} /> {engagement.accountName}</span>
            <span className="flex items-center gap-1 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"><Hash size={12} /> {engagement.engagementNumber}</span>
          </div>
        </div>
        {/* Create Idea Button */}
        {onAddIdea && (
          <button
            onClick={() => {
              const newIdea: Idea = {
                id: crypto.randomUUID(),
                title: `Idea from ${engagement.name}`,
                description: '',
                entries: [],
                category: 'General',
                priority: 'Medium',
                status: 'New',
                createdAt: new Date().toISOString(),
                engagementId: engagement.id,
                engagementName: engagement.name
              };
              onAddIdea(newIdea);
              if (onNavigateToIdeas) onNavigateToIdeas();
            }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Lightbulb size={18} />
            Create Idea
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Engagement Tasks Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckSquare className="text-emerald-500" size={20} />
                Linked Tasks
              </h2>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Plus size={16} /> New Task
              </button>
            </div>

            {showAddTask && (
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 animate-slide-down">
                <form onSubmit={handleCreateTask}>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Content</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="What needs to be done for this project?"
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                      value={newTaskContent}
                      onChange={e => setNewTaskContent(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddTask(false)} className="px-3 py-1.5 text-sm text-slate-500">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold">Create Task</button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-2">
              {engagementTasks.length > 0 ? (
                engagementTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpdateTask({ ...task, isCompleted: !task.isCompleted })}
                        className={`flex-shrink-0 ${task.isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}`}
                      >
                        {task.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <span className={`text-sm ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                        {task.content}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-sm text-slate-400 italic">No tasks linked to this engagement yet.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="text-indigo-500" size={20} />
              Timeline Updates
            </h2>
            <button
              onClick={() => setShowAddEntry(!showAddEntry)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all"
            >
              <Plus size={16} /> Add Update
            </button>
          </div>

          {showAddEntry && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-xl p-4 shadow-inner animate-slide-down">
              <form onSubmit={handleAddTimelineEntry}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newEntryDate}
                      onChange={(e) => setNewEntryDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type</label>
                    <select
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newEntryType}
                      onChange={(e) => setNewEntryType(e.target.value as any)}
                    >
                      <option value="update">General Update</option>
                      <option value="meeting">Meeting</option>
                      <option value="milestone">Milestone</option>
                      <option value="issue">Issue/Risk</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Update Details</label>
                  <textarea
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm h-24 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="What happened?"
                    required
                    value={newEntryContent}
                    onChange={(e) => setNewEntryContent(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddEntry(false)} className="px-3 py-1.5 text-sm text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm font-medium">Save Entry</button>
                </div>
              </form>
            </div>
          )}

          <Timeline entries={engagement.timeline} />
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-900 rounded-xl shadow-sm border border-indigo-100 dark:border-slate-800 p-5 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                AI Summary
              </h3>
              <button
                onClick={handleGenerateSummary}
                disabled={isGenerating}
                className="text-xs bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-slate-700 hover:bg-indigo-50 px-3 py-1 rounded-full font-medium shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : null}
                {isGenerating ? 'Analyzing...' : 'Refresh'}
              </button>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white/50 dark:bg-slate-800/50 p-3 rounded-lg border border-indigo-50 dark:border-slate-700 min-h-[100px]">
              {engagement.aiSummary ? (
                <div>
                  <p className="whitespace-pre-wrap">{engagement.aiSummary}</p>
                  {engagement.lastSummaryDate && (
                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-2">
                      Generated: {new Date(engagement.lastSummaryDate).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 dark:text-slate-500 italic">
                  No summary generated yet.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-sm uppercase tracking-wide">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Org ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{engagement.orgId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Account</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{engagement.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[engagement.status]}`}>{engagement.status}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide flex items-center gap-2">
                <Paperclip size={16} className="text-indigo-500" /> Files
              </h3>
              <label className="cursor-pointer text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 group">
                <Upload size={12} className="group-hover:scale-110 transition-transform" /> Upload
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="space-y-2">
              {(engagement.files || []).length > 0 ? (
                (engagement.files || []).map((file) => (
                  <div key={file.id} className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900/50">
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => openFileInNewTab(file)}
                    >
                      <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                        {file.type.includes('image') ? <FileIcon size={16} /> : <FileText size={16} />}
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFile(e, file.id)}
                      className="text-slate-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete File"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-slate-400 italic">No files uploaded yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementDetail;