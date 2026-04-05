import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Course, CourseEnrollment, Lecture, CourseResource } from '../types';
import { ArrowLeft, BookOpen, Video, FileText, Plus, Link as LinkIcon, Loader2, PlayCircle } from 'lucide-react';
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
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);

  // Teacher Modals
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  
  // Forms
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
      const lQ = query(collection(db, 'lectures'), where('courseId', '==', courseIdStr), orderBy('order', 'asc'));
      const lSnap = await getDocs(lQ);
      setLectures(lSnap.docs.map(d => ({ id: d.id, ...d.data() } as Lecture)));

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

        const enrollment = eSnap.docs[0].data() as CourseEnrollment;
        
        // Ensure student is active or teacher is approved
        if (enrollment.role === 'teacher') {
          const tQ = query(collection(db, 'teacher_applications'), where('userId', '==', currentUser.uid), where('courseId', '==', courseId), where('status', '==', 'approved'));
          const tSnap = await getDocs(tQ);
          if (tSnap.empty) {
            navigate(`/courses/${courseId}`); // teacher not approved yet
            return;
          }
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

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== 'teacher' || !courseId) return;
    try {
      await addDoc(collection(db, 'lectures'), {
        courseId,
        teacherId: user.uid,
        title: lTitle,
        description: lDesc,
        order: lectures.length + 1,
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
        title: rTitle,
        url: rUrl,
        createdAt: serverTimestamp()
      });
      setShowResourceModal(false);
      setRTitle(''); setRUrl('');
      fetchClassroomData(courseId);
    } catch (err) { console.error(err); alert("Failed to add resource"); }
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
                Virtual Classroom • {role === 'teacher' ? 'Mentor Mode' : 'Student Mode'}
             </p>
          </div>
          {role === 'teacher' && (
            <div className="flex gap-2">
               <button onClick={()=>setShowResourceModal(true)} className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-xl font-bold text-sm flex items-center gap-2 transition">
                 <FileText className="w-4 h-4"/> Add Note
               </button>
               <button onClick={()=>setShowLectureModal(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition">
                 <Plus className="w-4 h-4"/> New Lecture
               </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Curriculum Path */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Curriculum Path</h2>
            
            {lectures.length === 0 ? (
               <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border 2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                 <p className="text-slate-500">No lectures have been added to this path yet.</p>
               </div>
            ) : (
               <div className="space-y-4">
                 {lectures.map((lec, idx) => (
                   <div key={lec.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all items-start">
                      <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0">
                         {idx + 1}
                      </div>
                      <div className="flex-1">
                         <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{lec.title}</h3>
                         <p className="text-slate-600 dark:text-slate-400 mb-4">{lec.description}</p>
                         <div className="flex flex-wrap gap-3">
                            {lec.meetingLink && (
                               <a href={lec.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl font-bold text-sm transition">
                                 <Video className="w-4 h-4"/> Join Meeting
                               </a>
                            )}
                            {lec.recordedLink && (
                               <a href={lec.recordedLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 rounded-xl font-bold text-sm transition">
                                 <PlayCircle className="w-4 h-4"/> Watch Recording
                               </a>
                            )}
                         </div>
                      </div>
                   </div>
                 ))}
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
      {showLectureModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Create New Lecture</h2>
             <form onSubmit={handleCreateLecture} className="space-y-4">
               <input required placeholder="Lecture Title (e.g. Week 1: Mechanics)" value={lTitle} onChange={e=>setLTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
               <textarea required placeholder="What will be covered in this session?" value={lDesc} onChange={e=>setLDesc(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" rows={3}></textarea>
               <input placeholder="Live Meeting Link (Optional)" type="url" value={lMeet} onChange={e=>setLMeet(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
               <input placeholder="Recorded Video Link (Optional)" type="url" value={lRec} onChange={e=>setLRec(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mx-auto dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
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
