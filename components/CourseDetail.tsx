import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Course, Subject, Chapter } from '../types';
import { ArrowLeft, Plus, Trash2, FolderOpen, FileText, Loader2 } from 'lucide-react';

interface Props {
  course: Course;
  onBack: () => void;
  readonly?: boolean;
}

const CourseDetail: React.FC<Props> = ({ course, onBack, readonly = false }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<{ [subjectId: string]: Chapter[] }>({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '' });

  useEffect(() => {
    let unsubscribes: any[] = [];
    const subjectsRef = collection(db, 'courses', course.id, 'subjects');
    const q = query(subjectsRef); // Removed orderBy to bypass index requirement
    
    const unsubscribeSubjects = onSnapshot(q, (snapshot) => {
      // Clean up previous chapter listener leaks
      unsubscribes.forEach(u => u());
      unsubscribes = [];

      const subjectData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
      subjectData.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setSubjects(subjectData);
      
      // Fetch chapters for each subject
      subjectData.forEach(sub => {
        const chaptersRef = collection(db, 'courses', course.id, 'subjects', sub.id, 'chapters');
        const u = onSnapshot(chaptersRef, (cSnap) => {
          const chapterData = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));
          chapterData.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
          setChapters(prev => ({ ...prev, [sub.id]: chapterData }));
        });
        unsubscribes.push(u);
      });
      
      setLoading(false);
    });

    return () => {
      unsubscribeSubjects();
      unsubscribes.forEach(u => u());
    };
  }, [course.id]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await addDoc(collection(db, 'courses', course.id, 'subjects'), {
        courseId: course.id,
        title: formData.title,
        createdAt: serverTimestamp()
      });
      setIsSubjectModalOpen(false);
      setFormData({ title: '' });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubjectId) return;
    setModalLoading(true);
    try {
      await addDoc(collection(db, 'courses', course.id, 'subjects', activeSubjectId, 'chapters'), {
        subjectId: activeSubjectId,
        title: formData.title,
        createdAt: serverTimestamp()
      });
      setIsChapterModalOpen(false);
      setActiveSubjectId(null);
      setFormData({ title: '' });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (window.confirm('Delete this subject and all its chapters?')) {
      await deleteDoc(doc(db, 'courses', course.id, 'subjects', subjectId));
    }
  };

  const handleDeleteChapter = async (subjectId: string, chapterId: string) => {
    if (window.confirm('Delete this chapter?')) {
      await deleteDoc(doc(db, 'courses', course.id, 'subjects', subjectId, 'chapters', chapterId));
    }
  };

  const Modal = ({ isOpen, onClose, title, onSubmit, children }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors dark:text-white">✕</button>
          </div>
          <div className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              {children}
              <button
                type="submit" disabled={modalLoading}
                className="w-full py-4 bg-slate-900 dark:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all disabled:opacity-50 mt-4 shadow-lg"
              >
                {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 truncate">{course.title}</h2>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{course.description}</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Syllabus Structure</h3>
        {!readonly && (
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="px-5 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        )}
      </div>

      {subjects.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-200 dark:text-slate-700">
            <FolderOpen className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No subjects added</h3>
          <p className="text-slate-400 max-w-sm">{readonly ? 'The teacher hasn\'t added any subjects yet.' : 'Create subjects like "Physics" or "Module 1" to start organizing this course.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.map(subject => (
            <div key={subject.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">{subject.title}</h4>
                </div>
                {!readonly && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setActiveSubjectId(subject.id); setIsChapterModalOpen(true); }}
                      className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 shadow-sm"
                    >
                      + Add Chapter
                    </button>
                    <button onClick={() => handleDeleteSubject(subject.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg transition-all text-slate-400">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6">
                {(chapters[subject.id] || []).length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4 italic">No chapters in this subject yet</p>
                ) : (
                  <ul className="space-y-3">
                    {chapters[subject.id].map(chapter => (
                      <li key={chapter.id} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl group transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <span className="font-bold text-slate-700 dark:text-slate-200">{chapter.title}</span>
                        </div>
                        {!readonly && (
                          <button onClick={() => handleDeleteChapter(subject.id, chapter.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg transition-all text-slate-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Add New Subject" onSubmit={handleCreateSubject}>
        <label className="block text-sm font-bold text-slate-700 mb-2">Subject Title</label>
        <input
          type="text" required autoFocus
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
          placeholder="e.g., Mathematics"
          value={formData.title}
          onChange={e => setFormData({ title: e.target.value })}
        />
      </Modal>

      <Modal isOpen={isChapterModalOpen} onClose={() => { setIsChapterModalOpen(false); setActiveSubjectId(null); }} title="Add New Chapter" onSubmit={handleCreateChapter}>
        <label className="block text-sm font-bold text-slate-700 mb-2">Chapter Title</label>
        <input
          type="text" required autoFocus
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
          placeholder="e.g., Introduction to Calculus"
          value={formData.title}
          onChange={e => setFormData({ title: e.target.value })}
        />
      </Modal>
    </div>
  );
};

export default CourseDetail;
