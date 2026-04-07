import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Network, Database, BrainCircuit, Target } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CurriculumSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if(!sectionRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
      }
    });

    tl.fromTo('.curr-text', 
      { opacity: 0, x: 40 },
      { opacity: 1, x: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
    )
    .fromTo('.curr-feature',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out' },
      '-=0.4'
    );

    gsap.fromTo('.curr-card',
      { opacity: 0, x: -40, rotationY: -15 },
      { opacity: 1, x: 0, rotationY: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' } }
    );

    gsap.utils.toArray('.curr-bar').forEach((bar: any, i) => {
      gsap.fromTo(bar,
        { width: 0 },
        { 
          width: bar.dataset.width + '%', 
          duration: 1.5, 
          delay: i * 0.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 60%' }
        }
      );
    });

  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-white dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden perspective-[1000px]">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <div className="order-2 lg:order-1 relative perspective-[1000px]">
            <div className="curr-card aspect-square w-full max-w-md mx-auto relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-[3rem] -rotate-6 transform origin-center transition-transform duration-500 group-hover:rotate-0 blur-sm" />
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[3rem] border border-white/50 dark:border-slate-700/50 shadow-2xl p-8 flex flex-col z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Target className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Learning Outcomes</h4>
                </div>
                
                <div className="space-y-6 flex-grow">
                  {[100, 85, 90, 75].map((w, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                        <span>Chapter {i + 1} Mastery</span>
                        <span className="text-blue-600 dark:text-blue-400">{w}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="curr-bar h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                          data-width={w}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="curr-text inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-xs mb-6 shadow-sm border border-blue-200 dark:border-blue-800/50">
              Adaptive Learning
            </div>
            <h2 className="curr-text text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
              Curriculum-Driven <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">Intelligence</span>
            </h2>
            <p className="curr-text text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
              We seamlessly integrate with CBSE, ICSE, State Boards, or custom curriculums. Track chapter-wise progress, map learning outcomes, and provide personalized learning paths for every student.
            </p>

            <div className="space-y-8">
              <div className="curr-feature flex gap-5 items-start group">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl text-blue-500 shadow-md border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-1 group-hover:text-blue-500 transition-colors">Cross-Board Support</h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Seamlessly load content designed for your specific regional or national board.</p>
                </div>
              </div>
              <div className="curr-feature flex gap-5 items-start group">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl text-teal-500 shadow-md border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-1 group-hover:text-teal-500 transition-colors">Chapter-Wise Tracking</h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Microscopic visibility into each student's progress module by module.</p>
                </div>
              </div>
              <div className="curr-feature flex gap-5 items-start group">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl text-indigo-500 shadow-md border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-1 group-hover:text-indigo-500 transition-colors">Personalized Paths</h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">AI-driven interventions for areas where students need the most help.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CurriculumSection;
