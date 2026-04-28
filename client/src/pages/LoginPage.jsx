import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckSquare, Mail, Lock, AlertCircle, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import API from '@/api/axios';

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@taskflow.com", password: "Admin@123456", color: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200", dot: "bg-purple-500" },
  { label: "BOD", email: "bod@taskflow.com", password: "Test@1234", color: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200", dot: "bg-blue-500" },
  { label: "Manager", email: "manager@taskflow.com", password: "Test@1234", color: "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200", dot: "bg-indigo-500" },
  { label: "Team Lead", email: "teamlead@taskflow.com", password: "Test@1234", color: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200", dot: "bg-green-500" },
  { label: "Employee", email: "employee@taskflow.com", password: "Test@1234", color: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200", dot: "bg-orange-500" },
];

const OTPLogin = () => {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) return toast.error('Enter your email first');
    setLoading(true);
    try {
      await API.post('/auth/send-otp', { email });
      setOtpSent(true);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) return toast.error('Enter the OTP');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/verify-otp', { email, otp });
      await loginWithToken(data.token);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 border rounded-lg p-4 bg-white/5 border-white/10">
      <p className="text-xs text-indigo-300 font-medium">Login with OTP</p>
      <div className="flex gap-2">
        <Input type="email" placeholder="your@email.com" value={email}
          onChange={e => setEmail(e.target.value)} disabled={otpSent} 
          className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-indigo-300/50" />
        <Button type="button" variant="outline" size="sm" onClick={handleSendOTP} 
          disabled={loading || otpSent}
          className="border-white/20 text-white hover:bg-white/10">
          {loading ? '...' : 'Send OTP'}
        </Button>
      </div>
      {otpSent && (
        <div className="flex gap-2">
          <Input placeholder="Enter 6-digit OTP" value={otp}
            onChange={e => setOtp(e.target.value)} maxLength={6} 
            className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-indigo-300/50" />
          <Button type="button" size="sm" onClick={handleVerifyOTP} disabled={loading}
            className="border-white/20 text-white hover:bg-white/10">
            {loading ? '...' : 'Verify'}
          </Button>
        </div>
      )}
      {otpSent && (
        <button type="button" className="text-xs text-indigo-300 hover:text-white"
          onClick={() => { setOtpSent(false); setOtp(''); }}>
          Use different email
        </button>
      )}
    </div>
  );
};

