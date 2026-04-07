import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Course, CourseEnrollment, CourseModule, ModuleLecture, CourseResource } from '../types';
import { ArrowLeft, BookOpen, Video, FileText, Plus, Link as LinkIcon, Loader2, PlayCircle, CheckCircle2, Circle } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { toast } from 'react-hot-toast';

const CourseClassroom: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);

  // Classroom Data
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);

  // Active Expand States
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Teacher Modals
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState<string | null>(null); // stores moduleId
  const [showResourceModal, setShowResourceModal] = useState(false);
  
  // Forms
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mThumb, setMThumb] = useState('');
  const [mThumbFile, setMThumbFile] = useState<File | null>(null);

  const [lTitle, setLTitle] = useState('');
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
      const mQ = query(collection(db, 'course_modules'), where('courseId', '==', courseIdStr));
      const mSnap = await getDocs(mQ);
      
      const loadedModules = mSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseModule));
      loadedModules.sort((a, b) => (a.order || 0) - (b.order || 0));
      setModules(loadedModules);

      const rQ = query(collection(db, 'resources'), where('courseId', '==', courseIdStr));
      const rSnap = await getDocs(rQ);
      setResources(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseResource)));
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

        const enrollData = { id: eSnap.docs[0].id, ...eSnap.docs[0].data() } as CourseEnrollment;
        setEnrollment(enrollData);
        
        // Ensure student is active or teacher is approved
        if (enrollData.role === 'teacher') {
          const tQ = query(collection(db, 'teacher_applications'), where('userId', '==', currentUser.uid), where('courseId', '==', courseId), where('status', '==', 'approved'));
          const tSnap = await getDocs(tQ);
          if (tSnap.empty) {
            navigate(`/courses/${courseId}`); // teacher not approved yet
            return;
          }
          setRole('teacher');
        } else {
           if (enrollData.studentStatus !== 'active') {
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

  const toggleModule = (id: string) => {
    setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'teacher' || !courseId) return;
    try {
      let finalThumbUrl = mThumb;
      if (mThumbFile) {
        const fileRef = ref(storage, `module_thumbnails/${Date.now()}_${mThumbFile.name}`);
        const snap = await uploadBytes(fileRef, mThumbFile);
        finalThumbUrl = await getDownloadURL(snap.ref);
      }

      await addDoc(collection(db, 'course_modules'), {
        courseId,
        teacherId: user.uid,
        title: mTitle,
        description: mDesc,
        order: modules.length + 1,
        lectures: [],
        thumbnailUrl: finalThumbUrl || '',
        createdAt: serverTimestamp()
      });
      setShowModuleModal(false);
      setMTitle(''); setMDesc(''); setMThumb(''); setMThumbFile(null);
      fetchClassroomData(courseId);
      toast.success("Module added to roadmap");
    } catch (err) { console.error(err); toast.error("Failed to add module"); }
  };

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'teacher' || !courseId || !showLectureModal) return;
    try {
      const moduleRef = doc(db, 'course_modules', showLectureModal);
      const newLecture: ModuleLecture = {
        id: Date.now().toString(), // Simple unique id
        title: lTitle,
        meetingLink: lMeet,
        recordedLink: lRec,
        createdAt: new Date().toISOString()
      };
      
      const mod = modules.find(m => m.id === showLectureModal);
      const currentLectures = mod?.lectures || [];

      await updateDoc(moduleRef, {
        lectures: [...currentLectures, newLecture]
      });

      setShowLectureModal(null);
      setLTitle(''); setLMeet(''); setLRec('');
      fetchClassroomData(courseId);
      toast.success("Lecture added to module");
    } catch (err) { console.error(err); toast.error("Failed to add lecture"); }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'teacher' || !courseId) return;
    try {
      await addDoc(collection(db, 'resources'), {
        courseId,
        title: rTitle,
        url: rUrl,
        createdAt: serverTimestamp()
      });
      setShowResourceModal(false);
      setRTitle(''); setRUrl('');
      fetchClassroomData(courseId);
      toast.success("Resource added");
    } catch (err) { console.error(err); toast.error("Failed to add resource"); }
  };

  const handleToggleComplete = async (moduleId: string) => {
    if (!enrollment || role !== 'student') return;
    try {
      const isCompleted = enrollment.completedModules?.includes(moduleId);
      const enrRef = doc(db, 'enrollments', enrollment.id);
      
      let newCompleted = enrollment.completedModules || [];
      if (isCompleted) {
        newCompleted = newCompleted.filter(id => id !== moduleId);
      } else {
        newCompleted = [...newCompleted, moduleId];
      }

      await updateDoc(enrRef, {
        completedModules: isCompleted ? arrayRemove(moduleId) : arrayUnion(moduleId)
      });
      
      setEnrollment({ ...enrollment, completedModules: newCompleted });
      toast.success(isCompleted ? "Module marked as incomplete" : "Module completed! Great job!");
    } catch(err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="min-h-screen pt-32 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>;
  if (!course) return null;

  const completedCount = enrollment?.completedModules?.length || 0;
  const totalCount = modules.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

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
             <div className="flex items-center gap-4 mt-4">
                <p className="text-slate-500 dark:text-slate-400 font-medium bg-slate-200/50 dark:bg-slate-800/50 w-fit px-3 py-1 rounded-full text-sm">
                   Virtual Classroom • {role === 'teacher' ? 'Mentor Mode' : 'Student Mode'}
                </p>
                {role === 'student' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Course Progress</span>
                    <div className="w-32 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{progressPercent}%</span>
                  </div>
                )}
             </div>
          </div>
          {role === 'teacher' && (
            <div className="flex gap-2">
               <button onClick={()=>setShowResourceModal(true)} className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-xl font-bold text-sm flex items-center gap-2 transition">
                 <FileText className="w-4 h-4"/> Add Note
               </button>
               <button onClick={()=>setShowModuleModal(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition">
                 <Plus className="w-4 h-4"/> New Module
               </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Curriculum Path (Roadmap) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Roadmap</h2>
            
            {modules.length === 0 ? (
               <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border 2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                 <p className="text-slate-500">No modules have been added to this path yet.</p>
               </div>
            ) : (
               <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pb-8">
                 {modules.map((mod, idx) => {
                   const isCompleted = enrollment?.completedModules?.includes(mod.id);
                   const isExpanded = expandedModules.includes(mod.id);

                   return (
                     <div key={mod.id} className="relative pl-8 animate-in slide-in-from-left-4 duration-500">
                        {/* Timeline Node */}
                        <div className={`absolute -left-[11px] top-6 w-5 h-5 rounded-full border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>

                        <div className={`bg-white dark:bg-slate-900 border ${isCompleted ? 'border-emerald-500/50 dark:border-emerald-500/30' : 'border-slate-200 dark:border-slate-800'} rounded-[2rem] shadow-sm flex flex-col hover:shadow-lg transition-all overflow-hidden`}>
                            {/* Module Header Area */}
                            <div className="p-6 cursor-pointer" onClick={() => toggleModule(mod.id)}>
                              <div className="flex flex-col md:flex-row gap-6 items-start">
                                {mod.thumbnailUrl ? (
                                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0">
                                    <img src={mod.thumbnailUrl} alt={mod.title} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0">
                                    {idx + 1}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">{mod.title}</h3>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-400 mb-4">{mod.description}</p>
                                  
                                  <div className="flex flex-wrap gap-2 items-center">
                                     <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">{mod.lectures?.length || 0} Lectures</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Expandable Lectures Area */}
                            {isExpanded && (
                              <div className="bg-slate-50 dark:bg-slate-950/50 p-6 border-t border-slate-100 dark:border-slate-800">
                                 {(!mod.lectures || mod.lectures.length === 0) ? (
                                    <p className="text-sm text-slate-500 italic">No lectures in this module yet.</p>
                                 ) : (
                                    <div className="space-y-3 mb-4">
                                       {mod.lectures.map((lec, lIdx) => (
                                          <div key={lec.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                                                {lIdx + 1}
                                              </div>
                                              <p className="font-bold text-slate-800 dark:text-slate-200">{lec.title}</p>
                                            </div>
                                            <div className="flex gap-2">
                                               {lec.meetingLink && (
                                                  <a href={lec.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg font-bold text-xs transition">
                                                    <Video className="w-3.5 h-3.5"/> Join Live
                                                  </a>
                                               )}
                                               {lec.recordedLink && (
                                                  <a href={lec.recordedLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg font-bold text-xs transition">
                                                    <PlayCircle className="w-3.5 h-3.5"/> Watch
                                                  </a>
                                               )}
                                            </div>
                                          </div>
                                       ))}
                                    </div>
                                 )}

                                 <div className="flex flex-wrap gap-2 items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                                    {role === 'teacher' && (
                                       <button onClick={() => setShowLectureModal(mod.id)} className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-xl font-bold text-sm flex items-center gap-2 transition">
                                          <Plus className="w-4 h-4"/> Add Lecture
                                       </button>
                                    )}
                                    {role === 'student' && (
                                        <button 
                                          onClick={() => handleToggleComplete(mod.id)}
                                          className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ml-auto ${isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300'}`}
                                        >
                                          {isCompleted ? <CheckCircle2 className="w-4 h-4"/> : <Circle className="w-4 h-4"/>}
                                          {isCompleted ? 'Completed' : 'Mark Complete'}
                                        </button>
                                    )}
                                 </div>
                              </div>
                            )}
                        </div>
                     </div>
                   );
                 })}
               </div>
            )}
          </div>

          {/* Sidebar Resources */}
          <div className="space-y-6">
            <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
               <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><FileText className="w-5 h-5"/> Course Resources</h2>
               {resources.length === 0 ? (
                 <p className="text-sm text-slate-500">No global resources shared yet.</p>
               ) : (
                 <div className="space-y-3">
                   {resources.map(res => (
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
      </div>

      {/* Modals */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Create New Module</h2>
             <form onSubmit={handleCreateModule} className="space-y-4">
               <input required placeholder="Module Title (e.g. Intro Basics)" value={mTitle} onChange={e=>setMTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
               <textarea required placeholder="What will be covered in this module?" value={mDesc} onChange={e=>setMDesc(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" rows={3}></textarea>
               <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                 <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Thumbnail Image (Optional)</label>
                 <input 
                   type="file" 
                   accept="image/*"
                   onChange={e => {
                     if (e.target.files && e.target.files[0]) {
                       setMThumbFile(e.target.files[0]);
                     }
                   }} 
                   className="w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                 />
                 <p className="text-xs text-slate-500 mt-2 mb-1">Or direct URL:</p>
                 <input placeholder="https://..." type="url" value={mThumb} onChange={e=>setMThumb(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
               </div>
               <div className="flex gap-2 justify-end mt-6">
                 <button type="button" onClick={()=>setShowModuleModal(false)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
                 <button type="submit" className="px-6 py-3 font-bold text-white bg-purple-600 rounded-xl">Add Module</button>
               </div>
             </form>
           </div>
        </div>
      )}

      {showLectureModal !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Add Lecture to Module</h2>
             <form onSubmit={handleAddLecture} className="space-y-4">
               <input required placeholder="Lecture Title (e.g. Setup Environment)" value={lTitle} onChange={e=>setLTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
               <input placeholder="Live Meeting Link (Optional)" type="url" value={lMeet} onChange={e=>setLMeet(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
               <input placeholder="Recorded Video Link (Optional)" type="url" value={lRec} onChange={e=>setLRec(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
               
               <div className="flex gap-2 justify-end mt-6">
                 <button type="button" onClick={()=>setShowLectureModal(null)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
                 <button type="submit" className="px-6 py-3 font-bold text-white bg-indigo-600 rounded-xl">Add Lecture</button>
               </div>
             </form>
           </div>
        </div>
      )}

      {showResourceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Add Global Resource</h2>
             <form onSubmit={handleCreateResource} className="space-y-4">
               <input required placeholder="Resource Title (e.g. Reference Book PDF)" value={rTitle} onChange={e=>setRTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
               <input required placeholder="Link to Resource (Drive/Dropbox/etc)" type="url" value={rUrl} onChange={e=>setRUrl(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
               <div className="flex gap-2 justify-end mt-6">
                 <button type="button" onClick={()=>setShowResourceModal(false)} className="px-6 py-3 font-bold text-slate-500">Cancel</button>
                 <button type="submit" className="px-6 py-3 font-bold text-white bg-emerald-600 rounded-xl">Add Resource</button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CourseClassroom;
