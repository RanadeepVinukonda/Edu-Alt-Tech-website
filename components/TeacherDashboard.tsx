import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, deleteDoc, doc, serverTimestamp, onSnapshot, updateDoc } from 'firebase/firestore';
import { Course } from '../types';
import { Loader2, Plus, Trash2, Folder, BookOpen, IndianRupee, Bell, Send } from 'lucide-react';
import CourseDetail from './CourseDetail';
import ScheduleClass from './ScheduleClass';
import TeacherStudents from './TeacherStudents';
import Chat from './Chat';

interface Props {
  user: User;
  activeTab: string;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const TeacherDashboard: React.FC<Props> = ({ user, activeTab }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', price: '' });

  // Price editing state
  const [editingPriceCourseId, setEditingPriceCourseId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');

  // Notification state
  const [notifText, setNotifText] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);
  const [sentNotifs, setSentNotifs] = useState<{ id: string; text: string; createdAt: any }[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), where('global', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as { id: string; text: string; createdAt: any }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setSentNotifs(data);
    });
    return () => unsub();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifText.trim()) return;
    setNotifLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        text: notifText.trim(),
        global: true,
        teacherId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNotifText('');
    } catch (err) {
      console.error('Error sending notification:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'courses'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      // Sort in memory since we don't want to require an index right away
      courseData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setCourses(courseData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await addDoc(collection(db, 'courses'), {
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : 0,
        teacherId: user.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', price: '' });
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSavePrice = async (courseId: string) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        price: editingPriceValue ? parseFloat(editingPriceValue) : 0
      });
    } catch (error) {
      console.error('Error updating price:', error);
    } finally {
      setEditingPriceCourseId(null);
      setEditingPriceValue('');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="animate-in fade-in duration-500">
      {activeTab === 'overview' && (
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Teacher Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase">Active Courses</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{courses.length}</p>
              </div>
            </div>
            {/* Additional stats placehold */}
          </div>
        </div>
      )}

      {activeTab === 'courses' && selectedCourse && (
        <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />
      )}

      {activeTab === 'courses' && !selectedCourse && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Course Management</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-shine px-5 py-3 bg-slate-900 dark:bg-emerald-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Course
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-200 dark:text-slate-700">
                <Folder className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No courses created yet</h3>
              <p className="text-slate-400 max-w-sm mb-6">Start building your curriculum by creating your first course framework.</p>
              <button onClick={() => setIsModalOpen(true)} className="btn-ripple px-6 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                Create First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course.id} className="card-hover group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-lg transition-all flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <button onClick={() => handleDeleteCourse(course.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg transition-all bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-red-100 shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 truncate">{course.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{course.description}</p>
                  </div>

                  {/* Price section */}
                  <div className="flex items-center gap-2">
                    {editingPriceCourseId === course.id ? (
                      <>
                        <div className="flex items-center gap-1 flex-1 bg-slate-50 dark:bg-slate-800 border border-emerald-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-100">
                          <IndianRupee className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <input
                            type="number" min="0" step="1" autoFocus
                            className="bg-transparent outline-none w-full text-sm font-bold text-slate-900 dark:text-white"
                            placeholder="0 = Free"
                            value={editingPriceValue}
                            onChange={e => setEditingPriceValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSavePrice(course.id); if (e.key === 'Escape') setEditingPriceCourseId(null); }}
                          />
                        </div>
                        <button onClick={() => handleSavePrice(course.id)} className="px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-colors">Save</button>
                        <button onClick={() => setEditingPriceCourseId(null)} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setEditingPriceCourseId(course.id); setEditingPriceValue(course.price != null ? String(course.price) : ''); }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold transition-colors border border-slate-100 dark:border-slate-700 hover:border-emerald-200"
                      >
                        <IndianRupee className="w-4 h-4" />
                        {course.price != null && course.price > 0 ? `₹${course.price}` : 'Set Price'}
                      </button>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex gap-2 w-full border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setSelectedCourse(course)} className="btn-ripple flex-1 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white font-bold text-sm rounded-lg transition-colors text-center w-full">
                      Manage Structure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Implementations for schedule and students */}
      {activeTab === 'schedule' && (
        <ScheduleClass user={user} courses={courses} />
      )}

      {activeTab === 'students' && (
        <TeacherStudents user={user} courses={courses} />
      )}

      {activeTab === 'notifications' && (
        <div className="animate-in fade-in duration-500">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <Bell className="w-7 h-7 text-emerald-500" /> Send Notification
          </h2>

          {/* Send form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 mb-8">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Notifications are broadcast to all students on their dashboard.
            </p>
            <form onSubmit={handleSendNotification} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text" required
                value={notifText}
                onChange={e => setNotifText(e.target.value)}
                placeholder="e.g. New class uploaded in Mathematics..."
                className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-900/40 transition-all font-medium"
              />
              <button type="submit" disabled={notifLoading}
                className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg"
              >
                {notifLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send</>}
              </button>
            </form>
          </div>

          {/* Sent notifications list */}
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Sent Notifications</h3>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {sentNotifs.length === 0 ? (
              <div className="py-16 text-center text-slate-400">No notifications sent yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {sentNotifs.map(n => (
                  <li key={n.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-slate-200 font-medium">{n.text}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {n.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <Chat user={user} role="teacher" />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Course">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Course Title</label>
            <input
              type="text" required autoFocus
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-900/40 transition-all font-medium"
              placeholder="e.g., Advanced Mathematics 101"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
            <textarea
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-900/40 transition-all font-medium h-32 resize-none"
              placeholder="Provide a brief overview of the course objectives..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Course Price (₹)</label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 dark:focus-within:ring-emerald-900/40 transition-all">
              <IndianRupee className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="number" min="0" step="1"
                className="w-full py-4 bg-transparent outline-none font-medium dark:text-white dark:placeholder-slate-500"
                placeholder="0 for free"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Leave 0 or empty for a free course.</p>
          </div>
          <button
            type="submit" disabled={modalLoading}
            className="btn-shine w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 mt-4 shadow-lg"
          >
            {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Course'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
