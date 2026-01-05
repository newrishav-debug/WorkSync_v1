import React, { useState } from 'react';
import { Engagement, EngagementStatus } from '../types';
import { X } from 'lucide-react';

interface AddEngagementModalProps {
  onClose: () => void;
  onSave: (engagement: Engagement) => void;
}

const AddEngagementModal: React.FC<AddEngagementModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    engagementNumber: '',
    orgId: '',
    accountName: '',
    name: '',
    status: EngagementStatus.Active
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEngagement: Engagement = {
      id: crypto.randomUUID(),
      ...formData,
      timeline: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        content: 'Engagement created in Work Tracker.',
        type: 'update'
      }],
      files: [],
      aiSummary: null,
      lastSummaryDate: null
    };
    onSave(newEngagement);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">New Engagement</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Engagement #</label>
              <input 
                type="text" 
                required
                placeholder="e.g. ENG-2024-X"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                value={formData.engagementNumber}
                onChange={e => setFormData({...formData, engagementNumber: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Org ID</label>
              <input 
                type="text" 
                required
                placeholder="e.g. ORG-123"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                value={formData.orgId}
                onChange={e => setFormData({...formData, orgId: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
            <input 
              type="text" 
              required
              placeholder="Client Company Name"
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              value={formData.accountName}
              onChange={e => setFormData({...formData, accountName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project/Engagement Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Cloud Migration Phase 1"
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
            <select 
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as EngagementStatus})}
            >
              {Object.values(EngagementStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              Create Engagement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEngagementModal;