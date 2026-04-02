import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/TaskContext';
import { getAllUsers } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CreateTaskPage = () => {
  const { user } = useAuth();
  const { addTask } = useTask();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await getAllUsers();
        setUsers(data.filter(u => u._id !== user._id)); // exclude self
      } catch {
        toast.error('Failed to load users');
      }
    };
    fetchUsers();
  }, []);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !assignedTo || !deadline) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await addTask({ title, description, assignedTo, priority, deadline });
      toast.success('Task created successfully!');
      navigate('/all-tasks');
    } catch {
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create Task</h1>
        <p className="text-muted-foreground text-sm mt-1">Assign a new task to a team member</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Task Title *</Label>
          <Input id="title" placeholder="Enter task title" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Describe the task in detail..." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Assign To *</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline *</Label>
          <Input id="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTaskPage;