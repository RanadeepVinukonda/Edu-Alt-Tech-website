import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Course, CourseEnrollment } from '../types';
import { ArrowLeft, CheckCircle2, Clock, Users, BookOpen, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const CourseDetails: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  
  const contentRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!loading && course) {
      gsap.fromTo(contentRef.current, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [loading, course]);

  useEffect(() => {
    const fetchCourseAndEnrollment = async (currentUser: FirebaseUser | null) => {
      if (!courseId) return;
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
        }

        if (currentUser) {
          // Check if already enrolled or applied
          const enrollmentsRef = collection(db, 'enrollments');
          const q = query(enrollmentsRef, where('userId', '==', currentUser.uid), where('courseId', '==', courseId));
          const querySnapshot = await getDocs(q);
          
          let enrData: CourseEnrollment | null = null;
          if (!querySnapshot.empty) {
             enrData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as CourseEnrollment;
             setEnrollment(enrData);
          }

          // Fetch Approved Mentors for this course
          const appsQ = query(collection(db, 'teacher_applications'), where('courseId', '==', courseId), where('status', '==', 'approved'));
          const appsSnap = await getDocs(appsQ);

          const loadedMentors = appsSnap.docs.map(doc => {
            const data = doc.data();
            return {
              appId: doc.id,
              userId: data.userId,
              name: data.userName || 'Mentor',
              email: data.userEmail || '',
              experience: data.experience || 'Experienced Professional',
              skills: data.skills || 'Course Expert',
              message: data.message || '',
              proposedPath: data.proposedPath || []
            };
          });
          setMentors(loadedMentors);

          if (loadedMentors.length === 1) {
            setSelectedMentor(loadedMentors[0].userId);
          }

          // --- AUTO REDIRECT TO CLASSROOM ---
          const isApprovedMentor = loadedMentors.some(m => m.userId === currentUser.uid);
          const isActiveStudent = enrData?.studentStatus === 'active';
          
          if (isApprovedMentor || isActiveStudent) {
             navigate(`/classroom/${courseId}`);
             return; // Stop rendering course details page
          }
        } else {
          // For guests, just fetch mentors to show who is teaching
          const appsQ = query(collection(db, 'teacher_applications'), where('courseId', '==', courseId), where('status', '==', 'approved'));
          const appsSnap = await getDocs(appsQ);
          const loadedMentors = appsSnap.docs.map(doc => {
            const data = doc.data();
            return {
              appId: doc.id,
              userId: data.userId,
              name: data.userName || 'Mentor',
              email: data.userEmail || '',
              experience: data.experience || 'Experienced Professional',
              skills: data.skills || 'Course Expert',
              message: data.message || '',
              proposedPath: data.proposedPath || []
            };
          });
          setMentors(loadedMentors);
        }

      } catch (err) {
        console.error("Failed to load details", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      fetchCourseAndEnrollment(currentUser);
    });

    return () => unsubscribe();
  }, [courseId]);

  const handleJoinAsStudent = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrollLoading(true);
    try {
      const enrollmentRef = doc(collection(db, 'enrollments'));
      const newEnrollment: CourseEnrollment = {
        id: enrollmentRef.id,
        userId: user.uid,
        courseId: courseId!,
        role: 'student',
        studentStatus: 'active',
        paymentStatus: 'not-required',
        mentorId: selectedMentor || undefined,
        createdAt: serverTimestamp()
      };
      await setDoc(enrollmentRef, newEnrollment as any);
      setEnrollment(newEnrollment);

      // Trigger Email Extension Logic
      try {
        await setDoc(doc(collection(db, 'mail')), {
          to: user.email,
          message: {
            subject: `Successfully Enrolled: ${course?.title || 'Unknown Course'}`,
            text: `Hi ${user.displayName || 'Student'},\n\nGreat news! You are now enrolled in ${course?.title || 'Unknown Course'}. You can access your course materials from your dashboard.\n\nHappy Learning,\nEduAltTech`
          }
        });
      } catch (mailErr) {
        console.error("Email trigger failed", mailErr);
      }

      alert("You have successfully enrolled in the course!");
    } catch (err) {
      console.error(err);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleApplyToTeach = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/teacher-application?courseId=${courseId}`);
  };

  if (loading) {
    return <div className="min-h-screen pt-32 pb-24 flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>;
  }

  if (!course) {
    return <div className="min-h-screen pt-32 pb-24 text-center text-slate-500">Course not found.</div>;
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto" ref={contentRef}>
        <Link to="/courses" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>

        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200 dark:shadow-slate-950 mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
            <div>
              <div className={`mb-4 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${course.category === 'education' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                {course.category}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">{course.title}</h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">{course.description}</p>
            </div>
            <div className="flex flex-col items-start md:items-end flex-shrink-0">
               <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                 {course.price === 0 || !course.price ? 'Free' : `₹${course.price}`}
               </span>
               <span className="text-sm font-medium text-slate-500 flex items-center gap-1"><Users className="w-4 h-4" /> Open for enrollment</span>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800 my-8" />

          {/* Action Area depending on Enrollment */}
          <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
            {enrollment ? (
              <div className="flex flex-col items-center text-center">
                {enrollment.role === 'student' ? (
                   enrollment.paymentStatus === 'pending' ? (
                     <>
                        <AlertCircle className="w-16 h-16 text-blue-500 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Mentor Assigned!</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                          A mentor is ready to teach you. Please complete the payment to start learning.
                        </p>
                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all w-full md:w-auto">
                          Pay ₹{course.price || 0} Now
                        </button>
                     </>
                   ) : (
                     <>
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">You are enrolled!</h2>
                        <Link to="/dashboard" className="text-emerald-600 hover:underline mt-2 font-medium flex items-center gap-1">
                          Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                     </>
                   )
                ) : (
                  <>
                     <CheckCircle2 className="w-16 h-16 text-purple-500 mb-4" />
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Teacher Application Submitted</h2>
                     <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                        You have applied to teach this course. Check your dashboard for appointment updates.
                     </p>
                     <Link to="/dashboard" className="text-purple-600 hover:underline mt-2 font-medium flex items-center gap-1">
                        View Schedule <ArrowRight className="w-4 h-4" />
                     </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-500"/> Join as a Student</h3>
                  {mentors.length === 0 ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                      <p className="text-slate-500 font-medium">No active mentors available right now.</p>
                      <p className="text-sm mt-1 text-slate-400">Please wait for a mentor to be approved to teach.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mentors.map(m => (
                        <div 
                           key={m.userId}
                           onClick={() => setSelectedMentor(m.userId)}
                           className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedMentor === m.userId ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                        >
                           <div className="flex justify-between items-start mb-2">
                             <p className="font-bold text-slate-900 dark:text-white text-lg">{m.name}</p>
                             {selectedMentor === m.userId && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                           </div>
                           <p className="text-sm text-slate-500 mb-1 leading-snug"><strong>Experience:</strong> {m.experience}</p>
                           <p className="text-sm text-slate-500 leading-snug"><strong>Skills:</strong> {m.skills}</p>
                           {m.message && <p className="text-xs text-slate-400 mt-2 italic">"{m.message}"</p>}
                           
                           {m.proposedPath && m.proposedPath.length > 0 && (
                             <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                               <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Proposed Curriculum:</p>
                               <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                                 {m.proposedPath.map((pathItem: string, idx: number) => (
                                   <li key={idx} className="truncate">{pathItem}</li>
                                 ))}
                               </ul>
                             </div>
                           )}
                        </div>
                      ))}
                      <button 
                        onClick={handleJoinAsStudent}
                        disabled={enrollLoading || !selectedMentor}
                        className="w-full bg-slate-900 dark:bg-emerald-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-md disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
                      >
                        {enrollLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (selectedMentor ? 'Enroll under Mentor' : 'Select a Mentor to Enroll')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
                  <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2"><Users className="w-5 h-5 text-purple-500"/> Teach this Course</h3>
                  <p className="text-slate-500 text-sm mb-4 max-w-sm">
                    Are you qualified to teach this subject? Apply to become a mentor and start teaching students securely.
                  </p>
                  <button 
                    onClick={handleApplyToTeach}
                    className="w-full max-w-xs bg-white dark:bg-transparent text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500 dark:hover:border-purple-500 font-bold py-3 px-8 rounded-xl transition-all shadow-sm"
                  >
                    Apply to Teach
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
