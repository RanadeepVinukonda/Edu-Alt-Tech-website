import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';import { Course, ClassSession, Subject } from '../types';
import { Loader2, BookOpen, ExternalLink, Calendar as CalendarIcon, Target, IndianRupee, Bell, ArrowRight, Play, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CourseDetail from './CourseDetail';
import Chat from './Chat';

declare global { interface Window { Razorpay: any; } }

interface Props { user: User; activeTab: string; }

// ── helpers ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const } }),
};

const BADGES = ['Popular', 'New', 'Trending', 'Hot'];
const BADGE_COLORS: Record<string, string> = {
  Popular: 'bg-emerald-500 text-white',
  New: 'bg-blue-500 text-white',
  Trending: 'bg-purple-500 text-white',
  Hot: 'bg-orange-500 text-white',
};

// ── Component ─────────────────────────────────────────────────────────────────
const StudentDashboard: React.FC<Props> = ({ user, activeTab }) => {
  const [loading, setLoading] = useState(true);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [courseSubjects, setCourseSubjects] = useState<{ [courseId: string]: Subject[] }>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; text: string; createdAt: any }[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  // Fetch real notifications from Firestore
  useEffect(() => {
    const q = query(collection(db, 'notifications'), where('global', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as { id: string; text: string; createdAt: any }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        .slice(0, 10);
      setNotifications(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const enrollQ = query(collection(db, 'enrollments'), where('studentId', '==', user.uid));
    let unsubClasses: any = null;

    const unsubEnroll = onSnapshot(enrollQ, (snapshot) => {
      const ids = snapshot.docs.map(d => d.data().courseId);
      setEnrolledCourseIds(ids);
      if (ids.length > 0) {
        if (unsubClasses) unsubClasses();
        const chunk = ids.slice(0, 10);
        const classQ = query(collection(db, 'classes'), where('courseId', 'in', chunk));
        unsubClasses = onSnapshot(classQ, (classSnap) => {
          const now = new Date().getTime() - 86400000;
          const clsData = classSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as ClassSession))
            .filter(c => new Date(c.date).getTime() > now);
          clsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setUpcomingClasses(clsData);
        });
      } else {
        setUpcomingClasses([]);
        setLoading(false);
      }
    });

    const fetchCourses = async () => {
      const snap = await getDocs(query(collection(db, 'courses')));
      const courses = snap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
      setAllCourses(courses);
      setLoading(false);
      const subjectsMap: { [courseId: string]: Subject[] } = {};
      await Promise.all(courses.map(async (course) => {
        const subSnap = await getDocs(collection(db, 'courses', course.id, 'subjects'));
        subjectsMap[course.id] = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
      }));
      setCourseSubjects(subjectsMap);
    };
    fetchCourses();

    return () => { unsubEnroll(); if (unsubClasses) unsubClasses(); };
  }, [user.uid]);

  const handleEnroll = async (course: Course) => {
    const courseId = course.id;
    const price = course.price ?? 0;
    if (price > 0) {
      setActionLoading(courseId);
      try {
        const res = await fetch('/api/createOrder', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: price * 100 }),
        });
        const order = await res.json();
        if (!res.ok) throw new Error(order.error || 'Failed to create order');
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount, currency: order.currency,
          name: 'Edu-Alt-Tech', description: course.title, order_id: order.id,
          handler: async (response: any) => {
            const verifyRes = await fetch('/api/verifyPayment', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await setDoc(doc(db, 'enrollments', `${user.uid}_${courseId}`), {
                studentId: user.uid, courseId, enrolledAt: serverTimestamp(),
                paymentId: response.razorpay_payment_id, amountPaid: price,
              });
            } else alert('Payment verification failed.');
          },
          prefill: { email: user.email || '' }, theme: { color: '#10b981' },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => alert('Payment failed. Please try again.'));
        rzp.open();
      } catch (e: any) { alert(e.message || 'Payment initiation failed'); }
      finally { setActionLoading(null); }
    } else {
      setActionLoading(courseId);
      try {
        await setDoc(doc(db, 'enrollments', `${user.uid}_${courseId}`), {
          studentId: user.uid, courseId, enrolledAt: serverTimestamp(),
        });
      } catch { alert('Failed to enroll'); }
      finally { setActionLoading(null); }
    }
  };

  const handleJoinClass = async (cls: ClassSession) => {
    setActionLoading(cls.id);
    try {
      await setDoc(doc(db, 'attendance', `${cls.id}_${user.uid}`), {
        classId: cls.id, studentId: user.uid, courseId: cls.courseId,
        status: 'Present', joinedAt: serverTimestamp(),
      });
      window.open(cls.meetLink, '_blank');
    } catch { alert('Failed to log attendance'); }
    finally { setActionLoading(null); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  const enrolledCoursesList = allCourses.filter(c => enrolledCourseIds.includes(c.id));
  const availableCoursesList = allCourses.filter(c => !enrolledCourseIds.includes(c.id));
  const firstName = user.displayName?.split(' ')[0] || 'Learner';

  return (
    <div className="animate-in fade-in duration-500">

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && selectedCourse && (
        <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} readonly />
      )}

      {activeTab === 'overview' && !selectedCourse && (
        <div>
          {/* Hero greeting */}
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="relative mb-8 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-8 shadow-2xl"
          >
            {/* glassmorphism overlay */}
            <div className="absolute inset-0 backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">{getGreeting()} 👋</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{firstName}</h2>
                <p className="text-slate-400 text-sm">
                  {enrolledCoursesList.length} active course{enrolledCoursesList.length !== 1 ? 's' : ''} &nbsp;•&nbsp; {upcomingClasses.length} upcoming class{upcomingClasses.length !== 1 ? 'es' : ''}
                </p>
                {/* Subjects count */}
                <div className="flex items-center gap-2 mt-3">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold text-sm">
                    {enrolledCoursesList.reduce((acc, c) => acc + (courseSubjects[c.id]?.length || 0), 0)} subjects enrolled
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Resume last lesson */}
                {enrolledCoursesList.length > 0 && (
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedCourse(enrolledCoursesList[0])}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl shadow-lg transition-colors"
                  >
                    <Play className="w-4 h-4" /> Resume Learning
                  </motion.button>
                )}
                {/* Notification bell */}
                <div className="relative">
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNotif(v => !v)}
                    className="relative flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">{notifications.length}</span>
                  </motion.button>
                  <AnimatePresence>
                    {showNotif && (
                      <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 top-14 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-800">
                          <p className="text-white font-bold text-sm">Notifications</p>
                        </div>
                        {notifications.map(n => (
                          <div key={n.id} className="px-4 py-3 hover:bg-slate-800 transition-colors">
                            <p className="text-slate-300 text-sm">{n.text}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Courses', value: enrolledCoursesList.length, icon: '📚', color: 'from-emerald-500/20 to-emerald-600/10' },
              { label: 'Upcoming', value: upcomingClasses.length, icon: '📅', color: 'from-blue-500/20 to-blue-600/10' },
              { label: 'Subjects', value: enrolledCoursesList.reduce((acc, c) => acc + (courseSubjects[c.id]?.length || 0), 0), icon: '�', color: 'from-purple-500/20 to-purple-600/10' },
              { label: 'Available', value: availableCoursesList.length, icon: '🎯', color: 'from-orange-500/20 to-orange-600/10' },
            ].map((stat, i) => (
              <motion.div key={stat.label} custom={i} variants={CARD_VARIANTS} initial="hidden" animate="visible"
                className={`bg-gradient-to-br ${stat.color} backdrop-blur-md border border-white/10 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-2 shadow-sm`}
              >
                <span className="text-2xl">{stat.icon}</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Enrolled courses — premium cards */}
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your Courses</h3>
          {enrolledCoursesList.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't enrolled in any courses yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {enrolledCoursesList.map((course, i) => {
                const badge = BADGES[i % BADGES.length];
                const progress = Math.floor(30 + (i * 17) % 60); // placeholder %
                return (
                  <motion.div key={course.id} custom={i} variants={CARD_VARIANTS} initial="hidden" animate="visible"
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 shadow-xl border border-white/5 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-lg text-white truncate flex-1 mr-2">{course.title}</h4>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${BADGE_COLORS[badge]}`}>{badge}</span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{course.description}</p>
                    {/* Progress bar */}
                    <div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{progress}% completed</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedCourse(course)}
                      className="mt-1 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      Continue Learning <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Recommended courses */}
          {availableCoursesList.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Recommended for You</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availableCoursesList.slice(0, 3).map((course, i) => (
                  <motion.div key={course.id} custom={i} variants={CARD_VARIANTS} initial="hidden" animate="visible"
                    whileHover={{ scale: 1.02 }}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-sm"
                  >
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{course.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-emerald-600 font-bold text-sm flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />{course.price && course.price > 0 ? course.price : 'Free'}
                      </span>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => handleEnroll(course)} disabled={actionLoading === course.id}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        {actionLoading === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enroll'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CATALOG ──────────────────────────────────────────────────────── */}
      {activeTab === 'enroll' && (
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Course Catalog</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
            Discover and enroll in new learning paths created by expert teachers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCoursesList.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">No new courses available at the moment.</div>
            )}
            {availableCoursesList.map((course, i) => {
              const badge = BADGES[i % BADGES.length];
              return (
                <motion.div key={course.id} custom={i} variants={CARD_VARIANTS} initial="hidden" animate="visible"
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 shadow-xl border border-white/5 flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-xl font-bold text-white truncate flex-1 mr-2">{course.title}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${BADGE_COLORS[badge]}`}>{badge}</span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">{course.description}</p>
                  {courseSubjects[course.id]?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {courseSubjects[course.id].map(sub => (
                        <span key={sub.id} className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30">
                          {sub.title}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <IndianRupee className="w-4 h-4 text-emerald-400" />
                    {course.price && course.price > 0 ? <span>₹{course.price}</span> : <span className="text-emerald-400">Free</span>}
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleEnroll(course)} disabled={actionLoading === course.id}
                    className="mt-auto w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
                  >
                    {actionLoading === course.id ? <Loader2 className="w-5 h-5 animate-spin" /> : (course.price && course.price > 0 ? 'Pay & Enroll' : 'Enroll Now')}
                    {!actionLoading && <ArrowRight className="w-4 h-4" />}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── UPCOMING ─────────────────────────────────────────────────────── */}
      {activeTab === 'upcoming' && (
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Upcoming Classes</h2>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
            {upcomingClasses.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <CalendarIcon className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-6" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No upcoming classes</h3>
                <p className="text-slate-400 max-w-sm">Enjoy your free time or enroll in more courses to fill your schedule.</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {upcomingClasses.map((cls, i) => {
                  const courseTitle = allCourses.find(c => c.id === cls.courseId)?.title || 'Course';
                  return (
                    <motion.div key={cls.id} custom={i} variants={CARD_VARIANTS} initial="hidden" animate="visible"
                      className="p-6 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 sm:items-center justify-between bg-slate-50/50 dark:bg-slate-800/50"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${cls.type === 'Live' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{cls.type}</span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{courseTitle}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-1">{cls.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(cls.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                      </div>
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => handleJoinClass(cls)} disabled={actionLoading === cls.id}
                        className="px-8 py-4 bg-slate-900 dark:bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-lg sm:w-auto w-full disabled:opacity-50"
                      >
                        {actionLoading === cls.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{cls.type === 'Live' ? 'Join Class' : 'Watch Recording'}<ExternalLink className="w-4 h-4" /></>}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'messages' && (
        <Chat user={user} role="student" />
      )}
    </div>
  );
};

export default StudentDashboard;
