import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { UserObject } from '../types';

import Sidebar from '../components/Sidebar';
import TeacherDashboard from '../components/TeacherDashboard';
import StudentDashboard from '../components/StudentDashboard';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        navigate('/login');
      }
    });

    if (user) {
      // Self-healing: Ensure a profile exists (handles Google Auth and old test accounts)
      const ensureProfile = async () => {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            name: user.displayName || 'Learner',
            email: user.email || '',
            role: 'student',
            createdAt: new Date()
          });
        }
      };
      ensureProfile();

      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docObj) => {
        if (docObj.exists()) {
          setUserProfile({ uid: docObj.id, ...docObj.data() } as UserObject);
        }
        setLoading(false);
      });

      return () => {
        unsubscribeAuth();
        unsubProfile();
      };
    } else {
      setLoading(false);
    }

    return () => unsubscribeAuth();
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (loading || (!userProfile && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar */}
      <Sidebar role={userProfile.role} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col pt-24 min-h-screen">
        <div className="px-8 md:px-12 pb-12 w-full max-w-6xl mx-auto flex-1 flex flex-col">
          {/* Top Bar inside Content */}
          <div className="flex justify-between items-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-1 tracking-tight">
                Welcome back, {userProfile.name.split(' ')[0]}
              </h1>
              <p className="text-slate-500">
                {userProfile.role === 'teacher' ? 'Manage your classes and students effortlessly.' : 'Ready to continue learning?'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-ripple flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>

          {/* Dynamic Dashboard Based on Role */}
          <div className="flex-1">
            {userProfile.role === 'teacher' || userProfile.role === 'admin' ? (
              <TeacherDashboard user={user} activeTab={activeTab} />
            ) : (
              <StudentDashboard user={user} activeTab={activeTab} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
