import React from 'react';
import { UserRole } from '../types';
import { BookOpen, Calendar, Users, LayoutDashboard, Settings } from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, setActiveTab }) => {
  const teacherNav = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'courses', label: 'Course Management', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'schedule', label: 'Schedule Class', icon: <Calendar className="w-5 h-5" /> },
    { id: 'students', label: 'Students & Attendance', icon: <Users className="w-5 h-5" /> },
  ];

  const studentNav = [
    { id: 'overview', label: 'My Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'enroll', label: 'Course Catalog', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'upcoming', label: 'Upcoming Classes', icon: <Calendar className="w-5 h-5" /> },
  ];

  const navItems = role === 'teacher' ? teacherNav : studentNav;

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col pt-24 min-h-screen fixed left-0 top-0">
      <div className="px-6 mb-8">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-auto px-6 pb-6">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
