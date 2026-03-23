import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Smartphone, MonitorDot, TabletSmartphone, BarChart3 } from 'lucide-react';

const solutions = [
  { icon: <Globe className="w-6 h-6 text-emerald-500" />, title: "Custom Website" },
  { icon: <Smartphone className="w-6 h-6 text-emerald-500" />, title: "Student App" },
  { icon: <MonitorDot className="w-6 h-6 text-emerald-500" />, title: "Teacher Dashboard" },
  { icon: <TabletSmartphone className="w-6 h-6 text-emerald-500" />, title: "Parent App" },
  { icon: <BarChart3 className="w-6 h-6 text-emerald-500" />, title: "Admin Analytics" },
];

const SolutionSection: React.FC = () => {
  return (
    <section id="solutions" className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-emerald-500 font-semibold tracking-wide uppercase text-sm mb-3">
              The Solution
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              The Ultimate <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500">School Operating System</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
              We unify fragmented school processes into one synchronized digital ecosystem. A single platform that connects students, teachers, parents, and administrators seamlessly.
            </p>
            
            <ul className="space-y-6">
              {solutions.map((item, idx) => (
                <motion.li 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * idx, duration: 0.5 }}
                  className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm"
                >
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                    {item.icon}
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200 text-lg">{item.title}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Abstract OS Visualization */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[600px] w-full hidden lg:block"
          >
            {/* Center Core */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 z-20 animate-[pulse_4s_ease-in-out_infinite]">
              <div className="text-center text-white">
                <Globe className="w-12 h-12 mx-auto mb-2" />
                <span className="font-bold tracking-widest text-sm">EDU ALT TECH<br/>CORE OS</span>
              </div>
            </div>

            {/* Orbiting Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-dashed border-emerald-300 dark:border-emerald-700/50 rounded-full opacity-50 animate-[spin_30s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border border-dashed border-blue-300 dark:border-blue-700/50 rounded-full opacity-30 animate-[spin_40s_linear_infinite_reverse]" />
            
            {/* Connected Nodes */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-[10%] left-[20%] glass p-4 rounded-2xl border border-white/50 dark:border-slate-700 shadow-xl z-30">
              <Smartphone className="w-8 h-8 text-blue-500 mb-2" />
              <p className="font-bold text-xs dark:text-white">Parent App</p>
            </motion.div>
            
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute bottom-[20%] right-[10%] glass p-4 rounded-2xl border border-white/50 dark:border-slate-700 shadow-xl z-30">
              <MonitorDot className="w-8 h-8 text-amber-500 mb-2" />
              <p className="font-bold text-xs dark:text-white">Teacher Dash</p>
            </motion.div>

            <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 2 }} className="absolute top-[30%] right-[5%] glass p-4 rounded-2xl border border-white/50 dark:border-slate-700 shadow-xl z-30">
              <BarChart3 className="w-8 h-8 text-rose-500 mb-2" />
              <p className="font-bold text-xs dark:text-white">Admin Panel</p>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
