import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Course, CourseEnrollment, Lecture, CourseResource, Module } from '../types';
import { ArrowLeft, BookOpen, Video, FileText, Plus, Link as LinkIcon, Loader2, PlayCircle, FolderPlus, Layers, ChevronRight, ChevronDown, Trash2, MessageSquare } from 'lucide-react';
import CourseChat from '../components/CourseChat';


import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const CourseClassroom: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [loading, setLoading] = useState(true);

  // Classroom Data
  const [modules, setModules] = useState<Module[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [studentCount, setStudentCount] = useState(0);


  // Teacher Modals
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  
  // Forms
  const [mTitle, setMTitle] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [activeTab, setActiveTab] = useState<'curriculum' | 'chat'>('curriculum');

  const [lTitle, setLTitle] = useState('');
  const [lDesc, setLDesc] = useState('');
  const [lMeet, setLMeet] = useState('');
  const [lRec, setLRec] = useState('');

  const [rTitle, setRTitle] = useState('');
  const [rUrl, setRUrl] = useState('');

  const contentRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!loading && course) {
      gsap.fromTo(contentRef.current, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [loading, course]);

  const fetchClassroomData = async (courseIdStr: string) => {
    try {
      const mQ = query(collection(db, 'modules'), where('courseId', '==', courseIdStr), orderBy('order', 'asc'));
      const mSnap = await getDocs(mQ);
      const mods = mSnap.docs.map(d => ({ id: d.id, ...d.data() } as Module));
      setModules(mods);

      const lQ = query(collection(db, 'lectures'), where('courseId', '==', courseIdStr), orderBy('order', 'asc'));
      const lSnap = await getDocs(lQ);
      setLectures(lSnap.docs.map(d => ({ id: d.id, ...d.data() } as Lecture)));

      const rQ = query(collection(db, 'resources'), where('courseId', '==', courseIdStr));
      const rSnap = await getDocs(rQ);
      setResources(rSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as CourseResource)));

      // Fetch active student count
      const sQ = query(collection(db, 'enrollments'), where('courseId', '==', courseIdStr), where('role', '==', 'student'));
      const sSnap = await getDocs(sQ);
      setStudentCount(sSnap.size);


    } catch (e) {
      console.error("Failed to load classroom items", e);
    }
  };


  useEffect(() => {
    const init = async (currentUser: FirebaseUser | null) => {
      if (!courseId) return;
      if (!currentUser) {
        navigate('/login');
        return;
      }
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);

        const eQ = query(collection(db, 'enrollments'), where('userId', '==', currentUser.uid), where('courseId', '==', courseId));
        const eSnap = await getDocs(eQ);
        
        if (eSnap.empty) {
          navigate(`/courses/${courseId}`); // not enrolled
          return;
        }

        const enrollment = eSnap.docs[0].data() as CourseEnrollment;
        
        if (enrollment.role === 'teacher') {
          setRole('teacher');
        } else {
           if (enrollment.studentStatus !== 'active') {
             navigate(`/courses/${courseId}`);
             return;
           }
           setRole('student');
        }


        await fetchClassroomData(courseId);

      } catch (err) {
        console.error("Access error", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      init(currentUser);
    });

    return () => unsubscribe();
  }, [courseId, navigate]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'teacher' || !courseId) return;
    try {
      await addDoc(collection(db, 'modules'), {
        courseId,
        teacherId: user.uid,
        title: mTitle,
        order: modules.length + 1,
        createdAt: serverTimestamp()
      });

      setShowModuleModal(false);
      setMTitle('');
      fetchClassroomData(courseId);
    } catch (err) { console.error(err); alert("Failed to add module"); }
  };

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'teacher' || !courseId || !selectedModuleId) {
      alert("Please select a module first.");
      return;
    }
    try {
      await addDoc(collection(db, 'lectures'), {
        courseId,
        moduleId: selectedModuleId,
        teacherId: user.uid,
        title: lTitle,
        description: lDesc,
        order: lectures.filter(l => l.moduleId === selectedModuleId).length + 1,
        meetingLink: lMeet || '',
        recordedLink: lRec || '',
        createdAt: serverTimestamp()
      });
      setShowLectureModal(false);
      setLTitle(''); setLDesc(''); setLMeet(''); setLRec('');
      fetchClassroomData(courseId);
    } catch (err) { console.error(err); alert("Failed to add lecture"); }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'teacher' || !courseId) return;
    try {
      await addDoc(collection(db, 'resources'), {
        courseId,
        teacherId: user.uid,
        moduleId: selectedModuleId || null,
        title: rTitle,
        url: rUrl,
        createdAt: serverTimestamp()
      });

      setShowResourceModal(false);
      setRTitle(''); setRUrl('');
      fetchClassroomData(courseId);
    } catch (err) { console.error(err); alert("Failed to add resource"); }
  };

  const handleDeleteModule = async (modId: string) => {
    if (!window.confirm("Delete this module and all its content?")) return;
    try {
      await deleteDoc(doc(db, 'modules', modId));
      // Optionally delete lectures/resources too, or leave them orphaned
      fetchClassroomData(courseId!);
    } catch (e) { console.error(e); }
  };


  if (loading) return <div className="min-h-screen pt-32 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>;
  if (!course) return null;

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto" ref={contentRef}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
             <Link to="/dashboard" className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm font-bold mb-4">
               <ArrowLeft className="w-4 h-4" /> Back to Dashboard
             </Link>
             <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-purple-500" /> {course.title}
             </h1>
             <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium bg-slate-200/50 dark:bg-slate-800/50 w-fit px-3 py-1 rounded-full text-sm">
                Virtual Classroom • {role === 'teacher' ? `Mentor Mode • ${studentCount} Students Assigned` : 'Student Mode'}
             </p>

          </div>
          <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
               <button 
                 onClick={() => setActiveTab('curriculum')}
                 className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'curriculum' ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                 Curriculum
               </button>
               <button 
                 onClick={() => setActiveTab('chat')}
                 className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                 <MessageSquare className="w-4 h-4" /> Community Chat
               </button>
          </div>

          {role === 'teacher' && activeTab === 'curriculum' && (
            <div className="flex flex-wrap gap-2">
               <button onClick={()=>setShowModuleModal(true)} className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-xl font-bold text-sm flex items-center gap-2 transition">
                 <FolderPlus className="w-4 h-4"/> New Module
               </button>
               <button onClick={()=>{setSelectedModuleId(''); setShowResourceModal(true)}} className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-xl font-bold text-sm flex items-center gap-2 transition">
                 <FileText className="w-4 h-4"/> Add Note
               </button>
            </div>
          )}
        </div>

        {activeTab === 'curriculum' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Learning Path</h2>
              
              {modules.length === 0 ? (
                 <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border 2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                   <p className="text-slate-500">The mentor hasn't published the learning modules yet.</p>
                   {role === 'teacher' && <button onClick={()=>setShowModuleModal(true)} className="mt-4 text-emerald-600 font-bold">Create First Module</button>}
                 </div>
              ) : (
                 <div className="space-y-12 relative">
                    {/* Vertical Pathway Line */}
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />

                    {modules.map((mod, idx) => (
                       <div key={mod.id} className="space-y-6 relative pl-16">
                          {/* Module Node Circle */}
                          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-lg ring-4 ring-slate-50 dark:ring-slate-950">
                             {idx + 1}
                          </div>

                          <div className="flex items-center justify-between group">
                             <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                {mod.title}
                             </h3>

                            {role === 'teacher' && (
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={()=>{setSelectedModuleId(mod.id); setShowLectureModal(true)}} className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600">+ Lecture</button>
                                  <button onClick={()=>handleDeleteModule(mod.id)} className="text-rose-500 p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                               </div>
                            )}
                         </div>

                         <div className="space-y-3">
                            {lectures.filter(l => l.moduleId === mod.id).length === 0 ? (
                               <p className="text-xs text-slate-400 italic ml-6">No lectures in this module yet.</p>
                            ) : (
                               lectures.filter(l => l.moduleId === mod.id).map((lec, lIdx) => (
                                  <div key={lec.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                                     <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                           {lIdx + 1}
                                        </div>
                                        <div className="flex-1">
                                           <h4 className="font-bold text-slate-900 dark:text-white">{lec.title}</h4>
                                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{lec.description}</p>
                                           {(lec.meetingLink || lec.recordedLink) && (
                                              <div className="flex gap-3 mt-3">
                                                 {lec.meetingLink && (
                                                    <a href={lec.meetingLink} target="_blank" rel="noreferrer" className="text-[11px] font-black uppercase tracking-tight text-blue-600 dark:text-blue-400 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 transition-colors">
                                                       <Video className="w-3.5 h-3.5"/>
                                                       {role === 'teacher' ? 'Host Class' : 'Join Live'}
                                                    </a>
                                                 )}
                                                 {lec.recordedLink && (
                                                    <a href={lec.recordedLink} target="_blank" rel="noreferrer" className="text-[11px] font-black uppercase tracking-tight text-rose-600 dark:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 transition-colors">
                                                       <PlayCircle className="w-3.5 h-3.5"/>
                                                       Recording
                                                    </a>
                                                 )}
                                              </div>

                                           )}
                                        </div>
                                     </div>
                                  </div>
                               ))
                            )}

                            {/* Module Resources */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 ml-6">
                               {resources.filter(r => r.moduleId === mod.id).map(res => (
                                  <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100/50 dark:border-emerald-800/20 text-xs">
                                     <LinkIcon className="w-3 h-3 text-emerald-500" />
                                     <span className="font-medium text-slate-600 dark:text-slate-400 truncate">{res.title}</span>
                                  </a>
                               ))}
                            </div>
                         </div>
                      </div>
                   ))}
                 </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><FileText className="w-5 h-5"/> Global Resources</h2>
                 {resources.filter(r => !r.moduleId).length === 0 ? (
                   <p className="text-sm text-slate-500">No global resources shared yet.</p>
                 ) : (
                   <div className="space-y-3">
                     {resources.filter(r => !r.moduleId).map(res => (
                       <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 transition border border-slate-200 dark:border-slate-700">
                         <LinkIcon className="w-4 h-4 text-emerald-500" />
                         <span className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate">{res.title}</span>
                       </a>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
             <CourseChat 
               courseId={courseId!} 
              currentUser={user} 
              mentorId={course.createdBy === 'admin' ? 'admin_uid' : course.createdBy} 
              role={role!}
            />

          </div>
        )}
      
      {/* Modals */}

      {showModuleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2"><FolderPlus className="w-6 h-6 text-emerald-500" /> Create Module</h2>
             <form onSubmit={handleCreateModule} className="space-y-4">
               <input required placeholder="Module Title (e.g. Phase 1: Foundations)" value={mTitle} onChange={e=>setMTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
               <div className="flex gap-2 justify-end mt-6">
                 <button type="button" onClick={()=>setShowModuleModal(false)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
                 <button type="submit" className="px-6 py-3 font-bold text-white bg-emerald-600 rounded-xl">Create Module</button>
               </div>
             </form>
           </div>
        </div>
      )}

      {showLectureModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">New Lecture</h2>
             <form onSubmit={handleCreateLecture} className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Parent Module</label>
                  <select required value={selectedModuleId} onChange={e=>setSelectedModuleId(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select a Module</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
               </div>
               <input required placeholder="Lecture Title" value={lTitle} onChange={e=>setLTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
               <textarea required placeholder="Content summary..." value={lDesc} onChange={e=>setLDesc(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" rows={3}></textarea>
               <div className="relative">
                  <input placeholder="Live Meeting Link" type="url" value={lMeet} onChange={e=>setLMeet(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {lMeet && <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-black text-blue-500 animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> CLASS READY</div>}
               </div>
               <input placeholder="Recorded Video Link" type="url" value={lRec} onChange={e=>setLRec(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />

               <div className="flex gap-2 justify-end mt-6">
                 <button type="button" onClick={()=>setShowLectureModal(false)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
                 <button type="submit" className="px-6 py-3 font-bold text-white bg-purple-600 rounded-xl">Add Lecture</button>
               </div>
             </form>
           </div>
        </div>
      )}

      {showResourceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Add Module Resource</h2>
             <form onSubmit={handleCreateResource} className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Module (Optional)</label>
                  <select value={selectedModuleId} onChange={e=>setSelectedModuleId(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Global (No Module)</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
               </div>
               <input required placeholder="Resource Title" value={rTitle} onChange={e=>setRTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
               <input required placeholder="Link to Resource" type="url" value={rUrl} onChange={e=>setRUrl(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
               <div className="flex gap-2 justify-end mt-6">
                 <button type="button" onClick={()=>setShowResourceModal(false)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
                 <button type="submit" className="px-6 py-3 font-bold text-white bg-emerald-600 rounded-xl">Add Resource</button>
               </div>
             </form>
           </div>
        </div>
      )}

    </div>
  </div>
  );

};

export default CourseClassroom;
