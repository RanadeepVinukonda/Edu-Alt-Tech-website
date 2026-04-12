import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../lib/firebase';

import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy, getDoc } from 'firebase/firestore';

import { Loader2, Plus, Users, CalendarClock, Trash2, Check, Video, FileText, Edit, Save, X, Image as ImageIcon, Upload, AlertCircle } from 'lucide-react';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Course, TeacherApplication, PatchNote, TeacherAppStatus, CourseCategory } from '../types';



const ADMIN_EMAIL = 'viranadeep@gmail.com';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'appointments' | 'course_apps' | 'patchnotes' | 'maintenance'>('courses');

  const navigate = useNavigate();

  // Data states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [teacherApps, setTeacherApps] = useState<(TeacherApplication & { userName?: string, userEmail?: string, courseTitle?: string })[]>([]);
  const [patchNotes, setPatchNotes] = useState<PatchNote[]>([]);

  // Create course states
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: 'education', price: 0, thumbnail: '' });

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



  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteDoc(doc(db, 'courses', id));
        fetchData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourseId) return;
    setIsUploading(true);
    try {
      let currentThumbnail = editCourseData.thumbnail;

      if (editSelectedFile) {
        currentThumbnail = await uploadImage(editSelectedFile, editingCourseId);
      }

      await updateDoc(doc(db, 'courses', editingCourseId), {
        title: editCourseData.title,
        description: editCourseData.description,
        category: editCourseData.category,
        price: editCourseData.price,
        thumbnail: currentThumbnail || ''
      });
      setEditingCourseId(null);
      setEditSelectedFile(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Failed to update course");
    } finally {
      setIsUploading(false);
    }
  };


  // Appointment states
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState('');

  // Patch Note stats
  const [newVersion, setNewVersion] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [isResetting, setIsResetting] = useState(false);


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

  const fetchData = async () => {
    setLoading(true);
    console.log("Starting data fetch...");
    try {
      // Fetch Users
      try {
        const uSnap = await getDocs(collection(db, 'users'));
        const ul = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsersList(ul);
        console.log("Fetched users:", ul.length);
      } catch (e) { console.error("Error fetching users:", e); }

      // Fetch Courses
      let cl: Course[] = [];
      try {
        const cSnap = await getDocs(collection(db, 'courses'));
        cl = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        setCoursesList(cl);
        console.log("Fetched courses:", cl.length);
      } catch (e) { console.error("Error fetching courses:", e); }

      // Fetch Apps
      try {
        const aSnap = await getDocs(collection(db, 'teacher_applications'));
        const al = await Promise.all(aSnap.docs.map(async (d) => {
          const data = d.data() as TeacherApplication;
          let cName = 'Unknown', uName = 'Unknown', uEmail = '';
          const cFind = cl.find(c => c.id === data.courseId);
          if (cFind) cName = cFind.title;
          const uFind = usersList.find(u => u.id === data.userId) as any;
          if (uFind) { uName = uFind.name; uEmail = uFind.email; }

          return { ...data, id: d.id, courseTitle: cName, userName: uName, userEmail: uEmail };
        }));
        setTeacherApps(al);
        console.log("Fetched apps:", al.length);
      } catch (e) { console.error("Error fetching applications:", e); }

      // Fetch Patch Notes
      try {
        const pQ = query(collection(db, 'patch_notes'), orderBy('createdAt', 'desc'));
        const pSnap = await getDocs(pQ);
        const pl = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as PatchNote));
        setPatchNotes(pl);
        console.log("Fetched patch notes:", pl.length);
      } catch (e) { console.error("Error fetching patch notes:", e); }

    } catch (e) {
      console.error("Critical fetch error:", e);
    } finally {
      setLoading(false);
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
      const cRef = doc(collection(db, 'courses'));
      let thumbnailUrl = newCourse.thumbnail;

      if (selectedFile) {
        thumbnailUrl = await uploadImage(selectedFile, cRef.id);
      }

      const courseObj: Course = {
        id: cRef.id,
        title: newCourse.title,
        description: newCourse.description,
        category: newCourse.category as CourseCategory,
        price: Number(newCourse.price),
        thumbnail: thumbnailUrl,
        createdBy: 'admin',
        createdAt: serverTimestamp()
      };

      await setDoc(cRef, courseObj);

      setNewCourse({ title: '', description: '', category: 'education', price: 0, thumbnail: '' });
      setSelectedFile(null);
      fetchData();
      alert("Course created!");
    } catch (e) {

      console.error(e);
      alert("Could not create");
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleCreatePatchNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingNote(true);
    try {
      const pRef = doc(collection(db, 'patch_notes'));
      const note: PatchNote = {
        id: pRef.id,
        title: newTitle,
        version: newVersion,
        content: newContent,
        createdBy: 'admin',
        createdAt: serverTimestamp()
      };
      await setDoc(pRef, note);

      setNewVersion('');
      setNewTitle('');
      setNewContent('');
      fetchData();
      alert("Patch note published!");
    } catch (err) {
      console.error(err);
      alert("Could not publish note");
    } finally {
      setCreatingNote(false);
    }
  };

  const handleApproveApp = async (appId: string, emailStr?: string) => {
    if(!meetLink) return alert("Provide a meet link");
    try {
      await updateDoc(doc(db, 'teacher_applications', appId), {
        status: 'scheduled',
        meetingLink: meetLink,
        updatedAt: serverTimestamp()
      });

      if (emailStr) {
        try {
          await setDoc(doc(collection(db, 'mail')), {
            to: emailStr,
            message: {
              subject: 'Teacher Application Interview Scheduled!',
              text: `Your application has been approved for an interview. Please join the call at the scheduled time here: ${meetLink}`
            }
          });
        } catch (mailErr) {
          console.error("Email trigger failed", mailErr);
        }
      }

      setSchedulingId(null);
      setMeetLink('');
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFinalVerdictTeacher = async (appId: string, emailStr: string | undefined, verdict: TeacherAppStatus) => {
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
      fetchData();
    } catch(e) { console.error(e); }
  };

  const handleSystemReset = async () => {
    if (resetConfirm !== 'RESET') return;
    if (!window.confirm("CRITICAL: This will delete ALL courses, enrollments, applications, and non-admin users. This cannot be undone. Proceed?")) return;

    setIsResetting(true);
    try {
      const collectionsToWipe = [
        'courses', 
        'enrollments', 
        'teacher_applications', 
        'patch_notes', 
        'mail', 
        'messages'
      ];

      for (const colName of collectionsToWipe) {
        console.log(`Attempting to wipe: ${colName}...`);
        try {
          const snap = await getDocs(collection(db, colName));
          const deletePromises = snap.docs.map(d => deleteDoc(doc(db, colName, d.id)));
          await Promise.all(deletePromises);
          console.log(`Successfully wiped ${colName} (${snap.docs.length} docs)`);
        } catch (err) {
          console.error(`Error wiping collection ${colName}:`, err);
          throw new Error(`Failed on ${colName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Wipe users EXCEPT current admin
      console.log("Wiping non-admin users...");
      const uSnap = await getDocs(collection(db, 'users'));
      const userDeletions = uSnap.docs
        .filter(d => d.data().email !== ADMIN_EMAIL)
        .map(d => deleteDoc(doc(db, 'users', d.id)));
      await Promise.all(userDeletions);
      console.log(`Wiped ${userDeletions.length} users.`);

      alert("System Reset Complete. All non-admin data has been wiped.");
      setResetConfirm('');
      setActiveTab('courses');
      fetchData();
    } catch (e) {
      console.error("Reset failed:", e);
      alert(e instanceof Error ? e.message : "Reset failed. Check console for details.");
    } finally {
      setIsResetting(false);
    }
  };




  const handleDeleteUser = async (uid: string) => {
    if(window.confirm("Are you sure you want to ban/remove this user?")) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        fetchData();
      } catch (e) {
        console.error(e);
        alert("Failed to delete user profile.");
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen pt-32 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-500" /></div>;
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center md:text-left tracking-tight">Admin Console</h1>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-hide">
          <button onClick={()=>setActiveTab('courses')} className={`pb-2 px-2 font-bold whitespace-nowrap transition-colors ${activeTab==='courses'?'text-emerald-600 border-b-2 border-emerald-600':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Manage Courses</button>
          <button onClick={()=>setActiveTab('users')} className={`pb-2 px-2 font-bold whitespace-nowrap transition-colors ${activeTab==='users'?'text-emerald-600 border-b-2 border-emerald-600':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Manage Users</button>
          <button onClick={()=>setActiveTab('appointments')} className={`pb-2 px-2 font-bold whitespace-nowrap transition-colors ${activeTab==='appointments'?'text-emerald-600 border-b-2 border-emerald-600':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Teacher Applications</button>
          <button onClick={()=>setActiveTab('patchnotes')} className={`pb-2 px-2 font-bold whitespace-nowrap transition-colors ${activeTab==='patchnotes'?'text-emerald-600 border-b-2 border-emerald-600':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Patch Notes</button>
          <button onClick={()=>setActiveTab('maintenance')} className={`pb-2 px-2 font-bold whitespace-nowrap transition-colors ${activeTab==='maintenance'?'text-rose-600 border-b-4 border-rose-600 font-black':'text-slate-400 hover:text-rose-500'}`}>Maintenance</button>
        </div>


        {activeTab === 'courses' && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus className="w-5 h-5"/> Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold mb-1">Title</label>
                <input required value={newCourse.title} onChange={e=>setNewCourse({...newCourse, title: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold mb-1">Description</label>
                <textarea required value={newCourse.description} onChange={e=>setNewCourse({...newCourse, description: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Category</label>
                <select value={newCourse.category} onChange={e=>setNewCourse({...newCourse, category: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <option value="education">Education</option>
                  <option value="alternative">Alternative Education</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Price (₹)</label>
                <input type="number" required value={newCourse.price} onChange={e=>setNewCourse({...newCourse, price: e.target.value as any})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold mb-2">Course Thumbnail</label>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-48 h-32 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                    {selectedFile ? (
                      <img src={URL.createObjectURL(selectedFile)} alt="preview" className="w-full h-full object-cover" />
                    ) : newCourse.thumbnail ? (
                      <img src={newCourse.thumbnail} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Upload className="w-6 h-6 text-white" />
                      <input type="file" accept="image/*" onChange={e => {if(e.target.files?.[0]) setSelectedFile(e.target.files[0])}} className="hidden" />
                    </label>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <p className="text-xs text-slate-500">Upload a high-quality image from your files, or provide an external URL below.</p>
                    <input type="url" placeholder="Optional: External Image URL" value={newCourse.thumbnail} onChange={e=>setNewCourse({...newCourse, thumbnail: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border border-slate-200 dark:border-slate-700" />
                  </div>
                </div>
              </div>


              <div className="col-span-1 md:col-span-2 pt-4">
                <button type="submit" disabled={creatingCourse} className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
                  {creatingCourse ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Publish Course'}
                </button>
              </div>
            </form>

            <h3 className="text-lg font-bold mb-4 border-t border-slate-100 dark:border-slate-800 pt-6">Existing Courses</h3>
            <div className="grid grid-cols-1 gap-4">
               {coursesList.map(c => (
                 <div key={c.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                   {editingCourseId === c.id ? (
                     <form onSubmit={(e) => { e.preventDefault(); handleUpdateCourse(); }} className="space-y-4">
                       <input value={editCourseData.title} onChange={e=>setEditCourseData({...editCourseData, title: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-900 border dark:border-slate-700" placeholder="Title" required />
                       <textarea value={editCourseData.description} onChange={e=>setEditCourseData({...editCourseData, description: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-900 border dark:border-slate-700" placeholder="Description" required rows={3} />
                       <div className="flex gap-4">
                         <select value={editCourseData.category} onChange={e=>setEditCourseData({...editCourseData, category: e.target.value as any})} className="p-2 rounded bg-white dark:bg-slate-900 border dark:border-slate-700">
                           <option value="education">Education</option>
                           <option value="alternative">Alternative Education</option>
                         </select>
                         <input type="number" value={editCourseData.price} onChange={e=>setEditCourseData({...editCourseData, price: Number(e.target.value)})} className="w-full p-2 rounded bg-white dark:bg-slate-900 border dark:border-slate-700" placeholder="Price" required />
                       </div>
                       
                       <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                         <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-900">
                           {editSelectedFile ? (
                             <img src={URL.createObjectURL(editSelectedFile)} alt="preview" className="w-full h-full object-cover" />
                           ) : (
                             <img src={editCourseData.thumbnail || 'https://via.placeholder.com/150'} alt="current" className="w-full h-full object-cover" />
                           )}
                         </div>
                         <div className="flex-1">
                           <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 transition-colors">
                             <Upload className="w-3 h-3"/> {editSelectedFile ? 'Change File' : 'Upload New Image'}
                             <input type="file" accept="image/*" onChange={e => {if(e.target.files?.[0]) setEditSelectedFile(e.target.files[0])}} className="hidden" />
                           </label>
                           <input value={editCourseData.thumbnail || ''} onChange={e=>setEditCourseData({...editCourseData, thumbnail: e.target.value})} className="w-full mt-2 p-1.5 text-xs rounded bg-white dark:bg-slate-900 border dark:border-slate-700" placeholder="Or paste URL" />
                         </div>
                       </div>

                       <div className="flex gap-2">
                         <button type="submit" disabled={isUploading} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded shadow disabled:opacity-50">
                           {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                           {isUploading ? 'Uploading...' : 'Save'}
                         </button>
                         <button type="button" onClick={()=>setEditingCourseId(null)} className="flex items-center gap-1 bg-slate-300 dark:bg-slate-700 px-3 py-1 rounded shadow"><X className="w-4 h-4"/> Cancel</button>
                       </div>
                     </form>
                   ) : (
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                       <div>
                         <p className="font-bold text-lg">{c.title}</p>
                         <p className="text-sm text-slate-500 uppercase">{c.category} • ₹{c.price || 0}</p>
                       </div>
                       <div className="flex items-center gap-2">
                         <button onClick={() => { setEditingCourseId(c.id); setEditCourseData(c); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                           <Edit className="w-5 h-5"/>
                         </button>
                         <button onClick={() => handleDeleteCourse(c.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                           <Trash2 className="w-5 h-5"/>
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="w-5 h-5"/> User Management</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-slate-200 dark:border-slate-800">
                     <th className="p-3">Name</th>
                     <th className="p-3">Email</th>
                     <th className="p-3">Role</th>
                     <th className="p-3 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {usersList.map((usr) => (
                     <tr key={usr.id} className="border-b border-slate-100 dark:border-slate-800/50">
                       <td className="p-3 font-medium">{usr.name} {usr.email===ADMIN_EMAIL && '(You)'}</td>
                       <td className="p-3 text-slate-500">{usr.email}</td>
                       <td className="p-3"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold uppercase">{usr.role}</span></td>
                       <td className="p-3 text-right">
                         {usr.email !== ADMIN_EMAIL && (
                           <button onClick={()=>handleDeleteUser(usr.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                             <Trash2 className="w-4 h-4"/>
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
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><CalendarClock className="w-5 h-5"/> Teacher Applications</h2>
             {teacherApps.length === 0 ? <p className="text-slate-500">No applications currently.</p> : (
               <div className="space-y-4">
                 {teacherApps.map(app => (
                   <div key={app.id} className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between gap-4">
                     <div>
                       <h3 className="font-bold text-lg">{app.courseTitle}</h3>
                       <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Applicant: {app.userName} ({app.userEmail})</p>
                       <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                         Status: <span className={`uppercase font-black text-[10px] px-2 py-1 rounded-full ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{app.status.replace(/_/g, ' ')}</span>
                       </p>
                       {app.meetingLink && app.status === 'scheduled' && (
                         <p className="text-sm mt-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                           <a href={app.meetingLink} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center gap-2 font-bold"><Video className="w-4 h-4"/> Join Interview Call</a>
                         </p>
                       )}
                     </div>
                     <div className="flex flex-col items-start md:items-end gap-2">
                       {((app.status as string) === 'pending' || (app.status as string) === 'approved_for_interview' || app.status === 'scheduled') ? (
                         <>
                           {app.status === 'pending' && (
                             <button onClick={()=>handleFinalVerdictTeacher(app.id, app.userEmail, 'approved_for_interview')} className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">Approve for Interview</button>
                           )}
                           {app.status === 'approved_for_interview' && (
                             schedulingId === app.id ? (
                                <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-emerald-200 dark:border-emerald-800 w-full md:w-80">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting Link</label>
                                  <input value={meetLink} onChange={e=>setMeetLink(e.target.value)} placeholder="Zoom/Google Meet URL" className="p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                  <div className="flex gap-2 mt-2">
                                     <button onClick={()=>setSchedulingId(null)} className="flex-1 py-2 text-xs font-bold text-slate-500">Cancel</button>
                                     <button onClick={()=>handleApproveApp(app.id, app.userEmail)} className="flex-[2] py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs flex justify-center items-center gap-1 shadow-lg shadow-emerald-500/20"><Check className="w-3 h-3"/> Schedule</button>
                                  </div>
                                </div>
                             ) : (
                               <button onClick={()=>setSchedulingId(app.id)} className="px-6 py-3 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-lg shadow-emerald-500/10">Schedule Call</button>
                             )
                           )}
                           <div className="flex gap-2 mt-2 w-full md:w-auto">
                             {app.status === 'scheduled' && (
                               <button onClick={()=>handleFinalVerdictTeacher(app.id, app.userEmail, 'approved')} className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20">Grant Role</button>
                             )}
                             <button onClick={()=>handleFinalVerdictTeacher(app.id, app.userEmail, 'rejected')} className="flex-1 md:flex-none px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-300 hover:text-red-600 font-bold rounded-xl text-sm transition">{(app.status as string) === 'scheduled' ? 'Reject' : 'Decline'}</button>
                           </div>
                         </>
                       ) : (
                         <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-xl ${app.status === 'approved' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
                           {app.status === 'approved' ? 'Active' : 'Archived'}
                         </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {activeTab === 'patchnotes' && (
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><FileText className="w-5 h-5"/> Publish Patch Notes</h2>
             <form onSubmit={handleCreatePatchNote} className="mb-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold mb-1">Title</label>
                   <input required value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Summer Update" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold mb-1">Version (e.g. v1.2.0)</label>
                   <input required value={newVersion} onChange={e=>setNewVersion(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl" />
                 </div>
                 <div className="col-span-1 md:col-span-2">
                   <label className="block text-sm font-bold mb-1">Updates</label>
                   <textarea rows={5} required value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder="- Added new feature X&#10;- Fixed bug Y" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"></textarea>
                 </div>
                 <div className="col-span-1 md:col-span-2">
                   <button type="submit" disabled={creatingNote} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-opacity">
                     {creatingNote ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Publish Note'}
                   </button>
                 </div>
               </div>
             </form>

             <h3 className="text-lg font-bold mb-4 border-t border-slate-100 dark:border-slate-800 pt-6">Recent Records</h3>
             {patchNotes.length === 0 ? <p className="text-slate-500">No patch notes published.</p> : (
               <div className="space-y-4">
                 {patchNotes.map((note) => (
                   <div key={note.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                     <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">{note.version} • {note.title}</p>
                     <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300">{note.content}</pre>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}


         {activeTab === 'maintenance' && (
           <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-rose-200 dark:border-rose-900/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                 <div>
                    <h2 className="text-2xl font-black text-rose-600 mb-2">System Reset</h2>
                    <p className="text-slate-500 text-sm max-w-md">This utility wipes all structural data from the platform to provide a "clean start" for development. Your primary admin profile is protected.</p>
                 </div>
                 <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-800">
                    <Trash2 className="w-8 h-8 text-rose-600 opacity-50" />
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-amber-800 dark:text-amber-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4"/> Safety Warning
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-500 space-y-1 list-disc pl-4">
                       <li>All Courses will be PERMANENTLY deleted.</li>
                       <li>All Student Enrollments and Progress will be lost.</li>
                       <li>All Chat Messages and Emails will be erased.</li>
                       <li>All User Profiles (except Admin) will be removed from Firestore.</li>
                    </ul>
                 </div>

                 <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Type <span className="text-rose-600 font-black">RESET</span> to confirm</label>
                    <input 
                       value={resetConfirm} 
                       onChange={e => setResetConfirm(e.target.value)} 
                       placeholder="Confirm action..." 
                       className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-rose-500 outline-none transition-all font-mono uppercase text-center text-lg tracking-widest"
                    />
                 </div>

                 <button 
                    onClick={handleSystemReset}
                    disabled={resetConfirm !== 'RESET' || isResetting}
                    className="w-full py-5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-rose-500/20 disabled:shadow-none flex items-center justify-center gap-2"
                 >
                    {isResetting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    {isResetting ? 'Wiping Database...' : 'Finalize System Wipe'}
                 </button>
              </div>
           </div>
         )}

      </div>

    </div>
  );
};

export default AdminDashboard;
