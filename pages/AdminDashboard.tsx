import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { Loader2, Plus, Users, CalendarClock, Trash2, Check, Video, FileText, Edit, Save, X } from 'lucide-react';
import { Course, TeacherApplication, PatchNote } from '../types';

const ADMIN_EMAIL = 'viranadeep@gmail.com';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'appointments' | 'course_apps' | 'patchnotes'>('courses');
  const navigate = useNavigate();

  // Data states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [teacherApps, setTeacherApps] = useState<(TeacherApplication & { userName?: string, userEmail?: string, courseTitle?: string })[]>([]);
  const [patchNotes, setPatchNotes] = useState<PatchNote[]>([]);

  // Create course states
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: 'education', price: 0 });
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Edit course states
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseData, setEditCourseData] = useState<Course>({} as Course);

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
    try {
      await updateDoc(doc(db, 'courses', editingCourseId), {
        title: editCourseData.title,
        description: editCourseData.description,
        category: editCourseData.category,
        price: editCourseData.price
      });
      setEditingCourseId(null);
      fetchData();
    } catch (e) {
      console.error(e);
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
    try {
      // Fetch Users
      try {
        const uSnap = await getDocs(collection(db, 'users'));
        setUsersList(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error("Error fetching users", err); }

      // Fetch Courses
      let cl: Course[] = [];
      try {
        const cSnap = await getDocs(collection(db, 'courses'));
        cl = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        setCoursesList(cl);
      } catch (err) { console.error("Error fetching courses", err); }

      // Fetch Apps
      try {
        const aSnap = await getDocs(collection(db, 'teacher_applications'));
        const al = await Promise.all(aSnap.docs.map(async (d) => {
          const data = d.data() as TeacherApplication;
          let cName = 'Unknown', uName = 'Unknown', uEmail = '';
          const cFind = cl.find(c => c.id === data.courseId);
          if (cFind) cName = cFind.title;
          const uFind = usersList.find(u => u.id === data.userId);
          if (uFind) { uName = uFind.name; uEmail = uFind.email; }
          return { ...data, id: d.id, courseTitle: cName, userName: uName, userEmail: uEmail };
        }));
        setTeacherApps(al);
      } catch (err) { console.error("Error fetching teacher apps", err); }

      // Fetch Patch Notes
      try {
        const pQ = query(collection(db, 'patch_notes'), orderBy('createdAt', 'desc'));
        const pSnap = await getDocs(pQ);
        setPatchNotes(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as PatchNote)));
      } catch (err) { console.error("Error fetching patch notes", err); }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCourse(true);
    try {
      const cRef = doc(collection(db, 'courses'));
      const courseObj: Course = {
        id: cRef.id,
        title: newCourse.title,
        description: newCourse.description,
        category: newCourse.category as any,
        price: Number(newCourse.price),
        createdBy: 'admin',
        createdAt: serverTimestamp()
      };
      await setDoc(cRef, courseObj as any);
      setNewCourse({ title: '', description: '', category: 'education', price: 0 });
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
      await setDoc(pRef, note as any);
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

      // Email Notification
      if (emailStr) {
        try {
          await setDoc(doc(collection(db, 'mail')), {
            to: emailStr,
            message: {
              subject: 'Teacher Application Approved!',
              text: `Your application to teach has been reviewed and approved. Please join us for a brief introductory call at the scheduled time here: ${meetLink}`
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

  const handleFinalVerdictTeacher = async (appId: string, emailStr: string | undefined, verdict: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'teacher_applications', appId), {
        status: verdict,
        updatedAt: serverTimestamp()
      });
      if (emailStr) {
        await setDoc(doc(collection(db, 'mail')), {
          to: emailStr,
          message: {
            subject: `Teacher Application ${verdict === 'approved' ? 'Approved' : 'Rejected'}`,
            text: verdict === 'approved' 
              ? 'Congratulations! You have been approved to teach. Welcome to the team.'
              : 'Thank you for your interest, but we are unable to proceed with your application at this time.'
          }
        });
      }
      fetchData();
    } catch(e) { console.error(e); }
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
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          <button onClick={()=>setActiveTab('courses')} className={`pb-2 px-2 font-bold whitespace-nowrap ${activeTab==='courses'?'text-emerald-600 border-b-2 border-emerald-600':'text-slate-500'}`}>Manage Courses</button>
          <button onClick={()=>setActiveTab('users')} className={`pb-2 px-2 font-bold whitespace-nowrap ${activeTab==='users'?'text-emerald-600 border-b-2 border-emerald-600':'text-slate-500'}`}>Manage Users</button>
          <button onClick={()=>setActiveTab('appointments')} className={`pb-2 px-2 font-bold whitespace-nowrap ${activeTab==='appointments'?'text-emerald-600 border-b-2 border-emerald-600':'text-slate-500'}`}>Teacher Applications</button>
          <button onClick={()=>setActiveTab('patchnotes')} className={`pb-2 px-2 font-bold whitespace-nowrap ${activeTab==='patchnotes'?'text-emerald-600 border-b-2 border-emerald-600':'text-slate-500'}`}>Patch Notes</button>
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
                       <div className="flex gap-2">
                         <button type="submit" className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded shadow"><Save className="w-4 h-4"/> Save</button>
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
                       <p className="text-sm text-slate-500 mt-1">Status: <span className="uppercase font-bold">{app.status}</span></p>
                       {app.meetingLink && app.status === 'scheduled' && (
                         <p className="text-sm mt-1">
                           <a href={app.meetingLink} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">Join Meeting: {app.meetingLink}</a>
                         </p>
                       )}
                     </div>
                     <div className="flex flex-col items-start md:items-end gap-2">
                       {app.status === 'pending' || app.status === 'scheduled' ? (
                         <>
                           {app.status === 'pending' && (
                             schedulingId === app.id ? (
                                <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 w-full md:w-auto">
                                  <label className="text-xs font-bold text-slate-500 uppercase">Input Meet Link</label>
                                  <input value={meetLink} onChange={e=>setMeetLink(e.target.value)} placeholder="https://meet.google.com/..." className="p-2 text-sm rounded bg-slate-50 dark:bg-slate-800" />
                                  <button onClick={()=>handleApproveApp(app.id, app.userEmail)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg text-sm flex justify-center gap-1"><Check className="w-4 h-4"/> Schedule</button>
                                </div>
                             ) : (
                               <button onClick={()=>setSchedulingId(app.id)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm">Schedule Meet</button>
                             )
                           )}
                           <div className="flex gap-2 mt-2">
                             <button onClick={()=>handleFinalVerdictTeacher(app.id, app.userEmail, 'approved')} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition">Approve</button>
                             <button onClick={()=>handleFinalVerdictTeacher(app.id, app.userEmail, 'rejected')} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition">Reject</button>
                           </div>
                         </>
                       ) : (
                         <div className={`flex items-center gap-2 font-bold px-3 py-2 rounded-lg text-sm uppercase ${app.status === 'approved' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
                           {app.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
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
                   <label className="block text-sm font-bold mb-1">Updates (Markdown support available if implemented)</label>
                   <textarea rows={5} required value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder="- Added new feature X&#10;- Fixed bug Y" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"></textarea>
                 </div>
                 <div className="col-span-1 md:col-span-2">
                   <button type="submit" disabled={creatingNote} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
                     {creatingNote ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Publish Note'}
                   </button>
                 </div>
               </div>
             </form>

             <h3 className="text-lg font-bold mb-4 border-t border-slate-100 dark:border-slate-800 pt-6">Recent Patch Notes</h3>
             {patchNotes.length === 0 ? <p className="text-slate-500">No patch notes published.</p> : (
               <div className="space-y-4">
                 {patchNotes.map((note) => (
                   <div key={note.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                     <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">{note.version}</p>
                     <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300">{note.content}</pre>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
