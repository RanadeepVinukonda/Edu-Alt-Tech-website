import React from 'react';
import { motion } from 'framer-motion';
import { Network, Database, BrainCircuit } from 'lucide-react';

const CurriculumSection: React.FC = () => {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 relative"
          >
            <div className="aspect-square w-full max-w-md mx-auto relative">
              <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-[3rem] -rotate-6 transform origin-center transition-transform hover:rotate-0" />
              <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl p-8 flex flex-col">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Learning Outcomes</h4>
                <div className="space-y-4 flex-grow">
                  {[100, 85, 90, 75].map((w, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>Chapter {i + 1} Mastery</span>
                        <span>{w}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${w}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <p className="text-blue-500 font-semibold tracking-wide uppercase text-sm mb-3">Adaptive Learning</p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Curriculum-Driven <br /> Intelligence
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              We seamlessly integrate with CBSE, ICSE, State Boards, or custom curriculums. Track chapter-wise progress, map learning outcomes, and provide personalized learning paths for every student.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-500"><Database className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">Cross-Board Support</h4>
                  <p className="text-slate-600 dark:text-slate-400">Seamlessly load content designed for your specific regional or national board.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-500"><Network className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">Chapter-Wise Tracking</h4>
                  <p className="text-slate-600 dark:text-slate-400">Microscopic visibility into each student's progress module by module.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-500"><BrainCircuit className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">Personalized Paths</h4>
                  <p className="text-slate-600 dark:text-slate-400">AI-driven interventions for areas where students need the most help.</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default CurriculumSection;