// Animated Character Component
const AnimatedCharacter = () => {
  const [animationState, setAnimationState] = useState('idle');
  const [thought, setThought] = useState('');
  const [taskProgress, setTaskProgress] = useState(0);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const thoughts = [
    "📝 Creating new task...",
    "✅ Task completed!",
    "⚡ Real-time update!",
    "👥 @mention received",
    "📊 Analytics ready",
    "🔔 New notification",
    "💬 Comment added",
    "🚀 Progress: 75%",
    "🎯 Deadline tomorrow",
    "🤝 Team collaboration"
  ];

  // Cycle through thoughts
  useEffect(() => {
    const thoughtInterval = setInterval(() => {
      setThought(thoughts[Math.floor(Math.random() * thoughts.length)]);
      setAnimationState('thinking');
      setTimeout(() => setAnimationState('idle'), 2000);
    }, 5000);
    return () => clearInterval(thoughtInterval);
  }, []);

  // Simulate task progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setTaskProgress(prev => {
        if (prev >= 100) {
          setShowTaskModal(true);
          setTimeout(() => setShowTaskModal(false), 2000);
          return 0;
        }
        return prev + 2;
      });
    }, 200);
    return () => clearInterval(progressInterval);
  }, []);

  // Random mouse movements
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 20 - 10;
      const y = (e.clientY / window.innerHeight) * 20 - 10;
      setMousePosition({ x, y });
      setEyePosition({ x: x * 0.5, y: y * 0.5 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Thought bubble */}
      {thought && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg animate-bounce">
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 rotate-45" />
          <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{thought}</p>
        </div>
      )}

      {/* Task progress modal */}
      {showTaskModal && (
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl px-4 py-2 shadow-2xl animate-pulse">
          <p className="text-sm font-bold text-white whitespace-nowrap">🎉 Task Complete! 🎉</p>
        </div>
      )}

      {/* Character SVG */}
      <div className="relative" style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}>
        <svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
          {/* Body */}
          <ellipse cx="140" cy="200" rx="50" ry="55" fill="url(#bodyGrad)" />
          
          {/* Head */}
          <circle cx="140" cy="120" r="55" fill="url(#skinGrad)" />
          
          {/* Hair */}
          <path d="M85 100 Q85 60 140 60 Q195 60 195 100 Q195 80 140 75 Q85 80 85 100Z" fill="#2D1B4E" />
          <path d="M85 100 Q90 70 140 65 Q190 70 195 100" fill="#3D2B5E" />
          
          {/* Eyes */}
          <g>
            {/* Left Eye */}
            <ellipse cx="120" cy="115" rx="8" ry="10" fill="white" />
            <circle cx={120 + eyePosition.x * 0.3} cy={115 + eyePosition.y * 0.3} r="4" fill="#1a1a2e" />
            <circle cx={121 + eyePosition.x * 0.3} cy={114 + eyePosition.y * 0.3} r="1.5" fill="white" />
            
            {/* Right Eye */}
            <ellipse cx="160" cy="115" rx="8" ry="10" fill="white" />
            <circle cx={160 + eyePosition.x * 0.3} cy={115 + eyePosition.y * 0.3} r="4" fill="#1a1a2e" />
            <circle cx={161 + eyePosition.x * 0.3} cy={114 + eyePosition.y * 0.3} r="1.5" fill="white" />
          </g>
          
          {/* Smile */}
          <path d="M125 140 Q140 155 155 140" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          
          {/* Blush */}
          <ellipse cx="108" cy="132" rx="8" ry="4" fill="#FFB6C1" opacity="0.5" />
          <ellipse cx="172" cy="132" rx="8" ry="4" fill="#FFB6C1" opacity="0.5" />
          
          {/* Glasses (optional - tech look) */}
          <ellipse cx="120" cy="115" rx="14" ry="12" stroke="#6366f1" strokeWidth="2" fill="none" />
          <ellipse cx="160" cy="115" rx="14" ry="12" stroke="#6366f1" strokeWidth="2" fill="none" />
          <line x1="134" y1="115" x2="146" y2="115" stroke="#6366f1" strokeWidth="2" />
          
          {/* Arms with animation */}
          <g style={{ animation: `${animationState === 'thinking' ? 'wave 1s ease-in-out infinite' : 'idle 3s ease-in-out infinite'}` }}>
            {/* Left Arm */}
            <path d="M90 175 Q65 165 55 180 Q50 188 55 195" stroke="url(#skinGrad)" strokeWidth="12" fill="none" strokeLinecap="round" />
            {/* Right Arm */}
            <path d="M190 175 Q215 165 225 180 Q230 188 225 195" stroke="url(#skinGrad)" strokeWidth="12" fill="none" strokeLinecap="round" />
          </g>
          
          {/* Laptop/Tablet device */}
          <g transform="translate(195, 160) rotate(-15)">
            <rect x="0" y="0" width="50" height="35" rx="3" fill="#2D1B4E" stroke="#6366f1" strokeWidth="1.5" />
            <rect x="3" y="3" width="44" height="22" rx="1" fill="#1a1a2e" />
            {/* Screen content - task list */}
            <rect x="5" y="5" width="40" height="3" rx="1" fill="#6366f1" opacity="0.8" />
            <rect x="5" y="10" width="30" height="2" rx="1" fill="#818cf8" opacity="0.6" />
            <rect x="5" y="14" width="35" height="2" rx="1" fill="#818cf8" opacity="0.6" />
            <rect x="5" y="18" width="25" height="2" rx="1" fill="#a5b4fc" opacity="0.4" />
          </g>
          
          {/* Floating task cards around character */}
          <g style={{ animation: 'floatCard 4s ease-in-out infinite' }}>
            <rect x="30" y="100" width="40" height="25" rx="4" fill="#6366f1" opacity="0.9" className="shadow-lg" />
            <text x="36" y="115" fill="white" fontSize="6" fontFamily="monospace">Task #1</text>
          </g>
          
          <g style={{ animation: 'floatCard 5s ease-in-out infinite reverse' }}>
            <rect x="210" y="90" width="40" height="25" rx="4" fill="#8b5cf6" opacity="0.9" />
            <text x="216" y="105" fill="white" fontSize="6" fontFamily="monospace">Task #2</text>
          </g>

          {/* Progress bar above character */}
          <rect x="90" y="40" width="100" height="6" rx="3" fill="#e2e8f0" opacity="0.3" />
          <rect x="90" y="40" width={taskProgress} height="6" rx="3" fill="url(#progressGrad)" className="transition-all duration-200" />
          <text x="195" y="46" fill="#a5b4fc" fontSize="8" fontFamily="monospace">{taskProgress}%</text>

          {/* Gradients */}
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFE0BD" />
              <stop offset="100%" stopColor="#FFD4A8" />
            </linearGradient>
            <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>

        {/* CSS Animations */}
        <style>{`
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-15deg); }
            75% { transform: rotate(10deg); }
          }
          @keyframes idle {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(3deg); }
          }
          @keyframes floatCard {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
          }
        `}</style>
      </div>

      {/* Character status text */}
      <div className="mt-4 text-center">
        <p className="text-xs text-indigo-300/80 flex items-center gap-2 justify-center">
          <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
          {animationState === 'thinking' ? '🤔 Thinking...' : '💼 Ready to work'}
        </p>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAEmail, setTwoFAEmail] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.requiresTwoFactor) {
        setRequires2FA(true);
        setTwoFAEmail(result.email);
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account) => {
    setDemoLoading(account.label);
    setError('');
    try {
      const result = await login(account.email, account.password);
      if (result?.requiresTwoFactor) {
        setRequires2FA(true);
        setTwoFAEmail(result.email);
      } else {
        toast.success(`Logged in as ${account.label}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || `Demo login failed`);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900">
      
      {/* Animated background elements */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.6; }
          33% { transform: translate(80px, -60px) scale(1.2); opacity: 0.8; }
          66% { transform: translate(-40px, 40px) scale(0.9); opacity: 0.5; }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.5; }
          25% { transform: translate(-70px, 50px) scale(1.3); opacity: 0.7; }
          75% { transform: translate(50px, -70px) scale(0.8); opacity: 0.4; }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        .orb-1 { animation: float1 18s ease-in-out infinite; }
        .orb-2 { animation: float2 22s ease-in-out infinite; }
        .ring-pulse { animation: pulseRing 2s ease-out infinite; }
      `}</style>

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb-1 absolute top-20 left-10 w-[500px] h-[500px] rounded-full bg-indigo-600/30 blur-[100px]" />
        <div className="orb-2 absolute bottom-20 right-10 w-[600px] h-[600px] rounded-full bg-purple-600/25 blur-[120px]" />
        <div className="orb-1 absolute top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[90px]" />
        
        {/* Decorative rings */}
        <div className="absolute top-1/3 right-20 w-32 h-32">
          <div className="absolute inset-0 rounded-full border border-indigo-400/20 ring-pulse" />
          <div className="absolute inset-2 rounded-full border border-indigo-400/15 ring-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      {/* ── Left Panel with Animated Character ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative z-10">
        <div className="max-w-md w-full space-y-8">
          
          {/* Logo and title */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-indigo-500/40 blur-xl animate-pulse" />
                <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
                  <CheckSquare className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                TaskFlow
              </h1>
              <p className="text-indigo-200/80 text-base mt-2">
                Meet your AI Task Assistant
              </p>
            </div>
          </div>

          {/* Animated Character */}
          <AnimatedCharacter />

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-indigo-300 border border-white/20">
              ⚡ Real-time
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-indigo-300 border border-white/20">
              🔐 Secure
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-indigo-300 border border-white/20">
              📊 Analytics
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-indigo-300 border border-white/20">
              👥 Team
            </span>
          </div>
          
          <p className="text-center text-xs text-indigo-300/60">
            Character follows your mouse movement 👆
          </p>
        </div>
      </div>

      {/* ── Right Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-sm">
          
          {/* Form card with glass effect */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 space-y-5">
            
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 justify-center mb-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-xl text-white">TaskFlow</span>
            </div>

            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="text-indigo-200/80 text-sm">Sign in to your account</p>
            </div>

            {/* Demo Accounts */}
            <div className="bg-indigo-500/10 backdrop-blur-sm rounded-xl border border-indigo-400/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-300" />
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                  Demo — Click to login instantly
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(account => (
                  <button
                    key={account.label}
                    onClick={() => handleDemoLogin(account)}
                    disabled={demoLoading !== null}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${account.color}`}
                  >
                    <div className={`h-2 w-2 rounded-full shrink-0 ${account.dot}`} />
                    {demoLoading === account.label ? (
                      <span>Logging in...</span>
                    ) : (
                      <div className="text-left">
                        <p className="font-semibold">{account.label}</p>
                        <p className="opacity-60 truncate text-[10px]">{account.email}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-indigo-300/80 text-center">
                Password: <span className="font-mono font-bold">Test@1234</span>
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/20" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/10 backdrop-blur-sm px-2 text-indigo-300">Or sign in manually</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 2FA */}
            {requires2FA ? (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto">
                    <Shield className="h-6 w-6 text-indigo-300" />
                  </div>
                  <h3 className="font-semibold text-white">Two-Factor Authentication</h3>
                  <p className="text-sm text-indigo-300/80">Enter the 6-digit code from your authenticator app</p>
                </div>
                <Input placeholder="000000" value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono bg-white/5 border-white/20 text-white" maxLength={6} />
                <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700" disabled={twoFACode.length !== 6 || twoFALoading}
                  onClick={async () => {
                    setTwoFALoading(true);
                    try {
                      const { data } = await API.post('/auth/verify-2fa', { email: twoFAEmail, otp: twoFACode });
                      localStorage.setItem('token', data.token);
                      await loginWithToken(data.token);
                      toast.success('Welcome back!');
                      navigate('/dashboard');
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Invalid code');
                    } finally {
                      setTwoFALoading(false);
                    }
                  }}>
                  {twoFALoading ? 'Verifying...' : 'Verify'}
                </Button>
                <button type="button" className="w-full text-xs text-indigo-300 hover:text-white"
                  onClick={() => { setRequires2FA(false); setTwoFACode(''); }}>
                  Back to login
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300" />
                      <Input id="email" type="email" placeholder="you@company.com" value={email}
                        onChange={e => setEmail(e.target.value)} 
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-indigo-300/50" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Link to="/forgot-password" className="text-xs text-indigo-300 hover:text-white">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300" />
                      <Input id="password" type="password" placeholder="••••••••" value={password}
                        onChange={e => setPassword(e.target.value)} 
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-indigo-300/50" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/20" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/10 backdrop-blur-sm px-2 text-indigo-300">Or continue with</span>
                  </div>
                </div>

                <Button type="button" variant="outline" className="w-full gap-2 border-white/20 text-white hover:bg-white/10"
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_URL?.replace('/api', '')}/api/auth/google`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>

                <OTPLogin />
              </>
            )}

            <p className="text-center text-sm text-indigo-300">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-300 font-medium hover:text-white underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;