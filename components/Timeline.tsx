import React from 'react';
import { TimelineEntry } from '../types';
import { Circle, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface TimelineProps {
  entries: TimelineEntry[];
}

const Timeline: React.FC<TimelineProps> = ({ entries }) => {
  // Sort entries by date descending
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 dark:text-slate-500 italic">
        No timeline updates yet. Start by adding a new entry.
      </div>
    );
  }

  const getIcon = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'issue': return <AlertCircle className="w-5 h-5 text-white" />;
      case 'milestone': return <CheckCircle className="w-5 h-5 text-white" />;
      case 'meeting': return <Clock className="w-5 h-5 text-white" />;
      default: return <Circle className="w-4 h-4 text-white" />;
    }
  };

  const getBgColor = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'issue': return 'bg-red-500 ring-red-100 dark:ring-red-900/30';
      case 'milestone': return 'bg-green-500 ring-green-100 dark:ring-green-900/30';
      case 'meeting': return 'bg-purple-500 ring-purple-100 dark:ring-purple-900/30';
      default: return 'bg-blue-500 ring-blue-100 dark:ring-blue-900/30';
    }
  };

  return (
    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8 pb-4">
      {sortedEntries.map((entry) => (
        <div key={entry.id} className="relative pl-8">
          {/* Icon Marker */}
          <div className={`absolute -left-[11px] top-1 flex items-center justify-center w-6 h-6 rounded-full ring-4 ${getBgColor(entry.type)}`}>
            {getIcon(entry.type)}
          </div>
          
          {/* Content Card */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-1">
              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 capitalize 
                ${entry.type === 'issue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 
                  entry.type === 'milestone' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                {entry.type}
              </span>
              <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
            </div>
            <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
              {new Date(entry.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;