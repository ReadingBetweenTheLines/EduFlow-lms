// src/AuthPage.jsx
import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User, Mail, Lock, Loader2, LogIn, UserPlus, GraduationCap, AlertCircle } from 'lucide-react';

const AuthPage = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');

  // --- 1. REGISTER LOGIC ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // A. Create Account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // B. Prepare User Data
      const userData = {
        uid: user.uid,
        name: name,
        email: email,
        role: role,
        createdAt: new Date().toISOString()
      };

      // C. Save to Database (Firestore)
      await setDoc(doc(db, "users", user.uid), userData);

      // D. Log In
      onLogin(userData);

    } catch (err) {
      console.error(err);
      setError(parseFirebaseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // A. Verify Password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // B. Get User Profile from Database
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Success: We found the profile
        onLogin({ uid: user.uid, ...docSnap.data() });
      } else {
        // Edge Case: User exists in Auth but NOT in Database
        // We create a "Rescue Profile" so they aren't locked out
        console.warn("Profile missing. Creating default.");
        const rescueData = {
            uid: user.uid,
            name: "User",
            email: email,
            role: "student", // Default fallback
            createdAt: new Date().toISOString()
        };
        await setDoc(docRef, rescueData);
        onLogin(rescueData);
      }

    } catch (err) {
      console.error(err);
      setError(parseFirebaseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  // Helper to make error messages readable
  const parseFirebaseError = (msg) => {
      if (msg.includes("invalid-credential") || msg.includes("wrong-password")) return "Email atau password salah.";
      if (msg.includes("email-already-in-use")) return "Email ini sudah terdaftar.";
      if (msg.includes("network-request-failed")) return "Koneksi internet bermasalah.";
      return "Terjadi kesalahan. Coba lagi.";
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-200">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                    <GraduationCap size={32} />
                </div>
                <h1 className="text-3xl font-bold text-slate-800">EduFlow</h1>
                <p className="text-slate-500 mt-2">
                    {isRegistering ? "Buat akun baru untuk memulai." : "Silakan masuk untuk melanjutkan."}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r flex items-center gap-2">
                    <AlertCircle size={16}/> {error}
                </div>
            )}

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
              {isRegistering && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="relative">
                      <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                      <input 
                        required 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                        placeholder="Nama Lengkap" 
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setRole('student')} className={`py-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${role === 'student' ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                          <User size={16}/> Siswa
                      </button>
                      <button type="button" onClick={() => setRole('teacher')} className={`py-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${role === 'teacher' ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                          <GraduationCap size={16}/> Guru
                      </button>
                  </div>
                </div>
              )}

              <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                    placeholder="Email Address" 
                  />
              </div>
              
              <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input 
                    required 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                    placeholder="Password" 
                  />
              </div>
              
              <button 
                disabled={loading} 
                type="submit" 
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
              >
                  {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? <UserPlus size={20}/> : <LogIn size={20}/>)}
                  <span>{loading ? "Memproses..." : (isRegistering ? "Daftar Sekarang" : "Masuk Aplikasi")}</span>
              </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
                <p className="text-sm text-slate-500 mb-2">{isRegistering ? "Sudah punya akun?" : "Belum punya akun?"}</p>
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
                    className="text-sm font-bold text-teal-600 hover:text-teal-800 hover:underline transition-colors"
                >
                    {isRegistering ? "Login di sini" : "Daftar di sini"}
                </button>
            </div>
        </div>
    </div>
  );
};

export default AuthPage;