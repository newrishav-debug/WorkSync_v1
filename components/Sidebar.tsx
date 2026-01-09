import React, { useState } from 'react';
import { Activity, Layout, CheckSquare, Sun, Moon, Zap, FolderKanban, Lightbulb, Calendar, Home, Link, Settings, ChevronUp, ChevronDown, Check, StickyNote, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { AppTab } from '../types';
import { useAuth } from './AuthContext';

interface SidebarProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  tabOrder: AppTab[];
  onReorderTabs: (newOrder: AppTab[]) => void;
}

const ALL_NAV_ITEMS: Record<AppTab, { label: string; icon: any }> = {
  home: { label: 'Homepage', icon: Home },
  engagements: { label: 'Engagements', icon: Layout },
  calendar: { label: 'Calendar', icon: Calendar },
  tasks: { label: 'Task Tracker', icon: CheckSquare },
  highlights: { label: 'Highlights', icon: Zap },
  projects: { label: 'Internal Projects', icon: FolderKanban },
  ideas: { label: 'Idea Board', icon: Lightbulb },
  links: { label: 'Useful Links', icon: Link },
  notes: { label: 'Notes', icon: StickyNote },
};

// User section component showing current user and logout button
const UserSection: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { user, logout } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="w-full mt-2 space-y-2">
      <div className={`hidden lg:flex items-center gap-3 px-2 py-2 w-full ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
          {initials}
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
        )}
      </div>
      <button
        onClick={logout}
        className={`w-full flex items-center justify-center ${!isCollapsed ? 'lg:justify-start' : ''} p-2 rounded-lg text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors`}
        title={isCollapsed ? "Logout" : undefined}
      >
        <LogOut size={20} />
        {!isCollapsed && <span className="hidden lg:block ml-3 text-sm font-medium">Logout</span>}
      </button>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isDarkMode,
  toggleDarkMode,
  tabOrder,
  onReorderTabs
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...tabOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    onReorderTabs(newOrder);
  };

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-20 lg:w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 relative`}>

      {/* Collapse Toggle Button - Always visible on desktop */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3 top-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md z-10 text-slate-500 hover:text-indigo-600 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo Area */}
      <button
        onClick={() => onTabChange('home')}
        className={`h-16 flex items-center justify-center ${!isCollapsed ? 'lg:justify-start lg:px-6' : ''} border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full overflow-hidden`}
      >
        <div className="bg-indigo-600 text-white p-1.5 rounded-lg flex-shrink-0">
          <Activity size={24} />
        </div>
        {!isCollapsed && (
          <h1 className="hidden lg:block ml-3 text-lg font-bold bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent whitespace-nowrap">
            WorkSync
          </h1>
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-2 px-2 lg:px-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {(tabOrder && tabOrder.length > 0 ? tabOrder : (Object.keys(ALL_NAV_ITEMS) as AppTab[])).map((tabId, index) => {
          const item = ALL_NAV_ITEMS[tabId];
          if (!item) return null; // Safety check
          const Icon = item.icon;
          const isActive = currentTab === tabId;

          return (
            <div key={tabId} className="relative group">
              <button
                disabled={isEditMode}
                onClick={() => onTabChange(tabId)}
                className={`w-full flex items-center justify-center ${!isCollapsed ? 'lg:justify-start' : ''} p-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 font-medium shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  } ${isEditMode ? 'opacity-50 cursor-default border border-dashed border-slate-300 dark:border-slate-700' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={22} className={`flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`} />
                {!isCollapsed && <span className="hidden lg:block ml-3 text-sm truncate">{item.label}</span>}
              </button>

              {isEditMode && !isCollapsed && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 bg-white dark:bg-slate-800 rounded shadow-md p-0.5 border border-slate-200 dark:border-slate-700 z-10">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === tabOrder.length - 1}
                    className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Controls */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center lg:items-start gap-2">

        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`w-full flex items-center justify-center ${!isCollapsed ? 'lg:justify-start' : ''} p-2 rounded-lg transition-colors
            ${isEditMode
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          title={isCollapsed ? (isEditMode ? 'Done Customizing' : 'Customize Sidebar') : undefined}
        >
          {isEditMode ? <Check size={20} /> : <Settings size={20} />}
          {!isCollapsed && (
            <span className="hidden lg:block ml-3 text-sm font-medium truncate">
              {isEditMode ? 'Done' : 'Customize'}
            </span>
          )}
        </button>

        <button
          onClick={toggleDarkMode}
          className={`w-full flex items-center justify-center ${!isCollapsed ? 'lg:justify-start' : ''} p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors`}
          title={isCollapsed ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : undefined}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          {!isCollapsed && (
            <span className="hidden lg:block ml-3 text-sm font-medium truncate">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        <UserSection isCollapsed={isCollapsed} />
      </div>
    </div>
  );
};

export default Sidebar;
