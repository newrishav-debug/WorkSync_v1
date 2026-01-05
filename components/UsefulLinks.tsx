import React, { useState } from 'react';
import { UsefulLink } from '../types';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, Search, X } from 'lucide-react';

interface UsefulLinksProps {
  links: UsefulLink[];
  onAddLink: (link: UsefulLink) => void;
  onDeleteLink: (id: string) => void;
}

const UsefulLinks: React.FC<UsefulLinksProps> = ({ links, onAddLink, onDeleteLink }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    category: '',
    description: ''
  });

  const categories = Array.from(new Set(links.map(l => l.category))).sort();
  const defaultCategories = ['Tools', 'Company', 'Reference', 'Learning'];
  const suggestionCategories = Array.from(new Set([...categories, ...defaultCategories]));

  const filteredLinks = links.filter(link => 
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    link.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedLinks = filteredLinks.reduce((acc, link) => {
    if (!acc[link.category]) acc[link.category] = [];
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, UsefulLink[]>);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url) return;
    
    // Auto-prepend https:// if missing
    let formattedUrl = newLink.url;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    onAddLink({
      id: crypto.randomUUID(),
      title: newLink.title,
      url: formattedUrl,
      category: newLink.category || 'General',
      description: newLink.description,
      createdAt: new Date().toISOString()
    });

    setNewLink({ title: '', url: '', category: '', description: '' });
    setIsModalOpen(false);
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <LinkIcon className="text-indigo-500" />
            Useful Links
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Quick access to important tools and resources.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search links..."
               className="w-full md:w-64 pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 flex-shrink-0"
          >
            <Plus size={18} /> Add Link
          </button>
        </div>
      </div>

      {/* Links Grid */}
      {Object.keys(groupedLinks).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {Object.keys(groupedLinks).sort().map(category => (
             <div key={category} className="space-y-3">
                <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider pl-1">{category}</h3>
                <div className="space-y-3">
                   {groupedLinks[category].map(link => (
                     <div key={link.id} className="group relative bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                        <div className="flex gap-4">
                           <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <img 
                                src={getFavicon(link.url) || ''} 
                                alt="icon"
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '';
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }} 
                              />
                              <LinkIcon size={18} className="text-slate-400 hidden" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 group/link"
                              >
                                {link.title} <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                              </a>
                              {link.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                   {link.description}
                                </p>
                              )}
                           </div>
                        </div>
                        <button 
                          onClick={() => onDeleteLink(link.id)}
                          className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                        >
                           <Trash2 size={14} />
                        </button>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
           <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <LinkIcon size={32} className="text-slate-300 dark:text-slate-600" />
           </div>
           <p className="text-slate-500 dark:text-slate-400 mb-6">No links found matching your criteria.</p>
           {links.length === 0 && (
             <button 
               onClick={() => setIsModalOpen(true)}
               className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
             >
               Add Your First Link
             </button>
           )}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
             <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
               <h2 className="text-lg font-bold text-slate-800 dark:text-white">Add Useful Link</h2>
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
                    placeholder="e.g. HR Portal"
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newLink.title}
                    onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL</label>
                  <input 
                    type="text" 
                    required
                    placeholder="https://..."
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newLink.url}
                    onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                   <input 
                     type="text" 
                     list="categories"
                     placeholder="e.g. Tools"
                     className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                     value={newLink.category}
                     onChange={(e) => setNewLink({...newLink, category: e.target.value})}
                   />
                   <datalist id="categories">
                     {suggestionCategories.map(c => <option key={c} value={c} />)}
                   </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                  <textarea 
                    placeholder="Brief description..."
                    rows={2}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    value={newLink.description}
                    onChange={(e) => setNewLink({...newLink, description: e.target.value})}
                  />
                </div>
                
                <div className="pt-2 flex justify-end gap-3">
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
                     Add Link
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsefulLinks;