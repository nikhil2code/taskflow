import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Lock, Mail, Shield, Monitor, Trash2, LogOut } from 'lucide-react';
import API from '@/api/axios';
import {
  setup2FA, verifyAndEnable2FA, disable2FA,
  getSessions, deleteSession, deleteAllSessions,
} from '@/services/twoFactorService';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // 2FA state
  const [qrCode, setQrCode] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFactorEnabled || false);
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [loading2FA, setLoading2FA] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await getSessions();
      setSessions(data);
    } catch {} finally {
      setLoadingSessions(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const { data } = await API.patch('/auth/profile', { name });
      setUser(data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords don't match");
    if (newPassword.length < 6) return toast.error("Min 6 characters");
    setLoadingPassword(true);
    try {
      await API.patch('/auth/change-password', {
        currentPassword: oldPassword,
        newPassword,
      });
      toast.success('Password changed!');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleSetup2FA = async () => {
    setLoading2FA(true);
    try {
      const { data } = await setup2FA();
      setQrCode(data.qrCode);
      setShowQR(true);
    } catch {
      toast.error('Failed to setup 2FA');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFACode.length !== 6) return toast.error('Enter 6-digit code');
    setLoading2FA(true);
    try {
      await verifyAndEnable2FA(twoFACode);
      setTwoFAEnabled(true);
      setShowQR(false);
      setTwoFACode('');
      toast.success('2FA enabled successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) return toast.error('Enter 6-digit code');
    setLoading2FA(true);
    try {
      await disable2FA(disableCode);
      setTwoFAEnabled(false);
      setShowDisable(false);
      setDisableCode('');
      toast.success('2FA disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      toast.success('Session removed');
    } catch {
      toast.error('Failed to remove session');
    }
  };

  const handleDeleteAllSessions = async () => {
    try {
      await deleteAllSessions();
      fetchSessions();
      toast.success('All other sessions removed');
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Avatar */}
      <div className="bg-card rounded-lg border p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
          {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-lg">{user?.name}</p>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            <Mail className="h-3 w-3" /> {user?.email}
          </p>
          <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
            <Shield className="h-3 w-3" />
            <span className="capitalize">{user?.role}</span>
          </p>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4" /> Personal info
        </h2>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <Button type="submit" disabled={loadingProfile}>
            {loadingProfile ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4" /> Change password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" placeholder="••••••••" value={oldPassword}
              onChange={e => setOldPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" placeholder="••••••••" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" placeholder="••••••••" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loadingPassword}>
            {loadingPassword ? 'Changing...' : 'Change password'}
          </Button>
        </form>
      </div>

      {/* 2FA Section */}
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" /> Two-Factor Authentication
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            twoFAEnabled
              ? 'bg-green-100 text-green-700'
              : 'bg-muted text-muted-foreground'
          }`}>
            {twoFAEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {!twoFAEnabled && !showQR && (
          <Button onClick={handleSetup2FA} disabled={loading2FA} variant="outline">
            {loading2FA ? 'Setting up...' : 'Enable 2FA'}
          </Button>
        )}

        {showQR && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app
              (Google Authenticator, Authy, etc.)
            </p>
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-48 h-48 border rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Enter the 6-digit code to confirm</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="000000"
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center font-mono tracking-widest"
                  maxLength={6}
                />
                <Button onClick={handleVerify2FA} disabled={loading2FA}>
                  {loading2FA ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => setShowQR(false)}
            >
              Cancel
            </button>
          </div>
        )}

        {twoFAEnabled && !showDisable && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDisable(true)}
          >
            Disable 2FA
          </Button>
        )}

        {showDisable && (
          <div className="space-y-2">
            <Label>Enter your authenticator code to disable 2FA</Label>
            <div className="flex gap-2">
              <Input
                placeholder="000000"
                value={disableCode}
                onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center font-mono tracking-widest"
                maxLength={6}
              />
              <Button variant="destructive" onClick={handleDisable2FA} disabled={loading2FA}>
                {loading2FA ? '...' : 'Disable'}
              </Button>
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => setShowDisable(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Active Sessions
          </h2>
          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleDeleteAllSessions}
            >
              <LogOut className="h-3 w-3" /> Remove all others
            </Button>
          )}
        </div>

        {loadingSessions ? (
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s, i) => (
              <div
                key={s._id}
                className="flex items-center justify-between bg-muted rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">
                      {s.deviceInfo?.substring(0, 60) || 'Unknown device'}
                      {i === sessions.length - 1 && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.ipAddress} ·{' '}
                      {new Date(s.lastActive).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                {i !== sessions.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleDeleteSession(s._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;