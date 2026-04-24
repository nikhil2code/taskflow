import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckSquare, Mail, Lock, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import API from '@/api/axios';

// ── OTP Login Component ─────────────────────────────
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
    <div className="space-y-3 border rounded-lg p-4">
      <p className="text-xs text-muted-foreground font-medium">Login with OTP</p>

      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={otpSent}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSendOTP}
          disabled={loading || otpSent}
        >
          {loading ? '...' : 'Send OTP'}
        </Button>
      </div>

      {otpSent && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            maxLength={6}
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? '...' : 'Verify'}
          </Button>
        </div>
      )}

      {otpSent && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-primary"
          onClick={() => {
            setOtpSent(false);
            setOtp('');
          }}
        >
          Use different email
        </button>
      )}
    </div>
  );
};

// ── MAIN LOGIN PAGE ─────────────────────────────
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA STATES
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAEmail, setTwoFAEmail] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  // LOGIN HANDLER
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

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto">
            <CheckSquare className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground">TaskFlow</h1>
          <p className="text-primary-foreground/80 text-lg">
            Streamline your team's workflow with role-based task management.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">

          {/* TITLE */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to your account
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= 2FA OR LOGIN ================= */}
          {requires2FA ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <Input
                placeholder="000000"
                value={twoFACode}
                onChange={(e) =>
                  setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />

              <Button
                className="w-full"
                disabled={twoFACode.length !== 6 || twoFALoading}
                onClick={async () => {
                  setTwoFALoading(true);
                  try {
                    const { data } = await API.post('/auth/verify-2fa', {
                      email: twoFAEmail,
                      otp: twoFACode,
                    });

                    localStorage.setItem('token', data.token);
                    await login(data.token);

                    toast.success('Welcome back!');
                    navigate('/dashboard');
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Invalid code');
                  } finally {
                    setTwoFALoading(false);
                  }
                }}
              >
                {twoFALoading ? 'Verifying...' : 'Verify'}
              </Button>

              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-primary"
                onClick={() => {
                  setRequires2FA(false);
                  setTwoFACode('');
                }}
              >
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          {/* DIVIDER */}
          <div className="text-center text-xs text-muted-foreground">OR</div>

          {/* GOOGLE */}
          <Button onClick={handleGoogleLogin} variant="outline" className="w-full">
            Continue with Google
          </Button>

          {/* OTP LOGIN */}
          <OTPLogin />

          <p className="text-center text-sm text-muted-foreground">
            Don’t have an account?{' '}
            <Link to="/register" className="text-primary">Sign up</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;