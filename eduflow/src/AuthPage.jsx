import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User, Mail, Lock, Loader2, LogIn, UserPlus } from 'lucide-react';

const AuthPage = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let userAuth;
      let userData;

      if (isRegistering) {
        // --- REGISTER FLOW ---
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userAuth = userCredential.user;
        
        // 2. Prepare Data
        userData = { 
            name: name, 
            email: email, 
            role: role, 
            createdAt: new Date() 
        };

        // 3. Save to Database (Wait for it!)
        await setDoc(doc(db, "users", userAuth.uid), userData);
        
        // 4. Log In
        onLogin({ uid: userAuth.uid, ...userData });

      } else {
        // --- LOGIN FLOW ---
        // 1. Check Credentials
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        userAuth = userCredential.user;

        // 2. Fetch Profile (Wait for it!)
        const docRef = doc(db, "users", userAuth.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            userData = docSnap.data();
            onLogin({ uid: userAuth.uid, ...userData });
        } else {
            // Auto-Heal: User exists in Auth but not DB (Common during dev)
            console.warn("Profile missing. Creating default profile.");
            const fallbackData = { 
                name: "User", 
                email: email, 
                role: "student", 
                createdAt: new Date() 
            };
            await setDoc(docRef, fallbackData);
            onLogin({ uid: userAuth.uid, ...fallbackData });
        }
      }
    } catch (err) { 
        console.error(err);
        setError(err.message.replace("Firebase: ", ""));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-100">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">EduFlow</h1>
                <p className="text-slate-500">{isRegistering ? "Buat akun baru untuk memulai." : "Selamat datang kembali!"}</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center justify-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegistering && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
                      <button type="button" onClick={() => setRole('student')} className={`py-3 rounded-xl font-bold text-sm transition-all border ${role === 'student' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Siswa</button>
                      <button type="button" onClick={() => setRole('teacher')} className={`py-3 rounded-xl font-bold text-sm transition-all border ${role === 'teacher' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Guru</button>
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
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                  {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? <UserPlus size={20}/> : <LogIn size={20}/>)}
                  <span>{loading ? "Memproses..." : (isRegistering ? "Daftar Sekarang" : "Masuk Aplikasi")}</span>
              </button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
                    className="text-sm font-bold text-slate-400 hover:text-teal-600 transition-colors"
                >
                    {isRegistering ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}
                </button>
            </div>
        </div>
    </div>
  );
};

export default AuthPage;