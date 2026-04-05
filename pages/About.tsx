import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Target, Users, BookOpen, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (containerRef.current) {
      // Staggered entrance for all major sections
      gsap.fromTo('.gsap-fade', 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="bg-white dark:bg-slate-950 min-h-screen pt-32 pb-24 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20 gsap-fade">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
            Our Mission at <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500">EduAltTech</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            We believe that education must evolve. Our platform is dedicated to blending traditional academics with essential modern skills, empowering the next generation to thrive.
          </p>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          <div className="p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 gsap-fade">
            <Target className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Focused Goals</h3>
            <p className="text-slate-600 dark:text-slate-400">Targeted learning pathways designed for real-world impact and academic excellence.</p>
          </div>
          
          <div className="p-8 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 gsap-fade">
            <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Community</h3>
            <p className="text-slate-600 dark:text-slate-400">Collaborative learning spaces that foster peer-to-peer education and global networking.</p>
          </div>

          <div className="p-8 rounded-3xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 gsap-fade">
            <BookOpen className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Modern Curriculum</h3>
            <p className="text-slate-600 dark:text-slate-400">Constantly updating our resources to provide up-to-date technological and alternative skills.</p>
          </div>

          <div className="p-8 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 gsap-fade">
            <Rocket className="w-10 h-10 text-amber-600 dark:text-amber-400 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Innovation</h3>
            <p className="text-slate-600 dark:text-slate-400">Pushing the boundaries of what an educational platform can do, driven by AI and analytics.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center gsap-fade bg-slate-900 dark:bg-slate-900 rounded-3xl p-12 lg:p-20 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">Ready to Join the Revolution?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto relative z-10">Start your journey today and unlock access to an entirely new way of learning.</p>
          <div className="flex justify-center gap-4 relative z-10">
            <Link to="/signup" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium transition-all shadow-lg shadow-emerald-500/30">
              Get Started Free
            </Link>
            <Link to="/courses" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full font-medium transition-all backdrop-blur-sm">
              Explore Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
