import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Idea, IdeaEntry, IdeaCategory, IdeaPriority, IdeaStatus, Engagement, InternalProject } from '../types';
import { Plus, Lightbulb, Trash2, X, AlertCircle, Users, Settings, Tag, Filter, Calendar, ArrowUpDown, Send, Sparkles, Loader2, Link2, FolderPlus, ExternalLink, Briefcase } from 'lucide-react';
import { generateIdeaSummary } from '../services/geminiService';
import { convertIdeaToProjectAPI } from '../services/apiService';

interface IdeaBoardProps {
  ideas: Idea[];
  onAddIdea: (idea: Idea) => void;
  onUpdateIdea: (idea: Idea) => void;
  onDeleteIdea: (id: string) => void;
  engagements?: Engagement[];
  onAddProject?: (project: InternalProject) => void;
  onNavigateToProject?: (projectId: string) => void;
}

const IdeaBoard: React.FC<IdeaBoardProps> = ({ ideas, onAddIdea, onUpdateIdea, onDeleteIdea, engagements = [], onAddProject, onNavigateToProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<IdeaCategory | 'All'>('All');

  // Entry sort order (newest first / oldest first) for the detail view
  const [entrySortOrder, setEntrySortOrder] = useState<'newest' | 'oldest'>('oldest');

  // Editing state for auto-save
  const [editTitle, setEditTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Engagement search state
  const [engSearchTerm, setEngSearchTerm] = useState('');
  const [engSearchFocused, setEngSearchFocused] = useState(false);
  const [modalEngSearchTerm, setModalEngSearchTerm] = useState('');
  const [modalEngSearchFocused, setModalEngSearchFocused] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const entryInputRef = useRef<HTMLTextAreaElement>(null);

  const [newIdea, setNewIdea] = useState<Partial<Idea>>({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    status: 'New',
    engagementId: '',
    engagementName: ''
  });

  const selectedIdea = ideas.find(i => i.id === selectedIdeaId);

  // Sync local state when selected idea changes
  useEffect(() => {
    if (selectedIdea) {
      setEditTitle(selectedIdea.title);
      setNewEntryContent('');
      setLastSaved(null);
    }
  }, [selectedIdeaId, selectedIdea?.id]);

  // Auto-save title changes
  const saveTitleChange = useCallback(() => {
    if (!selectedIdea) return;

    if (editTitle !== selectedIdea.title) {
      setIsSaving(true);
      const updatedIdea: Idea = {
        ...selectedIdea,
        title: editTitle
      };
      onUpdateIdea(updatedIdea);
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [selectedIdea, editTitle, onUpdateIdea]);

  // Debounced auto-save for title
  useEffect(() => {
    if (!selectedIdea) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveTitleChange();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editTitle, selectedIdea?.id]);

  // Check if we need a new date header (more than 1 day gap)
  const needsNewDateHeader = (currentTimestamp: string, previousTimestamp: string | null): boolean => {
    if (!previousTimestamp) return true;
    const current = new Date(currentTimestamp);
    const previous = new Date(previousTimestamp);
    const diffMs = Math.abs(current.getTime() - previous.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 1;
  };

  // Format date for header display
  const formatDateHeader = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Add a new entry
  const addEntry = () => {
    if (!selectedIdea || !newEntryContent.trim()) return;

    const newEntry: IdeaEntry = {
      id: crypto.randomUUID(),
      content: newEntryContent.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedIdea: Idea = {
      ...selectedIdea,
      entries: [...(selectedIdea.entries || []), newEntry],
      updatedAt: new Date().toISOString()
    };

    setIsSaving(true);
    onUpdateIdea(updatedIdea);
    setNewEntryContent('');
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 500);
  };

  // Handle Enter key in entry input
  const handleEntryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addEntry();
    }
  };

  // Delete an entry
  const deleteEntry = (entryId: string) => {
    if (!selectedIdea) return;

    const updatedEntries = (selectedIdea.entries || []).filter(e => e.id !== entryId);
    const updatedIdea: Idea = {
      ...selectedIdea,
      entries: updatedEntries,
      updatedAt: new Date().toISOString()
    };

    onUpdateIdea(updatedIdea);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.title?.trim() || !newIdea.description?.trim()) return;

    const now = new Date().toISOString();
    const firstEntry: IdeaEntry = {
      id: crypto.randomUUID(),
      content: newIdea.description,
      timestamp: now
    };

    const idea: Idea = {
      id: crypto.randomUUID(),
      title: newIdea.title,
      description: newIdea.description, // Keep for backwards compatibility
      entries: [firstEntry],
      category: newIdea.category as IdeaCategory,
      priority: newIdea.priority as IdeaPriority,
      status: 'New',
      createdAt: now,
      engagementId: newIdea.engagementId || undefined,
      engagementName: newIdea.engagementName || undefined
    };

    onAddIdea(idea);
    setNewIdea({ title: '', description: '', category: 'General', priority: 'Medium', status: 'New', engagementId: '', engagementName: '' });
    setIsModalOpen(false);
    setSelectedIdeaId(idea.id);
    setTimeout(() => entryInputRef.current?.focus(), 100);
  };

  // Convert idea to project
  const handleConvertToProject = async () => {
    if (!selectedIdea || !onAddProject) return;

    setIsConverting(true);
    try {
      const project = await convertIdeaToProjectAPI(selectedIdea.id, {
        startDate: new Date().toISOString().slice(0, 10)
      });

      // Update local idea state with converted status
      const updatedIdea: Idea = {
        ...selectedIdea,
        convertedToProjectId: project.id,
        status: 'Implemented'
      };
      onUpdateIdea(updatedIdea);

      // Add the new project
      onAddProject(project);

      // Navigate to the project if handler provided
      if (onNavigateToProject) {
        onNavigateToProject(project.id);
      }
    } catch (error) {
      console.error('Failed to convert idea to project:', error);
      alert('Failed to convert idea to project. Please try again.');
    } finally {
      setIsConverting(false);
    }
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

  // Sort ideas in list by creation date (newest first)
  const filteredIdeas = ideas
    .filter(idea => filterCategory === 'All' || idea.category === filterCategory)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Get sorted entries for display
  const getSortedEntries = (entries: IdeaEntry[]): IdeaEntry[] => {
    const sorted = [...(entries || [])].sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return entrySortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });
    return sorted;
  };

  // Get first entry content for preview
  const getIdeaPreview = (idea: Idea): string => {
    if (idea.entries && idea.entries.length > 0) {
      return idea.entries[0].content;
    }
    return idea.description || '';
  };

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
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2">{getIdeaPreview(idea)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getStatusColor(idea.status)}`}>
                      {idea.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {idea.entries?.length || 1} {(idea.entries?.length || 1) === 1 ? 'entry' : 'entries'}
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEntrySortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title={`Currently showing ${entrySortOrder} first`}
                  >
                    <ArrowUpDown size={14} />
                    {entrySortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
                  </button>
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
                    Created {new Date(selectedIdea.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                {/* Engagement Link & Convert to Project */}
                <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 relative">
                    <Briefcase size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Engagement:</span>
                    <div className="relative">
                      <input
                        type="text"
                        className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 w-48 focus:ring-2 focus:ring-indigo-500"
                        placeholder="Search by Eng #..."
                        value={engSearchTerm || (selectedIdea.engagementId ? engagements.find(e => e.id === selectedIdea.engagementId)?.engagementNumber || '' : '')}
                        onChange={(e) => setEngSearchTerm(e.target.value)}
                        onFocus={() => {
                          setEngSearchFocused(true);
                          setEngSearchTerm('');
                        }}
                        onBlur={() => setTimeout(() => setEngSearchFocused(false), 200)}
                      />
                      {engSearchFocused && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700"
                            onClick={() => {
                              onUpdateIdea({ ...selectedIdea, engagementId: undefined, engagementName: undefined });
                              setEngSearchTerm('');
                              setEngSearchFocused(false);
                            }}
                          >
                            None (General Idea)
                          </button>
                          {engagements
                            .filter(eng =>
                              !engSearchTerm ||
                              eng.engagementNumber.toLowerCase().includes(engSearchTerm.toLowerCase()) ||
                              eng.accountName.toLowerCase().includes(engSearchTerm.toLowerCase())
                            )
                            .map(eng => (
                              <button
                                key={eng.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                                onClick={() => {
                                  onUpdateIdea({ ...selectedIdea, engagementId: eng.id, engagementName: eng.name });
                                  setEngSearchTerm('');
                                  setEngSearchFocused(false);
                                }}
                              >
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{eng.engagementNumber}</span>
                                <span className="text-slate-500 dark:text-slate-400"> - {eng.accountName}</span>
                              </button>
                            ))
                          }
                          {engagements.filter(eng =>
                            !engSearchTerm ||
                            eng.engagementNumber.toLowerCase().includes(engSearchTerm.toLowerCase()) ||
                            eng.accountName.toLowerCase().includes(engSearchTerm.toLowerCase())
                          ).length === 0 && (
                              <div className="px-3 py-2 text-xs text-slate-400 italic">No matching engagements</div>
                            )}
                        </div>
                      )}
                    </div>
                    {selectedIdea.engagementId && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                        {engagements.find(e => e.id === selectedIdea.engagementId)?.accountName || 'Linked'}
                      </span>
                    )}
                  </div>
                  {/* Convert to Project Button */}
                  {!selectedIdea.convertedToProjectId && onAddProject && (
                    <button
                      onClick={handleConvertToProject}
                      disabled={isConverting}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg transition-colors shadow-sm"
                      title="Convert this idea into an internal project"
                    >
                      {isConverting ? (
                        <><Loader2 size={12} className="animate-spin" /> Converting...</>
                      ) : (
                        <><FolderPlus size={14} /> Convert to Project</>
                      )}
                    </button>
                  )}
                  {/* Show link to project if converted */}
                  {selectedIdea.convertedToProjectId && (
                    <div className="ml-auto flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg">
                      <FolderPlus size={14} />
                      <span className="font-medium">Converted to Project</span>
                      {onNavigateToProject && (
                        <button
                          onClick={() => onNavigateToProject(selectedIdea.convertedToProjectId!)}
                          className="text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink size={10} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="px-6 pt-4">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-2xl font-bold bg-transparent border-none pb-2 focus:outline-none text-slate-800 dark:text-white placeholder-slate-400"
                  placeholder="Idea title..."
                />
              </div>

              {/* AI Summary Section */}
              <div className="mx-6 mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-500" />
                    AI Summary
                  </h4>
                  <button
                    onClick={async () => {
                      if (!selectedIdea) return;
                      setIsGeneratingSummary(true);
                      try {
                        const summary = await generateIdeaSummary(selectedIdea);
                        onUpdateIdea({
                          ...selectedIdea,
                          aiSummary: summary,
                          lastSummaryDate: new Date().toISOString()
                        });
                      } catch (error) {
                        console.error('Failed to generate summary:', error);
                        alert('Failed to generate summary. Please check your API key.');
                      } finally {
                        setIsGeneratingSummary(false);
                      }
                    }}
                    disabled={isGeneratingSummary || !selectedIdea.entries?.length}
                    className="text-xs bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isGeneratingSummary ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        {selectedIdea.aiSummary ? 'Refresh' : 'Generate'}
                      </>
                    )}
                  </button>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedIdea.aiSummary ? (
                    <>
                      <p className="whitespace-pre-wrap">{selectedIdea.aiSummary}</p>
                      {selectedIdea.lastSummaryDate && (
                        <p className="text-[10px] text-slate-400 mt-2">
                          Generated: {new Date(selectedIdea.lastSummaryDate).toLocaleString()}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 italic text-xs">
                      {selectedIdea.entries?.length ? 'Click "Generate" to create an AI summary of this idea\'s evolution.' : 'Add some entries first, then generate a summary.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Entries Timeline */}
              <div className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
                {(() => {
                  const sortedEntries = getSortedEntries(selectedIdea.entries || []);
                  let lastDateHeader: string | null = null;

                  return sortedEntries.map((entry, index) => {
                    const showHeader = needsNewDateHeader(
                      entry.timestamp,
                      index > 0 ? sortedEntries[index - 1].timestamp : null
                    );

                    const dateHeader = showHeader ? formatDateHeader(entry.timestamp) : null;

                    // For oldest-first, we check against previous entry
                    // For newest-first, headers work the same way
                    const displayHeader = dateHeader && dateHeader !== lastDateHeader;
                    if (displayHeader) {
                      lastDateHeader = dateHeader;
                    }

                    return (
                      <div key={entry.id}>
                        {displayHeader && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">
                              {dateHeader}
                            </span>
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                          </div>
                        )}
                        <div className="group relative mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed pr-8">
                            {entry.content}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-slate-400">
                              {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded transition-all"
                              title="Delete entry"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}

                {(!selectedIdea.entries || selectedIdea.entries.length === 0) && (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No entries yet. Add your first entry below.</p>
                  </div>
                )}
              </div>

              {/* Add Entry Input */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex gap-2">
                  <textarea
                    ref={entryInputRef}
                    value={newEntryContent}
                    onChange={(e) => setNewEntryContent(e.target.value)}
                    onKeyDown={handleEntryKeyDown}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Add a new entry... (Press Enter to save)"
                    rows={2}
                  />
                  <button
                    onClick={addEntry}
                    disabled={!newEntryContent.trim()}
                    className="self-end bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Press Enter to add entry, Shift+Enter for new line
                </p>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Entry</label>
                <textarea
                  required
                  placeholder="Describe the idea, enhancement or improvement..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors h-32 resize-none"
                  value={newIdea.description}
                  onChange={e => setNewIdea({ ...newIdea, description: e.target.value })}
                />
              </div>

              {/* Engagement Selector (Optional) */}
              {engagements.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={14} />
                      Link to Engagement <span className="text-slate-400 font-normal">(Optional)</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                      placeholder="Search by Engagement Number..."
                      value={modalEngSearchTerm || (newIdea.engagementId ? engagements.find(e => e.id === newIdea.engagementId)?.engagementNumber || '' : '')}
                      onChange={(e) => setModalEngSearchTerm(e.target.value)}
                      onFocus={() => {
                        setModalEngSearchFocused(true);
                        setModalEngSearchTerm('');
                      }}
                      onBlur={() => setTimeout(() => setModalEngSearchFocused(false), 200)}
                    />
                    {newIdea.engagementId && (
                      <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                        Selected: {engagements.find(e => e.id === newIdea.engagementId)?.accountName} - {newIdea.engagementName}
                      </div>
                    )}
                    {modalEngSearchFocused && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700"
                          onClick={() => {
                            setNewIdea({ ...newIdea, engagementId: '', engagementName: '' });
                            setModalEngSearchTerm('');
                            setModalEngSearchFocused(false);
                          }}
                        >
                          None (General Idea)
                        </button>
                        {engagements
                          .filter(eng =>
                            !modalEngSearchTerm ||
                            eng.engagementNumber.toLowerCase().includes(modalEngSearchTerm.toLowerCase()) ||
                            eng.accountName.toLowerCase().includes(modalEngSearchTerm.toLowerCase())
                          )
                          .map(eng => (
                            <button
                              key={eng.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                              onClick={() => {
                                setNewIdea({ ...newIdea, engagementId: eng.id, engagementName: eng.name });
                                setModalEngSearchTerm('');
                                setModalEngSearchFocused(false);
                              }}
                            >
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{eng.engagementNumber}</span>
                              <span className="text-slate-500 dark:text-slate-400"> - {eng.accountName}</span>
                            </button>
                          ))
                        }
                        {engagements.filter(eng =>
                          !modalEngSearchTerm ||
                          eng.engagementNumber.toLowerCase().includes(modalEngSearchTerm.toLowerCase()) ||
                          eng.accountName.toLowerCase().includes(modalEngSearchTerm.toLowerCase())
                        ).length === 0 && (
                            <div className="px-3 py-2 text-sm text-slate-400 italic">No matching engagements</div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              )}

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