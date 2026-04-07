import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { Loader2, Camera, X, Check, LogOut, ArrowLeft, Building2, MapPin, Tag, Edit3, Save } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserObject } from '../types';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { toast } from 'react-hot-toast';

const Profile: React.FC = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editClass, setEditClass] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!loading && userProfile && containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
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
          const data = docObj.data() as UserObject;
          setUserProfile({ ...data, uid: docObj.id });
          if (!saving && editClass === '') { // Only populate initial values
            setEditClass(data.classYear || '');
            setEditLocation(data.location || '');
            setEditInterests((data.preferences || []).join(', '));
          }
        } else {
          setUserProfile({ uid: u.uid, email: u.email || '', name: u.displayName || 'User', role: 'student' } as unknown as UserObject);
        }
        setLoading(false);
      }, (err) => {
        console.warn("Profile snapshot closed or denied", err);
        setLoading(false);
      });

      return () => unsubProfile();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      let newPicUrl = userProfile?.profilePic;
      
      if (selectedFile) {
        const imgRef = ref(storage, `profiles/${user.uid}/${selectedFile.name}`);
        const snapshot = await uploadBytes(imgRef, selectedFile);
        newPicUrl = await getDownloadURL(snapshot.ref);
      }

      const prefArray = editInterests.split(',')
                          .map(s => s.trim())
                          .filter(s => s.length > 0);

      // We use setDoc with merge: true to avoid 404/400 errors if doc is missing
      await setDoc(doc(db, 'users', user.uid), {
        classYear: editClass,
        location: editLocation,
        preferences: prefArray,
        ...(newPicUrl && { profilePic: newPicUrl })
      }, { merge: true });
      
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      setSelectedFile(null);
    } catch (e) {
      console.error("Error updating profile", e);
      toast.error("Failed to update profile. Make sure Firebase Storage rules are set.");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto" ref={containerRef}>
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
               <Link to="/dashboard" className="p-2 text-slate-500 hover:text-emerald-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors">
                  <ArrowLeft className="w-5 h-5" />
               </Link>
               <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Profile</h1>
           </div>
           
           {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl transition-colors">
                 <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
           )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200 dark:shadow-slate-950">
           
           <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
             <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden bg-emerald-50 dark:bg-emerald-900/10">
                   {selectedFile ? (
                      <img src={URL.createObjectURL(selectedFile)} alt="preview" className="w-full h-full object-cover" />
                   ) : userProfile.profilePic ? (
                      <img src={userProfile.profilePic} alt="current" className="w-full h-full object-cover" />
                   ) : (
                      <span className="text-4xl text-emerald-600 font-bold uppercase">
                        {(userProfile.name || user?.email || 'U').charAt(0)}
                      </span>
                   )}
                </div>
                {isEditing && (
                   <label className="absolute bottom-0 right-0 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full cursor-pointer shadow-lg transition-transform transform group-hover:scale-110">
                      <Camera className="w-5 h-5" />
                      <input type="file" accept="image/*" className="hidden" 
                         onChange={(e) => {
                           if (e.target.files && e.target.files[0]) {
                              setSelectedFile(e.target.files[0]);
                              setSuccessMsg('');
                           }
                         }} 
                      />
                   </label>
                )}
             </div>
             <div className="text-center md:text-left flex-1">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white capitalize mb-1">{userProfile.name}</h2>
                <p className="text-slate-500 text-lg">{userProfile.email || user?.email}</p>
             </div>
           </div>

           <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                     <Building2 className="w-4 h-4 text-emerald-500"/> Education
                   </label>
                   {isEditing ? (
                      <input type="text" value={editClass} onChange={(e) => {setEditClass(e.target.value); setSuccessMsg('');}} placeholder="e.g. B.Tech / High School" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none text-slate-900 dark:text-white transition-all" />
                   ) : (
                      <p className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-slate-800 dark:text-slate-200 font-medium">
                        {userProfile.classYear || <span className="text-slate-400 italic">Not specified</span>}
                      </p>
                   )}
                 </div>

                 <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-blue-500"/> Location
                   </label>
                   {isEditing ? (
                      <input type="text" value={editLocation} onChange={(e) => {setEditLocation(e.target.value); setSuccessMsg('');}} placeholder="e.g. Bangalore" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none text-slate-900 dark:text-white transition-all" />
                   ) : (
                      <p className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-slate-800 dark:text-slate-200 font-medium">
                        {userProfile.location || <span className="text-slate-400 italic">Not specified</span>}
                      </p>
                   )}
                 </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-500"/> Interests & Preferences
                </label>
                {isEditing ? (
                   <input type="text" value={editInterests} onChange={(e) => {setEditInterests(e.target.value); setSuccessMsg('');}} placeholder="e.g. Math, Coding, Art (comma-separated)" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none text-slate-900 dark:text-white transition-all" />
                ) : (
                   <div className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl min-h-[56px] flex flex-wrap gap-2">
                     {userProfile.preferences && userProfile.preferences.length > 0 ? (
                        userProfile.preferences.map((pref, i) => (
                           <span key={i} className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                             {pref}
                           </span>
                        ))
                     ) : (
                        <span className="text-slate-400 italic">No interests specified</span>
                     )}
                   </div>
                )}
              </div>

              {successMsg && !isEditing && (
                 <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                    <Check className="w-5 h-5"/> {successMsg}
                 </div>
              )}

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
                 {isEditing ? (
                    <>
                       <button onClick={() => { setIsEditing(false); setSuccessMsg(''); }} disabled={saving} className="w-full sm:w-auto hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-4 px-8 rounded-2xl transition-all">
                          Cancel
                       </button>
                       <button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                          Save Changes
                       </button>
                    </>
                 ) : (
                    <button onClick={handleLogout} className="w-full sm:w-auto bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95">
                       <LogOut className="w-5 h-5" />
                       Logout Account
                    </button>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
