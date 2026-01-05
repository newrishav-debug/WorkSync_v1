import React, { useState, useMemo } from 'react';
import { Highlight } from '../types';
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Zap } from 'lucide-react';

interface HighlightsProps {
  highlights: Highlight[];
  onAddHighlight: (highlight: Highlight) => void;
  onUpdateHighlight: (highlight: Highlight) => void;
  onDeleteHighlight: (id: string) => void;
}

const Highlights: React.FC<HighlightsProps> = ({ 
  highlights, 
  onAddHighlight, 
  onUpdateHighlight, 
  onDeleteHighlight 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newHighlightContent, setNewHighlightContent] = useState('');

  // Derived state for the month view
  const currentMonthYear = useMemo(() => {
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const monthStart = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return date.toISOString().slice(0, 7); // "YYYY-MM"
  }, [currentDate]);

  const filteredHighlights = useMemo(() => {
    return highlights
      .filter(h => h.date.startsWith(monthStart))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [highlights, monthStart]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleAddHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighlightContent.trim()) return;

    // Default date to today if we are viewing current month, otherwise 1st of viewed month
    let dateStr = new Date().toISOString().slice(0, 10);
    const today = new Date();
    if (today.getMonth() !== currentDate.getMonth() || today.getFullYear() !== currentDate.getFullYear()) {
      // Viewing a different month, set to 1st of that month for data consistency
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      // Adjust for timezone offset to avoid previous day
      const offset = d.getTimezoneOffset();
      const adjusted = new Date(d.getTime() - (offset*60*1000));
      dateStr = adjusted.toISOString().slice(0, 10);
    }

    const newHighlight: Highlight = {
      id: crypto.randomUUID(),
      content: newHighlightContent,
      impact: '',
      date: dateStr,
      needsFollowUp: false,
      followUpContext: '',
      createdAt: new Date().toISOString()
    };

    onAddHighlight(newHighlight);
    setNewHighlightContent('');
  };

  const handleUpdateField = (highlight: Highlight, field: keyof Highlight, value: any) => {
    onUpdateHighlight({ ...highlight, [field]: value });
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Monthly Highlights</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Capture your wins and key moments for {currentMonthYear}.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Month Navigation Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
          
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
              <Zap size={18} className="text-indigo-500" />
              {currentMonthYear}
              {isCurrentMonth() && <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full ml-2">Current</span>}
            </h3>
          </div>

          <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* List Content */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            {filteredHighlights.length > 0 ? (
              filteredHighlights.map(highlight => (
                <div key={highlight.id} className="group flex flex-col gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all relative">
                  <button 
                    onClick={() => onDeleteHighlight(highlight.id)}
                    className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete highlight"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="pr-8">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 block">Highlight</label>
                     <input 
                       type="text"
                       className="w-full text-base font-semibold text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                       value={highlight.content}
                       onChange={(e) => handleUpdateField(highlight, 'content', e.target.value)}
                       placeholder="Highlight title..."
                     />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 block">Impact</label>
                    <textarea 
                      className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all resize-none h-20"
                      placeholder="Describe the impact of this highlight..."
                      value={highlight.impact}
                      onChange={(e) => handleUpdateField(highlight, 'impact', e.target.value)}
                    />
                  </div>

                  <div className="flex items-start sm:items-center flex-col sm:flex-row gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${highlight.needsFollowUp ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                         {highlight.needsFollowUp && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={highlight.needsFollowUp}
                        onChange={(e) => handleUpdateField(highlight, 'needsFollowUp', e.target.checked)}
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Follow-up needed</span>
                    </label>
                    
                    {highlight.needsFollowUp && (
                      <div className="flex-1 w-full animate-fade-in">
                        <input 
                          type="text"
                          placeholder="Add context for follow-up..."
                          className="w-full text-sm text-slate-700 dark:text-slate-300 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none py-1"
                          value={highlight.followUpContext || ''}
                          onChange={(e) => handleUpdateField(highlight, 'followUpContext', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                 <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap size={24} className="opacity-50 text-indigo-500"/>
                 </div>
                 <p>No highlights recorded for {currentMonthYear}.</p>
                 <p className="text-sm">Capture your wins and key moments!</p>
              </div>
            )}
          </div>

          {/* Add Input */}
          <form onSubmit={handleAddHighlight} className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Plus size={20} />
            </div>
            <input 
              type="text" 
              placeholder={`Add a new highlight for ${currentMonthYear}...`}
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              value={newHighlightContent}
              onChange={(e) => setNewHighlightContent(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!newHighlightContent.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Highlights;