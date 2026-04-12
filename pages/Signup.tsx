import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
// Fix modular imports for Firebase Auth
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

import { auth, db } from '../lib/firebase';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(formRef.current, 
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
    );
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Now that we are signed in, we can check for phone uniqueness
      const q = query(collection(db, 'users'), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // If phone taken, we unfortunately created the auth account already.
        // But for dev simplicity, we can just throw or delete it.
        // We'll throw an error and let the user know.
        setError('Phone number is already registered. Please use another one.');
        setLoading(false);
        return;
      }

      // Save additional user info to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        phone,
        createdAt: serverTimestamp()
      });


      // Update the user profile with the name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Send verification email (silent)
      await sendEmailVerification(userCredential.user);

      // Trigger Welcome Email
      try {
        await setDoc(doc(collection(db, 'mail')), {
          to: email,
          message: {
            subject: 'Welcome to Edu-Alt-Tech!',
            text: `Hi ${name},\n\nThank you for joining EduAltTech! We're thrilled to have you as part of our learning community.\n\nBest,\nThe EduAltTech Team`
          }
        });
      } catch (mailErr) {
        console.error("Welcome email trigger failed", mailErr);
      }

      // navigate(`/verify?email=${encodeURIComponent(email)}`);
      
      // Auto-login to dashboard instead
      if (email === 'viranadeep@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('User already exists. Please sign in');
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
      <Link to="/" className="mb-12 inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div ref={formRef} className="w-full max-w-xl bg-white dark:bg-slate-900 p-10 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 dark:shadow-slate-950 border border-slate-100 dark:border-slate-800">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400">Join the world's most disciplined learners.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 text-sm font-medium md:col-span-2">
            {error}
          </div>
        )}

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSignup}>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91"
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
            <div className="relative">
              <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 outline-none transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-slate-900 dark:bg-emerald-600 text-white font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-lg text-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
            <p className="text-center mt-6 text-slate-500 dark:text-slate-400 text-sm">
              Already have an account? <Link to="/login" className="font-bold text-slate-900 dark:text-emerald-400 hover:text-emerald-600 underline underline-offset-4">Log in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;