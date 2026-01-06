import React, { useState } from 'react';
import { Idea, IdeaCategory, IdeaPriority, IdeaStatus } from '../types';
import { Plus, Lightbulb, Trash2, X, AlertCircle, Users, Settings, Tag, Filter, Pencil } from 'lucide-react';

interface IdeaBoardProps {
  ideas: Idea[];
  onAddIdea: (idea: Idea) => void;
  onUpdateIdea: (idea: Idea) => void;
  onDeleteIdea: (id: string) => void;
}

const IdeaBoard: React.FC<IdeaBoardProps> = ({ ideas, onAddIdea, onUpdateIdea, onDeleteIdea }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [filterCategory, setFilterCategory] = useState<IdeaCategory | 'All'>('All');

  const [newIdea, setNewIdea] = useState<Partial<Idea>>({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    status: 'New'
  });

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
  };

  const handleEdit = (idea: Idea) => {
    setEditingIdea({ ...idea });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea || !editingIdea.title?.trim() || !editingIdea.description?.trim()) return;
    onUpdateIdea(editingIdea);
    setEditingIdea(null);
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
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-orange-500';
      case 'Low': return 'text-slate-400';
    }
  };

  const filteredIdeas = ideas.filter(idea => filterCategory === 'All' || idea.category === filterCategory);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Lightbulb className="text-amber-500" />
            Idea Board
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Capture ideas, enhancements, and improvement points.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={18} /> Add Idea
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredIdeas.map((idea) => (
          <div key={idea.id} className="group bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col transition-all hover:shadow-md hover:-translate-y-1">
            <div className="flex justify-between items-start mb-3">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${getCategoryColor(idea.category)}`}>
                {getCategoryIcon(idea.category)} {idea.category}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold flex items-center gap-1 ${getPriorityColor(idea.priority)}`} title="Priority">
                  <AlertCircle size={12} /> {idea.priority}
                </span>
                <button
                  onClick={() => handleEdit(idea)}
                  className="text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit idea"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => onDeleteIdea(idea.id)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete idea"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-slate-800 dark:text-white mb-2 line-clamp-2">{idea.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-4 flex-1 whitespace-pre-wrap">
              {idea.description}
            </p>

            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <select
                className={`text-xs font-semibold bg-transparent outline-none cursor-pointer ${idea.status === 'New' ? 'text-blue-600 dark:text-blue-400' :
                  idea.status === 'Planned' ? 'text-purple-600 dark:text-purple-400' :
                    idea.status === 'In Progress' ? 'text-amber-600 dark:text-amber-400' :
                      idea.status === 'Implemented' ? 'text-green-600 dark:text-green-400' :
                        'text-slate-500'
                  }`}
                value={idea.status}
                onChange={(e) => onUpdateIdea({ ...idea, status: e.target.value as IdeaStatus })}
              >
                <option value="New">New</option>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Implemented">Implemented</option>
                <option value="Discarded">Discarded</option>
              </select>
              <span className="text-[10px] text-slate-400">
                {new Date(idea.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}

        {filteredIdeas.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-6">No ideas found. Be the first to add one!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              Add New Idea
            </button>
          </div>
        )}
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

      {/* Edit Idea Modal */}
      {editingIdea && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Edit Idea</h2>
              <button onClick={() => setEditingIdea(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Short, descriptive title"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  value={editingIdea.title}
                  onChange={e => setEditingIdea({ ...editingIdea, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Team', 'Product', 'Process', 'General'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditingIdea({ ...editingIdea, category: cat as IdeaCategory })}
                      className={`text-sm py-2 px-3 rounded-lg border transition-all text-left flex items-center gap-2 ${editingIdea.category === cat
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
                        name="editPriority"
                        className="text-indigo-600 focus:ring-indigo-500"
                        checked={editingIdea.priority === p}
                        onChange={() => setEditingIdea({ ...editingIdea, priority: p })}
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
                  value={editingIdea.description}
                  onChange={e => setEditingIdea({ ...editingIdea, description: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Save Changes
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