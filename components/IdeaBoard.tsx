import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Idea, IdeaCategory, IdeaPriority, IdeaStatus } from '../types';
import { Plus, Lightbulb, Trash2, X, AlertCircle, Users, Settings, Tag, Filter, Calendar } from 'lucide-react';

interface IdeaBoardProps {
  ideas: Idea[];
  onAddIdea: (idea: Idea) => void;
  onUpdateIdea: (idea: Idea) => void;
  onDeleteIdea: (id: string) => void;
}

const IdeaBoard: React.FC<IdeaBoardProps> = ({ ideas, onAddIdea, onUpdateIdea, onDeleteIdea }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<IdeaCategory | 'All'>('All');

  // Editing state for auto-save
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [newIdea, setNewIdea] = useState<Partial<Idea>>({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    status: 'New'
  });

  const selectedIdea = ideas.find(i => i.id === selectedIdeaId);

  // Sync local state when selected idea changes
  useEffect(() => {
    if (selectedIdea) {
      setEditTitle(selectedIdea.title);
      setEditDescription(selectedIdea.description);
      setLastSaved(null);
    }
  }, [selectedIdeaId, selectedIdea?.id]);

  // Auto-save function
  const saveIdea = useCallback(() => {
    if (!selectedIdea) return;

    const hasChanges = editTitle !== selectedIdea.title || editDescription !== selectedIdea.description;
    if (!hasChanges) return;

    setIsSaving(true);
    const updatedIdea: Idea = {
      ...selectedIdea,
      title: editTitle,
      description: editDescription
    };
    onUpdateIdea(updatedIdea);
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 500);
  }, [selectedIdea, editTitle, editDescription, onUpdateIdea]);

  // Debounced auto-save on content change
  useEffect(() => {
    if (!selectedIdea) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveIdea();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editTitle, editDescription, selectedIdea?.id]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.title?.trim() || !newIdea.description?.trim()) return;

    const idea: Idea = {
      id: crypto.randomUUID(),
      title: newIdea.title,
      description: newIdea.description,
      category: newIdea.category as IdeaCategory,
      priority: newIdea.priority as IdeaPriority,
      status: 'New',
      createdAt: new Date().toISOString()
    };

    onAddIdea(idea);
    setNewIdea({ title: '', description: '', category: 'General', priority: 'Medium', status: 'New' });
    setIsModalOpen(false);
    setSelectedIdeaId(idea.id);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const getCategoryIcon = (category: IdeaCategory) => {
    switch (category) {
      case 'Team': return <Users size={14} />;
      case 'Product': return <Tag size={14} />;
      case 'Process': return <Settings size={14} />;
      default: return <Lightbulb size={14} />;
    }
  };

  const getCategoryColor = (category: IdeaCategory) => {
    switch (category) {
      case 'Team': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Product': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Process': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getPriorityColor = (priority: IdeaPriority) => {
    switch (priority) {
      case 'High': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'Medium': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'Low': return 'text-slate-500 bg-slate-100 dark:bg-slate-800';
    }
  };

  const getStatusColor = (status: IdeaStatus) => {
    switch (status) {
      case 'New': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Planned': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400';
      case 'In Progress': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      case 'Implemented': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'Discarded': return 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const filteredIdeas = ideas
    .filter(idea => filterCategory === 'All' || idea.category === filterCategory)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Lightbulb className="text-amber-500" />
            Idea Board
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Capture ideas, enhancements, and improvement points.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={18} /> Add Idea
        </button>
      </div>

      {/* Main Content - Split Pane */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[600px] flex">

        {/* Left Pane - Idea List */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
          {/* Filter */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <select
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as IdeaCategory | 'All')}
              >
                <option value="All">All Categories</option>
                <option value="Team">Team</option>
                <option value="Product">Product</option>
                <option value="Process">Process</option>
                <option value="General">General</option>
              </select>
              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Idea List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredIdeas.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Lightbulb size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No ideas found</p>
              </div>
            ) : (
              filteredIdeas.map(idea => (
                <button
                  key={idea.id}
                  onClick={() => setSelectedIdeaId(idea.id)}
                  className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedIdeaId === idea.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500' : ''
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${getCategoryColor(idea.category)}`}>
                      {getCategoryIcon(idea.category)} {idea.category}
                    </span>
                    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${idea.priority === 'High' ? 'text-red-500' : idea.priority === 'Medium' ? 'text-orange-500' : 'text-slate-400'}`}>
                      <AlertCircle size={10} /> {idea.priority}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">{idea.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2">{idea.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getStatusColor(idea.status)}`}>
                      {idea.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(idea.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Idea Detail/Editor */}
        <div className="flex-1 flex flex-col">
          {selectedIdea ? (
            <>
              {/* Header with Save Status */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {isSaving ? (
                    <span className="text-amber-500 animate-pulse">Saving...</span>
                  ) : lastSaved ? (
                    <span className="text-green-500">Saved</span>
                  ) : (
                    <span>Auto-save enabled</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    onDeleteIdea(selectedIdea.id);
                    setSelectedIdeaId(null);
                  }}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Delete idea"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Status, Category, Priority Controls */}
              <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Status:</span>
                    <select
                      className={`text-xs font-bold bg-transparent outline-none cursor-pointer px-2 py-1 rounded-lg border-0 ${getStatusColor(selectedIdea.status)}`}
                      value={selectedIdea.status}
                      onChange={(e) => onUpdateIdea({ ...selectedIdea, status: e.target.value as IdeaStatus })}
                    >
                      <option value="New">New</option>
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Implemented">Implemented</option>
                      <option value="Discarded">Discarded</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Category:</span>
                    <select
                      className={`text-xs font-bold bg-transparent outline-none cursor-pointer px-2 py-1 rounded-lg border-0 ${getCategoryColor(selectedIdea.category)}`}
                      value={selectedIdea.category}
                      onChange={(e) => onUpdateIdea({ ...selectedIdea, category: e.target.value as IdeaCategory })}
                    >
                      <option value="Team">Team</option>
                      <option value="Product">Product</option>
                      <option value="Process">Process</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Priority:</span>
                    <select
                      className={`text-xs font-bold bg-transparent outline-none cursor-pointer px-2 py-1 rounded-lg border-0 ${getPriorityColor(selectedIdea.priority)}`}
                      value={selectedIdea.priority}
                      onChange={(e) => onUpdateIdea({ ...selectedIdea, priority: e.target.value as IdeaPriority })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
                    <Calendar size={12} />
                    {new Date(selectedIdea.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Editable Content */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-2xl font-bold bg-transparent border-none pb-4 focus:outline-none text-slate-800 dark:text-white placeholder-slate-400"
                  placeholder="Idea title..."
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full h-[350px] bg-transparent focus:outline-none resize-none text-slate-700 dark:text-slate-300 placeholder-slate-400 leading-relaxed"
                  placeholder="Describe your idea..."
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb size={40} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-4">Select an idea to view and edit</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  or add a new idea
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Idea Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">New Idea</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Short, descriptive title"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  value={newIdea.title}
                  onChange={e => setNewIdea({ ...newIdea, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Team', 'Product', 'Process', 'General'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewIdea({ ...newIdea, category: cat as IdeaCategory })}
                      className={`text-sm py-2 px-3 rounded-lg border transition-all text-left flex items-center gap-2 ${newIdea.category === cat
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      {getCategoryIcon(cat as IdeaCategory)} {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                <div className="flex gap-4">
                  {(['Low', 'Medium', 'High'] as IdeaPriority[]).map(p => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        className="text-indigo-600 focus:ring-indigo-500"
                        checked={newIdea.priority === p}
                        onChange={() => setNewIdea({ ...newIdea, priority: p })}
                      />
                      <span className={`text-sm ${p === 'High' ? 'text-red-500 font-medium' :
                        p === 'Medium' ? 'text-orange-500' : 'text-slate-500'
                        }`}>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  required
                  placeholder="Describe the idea, enhancement or improvement..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors h-32 resize-none"
                  value={newIdea.description}
                  onChange={e => setNewIdea({ ...newIdea, description: e.target.value })}
                />
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
                  Add Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaBoard;