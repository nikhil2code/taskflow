import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/TaskContext';
import { getAllUsers } from '@/services/adminService';
import { getAllTasks } from '@/services/taskService';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const PRESET_TAGS = ['frontend', 'backend', 'design', 'bug', 'urgent', 'review', 'testing'];

const CreateTaskPage = () => {
  const { user } = useAuth();
  const { addTask } = useTask();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [dependsOn, setDependsOn] = useState([]);
  const [users, setUsers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, tasksRes] = await Promise.all([
          getAllUsers(),
          getAllTasks(),
        ]);
        setUsers(usersRes.data.filter(u => u._id !== user._id));
        setAllTasks(tasksRes.data);
      } catch {
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, []);

  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (clean && !tags.includes(clean)) setTags(prev => [...prev, clean]);
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag));

  const toggleDependency = (id) => {
    setDependsOn(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !assignedTo || !deadline) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      await addTask({ title, description, assignedTo, priority, deadline, tags, dependsOn });
      toast.success('Task created successfully!');
      navigate('/all-tasks');
    } catch {
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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
          <Textarea id="description" placeholder="Describe the task..." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Assign To *</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u._id} value={u._id}>{u.name} ({u.role})</SelectItem>
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

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <Input
            placeholder="Type a tag and press Enter..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {PRESET_TAGS.filter(t => !tags.includes(t)).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="text-xs text-muted-foreground hover:text-primary border rounded-full px-2 py-0.5 hover:border-primary transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Dependencies */}
        {allTasks.length > 0 && (
          <div className="space-y-2">
            <Label>Depends on (blocked by)</Label>
            <div className="max-h-36 overflow-y-auto border rounded-lg p-3 space-y-1">
              {allTasks.map(t => (
                <label key={t._id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={dependsOn.includes(t._id)}
                    onChange={() => toggleDependency(t._id)}
                    className="rounded"
                  />
                  <span>{t.title}</span>
                  <span className="text-xs text-muted-foreground capitalize">({t.status})</span>
                </label>
              ))}
            </div>
            {dependsOn.length > 0 && (
              <p className="text-xs text-muted-foreground">
                This task is blocked by {dependsOn.length} task{dependsOn.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

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