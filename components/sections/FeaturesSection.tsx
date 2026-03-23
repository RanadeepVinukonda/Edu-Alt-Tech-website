import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, Clock, CheckCircle, Bell, FileText, CheckSquare, MessageSquare, GraduationCap } from 'lucide-react';

const tabs = ['Students', 'Teachers', 'Parents'];

const featuresData = {
  Students: [
    { icon: <Calendar className="w-5 h-5" />, title: 'Timetable & Reminders', desc: 'Stay on top of every class and deadline automatically.' },
    { icon: <BookOpen className="w-5 h-5" />, title: 'Homework Tracking', desc: 'Access and submit assignments digitally from anywhere.' },
    { icon: <CheckCircle className="w-5 h-5" />, title: 'Performance Insights', desc: 'Real-time analytics on your strengths and weaknesses.' },
  ],
  Teachers: [
    { icon: <CheckSquare className="w-5 h-5" />, title: 'Attendance Management', desc: 'One-click attendance tracking synced globally.' },
    { icon: <FileText className="w-5 h-5" />, title: 'Assignment Uploads', desc: 'Distribute and grade homework efficiently online.' },
    { icon: <GraduationCap className="w-5 h-5" />, title: 'Progress Tracking', desc: 'Monitor individual student outcomes seamlessly.' },
  ],
  Parents: [
    { icon: <Clock className="w-5 h-5" />, title: 'Real-Time Updates', desc: 'Always know what your child is learning today.' },
    { icon: <Bell className="w-5 h-5" />, title: 'Instant Notifications', desc: 'Receive alerts for absences, low grades, or praise.' },
    { icon: <MessageSquare className="w-5 h-5" />, title: 'Student Reports', desc: 'Comprehensive monthly performance reports.' },
  ],
};

const FeaturesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<keyof typeof featuresData>('Students');

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-emerald-500 font-semibold tracking-wide uppercase text-sm mb-3">Empowering Everyone</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Built for the Entire Ecosystem</h2>
        </div>

        <div className="flex flex-col items-center">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-full mb-12 shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-colors duration-200 ${
                  activeTab === tab ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeFeatureTab"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-sm"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="w-full max-w-5xl overflow-hidden min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {featuresData[activeTab].map((feat, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                      {feat.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feat.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{feat.desc}</p>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
