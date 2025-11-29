import AuthPage from './AuthPage';
import React, { useState, useEffect, useRef } from 'react';
// Firebase Imports (Ensure you have firebase.js set up)
import { auth, db } from './firebase'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';

// UI Icons
import { 
  BookOpen, LayoutDashboard, Calendar as CalendarIcon, MessageSquare, 
  Settings as SettingsIcon, ChevronRight, ChevronLeft, Menu, X, Search, Bell, 
  Clock, LogOut, Plus, FileText, Video, Image as ImageIcon, 
  Trash2, Lock, User, Mail, PlayCircle, CheckCircle, Award, Upload, Users, FolderPlus, Link as LinkIcon, Send, CheckSquare, Save, Download, Trophy, Paperclip, PenTool, Camera, HelpCircle, Minimize, Maximize, Printer, ClipboardList, Pin, BellRing, MoreVertical, Phone, Video as VideoIcon, Megaphone, Book, Play, Pause, RotateCcw, TrendingUp, ExternalLink, Filter, ArrowRight, ArrowLeft, Star, Shield, Zap, Target, Layers, RotateCw, Eraser, Palette, CheckCheck,
  Moon, Sun, Globe, Smartphone
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';


const INITIAL_FLASHCARD_DECKS = [
    { 
      id: 1, 
      courseId: "demo-1", 
      title: "Vocabulary TOEFL", 
      subject: "Bahasa Inggris", 
      color: "bg-purple-100 text-purple-600",
      cards: [
        { q: "Abundant", a: "Berlimpah / Banyak sekali" },
        { q: "Benevolent", a: "Baik hati / Dermawan" },
        { q: "Candid", a: "Jujur / Terus terang" }
      ]
    },
    { 
      id: 2, 
      courseId: "demo-1", 
      title: "Rumus Fisika Dasar", 
      subject: "Fisika", 
      color: "bg-blue-100 text-blue-600",
      cards: [
        { q: "Rumus Gaya (F)", a: "F = m . a (Massa x Percepatan)" },
        { q: "Energi Kinetik (Ek)", a: "Ek = 1/2 . m . v^2" },
        { q: "Hukum Newton III", a: "Aksi = -Reaksi" }
      ]
    },
    { 
        id: 3, 
        title: "Sejarah Indonesia", 
        subject: "Sejarah", 
        color: "bg-orange-100 text-orange-600",
        cards: [
          { q: "Tanggal Kemerdekaan", a: "17 Agustus 1945" },
          { q: "Presiden Pertama", a: "Ir. Soekarno" },
          { q: "Peristiwa Rengasdengklok", a: "Penculikan Soekarno-Hatta oleh golongan muda" }
        ]
      }
];
// --- 1. PASTE THESE HELPERS AT THE TOP (After Imports) ---

// Helper: Convert File to Text (Base64)
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// --- PASTE THIS AT THE TOP (Right after imports and helpers) ---

// Helper: Save to Local Storage (Prevents Database Crash)
const saveFileLocally = (base64String) => {
    try {
        const uniqueKey = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(uniqueKey, base64String);
        return `LOCAL:${uniqueKey}`; 
    } catch (e) {
        console.error("Storage full");
        return null;
    }
};

// Helper: Retrieve File
const getFileFromStorage = (url) => {
    if (!url) return "#";
    if (url.startsWith('LOCAL:')) {
        const key = url.split('LOCAL:')[1];
        return localStorage.getItem(key) || '#';
    }
    return url;
};

const ACTIVITY_DATA = [
  { name: 'Sen', hours: 2 }, { name: 'Sel', hours: 4.5 }, { name: 'Rab', hours: 3 },
  { name: 'Kam', hours: 5 }, { name: 'Jum', hours: 2.5 }, { name: 'Sab', hours: 6 },
  { name: 'Min', hours: 1 },
];

// ==========================================
// 1. UTILITIES & DATA
// ==========================================

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-10 text-center">
          <div className="max-w-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong.</h2>
            <p className="text-red-400 bg-slate-900 p-4 rounded font-mono text-sm">{this.state.error?.toString()}</p>
            <button onClick={() => window.location.reload()} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

// ==========================================
// 2. SMALL WIDGETS
// ==========================================

const PomodoroWidget = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      alert("Waktu Fokus Selesai!");
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
       <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2"><Clock size={18}/> Fokus Timer</h3>
       <div className="text-4xl font-mono font-bold mb-4 text-center">{formatTime(timeLeft)}</div>
       <div className="flex justify-center gap-3">
          <button onClick={() => setIsActive(!isActive)} className={`p-2 rounded-full ${isActive ? 'bg-red-500' : 'bg-green-500'}`}>
             {isActive ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={() => {setIsActive(false); setTimeLeft(25*60)}} className="p-2 bg-slate-600 rounded-full"><RotateCcw size={20} /></button>
       </div>
    </div>
  );
};

const LeaderboardWidget = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4"><Trophy className="text-yellow-500" size={20} /><h3 className="font-bold text-slate-800">Top Siswa</h3></div>
      <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"><span className="font-bold text-slate-700">1. Siti Aminah</span><span className="text-xs font-bold text-teal-600">2400 XP</span></div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"><span className="font-bold text-slate-700">2. Rian Pratama</span><span className="text-xs font-bold text-teal-600">2150 XP</span></div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"><span className="font-bold text-slate-700">3. Dewi Lestari</span><span className="text-xs font-bold text-teal-600">1900 XP</span></div>
      </div>
    </div>
  );
};

