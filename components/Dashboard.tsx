import React, { useMemo, useState, useEffect } from 'react';
import { Engagement, EngagementStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Plus, Search, Briefcase, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, Trash2, Pencil } from 'lucide-react';

interface DashboardProps {
  engagements: Engagement[];
  onNavigate: (id: string) => void;
  onAdd: () => void;
  onUpdate: (engagement: Engagement) => void;
  onEdit: (engagement: Engagement) => void;
  onDelete: (ids: string[]) => void;
  isDarkMode?: boolean;
}

type SortKey = 'engagementNumber' | 'orgId' | 'accountName' | 'name' | 'status' | 'lastUpdated';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']; // Green, Red, Amber, Blue

const Dashboard: React.FC<DashboardProps> = ({ engagements, onNavigate, onAdd, onUpdate, onEdit, onDelete, isDarkMode = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear selection when engagements change (e.g. after delete)
  useEffect(() => {
    setSelectedIds(prev => {
      const newSet = new Set<string>();
      prev.forEach(id => {
        if (engagements.find(e => e.id === id)) {
          newSet.add(id);
        }
      });
      return newSet;
    });
  }, [engagements]);

  const filteredEngagements = useMemo(() => {
    return engagements.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.engagementNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [engagements, searchTerm]);

  const sortedEngagements = useMemo(() => {
    let sortableItems = [...filteredEngagements];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'lastUpdated') {
          const getLastDate = (e: Engagement) => e.timeline.length > 0
              ? Math.max(...e.timeline.map(t => new Date(t.date).getTime()))
              : 0;
           aValue = getLastDate(a);
           bValue = getLastDate(b);
        } else {
          aValue = a[sortConfig.key as keyof Engagement] || '';
          bValue = b[sortConfig.key as keyof Engagement] || '';
        }

        // Handle case insensitive string sorting
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredEngagements, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedEngagements.length && sortedEngagements.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedEngagements.map(e => e.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    onDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const stats = useMemo(() => {
    const data = [
      { name: 'Completed', value: 0, color: COLORS[0] },
      { name: 'At Risk', value: 0, color: COLORS[1] },
      { name: 'On Hold', value: 0, color: COLORS[2] },
      { name: 'Active', value: 0, color: COLORS[3] },
    ];
    
    engagements.forEach(e => {
      if (e.status === EngagementStatus.Completed) data[0].value++;
      else if (e.status === EngagementStatus.AtRisk) data[1].value++;
      else if (e.status === EngagementStatus.OnHold) data[2].value++;
      else data[3].value++;
    });
    
    return data.filter(d => d.value > 0);
  }, [engagements]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-indigo-500" /> 
      : <ArrowDown size={14} className="ml-1 text-indigo-500" />;
  };

  const SortableHeader = ({ label, sortKey, className = "" }: { label: string, sortKey: SortKey, className?: string }) => (
    <th 
      className={`px-6 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none ${className}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon columnKey={sortKey} />
      </div>
    </th>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-center transition-colors">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400">
            You are currently tracking <span className="font-bold text-indigo-600 dark:text-indigo-400">{engagements.length}</span> engagements across multiple clients. 
            There are <span className="font-bold text-red-500 dark:text-red-400">{engagements.filter(e => e.status === EngagementStatus.AtRisk).length}</span> engagements flagged as 'At Risk' requiring attention.
          </p>
          <div className="mt-4 flex gap-3">
             <button onClick={onAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                <Plus size={18} />
                New Engagement
             </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center h-80 transition-colors">
           <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 w-full text-left">Engagement Status</h3>
           {engagements.length > 0 ? (
             <div className="w-full flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke={isDarkMode ? '#0f172a' : '#fff'}
                  >
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '8px'
                    }}
                    itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm italic w-full">
               <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                 <Briefcase size={20} className="text-slate-300 dark:text-slate-600" />
               </div>
               No data available
             </div>
           )}
        </div>
      </div>

      {/* Filter & List Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Bulk Actions Bar - Appears when items are selected */}
        {selectedIds.size > 0 ? (
           <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-4 animate-fade-in">
             <div className="flex items-center gap-3">
               <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md">{selectedIds.size}</span>
               <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Selected</span>
             </div>
             <div className="flex items-center gap-2">
               <button 
                 onClick={handleBulkDelete}
                 className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
               >
                 <Trash2 size={16} /> Delete Selected
               </button>
             </div>
           </div>
        ) : (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="text-indigo-500" size={20}/>
              Active Engagements
            </h2>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, account, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="w-12 px-6 py-4">
                   <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={selectedIds.size === sortedEngagements.length && sortedEngagements.length > 0}
                    onChange={toggleSelectAll}
                   />
                </th>
                <SortableHeader label="Engagement" sortKey="engagementNumber" />
                <SortableHeader label="Org ID" sortKey="orgId" />
                <SortableHeader label="Account" sortKey="accountName" />
                <SortableHeader label="Project Name" sortKey="name" />
                <SortableHeader label="Status" sortKey="status" />
                <SortableHeader label="Last Updated" sortKey="lastUpdated" />
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedEngagements.map((eng) => (
                <tr key={eng.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${selectedIds.has(eng.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={selectedIds.has(eng.id)}
                      onChange={() => toggleSelectOne(eng.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onNavigate(eng.id)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline decoration-2 underline-offset-2"
                    >
                      {eng.engagementNumber}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-sm">{eng.orgId}</td>
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 text-sm">{eng.accountName}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{eng.name}</td>
                  <td className="px-6 py-4">
                    <div className="relative inline-block w-full max-w-[140px]">
                      <select
                        value={eng.status}
                        onChange={(e) => onUpdate({...eng, status: e.target.value as EngagementStatus})}
                        className={`w-full appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 border-0
                          ${eng.status === EngagementStatus.Active ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            eng.status === EngagementStatus.Completed ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            eng.status === EngagementStatus.AtRisk ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}
                      >
                        {Object.values(EngagementStatus).map(s => (
                          <option key={s} value={s} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-200">
                            {s}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 opacity-60">
                        <ChevronDown size={12} className={
                          eng.status === EngagementStatus.Active ? 'text-blue-800 dark:text-blue-300' :
                          eng.status === EngagementStatus.Completed ? 'text-green-800 dark:text-green-300' :
                          eng.status === EngagementStatus.AtRisk ? 'text-red-800 dark:text-red-300' :
                          'text-amber-800 dark:text-amber-300'
                        } />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-sm">
                    {eng.timeline.length > 0 
                      ? new Date(Math.max(...eng.timeline.map(t => new Date(t.date).getTime()))).toLocaleDateString()
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => onEdit(eng)}
                         className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                         title="Edit Engagement"
                       >
                         <Pencil size={16} />
                       </button>
                       <button 
                         onClick={() => onDelete([eng.id])}
                         className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                         title="Delete Engagement"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEngagements.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    {engagements.length === 0 
                      ? "No engagements yet. Create your first one!" 
                      : "No engagements found matching your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;