import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ServerCrash, Users, Activity } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const problems = [
  {
    icon: <ServerCrash className="w-10 h-10 text-rose-500 dark:text-rose-400 group-hover:scale-110 transition-transform" />,
    title: "Outdated Infrastructure",
    description: "Schools rely on fragmented legacy software, leading to communication gaps and missing data."
  },
  {
    icon: <Users className="w-10 h-10 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform" />,
    title: "Poor Engagement",
    description: "Traditional classroom models fail to effectively capture the attention of digital-native students."
  },
  {
    icon: <Activity className="w-10 h-10 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />,
    title: "No Real-Time Tracking",
    description: "Teachers and parents lack instant analytics into student performance, attendance, and health."
  }
];

const ProblemSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if(!sectionRef.current) return;
    
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
      }
    });

    tl.fromTo('.prob-header',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    )
    .fromTo('.prob-card',
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.2, ease: 'back.out(1.2)' },
      '-=0.3'
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-white dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col items-center">
          <div className="prob-header px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-xs mb-6 shadow-sm border border-rose-200 dark:border-rose-800/50">
            The Current Challenge
          </div>
          <h2 className="prob-header text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            Why Schools Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">Falling Behind</span>
          </h2>
          <p className="prob-header text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
            Education hasn't evolved as fast as the rest of the world. We identified three major bottlenecks hindering school growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {problems.map((problem, idx) => (
            <div 
              key={idx}
              className="prob-card group bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:shadow-rose-500/10 hover:border-rose-500/30 transition-all duration-500 relative overflow-hidden flex flex-col h-full"
            >
              {/* Card hover effect BG */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-orange-500/0 group-hover:from-rose-500/5 group-hover:to-orange-500/5 transition-colors duration-500" />
              
              <div className="relative z-10 flex-grow flex flex-col">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:-translate-y-2 transition-transform duration-500">
                  {problem.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">{problem.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg flex-grow">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
