import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Rocket, ChevronDown, User, LogOut, Terminal, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserObject } from '../types';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserObject | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = React.useRef<HTMLDivElement>(null);

  // Smooth entrance animation for the navbar
  useGSAP(() => {
    gsap.from(navRef.current, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserObject);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Define dynamic links based on auth state
  const publicLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Team', path: '/team' },
    { name: 'Contact', path: '/contact' },
  ];

  const privateLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  const adminLinks = [
    { name: 'Admin Portal', path: '/admin' },
  ];

  let navLinks = publicLinks;
  const isAdmin = userProfile?.role === 'admin' || user?.email === 'viranadeep@gmail.com';

  if (isAdmin) navLinks = adminLinks;
  else if (user) navLinks = privateLinks;

  return (
    <nav ref={navRef} className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm py-4' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 flex items-center justify-center transform group-hover:scale-105 transition-transform overflow-hidden rounded-xl">
              <img src="/edulogo.png" alt="EduAltTech Logo" className="w-full h-full object-cover "
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100"/><text fill="%23999" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14">LOGO</text></svg>';
                }}
              />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              EduAltTech
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-semibold transition-colors ${
                    location.pathname === link.path
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 pl-6 border-l border-slate-200 dark:border-slate-800">
               {/* Patch Notes Link - visible to everyone */}
               <Link to="/patch-notes" title="Patch Notes" className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Terminal className="w-5 h-5" />
               </Link>

              <button onClick={toggleTheme} className="p-2 text-slate-600 hover:text-emerald-600 transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {!user ? (
                <Link
                  to="/login"
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg hover:shadow-xl"
                >
                  Login
                </Link>
              ) : (
                <Link 
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center font-bold text-sm overflow-hidden">
                    {userProfile?.profilePic ? (
                       <img src={userProfile.profilePic} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                       userProfile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()
                    )}
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
             <Link to="/patch-notes" title="Patch Notes" className="p-2 text-slate-500">
                <Terminal className="w-5 h-5" />
             </Link>
             <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-300">
               {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-900 dark:text-white p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pt-6 pb-4 animate-in slide-in-from-top-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-semibold px-4 py-2 rounded-xl transition-colors ${
                    location.pathname === link.path
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              {!user ? (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl font-bold text-center"
                >
                  Login
                </Link>
              ) : (
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" /> Profile
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}