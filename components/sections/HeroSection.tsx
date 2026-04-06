import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, Sparkles, BookOpen, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.fromTo('.hero-badge', 
      { opacity: 0, y: -20, scale: 0.8 }, 
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.7)' }
    )
    .fromTo('.hero-title-line', 
      { opacity: 0, y: 50, rotationX: -15 }, 
      { opacity: 1, y: 0, rotationX: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' },
      "-=0.4"
    )
    .fromTo('.hero-subtitle', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      "-=0.4"
    )
    .fromTo('.hero-btn', 
      { opacity: 0, scale: 0.9, y: 20 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.5)' },
      "-=0.4"
    )
    .fromTo('.hero-floating-card', 
      { opacity: 0, y: 40, rotationY: 20 }, 
      { opacity: 1, y: 0, rotationY: 0, duration: 1, stagger: 0.2, ease: 'power3.out' },
      "-=0.2"
    );

    // Continuous floating animation
    gsap.to('.float-slow', {
      y: -15,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    
    gsap.to('.float-medium', {
      y: -25,
      rotation: 2,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.5
    });

  }, { scope: container });

  return (
    <section ref={container} className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 min-h-screen flex flex-col justify-center perspective-[1000px]">
      {/* Dynamic Backgrounds */}
      <div className="absolute top-0 right-0 -mr-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-400/20 to-purple-500/20 dark:from-emerald-900/30 dark:to-purple-900/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen pointer-events-none float-slow" />
      <div className="absolute bottom-0 left-0 -ml-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-400/20 to-emerald-400/20 dark:from-blue-900/30 dark:to-emerald-900/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen pointer-events-none float-medium" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4xNSkiLz48L3N2Zz4=')] opacity-50 dark:opacity-20 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          <div className="flex-1 text-left w-full">
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold mb-8 shadow-xl">
              <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>Next-Gen Education Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
              <div className="hero-title-line overflow-hidden pb-2">Future-Proofed</div>
              <div className="hero-title-line overflow-hidden pb-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500">
                  Learning Ecosystems
                </span>
              </div>
            </h1>
            
            <p className="hero-subtitle text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed">
              Bridging the execution gap. We build curriculum-driven platforms, beautiful interfaces, and alternative skill pathways.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link to="/courses" className="hero-btn w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white rounded-full font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-105 transform group">
                Explore Courses
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/contact" className="hero-btn w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-full font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-lg hover:scale-105 transform">
                Partner with us
              </Link>
            </div>
          </div>
          
          <div className="flex-1 w-full relative h-[500px]">
             {/* Abstract Floating UI Elements */}
             <div className="absolute top-10 right-10 w-64 h-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 p-6 rounded-3xl shadow-2xl hero-floating-card float-slow z-20">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full w-3/4"></div>
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full w-1/2"></div>
                </div>
             </div>

             <div className="absolute bottom-20 left-0 w-72 h-auto bg-white/60 dark:bg-slate-800/60 backdrop-blur-3xl border border-white/50 dark:border-slate-600/50 p-6 rounded-[2rem] shadow-2xl hero-floating-card float-medium z-30">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Active Engagement</h3>
                </div>
                <div className="flex items-end gap-2 h-20">
                  <div className="w-1/4 bg-emerald-200 dark:bg-emerald-900/50 rounded-t-lg h-[40%]"></div>
                  <div className="w-1/4 bg-emerald-300 dark:bg-emerald-800/60 rounded-t-lg h-[60%]"></div>
                  <div className="w-1/4 bg-emerald-400 dark:bg-emerald-600 rounded-t-lg h-[80%]"></div>
                  <div className="w-1/4 bg-emerald-500 dark:bg-emerald-500 rounded-t-lg h-[100%] shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
                </div>
             </div>
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-full blur-2xl opacity-20 dark:opacity-40 animate-pulse"></div>

             <div className="absolute top-0 left-10 w-48 h-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-5 rounded-3xl shadow-xl hero-floating-card float-slow z-10 hidden md:block" style={{animationDelay: '1s'}}>
                <div className="flex justify-between items-center">
                  <Layers className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
                  <span className="font-bold text-xs">+150 Hrs</span>
                </div>
                <p className="mt-4 font-bold text-sm">Curriculum Mastery</p>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
