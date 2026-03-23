import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LINKS } from '../constants';
import { CheckCircle2, Loader2, ArrowRight, Home, ExternalLink } from 'lucide-react';

const EnrollStudent: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goal: '',
    role: 'Student'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTwWclKSEHufZYCteDWd2IE9oLMuTBMcEeu7s7V8iAFyuX4JmJMP-EsQetgxkcca6Yzg/exec';
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      setIsSubmitting(false);
      setIsDone(true);
      setTimeout(() => {
        window.open(LINKS.enroll, '_blank');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your enrollment. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="pt-32 pb-24 px-6 flex items-center justify-center min-h-[80vh] bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-xl w-full text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Step 1 Complete!</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
              We've opened the final Student Onboarding form in a new tab. Please complete it to finalize your application.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <a
              href={LINKS.enroll}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-2 group"
            >
              Didn't open? Click here <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
            Start Your Alternative Learning Journey
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 leading-relaxed">
            Take the first step towards a structured, accountability-driven education. Join as a Student and overcome the execution gap.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input
                  type="text" required
                  placeholder="Student Name"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                <input
                  type="email" required
                  placeholder="student@example.com"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                <input
                  type="tel" required
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Biggest Execution Hurdle</label>
                <textarea
                  required
                  placeholder="What stops you from achieving your goals?"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all h-32 resize-none"
                  value={formData.goal}
                  onChange={e => setFormData({ ...formData, goal: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 group text-lg"
            >
              {isSubmitting ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
              ) : (
                <>Proceed to Student Onboarding <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
            <p className="text-center text-xs text-slate-400">
              Your role will be securely stored as: <strong>Student</strong>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnrollStudent;
