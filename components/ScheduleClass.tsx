import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Course, Subject, Chapter, ClassSession } from '../types';
import { Loader2, Calendar as CalendarIcon, Link as LinkIcon, Trash2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  user: User;
  courses: Course[];
}

const ScheduleClass: React.FC<Props> = ({ user, courses }) => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassSession[]>([]);

  // Selection state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  
  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [type, setType] = useState<'Live' | 'Recorded'>('Live');

  // Fetch upcoming classes
  useEffect(() => {
    const q = query(
      collection(db, 'classes'),
      where('teacherId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedClasses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassSession));
      fetchedClasses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setClasses(fetchedClasses);
    });
    return () => unsub();
  }, [user.uid]);

  // Fetch subjects when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setSubjects([]);
      setSelectedSubjectId('');
      return;
    }
    const fetchSubjects = async () => {
      const q = query(collection(db, 'courses', selectedCourseId, 'subjects'));
      const snap = await getDocs(q);
      const subs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
      subs.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setSubjects(subs);
    };
    fetchSubjects();
  }, [selectedCourseId]);

  // Fetch chapters when subject changes
  useEffect(() => {
    if (!selectedCourseId || !selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId('');
      return;
    }
    const fetchChapters = async () => {
      const q = query(collection(db, 'courses', selectedCourseId, 'subjects', selectedSubjectId, 'chapters'));
      const snap = await getDocs(q);
      const chaps = snap.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));
      chaps.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setChapters(chaps);
    };
    fetchChapters();
  }, [selectedCourseId, selectedSubjectId]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedSubjectId || !selectedChapterId) {
      alert("Please select Course, Subject, and Chapter.");
      return;
    }
    setLoading(true);
    try {
      // Create ISO string from date and time
      const datetime = new Date(`${date}T${time}`).toISOString();

      await addDoc(collection(db, 'classes'), {
        courseId: selectedCourseId,
        subjectId: selectedSubjectId,
        chapterId: selectedChapterId,
        teacherId: user.uid,
        title,
        date: datetime,
        meetLink,
        type,
        createdAt: serverTimestamp()
      });

      // Reset form
      setTitle('');
      setDate('');
      setTime('');
      setMeetLink('');
      setSelectedCourseId('');
      setSelectedSubjectId('');
      setSelectedChapterId('');
    } catch (error) {
      console.error(error);
      alert("Failed to schedule class. Setup complete?");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this scheduled class?")) {
      await deleteDoc(doc(db, 'classes', id));
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">Schedule Class</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <form onSubmit={handleSchedule} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Course</label>
              <select required value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400">
                <option value="">-- Select Course --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                <select required disabled={!selectedCourseId} value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 disabled:opacity-50">
                  <option value="">Select...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Chapter</label>
                <select required disabled={!selectedSubjectId} value={selectedChapterId} onChange={e => setSelectedChapterId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 disabled:opacity-50">
                  <option value="">Select...</option>
                  {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Class Title</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Thermodynamics Part 1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Time</label>
                <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Meet Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required type="url" value={meetLink} onChange={e => setMeetLink(e.target.value)} placeholder="https://meet.google.com/..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Class Type</label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" checked={type === 'Live'} onChange={() => setType('Live')} className="peer sr-only" />
                  <div className="py-2 text-center text-sm font-bold text-slate-500 border-2 border-slate-200 rounded-xl peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 transition-all">Live</div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" checked={type === 'Recorded'} onChange={() => setType('Recorded')} className="peer sr-only" />
                  <div className="py-2 text-center text-sm font-bold text-slate-500 border-2 border-slate-200 rounded-xl peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 transition-all">Recorded</div>
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-200">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Schedule Class'}
            </button>
          </form>
        </div>

        {/* List Container */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Scheduled Classes</h3>
              <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{classes.length} Total</div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto max-h-[600px] space-y-4">
              {classes.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No classes scheduled yet.</p>
                </div>
              ) : (
                classes.map(cls => (
                  <div key={cls.id} className="p-5 border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all group flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${cls.type === 'Live' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          {cls.type}
                        </span>
                        <h4 className="font-bold text-slate-900 text-lg">{cls.title}</h4>
                      </div>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-2">
                        <CalendarIcon className="w-4 h-4" />
                        {new Date(cls.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <a href={cls.meetLink} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-50 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-100 transition-colors">
                        Join Link
                      </a>
                      <button onClick={() => handleDelete(cls.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all text-slate-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleClass;
