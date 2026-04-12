import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { Loader2, Plus, Users, CalendarClock, Trash2, Check, Video, FileText, Edit, Save, X, Upload, LayoutDashboard, Database, ClipboardList, Settings, Search, MoreVertical, ExternalLink } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Course, TeacherApplication, PatchNote, UserObject } from '../types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_EMAIL = 'viranadeep@gmail.com';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'appointments' | 'patchnotes'>('courses');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Data states
  const [usersList, setUsersList] = useState<UserObject[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [teacherApps, setTeacherApps] = useState<(TeacherApplication & { userName?: string, userEmail?: string, courseTitle?: string })[]>([]);
  const [patchNotes, setPatchNotes] = useState<PatchNote[]>([]);

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<(TeacherApplication & { userName?: string, userEmail?: string, courseTitle?: string }) | null>(null);

  // Create course states
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: 'education', price: 0, thumbnail: '' });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  // Edit course states
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseData, setEditCourseData] = useState<Course>({
    id: '', title: '', description: '', category: 'education', price: 0, 
    thumbnail: '', createdAt: null, createdBy: ''

  });
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);



  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetching for better performance
      const [uSnap, cSnap, aSnap, pSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'teacher_applications')),
        getDocs(query(collection(db, 'patch_notes'), orderBy('createdAt', 'desc')))
      ]);

      const users = uSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserObject));
      setUsersList(users);

      const courses = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
      setCoursesList(courses);

      const rawApps = await Promise.all(aSnap.docs.map(async (d) => {
        const data = d.data() as TeacherApplication;
        const cFind = courses.find(c => c.id === data.courseId);
        
        if (!cFind) {
          await deleteDoc(doc(db, 'teacher_applications', d.id));
          return null;
        }

        const uFind = users.find(u => u.uid === data.userId);
        
        if (!uFind) {
          await deleteDoc(doc(db, 'teacher_applications', d.id));
          return null;
        }

        return {
          ...data,
          id: d.id,
          courseTitle: cFind.title,
          userName: uFind.name || data.userName || 'Anonymous',
          userEmail: uFind.email || data.userEmail || 'No Email'
        };
      }));

      setTeacherApps(rawApps.filter(app => app !== null) as any);
      setPatchNotes(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as PatchNote)));

    } catch (e) {
      console.error("Dashboard data fetch failed", e);
      toast.error("Failed to sync dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u || u.email !== ADMIN_EMAIL) {
        navigate('/');
      } else {
        fetchData();
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleDeleteCourse = (id: string, title: string) => {
    toast((t) => (
      <div className="flex flex-col gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl">
        <div className="flex items-center gap-3 text-red-500">
          <Trash2 className="w-6 h-6" />
          <p className="font-bold text-lg">Confirm Deletion</p>
        </div>
        <p className="text-slate-600 dark:text-slate-400">Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">"{title}"</span>? This action cannot be undone.</p>
        <div className="flex gap-2 justify-end mt-2">
          <button className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => toast.dismiss(t.id)}>Cancel</button>
          <button className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20" onClick={async () => {
            toast.dismiss(t.id);
            try {
              const eSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', id)));
              const allAppsSnap = await getDocs(query(collection(db, 'teacher_applications'), where('courseId', '==', id)));

              await deleteDoc(doc(db, 'courses', id));

              const userIdsToNotify = new Set<string>();
              eSnap.forEach(d => userIdsToNotify.add((d.data() as any).userId));
              allAppsSnap.forEach(d => {
                userIdsToNotify.add((d.data() as any).userId);
                deleteDoc(doc(db, 'teacher_applications', d.id));
              });

              for (const uid of Array.from(userIdsToNotify)) {
                await setDoc(doc(collection(db, 'notifications')), {
                  userId: uid,
                  title: 'Course Deleted',
                  message: `The course "${title}" has been removed.`,
                  isRead: false,
                  createdAt: serverTimestamp(),
                  type: 'course_deleted'
                });
              }
              fetchData();
              toast.success("Course deleted successfully");
            } catch (e) {
              toast.error("Deletion failed");
            }
          }}>Delete Course</button>
        </div>
      </div>
    ), { duration: Infinity, position: 'bottom-center' });
  };

  const handleUpdateCourse = async () => {
    if (!editingCourseId) return;
    try {
      await updateDoc(doc(db, 'courses', editingCourseId), {
        title: editCourseData.title,
        description: editCourseData.description,
        category: editCourseData.category,
        price: editCourseData.price,
        thumbnail: editCourseData.thumbnail || ''
      });
      setEditingCourseId(null);
      fetchData();
      toast.success("Course updated");
    } catch (e) {
      toast.error("Update failed");
    }
  };


  const uploadImage = async (file: File, courseId: string) => {
    const storageRef = ref(storage, `course_thumbnails/${courseId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCourse(true);
    try {
      let finalThumbnailUrl = newCourse.thumbnail;
      if (thumbnailFile) {
        const fileRef = ref(storage, `course_thumbnails/${Date.now()}_${thumbnailFile.name}`);
        const snap = await uploadBytes(fileRef, thumbnailFile);
        finalThumbnailUrl = await getDownloadURL(snap.ref);
      }

      const cRef = doc(collection(db, 'courses'));
      let thumbnail = newCourse.thumbnail;

      if (selectedFile) {
        thumbnail = await uploadImage(selectedFile, cRef.id);
      }

      const courseObj: Course = {
        id: cRef.id,
        title: newCourse.title,
        description: newCourse.description,
        category: newCourse.category as CourseCategory,
        price: Number(newCourse.price),
        thumbnail: finalThumbnailUrl,
        createdBy: 'admin',
        createdAt: serverTimestamp()
      };
      await setDoc(cRef, courseObj as any);
      setNewCourse({ title: '', description: '', category: 'education', price: 0, thumbnail: '' });
      setThumbnailFile(null);
      fetchData();
      toast.success("New course published!");
    } catch (e) {
      toast.error("Publication failed");
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleFinalVerdictTeacher = async (appId: string, emailStr: string | undefined, verdict: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'teacher_applications', appId), {
        status: verdict,
        updatedAt: serverTimestamp()
      });

      if (verdict === 'approved') {
        // Create the specific course enrollment for this mentor
        const appDoc = await getDoc(doc(db, 'teacher_applications', appId));
        if (appDoc.exists()) {
          const data = appDoc.data();
          const enrollmentId = `${data.userId}_${data.courseId}`;
          await setDoc(doc(db, 'enrollments', enrollmentId), {
            userId: data.userId,
            courseId: data.courseId,
            role: 'teacher',
            studentStatus: 'active', // So they aren't blocked by status checks
            createdAt: serverTimestamp()
          });
        }
      }

      if (emailStr && (verdict === 'approved' || verdict === 'rejected')) {
        await setDoc(doc(collection(db, 'mail')), {
          to: emailStr,
          message: {
            subject: `Teacher Application ${verdict === 'approved' ? 'Approved' : 'Rejected'}`,
            text: verdict === 'approved' 
              ? 'Congratulations! You have been approved to teach this course. Take a look at your course classroom to start building!'
              : 'Thank you for your interest, but we are unable to proceed with your application at this time.'
          }
        });
      }
      setSelectedApp(null);
      fetchData();
      toast.success(`Application ${verdict}`);
    } catch(e) { toast.error("Verdict update failed"); }
  };

  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState('');

  const handleApproveApp = async (appId: string, emailStr?: string) => {
    if(!meetLink) { toast.error("Provide a meet link"); return; }
    try {
      await updateDoc(doc(db, 'teacher_applications', appId), {
        status: 'scheduled',
        meetingLink: meetLink,
        updatedAt: serverTimestamp()
      });

      if (emailStr) {
        await setDoc(doc(collection(db, 'mail')), {
          to: emailStr,
          message: {
            subject: 'Interview Scheduled: Teacher Application',
            text: `Your application has been reviewed. Join the interview here: ${meetLink}`
          }
        });
      }

      setSchedulingId(null);
      setMeetLink('');
      setSelectedApp(null);
      fetchData();
      toast.success("Interview scheduled");
    } catch (e) {
      toast.error("Scheduling failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Syncing Core Systems...</p>
      </div>
    );
  }

  const filteredUsers = usersList.filter(u => 
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCourses = coursesList.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500/30">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-6 left-6 z-[60] p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg"
      >
        <MoreVertical className="w-6 h-6" />
      </button>

      {/* Sidebar / Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[55]"
            />
            
            <motion.nav 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="fixed left-0 top-0 h-full w-72 md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[60] flex flex-col p-6 shadow-2xl md:shadow-none"
            >
              <div className="mb-12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-black text-xl tracking-tighter">EDU-ALT <span className="text-emerald-500">ADMIN</span></span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                {[
                  { id: 'courses', label: 'Curricula', icon: ClipboardList },
                  { id: 'users', label: 'User Base', icon: Users },
                  { id: 'appointments', label: 'Applications', icon: CalendarClock },
                  { id: 'patchnotes', label: 'Patch Notes', icon: Database },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all group ${
                      activeTab === item.id 
                      ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => navigate('/')}
                className="mt-auto flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-6 h-6" />
                <span>Exit Terminal</span>
              </button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="md:pl-64 pt-24 md:pt-8 pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Header & Search */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')}
              </h1>
              <p className="text-slate-500 font-medium">System administrative controls and oversight.</p>
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search database..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              />
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "circOut" }}
            >
              {activeTab === 'courses' && (
                <div className="space-y-8">
                  {/* Create Course Bento Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Plus className="w-5 h-5 text-emerald-500" />
                        </div>
                        Draft New Curriculum
                      </h2>
                      <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Title</label>
                          <input required value={newCourse.title} onChange={e=>setNewCourse({...newCourse, title: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-bold" placeholder="E.g. Advanced Quantum Computing" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Overview</label>
                          <textarea required value={newCourse.description} onChange={e=>setNewCourse({...newCourse, description: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-medium resize-none" rows={4} placeholder="Describe the learning outcome..." />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Category</label>
                          <select value={newCourse.category} onChange={e=>setNewCourse({...newCourse, category: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-emerald-500 transition-all outline-none font-bold appearance-none">
                            <option value="education">Core Education</option>
                            <option value="alternative">Alternative Skills</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Price (INR)</label>
                          <input type="number" required value={newCourse.price} onChange={e=>setNewCourse({...newCourse, price: e.target.value as any})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-emerald-500 transition-all outline-none font-bold" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Media Assets</label>
                          <div className="flex flex-col md:flex-row gap-4">
                            <label className="flex-1 flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-emerald-500 transition-colors">
                              <Upload className="w-5 h-5 text-slate-400" />
                              <span className="text-sm font-bold text-slate-500">{thumbnailFile ? thumbnailFile.name : 'Upload Thumbnail'}</span>
                              <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setThumbnailFile(e.target.files[0])} />
                            </label>
                            <input type="url" value={newCourse.thumbnail} onChange={e=>setNewCourse({...newCourse, thumbnail: e.target.value})} placeholder="Or paste image URL..." className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-emerald-500 transition-all outline-none text-sm font-medium" />
                          </div>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <button type="submit" disabled={creatingCourse} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {creatingCourse ? <Loader2 className="w-6 h-6 animate-spin"/> : 'PUBLISH TO DIRECTORY'}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl shadow-emerald-500/20">
                      <div>
                        <Settings className="w-10 h-10 mb-6 opacity-50" />
                        <h3 className="text-2xl font-black leading-tight mb-4">Curriculum Control Center</h3>
                        <p className="font-medium text-emerald-50 opacity-80 leading-relaxed">
                          Publishing a course instantly makes it available in the student directory. Ensure all descriptions are clear and pricing is accurate.
                        </p>
                      </div>
                      <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-2xl">
                          <span className="text-sm font-bold">Total Courses</span>
                          <span className="text-2xl font-black">{coursesList.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Existing Courses Grid */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Published Curricula</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCourses.map(c => (
                        <motion.div 
                          layout
                          key={c.id} 
                          className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300"
                        >
                          {editingCourseId === c.id ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleUpdateCourse(); }} className="space-y-4">
                              <input value={editCourseData.title} onChange={e=>setEditCourseData({...editCourseData, title: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold" required />
                              <textarea value={editCourseData.description} onChange={e=>setEditCourseData({...editCourseData, description: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-medium" required rows={3} />
                              <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-emerald-500 text-white p-3 rounded-xl font-bold">Save Changes</button>
                                <button type="button" onClick={()=>setEditingCourseId(null)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex items-start gap-6">
                              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                {c.thumbnail ? (
                                  <img src={c.thumbnail} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ClipboardList className="w-8 h-8 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-lg truncate pr-4">{c.title}</h4>
                                  <div className="flex gap-1">
                                    <button onClick={() => { setEditingCourseId(c.id); setEditCourseData(c); }} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all">
                                      <Edit className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => handleDeleteCourse(c.id, c.title)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                                      <Trash2 className="w-5 h-5"/>
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mb-3 line-clamp-1">{c.description}</p>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                                    {c.category}
                                  </span>
                                  <span className="text-sm font-black text-emerald-500">
                                    ₹{c.price || 'Free'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Authenticated Users</h2>
                    <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-black text-slate-500 uppercase tracking-widest">
                      {filteredUsers.length} TOTAL
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                          <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Identity</th>
                          <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Permissions</th>
                          <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredUsers.map((usr) => (
                          <tr key={usr.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-bold text-slate-500">
                                  {(usr.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold flex items-center gap-2">
                                    {usr.name || 'Anonymous'}
                                    {usr.email === ADMIN_EMAIL && (
                                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-md">Root</span>
                                    )}
                                  </div>
                                  <div className="text-sm text-slate-500 font-medium">{usr.email || 'No Email'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                                {usr.role || 'User'}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Active</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              {usr.email !== ADMIN_EMAIL && (
                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teacherApps.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
                      <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold">No pending mentor applications.</p>
                    </div>
                  ) : (
                    teacherApps.map(app => (
                      <motion.div 
                        layout
                        key={app.id} 
                        className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                            app.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                            app.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                          }`}>
                            {app.status}
                          </span>
                        </div>

                        <div className="mb-6">
                          <h4 className="font-black text-xl mb-1 line-clamp-1">{app.courseTitle}</h4>
                          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{app.userName}</p>
                        </div>

                        <div className="space-y-4 mb-8">
                          <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>{app.userEmail}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <ClipboardList className="w-4 h-4" />
                            <span className="truncate">{app.skills || 'No skills listed'}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => setSelectedApp(app)}
                          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                        >
                          REVIEW DOSSIER
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'patchnotes' && (
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold mb-6">Deploy System Update</h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Version (e.g. 1.2.0)" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold" />
                        <input placeholder="Update Title" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold" />
                      </div>
                      <textarea placeholder="Describe the changes..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-medium resize-none" rows={4} />
                      <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl">
                        PUBLISH PATCH NOTES
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {patchNotes.map(note => (
                      <div key={note.id} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{note.version}</span>
                          <span className="text-xs font-medium text-slate-400">{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-lg mb-2">{note.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Premium Application Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Mentor Review</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Application Dossier #{selectedApp.id.slice(0, 8)}</p>
                  </div>
                  <button onClick={() => setSelectedApp(null)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  <section>
                    <label className="block text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Applicant Profile</label>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-sm font-black text-slate-400 uppercase mb-1">Name</p>
                        <p className="font-bold text-lg">{selectedApp.userName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-400 uppercase mb-1">Target Curriculum</p>
                        <p className="font-bold text-lg">{selectedApp.courseTitle}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <label className="block text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Professional Experience</label>
                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem]">
                      {selectedApp.experience || 'No experience provided.'}
                    </p>
                  </section>

                  {selectedApp.proposedPath && selectedApp.proposedPath.length > 0 && (
                    <section>
                      <label className="block text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Proposed Learning Path</label>
                      <div className="space-y-3">
                        {selectedApp.proposedPath.map((step, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">{i+1}</span>
                            <span className="font-bold text-sm">{step}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {selectedApp.status === 'pending' && (
                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] mb-6">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Schedule Interview</label>
                        <div className="flex gap-4">
                          <input 
                            value={meetLink}
                            onChange={e => setMeetLink(e.target.value)}
                            placeholder="Paste Google Meet / Zoom Link..." 
                            className="flex-1 p-4 bg-white dark:bg-slate-900 rounded-2xl outline-none font-bold border border-transparent focus:border-emerald-500 transition-all" 
                          />
                          <button 
                            onClick={() => handleApproveApp(selectedApp.id, selectedApp.userEmail)}
                            className="px-8 bg-emerald-500 text-white font-black rounded-2xl hover:scale-[1.02] transition-all"
                          >
                            SEND
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedApp.status === 'scheduled' && (
                    <div className="pt-8 flex gap-4">
                      <button 
                        onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'approved')}
                        className="flex-1 py-5 bg-emerald-500 text-white font-black rounded-[2rem] shadow-xl shadow-emerald-500/20"
                      >
                        APPROVE MENTOR
                      </button>
                      <button 
                        onClick={() => handleFinalVerdictTeacher(selectedApp.id, selectedApp.userEmail, 'rejected')}
                        className="flex-1 py-5 bg-red-500 text-white font-black rounded-[2rem] shadow-xl shadow-red-500/20"
                      >
                        REJECT APPLICATION
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
