
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
// Fix modular imports for Firebase Auth
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

      // Save additional user info including role to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        phone,
        role,
        createdAt: serverTimestamp()
      });

      // Update the user profile with the name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Send verification email (silent)
      await sendEmailVerification(userCredential.user);

      // Temporarily disabled mandatory sign-out and verification redirect for easier local testing:
      // await signOut(auth);
      // navigate(`/verify?email=${encodeURIComponent(email)}`);
      
      // Auto-login to dashboard instead
      navigate('/dashboard');
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
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 flex flex-col items-center">
      <Link to="/" className="mb-12 inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="w-full max-w-xl bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Create Account</h1>
          <p className="text-slate-500">Join the world's most disciplined learners.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium md:col-span-2">
            {error}
          </div>
        )}

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSignup}>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">I am a...</label>
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="role" value="student" className="peer sr-only" checked={role === 'student'} onChange={() => setRole('student')} />
                <div className="p-4 text-center border-2 border-slate-200 rounded-2xl peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all font-bold text-slate-700 peer-checked:text-emerald-700">
                  Student
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="role" value="teacher" className="peer sr-only" checked={role === 'teacher'} onChange={() => setRole('teacher')} />
                <div className="p-4 text-center border-2 border-slate-200 rounded-2xl peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all font-bold text-slate-700 peer-checked:text-emerald-700">
                   Teacher
                </div>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91"
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg text-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
            <p className="text-center mt-6 text-slate-500 text-sm">
              Already have an account? <Link to="/login" className="font-bold text-slate-900 hover:text-emerald-600 underline underline-offset-4">Log in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;