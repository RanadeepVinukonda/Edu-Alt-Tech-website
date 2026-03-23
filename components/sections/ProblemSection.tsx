import React from 'react';
import { motion } from 'framer-motion';
import { ServerCrash, Users, Activity } from 'lucide-react';

const problems = [
  {
    icon: <ServerCrash className="w-8 h-8 text-rose-500 dark:text-rose-400" />,
    title: "Outdated Infrastructure",
    description: "Schools rely on fragmented legacy software, leading to communication gaps and missing data."
  },
  {
    icon: <Users className="w-8 h-8 text-amber-500 dark:text-amber-400" />,
    title: "Poor Engagement",
    description: "Traditional classroom models fail to effectively capture the attention of digital-native students."
  },
  {
    icon: <Activity className="w-8 h-8 text-blue-500 dark:text-blue-400" />,
    title: "No Real-Time Tracking",
    description: "Teachers and parents lack instant analytics into student performance, attendance, and health."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const ProblemSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-rose-500 dark:text-rose-400 font-semibold tracking-wide uppercase text-sm mb-3"
          >
            The Current Challenge
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6"
          >
            Why Schools Are Falling Behind
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 dark:text-slate-400"
          >
            Education hasn't evolved as fast as the rest of the world. We identified three major bottlenecks hindering school growth.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {problems.map((problem, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                {problem.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{problem.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
