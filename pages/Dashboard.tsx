import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { Loader2, BookOpen, Users, Calendar, AlertCircle, X, Camera, MapPin, Building2, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserObject, CourseEnrollment, Course, TeacherApplication } from '../types';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<(CourseEnrollment & { courseData?: Course })[]>([]);
  const [teacherApplications, setTeacherApplications] = useState<(TeacherApplication & { courseData?: Course })[]>([]);
  const [loading, setLoading] = useState(true);
  


  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!loading && userProfile && containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [loading, userProfile]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        navigate('/login');
        return;
      }

      // Track profile
      const unsubProfile = onSnapshot(doc(db, 'users', u.uid), (docObj) => {
        if (docObj.exists()) {
          setUserProfile({ uid: docObj.id, ...docObj.data() } as UserObject);
        } else {
          setUserProfile({ uid: u.uid, email: u.email || '', name: u.displayName || 'User', role: 'student' } as unknown as UserObject);
        }
      }, (err) => {
        console.warn("Profile snapshot closed or denied", err);
      });

      // Fetch user enrollments (student)
      try {
        const qStudent = query(collection(db, 'enrollments'), where('userId', '==', u.uid), where('role', '==', 'student'));
        const snapStudent = await getDocs(qStudent);
        const sEnrollments: any[] = [];
        for (const docSnap of snapStudent.docs) {
          const data = docSnap.data();
          let cData;
          try {
            const cDoc = await getDoc(doc(db, 'courses', data.courseId));
            if (cDoc.exists()) cData = { id: cDoc.id, ...cDoc.data() };
          } catch (e) {}
          sEnrollments.push({ id: docSnap.id, ...data, courseData: cData });
        }
        setStudentEnrollments(sEnrollments);
      } catch (err) {
        console.error("Error fetching enrollments: ", err);
      }

      // Fetch user teacher applications
      try {
        const qTeacher = query(collection(db, 'teacher_applications'), where('userId', '==', u.uid));
        const snapTeacher = await getDocs(qTeacher);
        const tApps: any[] = [];
        for (const docSnap of snapTeacher.docs) {
          const data = docSnap.data();
           let cData;
           try {
             const cDoc = await getDoc(doc(db, 'courses', data.courseId));
             if (cDoc.exists()) cData = { id: cDoc.id, ...cDoc.data() };
           } catch (e) {}
           tApps.push({ id: docSnap.id, ...data, courseData: cData });
        }
        setTeacherApplications(tApps);
      } catch (err) {
        console.error("Error fetching teacher applications: ", err);
      }

      setLoading(false);

      return () => unsubProfile();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-slate-950 relative">
      <div className="max-w-7xl mx-auto" ref={containerRef}>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200 dark:shadow-slate-950 sticky top-32">
            <div className="flex flex-col items-center text-center">
               
               {userProfile.profilePic ? (
                 <img src={userProfile.profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-slate-100 dark:border-slate-800" />
               ) : (
                 <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                   {(userProfile.name || user?.email || 'U').charAt(0).toUpperCase()}
                 </div>
               )}
               
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate w-full">{userProfile.name || 'User'}</h2>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 truncate w-full">{userProfile.email || user?.email}</p>
               
               <div className="w-full border-t border-slate-100 dark:border-slate-800 py-4 grid grid-cols-2 gap-4 text-center">
                 <div>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">{studentEnrollments.length}</p>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Learning</p>
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">{teacherApplications.length}</p>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teaching</p>
                 </div>
               </div>

               <div className="w-full space-y-2 mb-6">
                 {userProfile.classYear && (
                   <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 justify-center">
                     <Building2 className="w-4 h-4" /> Education: {userProfile.classYear}
                   </div>
                 )}
                 {userProfile.location && (
                   <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 justify-center">
                     <MapPin className="w-4 h-4" /> {userProfile.location}
                   </div>
                 )}
               </div>

               <Link to="/profile" className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors text-sm block text-center">
                 Edit Profile
               </Link>
            </div>
          </div>

          {/* Main Content Areas */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col gap-8">
             
             {/* Learning Dashboard */}
             <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                 <BookOpen className="w-6 h-6 text-blue-500" />
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Learning</h2>
               </div>
               
               {studentEnrollments.length === 0 ? (
                 <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                   <p className="text-slate-500 dark:text-slate-400">You haven't joined any courses yet.</p>
                   <button onClick={() => navigate('/courses')} className="mt-4 text-emerald-600 font-semibold hover:underline">Explore Courses</button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {studentEnrollments.map(enr => (
                     <div key={enr.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                       <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{enr.courseData?.title || 'Unknown Course'}</h3>
                       
                       {enr.studentStatus === 'waitlisted' && (
                         <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg w-fit">
                           <AlertCircle className="w-4 h-4" /> Waitlisted - Pending Mentor
                         </div>
                       )}
                       {enr.paymentStatus === 'pending' ? (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mentor assigned. Payment required.</p>
                            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg w-full transition-colors text-sm">
                              Pay Fee
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                             <button onClick={() => navigate(`/classroom/${enr.courseId}`)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold py-3 px-4 rounded-xl w-full transition-colors shadow-sm flex justify-center items-center gap-2">
                               Enter Classroom
                             </button>
                          </div>
                        )}
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Teaching Dashboard */}
             <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                 <Users className="w-6 h-6 text-purple-500" />
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Teaching</h2>
               </div>
               
               {teacherApplications.length === 0 ? (
                 <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                   <p className="text-slate-500 dark:text-slate-400">You haven't applied to teach any courses.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {teacherApplications.map(app => (
                     <div key={app.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                       <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{app.courseData?.title || 'Unknown Course'}</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 capitalize">Status: <strong className="text-slate-700 dark:text-slate-300">{app.status}</strong></p>
                       
                       {app.status === 'scheduled' && app.meetingLink ? (
                         <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl mt-4">
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4"/> Appointment Scheduled</p>
                            <a href={app.meetingLink} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline text-sm font-medium">Join Meeting</a>
                         </div>
                       ) : app.status === 'pending' ? (
                         <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg w-fit mt-4 flex items-center gap-2">
                           <AlertCircle className="w-4 h-4" /> Awaiting admin review
                         </div>
                       ) : app.status === 'approved' ? (
                         <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                             <button onClick={() => navigate(`/classroom/${app.courseId}`)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl w-full transition-colors shadow-sm flex justify-center items-center gap-2">
                               Enter Mentor Portal
                             </button>
                         </div>
                       ) : null}
                     </div>
                   ))}
                 </div>
               )}
             </div>

          </div>

        </div>
      </div>



    </div>
  );
};

export default Dashboard;
