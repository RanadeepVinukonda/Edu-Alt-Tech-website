import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PatchNote } from '../types';
import { Loader2, FileText, ArrowLeft, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const PatchNotes: React.FC = () => {
  const [notes, setNotes] = useState<PatchNote[]>([]);
  const [loading, setLoading] = useState(true);

  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!loading && notes.length > 0) {
      gsap.fromTo(".patch-card", 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, [loading, notes]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const q = query(collection(db, 'patch_notes'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as PatchNote)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  if (loading) {
    return <div className="min-h-screen pt-32 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto" ref={containerRef}>
        <div className="flex items-center justify-between mb-12">
           <div>
             <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4">
               <ArrowLeft className="w-4 h-4" /> Back to Home
             </Link>
             <h1 className="text-4xl font-bold flex items-center gap-3"><Terminal className="w-8 h-8 text-emerald-600 dark:text-emerald-400"/> System Updates</h1>
             <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">Latest changelogs, features, and fixes for the platform.</p>
           </div>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-xl text-slate-500 dark:text-slate-400">No patch notes have been published yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {notes.map((note) => (
              <div key={note.id} className="patch-card bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200 dark:shadow-slate-950 relative overflow-hidden">
                <div className="absolute top-0 right-0 py-1 px-4 bg-emerald-600 text-white font-bold text-sm rounded-bl-xl shadow-sm">
                  {note.version}
                </div>
                <h2 className="text-2xl font-bold mb-2 pr-20 text-slate-900 dark:text-white">{note.title || 'Platform Update'}</h2>
                <p className="text-sm font-semibold text-slate-500 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  {note.createdAt && ('toDate' in note.createdAt) ? note.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'}) : 'Recently'}
                </p>
                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                   <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 m-0 text-base">{note.content}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatchNotes;
