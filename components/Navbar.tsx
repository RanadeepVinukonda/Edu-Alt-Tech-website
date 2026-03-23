
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowUpRight, LogOut, User, Layout, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
// Use type-only import for User and standard modular imports for functions
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LINKS } from '../constants';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Listen for auth state changes using the modular API
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const navLinks = [
    { name: 'About', path: '/#about' },
    { name: 'Peer Education', path: '/peer-education' },
    { name: 'Team', path: '/team' },
    { name: 'Future', path: '/#future' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-slate-200/50 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src="/edulogo.png" 
            alt="Edu Alt Tech Logo" 
            className="w-16 h-16 object-contain transform group-hover:scale-105 transition-transform" 
          />
          <span className="font-bold text-xl tracking-tight text-slate-800">Edu Alt Tech</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path} 
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 text-slate-600 hover:text-emerald-600 transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  to="/dashboard"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-emerald-600 transition-colors"
                >
                  <Layout className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 border-l border-slate-200 pl-4">
                  <User className="w-4 h-4" />
                  <span className="max-w-[100px] truncate">{user.displayName || 'Learner'}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-600 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                  Log in
                </Link>
                <Link 
                  to="/peer-education" 
                  className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-all flex items-center gap-1 group"
                >
                  Join Us
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button onClick={toggleTheme} className="p-2 text-slate-600">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="text-slate-800">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-6 flex flex-col gap-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} className="text-lg font-medium text-slate-700">
              {link.name}
            </Link>
          ))}
          <hr className="border-slate-100" />
          <div className="flex flex-col gap-4">
            {user ? (
              <div className="space-y-4">
                <Link 
                  to="/dashboard"
                  className="flex items-center gap-2 text-lg font-medium text-slate-700"
                >
                  <Layout className="w-5 h-5" /> Dashboard
                </Link>
                <div className="flex items-center gap-2 text-lg font-medium text-slate-700">
                  <User className="w-5 h-5" /> {user.displayName || 'Learner'}
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-lg font-medium text-slate-700">Login</Link>
                <Link 
                  to="/peer-education" 
                  className="w-full py-4 bg-[#90EE90] text-slate-900 text-center font-bold rounded-xl"
                >
                  Join Us
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;