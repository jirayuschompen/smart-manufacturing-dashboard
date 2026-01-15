import React, { useState, useEffect } from 'react';
import { Cpu, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, CheckCircle, Globe, AlertCircle } from 'lucide-react';

const LoginMockup = ({ onLogin }) => {

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [language, setLanguage] = useState('th');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [firebaseSDK, setFirebaseSDK] = useState(null);
  const [loadingSDK, setLoadingSDK] = useState(true);

  // Load Firebase SDK dynamically
  useEffect(() => {
    const loadFirebase = async () => {
      try {
        // Load Firebase scripts
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/firebase/9.22.0/firebase-app-compat.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/firebase/9.22.0/firebase-auth-compat.min.js');
        
        if (window.firebase) {
          setFirebaseSDK(window.firebase);
        }
      } catch (err) {
        console.error('Failed to load Firebase SDK:', err);
        setError('Failed to load Firebase SDK');
      } finally {
        setLoadingSDK(false);
      }
    };

    loadFirebase();
  }, []);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Initialize Firebase after SDK is loaded
  useEffect(() => {
    if (!firebaseSDK) return;

    // Firebase configuration - REPLACE WITH YOUR OWN CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBjwv--tqDKpQC1Qsasd5XoP_akKD40oaw",
  authDomain: "smart-manufacturing-dashboard.firebaseapp.com",
  projectId: "smart-manufacturing-dashboard",
  storageBucket: "smart-manufacturing-dashboard.firebasestorage.app",
  messagingSenderId: "93922263470",
  appId: "1:93922263470:web:58dda81c044d2b64c0083f",
  measurementId: "G-2NKT6KRE4R"
};

    // Initialize Firebase only if not already initialized
    if (!firebaseSDK.apps.length) {
      firebaseSDK.initializeApp(firebaseConfig);
    }

    // Listen to auth state changes
    const auth = firebaseSDK.auth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [firebaseSDK]);

  const t = {
    th: {
      welcome: 'ยินดีต้อนรับสู่',
      platform: 'ระบบผลิตอัจฉริยะ',
      subtitle: 'แพลตฟอร์มวิเคราะห์ข้อมูลเชิงคาดการณ์',
      emailLabel: 'อีเมล',
      emailPlaceholder: 'กรอกอีเมลของคุณ',
      passwordLabel: 'รหัสผ่าน',
      passwordPlaceholder: 'กรอกรหัสผ่านของคุณ',
      rememberMe: 'จดจำฉันไว้',
      forgotPassword: 'ลืมรหัสผ่าน?',
      signIn: 'เข้าสู่ระบบ',
      signOut: 'ออกจากระบบ',
      noAccount: 'ยังไม่มีบัญชี?',
      signUp: 'สมัครสมาชิก',
      haveAccount: 'มีบัญชีแล้ว?',
      secureLogin: 'การเข้าสู่ระบบที่ปลอดภัย',
      secureDesc: 'ข้อมูลของคุณได้รับการเข้ารหัสด้วย SSL 256-bit',
      ai: 'AI-Powered',
      aiDesc: 'การวิเคราะห์แบบเรียลไทม์ด้วย Machine Learning',
      support: 'ช่วยเหลือตลอด 24/7',
      supportDesc: 'ทีมผู้เชี่ยวชาญพร้อมช่วยเหลือทุกเมื่อ',
      demo: 'ทดลองใช้',
      demoEmail: 'demo@smartmfg.com',
      demoPassword: 'demo123',
      loggedIn: 'เข้าสู่ระบบสำเร็จ',
      signingIn: 'กำลังเข้าสู่ระบบ...',
      signingUp: 'กำลังสมัครสมาชิก...',
      configWarning: 'กรุณาตั้งค่า Firebase Config ของคุณ',
      loadingSDK: 'กำลังโหลด Firebase...',
    },
    en: {
      welcome: 'Welcome to',
      platform: 'Smart Manufacturing AI',
      subtitle: 'Predictive Analytics Platform',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      haveAccount: 'Have an account?',
      secureLogin: 'Secure Login',
      secureDesc: 'Your data is encrypted with 256-bit SSL',
      ai: 'AI-Powered',
      aiDesc: 'Real-time analysis with Machine Learning',
      support: '24/7 Support',
      supportDesc: 'Expert team ready to help anytime',
      demo: 'Demo',
      demoEmail: 'demo@smartmfg.com',
      demoPassword: 'demo123',
      loggedIn: 'Successfully Logged In',
      signingIn: 'Signing in...',
      signingUp: 'Signing up...',
      configWarning: 'Please configure your Firebase Config',
      loadingSDK: 'Loading Firebase...',
    }
  };

  const lang = t[language];
  

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!firebaseSDK) {
      setError('Firebase is not loaded');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
    const auth = firebaseSDK.auth();
    

    if (isSignUp) {
      await auth.createUserWithEmailAndPassword(email, password);
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }

    // 👉 เพิ่มตรงนี้ เพื่อแจ้ง App.jsx ว่าล็อกอินแล้ว
    if (onLogin) onLogin();

} catch (err) {
      let errorMessage = err.message;
      
      // Translate common Firebase errors
      if (language === 'th') {
        if (err.code === 'auth/user-not-found') errorMessage = 'ไม่พบผู้ใช้นี้';
        else if (err.code === 'auth/wrong-password') errorMessage = 'รหัสผ่านไม่ถูกต้อง';
        else if (err.code === 'auth/email-already-in-use') errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
        else if (err.code === 'auth/weak-password') errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        else if (err.code === 'auth/invalid-email') errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
        else if (err.code === 'auth/invalid-credential') errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else {
        if (err.code === 'auth/user-not-found') errorMessage = 'User not found';
        else if (err.code === 'auth/wrong-password') errorMessage = 'Incorrect password';
        else if (err.code === 'auth/email-already-in-use') errorMessage = 'Email already in use';
        else if (err.code === 'auth/weak-password') errorMessage = 'Password should be at least 6 characters';
        else if (err.code === 'auth/invalid-email') errorMessage = 'Invalid email format';
        else if (err.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleLogout = async () => {
    if (!firebaseSDK) return;
    
    try {
      await firebaseSDK.auth().signOut();
      setEmail('');
      setPassword('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const fillDemo = () => {
    setEmail(lang.demoEmail);
    setPassword(lang.demoPassword);
  };

  // Loading state
  if (loadingSDK) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">{lang.loadingSDK}</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show dashboard
if (user) {
  if (onLogin) onLogin();   // ส่งกลับ App.jsx
}


  const isConfigured = firebaseSDK && firebaseSDK.apps.length > 0 && 
                       firebaseSDK.apps[0].options.apiKey !== "YOUR_API_KEY";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-64 h-64 bg-cyan-500 rounded-full blur-3xl opacity-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side */}
          <div className="text-white space-y-8 hidden lg:block">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl shadow-2xl">
                  <Cpu className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">{lang.welcome}</h1>
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {lang.platform}
                  </h2>
                </div>
              </div>
              <p className="text-xl text-blue-200">{lang.subtitle}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-4 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition">
                <div className="bg-blue-500 bg-opacity-30 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{lang.secureLogin}</h3>
                  <p className="text-blue-200 text-sm">{lang.secureDesc}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition">
                <div className="bg-purple-500 bg-opacity-30 p-3 rounded-lg">
                  <Cpu className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{lang.ai}</h3>
                  <p className="text-blue-200 text-sm">{lang.aiDesc}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition">
                <div className="bg-cyan-500 bg-opacity-30 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{lang.support}</h3>
                  <p className="text-blue-200 text-sm">{lang.supportDesc}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">98%</div>
                <div className="text-sm text-blue-200">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">24/7</div>
                <div className="text-sm text-blue-200">Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">500+</div>
                <div className="text-sm text-blue-200">Clients</div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12 backdrop-blur-xl bg-opacity-95">
            <div className="lg:hidden mb-8 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{lang.platform}</h2>
              </div>
              <p className="text-slate-500 text-sm">{lang.subtitle}</p>
            </div>

            <div className="flex justify-end mb-6">
              <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('th')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center space-x-1 ${
                    language === 'th' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>ไทย</span>
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center space-x-1 ${
                    language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>EN</span>
                </button>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-3xl font-bold text-slate-800 mb-2">
                {isSignUp ? lang.signUp : lang.signIn}
              </h3>
              <p className="text-slate-500">{lang.welcome} {lang.platform}</p>
            </div>

            {!isConfigured && (
              <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ {lang.configWarning}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {language === 'th' 
                        ? 'แก้ไข firebaseConfig ในโค้ดด้วยข้อมูลจาก Firebase Console' 
                        : 'Edit firebaseConfig in the code with your Firebase Console credentials'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-800 mb-1">🎯 {lang.demo}</p>
                    <p className="text-xs text-blue-600">Email: {lang.demoEmail}</p>
                    <p className="text-xs text-blue-600">Password: {lang.demoPassword}</p>
                    <p className="text-xs text-blue-500 mt-1">
                      {language === 'th' ? '(สร้างบัญชีก่อนใช้งาน)' : '(Create account first)'}
                    </p>
                  </div>
                  <button onClick={fillDemo} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition font-medium">
                    {language === 'th' ? 'ใช้ข้อมูลนี้' : 'Auto-fill'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{lang.emailLabel}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={lang.emailPlaceholder}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{lang.passwordLabel}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={lang.passwordPlaceholder}
                    className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">{lang.rememberMe}</span>
                  </label>
                  <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    {lang.forgotPassword}
                  </button>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading || !email || !password}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isSignUp ? lang.signingUp : lang.signingIn}</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? lang.signUp : lang.signIn}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-sm text-slate-600"
              >
                {isSignUp ? lang.haveAccount : lang.noAccount}{' '}
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  {isSignUp ? lang.signIn : lang.signUp}
                </span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                {language === 'th' ? '© 2024 Smart Manufacturing AI. สงวนลิขสิทธิ์.' : '© 2024 Smart Manufacturing AI. All rights reserved.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginMockup;