import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import {
  User, LogOut, Layout, BookOpen, Clock, Target,
  FolderPlus, FilePlus, Plus, FileText, Folder,
  Trash2, X, Loader2, Users, ChevronRight,
  StickyNote, UserPlus, Search, MoreVertical, Sparkles, Brain, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Fix modular imports for Firebase Auth
import { signOut, onAuthStateChanged } from 'firebase/auth';
import {
  collection, addDoc, getDocs, query,
  orderBy, deleteDoc, doc, serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import {
  DashboardFile, DashboardFolder, DashboardNote, DashboardTeamMember
} from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Modal Component ---
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'files' | 'notes' | 'team' | 'ai'>('files');
  const [loading, setLoading] = useState(true);

  // Data States
  const [files, setFiles] = useState<DashboardFile[]>([]);
  const [folders, setFolders] = useState<DashboardFolder[]>([]);
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [teamMembers, setTeamMembers] = useState<DashboardTeamMember[]>([]);

  // AI States
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Modal States
  const [modalType, setModalType] = useState<'folder' | 'file' | 'note' | 'member' | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', title: '', content: '', role: '', size: '0 KB', folderId: '' });

  useEffect(() => {
    // Listen for auth state changes using modular API
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        navigate('/login');
      }
    });

    if (user) {
      // Real-time listeners for data persistence using modular Firestore API
      const unsubFiles = onSnapshot(query(collection(db, 'users', user.uid, 'files'), orderBy('createdAt', 'desc')), (snap) => {
        setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as DashboardFile)));
        setLoading(false);
      });
      const unsubFolders = onSnapshot(query(collection(db, 'users', user.uid, 'folders'), orderBy('createdAt', 'desc')), (snap) => {
        setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() } as DashboardFolder)));
      });
      const unsubNotes = onSnapshot(query(collection(db, 'users', user.uid, 'notes'), orderBy('createdAt', 'desc')), (snap) => {
        setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as DashboardNote)));
      });
      const unsubTeam = onSnapshot(query(collection(db, 'users', user.uid, 'teamMembers'), orderBy('createdAt', 'desc')), (snap) => {
        setTeamMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as DashboardTeamMember)));
      });

      return () => {
        unsubscribeAuth();
        unsubFiles();
        unsubFolders();
        unsubNotes();
        unsubTeam();
      };
    }

    return () => unsubscribeAuth();
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setModalLoading(true);

    try {
      if (modalType === 'folder') {
        await addDoc(collection(db, 'users', user.uid, 'folders'), {
          name: formData.name,
          createdAt: serverTimestamp()
        });
      } else if (modalType === 'file') {
        await addDoc(collection(db, 'users', user.uid, 'files'), {
          name: formData.name,
          size: formData.size || '1.2 MB',
          folderId: formData.folderId || null,
          createdAt: serverTimestamp()
        });
      } else if (modalType === 'note') {
        await addDoc(collection(db, 'users', user.uid, 'notes'), {
          title: formData.title,
          content: formData.content,
          createdAt: serverTimestamp()
        });
      } else if (modalType === 'member') {
        await addDoc(collection(db, 'users', user.uid, 'teamMembers'), {
          name: formData.name,
          role: formData.role,
          createdAt: serverTimestamp()
        });
      }
      setModalType(null);
      setFormData({ name: '', title: '', content: '', role: '', size: '0 KB', folderId: '' });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const deleteItem = async (col: string, id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, col, id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // --- AI Mentor Intelligence Logic ---
  const generateAIPlan = async () => {
    if (notes.length === 0) {
      alert("Please add some notes first so the AI Mentor has context for your progress.");
      return;
    }

    setIsGeneratingPlan(true);
    setAiPlan(null);
    setActiveTab('ai');

    try {
      // Create a fresh GoogleGenerativeAI instance for the request
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        You are an expert Education Strategist and Mentor at Edu Alt Tech.
        Your mission: Bridge the "Execution Gap" for the student.
        
        CONTEXT FOR ANALYSIS:
        Student Name: ${user?.displayName || 'Learner'}
        Learning Reflections/Notes:
        ${notes.map(n => `- ${n.title}: ${n.content}`).join('\n')}
        
        Associated Learning Assets (Files):
        ${files.map(f => `- ${f.name}`).join('\n')}
        
        Execution Group (Partners):
        ${teamMembers.map(t => `- ${t.name} (Goal: ${t.role})`).join('\n')}
        
        OUTPUT REQUIREMENT:
        Generate a structured, highly actionable Weekly Execution Plan.
        Focus on results, active participation, and deep transformation.
        Format the response in professional Markdown.
        
        REQUIRED SECTIONS:
        1. Core Weekly Focus: What is the single biggest win for this week?
        2. Daily Roadmap (Monday - Sunday): Specific execution tasks.
        3. Peer-Teaching Synergy: Suggest tasks for collaboration with specific partners listed.
        4. "Risk Alert": Identify potential bottlenecks based on recent notes.
        5. Motivational Closing: A discipline-focused human-first encouragement.
      `;

      // Generate content using the new SDK patterns
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
        }
      });

      const response = await result.response;
      setAiPlan(response.text() || "I couldn't synthesize a plan at this moment. Please try again.");
    } catch (error) {
      console.error("AI Generation Error:", error);
      setAiPlan("The AI Mentor is currently offline or busy. Please check your connection and try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const TabButton: React.FC<{ id: typeof activeTab; icon: React.ReactNode; label: string; count?: number }> = ({ id, icon, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all relative ${activeTab === id ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
    >
      {icon}
      {label}
      {typeof count === 'number' && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-emerald-500 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
      )}
    </button>
  );

  if (!user && loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    </div>
  );

  return (
    <div className="pt-32 pb-24 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 tracking-tight">
              {user?.displayName || 'Learner'}'s Workspace
            </h1>
            <p className="text-slate-500 text-lg">Manage your files, notes and team in one place.</p>
          </div>
          <div className="flex gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <button
              onClick={generateAIPlan}
              disabled={isGeneratingPlan}
              className="flex items-center gap-2 px-6 py-3 bg-[#90EE90] text-slate-900 font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-200/50 disabled:opacity-50"
            >
              {isGeneratingPlan ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
              AI Mentor
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex flex-wrap gap-4 mb-10">
          <TabButton id="files" icon={<Folder className="w-5 h-5" />} label="My Files" count={files.length + folders.length} />
          <TabButton id="notes" icon={<StickyNote className="w-5 h-5" />} label="My Notes" count={notes.length} />
          <TabButton id="team" icon={<Users className="w-5 h-5" />} label="Team Members" count={teamMembers.length} />
          <TabButton id="ai" icon={<Sparkles className="w-5 h-5" />} label="AI Roadmap" />
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 min-h-[500px] relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">

          {/* Section: Files */}
          {activeTab === 'files' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">File Depository</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalType('folder')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors text-sm"
                  >
                    <FolderPlus className="w-4 h-4" /> New Folder
                  </button>
                  <button
                    onClick={() => setModalType('file')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-sm"
                  >
                    <FilePlus className="w-4 h-4" /> Add File
                  </button>
                </div>
              </div>

              {(folders.length === 0 && files.length === 0) ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Folder className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No files yet</h3>
                  <p className="text-slate-400 max-w-sm">Start organizing your learning materials by creating folders and adding files.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {folders.map(folder => (
                    <div key={folder.id} className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                          <Folder className="w-6 h-6 fill-current" />
                        </div>
                        <button onClick={() => deleteItem('folders', folder.id)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1 truncate">{folder.name}</h4>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Folder</p>
                      </div>
                    </div>
                  ))}
                  {files.map(file => (
                    <div key={file.id} className="group p-6 bg-white rounded-3xl border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-emerald-500 transition-colors">
                          <FileText className="w-6 h-6" />
                        </div>
                        <button onClick={() => deleteItem('files', file.id)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1 truncate">{file.name}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{file.size}</p>
                          {file.folderId && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">In Folder</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Personal Insights</h2>
                <button
                  onClick={() => setModalType('note')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> New Note
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <StickyNote className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Thoughts are empty</h3>
                  <p className="text-slate-400 max-w-sm">Capture your daily learning reflections and project ideas here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.map(note => (
                    <div key={note.id} className="group p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-xl transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => deleteItem('notes', note.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 mb-3">{note.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                        {note.content || 'No description provided.'}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        Added Recently
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Team */}
          {activeTab === 'team' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Study Partners</h2>
                <button
                  onClick={() => setModalType('member')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#90EE90] text-slate-900 font-bold rounded-xl hover:bg-emerald-400 transition-colors text-sm"
                >
                  <UserPlus className="w-4 h-4" /> Add Partner
                </button>
              </div>

              {teamMembers.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Users className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No partners yet</h3>
                  <p className="text-slate-400 max-w-sm">Education is better together. Add your study partners to track progress collectively.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest border-b border-slate-100">Name</th>
                        <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest border-b border-slate-100">Role/Goal</th>
                        <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest border-b border-slate-100">Status</th>
                        <th className="p-6 border-b border-slate-100"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map(member => (
                        <tr key={member.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="p-6 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-bold">
                                {member.name.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-900">{member.name}</span>
                            </div>
                          </td>
                          <td className="p-6 border-b border-slate-50 text-slate-600 font-medium">{member.role || 'Member'}</td>
                          <td className="p-6 border-b border-slate-50">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">Active</span>
                          </td>
                          <td className="p-6 border-b border-slate-50 text-right">
                            <button onClick={() => deleteItem('teamMembers', member.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Section: AI Planner */}
          {activeTab === 'ai' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">AI Mentor Intelligence</h2>
                </div>
                {aiPlan && !isGeneratingPlan && (
                  <button
                    onClick={generateAIPlan}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                  >
                    <Zap className="w-4 h-4" /> Regenerate
                  </button>
                )}
              </div>

              {isGeneratingPlan ? (
                <div className="py-24 text-center flex flex-col items-center">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                    <Brain className="w-10 h-10 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Synthesizing execution path...</h3>
                  <p className="text-slate-400 max-w-sm">Gemini 3 Pro is analyzing your goals to create a structured weekly roadmap.</p>
                </div>
              ) : aiPlan ? (
                <div className="prose prose-slate max-w-none bg-slate-50 p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-inner overflow-auto max-h-[600px]">
                  <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-lg">
                    {aiPlan}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                    <Brain className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No active roadmap</h3>
                  <p className="text-slate-400 max-w-sm mb-8">Click the AI Mentor button to transform your notes into a high-performance execution plan.</p>
                  <button
                    onClick={generateAIPlan}
                    className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100"
                  >
                    Generate Weekly Plan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Footer Stats for Authenticated User */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 animate-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Knowledge Units</p>
              <p className="text-3xl font-bold text-slate-900">{files.length}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Target className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Weekly Targets</p>
              <p className="text-3xl font-bold text-slate-900">{notes.length}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Execution Group</p>
              <p className="text-3xl font-bold text-slate-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Modals --- */}

      {/* New Folder Modal */}
      <Modal
        isOpen={modalType === 'folder'}
        onClose={() => setModalType(null)}
        title="Create New Folder"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Folder Name</label>
            <input
              type="text" required autoFocus
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
              placeholder="e.g., Physics Notes"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <button
            type="submit" disabled={modalLoading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Folder'}
          </button>
        </form>
      </Modal>

      {/* Add File Modal */}
      <Modal
        isOpen={modalType === 'file'}
        onClose={() => setModalType(null)}
        title="Add Metadata File"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">File Name</label>
            <input
              type="text" required autoFocus
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
              placeholder="lesson_1.pdf"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Size (Label)</label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm"
                placeholder="2.5 MB"
                value={formData.size}
                onChange={e => setFormData({ ...formData, size: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Folder</label>
              <select
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm"
                value={formData.folderId}
                onChange={e => setFormData({ ...formData, folderId: e.target.value })}
              >
                <option value="">None</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <button
            type="submit" disabled={modalLoading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save File Metadata'}
          </button>
        </form>
      </Modal>

      {/* New Note Modal */}
      <Modal
        isOpen={modalType === 'note'}
        onClose={() => setModalType(null)}
        title="Capture Reflection"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
            <input
              type="text" required autoFocus
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
              placeholder="Weekly Learnings"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Content</label>
            <textarea
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all h-32 resize-none"
              placeholder="What did you execute today?"
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
            />
          </div>
          <button
            type="submit" disabled={modalLoading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Note'}
          </button>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={modalType === 'member'}
        onClose={() => setModalType(null)}
        title="Add Study Partner"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Partner Name</label>
            <input
              type="text" required autoFocus
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
              placeholder="e.g., Alex Smith"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Role / Project Goal</label>
            <input
              type="text"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
              placeholder="e.g., Data Science Study Lead"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            />
          </div>
          <button
            type="submit" disabled={modalLoading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add to Team'}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Dashboard;
