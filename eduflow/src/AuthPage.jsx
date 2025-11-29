// --- 3. AUTHENTICATION (PERSISTENCE-FIRST) ---
const AuthPage = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');

  const handleAuth = async (e) => {
    e.preventDefault();
    
    // Use standard browser alerts for simplicity and reliability
    try {
      let userObj;
      let profileData;

      if (isRegistering) {
        // 1. REGISTER
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        userObj = uc.user;
        
        profileData = { 
            uid: userObj.uid, 
            name: name, 
            email: email, 
            role: role, 
            createdAt: new Date().toISOString() 
        };
        
        // Save to Cloud (Fire-and-forget to prevent hanging)
        setDoc(doc(db, "users", userObj.uid), profileData);
      
      } else {
        // 2. LOGIN
        const uc = await signInWithEmailAndPassword(auth, email, password);
        userObj = uc.user;

        // Try to get fresh data, but have a backup plan
        const docRef = doc(db, "users", userObj.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            profileData = { uid: userObj.uid, ...docSnap.data() };
        } else {
            // CRITICAL FIX: If DB is missing, use the email as the name
            // Do NOT default to 'student' blindly.
            profileData = { 
                uid: userObj.uid, 
                email: email, 
                name: email.split('@')[0], 
                role: "student" // Fallback only if absolutely necessary
            };
        }
      }

      // 3. SAVE TO BROWSER (This fixes the refresh bug)
      localStorage.setItem("eduflow_user", JSON.stringify(profileData));
      
      // 4. ENTER APP
      onLogin(profileData);

    } catch (err) {
      console.error(err);
      alert("Gagal: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-xl border border-slate-100">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800">EduFlow</h1>
                <p className="text-slate-500">{isRegistering ? "Buat akun baru" : "Masuk ke akun Anda"}</p>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-5">
              {isRegistering && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nama Lengkap" />
                  <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setRole('student')} className={`p-3 rounded-xl font-bold border transition-all ${role === 'student' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-400 border-slate-200'}`}>Siswa</button>
                      <button type="button" onClick={() => setRole('teacher')} className={`p-3 rounded-xl font-bold border transition-all ${role === 'teacher' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-400 border-slate-200'}`}>Guru</button>
                  </div>
                </div>
              )}
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500" placeholder="Email Address" />
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500" placeholder="Password" />
              
              <button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95">
                  {isRegistering ? "Daftar Sekarang" : "Masuk Aplikasi"}
              </button>
            </form>

            <div className="mt-8 text-center">
                <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-bold text-slate-400 hover:text-teal-600 transition-colors">
                    {isRegistering ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}
                </button>
            </div>
        </div>
    </div>
  );
};