import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { X, Calendar as CalendarIcon, Clock, Briefcase, CheckSquare, Save, Trash2 } from 'lucide-react';

interface EventDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, onUpdate, onDelete }) => {
  const [notes, setNotes] = useState(event.meetingNotes || '');
  const [momSent, setMomSent] = useState(event.momSent || false);

  useEffect(() => {
    setNotes(event.meetingNotes || '');
    setMomSent(event.momSent || false);
  }, [event]);

  const handleSave = () => {
    onUpdate({
      ...event,
      meetingNotes: notes,
      momSent: momSent,
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate pr-4">{event.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
           {/* Metadata */}
           <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                 <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CalendarIcon size={16} className="text-slate-400" />
                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}
                 </div>
                 <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Clock size={16} className="text-slate-400" />
                    {event.startTime} - {event.endTime}
                 </div>
              </div>
              <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${
                 event.type === 'meeting' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300' :
                 event.type === 'work' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' :
                 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300'
              }`}>
                {event.type}
              </span>
           </div>

           {event.description && (
             <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
               {event.description}
             </div>
           )}

           <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white mb-2">
                   <Briefcase size={16} className="text-indigo-500" /> Meeting Context / Notes
                </label>
                <textarea 
                   className="w-full h-32 p-3 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-colors text-slate-700 dark:text-slate-200 placeholder-slate-400"
                   placeholder="Add detailed notes, agenda items, or key takeaways..."
                   value={notes}
                   onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                 <label className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white mb-2">
                    Action Items
                 </label>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                    <input 
                       type="checkbox" 
                       id="momSentDetail"
                       className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                       checked={momSent}
                       onChange={(e) => setMomSent(e.target.checked)}
                    />
                    <label htmlFor="momSentDetail" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                       Minutes of Meeting (MOM) Sent
                    </label>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center gap-3">
           <button 
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
           >
              <Trash2 size={16} /> Delete
           </button>
           <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
           >
              <Save size={16} /> Save Changes
           </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;