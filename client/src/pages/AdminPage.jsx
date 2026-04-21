import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllUsers,
  updateUserRole,
  deactivateUser,
  activateUser,
  sendInvite
} from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Shield, UserX, UserCheck, Mail, CheckCircle, XCircle, Search
} from 'lucide-react';
import API from '@/api/axios';
import { cn } from '@/lib/utils';

const AdminPage = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [inviting, setInviting] = useState(false);

  // Search + Filter State
  const [search, setSearch] = useState('');
  const [showDeactivatedOnly, setShowDeactivatedOnly] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPending();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await getAllUsers();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const { data } = await API.get('/auth/pending-registrations');
      setPendingRegistrations(data);
    } catch (err) {
      console.error('fetchPending error:', err.response?.data?.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.patch(`/auth/approve-registration/${id}`);
      setPendingRegistrations(prev => prev.filter(r => r._id !== id));
      fetchUsers();
      toast.success('User approved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await API.patch(`/auth/reject-registration/${id}`);
      setPendingRegistrations(prev => prev.filter(r => r._id !== id));
      toast.success('Registration rejected');
    } catch {
      toast.error('Failed to reject');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      const { data } = await updateUserRole(id, role);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: data.role } : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleToggleActive = async (id, isCurrentlyActive) => {
    try {
      if (isCurrentlyActive) {
        await deactivateUser(id);
        setUsers(prev => prev.map(u =>
          u._id === id ? { ...u, isActive: false, accountStatus: 'INACTIVE' } : u
        ));
        toast.success('User deactivated');
      } else {
        await activateUser(id);
        setUsers(prev => prev.map(u =>
          u._id === id ? { ...u, isActive: true, accountStatus: 'ACTIVE' } : u
        ));
        toast.success('User activated');
      }
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return toast.error('Enter an email');
    setInviting(true);
    try {
      await sendInvite(inviteEmail, inviteRole);
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  if (!['admin', 'bod'].includes(user?.role)) {
    return <div className="text-center py-12 text-muted-foreground">Access denied</div>;
  }

  // ── Filter Logic ──────────────────────────────
  const filteredUsers = users.filter(u => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower);

    const isInactive = u.isActive === false || u.accountStatus === 'INACTIVE';
    const matchesToggle = showDeactivatedOnly ? isInactive : true;

    return matchesSearch && matchesToggle;
  });

  const deactivatedCount = users.filter(
    u => u.isActive === false || u.accountStatus === 'INACTIVE'
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage users, roles and approvals
        </p>
      </div>

      {/* Pending Approvals */}
      {pendingRegistrations.length > 0 && (
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b flex items-center gap-2">
            <h2 className="font-semibold">Pending Approvals</h2>
            <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5">
              {pendingRegistrations.length}
            </span>
          </div>
          <div className="divide-y">
            {pendingRegistrations.map(r => (
              <div key={r._id} className="flex items-center justify-between p-4 gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    Requested: <span className="font-medium">{r.requestedRole}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => handleApprove(r._id)}>
                    <CheckCircle className="h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1 h-8 text-xs" onClick={() => handleReject(r._id)}>
                    <XCircle className="h-3 w-3" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite */}
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4" /> Invite new member
        </h2>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="teamlead">Team Lead</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="bod">BOD</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={inviting}>
            {inviting ? 'Sending...' : 'Send Invite'}
          </Button>
        </form>
      </div>

      {/* Users Section */}
      <div className="bg-card rounded-lg border">

        {/* Table Header with Search + Toggle */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {showDeactivatedOnly ? 'Deactivated Users' : 'All Users'}
              <span className="text-muted-foreground font-normal text-sm">
                ({filteredUsers.length})
              </span>
            </h2>

            {/* Deactivated Toggle */}
            <div className="flex items-center gap-2">
              {deactivatedCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {deactivatedCount} deactivated
                </span>
              )}
              <button
                onClick={() => setShowDeactivatedOnly(!showDeactivatedOnly)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                  showDeactivatedOnly ? 'bg-destructive' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                    showDeactivatedOnly ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
              <span className="text-xs text-muted-foreground">
                {showDeactivatedOnly ? 'Deactivated only' : 'Show all'}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <UserX className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {showDeactivatedOnly
                ? 'No deactivated accounts found'
                : search
                  ? 'No users match your search'
                  : 'No users found'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map(u => {
              const isInactive = u.isActive === false || u.accountStatus === 'INACTIVE';

              return (
                <div
                  key={u._id}
                  className={cn(
                    'flex items-center justify-between p-4 gap-4 flex-wrap transition-colors',
                    isInactive && 'bg-destructive/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                      isInactive
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary/10 text-primary'
                    )}>
                      {u.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{u.name}</p>
                        {isInactive && (
                          <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {u._id !== user._id ? (
                      <>
                        {!isInactive && (
                          <Select
                            value={u.role}
                            onValueChange={(role) => handleRoleChange(u._id, role)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="teamlead">Team Lead</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="bod">BOD</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'h-8 text-xs gap-1',
                            isInactive
                              ? 'border-green-500 text-green-600 hover:bg-green-50'
                              : 'border-destructive/30 text-destructive hover:bg-destructive/10'
                          )}
                          onClick={() => handleToggleActive(u._id, !isInactive)}
                        >
                          {isInactive ? (
                            <><UserCheck className="h-3 w-3" /> Activate</>
                          ) : (
                            <><UserX className="h-3 w-3" /> Deactivate</>
                          )}
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        You
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;