import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-brand-50 to-transparent dark:from-brand-900/20" />
      <div className="absolute md:top-20 top-40 -left-20 w-72 h-72 bg-emerald-300/30 dark:bg-emerald-900/30 rounded-full blur-3xl" />
      <div className="absolute md:top-40 top-80 -right-20 w-96 h-96 bg-blue-300/20 dark:bg-blue-900/20 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight"
          >
            Reimagining Education Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500">Smart Digital Ecosystems</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-10"
          >
            We build customized websites, apps, and curriculum-driven platforms for modern schools.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <Link to="/contact" className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-full font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
              Book a Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>

        {/* Animated Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mx-auto max-w-5xl"
        >
          <div className="p-2 md:p-4 rounded-2xl md:rounded-[2rem] bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-2xl overflow-hidden glass">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl md:rounded-[1.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
              {/* Fake Browser header */}
              <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2 bg-white/50 dark:bg-slate-950/50">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              {/* Fake Dashboard Content */}
              <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                <div className="col-span-1 space-y-4">
                  <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
                <div className="col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  </div>
                  <div className="h-48 bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
