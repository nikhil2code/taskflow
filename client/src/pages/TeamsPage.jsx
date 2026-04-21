import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTeams, createTeam, deleteTeam } from '@/services/teamService';
import { getAllUsers } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, Plus, Trash2, X } from 'lucide-react';

const TeamsPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  const isManager = user?.role === 'manager';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, usersRes] = await Promise.all([
        getTeams(),
        getAllUsers(),
      ]);
      setTeams(teamsRes.data);
      setAllUsers(usersRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) return toast.error('Team name is required');
    setCreating(true);
    try {
      const { data } = await createTeam({ name, description, memberIds: selectedMembers });
      setTeams(prev => [...prev, data]);
      setShowForm(false);
      setName(''); setDescription(''); setSelectedMembers([]);
      toast.success('Team created!');
    } catch {
      toast.error('Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTeam(id);
      setTeams(prev => prev.filter(t => t._id !== id));
      toast.success('Team deleted');
    } catch {
      toast.error('Failed to delete team');
    }
  };

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your organisation's teams</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="h-4 w-4" /> New Team
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Create new team</h2>
            <button onClick={() => setShowForm(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Team Name *</Label>
              <Input placeholder="e.g. Frontend Team" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="What does this team do?" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Add Members</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {allUsers.filter(u => u._id !== user._id).map(u => (
                  <label key={u._id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(u._id)}
                      onChange={() => toggleMember(u._id)}
                      className="rounded"
                    />
                    <span>{u.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">({u.role})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Team'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Teams List */}
      {loading ? (
        <p className="text-muted-foreground">Loading teams...</p>
      ) : teams.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No teams yet. {isManager ? 'Create your first team!' : 'You are not in any team yet.'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <div key={team._id} className="bg-card rounded-lg border p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{team.name}</h3>
                  {team.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{team.description}</p>
                  )}
                </div>
                {isManager && (
                  <button onClick={() => handleDelete(team._id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1">
                  {team.members?.slice(0, 5).map(m => (
                    <span key={m._id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {m.name?.split(' ')[0]}
                    </span>
                  ))}
                  {team.members?.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{team.members.length - 5} more</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsPage;