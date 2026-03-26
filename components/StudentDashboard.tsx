import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Course, Enrollment, ClassSession, Subject } from '../types';
import { Loader2, BookOpen, ExternalLink, Calendar as CalendarIcon, Target, IndianRupee } from 'lucide-react';

declare global {
  interface Window { Razorpay: any; }
}

interface Props {
  user: User;
  activeTab: string;
}

const StudentDashboard: React.FC<Props> = ({ user, activeTab }) => {
  const [loading, setLoading] = useState(true);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [courseSubjects, setCourseSubjects] = useState<{ [courseId: string]: Subject[] }>({});

  // Fetch all courses and enrollments
  useEffect(() => {
    // 1. Listen to enrollments
    const enrollQ = query(collection(db, 'enrollments'), where('studentId', '==', user.uid));
    let unsubClasses: any = null;

    const unsubEnroll = onSnapshot(enrollQ, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.data().courseId);
      setEnrolledCourseIds(ids);

      // If enrolled in courses, fetch upcoming classes
      if (ids.length > 0) {
        if (unsubClasses) unsubClasses(); // Cleanup previous active listener
        const chunk = ids.slice(0, 10);
        const classQ = query(collection(db, 'classes'), where('courseId', 'in', chunk)); // Removed Firebase orderBy to fix index errors
        
        unsubClasses = onSnapshot(classQ, (classSnap) => {
           const now = new Date().getTime() - (24 * 60 * 60 * 1000); // include slightly past for recorded
           const clsData = classSnap.docs
             .map(d => ({ id: d.id, ...d.data() } as ClassSession))
             .filter(c => new Date(c.date).getTime() > now);
           
           // Sort locally by date directly bypassing indexes
           clsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
           
           setUpcomingClasses(clsData);
        });
      } else {
        setUpcomingClasses([]);
        setLoading(false);
      }
    });

    // 2. Fetch all courses for catalog
    const fetchCourses = async () => {
      const q = query(collection(db, 'courses'));
      const snap = await getDocs(q);
      const courses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setAllCourses(courses);
      setLoading(false);

      // Fetch subjects for each course
      const subjectsMap: { [courseId: string]: Subject[] } = {};
      await Promise.all(courses.map(async (course) => {
        const subSnap = await getDocs(collection(db, 'courses', course.id, 'subjects'));
        subjectsMap[course.id] = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
      }));
      setCourseSubjects(subjectsMap);
    };
    fetchCourses();

    return () => {
      unsubEnroll();
      if (unsubClasses) unsubClasses();
    };
  }, [user.uid]);

  const handleEnroll = async (course: Course) => {
    const courseId = course.id;
    const price = course.price ?? 0;

    if (price > 0) {
      // Paid course — go through Razorpay
      setActionLoading(courseId);
      try {
        const res = await fetch('/api/createOrder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: price * 100 }) // paise
        });
        const order = await res.json();
        if (!res.ok) throw new Error(order.error || 'Failed to create order');

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Edu-Alt-Tech',
          description: course.title,
          order_id: order.id,
          handler: async (response: any) => {
            // Verify payment
            const verifyRes = await fetch('/api/verifyPayment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              const enrollmentId = `${user.uid}_${courseId}`;
              await setDoc(doc(db, 'enrollments', enrollmentId), {
                studentId: user.uid,
                courseId,
                enrolledAt: serverTimestamp(),
                paymentId: response.razorpay_payment_id,
                amountPaid: price
              });
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: { email: user.email || '' },
          theme: { color: '#10b981' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => alert('Payment failed. Please try again.'));
        rzp.open();
      } catch (e: any) {
        console.error(e);
        alert(e.message || 'Payment initiation failed');
      } finally {
        setActionLoading(null);
      }
    } else {
      // Free course — enroll directly
      setActionLoading(courseId);
      try {
        const enrollmentId = `${user.uid}_${courseId}`;
        await setDoc(doc(db, 'enrollments', enrollmentId), {
          studentId: user.uid,
          courseId,
          enrolledAt: serverTimestamp()
        });
      } catch (e) {
        console.error(e);
        alert('Failed to enroll');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleJoinClass = async (cls: ClassSession) => {
    setActionLoading(cls.id);
    try {
      const attendanceId = `${cls.id}_${user.uid}`;
      await setDoc(doc(db, 'attendance', attendanceId), {
        classId: cls.id,
        studentId: user.uid,
        courseId: cls.courseId,
        status: 'Present',
        joinedAt: serverTimestamp()
      });
      // Open link in new tab
      window.open(cls.meetLink, '_blank');
    } catch (e) {
      console.error(e);
      alert("Failed to log attendance");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  const enrolledCoursesList = allCourses.filter(c => enrolledCourseIds.includes(c.id));
  const availableCoursesList = allCourses.filter(c => !enrolledCourseIds.includes(c.id));

  return (
    <div className="animate-in fade-in duration-500">
      {activeTab === 'overview' && (
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-6">My Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase">Enrolled Courses</p>
                <p className="text-4xl font-bold text-slate-900 mt-1">{enrolledCoursesList.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Target className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase">Upcoming Classes</p>
                <p className="text-4xl font-bold text-slate-900 mt-1">{upcomingClasses.length}</p>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-4">Your Courses</h3>
          {enrolledCoursesList.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-500 mb-4">You haven't enrolled in any courses yet.</p>
              <button 
                onClick={() => document.querySelector<HTMLButtonElement>('button:contains("Course Catalog")')?.click()} 
                className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {enrolledCoursesList.map(course => (
                <div key={course.id} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-lg text-slate-900 truncate mb-2">{course.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2">{course.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'enroll' && (
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            Course Catalog
          </h2>
          <p className="text-slate-500 mb-8 border-b border-slate-200 pb-6">Discover and enroll in new learning paths created by expert teachers.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCoursesList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500">
                No new courses available at the moment.
              </div>
            ) : null}

            {availableCoursesList.map(course => (
              <div key={course.id} className="card-hover animate-slide-up group p-6 bg-white rounded-3xl border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all flex flex-col gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-emerald-500 flex items-center justify-center transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2 truncate">{course.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{course.description}</p>
                </div>
                {/* Subjects taught */}
                {courseSubjects[course.id]?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {courseSubjects[course.id].map(sub => (
                      <span key={sub.id} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                        {sub.title}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-base">
                  <IndianRupee className="w-4 h-4 text-emerald-500" />
                  {course.price != null && course.price > 0 ? (
                    <span>₹{course.price}</span>
                  ) : (
                    <span className="text-emerald-600">Free</span>
                  )}
                </div>
                <div className="mt-auto pt-4 flex gap-2 w-full border-t border-slate-100">
                  <button 
                    onClick={() => handleEnroll(course)}
                    disabled={actionLoading === course.id}
                    className="btn-shine flex-1 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white font-bold text-sm rounded-xl transition-colors text-center w-full flex justify-center items-center h-11"
                  >
                    {actionLoading === course.id ? <Loader2 className="w-5 h-5 animate-spin" /> : (course.price && course.price > 0 ? `Pay & Enroll` : 'Enroll Now')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Upcoming Classes</h2>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            {upcomingClasses.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <CalendarIcon className="w-16 h-16 text-slate-200 mb-6" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No upcoming classes</h3>
                <p className="text-slate-400 max-w-sm">Enjoy your free time or enroll in more courses to fill your schedule.</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {upcomingClasses.map(cls => {
                  const courseTitle = allCourses.find(c => c.id === cls.courseId)?.title || 'Course';
                  return (
                    <div key={cls.id} className="p-6 border border-slate-100 rounded-[2rem] hover:border-emerald-200 hover:shadow-md transition-all group flex flex-col sm:flex-row gap-6 sm:items-center justify-between bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${cls.type === 'Live' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {cls.type}
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{courseTitle}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xl mb-1">{cls.title}</h4>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(cls.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => handleJoinClass(cls)}
                        disabled={actionLoading === cls.id}
                        className="btn-shine px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-lg sm:w-auto w-full disabled:opacity-50"
                      >
                        {actionLoading === cls.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            {cls.type === 'Live' ? 'Join Class' : 'Watch Recording'}
                            <ExternalLink className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