const DiscussionBoard = ({ discussions, onSend }) => {
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);
  const safeDiscussions = discussions || []; 
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom() }, [safeDiscussions]);
  const handleSend = () => { if (!text.trim()) return; onSend(text); setText(""); };
  return (
    <div className="flex flex-col h-[500px] bg-white border border-slate-200 rounded-b-2xl shadow-sm mt-[-1px]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {safeDiscussions.length === 0 && <p className="text-center text-slate-400 italic mt-10">Belum ada diskusi.</p>}
        {safeDiscussions.map((msg) => (<div key={msg.id} className={`flex flex-col ${msg.role === 'teacher' ? 'items-end' : 'items-start'}`}><div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'teacher' ? 'bg-teal-100 text-teal-900 rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}><p className="font-bold text-xs mb-1 opacity-70">{msg.user}</p><p>{msg.text}</p></div><span className="text-[10px] text-slate-400 mt-1 mx-1">{msg.time}</span></div>))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl"><div className="flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-teal-500 outline-none transition-all" placeholder="Tulis pesan..." /><button onClick={handleSend} className="bg-teal-700 text-white p-3 rounded-xl hover:bg-teal-800 transition-colors shadow-lg shadow-teal-700/20"><Send size={20} /></button></div></div>
    </div>
  );
};

// ==========================================
// 3. MODALS
// ==========================================

const CertificateModal = ({ isOpen, onClose, studentName, courseName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl max-w-4xl w-full shadow-2xl relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4"><X size={20}/></button>
                <div className="border-8 border-double border-slate-800 p-10 bg-[#fffdf5]">
                    <h1 className="text-4xl font-serif font-bold text-slate-800 mb-4">SERTIFIKAT KOMPETENSI</h1>
                    <p>Diberikan kepada <strong>{studentName}</strong> atas kelulusan kelas <strong>{courseName}</strong>.</p>
                </div>
                <button onClick={() => window.print()} className="mt-4 bg-slate-800 text-white px-6 py-2 rounded-lg">Cetak PDF</button>
            </div>
        </div>
    );
};

const CreateClassModal = ({ isOpen, onClose, onSave }) => { const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [selectedColor, setSelectedColor] = useState('bg-teal-600'); if (!isOpen) return null; const handleSave = () => { if (!title) return; onSave({ title, description: desc, color: selectedColor, code: Math.random().toString(36).substring(2, 8).toUpperCase() }); setTitle(''); setDesc(''); onClose(); }; return (<div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"><h3 className="text-xl font-bold mb-4">Buat Kelas</h3><input value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded mb-2" placeholder="Nama Kelas" /><textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full border p-2 rounded mb-4" placeholder="Deskripsi" /><div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2">Batal</button><button onClick={handleSave} className="bg-teal-700 text-white px-4 py-2 rounded">Simpan</button></div></div></div>); };
const JoinClassModal = ({ isOpen, onClose, onJoin }) => { const [code, setCode] = useState(''); if (!isOpen) return null; return (<div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"><h3 className="text-xl font-bold mb-4">Gabung Kelas</h3><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full border p-2 rounded mb-4 text-center text-2xl tracking-widest" placeholder="KODE" /><div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2">Batal</button><button onClick={() => {onJoin(code); onClose();}} className="bg-teal-700 text-white px-4 py-2 rounded">Gabung</button></div></div></div>); };

// ==========================================
// 4. LAYOUT COMPONENTS
// ==========================================

// --- 5. CORE COMPONENTS (SIDEBAR) ---

// --- 5. CORE COMPONENTS (SIDEBAR) ---

const Sidebar = ({ activeView, setActiveView, isMobileOpen, setIsMobileOpen, user, onLogout }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'courses', icon: BookOpen, label: user.role === 'teacher' ? 'Kelola Kelas' : 'Kelas Saya' },
    { id: 'kanban', icon: ClipboardList, label: 'Tugas Saya' },
    { id: 'calendar', icon: CalendarIcon, label: 'Kalender' },
    
    // Logic: Only Teachers see the global Flashcard Manager
    ...(user.role === 'teacher' ? [{ id: 'flashcards', icon: Layers, label: 'Kartu Pintar (Guru)' }] : []),
    
    { id: 'library', icon: Book, label: 'Perpustakaan' },
    
    // Logic: Only Students see the Gamified Profile
    ...(user.role === 'student' ? [{ id: 'profile', icon: User, label: 'Profil Saya' }] : []),
    
    { id: 'messages', icon: MessageSquare, label: 'Pesan' },
    { id: 'settings', icon: SettingsIcon, label: 'Pengaturan' },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      
      {/* 1. HEADER (Fixed at Top) */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center text-white shadow-md">
            <BookOpen size={20} />
          </div>
          <span className="text-lg font-bold text-slate-800">EduSchool</span>
        </div>
        <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-slate-400 hover:text-teal-700">
          <X size={24} />
        </button>
      </div>

      {/* 2. SCROLLABLE MIDDLE SECTION */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        {/* User Profile Snippet */}
        <div className="flex items-center gap-3 mb-8 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-lg uppercase overflow-hidden flex-shrink-0">
                {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : (user.name ? user.name.substring(0, 2) : 'US')}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize truncate">{user.role === 'student' ? 'Siswa' : 'Guru'}</p>
            </div>
        </div>
        
        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                activeView === item.id 
                  ? 'bg-teal-50 text-teal-700 border border-teal-100 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 3. FOOTER (Fixed at Bottom) */}
      <div className="p-6 border-t border-slate-100 flex-shrink-0 bg-white">
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-white hover:bg-red-500 p-3 rounded-xl transition-all duration-200 font-bold text-sm border border-red-100 hover:border-red-500">
          <LogOut size={18} /> <span>Keluar</span>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN PAGES
// ==========================================

const DashboardView = ({ user, courses, onJoin }) => {
  const submissionsCount = courses.reduce((acc, c) => acc + (c.submissions?.length || 0), 0);
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-teal-800 to-emerald-600 rounded-3xl p-8 text-white shadow-xl">
          <h1 className="text-3xl font-bold mb-2">Halo, {user.name}! 👋</h1>
          <p className="text-teal-100 mb-6">{user.role === 'teacher' ? `Anda memiliki ${submissionsCount} tugas siswa yang siap dinilai.` : "Lanjutkan progres belajarmu hari ini."}</p>
          {user.role === 'student' && <button onClick={onJoin} className="bg-white text-teal-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-50 transition-all">+ Gabung Kelas Baru</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <p className="text-slate-500 text-xs font-bold uppercase">Total Kelas</p><p className="text-2xl font-bold text-slate-800">{courses.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <p className="text-slate-500 text-xs font-bold uppercase">{user.role === 'teacher' ? 'Perlu Dinilai' : 'Tugas Selesai'}</p><p className="text-2xl font-bold text-slate-800">{submissionsCount}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <p className="text-slate-500 text-xs font-bold uppercase">Kehadiran</p><p className="text-2xl font-bold text-slate-800">92%</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-80">
                <h3 className="font-bold text-slate-800 mb-4">Aktivitas Belajar</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={ACTIVITY_DATA}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Area type="monotone" dataKey="hours" stroke="#0d9488" fill="#0d9488" fillOpacity={0.2} /></AreaChart>
                </ResponsiveContainer>
            </div>
         </div>
         <div className="space-y-6">
             {user.role === 'student' && <PomodoroWidget />}
             <LeaderboardWidget />
         </div>
      </div>
    </div>
  );
};

// --- NEW: KANBAN BOARD COMPONENT ---
const KanbanBoard = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Selesaikan Bab 1 Matematika", status: "todo", color: "bg-red-100 border-red-200" },
    { id: 2, text: "Beli buku catatan baru", status: "doing", color: "bg-blue-100 border-blue-200" },
    { id: 3, text: "Daftar ulang semester", status: "done", color: "bg-green-100 border-green-200" }
  ]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;
    const task = { id: Date.now(), text: newTask, status: "todo", color: "bg-white border-slate-200" };
    setTasks([...tasks, task]);
    setNewTask("");
  };

  const moveTask = (id, newStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const Column = ({ title, status, icon: Icon, color }) => (
    <div className="flex-1 min-w-[300px] bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col h-[calc(100vh-12rem)]">
      <div className={`flex items-center gap-2 mb-4 p-3 rounded-xl ${color} bg-opacity-20 text-slate-700 font-bold`}>
        <Icon size={20} /> {title} <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs border shadow-sm">{tasks.filter(t => t.status === status).length}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3">
        {tasks.filter(t => t.status === status).map(task => (
          <div key={task.id} className={`p-4 rounded-xl border-2 shadow-sm flex flex-col gap-3 bg-white ${task.color} hover:shadow-md transition-all group`}>
            <p className="text-sm font-medium text-slate-700">{task.text}</p>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100/50">
              <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
              <div className="flex gap-1">
                {status !== 'todo' && <button onClick={() => moveTask(task.id, status === 'done' ? 'doing' : 'todo')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft size={16}/></button>}
                {status !== 'done' && <button onClick={() => moveTask(task.id, status === 'todo' ? 'doing' : 'done')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowRight size={16}/></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {status === 'todo' && (
        <div className="mt-4 pt-4 border-t border-slate-200">
           <div className="flex gap-2">
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTask()} placeholder="+ Tugas baru..." className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500" />
              <button onClick={addTask} className="bg-teal-600 text-white p-2 rounded-xl hover:bg-teal-700"><Plus size={20}/></button>
           </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-x-auto pb-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Manajemen Tugas (Kanban)</h2>
      <div className="flex gap-6 h-full">
        <Column title="Akan Dikerjakan" status="todo" icon={ClipboardList} color="bg-red-100" />
        <Column title="Sedang Dikerjakan" status="doing" icon={Clock} color="bg-blue-100" />
        <Column title="Selesai" status="done" icon={CheckCircle} color="bg-green-100" />
      </div>
    </div>
  );
};

// --- UPGRADED FLASHCARD COMPONENT ---
// --- FIXED FLASHCARD VIEW ---
const FlashcardView = ({ decks, onAddDeck, user, courses = [] }) => {
  const [activeDeck, setActiveDeck] = useState(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Teacher Add State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newCards, setNewCards] = useState([{ q: "", a: "" }]);
  
  // FIX: Initialize safely. If courses exist, pick the first one, otherwise empty string.
  const [selectedCourseId, setSelectedCourseId] = useState(courses && courses.length > 0 ? courses[0].id : "");

  // Update selected course if data loads later
  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(courses[0].id);
    }
  }, [courses]);

  const handleNext = () => {
    if (currentCard < activeDeck.cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCard(curr => curr + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentCard > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCard(curr => curr - 1), 150);
    }
  };

  const handleSaveDeck = () => {
      if (!newTitle || !newSubject) return alert("Mohon isi Judul dan Subjek");
      
      // Ensure there is a course ID selected
      const targetCourseId = selectedCourseId || (courses.length > 0 ? courses[0].id : "demo-1");

      const newDeck = {
          id: Date.now(),
          title: newTitle,
          subject: newSubject,
          courseId: targetCourseId,
          color: "bg-teal-100 text-teal-700",
          cards: newCards.filter(c => c.q && c.a)
      };

      if (newDeck.cards.length === 0) return alert("Mohon isi minimal 1 kartu");

      onAddDeck(newDeck);
      setIsAdding(false);
      setNewTitle("");
      setNewSubject("");
      setNewCards([{ q: "", a: "" }]);
      alert("Set Kartu Berhasil Dibuat!");
  };

  // VIEW 1: LIST OF DECKS
  if (!activeDeck) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Kartu Pintar (Flashcards)</h2>
            {user.role === 'teacher' && !isAdding && (
                <button onClick={() => setIsAdding(true)} className="bg-teal-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus size={18}/> Buat Set Baru</button>
            )}
        </div>

        {/* ADD DECK FORM */}
        {isAdding && (
            <div className="bg-white p-6 rounded-2xl border-2 border-teal-500 shadow-lg animate-in fade-in zoom-in duration-300">
                <h3 className="font-bold text-lg mb-4 text-slate-800">Buat Set Kartu Baru</h3>
                
                <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase">Pilih Kelas</label>
                    <select 
                        className="w-full border p-3 rounded-xl bg-slate-50 mt-1 outline-none focus:border-teal-500"
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                    >
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="border p-3 rounded-xl bg-slate-50 outline-none focus:border-teal-500" placeholder="Judul Set (Misal: Rumus Fisika)" />
                    <input value={newSubject} onChange={e => setNewSubject(e.target.value)} className="border p-3 rounded-xl bg-slate-50 outline-none focus:border-teal-500" placeholder="Mata Pelajaran" />
                </div>
                
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Daftar Pertanyaan</p>
                    {newCards.map((card, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input value={card.q} onChange={e => {const n=[...newCards]; n[idx].q=e.target.value; setNewCards(n)}} className="flex-1 border p-2 rounded-lg text-sm outline-none focus:border-teal-500" placeholder="Pertanyaan / Istilah" />
                            <input value={card.a} onChange={e => {const n=[...newCards]; n[idx].a=e.target.value; setNewCards(n)}} className="flex-1 border p-2 rounded-lg text-sm outline-none focus:border-teal-500" placeholder="Jawaban / Definisi" />
                        </div>
                    ))}
                    <button onClick={() => setNewCards([...newCards, {q:"", a:""}])} className="text-sm text-teal-600 font-bold hover:underline">+ Tambah Baris Kartu</button>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Batal</button>
                    <button onClick={handleSaveDeck} className="px-6 py-2 bg-teal-700 text-white rounded-lg font-bold hover:bg-teal-800">Simpan Set</button>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <div key={deck.id} onClick={() => { setActiveDeck(deck); setCurrentCard(0); setIsFlipped(false); }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-teal-200 transition-all group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${deck.color} group-hover:scale-110 transition-transform`}>
                <Layers size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{deck.title}</h3>
              <p className="text-slate-500 text-sm mb-4">{deck.subject} • {deck.cards.length} Kartu</p>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // VIEW 2: STUDY MODE
  // Safety check: Ensure card exists before rendering
  const cardData = activeDeck.cards[currentCard];
  
  if (!cardData) return <div className="p-10 text-center">Error: Data kartu tidak ditemukan. <button onClick={() => setActiveDeck(null)} className="text-teal-600 underline">Kembali</button></div>;

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setActiveDeck(null)} className="flex items-center gap-2 text-slate-500 hover:text-teal-700 font-bold text-sm">
          <ChevronLeft size={20} /> Kembali
        </button>
        <div className="text-slate-400 font-mono text-sm">
          {currentCard + 1} / {activeDeck.cards.length}
        </div>
      </div>

      <div className="flex-1 perspective-1000 relative">
         <motion.div 
            onClick={() => setIsFlipped(!isFlipped)}
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-full h-96 cursor-pointer relative"
         >
            {/* Front */}
            <div className="absolute inset-0 bg-white border-2 border-slate-200 rounded-3xl shadow-xl flex flex-col items-center justify-center p-10 backface-hidden" style={{ backfaceVisibility: "hidden" }}>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pertanyaan</span>
                <h3 className="text-3xl font-bold text-slate-800 text-center leading-relaxed">{cardData.q}</h3>
                <p className="absolute bottom-8 text-slate-400 text-xs flex items-center gap-2"><RotateCcw size={12}/> Klik untuk balik</p>
            </div>
            {/* Back */}
            <div className="absolute inset-0 bg-teal-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-10 text-white" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <span className="text-xs font-bold text-teal-200 uppercase tracking-widest mb-4">Jawaban</span>
                <h3 className="text-2xl font-bold text-center leading-relaxed">{cardData.a}</h3>
            </div>
         </motion.div>
      </div>

      <div className="flex items-center justify-center gap-8 mt-8">
         <button onClick={handlePrev} disabled={currentCard === 0} className="p-4 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={24} /></button>
         <button onClick={() => setIsFlipped(!isFlipped)} className="px-8 py-3 rounded-xl bg-slate-800 text-white font-bold shadow-lg hover:bg-slate-700 flex items-center gap-2"><RotateCcw size={18} /> Balik Kartu</button>
         <button onClick={handleNext} disabled={currentCard === activeDeck.cards.length - 1} className="p-4 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={24} /></button>
      </div>
    </div>
  );
};

const QuizView = ({ questions, onFinish, onScoreSave }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);

  // Fallback for empty questions to prevent crash
  const safeQuestions = questions && questions.length > 0 ? questions : [];

  if (safeQuestions.length === 0) {
      return (
        <div className="text-center py-10">
            <h2 className="text-xl font-bold text-slate-700">Kuis Belum Tersedia</h2>
            <p className="text-slate-500 mb-4">Guru belum menambahkan pertanyaan.</p>
            <button onClick={onFinish} className="text-teal-600 underline">Kembali</button>
        </div>
      );
  }

  const handleAnswerOptionClick = (isCorrect) => {
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < safeQuestions.length) { 
        setCurrentQuestion(nextQuestion); 
    } else { 
        setShowScore(true); 
        if (onScoreSave) onScoreSave(newScore); 
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-3xl mx-auto shadow-sm">
      {showScore ? (
        <div className="text-center py-10">
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6"><Award size={48} className="text-teal-600" /></div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Kuis Selesai!</h2>
          <p className="text-slate-500 mb-6">Kamu berhasil menyelesaikan modul ini.</p>
          <div className="text-5xl font-bold text-teal-700 mb-8">{score} / {safeQuestions.length}</div>
          <button onClick={onFinish} className="bg-teal-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-800 transition-all">Kembali ke Materi</button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4"><span className="text-teal-700 font-bold uppercase tracking-wider text-sm">Soal {currentQuestion + 1}</span><span className="text-slate-400 text-sm">{currentQuestion + 1}/{safeQuestions.length}</span></div>
            <h2 className="text-2xl font-bold text-slate-800 leading-relaxed">{safeQuestions[currentQuestion].questionText}</h2>
          </div>
          <div className="space-y-3">
            {safeQuestions[currentQuestion].options.map((answerOption, index) => (
                <button key={index} onClick={() => handleAnswerOptionClick(answerOption.isCorrect)} className="w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-teal-500 hover:bg-teal-50 transition-all font-medium text-slate-700">{answerOption.answerText}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const StudentProfileView = ({ user }) => {
  // Mock Data (In a real app, calculate from user history)
  const stats = { level: 5, xp: 2450, nextLevelXp: 3000, streak: 12, assignmentsDone: 34 };
  const progressPercent = (stats.xp / stats.nextLevelXp) * 100;

  const badges = [
      { id: 1, name: "Early Bird", desc: "Submit tugas sebelum H-1", icon: Zap, color: "bg-yellow-100 text-yellow-600" },
      { id: 2, name: "Math Wizard", desc: "Nilai 100 di Matematika", icon: CheckCircle, color: "bg-blue-100 text-blue-600" },
      { id: 3, name: "Rajin Hadir", desc: "Absensi 100% sebulan", icon: Shield, color: "bg-green-100 text-green-600" },
      { id: 4, name: "Top Discussion", desc: "50+ post di forum", icon: MessageSquare, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full translate-x-1/3 -translate-y-1/3"></div>
          
          <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white/20 p-1 backdrop-blur">
                  <div className="w-full h-full bg-slate-200 rounded-full overflow-hidden flex items-center justify-center text-slate-500 font-bold text-3xl">
                     {user.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                  </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 font-bold w-10 h-10 rounded-full flex items-center justify-center border-4 border-indigo-600 z-10">{stats.level}</div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2 z-10">
              <h2 className="text-3xl font-bold">{user.name}</h2>
              <p className="text-indigo-100 opacity-90">Siswa Teladan • {user.email}</p>
              <div className="pt-2 max-w-md">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1 opacity-80"><span>XP Progress</span><span>{stats.xp} / {stats.nextLevelXp} XP</span></div>
                  <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur"><div className="h-full bg-yellow-400 transition-all duration-1000 ease-out" style={{width: `${progressPercent}%`}}></div></div>
              </div>
          </div>

          <div className="flex gap-4 z-10">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur text-center min-w-[90px]"><div className="text-2xl font-bold mb-1">🔥 {stats.streak}</div><div className="text-[10px] uppercase opacity-70">Day Streak</div></div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur text-center min-w-[90px]"><div className="text-2xl font-bold mb-1">✅ {stats.assignmentsDone}</div><div className="text-[10px] uppercase opacity-70">Tugas Selesai</div></div>
          </div>
      </div>

      {/* Badges Collection */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Award className="text-yellow-500" /> Koleksi Lencana (Badges)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {badges.map(badge => (
                  <div key={badge.id} className="border border-slate-100 rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-lg transition-all cursor-default group">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${badge.color} group-hover:scale-110 transition-transform duration-300`}><badge.icon size={32} /></div>
                      <h4 className="font-bold text-slate-800 mb-1">{badge.name}</h4>
                      <p className="text-xs text-slate-500">{badge.desc}</p>
                  </div>
              ))}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-slate-300">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4"><Lock size={24} /></div>
                  <h4 className="font-bold text-xs uppercase">Terkunci</h4>
                  <p className="text-[10px]">Terus belajar untuk membuka!</p>
              </div>
          </div>
      </div>
    </div>
  );
};

const CalendarView = ({ courses, user, onUpdateCourse, personalEvents, setPersonalEvents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [pinnedTasks, setPinnedTasks] = useState([]);
  
  const [selectedClassFilter, setSelectedClassFilter] = useState("All");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState("reminder");
  const [newEventTarget, setNewEventTarget] = useState("personal");

  // 1. DATA MERGING
  const assignments = courses.flatMap(course => 
    (course.modules || []).flatMap(mod => 
      mod.items.filter(item => item.type === 'assignment' && item.deadline).map(item => ({
        id: item.id,
        title: item.title,
        type: 'deadline',
        courseId: course.id,
        courseName: course.title,
        color: 'bg-red-500',
        dateObj: new Date(item.deadline)
      }))
    )
  );

  const teacherEvents = courses.flatMap(course => 
    (course.calendarEvents || []).map(evt => ({
        id: evt.id,
        title: evt.title,
        type: evt.type,
        courseId: course.id,
        courseName: course.title,
        color: evt.color || 'bg-blue-500',
        dateObj: new Date(evt.date)
    }))
  );

  const myPersonalEvents = (personalEvents || []).map(evt => ({
      ...evt,
      type: 'personal',
      courseName: 'Pribadi',
      color: evt.color || 'bg-yellow-500',
      dateObj: new Date(evt.date)
  }));

  const allEvents = [...assignments, ...teacherEvents, ...myPersonalEvents].filter(evt => {
      if (selectedClassFilter === "All") return true;
      if (selectedClassFilter === "Personal") return evt.type === 'personal';
      return evt.courseId === selectedClassFilter;
  });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDate(null);
  };

  const handleAddEvent = () => {
      if (!newEventTitle || !selectedDate) return;
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
      const colorMap = { 'reminder': 'bg-blue-500', 'deadline': 'bg-red-500', 'info': 'bg-green-500', 'urgent': 'bg-purple-500' };

      if (newEventTarget === 'class' && user.role === 'teacher') {
          const targetCourseId = selectedClassFilter !== "All" ? selectedClassFilter : courses[0].id;
          const targetCourse = courses.find(c => c.id === targetCourseId);
          const newEvent = {
              id: Date.now(),
              title: newEventTitle,
              date: dateStr,
              type: newEventType,
              color: colorMap[newEventType]
          };
          const updatedEvents = [...(targetCourse.calendarEvents || []), newEvent];
          onUpdateCourse(targetCourseId, { calendarEvents: updatedEvents });
      } else {
          const newEvent = {
              id: Date.now(),
              title: newEventTitle,
              date: dateStr,
              color: 'bg-yellow-500',
              type: 'personal'
          };
          setPersonalEvents([...(personalEvents || []), newEvent]);
      }
      setNewEventTitle("");
      alert("Event ditambahkan!");
  };

  const handlePin = (taskId) => {
    if (pinnedTasks.includes(taskId)) setPinnedTasks(pinnedTasks.filter(id => id !== taskId));
    else setPinnedTasks([...pinnedTasks, taskId]);
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) { days.push(<div key={`empty-${i}`} className="aspect-square"></div>); }
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = allEvents.filter(a => {
          return a.dateObj.getDate() === d && a.dateObj.getMonth() === currentDate.getMonth() && a.dateObj.getFullYear() === currentDate.getFullYear();
      });
      const hasPinned = dayEvents.some(t => pinnedTasks.includes(t.id));
      
      // DETERMINE CELL COLOR (New Logic)
      let cellColor = 'bg-white border-slate-100 text-slate-700'; 
      if (dayEvents.length > 0) {
          if (dayEvents.some(e => e.type === 'deadline')) cellColor = 'bg-red-100 border-red-200 text-red-800';
          else if (dayEvents.some(e => e.type === 'personal')) cellColor = 'bg-yellow-100 border-yellow-200 text-yellow-800';
          else if (dayEvents.some(e => e.type === 'reminder')) cellColor = 'bg-blue-100 border-blue-200 text-blue-800';
          else cellColor = 'bg-green-100 border-green-200 text-green-800';
      }

      days.push(
        <div key={d} onClick={() => setSelectedDate({ day: d, tasks: dayEvents })} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold border cursor-pointer transition-all relative ${cellColor} ${selectedDate?.day === d ? 'ring-2 ring-teal-500' : 'hover:brightness-95'}`}>
          {d}
          {hasPinned && <div className="absolute top-1 right-1 text-orange-500"><Pin size={10} fill="currentColor" /></div>}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Kalender Akademik</h2>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border shadow-sm">
            <Filter size={16} className="text-slate-400"/>
            <select onChange={(e) => setSelectedClassFilter(e.target.value)} className="bg-transparent outline-none text-sm font-bold text-slate-600">
                <option value="All">Semua Jadwal</option>
                <option value="Personal">Hanya Pribadi</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-teal-800">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <div className="flex gap-2"><button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20} /></button><button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20} /></button></div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center mb-2 text-slate-400 text-xs font-bold uppercase">{['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => <div key={d}>{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-2">{renderDays()}</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit min-h-[400px] flex flex-col">
           <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">{selectedDate ? `Agenda: ${selectedDate.day} ${monthNames[currentDate.getMonth()]}` : "Pilih Tanggal"}</h3>
           <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
               {selectedDate ? (
                   <>
                   {selectedDate.tasks.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Kosong.</p>}
                   {selectedDate.tasks.map((task, idx) => (
                       <div key={idx} className={`p-3 rounded-xl border border-slate-100 relative ${task.type==='deadline' ? 'bg-red-50' : task.type==='personal' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                           <div className="flex justify-between items-start">
                               <div><h4 className="font-bold text-slate-700 text-sm">{task.title}</h4><span className="text-[10px] uppercase tracking-wider font-bold opacity-70">{task.courseName} • {task.type}</span></div>
                               <button onClick={() => handlePin(task.id)} className={`p-1 rounded hover:bg-white ${pinnedTasks.includes(task.id) ? 'text-orange-500' : 'text-slate-300'}`}><Pin size={14} fill={pinnedTasks.includes(task.id) ? "currentColor" : "none"} /></button>
                           </div>
                       </div>
                   ))}
                   </>
               ) : (<p className="text-slate-400 text-sm text-center py-10">Klik tanggal untuk melihat detail.</p>)}
           </div>
           {selectedDate && (
               <div className="mt-4 pt-4 border-t border-slate-100">
                   <p className="text-xs font-bold text-slate-500 mb-2">+ Tambah Agenda</p>
                   {user.role === 'teacher' && (
                       <div className="flex gap-2 mb-2">
                           <button onClick={() => setNewEventTarget('class')} className={`flex-1 text-[10px] py-1 rounded border ${newEventTarget==='class'?'bg-teal-50 border-teal-500 text-teal-700':'text-slate-500'}`}>Untuk Kelas</button>
                           <button onClick={() => setNewEventTarget('personal')} className={`flex-1 text-[10px] py-1 rounded border ${newEventTarget==='personal'?'bg-yellow-50 border-yellow-500 text-yellow-700':'text-slate-500'}`}>Pribadi</button>
                       </div>
                   )}
                   {newEventTarget === 'class' && (
                        <select className="w-full mb-2 text-xs border p-1 rounded" value={newEventType} onChange={e=>setNewEventType(e.target.value)}>
                            <option value="reminder">🔵 Reminder (Biru)</option>
                            <option value="deadline">🔴 Deadline (Merah)</option>
                            <option value="info">🟢 Info (Hijau)</option>
                            <option value="urgent">🟣 Penting (Ungu)</option>
                        </select>
                   )}
                   <div className="flex gap-2">
                       <input value={newEventTitle} onChange={e=>setNewEventTitle(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500" placeholder="Judul..." />
                       <button onClick={handleAddEvent} className="bg-teal-600 hover:bg-teal-700 text-white px-3 rounded-lg"><Plus size={18}/></button>
                   </div>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- NEW: DIGITAL WHITEBOARD COMPONENT ---
const WhiteboardView = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Set high resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    setContext(ctx);
  }, []);

  // Update context when tool changes
  useEffect(() => {
    if (context) {
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
    }
  }, [color, lineWidth, context]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    context.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveImage = () => {
    const link = document.createElement('a');
    link.download = `papan-tulis-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><PenTool size={24}/> Papan Tulis Digital</h2>
          <div className="flex gap-2">
             <button onClick={clearCanvas} className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"><Trash2 size={18}/> Hapus Semua</button>
             <button onClick={saveImage} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-xl transition-all font-bold text-sm shadow-lg"><Download size={18}/> Simpan Gambar</button>
          </div>
       </div>

       <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          {/* Toolbar */}
          <div className="p-4 bg-slate-50 border-r border-slate-200 flex flex-row md:flex-col gap-4 items-center justify-center md:justify-start">
             
             {/* Color Picker */}
             <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Warna</p>
                <div className="flex md:flex-col gap-2">
                    {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316'].map((c) => (
                       <button key={c} onClick={() => {setColor(c); setLineWidth(3)}} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c && lineWidth !== 20 ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-110'}`} style={{backgroundColor: c}} />
                    ))}
                </div>
             </div>

             <div className="w-full h-px bg-slate-200 hidden md:block"></div>

             {/* Tools */}
             <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Alat</p>
                <div className="flex md:flex-col gap-2">
                    <button onClick={() => {setColor("#ffffff"); setLineWidth(20)}} className={`p-3 rounded-xl transition-all ${color === '#ffffff' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-white'}`} title="Penghapus">
                        <Eraser size={20} />
                    </button>
                     <button onClick={() => {setColor("#000000"); setLineWidth(3)}} className={`p-3 rounded-xl transition-all ${color !== '#ffffff' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-white'}`} title="Pensil">
                        <PenTool size={20} />
                    </button>
                </div>
             </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative cursor-crosshair bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-full block touch-none"
              />
          </div>
       </div>
    </div>
  );
};

const LibraryView = () => {
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const categories = ["Semua", ...new Set(LIBRARY_BOOKS.map(b => b.category))];
  const [showAddBook, setShowAddBook] = useState(false);
  
  const filteredBooks = LIBRARY_BOOKS.filter(b => 
     (filter === "Semua" || b.category === filter) &&
     b.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
      <div className="space-y-6">
          <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Perpustakaan Digital</h2><button onClick={() => setShowAddBook(true)} className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">+ Tambah Buku</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map(book => (
                  <div key={book.id} className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${book.color}`}><Book size={24} /></div>
                      <h3 className="font-bold text-slate-800 mb-1 text-lg">{book.title}</h3>
                      <p className="text-xs text-slate-500 mb-4">{book.author} • {book.category}</p>
                      <a href={book.url} className="block w-full py-2 border border-slate-200 rounded-xl text-center text-slate-600 hover:bg-teal-50 text-sm font-bold">Baca Sekarang</a>
                  </div>
              ))}
          </div>
          {showAddBook && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90]">
                 <div className="bg-white p-6 rounded-2xl w-96 shadow-2xl">
                     <h3 className="font-bold text-lg mb-4">Tambah Buku Baru</h3>
                     <input className="w-full border p-2 rounded mb-2" placeholder="Judul Buku" />
                     <input className="w-full border p-2 rounded mb-2" placeholder="Penulis" />
                     <input className="w-full border p-2 rounded mb-4" placeholder="Kategori" />
                     <div className="flex justify-end gap-2"><button onClick={() => setShowAddBook(false)} className="px-4 py-2">Batal</button><button onClick={() => setShowAddBook(false)} className="px-4 py-2 bg-teal-700 text-white rounded">Simpan</button></div>
                 </div>
             </div>
          )}
      </div>
  );
};

// --- UPGRADED MESSAGES VIEW (WhatsApp Style) ---
// --- UPGRADED MESSAGES VIEW (Auto-Class Groups + No Calls) ---
const MessagesView = ({ courses, user }) => {
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputText, setInputText] = useState('');
  
  // 1. Static Direct Messages (DMs)
  const [directMessages, setDirectMessages] = useState([
    { id: 'dm-1', name: "Pak Budi Santoso", role: "Guru Matematika", avatar: "B", color: "bg-blue-600", online: true, unread: 0, lastMsg: "Jangan lupa kerjakan PR.", time: "08:30", messages: [] },
    { id: 'dm-2', name: "Bu Ratna Sari", role: "Guru Bahasa", avatar: "R", color: "bg-pink-600", online: false, unread: 2, lastMsg: "Nilai tugasmu sudah saya input.", time: "Kemarin", messages: [] },
  ]);

  // 2. Generate Class Groups from Courses Prop
  const classGroups = courses.map(course => ({
      id: `course-${course.id}`, // Unique ID based on course
      name: `Grup ${course.title}`, // e.g., "Grup Bahasa Indonesia"
      role: `${course.code}`,
      avatar: course.title.charAt(0),
      color: course.color || "bg-teal-600",
      online: true, // Groups are always "online"
      unread: 0,
      lastMsg: `Selamat datang di grup ${course.title}!`,
      time: "Now",
      isGroup: true,
      messages: [
          { id: 1, text: `Halo semuanya! Ini adalah grup diskusi untuk kelas ${course.title}.`, sender: "system", time: "Now" }
      ]
  }));

  // Combine DMs and Groups
  const allChats = [...classGroups, ...directMessages];

  // Set default active chat if none selected
  useEffect(() => {
      if (!activeChatId && allChats.length > 0) {
          setActiveChatId(allChats[0].id);
      }
  }, [allChats, activeChatId]);

  const activeChat = allChats.find(c => c.id === activeChatId) || allChats[0];
  
  // Local state to handle new messages in the current session
  const [sessionMessages, setSessionMessages] = useState({}); 
  const messagesEndRef = useRef(null);

  // Combine initial messages with session messages
  const currentMessages = [
      ...(activeChat?.messages || []), 
      ...(sessionMessages[activeChatId] || [])
  ];

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [currentMessages, activeChatId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      id: Date.now(),
      text: inputText,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent"
    };
    
    // Save message to local session state
    setSessionMessages(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), newMsg]
    }));
    setInputText('');
  };

  if(!activeChat) return <div className="p-10">Loading chats...</div>;

  return (
    <div className="h-[calc(100vh-8rem)] bg-white border border-slate-200 rounded-3xl overflow-hidden flex shadow-sm">
      {/* LEFT SIDEBAR: CONTACTS */}
      <div className="w-80 border-r border-slate-100 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 text-xl">Pesan</h2>
                <div className="flex gap-2 text-slate-400">
                    <button className="p-2 hover:bg-white rounded-full shadow-sm transition-all"><Plus size={18}/></button>
                    <button className="p-2 hover:bg-white rounded-full shadow-sm transition-all"><MoreVertical size={18}/></button>
                </div>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-teal-500 outline-none" placeholder="Cari..." />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {allChats.map((contact) => (
            <div 
                key={contact.id} 
                onClick={() => setActiveChatId(contact.id)} 
                className={`p-4 flex gap-3 cursor-pointer transition-all border-b border-slate-50 hover:bg-slate-50 ${activeChatId === contact.id ? 'bg-teal-50 border-l-4 border-l-teal-600' : ''}`}
            >
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${contact.color} flex-shrink-0`}>
                  {contact.avatar}
                  {/* Only show green dot for DMs, not groups */}
                  {!contact.isGroup && contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
              </div>
              <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{contact.name}</h4>
                      <span className="text-[10px] text-slate-400">{contact.time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-slate-500 truncate max-w-[140px]">
                          {/* Show draft preview if exists, else last msg */}
                          {sessionMessages[contact.id]?.slice(-1)[0]?.text || contact.lastMsg}
                      </p>
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: CHAT WINDOW */}
      <div className="flex-1 flex flex-col bg-[#efeae2] relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        {/* Header (Updated: No Phone/Video Icons) */}
        <div className="p-3 border-b border-slate-200 bg-white z-10 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${activeChat.color}`}>
                    {activeChat.avatar}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">{activeChat.name}</h3>
                    <p className="text-xs text-slate-500">{activeChat.isGroup ? activeChat.role : (activeChat.online ? 'Online' : 'Offline')}</p>
                </div>
            </div>
            {/* Clean Header Actions */}
            <div className="flex gap-2 text-slate-400 pr-2">
                <button className="p-2 hover:bg-slate-50 rounded-full"><Search size={20}/></button>
                <button className="p-2 hover:bg-slate-50 rounded-full"><MoreVertical size={20}/></button>
            </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2 z-10">
          {currentMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[60%] px-4 py-2 rounded-lg shadow-sm relative text-sm ${msg.sender === 'me' ? 'bg-teal-100 text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                {msg.sender === 'system' && <p className="text-xs italic text-slate-400 mb-1 text-center">--- System Message ---</p>}
                <p className="leading-relaxed">{msg.text}</p>
                <div className="flex justify-end items-center gap-1 mt-1">
                    <span className="text-[10px] text-slate-500 opacity-70">{msg.time}</span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white z-10">
          <div className="flex gap-2 items-end">
            <button className="p-3 text-slate-400 hover:text-teal-600 transition-colors"><Paperclip size={20} /></button>
            <div className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 transition-all flex items-center shadow-sm focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
                <input 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                    type="text" 
                    placeholder="Ketik pesan..." 
                    className="bg-transparent border-none focus:outline-none text-sm text-slate-700 w-full" 
                />
            </div>
            <button 
                onClick={handleSend} 
                className={`p-3 rounded-full transition-all shadow-md ${inputText.trim() ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-100 text-slate-400'}`}
            >
                <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- UPGRADED SETTINGS VIEW ---
const SettingsView = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({ 
      name: user.name || "", 
      email: user.email || "", 
      role: user.role || "student",
      bio: "Saya suka belajar hal baru!",
      phone: "+62 812-3456-7890",
      language: "Bahasa Indonesia",
      theme: "light",
      notifEmail: true,
      notifPush: true,
      notifDeadline: true
  });

  const handleSave = () => {
      onUpdateUser({ ...user, name: formData.name, role: formData.role }); 
      alert("Pengaturan berhasil disimpan!"); 
  };

  const handleAvatarUpload = (e) => { 
      const file = e.target.files[0]; 
      if (file) { 
          const url = URL.createObjectURL(file); 
          onUpdateUser({...user, photoURL: url}); 
      } 
  };

  const Toggle = ({ label, value, onChange }) => (
      <div className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-white">
          <span className="text-sm font-bold text-slate-700">{label}</span>
          <button 
            onClick={() => onChange(!value)}
            className={`w-12 h-6 rounded-full p-1 transition-all ${value ? 'bg-teal-600' : 'bg-slate-300'}`}
          >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${value ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
      </div>
  );

  const renderContent = () => {
      switch(activeTab) {
          case 'profile':
              return (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                          <div className="relative group cursor-pointer">
                              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-4xl text-slate-500 font-bold overflow-hidden border-4 border-white shadow-lg">
                                  {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" alt="Avatar" /> : user.name.charAt(0)}
                              </div>
                              <input type="file" onChange={handleAvatarUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white"><Camera size={24} /></div>
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
                              <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full uppercase">{user.role}</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-teal-500" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                              <input type="email" value={formData.email} disabled className="w-full p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-400 cursor-not-allowed" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor Telepon</label>
                              <div className="relative">
                                  <Smartphone size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                                  <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-9 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-teal-500" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peran (Simulasi)</label>
                              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-teal-500 cursor-pointer">
                                  <option value="student">Siswa</option>
                                  <option value="teacher">Guru</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio / Tentang Saya</label>
                          <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-teal-500 h-24 resize-none" />
                      </div>
                  </div>
              );
          case 'notifications':
              return (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BellRing size={20}/> Preferensi Notifikasi</h3>
                      <Toggle label="Notifikasi Email" value={formData.notifEmail} onChange={(v) => setFormData({...formData, notifEmail: v})} />
                      <Toggle label="Push Notification (Browser)" value={formData.notifPush} onChange={(v) => setFormData({...formData, notifPush: v})} />
                      <Toggle label="Ingatkan Deadline H-1" value={formData.notifDeadline} onChange={(v) => setFormData({...formData, notifDeadline: v})} />
                  </div>
              );
          case 'security':
              return (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Shield size={20}/> Keamanan Akun</h3>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl text-sm text-yellow-700">
                          Password terakhir diubah 30 hari yang lalu. Disarankan mengganti password secara berkala.
                      </div>
                      <div className="space-y-3">
                          <input type="password" placeholder="Password Lama" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                          <input type="password" placeholder="Password Baru" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                          <input type="password" placeholder="Konfirmasi Password Baru" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                      </div>
                  </div>
              );
          case 'appearance':
              return (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Palette size={20}/> Tampilan & Bahasa</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setFormData({...formData, theme: 'light'})} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.theme === 'light' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-100 text-slate-400'}`}>
                              <Sun size={32}/> <span className="font-bold text-sm">Light Mode</span>
                          </button>
                          <button onClick={() => setFormData({...formData, theme: 'dark'})} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.theme === 'dark' ? 'border-teal-500 bg-slate-800 text-white' : 'border-slate-100 text-slate-400'}`}>
                              <Moon size={32}/> <span className="font-bold text-sm">Dark Mode</span>
                          </button>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bahasa Aplikasi</label>
                          <div className="relative">
                              <Globe size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                              <select value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})} className="w-full pl-9 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-teal-500 cursor-pointer">
                                  <option>Bahasa Indonesia</option>
                                  <option>English (US)</option>
                              </select>
                          </div>
                      </div>
                  </div>
              );
          default: return null;
      }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex">
        {/* Left Sidebar Menu */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Pengaturan</h2>
            <div className="space-y-2 flex-1">
                <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}><User size={18}/> Profil</button>
                <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'notifications' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}><Bell size={18}/> Notifikasi</button>
                <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'security' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}><Lock size={18}/> Keamanan</button>
                <button onClick={() => setActiveTab('appearance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'appearance' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}><Palette size={18}/> Tampilan</button>
            </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-between">
            {renderContent()}
            <div className="pt-8 mt-8 border-t border-slate-100 flex justify-end">
                <button onClick={handleSave} className="bg-teal-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-800 flex items-center gap-2 shadow-lg shadow-teal-700/20 transition-all hover:scale-105 active:scale-95">
                    <Save size={18} /> Simpan Perubahan
                </button>
            </div>
        </div>
    </div>
  );
};

const TeacherCourseManager = ({ course, onBack, onUpdateModules, onGradeSubmission, onUpdateDiscussions, onUpdateCourse }) => {
  const [activeTab, setActiveTab] = useState('materi');
  const [gradingScore, setGradingScore] = useState({});
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [targetModuleIdx, setTargetModuleIdx] = useState(null);
  const [addType, setAddType] = useState('file'); 
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignAttachType, setAssignAttachType] = useState('none');
  const [assignFile, setAssignFile] = useState(null);
  const [assignLink, setAssignLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [attendance, setAttendance] = useState([{id: 1, name: "Rian Pratama", status: "H"},{id: 2, name: "Siti Aminah", status: "H"}]);

  const safeModules = course.modules || [];
  const submissions = course.submissions || [];

  const handleGrade = (submission, score) => { onGradeSubmission(course.id, submission, score); alert("Nilai berhasil disimpan!"); };
  const handleCreateModule = () => { const topicName = prompt("Masukkan nama Bab / Topik baru:"); if (topicName) onUpdateModules(course.id, [...safeModules, { title: topicName, items: [] }]); };
  const handleDeleteItem = (moduleIndex, itemIndex) => { if (window.confirm("Hapus item ini?")) { const updatedModules = [...safeModules]; updatedModules[moduleIndex].items.splice(itemIndex, 1); onUpdateModules(course.id, updatedModules); } };
  const handleFileChange = (e) => { if (e.target.files[0]) { setFile(e.target.files[0]); if (!title) setTitle(e.target.files[0].name); } };
  const handleAssignFileChange = (e) => { if (e.target.files[0]) setAssignFile(e.target.files[0]); };
  const handleSetMeeting = () => { const link = prompt("Masukkan Link Zoom/Meet:", course.meetingLink || ""); if (link !== null) onUpdateCourse(course.id, { meetingLink: link }); };
  const handleSendDiscussion = (text) => { const newMsg = { id: Date.now(), user: "Pak Budi", text, time: "Baru saja", role: "teacher" }; onUpdateDiscussions(course.id, [...(course.discussions || []), newMsg]); };
  const handleExportCSV = () => { if (submissions.length === 0) return; let csv = "Nama,File,Nilai\n"; submissions.forEach(s => csv += `${s.studentName},${s.fileName},${s.score||0}\n`); const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + csv); link.download = "Nilai.csv"; link.click(); };

  const handleAddQuestion = () => {
      const q = document.getElementById('qText').value; const a = document.getElementById('optA').value; const b = document.getElementById('optB').value; const correct = document.getElementById('correctOpt').value;
      if(q && a && b) { setQuizQuestions([...quizQuestions, { questionText: q, options: [ {answerText: a, isCorrect: correct==="0"}, {answerText: b, isCorrect: correct==="1"} ] }]); document.getElementById('qText').value = ""; document.getElementById('optA').value = ""; document.getElementById('optB').value = ""; } else alert("Isi semua field");
  };

  const handleSaveItem = async () => {
    if (!title) { alert("Mohon isi judul."); return; }
    setUploading(true); await new Promise(resolve => setTimeout(resolve, 500)); 
    try {
      let newItem = { id: Date.now(), title: title, completed: false };
      if (addType === 'link') { newItem.type = 'video'; newItem.url = linkUrl; newItem.isYoutube = linkUrl.includes('youtube') || linkUrl.includes('youtu.be'); } 
      else if (addType === 'assignment') {
        newItem.type = 'assignment'; newItem.deadline = deadline || 'Minggu Depan';
        if (assignAttachType === 'file' && assignFile) newItem.attachment = { type: 'file', title: assignFile.name, url: URL.createObjectURL(assignFile) }; 
        else if (assignAttachType === 'link' && assignLink) newItem.attachment = { type: 'link', title: "Link", url: assignLink };
      }
      else if (addType === 'quiz') { newItem.type = 'quiz'; newItem.questions = quizQuestions; }
      else { newItem.type = file?.type.includes('video') ? 'video' : 'file'; newItem.url = URL.createObjectURL(file); newItem.size = (file.size / 1024 / 1024).toFixed(2) + ' MB'; }
      const updatedModules = safeModules.map((mod, idx) => idx === targetModuleIdx ? { ...mod, items: [...mod.items, newItem] } : mod);
      onUpdateModules(course.id, updatedModules);
      setShowAddMaterial(false); setTitle(""); setFile(null); setLinkUrl(""); setDeadline(""); setAssignAttachType('none'); setAssignFile(null); setAssignLink(""); setQuizQuestions([]);
    } catch (error) { console.error(error); alert("Gagal menyimpan."); } finally { setUploading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><button onClick={onBack} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-teal-700"><ChevronRight className="rotate-180" /></button><div className="flex-1"><h2 className="text-2xl font-bold text-slate-800">{course.title}</h2><p className="text-sm text-slate-500">Kode: {course.code}</p></div><button onClick={handleSetMeeting} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${course.meetingLink ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500'}`}><Video size={18} /> {course.meetingLink ? "Edit Link" : "Set Live"}</button></div>
      <div className="flex border-b border-slate-200 bg-white px-6 rounded-t-2xl pt-2">{[{ id: 'materi', label: 'Materi', icon: BookOpen }, { id: 'diskusi', label: 'Forum', icon: MessageSquare }, { id: 'absensi', label: 'Absensi', icon: ClipboardList }, { id: 'nilai', label: 'Nilai', icon: Award }].map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === tab.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-teal-600'}`}><tab.icon size={18} /> {tab.label}</button>))}</div>
      {activeTab === 'materi' && (
        <div className="bg-white border border-slate-200 rounded-b-2xl p-6 shadow-sm rounded-tr-2xl mt-[-1px]"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800">Struktur Kelas</h3><button onClick={handleCreateModule} className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-teal-700/20"><FolderPlus size={18} /> Tambah Bab</button></div>
          <div className="space-y-6">{safeModules.length === 0 ? (<div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">Belum ada bab/topik.</div>) : (safeModules.map((module, idx) => (<div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm"><div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center"><span className="font-bold text-slate-700">{module.title}</span><button onClick={() => { setTargetModuleIdx(idx); setShowAddMaterial(true); }} className="text-xs flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-teal-500 hover:text-teal-700 font-bold transition-all"><Plus size={14} /> Tambah Item</button></div><div className="p-2 bg-white space-y-1">{module.items.map((item, i) => (<div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg border-b border-slate-100 last:border-0 group"><div className={`p-2 rounded-lg ${item.type === 'assignment' ? 'bg-red-100 text-red-600' : item.type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{item.type === 'assignment' ? <CheckSquare size={16} /> : item.type === 'quiz' ? <HelpCircle size={16} /> : <Video size={16} />}</div><div className="flex-1"><a href={item.url} target="_blank" rel="noreferrer" className="text-slate-700 text-sm font-bold hover:underline block">{item.title}</a></div><button onClick={() => handleDeleteItem(idx, i)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></div>))}</div></div>)))}</div>
        </div>
      )}
      {activeTab === 'diskusi' && <DiscussionBoard discussions={course.discussions || []} onSend={handleSendDiscussion} />}
      {activeTab === 'absensi' && (
          <div className="bg-white border border-slate-200 rounded-b-2xl p-6 shadow-sm rounded-tr-2xl mt-[-1px]"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800">Absensi Hari Ini ({new Date().toLocaleDateString()})</h3><button className="bg-teal-700 text-white px-4 py-2 rounded-lg font-bold text-sm" onClick={() => alert("Absensi Tersimpan!")}>Simpan Absensi</button></div><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold"><th className="p-3 rounded-tl-lg">Nama Siswa</th><th className="p-3 text-center">Hadir</th><th className="p-3 text-center">Izin</th><th className="p-3 text-center">Sakit</th><th className="p-3 text-center rounded-tr-lg">Alpha</th></tr></thead><tbody>{attendance.map(student => (<tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-3 font-bold text-slate-700">{student.name}</td>{['H','I','S','A'].map(status => (<td key={status} className="p-3 text-center"><button onClick={() => { setAttendance(attendance.map(s => s.id === student.id ? {...s, status} : s)); }} className={`w-8 h-8 rounded-full font-bold text-sm transition-all ${student.status === status ? (status==='H'?'bg-green-100 text-green-700':status==='A'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700') : 'bg-slate-100 text-slate-400'}`}>{status}</button></td>))}</tr>))}</tbody></table></div>
      )}
      {activeTab === 'nilai' && (<div className="bg-white border border-slate-200 rounded-b-2xl p-6 shadow-sm rounded-tr-2xl mt-[-1px]"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800">Nilai</h3><button onClick={handleExportCSV} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold"><Download size={16} /> CSV</button></div><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50 text-slate-500 text-xs font-bold"><th className="p-3">Siswa</th><th className="p-3">File</th><th className="p-3">Nilai</th></tr></thead><tbody>{submissions.map((sub, i) => (<tr key={i} className="border-b"><td className="p-3 font-bold text-slate-700">{sub.studentName}</td><td className="p-3"><a href={sub.fileUrl} target="_blank" className="text-blue-600 hover:underline text-sm">{sub.fileName}</a></td><td className="p-3 flex gap-2"><input type="number" className="w-16 p-1 border rounded" onChange={(e) => setGradingScore({...gradingScore, [i]: e.target.value})} /><button onClick={() => handleGrade(sub, gradingScore[i])} className="bg-teal-700 text-white p-1 rounded"><CheckCircle size={16} /></button></td></tr>))}</tbody></table></div>)}

      {showAddMaterial && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"><h3 className="text-lg font-bold text-slate-800">Tambah Item</h3><div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-4"><button onClick={() => setAddType('file')} className={`flex-1 py-2 text-sm font-bold rounded-md ${addType === 'file' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}>File</button><button onClick={() => setAddType('link')} className={`flex-1 py-2 text-sm font-bold rounded-md ${addType === 'link' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}>Link</button><button onClick={() => setAddType('assignment')} className={`flex-1 py-2 text-sm font-bold rounded-md ${addType === 'assignment' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}>Tugas</button><button onClick={() => setAddType('quiz')} className={`flex-1 py-2 text-sm font-bold rounded-md ${addType === 'quiz' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}>Kuis</button></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Judul</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3" placeholder="Judul..." /></div>
        {addType === 'file' && (<div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center relative"><input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><Upload size={32} className="mx-auto text-slate-400 mb-2" /><p className="text-sm text-slate-500">{file ? file.name : "Pilih File"}</p></div>)}
        {addType === 'link' && (<div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL</label><input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3" placeholder="https://..." /></div>)}
        {addType === 'assignment' && (<div className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batas Waktu</label><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3" /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Lampiran (Opsional)</label><div className="flex gap-2 mb-2"><button onClick={() => setAssignAttachType('none')} className={`px-3 py-1 text-xs rounded-full border ${assignAttachType === 'none' ? 'bg-slate-200 border-slate-300 font-bold' : 'border-slate-200'}`}>Tidak Ada</button><button onClick={() => setAssignAttachType('file')} className={`px-3 py-1 text-xs rounded-full border ${assignAttachType === 'file' ? 'bg-teal-100 border-teal-300 text-teal-700 font-bold' : 'border-slate-200'}`}>File (PDF/Gambar)</button><button onClick={() => setAssignAttachType('link')} className={`px-3 py-1 text-xs rounded-full border ${assignAttachType === 'link' ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold' : 'border-slate-200'}`}>Link</button></div>{assignAttachType === 'file' && (<div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50 relative"><input type="file" onChange={handleAssignFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><p className="text-xs text-center text-slate-500">{assignFile ? assignFile.name : "Klik untuk upload lampiran"}</p></div>)}{assignAttachType === 'link' && (<input value={assignLink} onChange={e => setAssignLink(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none" placeholder="https://sumber-bacaan.com" />)}</div></div>)}
        {addType === 'quiz' && (
            <div className="space-y-4 border-t pt-4">
                <p className="text-sm font-bold">Tambah Pertanyaan ({quizQuestions.length} tersimpan)</p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <input className="w-full border p-2 rounded mb-2 text-sm" placeholder="Pertanyaan..." id="qText" />
                    <div className="grid grid-cols-2 gap-2 mb-2"><input className="border p-1 rounded text-sm" placeholder="Opsi A" id="optA" /><input className="border p-1 rounded text-sm" placeholder="Opsi B" id="optB" /></div>
                    <div className="flex gap-2 text-xs items-center mb-2">Jawaban Benar: <select id="correctOpt" className="border p-1 rounded"><option value="0">Opsi A</option><option value="1">Opsi B</option></select></div>
                    <button onClick={handleAddQuestion} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-1 rounded text-xs font-bold">+ Tambah Soal</button>
                </div>
            </div>
        )}
        <div className="flex justify-end gap-2 pt-2"><button onClick={() => setShowAddMaterial(false)} className="px-4 py-2 text-slate-500 font-bold">Batal</button><button onClick={handleSaveItem} className="px-6 py-2 bg-teal-700 text-white rounded-xl font-bold">{uploading ? "Menyimpan..." : "Simpan"}</button></div></div></div>
      )}
    </div>
  );
};

// --- UPGRADED STUDENT VIEW (With Flashcards) ---
const StudentCourseView = ({ course, user, onBack, onSubmitAssignment, onToggleComplete, onUpdateDiscussions, flashcardDecks = [] }) => {
  const [activeItem, setActiveItem] = useState(null);
  const [activeTab, setActiveTab] = useState('materi');
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [note, setNote] = useState(() => { try { return localStorage.getItem(`note-${course.id}`) || ""; } catch { return ""; } });
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Flashcard Player State
  const [playingDeck, setPlayingDeck] = useState(null);
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  const safeModules = course.modules || [];
  const safeSubmissions = course.submissions || [];
  const mySubmission = safeSubmissions.find(s => s.assignmentId === activeItem?.id && s.studentId === user.uid);
  
  // Filter Decks for this Course
  const courseDecks = flashcardDecks.filter(d => d.courseId === course.id);

  const handleSaveNote = (e) => { setNote(e.target.value); localStorage.setItem(`note-${course.id}`, e.target.value); };
  const getYoutubeEmbedUrl = (url) => { if (!url) return ''; const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/); return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url; };
  const handleTurnIn = () => { if(!file) return; const fakeUrl = URL.createObjectURL(file); onSubmitAssignment(course.id, activeItem.id, fakeUrl, file.name); setSubmitted(true); setFile(null); };
  const handleSendDiscussion = (text) => { const newMsg = { id: Date.now(), user: "Saya", text, time: "Baru saja", role: "student" }; onUpdateDiscussions(course.id, [...(course.discussions || []), newMsg]); };

  // Flashcard Navigation Helpers
  const nextCard = () => { if(fcIndex < playingDeck.cards.length - 1) { setFcFlipped(false); setTimeout(() => setFcIndex(i => i+1), 150); }};
  const prevCard = () => { if(fcIndex > 0) { setFcFlipped(false); setTimeout(() => setFcIndex(i => i-1), 150); }};

  if (isTakingQuiz && activeItem?.type === 'quiz') {
      return (<div className="max-w-4xl mx-auto pt-10"><QuizView questions={activeItem.questions} onFinish={() => setIsTakingQuiz(false)} onScoreSave={(score) => alert(`Skor ${score} tersimpan!`)} /></div>);
  }

  const renderContent = () => {
    // 1. Flashcard Player Mode
    if (playingDeck) {
        const card = playingDeck.cards[fcIndex];
        return (
            <div className="h-full flex flex-col items-center justify-center p-10 bg-slate-800 rounded-3xl text-white relative">
                <button onClick={() => setPlayingDeck(null)} className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white"><ChevronLeft/> Keluar</button>
                <h3 className="text-xl font-bold mb-8 text-teal-400">{playingDeck.title}</h3>
                
                <div className="w-full max-w-lg h-64 perspective-1000 cursor-pointer" onClick={() => setFcFlipped(!fcFlipped)}>
                    <motion.div 
                        initial={false} animate={{ rotateY: fcFlipped ? 180 : 0 }} transition={{ duration: 0.6, type: "spring" }} style={{ transformStyle: "preserve-3d" }} className="w-full h-full relative"
                    >
                        {/* Front */}
                        <div className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center p-6 text-slate-800 backface-hidden" style={{ backfaceVisibility: "hidden" }}>
                            <h2 className="text-3xl font-bold text-center">{card.q}</h2>
                            <p className="absolute bottom-4 text-xs text-slate-400 uppercase tracking-widest">Klik untuk balik</p>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 bg-teal-600 rounded-2xl flex items-center justify-center p-6 text-white backface-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                            <h2 className="text-2xl font-bold text-center">{card.a}</h2>
                        </div>
                    </motion.div>
                </div>

                <div className="flex items-center gap-8 mt-8">
                    <button onClick={prevCard} disabled={fcIndex===0} className="p-3 bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-30"><ChevronLeft size={24}/></button>
                    <span className="font-mono">{fcIndex + 1} / {playingDeck.cards.length}</span>
                    <button onClick={nextCard} disabled={fcIndex===playingDeck.cards.length-1} className="p-3 bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-30"><ChevronRight size={24}/></button>
                </div>
            </div>
        );
    }

    // 2. Standard Content Modes
    if (!activeItem) return (<div className="text-center p-8"><BookOpen size={64} className="text-slate-700 mx-auto mb-4 opacity-50" /><h3 className="text-2xl font-bold text-white mb-2">Selamat Datang</h3><p className="text-slate-400">Pilih materi di sebelah kanan.</p>{course.announcement && (<div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left rounded-r-lg max-w-md mx-auto"><div className="flex gap-2 items-center mb-1 text-yellow-700 font-bold"><Megaphone size={16} /> PENGUMUMAN PENTING</div><p className="text-slate-700 text-sm">{course.announcement}</p></div>)}</div>);
    if (activeItem.type === 'quiz') { return (<div className="text-center p-12 bg-white rounded-3xl shadow-xl max-w-md mx-auto"><HelpCircle size={64} className="mx-auto text-teal-600 mb-4" /><h3 className="text-2xl font-bold text-slate-800 mb-2">{activeItem.title}</h3><p className="text-slate-500 mb-6">Uji pemahamanmu dengan kuis ini.</p><button onClick={() => setIsTakingQuiz(true)} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all">Mulai Kuis</button></div>); }
    if (activeItem.type === 'assignment') { return (<div className="text-center bg-white p-8 rounded-2xl w-96 shadow-2xl overflow-y-auto max-h-full"><div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckSquare size={32} /></div><h3 className="text-xl font-bold text-slate-800 mb-1">{activeItem.title}</h3><p className="text-slate-500 text-sm mb-6">Deadline: {activeItem.deadline}</p>{activeItem.attachment && (<div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-left flex items-center gap-3"><div className="bg-white p-2 rounded-lg border border-slate-200 text-blue-600">{activeItem.attachment.type === 'link' ? <LinkIcon size={16} /> : <FileText size={16} />}</div><div className="flex-1 overflow-hidden"><p className="text-xs text-slate-500 font-bold uppercase">Lampiran</p><a href={activeItem.attachment.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-800 truncate hover:text-blue-600 hover:underline block">{activeItem.attachment.title || "Lihat Lampiran"}</a></div></div>)}{(mySubmission || submitted) ? (<div className="bg-green-50 text-green-700 p-4 rounded-xl font-bold border border-green-200 flex items-center justify-center gap-2"><CheckCircle size={20} /> Sudah Dikumpulkan</div>) : (<div className="space-y-4"><div className="border-2 border-dashed border-slate-300 p-6 rounded-xl cursor-pointer hover:bg-slate-50 transition-all relative"><input type="file" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><Upload size={24} className="mx-auto text-slate-400 mb-2" /><p className="text-sm font-bold text-slate-600">{file ? file.name : "Klik untuk Upload"}</p></div><button onClick={handleTurnIn} disabled={!file} className="w-full py-2 bg-teal-700 text-white rounded-lg font-bold disabled:opacity-50">Serahkan Tugas</button></div>)}</div>); }
    if (activeItem.type === 'video') { if (activeItem.isYoutube) return <iframe src={getYoutubeEmbedUrl(activeItem.url)} className="w-full h-full" title="YouTube" frameBorder="0" allowFullScreen></iframe>; return <video controls src={activeItem.url} className="max-h-[60vh] max-w-full rounded-lg shadow-lg bg-black" />; }
    if (activeItem.type === 'image') { return <img src={activeItem.url} alt="Materi" className="max-h-[70vh] max-w-full rounded-lg shadow-lg object-contain" />; }
    return (<div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white p-4"><div className="text-center"><FileText size={80} className="text-slate-500 mx-auto mb-6" /><h3 className="text-xl font-bold mb-2">{activeItem.title}</h3><a href={activeItem.url} download={activeItem.title} className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg inline-flex items-center gap-2 transition-all"><Upload className="rotate-180" size={20} /> Download File</a></div></div>);
  };

  const totalItems = safeModules.reduce((acc, mod) => acc + mod.items.length, 0);
  const completedItems = safeModules.reduce((acc, mod) => acc + mod.items.filter(i => i.completed).length, 0);
  const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  return (
    <div className={`max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 transition-all ${focusMode ? 'fixed inset-0 z-50 bg-white p-8 max-w-none h-screen' : ''}`}>
      {/* LEFT CONTENT AREA */}
      <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                  {!focusMode && <button onClick={onBack} className="p-2 bg-white rounded-lg text-slate-400 hover:text-teal-700"><ChevronRight className="rotate-180" /></button>}
                  <h2 className="text-xl font-bold text-slate-800 truncate max-w-xs">{activeItem ? activeItem.title : course.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                  {course.meetingLink && (<a href={course.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-red-500/30 animate-pulse"><Video size={16} /> Live</a>)}
                  <button onClick={() => setFocusMode(!focusMode)} className="p-2 bg-slate-100 hover:bg-teal-100 text-slate-600 hover:text-teal-700 rounded-lg" title="Mode Fokus">{focusMode ? <Minimize size={20} /> : <Maximize size={20} />}</button>
              </div>
          </div>
          <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden relative shadow-xl border border-slate-800 flex items-center justify-center">
             {activeTab === 'diskusi' ? (<div className="w-full h-full bg-white overflow-hidden rounded-3xl"><div className="p-4 border-b bg-slate-50 font-bold text-slate-700">Forum Diskusi Kelas</div><div className="h-full pb-16"><DiscussionBoard discussions={course.discussions || []} onSend={handleSendDiscussion} /></div></div>) : 
              activeTab === 'notes' ? (<div className="w-full h-full bg-yellow-50 overflow-hidden rounded-3xl p-6 flex flex-col"><h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><PenTool size={18} /> Catatan Pribadi</h3><textarea value={note} onChange={handleSaveNote} className="flex-1 bg-transparent border-none outline-none text-slate-700 resize-none leading-relaxed font-medium" placeholder="Tulis catatan penting di sini..." /><p className="text-[10px] text-yellow-600 mt-2 text-right">*Disimpan otomatis</p></div>) : 
              renderContent()}
          </div>
      </div>

      {/* RIGHT SIDEBAR (Navigation & Flashcards) */}
      <div className={`w-full lg:w-96 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm ${focusMode ? 'hidden' : ''}`}>
        <div className="flex border-b border-slate-200">
            <button onClick={() => {setActiveTab('materi'); setActiveItem(null); setIsTakingQuiz(false); setPlayingDeck(null);}} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'materi' ? 'text-teal-700 border-b-2 border-teal-700' : 'text-slate-500'}`}>Materi</button>
            <button onClick={() => setActiveTab('flashcards')} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'flashcards' ? 'text-teal-700 border-b-2 border-teal-700' : 'text-slate-500'}`}>Kartu</button>
            <button onClick={() => setActiveTab('diskusi')} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'diskusi' ? 'text-teal-700 border-b-2 border-teal-700' : 'text-slate-500'}`}>Diskusi</button>
            <button onClick={() => setActiveTab('notes')} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'notes' ? 'text-teal-700 border-b-2 border-teal-700' : 'text-slate-500'}`}>Catatan</button>
        </div>
        
        {activeTab === 'materi' && (
           <div className="flex-1 overflow-y-auto">
              <div className="px-6 pt-6 pb-2"><div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Progress</span><span>{progress}%</span></div><div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div></div>{progress === 100 && (<button onClick={() => setShowCertificate(true)} className="mt-4 w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 animate-bounce"><Award size={20} /> Klaim Sertifikat</button>)}</div>
              <div className="p-4 space-y-6">{safeModules.map((mod, i) => (<div key={i}><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-2">{mod.title}</h4><div className="space-y-2">{mod.items.map((item) => (<div key={item.id} className={`flex items-center gap-2 p-2 rounded-xl transition-all ${activeItem?.id === item.id ? 'bg-teal-50 border border-teal-200' : 'hover:bg-slate-50 border border-transparent'}`}><button onClick={() => onToggleComplete(course.id, item.id, !item.completed)} className={`p-1 rounded-full border ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent hover:border-green-500'}`}><CheckCircle size={14} /></button><button onClick={() => {setActiveItem(item); setIsTakingQuiz(false);}} className="flex-1 flex items-center gap-3 text-left"><div className={`p-2 rounded-lg ${item.type === 'assignment' ? 'bg-red-100 text-red-600' : item.type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>{item.type === 'assignment' ? <CheckSquare size={16} /> : item.type === 'quiz' ? <HelpCircle size={16} /> : <Video size={16} />}</div><div className="flex-1 overflow-hidden"><p className={`text-sm font-bold truncate ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.title}</p></div></button></div>))}</div></div>))}</div>
           </div>
        )}

        {/* NEW: FLASHCARD TAB CONTENT */}
        {activeTab === 'flashcards' && (
            <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="font-bold text-slate-800 mb-4">Kartu Pintar Kelas Ini</h3>
                {courseDecks.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                        <Layers size={32} className="mx-auto mb-2 opacity-50"/>
                        <p className="text-sm">Guru belum menambahkan kartu untuk kelas ini.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {courseDecks.map(deck => (
                            <div key={deck.id} onClick={() => { setPlayingDeck(deck); setFcIndex(0); setFcFlipped(false); setActiveItem(null); }} className="p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-teal-50 hover:border-teal-200 transition-all flex items-center gap-4 group">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${deck.color} group-hover:scale-110 transition-transform`}>
                                    <Layers size={20}/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 group-hover:text-teal-700">{deck.title}</h4>
                                    <p className="text-xs text-slate-500">{deck.cards.length} Kartu</p>
                                </div>
                                <Play size={16} className="ml-auto text-slate-300 group-hover:text-teal-600"/>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'diskusi' && (<div className="p-6 text-center text-slate-500 text-sm">Gunakan panel diskusi di layar utama.</div>)}
        {activeTab === 'notes' && (<div className="p-6 text-center text-slate-500 text-sm">Tulis catatanmu di layar utama.</div>)}
      </div>
      <CertificateModal isOpen={showCertificate} onClose={() => setShowCertificate(false)} studentName={user.name} courseName={course.title} />
    </div>
  );
};

// --- 3. REPLACE EduFlowAppContent WITH THIS ---
const EduFlowAppContent = () => {
  const [user, setUser] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true); // Add Loading
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [courses, setCourses] = useState([]); 
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false); 
  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [personalEvents, setPersonalEvents] = useState([]);
  
  // Use the constant we moved to the top
  const [flashcardDecks, setFlashcardDecks] = useState(INITIAL_FLASHCARD_DECKS);

  // 1. ROBUST AUTH CHECK
  // --- AUTH CHECKER (FIXED) ---
  // Inside EduFlowAppContent
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Just try to get the doc. If it fails, we handle it.
        try {
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                setUser({ uid: currentUser.uid, ...docSnap.data() });
            } else {
                // If Auth exists but DB data is gone -> Force logout to reset state
                // Or set a temporary user object
                setUser({ uid: currentUser.uid, email: currentUser.email, name: "User", role: "student" });
            }
        } catch (e) {
            console.error("Network/DB Error:", e);
            // Allow login anyway if DB fails
            setUser({ uid: currentUser.uid, email: currentUser.email, name: "User", role: "student" });
        }
      } else { 
          setUser(null); 
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
}, []);

  // 2. ROBUST DATA LOAD
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // If DB empty or offline, use Initial Data to prevent crash
      setCourses(coursesData.length > 0 ? coursesData : INITIAL_COURSES);
    }, (error) => console.log("Offline mode"));
    return () => unsubscribe();
  }, []);

  // ... (Keep your existing handlers here: handleUpdateCourse, handleJoin, etc.)
  // NOTE: Ensure these handlers are defined before the return statement.
  // If you deleted them, copy them from the previous response I sent.
  
  // --- PASTE HANDLERS HERE IF MISSING ---
  const handleUpdateCourse = async (id, data) => updateDoc(doc(db,"courses",id), data).catch(()=>{});
  const handleUpdateModules = async (id, modules) => updateDoc(doc(db,"courses",id), { modules }).catch(()=>{});
  const handleUpdateDiscussions = async (id, disc) => updateDoc(doc(db,"courses",id), { discussions: disc }).catch(()=>{});
  const handleSubmitAssignment = async (cId, aId, url, name) => { await updateDoc(doc(db,"courses",cId), { submissions: arrayUnion({ studentId: user.uid, studentName: user.name, assignmentId: aId, fileUrl: url, fileName: name, submittedAt: new Date() }) }); alert("Terkirim!"); };
  const handleGradeSubmission = async (cId, sub, score) => { /* Add logic if needed */ };
  const handleToggleComplete = async (cId, iId, val) => { /* Add logic if needed */ };
  const handleAddCourse = async (c) => addDoc(collection(db,"courses"), { ...c, modules: [], submissions: [], discussions: [], createdAt: new Date(), students: [], calendarEvents: [] });
  const handleJoinClass = async (code) => {
    const course = courses.find(c => c.code === code);
    if (course) { 
        const studentData = { uid: user.uid, name: user.name };
        await updateDoc(doc(db, "courses", course.id), { students: arrayUnion(studentData) });
        alert(`Berhasil bergabung ke kelas: ${course.title}`); 
        return true; 
    }
    alert("Kode kelas tidak ditemukan.");
    return false;
  };  const handleSidebarNavigation = (id) => { setActiveView(id); if(id==='courses') setSelectedCourse(null); };

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold animate-pulse">Memuat...</div>;
  if (!user) return <AuthPage onLogin={setUser} />;

  return (
      <div className="min-h-screen bg-slate-50 font-sans flex">
          <Sidebar activeView={activeView} setActiveView={handleSidebarNavigation} user={user} onLogout={() => signOut(auth)} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
          <main className="flex-1 md:ml-64 p-8">
             <div className="flex justify-between items-center mb-8">
                 <div className="md:hidden"><Menu onClick={()=>setIsMobileOpen(true)}/></div>
                 <h1 className="text-2xl font-bold text-slate-800 capitalize">{activeView.replace('-',' ')}</h1>
                 <div className="flex gap-4"><div className="bg-white p-2 rounded-full shadow-sm border"><Bell size={20} className="text-slate-400"/></div></div>
             </div>

             <AnimatePresence mode="wait">
                 {activeView === 'dashboard' && <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><DashboardView user={user} courses={courses} onJoin={() => setIsJoinClassOpen(true)} /></motion.div>}
                 
                 {activeView === 'courses' && !selectedCourse && (
                    <motion.div key="course-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {courses.map(c => (
                                <div key={c.id} onClick={() => {setSelectedCourse(c); setActiveView('course-detail')}} className="bg-white p-6 rounded-2xl border cursor-pointer hover:shadow-lg transition-all">
                                    <div className={`h-24 ${c.color} rounded-xl mb-4 shadow-sm`}></div>
                                    <h3 className="font-bold text-lg">{c.title}</h3>
                                    <p className="text-sm text-slate-500">{c.code}</p>
                                </div>
                            ))}
                            {user.role === 'teacher' && <button onClick={() => setIsCreateClassOpen(true)} className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400 font-bold hover:bg-slate-50 hover:text-slate-600 transition-all p-6"><Plus size={32}/> Buat Kelas</button>}
                        </div>
                    </motion.div>
                 )}

                 {activeView === 'course-detail' && selectedCourse && (
                    <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {user.role === 'teacher' 
                          ? <TeacherCourseManager course={selectedCourse} onBack={() => setSelectedCourse(null)} onUpdateModules={handleUpdateModules} onGradeSubmission={handleGradeSubmission} onUpdateDiscussions={handleUpdateDiscussions} onUpdateCourse={handleUpdateCourse} />
                          : <StudentCourseView course={selectedCourse} user={user} onBack={() => setSelectedCourse(null)} onSubmitAssignment={handleSubmitAssignment} onToggleComplete={handleToggleComplete} onUpdateDiscussions={handleUpdateDiscussions} flashcardDecks={flashcardDecks} />
                        }
                    </motion.div>
                 )}

                 {activeView === 'calendar' && <CalendarView courses={courses} user={user} onUpdateCourse={handleUpdateCourse} personalEvents={personalEvents} setPersonalEvents={setPersonalEvents} />}
                 {activeView === 'kanban' && <KanbanBoard user={user} />}
                 {activeView === 'flashcards' && <FlashcardView decks={flashcardDecks} onAddDeck={(d) => setFlashcardDecks([...flashcardDecks, d])} user={user} courses={courses} />}
                 {activeView === 'whiteboard' && <WhiteboardView />}
                 {activeView === 'library' && <LibraryView />}
                 {activeView === 'messages' && <MessagesView courses={courses} user={user} />}
                 {activeView === 'profile' && <StudentProfileView user={user} />}
                 {activeView === 'settings' && <SettingsView user={user} onUpdateUser={setUser} />}
             </AnimatePresence>
          </main>
          <CreateClassModal isOpen={isCreateClassOpen} onClose={() => setIsCreateClassOpen(false)} onSave={handleAddCourse} />
          <JoinClassModal isOpen={isJoinClassOpen} onClose={() => setIsJoinClassOpen(false)} onJoin={handleJoinClass} />
      </div>
  );
};

const EduFlowApp = () => {
  return (
    <ErrorBoundary>
      <EduFlowAppContent />
    </ErrorBoundary>
  );
}

export default EduFlowApp;