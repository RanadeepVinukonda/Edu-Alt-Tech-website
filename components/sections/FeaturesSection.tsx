import React, { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen, Calendar, Clock, CheckCircle, Bell, FileText, CheckSquare, MessageSquare, GraduationCap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const tabs = ['Students', 'Teachers', 'Parents'];

const featuresData = {
  Students: [
    { icon: <Calendar className="w-6 h-6" />, title: 'Timetable & Reminders', desc: 'Stay on top of every class and deadline automatically.' },
    { icon: <BookOpen className="w-6 h-6" />, title: 'Homework Tracking', desc: 'Access and submit assignments digitally from anywhere.' },
    { icon: <CheckCircle className="w-6 h-6" />, title: 'Performance Insights', desc: 'Real-time analytics on your strengths and weaknesses.' },
  ],
  Teachers: [
    { icon: <CheckSquare className="w-6 h-6" />, title: 'Attendance Management', desc: 'One-click attendance tracking synced globally.' },
    { icon: <FileText className="w-6 h-6" />, title: 'Assignment Uploads', desc: 'Distribute and grade homework efficiently online.' },
    { icon: <GraduationCap className="w-6 h-6" />, title: 'Progress Tracking', desc: 'Monitor individual student outcomes seamlessly.' },
  ],
  Parents: [
    { icon: <Clock className="w-6 h-6" />, title: 'Real-Time Updates', desc: 'Always know what your child is learning today.' },
    { icon: <Bell className="w-6 h-6" />, title: 'Instant Notifications', desc: 'Receive alerts for absences, low grades, or praise.' },
    { icon: <MessageSquare className="w-6 h-6" />, title: 'Student Reports', desc: 'Comprehensive monthly performance reports.' },
  ],
};

const FeaturesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<keyof typeof featuresData>('Students');
  const sectionRef = useRef<HTMLElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if(!sectionRef.current) return;
    
    gsap.fromTo('.feat-header',
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8, 
        stagger: 0.1, 
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%'
        }
      }
    );
  }, { scope: sectionRef });

  useEffect(() => {
    if(!cardsContainerRef.current) return;
    
    gsap.fromTo(cardsContainerRef.current.children, 
      { opacity: 0, x: 20, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.2)', overwrite: "auto" }
    );
  }, [activeTab]);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="feat-header inline-block px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs mb-6 shadow-sm border border-emerald-200 dark:border-emerald-800/50">
            Empowering Everyone
          </div>
          <h2 className="feat-header text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Built for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500">Entire Ecosystem</span></h2>
        </div>

        <div className="flex flex-col items-center">
          {/* Tabs */}
          <div className="feat-header flex p-1.5 bg-white dark:bg-slate-800 rounded-full mb-16 shadow-lg border border-slate-100 dark:border-slate-700 relative">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`relative px-8 py-4 rounded-full text-sm font-bold transition-colors duration-300 z-10 ${
                  activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {activeTab === tab && (
                  <div className="absolute inset-0 bg-emerald-500 dark:bg-emerald-600 rounded-full shadow-md -z-10" />
                )}
                {tab}
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="w-full max-w-5xl overflow-hidden min-h-[300px]">
             <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {featuresData[activeTab].map((feat, idx) => (
                 <div key={`${activeTab}-${idx}`} className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-300">
                   <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                     {feat.icon}
                   </div>
                   <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-emerald-500 transition-colors">{feat.title}</h3>
                   <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">{feat.desc}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
