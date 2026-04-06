import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const CtaSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if(!containerRef.current) return;

    gsap.fromTo('.cta-content',
      { opacity: 0, y: 50, scale: 0.95 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.8, 
        ease: 'back.out(1.5)',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%'
        }
      }
    );

    gsap.to('.cta-glow', {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: 'linear'
    });

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 md:py-32 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="cta-content relative rounded-[3rem] p-12 md:p-24 text-center overflow-hidden shadow-2xl group">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-500 to-blue-600" />
          <div className="cta-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-yellow-400/20 via-white/10 to-transparent rounded-full mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSIvPjwvc3ZnPg==')] opacity-30" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-bold mb-8 border border-white/20">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Transform Your Institution</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">
              Ready to Upgrade <br /> <span className="text-emerald-100">Your School?</span>
            </h2>
            <p className="text-emerald-50/80 text-xl md:text-2xl font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
              Join hundreds of innovative schools that have upgraded to the ultimate School Operating System. Let's build the future together.
            </p>
            
            <Link 
              to="/contact" 
              className="inline-flex items-center gap-2 bg-white text-emerald-600 hover:bg-slate-50 px-10 py-5 rounded-full font-bold text-lg md:text-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:scale-105"
            >
              Book a Free Demo
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
